// Núcleo del motor: escena, cámara, renderer, input y ciclo principal.
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
      recoveryOn: false,    // indica si estamos en modo recuperación activo
      pendingIndex: null    // índice temporal mientras esperamos acierto en recuperación
    },
    // flag interno para saber si la recuperación fue iniciada temporalmente por el botón
    _temporaryRecovery: false
  };

  // --- Inicialización Three.js
  function initThree(){
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(80, innerWidth/innerHeight, 0.1, 10000);
    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(innerWidth, innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);
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
      return {
        x: ((ev.clientX-rect.left)/rect.width)*2 - 1,
        y: -((ev.clientY-rect.top)/rect.height)*2 + 1
      };
    }

    dom.addEventListener('click', (ev)=>{
      if(GameCore.state.modeImpl?.pick){
        const rect = dom.getBoundingClientRect();
        const n = normFromEvent(ev, rect);
        GameCore.state.modeImpl.pick(n.x, n.y);
      }
    });

    dom.addEventListener('touchstart', (e)=>{
      if(GameCore.state.modeImpl?.pick && e.touches.length===1){
        const t=e.touches[0];
        const rect = dom.getBoundingClientRect();
        const nx = ((t.clientX-rect.left)/rect.width)*2 - 1;
        const ny = -((t.clientY-rect.top)/rect.height)*2 + 1;
        GameCore.state.modeImpl.pick(nx, ny);
      }
    }, {passive:true});
  }

  // --- UI: botón de recuperación temporal (aparece solo si hay >= 10 errores)
  function updateRecoveryButtonVisibility(){
    try {
      const mistakes = StorageAPI.getMistakes();
      const count = Array.isArray(mistakes) ? mistakes.length : 0;
      let btn = document.getElementById('btnTempRecov');
      if(count >= 10 && !GameCore._temporaryRecovery){
        // crear botón si no existe
        if(!btn){
          btn = document.createElement('button');
          btn.id = 'btnTempRecov';
          btn.textContent = 'Iniciar recuperación';
          btn.style.marginLeft = '8px';
          btn.onclick = startTemporaryRecovery;
          // intentar añadir cerca de controles si existe
          const container = document.getElementById('controls') || document.getElementById('uiControls') || document.getElementById('menu') || document.body;
          container.appendChild(btn);
        } else {
          btn.style.display = '';
          btn.disabled = false;
        }
      } else {
        // ocultar botón cuando no corresponde
        if(btn && !GameCore._temporaryRecovery) btn.remove();
      }
    } catch(e){}
  }

  // arrancar sesión de recuperación temporal (botón)
  function startTemporaryRecovery(){
    // no iniciar si ya estamos en recuperación
    if(GameCore._temporaryRecovery) return;
    GameCore._temporaryRecovery = true;
    GameCore.state.recoveryOn = true;
    // cambiar texto del botón si existe
    const btn = document.getElementById('btnTempRecov');
    if(btn){ btn.textContent = 'Recuperación (activa)'; btn.disabled = true; }

    // preparar pool y comenzar la sesión correspondiente
    preparePool();
    if(GameCore.state.modeImpl?.style === 'coleccion') beginSessionCollection();
    else beginSessionProgressive();
  }

  // terminar recuperación temporal: desactivar flags y reiniciar modo normal
  function endTemporaryRecoveryAndRestart(){
    GameCore._temporaryRecovery = false;
    GameCore.state.recoveryOn = false;
    // remover botón si existe
    const btn = document.getElementById('btnTempRecov');
    if(btn) btn.remove();
    // reconstruir pool y reiniciar en modo normal
    preparePool();
    if(GameCore.state.modeImpl){
      GameCore.state.modeImpl.init && GameCore.state.modeImpl.init(GameCore.three);
      if(GameCore.state.modeImpl.style === 'coleccion') beginSessionCollection();
      else beginSessionProgressive();
    }
  }

  // --- Preparación de preguntas con modo recuperación
  function preparePool(){
    const mistakes = StorageAPI.getMistakes();
    const all = QuestionBank.buildPoolFromVerbsPronouns();
    // Si recoveryOn está activado por código (botón) o por checkbox
    const recoveryChecked = GameCore.state.recoveryOn || document.getElementById('chkRecov')?.checked;
    if(recoveryChecked && mistakes.length){
      const filtered = all.filter(q => mistakes.some(m => m.pattern === q.pattern));
      GameCore.state.pool = filtered.length ? filtered : all;
      GameCore.state.recoveryOn = !!filtered.length;
    } else {
      GameCore.state.pool = all;
      GameCore.state.recoveryOn = false;
    }
    // actualizar botón en función del número de errores
    updateRecoveryButtonVisibility();
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
      // si esto ocurre al terminar recuperación temporal, finalizamos y volvemos a normal
      UI.showFinal(GameCore.state.answeredCount, 0, ()=>{
        if(GameCore._temporaryRecovery) { endTemporaryRecoveryAndRestart(); return; }
        GameCore.restart();
      });
      return;
    }

    let nextIdx = null;
    for(let i=0;i<aq.length;i++) if(!GameCore.state.usedIndexSet.has(i)){ nextIdx=i; break; }

    if(nextIdx === null){
      UI.showFinal(GameCore.state.answeredCount, aq.length, ()=>{
        if(GameCore._temporaryRecovery) { endTemporaryRecoveryAndRestart(); return; }
        GameCore.restart();
      });
      return;
    }

    // Guardamos el índice en pendingIndex en ambos modos; la semántica de avanzar/repitir la decide answerProgressive
    GameCore.state.pendingIndex = nextIdx;

    const q = aq[nextIdx];
    GameCore.state.currentQuestion = q;

    UI.setQuestion(q.question);
    UI.setProgress(GameCore.state.answeredCount, aq.length);

    if(GameCore.state.modeImpl?.presentOptionsForCurrent){
      GameCore.state.modeImpl.presentOptionsForCurrent(q.options, q.translation);
    }
  }

  function answerProgressive(correct){
    const q = GameCore.state.currentQuestion;
    if(!q) return;

    const pIdx = GameCore.state.pendingIndex;

    // --- MODO RECUPERACIÓN (activo cuando recoveryOn === true)
    if(GameCore.state.recoveryOn){
      if(correct){
        // en recuperación, el acierto ELIMINA el error
        StorageAPI.clearIfCorrect(q.pattern);
        // marcar como respondida para no volver en esta sesión
        if(typeof pIdx === 'number') GameCore.state.usedIndexSet.add(pIdx);
        GameCore.state.answeredCount++;
        UI.showFeedback('Correcto ✅');
        UI.flashStatus(true);
      } else {
        // en recuperación, el fallo se marca (se mantiene el error) y avanzamos: NO repetimos
        StorageAPI.markWrong(q.pattern);
        if(typeof pIdx === 'number') GameCore.state.usedIndexSet.add(pIdx);
        UI.showFeedback('Incorrecto ❌');
        UI.flashStatus(false);
      }
      GameCore.state.pendingIndex = null;
      // actualizar visibilidad del botón (puede que ya no haya 10 errores o sí)
      updateRecoveryButtonVisibility();
      setTimeout(nextQuestionProgressive, 600);
      return;
    }

    // --- MODO NORMAL (NO descontar errores al acertar)
    if(correct){
      // en normal, no eliminamos el registro de error aunque hubieras fallado antes
      UI.showFeedback('Correcto ✅');
      GameCore.state.answeredCount++;
      UI.flashStatus(true);
      if(typeof pIdx === 'number') GameCore.state.usedIndexSet.add(pIdx);
      GameCore.state.pendingIndex = null;
      setTimeout(nextQuestionProgressive, 600);
    } else {
      // fallo: registrar error y REPETIR la misma pregunta hasta acertar
      StorageAPI.markWrong(q.pattern);
      UI.showFeedback('Incorrecto ❌');
      UI.flashStatus(false);
      // actualizar botón por si alcanzamos 10 errores
      updateRecoveryButtonVisibility();
      // re-presentar mismas opciones (opcional: rebarajar)
      if(GameCore.state.modeImpl?.presentOptionsForCurrent){
        const opts = q.options.slice();
        shuffle(opts);
        GameCore.state.modeImpl.presentOptionsForCurrent(opts, q.translation);
      }
      // no avanzamos; la misma pregunta queda activa
    }
  }

  // --- Sesión estilo Colección
  function beginSessionCollection(){
    GameCore.state.style = 'coleccion';
    GameCore.state.availableQuestions = GameCore.state.pool.slice();
    GameCore.state.answeredSet.clear();
    UI.setQuestion('—');
    UI.setProgress(0, GameCore.state.availableQuestions.length);
    GameCore.state.modeImpl?.beginRound?.();
  }

  function onCorrectCollection(targetPattern){
    // En colección, solo quitar error si estamos en modo recuperación
    if(GameCore.state.recoveryOn){
      StorageAPI.clearIfCorrect(targetPattern);
    }
    const idx = GameCore.state.availableQuestions.findIndex(q=>q.pattern===targetPattern);
    if(idx>=0) GameCore.state.answeredSet.add(idx);
    UI.flashStatus(true);
    UI.setProgress(GameCore.state.answeredSet.size, GameCore.state.availableQuestions.length);

    // Si completamos y era una recuperación temporal, volvemos a normal
    if(GameCore.state.answeredSet.size === GameCore.state.availableQuestions.length){
      UI.showFinal(GameCore.state.answeredSet.size, GameCore.state.availableQuestions.length, ()=>{
        if(GameCore._temporaryRecovery){ endTemporaryRecoveryAndRestart(); return; }
        GameCore.restart();
      });
    }
  }

  function onWrongCollection(targetPattern){
    StorageAPI.markWrong(targetPattern);
    UI.flashStatus(false);
    // actualizar botón de recuperación por si llegamos a 10 errores
    updateRecoveryButtonVisibility();
  }

  // --- util
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } }

  // --- ciclo
  let last = performance.now();
  function animate(now=performance.now()){
    requestAnimationFrame(animate);
    if(GameCore.state.paused){ last = now; return; }
    const dt = (now - last)/1000;
    last = now;
    GameCore.state.modeImpl?.update?.(dt);
    if(GameCore.three.renderer && GameCore.three.scene && GameCore.three.camera){
      GameCore.three.renderer.render(GameCore.three.scene, GameCore.three.camera);
    }
  }

  // --- API pública
  GameCore.start = function(modeName){
    if(!GameCore.three.renderer) initThree();
    StorageAPI.saveMistakes(StorageAPI.getMistakes());
    // actualizar botón en inicio
    updateRecoveryButtonVisibility();

    preparePool();
    GameCore.state.modeName = modeName;
    GameCore.state.modeImpl  = (global.GameModes && global.GameModes[modeName]) || null;
    if(!GameCore.state.modeImpl) throw new Error(`Modo no encontrado: ${modeName}`);

    GameCore.state.modeImpl?.init?.(GameCore.three);

    if(GameCore.state.modeImpl.style === 'coleccion') beginSessionCollection();
    else beginSessionProgressive();

    if(!GameCore._loopStarted){ GameCore._loopStarted = true; requestAnimationFrame(animate); }
  };

  GameCore.restart = function(){
    GameCore.state.modeImpl?.destroy?.();
    // antes de reiniciar normal, asegurarnos de limpiar recovery temporal si estaba marcada
    if(GameCore._temporaryRecovery){
      // si reinicia manualmente durante recuperación, finalizamos la recuperación
      endTemporaryRecoveryAndRestart();
      return;
    }
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
