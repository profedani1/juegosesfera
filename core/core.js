// core.js — GameCore con botón de recuperación condicional (compatibilidad con StorageAPI.toTemplatePattern)
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
      // usar la normalización de StorageAPI para comparar patrones plantilla
      const filtered = all.filter(q => mistakes.some(m => m.pattern === StorageAPI.toTemplatePattern(q.pattern)));
      GameCore.state.pool = filtered.length ? filtered : all;
    } else {
      GameCore.state.pool = all;
    }
    refreshRecoveryButton();
  }

  // Mostrar/ocultar botón recovery según errores >= 10
  function refreshRecoveryButton(){
    const btn = document.getElementById('btnRecovMode');
    const mistakes = StorageAPI.getMistakes() || [];
    if(!btn) return;
    if(mistakes.length >= 10 && !GameCore.state.recoveryOn){
      btn.style.display = '';
      btn.disabled = false;
    } else {
      btn.style.display = 'none';
    }
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

    UI.setQuestion(q.question);
    UI.setProgress(GameCore.state.answeredCount, aq.length);
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
      // RECUPERACIÓN: si acierta -> quitar error y marcar usado; si falla -> marcar error y avanzar
      if(correct){
        // usar la normalización de StorageAPI (q.pattern es plantilla sin escapar)
        StorageAPI.clearIfCorrect(q);
        if(typeof pIdx === 'number') GameCore.state.usedIndexSet.add(pIdx);
        GameCore.state.answeredCount++;
        UI.showFeedback('Correcto ✅');
        UI.flashStatus(true);
      } else {
        StorageAPI.markWrong(q);
        if(typeof pIdx === 'number') GameCore.state.usedIndexSet.add(pIdx); // no se repite en recovery
        UI.showFeedback('Incorrecto ❌');
        UI.flashStatus(false);
      }
      GameCore.state.pendingIndex = null;
      refreshRecoveryButton();
      setTimeout(nextQuestionProgressive, 600);
      return;
    }

    // MODO NORMAL: si acierta -> avanzar; si falla -> marcar error pero repetir pregunta hasta acertar
    if(correct){
      // **NO** quitar error aquí (persisten para recuperación)
      UI.showFeedback('Correcto ✅');
      GameCore.state.answeredCount++;
      UI.flashStatus(true);
      if(typeof pIdx === 'number') GameCore.state.usedIndexSet.add(pIdx);
      GameCore.state.pendingIndex = null;
      setTimeout(nextQuestionProgressive, 600);
    } else {
      StorageAPI.markWrong(q); // marca usando la plantilla normalizada
      UI.showFeedback('Incorrecto ❌');
      UI.flashStatus(false);
      // re-presentar pero no borrar el error
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
    // Solo eliminar error en colección si estamos en recuperación
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

    // conectar botón de recuperación (crea si no existe)
    let btn = document.getElementById('btnRecovMode');
    if(!btn){
      const wrap = document.getElementById('controls') || document.getElementById('uiTop') || document.body;
      btn = document.createElement('button'); btn.id='btnRecovMode'; btn.textContent='Modo recuperación';
      btn.style.display='none'; btn.onclick = ()=> enableRecovery();
      wrap.appendChild(btn);
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
