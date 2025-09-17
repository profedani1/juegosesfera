(function(global){
  if(!global.GameModes) global.GameModes = {};

  const Tunnel = {
    style: 'coleccion',
    scene:null, camera:null, renderer:null, raycaster:null,
    burbujas:[],
    spawnTimer:null,
    spawnBag:[],
    targetIdx:null,
    currentPattern:null,
    TUNNEL: { SPAWN_INTERVAL_MS: 1200, BURBUJA_RADIO: 150, SPAWN_Z: -3400, DESPAWN_Z: 400, BASE_VEL: 380 },

    init(three){
      try {
        this.scene = three.scene;
        this.camera = three.camera;
        this.renderer = three.renderer;
        this.raycaster = three.raycaster;

        // Cámara fija hacia -Z
        this.camera.position.set(0,0,0);
        this.camera.lookAt(0,0,-1);

        this.burbujas.length = 0;
        this.spawnBag = [];
        this.targetIdx = null;
        this.currentPattern = null;

        // Detectar click vs drag
        this._dragging = false;
        this._dragStart = null;
        this._dragMoved = false;
        this._justDragged = false;

        if(this.renderer && this.renderer.domElement){
          this.renderer.domElement.addEventListener('pointerdown', this._onDown = (e)=>{
            if(e.pointerType === 'mouse' && e.button !== 0) return;
            this._dragging = true;
            this._dragMoved = false;
            this._dragStart = { x: e.clientX, y: e.clientY };
          });

          this.renderer.domElement.addEventListener('pointermove', this._onMove = (e)=>{
            if(this._dragging && this._dragStart){
              const dx = e.clientX - this._dragStart.x;
              const dy = e.clientY - this._dragStart.y;
              if(Math.hypot(dx, dy) > 6) this._dragMoved = true;
              if(this._dragMoved) this._dragStart = { x: e.clientX, y: e.clientY };
            }
          });

          this.renderer.domElement.addEventListener('pointerup', this._onUp = (e)=>{
            this._dragging = false;
            this._dragStart = null;
            this._justDragged = this._dragMoved;
            setTimeout(()=>{ this._justDragged = false; }, 0);
          });

          this.renderer.domElement.addEventListener('click', this._onClick = (e)=>{
            if(this._justDragged) return;
            try {
              const rect = this.renderer.domElement.getBoundingClientRect();
              const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
              const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
              this.pick(nx, ny);
            } catch(err){ console.error('Tunnel pick error', err); }
          });
        }

        UI.setQuestion('--');
        UI.setProgress(0,0);
      } catch(err){ console.error('Tunnel init error', err); }
    },

    destroy(){
      try {
        this._end();
        this._clearAllBubbles();
        this.spawnBag.length = 0;

        if(this.renderer && this.renderer.domElement){
          try {
            this.renderer.domElement.removeEventListener('pointerdown', this._onDown);
            this.renderer.domElement.removeEventListener('pointermove', this._onMove);
            this.renderer.domElement.removeEventListener('pointerup', this._onUp);
            this.renderer.domElement.removeEventListener('click', this._onClick);
          } catch(e){}
        }

        this._dragging = false;
        this._dragStart = null;
        this._dragMoved = false;
        this._justDragged = false;
      } catch(err){ console.error('Tunnel destroy error', err); }
    },

    beginRound(){
      try {
        this._clearAllBubbles();
        this._end();

        const total = GameCore.state.availableQuestions.length;
        UI.setProgress(GameCore.state.answeredCount, total);

        if(total === 0){
          UI.showFinal(GameCore.state.answeredCount, total, ()=>GameCore.restart());
          return;
        }

        // Tomar la pregunta actual del GameCore
        const q = GameCore.state.currentQuestion;
        if(!q){ return; }

        this.currentPattern = q.pattern;
        const isMistake = GameCore.state.recoveryModeActive;
        UI.setQuestion(q.question, isMistake);

        this.spawnBag = q.options.map((_,i)=>i);
        this._shuffle(this.spawnBag);

        this.spawnTimer = setInterval(()=>{ 
          try { this._spawnTick(); } catch(e){ console.error('Tunnel spawn error', e); } 
        }, this.TUNNEL.SPAWN_INTERVAL_MS);

        // spawnear algunos al inicio
        for(let i=0;i<3;i++) try { this._spawnTick(); } catch(e){ console.error('Tunnel spawn error', e); }
      } catch(err){ console.error('Tunnel beginRound error', err); }
    },

    _spawnTick(){
      try {
        const q = GameCore.state.currentQuestion;
        if(!q) return;

        if(this.spawnBag.length === 0){
          this.spawnBag = q.options.map((_,i)=>i);
          this._shuffle(this.spawnBag);
        }

        const optIdx = this.spawnBag.shift();
        const text = q.options[optIdx] || '---';
        const x = (Math.random()-0.5)*1400;
        const y = (Math.random()-0.5)*500;
        const z = this.TUNNEL.SPAWN_Z;
        const velZ = this.TUNNEL.BASE_VEL + Math.random()*420;

        this._createBubble(optIdx, text, new THREE.Vector3(x,y,z), new THREE.Vector3(0,0,velZ));
      } catch(err){ console.error('Tunnel _spawnTick error', err); }
    },

    _makeTextSprite(text, baseFont=120, scaleY=0.65){
      try {
        const c = document.createElement('canvas');
        c.width = 1024; c.height = 512;
        const ctx = c.getContext('2d');
        ctx.clearRect(0,0,c.width,c.height);
        ctx.textBaseline='middle'; ctx.fillStyle='white';
        ctx.font = `bold ${baseFont}px monospace`;
        ctx.fillText(text, c.width/2 - ctx.measureText(text).width/2, c.height/2);
        const tex = new THREE.CanvasTexture(c); tex.minFilter = THREE.LinearFilter;
        const mat = new THREE.SpriteMaterial({ map:tex, transparent:true });
        const s = new THREE.Sprite(mat);
        s.scale.set(this.TUNNEL.BURBUJA_RADIO*1.6, this.TUNNEL.BURBUJA_RADIO*scaleY,1);
        return s;
      } catch(err){ console.error('Tunnel _makeTextSprite error', err); return null; }
    },

    _createBubble(idx, text, position, velocity){
      try {
        const geom = new THREE.SphereGeometry(this.TUNNEL.BURBUJA_RADIO, 32, 32);
        const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(Math.random(),0.7,0.5), transparent:true, opacity:0.6, depthWrite:false });
        const sphere = new THREE.Mesh(geom, mat);
        const sprite = this._makeTextSprite(text);
        const group = new THREE.Object3D();
        group.add(sphere);
        if(sprite) { sprite.position.set(0,0,0); group.add(sprite); }
        group.userData = { idxParam: idx, sphere, sprite, velocity, birth: performance.now() };
        if(position) group.position.copy(position);
        this.scene.add(group);
        this.burbujas.push(group);
        return group;
      } catch(err){ console.error('Tunnel _createBubble error', err); }
    },

    pick(nx, ny){
      try {
        if(GameCore.state.paused) return;
        if(!GameCore.state.currentQuestion) return;

        this.raycaster.setFromCamera(new THREE.Vector2(nx, ny), this.camera);
        const ints = this.raycaster.intersectObjects(this.burbujas.map(b=>b.userData.sphere));
        if(!ints.length) return;

        const mesh = ints[0].object;
        const group = this.burbujas.find(bb=>bb.userData.sphere===mesh);
        if(!group) return;

        const q = GameCore.state.currentQuestion;
        if(!q) return;

        const selectedTranslation = q.options[group.userData.idxParam];
        const correct = selectedTranslation === q.translation;

        // ✅ unificado con orbit.js
        GameCore._answerProgressive(correct);

        // limpiar burbujas y terminar ronda
        this._clearAllBubbles();
        this._end();
        this.beginRound();
      } catch(err){ console.error('Tunnel pick error', err); }
    },

    _clearAllBubbles(){ try { for(const b of this.burbujas) this.scene.remove(b); this.burbujas.length=0; } catch(e){console.error(e);} },
    _end(){ if(this.spawnTimer){ clearInterval(this.spawnTimer); this.spawnTimer=null; } },

    update(dt){
      try {
        for(let i=this.burbujas.length-1;i>=0;i--){
          const b = this.burbujas[i];
          b.position.addScaledVector(b.userData.velocity, dt);
          if(b.position.z > this.TUNNEL.DESPAWN_Z){
            this.scene.remove(b);
            this.burbujas.splice(i,1);
          } else if(b.userData.sprite){
            b.userData.sprite.quaternion.copy(this.camera.quaternion);
          }
        }
      } catch(err){ console.error('Tunnel update error', err); }
    },

    _shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } }
  };

  global.GameModes.tunnel = Tunnel;
})(window);
