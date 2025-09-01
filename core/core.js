// core.js — GameCore con modo recuperación avanzado (compatibilidad con StorageAPI.toTemplatePattern)
(function(global){
  const GameCore = {
    three: { scene:null, camera:null, renderer:null, raycaster:null },
    state: {
      paused:false,
      modeName:null,
      modeImpl:null,
      pool:[],
      style: 'progresivo',
      answeredCount:0,
      answeredSet: new Set(),
      currentQuestion:null,
      availableQuestions:[],
      usedIndexSet: new Set(),
      recoveryOn: false,
      pendingIndex: null
    }
  };

  // init three
  function initThree(){
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(80, innerWidth/innerHeight, 0.1, 10000);
    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(innerWidth, innerHeight);
    const container = document.getElementById('container');
    if(container) container.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0x666666));
    const pt = new THREE.PointLight(0xffffff,1); pt.position.set(200,200,400); scene.add(pt);
    const raycaster = new THREE.Raycaster();
    GameCore.three = { scene, camera, renderer, raycaster };

    window.addEventListener('resize', ()=> {
      camera.aspect = innerWidth/innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });

    const dom = renderer.domElement;
    function normFromEvent(ev, rect){
      return { x: ((ev.clientX-rect.left)/rect.width)*2 - 1, y: -((ev.clientY-rect.top)/rect.height)*2 + 1 };
    }
    dom?.addEventListener('click', (ev)=>{
      if(GameCore.state.modeImpl?.pick){
        const rect = dom.getBoundingClientRect();
        const n = normFromEvent(ev, rect);
        GameCore.state.modeImpl.pick(n.x, n.y);
      }
    });
    dom?.addEventListener('touchstart', (e)=>{
      if(GameCore.state.modeImpl?.pick && e.touches.length===1){
        const t=e.touches[0], rect = dom.getBoundingClientRect();
        const nx = ((t.clientX-rect.left)/rect.width)*2 - 1;
        const ny = -((t.clientY-rect.top)/rect.height)*2 + 1;
        GameCore.state.modeImpl.pick(nx, ny);
      }
    }, {passive:true});
  }

  // prepara pool (si recoveryOn => filtra por errores usando StorageAPI.toTemplatePattern)
  function preparePool(){
    const mistakes = StorageAPI.getMistakes() || [];
    const all = QuestionBank.buildPoolFromVerbsPronouns();
    if(GameCore.state.recoveryOn && mistakes.length){
      const filtered = all.filter(q => mistakes.some(m => m.pattern === StorageAPI.toTemplatePattern(q.pattern)));
      GameCore.state.pool = filtered.length ? filtered : [];
    } else {
      GameCore.state.pool = all;
    }
    refreshRecoveryButton();
  }

  // Mostrar/ocultar botón recovery y limpiar errores según condiciones
  function refreshRecoveryButton(){
    const btn = document.getElementById('btnRecovMode');
    const btnClear = document.getElementById('btnClearMistakes');
    const mistakes = StorageAPI.getMistakes() || [];
    if(btn){
      if(mistakes.length >= 10 && !GameCore.state.recoveryOn){
        btn.style.display = '';
        btn.disabled = false;
      } else {
        btn.style.display = 'none';
      }
    }
    if(btnClear) btnClear.style.display = mistakes.length ? '' : 'none';

    // actualizar log si existe
    const logArea = document.getElementById('mistakeLog');
    if(logArea) logArea.value = JSON.stringify(mistakes, null, 2);
    const cntEl = document.getElementById('mistakeCount');
    if(cntEl) cntEl.textContent = mistakes.length;
  }

  // activar/desactivar recuperación
  function enableRecovery(){
    if(GameCore.state.recoveryOn) return;
    GameCore.state.recoveryOn = true;
    preparePool();
    beginSessionProgressive();
    const btn = document.getElementById('btnRecovMode');
    if(btn) { btn.textContent = 'Recuperación: ON'; btn.disabled = true; }
  }
  function disableRecovery(){
    if(!GameCore.state.recoveryOn) return;
    GameCore.state.recoveryOn = false;
    const btn = document.getElementById('btnRecovMode');
    if(btn) { btn.textContent = 'Modo recuperación'; btn.style.display='none'; }
    preparePool();
    if(GameCore.state.modeImpl?.style === 'coleccion') beginSessionCollection();
    else beginSessionProgressive();
  }

  // --- Sesión progresiva
  function beginSessionProgressive(){
    GameCore.state.style = 'progresivo';
    GameCore.state.availableQuestions = GameCore.state.pool.slice();
    shuffle(GameCore.state.availableQuestions);
    GameCore.state.usedIndexSet.clear();
    GameCore.state.answeredCount = 0;
    GameCore.state.pendingIndex = null;
    nextQuestionProgressive();
  }

  function nextQuestionProgressive(){
    const aq = GameCore.state.availableQuestions;

    // Si no hay preguntas en modo recuperación, mostrar mensaje
    if(GameCore.state.recoveryOn && !aq.length){
      UI.setQuestion('✅ No tienes errores guardados. Cambia a modo normal.');
      if(GameCore.state.modeImpl?.presentOptionsForCurrent){
        GameCore.state.modeImpl.presentOptionsForCurrent([], '');
      }
      return;
    }

    if(!aq.length){
      if(GameCore.state.recoveryOn){
        UI.showFinal(GameCore.state.answeredCount, 0, ()=>{ disableRecovery(); });
      } else {
        UI.showFinal(GameCore.state.answeredCount, 0, ()=>GameCore.restart());
      }
      return;
    }

    let nextIdx = null;
    for(let i=0;i<aq.length;i++) if(!GameCore.state.usedIndexSet.has(i)){ nextIdx=i; break; }
    if(nextIdx === null){
      if(GameCore.state.recoveryOn){
        UI.showFinal(GameCore.state.answeredCount, aq.length, ()=>{ disableRecovery(); });
      } else {
        UI.showFinal(GameCore.state.answeredCount, aq.length, ()=>GameCore.restart());
      }
      return;
    }

    GameCore.state.pendingIndex = nextIdx;
    const q = aq[nextIdx];
    GameCore.state.currentQuestion = q;

    // Mostrar pregunta y estado
    UI.setQuestion(q.question);
    UI.setProgress(GameCore.state.answeredCount, aq.length);

    // Pregunta en rojo si es un error previo
    const isMistake = StorageAPI.getMistakes().some(m => m.pattern === StorageAPI.toTemplatePattern(q.pattern));
    const el = document.getElementById('preguntaMain');
    if(el) el.style.color = isMistake ? 'red' : 'black';

    if(GameCore.state.modeImpl?.presentOptionsForCurrent){
      GameCore.state.modeImpl.presentOptionsForCurrent(q.options, q.translation);
    }
  }

  // respuesta en modo progresivo
  function answerProgressive(correct){
    const q = GameCore.state.currentQuestion;
    if(!q) return;
    const pIdx = GameCore.state.pendingIndex;

    if(GameCore.state.recoveryOn){
      if(correct){
        StorageAPI.clearIfCorrect(q);
        if(typeof pIdx === 'number') GameCore.state.usedIndexSet.add(pIdx);
        GameCore.state.answeredCount++;
        UI.showFeedback('Correcto ✅');
        UI.flashStatus(true);
      } else {
        StorageAPI.markWrong(q);
        if(typeof pIdx === 'number') GameCore.state.usedIndexSet.add(pIdx);
        UI.showFeedback('Incorrecto ❌');
        UI.flashStatus(false);
      }
      GameCore.state.pendingIndex = null;
      refreshRecoveryButton();
      setTimeout(nextQuestionProgressive, 600);
      return;
    }

    if(correct){
      UI.showFeedback('Correcto ✅');
      GameCore.state.answeredCount++;
      UI.flashStatus(true);
      if(typeof pIdx === 'number') GameCore.state.usedIndexSet.add(pIdx);
      GameCore.state.pendingIndex = null;
      setTimeout(nextQuestionProgressive, 600);
    } else {
      StorageAPI.markWrong(q);
      UI.showFeedback('Incorrecto ❌');
      UI.flashStatus(false);
      if(GameCore.state.modeImpl?.presentOptionsForCurrent){
        const opts = q.options.slice(); shuffle(opts);
        GameCore.state.modeImpl.presentOptionsForCurrent(opts, q.translation);
      }
      refreshRecoveryButton();
    }
  }

  // --- Sesión colección
  function beginSessionCollection(){
    GameCore.state.style = 'coleccion';
    GameCore.state.availableQuestions = GameCore.state.pool.slice();
    GameCore.state.answeredSet.clear();
    UI.setQuestion('—');
    UI.setProgress(0, GameCore.state.availableQuestions.length);
    GameCore.state.modeImpl?.beginRound?.();
  }

  function onCorrectCollection(targetPattern){
    if(GameCore.state.recoveryOn){
      const q = GameCore.state.availableQuestions.find(q=>q.pattern === targetPattern);
      if(q) StorageAPI.clearIfCorrect(q);
    }
    const idx = GameCore.state.availableQuestions.findIndex(q=>q.pattern===targetPattern);
    if(idx>=0) GameCore.state.answeredSet.add(idx);
    UI.flashStatus(true);
    UI.setProgress(GameCore.state.answeredSet.size, GameCore.state.availableQuestions.length);
    refreshRecoveryButton();
    if(GameCore.state.answeredSet.size === GameCore.state.availableQuestions.length){
      UI.showFinal(GameCore.state.answeredSet.size, GameCore.state.availableQuestions.length, ()=> {
        if(GameCore.state.recoveryOn) disableRecovery();
        else GameCore.restart();
      });
    }
  }

  function onWrongCollection(targetPattern){
    const q = GameCore.state.availableQuestions.find(q=>q.pattern === targetPattern);
    if(q) StorageAPI.markWrong(q);
    UI.flashStatus(false);
    refreshRecoveryButton();
  }

  // util shuffle
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } }

  // loop
  let last = performance.now();
  function animate(now=performance.now()){
    requestAnimationFrame(animate);
    if(GameCore.state.paused){ last = now; return; }
    const dt = (now - last)/1000; last = now;
    GameCore.state.modeImpl?.update?.(dt);
    if(GameCore.three.renderer && GameCore.three.scene && GameCore.three.camera){
      GameCore.three.renderer.render(GameCore.three.scene, GameCore.three.camera);
    }
  }

  // API pública
  GameCore.start = function(modeName){
    if(!GameCore.three.renderer) initThree();
    preparePool();
    GameCore.state.modeName = modeName;
    GameCore.state.modeImpl  = (global.GameModes && global.GameModes[modeName]) || null;
    if(!GameCore.state.modeImpl) throw new Error(`Modo no encontrado: ${modeName}`);
    GameCore.state.modeImpl?.init?.(GameCore.three);

    // Botón modo recuperación
    let btn = document.getElementById('btnRecovMode');
    if(!btn){
      const wrap = document.getElementById('controls') || document.getElementById('uiTop') || document.body;
      btn = document.createElement('button'); btn.id='btnRecovMode'; btn.textContent='Modo recuperación';
      btn.style.display='none'; btn.onclick = ()=> enableRecovery();
      wrap.appendChild(btn);
    }

    // Botón limpiar errores
    let btnClear = document.getElementById('btnClearMistakes');
    if(!btnClear){
      const wrap = document.getElementById('controls') || document.getElementById('uiTop') || document.body;
      btnClear = document.createElement('button');
      btnClear.id = 'btnClearMistakes';
      btnClear.textContent = 'Limpiar errores';
      btnClear.style.display = 'none';
      btnClear.onclick = () => {
        if(confirm('¿Borrar todos los errores guardados?')){
          StorageAPI.saveMistakes([]);
          refreshRecoveryButton();
        }
      };
      wrap.appendChild(btnClear);
    }

    // Área de log de errores
    let logArea = document.getElementById('mistakeLog');
    if(!logArea){
      logArea = document.createElement('textarea');
      logArea.id = 'mistakeLog';
      logArea.readOnly = true;
      logArea.style.width = '100%';
      logArea.style.height = '100px';
      const wrap = document.getElementById('uiBottom') || document.body;
      wrap.appendChild(logArea);
    }

    refreshRecoveryButton();

    if(GameCore.state.modeImpl.style === 'coleccion') beginSessionCollection();
    else beginSessionProgressive();

    if(!GameCore._loopStarted){ GameCore._loopStarted = true; requestAnimationFrame(animate); }
  };

  GameCore.restart = function(){
    GameCore.state.modeImpl?.destroy?.();
    GameCore.state.recoveryOn = false;
    preparePool();
    GameCore.state.modeImpl?.init?.(GameCore.three);
    if(GameCore.state.modeImpl.style === 'coleccion') beginSessionCollection();
    else beginSessionProgressive();
  };

  GameCore.stop = function(){
    GameCore.state.modeImpl?.destroy?.();
    GameCore.state.modeImpl = null;
  };

  GameCore.togglePause = function(){
    GameCore.state.paused = !GameCore.state.paused;
    const btn = document.getElementById('btnPause');
    if(btn) btn.textContent = GameCore.state.paused ? 'Continuar' : 'Pausa';
  };

  GameCore._answerProgressive = answerProgressive;
  GameCore._onCorrectCollection = onCorrectCollection;
  GameCore._onWrongCollection   = onWrongCollection;

  global.GameCore = GameCore;
})(window);
