// Núcleo del motor: escena, cámara, renderer, input y ciclo principal.
// Coordina preguntas y delega la lógica específica al modo activo.
(function(global){
  const GameCore = {
    three: { scene:null, camera:null, renderer:null, raycaster:null },
    state: {
      paused:false,
      modeName:null,
      modeImpl:null,  // objeto con init/update/pick/destroy
      // flujo de preguntas (genérico)
      pool:[],
      // Dos estilos de progreso:
      //   - "progresivo": answeredCount avanza por preguntas presentadas secuencialmente (Orbit).
      //   - "coleccion": answeredSet de índices correctos (Tunnel).
      style: 'progresivo',
      answeredCount:0,
      answeredSet: new Set(),
      currentQuestion:null,
      availableQuestions:[],
      usedIndexSet: new Set()
    }
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

    window.addEventListener('resize', ()=>{
      camera.aspect = innerWidth/innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });

    // Input genérico -> delega al modo activo
    const dom = renderer.domElement;
    function normFromEvent(ev, rect){
      return {
        x: ((ev.clientX-rect.left)/rect.width)*2 - 1,
        y: -((ev.clientY-rect.top)/rect.height)*2 + 1
      };
    }
    dom.addEventListener('click', (ev)=>{
      if(!GameCore.state.modeImpl || !GameCore.state.modeImpl.pick) return;
      const rect = dom.getBoundingClientRect();
      const n = normFromEvent(ev, rect);
      GameCore.state.modeImpl.pick(n.x, n.y);
    });
    dom.addEventListener('touchstart', (e)=>{
      if(!GameCore.state.modeImpl || !GameCore.state.modeImpl.pick) return;
      if(e.touches.length===1){
        const t=e.touches[0];
        const rect = dom.getBoundingClientRect();
        const nx = ((t.clientX-rect.left)/rect.width)*2 - 1;
        const ny = -((t.clientY-rect.top)/rect.height)*2 + 1;
        GameCore.state.modeImpl.pick(nx, ny);
      }
    }, {passive:true});
  }

  // --- Preparación de preguntas con modo recuperación
  function preparePool(){
    const mistakes = StorageAPI.getMistakes();
    const all = QuestionBank.buildPoolFromVerbsPronouns();
    const recoveryOn = document.getElementById('chkRecov')?.checked;
    if(recoveryOn && mistakes.length){
      const filtered = all.filter(q => mistakes.some(m => m.pattern === q.pattern));
      GameCore.state.pool = filtered.length ? filtered : all; // fallback
    } else {
      GameCore.state.pool = all;
    }
  }

  // --- Estilo Progresivo (como Órbita): una pregunta a la vez con opciones
  function beginSessionProgressive(){
    GameCore.state.style = 'progresivo';
    GameCore.state.availableQuestions = GameCore.state.pool.slice();
    shuffle(GameCore.state.availableQuestions);
    GameCore.state.usedIndexSet.clear();
    GameCore.state.answeredCount = 0;
    nextQuestionProgressive();
  }

  function nextQuestionProgressive(){
    const aq = GameCore.state.availableQuestions;
    let nextIdx = null;
    for(let i=0;i<aq.length;i++) if(!GameCore.state.usedIndexSet.has(i)){ nextIdx=i; break; }
    if(nextIdx === null){
      UI.showFinal(GameCore.state.answeredCount, aq.length, ()=>GameCore.restart());
      return;
    }
    GameCore.state.usedIndexSet.add(nextIdx);
    const q = aq[nextIdx];
    GameCore.state.currentQuestion = q;
    UI.setQuestion(q.question);
    UI.setProgress(GameCore.state.answeredCount, aq.length);
    if(GameCore.state.modeImpl && GameCore.state.modeImpl.presentOptionsForCurrent){
      GameCore.state.modeImpl.presentOptionsForCurrent();
    }
  }

  function answerProgressive(correct){
    const q = GameCore.state.currentQuestion;
    if(!q) return;
    if(correct){
      StorageAPI.clearIfCorrect(q.pattern);
      UI.showFeedback('Correcto ✅');
      GameCore.state.answeredCount++;
      UI.flashStatus(true);
    } else {
      StorageAPI.markWrong(q.pattern);
      UI.showFeedback('Incorrecto ❌');
      UI.flashStatus(false);
    }
    setTimeout(nextQuestionProgressive, 600);
  }

  // --- Estilo Colección (como Túnel): muchas burbujas, se va completando
  function beginSessionCollection(){
    GameCore.state.style = 'coleccion';
    GameCore.state.availableQuestions = GameCore.state.pool.slice();
    GameCore.state.answeredSet.clear();
    UI.setQuestion('—'); // el modo actualizará al elegir target
    UI.setProgress(0, GameCore.state.availableQuestions.length);
    if(GameCore.state.modeImpl && GameCore.state.modeImpl.beginRound){
      GameCore.state.modeImpl.beginRound(); // modo decide target y spawns
    }
  }

  function onCorrectCollection(targetPattern){
    StorageAPI.clearIfCorrect(targetPattern);
    const idx = GameCore.state.availableQuestions.findIndex(q=>q.pattern===targetPattern);
    if(idx>=0) GameCore.state.answeredSet.add(idx);
    UI.flashStatus(true);
    UI.setProgress(GameCore.state.answeredSet.size, GameCore.state.availableQuestions.length);
    if(GameCore.state.answeredSet.size === GameCore.state.availableQuestions.length){
      UI.showFinal(GameCore.state.answeredSet.size, GameCore.state.availableQuestions.length, ()=>GameCore.restart());
    }
  }

  function onWrongCollection(targetPattern){
    StorageAPI.markWrong(targetPattern);
    UI.flashStatus(false);
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
    if(GameCore.state.modeImpl && GameCore.state.modeImpl.update){
      GameCore.state.modeImpl.update(dt);
    }
    if(GameCore.three.renderer && GameCore.three.scene && GameCore.three.camera){
      GameCore.three.renderer.render(GameCore.three.scene, GameCore.three.camera);
    }
  }

  // API pública
  GameCore.start = function(modeName){
    if(!GameCore.three.renderer) initThree();
    StorageAPI.saveMistakes(StorageAPI.getMistakes()); // refrescar UI
    preparePool();
    GameCore.state.modeName = modeName;
    GameCore.state.modeImpl  = (global.GameModes && global.GameModes[modeName]) ? global.GameModes[modeName] : null;
    if(!GameCore.state.modeImpl) throw new Error(`Modo no encontrado: ${modeName}`);

    // limpiar escena anterior
    if(GameCore.state.modeImpl.init){
      GameCore.state.modeImpl.init(GameCore.three);
    }

    // elegir estilo según modo
    if(GameCore.state.modeImpl.style === 'coleccion') beginSessionCollection();
    else beginSessionProgressive();

    // arrancar animación (una vez)
    if(!GameCore._loopStarted){ GameCore._loopStarted = true; requestAnimationFrame(animate); }
  };

  GameCore.restart = function(){
    // limpiar escena del modo
    if(GameCore.state.modeImpl && GameCore.state.modeImpl.destroy){
      GameCore.state.modeImpl.destroy();
    }
    preparePool();
    if(GameCore.state.modeImpl){
      GameCore.state.modeImpl.init(GameCore.three);
      if(GameCore.state.modeImpl.style === 'coleccion') beginSessionCollection();
      else beginSessionProgressive();
    }
  };

  GameCore.stop = function(){
    if(GameCore.state.modeImpl && GameCore.state.modeImpl.destroy){
      GameCore.state.modeImpl.destroy();
    }
    // no desengancho el loop; simplemente no hará nada sin modo activo
    GameCore.state.modeImpl = null;
  };

  GameCore.togglePause = function(){
    GameCore.state.paused = !GameCore.state.paused;
    const btn = document.getElementById('btnPause');
    if(btn) btn.textContent = GameCore.state.paused ? 'Continuar' : 'Pausa';
  };

  // Hooks para que los modos notifiquen resultados
  GameCore._answerProgressive = answerProgressive;
  GameCore._onCorrectCollection = onCorrectCollection;
  GameCore._onWrongCollection   = onWrongCollection;

  // Export
  global.GameCore = GameCore;
})(window);
