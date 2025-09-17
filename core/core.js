(function(global){
 
  const GameCore = {
    state: {
      currentQuestion: null,
      answeredCount: 0,
      availableQuestions: [],
      paused: false,
      recoveryModeActive: false
    },

    // ---- Utilities para interoperar con distintas variantes de QuestionsAPI ----
    _findOriginalQuestion(patternOrQuestion){
      if(typeof QuestionsAPI === 'undefined') return null;

      // Intenta varias APIs por convención
      try{
        if(typeof QuestionsAPI.getQuestionByPattern === 'function'){
          const q = QuestionsAPI.getQuestionByPattern(patternOrQuestion);
          if(q) return q;
        }

        if(typeof QuestionsAPI.findQuestionByPattern === 'function'){
          const q = QuestionsAPI.findQuestionByPattern(patternOrQuestion);
          if(q) return q;
        }

        // Si existe un getter genérico que devuelve todas las preguntas
        if(typeof QuestionsAPI.getAllQuestions === 'function'){
          const arr = QuestionsAPI.getAllQuestions();
          if(Array.isArray(arr)){
            const found = arr.find(x => x.pattern === patternOrQuestion || x.question === patternOrQuestion);
            if(found) return found;
          }
        }

        // Intentar propiedades internas comunes
        const maybeLists = ['questions','_questions','_allQuestions','data'];
        for(const k of maybeLists){
          if(Array.isArray(QuestionsAPI[k])){
            const found = QuestionsAPI[k].find(x => x.pattern === patternOrQuestion || x.question === patternOrQuestion);
            if(found) return found;
          }
        }

        // último recurso: intentar avanzar con getNextQuestion hasta encontrar coincidencia
        if(typeof QuestionsAPI.getNextQuestion === 'function'){
          // Guardamos el estado si QuestionsAPI permite reload
          if(typeof QuestionsAPI.saveState === 'function') QuestionsAPI.saveState();
          for(let i=0;i<500;i++){
            const qq = QuestionsAPI.getNextQuestion();
            if(!qq) break;
            if(qq.pattern === patternOrQuestion || qq.question === patternOrQuestion) return qq;
          }
          // Si restaurable, recargar estado
          if(typeof QuestionsAPI.loadStateFromStorage === 'function') QuestionsAPI.loadStateFromStorage();
        }
      }catch(e){
        console.warn('Error buscando pregunta original:', e);
      }

      return null;
    },

    _makeOptionsForQuestion(fullQuestion, fallbackTranslation){
      // fullQuestion: objeto original con .options/.type/.translation
      // fallbackTranslation: string
      // Prioridad: fullQuestion.options > QuestionsAPI.generateOptions(...) > fallback (solo correcta)
      if(fullQuestion && Array.isArray(fullQuestion.options) && fullQuestion.options.length >= 2){
        return fullQuestion.options.slice();
      }

      if(typeof QuestionsAPI !== 'undefined'){
        try{
          if(typeof QuestionsAPI.generateOptions === 'function'){
            // generar opciones basadas en la traducción o en el tipo si se soporta
            const base = fullQuestion && fullQuestion.translation ? fullQuestion.translation : fallbackTranslation;
            const generated = QuestionsAPI.generateOptions(base, fullQuestion && fullQuestion.type ? { type: fullQuestion.type } : undefined);
            if(Array.isArray(generated) && generated.length >= 2) return generated.slice();
          }

          // Algunas implementaciones pueden exponer opciones por tipo
          if(fullQuestion && fullQuestion.type && typeof QuestionsAPI.getOptionsForType === 'function'){
            const byType = QuestionsAPI.getOptionsForType(fullQuestion.type);
            if(Array.isArray(byType) && byType.length >= 2) return byType.slice();
          }
        }catch(e){
          console.warn('generateOptions falló:', e);
        }
      }

      // último recurso: devolver solo la respuesta (mala experiencia, pero seguro)
      return [fallbackTranslation];
    },

    // modeName: nombre del modo visual (orbit, tunnel...)
    // recoveryList: optional array de errores [{question, translation, options?, pattern?}, ...]
    start(modeName, recoveryList=null){
      this.state.answeredCount = 0;
      this.state.paused = false;

      // Determinar modo visual (por compatibilidad si alguien llama start('recovery', ...))
      let visualMode = modeName;
      if(modeName === 'recovery'){
        const sel = document.getElementById('modeSelect');
        visualMode = sel ? sel.value : 'tunnel';
      }

      // Normalizar y preparar pool de recuperación si nos dieron una lista
      if(Array.isArray(recoveryList) && recoveryList.length > 0){
        this.state.recoveryModeActive = true;
        this.state.availableQuestions = recoveryList.map(m => {
          const pattern = m.pattern || m.question;

          // Intentar obtener la pregunta completa original para conservar el TIPO
          const original = this._findOriginalQuestion(pattern);

          const options = this._makeOptionsForQuestion(original, m.translation);

          return {
            question: m.question,
            translation: m.translation,
            options,
            // conserva pattern para futuras búsquedas
            pattern
          };
        });
      } else {
        this.state.recoveryModeActive = false;
        this.state.availableQuestions = [];
      }


      if(typeof QuestionsAPI !== 'undefined' && QuestionsAPI.loadStateFromStorage) {
        try{ QuestionsAPI.loadStateFromStorage(); }catch(e){ console.warn('loadStateFromStorage falló:', e); }
      }

      // Si no estamos en recovery, construir pool normal desde QuestionsAPI
      if(!this.state.recoveryModeActive && typeof QuestionsAPI !== 'undefined' && QuestionsAPI.getNextQuestion){
        const pool = [];
        let attempts = 0, noNewCount = 0;
        while(attempts < 500 && noNewCount < 40){
          const q = QuestionsAPI.getNextQuestion();
          attempts++;
          if(!q){ noNewCount++; continue; }
          if(!pool.some(p => p.question === q.question)){
            // asegurarse de generar opciones coherentes con el tipo
            const options = Array.isArray(q.options) && q.options.length >= 2
                          ? q.options.slice()
                          : this._makeOptionsForQuestion(q, q.translation);

            pool.push({
              question: q.question,
              translation: q.translation,
              options,
              pattern: q.pattern || q.question
            });
            noNewCount = 0;
          } else {
            noNewCount++;
          }
        }
        this.state.availableQuestions = pool;
      }

      // ⚡️ Inicializar escena y modo visual
      const threeCtx = {
        scene: new THREE.Scene(),
        camera: new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 1, 5000),
        renderer: new THREE.WebGLRenderer({antialias:true}),
        raycaster: new THREE.Raycaster()
      };
      threeCtx.renderer.setSize(window.innerWidth, window.innerHeight);
      const container = document.getElementById('container');
      const existingCanvas = container ? container.querySelector('canvas') : null;
      if(existingCanvas){
        try { container.removeChild(existingCanvas); } catch(e){}
      }
      if(container) container.appendChild(threeCtx.renderer.domElement);

      // init del modo visual (si existe)
      if(global.GameModes && global.GameModes[visualMode] && global.GameModes[visualMode].init){
        try{ global.GameModes[visualMode].init(threeCtx); }catch(e){ console.error('Error init visual mode:', e); }
      }

      // Guardamos el modo visual en la instancia para usarlo en el loop
      this._visualMode = visualMode;

      // arranca la primera pregunta
      this.nextQuestion();

      // pedir al modo que presente opciones (si implementa alguno de los dos hooks)
      if(global.GameModes && global.GameModes[visualMode]){
        try{
          if(typeof global.GameModes[visualMode].beginRound === 'function'){
            global.GameModes[visualMode].beginRound();
          } else if(typeof global.GameModes[visualMode].presentOptionsForCurrent === 'function'){
            global.GameModes[visualMode].presentOptionsForCurrent();
          }
        }catch(e){ console.error('Error al pedir presentar opciones:', e); }
      }

      let lastTime = performance.now();
      const loop = (time) => {
        const dt = (time - lastTime) / 1000;
        lastTime = time;
        if(!this.state.paused && global.GameModes && global.GameModes[this._visualMode] && global.GameModes[this._visualMode].update){
          try { global.GameModes[this._visualMode].update(dt); } catch(e){ console.error("Error en update:", e); }
        }
        try { threeCtx.renderer.render(threeCtx.scene, threeCtx.camera); } catch(e){ console.error("Error en render:", e); }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    },

    stop(){
      this.state.currentQuestion = null;
      this.state.paused = true;
    },

    restart(){
      const modeSelect = document.getElementById('modeSelect');
      if(modeSelect) {
        this.start(modeSelect.value);
      }
    },

    togglePause(){
      this.state.paused = !this.state.paused;
    },

    nextQuestion(){
      let q = null;

      if(this.state.recoveryModeActive){
        // consumir solo del pool de recuperación (ya normalizado con opciones correctas)
        q = this.state.availableQuestions.shift() || null;

        if(!q){
          if(typeof UI !== 'undefined' && UI.setQuestion) UI.setQuestion("✅ ¡Recuperación completada, sin errores pendientes!");
          if(typeof UI !== 'undefined' && UI.showRecoveryButtons) UI.showRecoveryButtons(true); // mostrar botones (reiniciar/limpiar)
          this.state.currentQuestion = null;
          this.state.recoveryModeActive = false;
          return;
        }
      } else {
        if(typeof QuestionsAPI !== 'undefined' && QuestionsAPI.getNextQuestion){
          q = QuestionsAPI.getNextQuestion();
        } else if(Array.isArray(this.state.availableQuestions) && this.state.availableQuestions.length){
          // fallback: si se llenó el pool previamente
          q = this.state.availableQuestions.shift();
        }
      }

      if(!q){
        if(typeof UI !== 'undefined' && UI.setQuestion) UI.setQuestion("No hay preguntas disponibles.");
        this.state.currentQuestion = null;
        return;
      }

      // Si por alguna razón la pregunta viene sin options, intentar poblarla
      if(!Array.isArray(q.options) || q.options.length < 2){
        // intentar recuperar original por pattern si existe
        const original = this._findOriginalQuestion(q.pattern || q.question);
        q.options = this._makeOptionsForQuestion(original, q.translation);
      }

      this.state.currentQuestion = q;
      this.state.answeredCount++;
      if(typeof UI !== 'undefined'){
        try{ UI.setQuestion(q.question, this.state.recoveryModeActive); }catch(e){ console.warn('UI.setQuestion falló:', e); }
        try{ UI.setProgress(this.state.answeredCount, '--'); }catch(e){}
      }
    },

    _answerProgressive(correct){
      const q = this.state.currentQuestion;
      if(!q) return;

      if(correct){
        try{
          const mistakes = (StorageAPI.getMistakes() || []).filter(m => m.question !== q.question);
          StorageAPI.saveMistakes(mistakes);
          if(typeof UI !== 'undefined' && UI.showFeedback) UI.showFeedback('¡Correcto! ✅');
        }catch(e){ console.warn('Error al actualizar mistakes on correct:', e); }
      } else {
        try{ StorageAPI.addMistake(q); }catch(e){ console.warn('StorageAPI.addMistake falló:', e); }
        if(typeof UI !== 'undefined' && UI.showFeedback) UI.showFeedback('Incorrecto ❌');
      }

      setTimeout(()=>{
        this.nextQuestion();
        for(const m of Object.values(global.GameModes || {})){
          if(typeof m.presentOptionsForCurrent === 'function') m.presentOptionsForCurrent();
          if(typeof m.beginRound === 'function') m.beginRound();
        }
      }, 600);
    },

    // iniciar modo recuperación usando el modo visual actualmente seleccionado
    startRecovery(){
      let mistakes = [];
      try{ mistakes = StorageAPI.getMistakes() || []; }catch(e){ console.warn('StorageAPI.getMistakes falló:', e); }
      if(!mistakes.length){
        if(typeof UI !== 'undefined' && UI.showFeedback) UI.showFeedback("No hay errores que recuperar ✅");
        return;
      }
      const select = document.getElementById('modeSelect');
      const visualMode = select ? select.value : 'tunnel';
      // start con la lista de errores (la start los normaliza)
      this.start(visualMode, mistakes.slice());
    }
  };

  global.GameCore = GameCore;
})(window);
