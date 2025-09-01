(function(global){
  if(!global.GameModes) global.GameModes = {};

  const Tunnel = {
    style: 'coleccion',
    scene:null, camera:null, renderer:null, raycaster:null,
    burbujas:[],
    spawnTimer:null,
    spawnBag:[],
    targetIdx: null,
    currentPattern: null,
    TUNNEL: { SPAWN_INTERVAL_MS: 1200, BURBUJA_RADIO: 150, SPAWN_Z: -3400, DESPAWN_Z: 400, BASE_VEL: 380 },

    init(three){
      this.scene = three.scene;
      this.camera = three.camera;
      this.renderer = three.renderer;
      this.raycaster = three.raycaster;

      // cámara fija hacia -Z
      this.camera.position.set(0,0,0);
      this.camera.lookAt(0,0,-1);

      this.burbujas.length = 0;
      this.spawnBag = [];
      this.targetIdx = null;
      this.currentPattern = null;
      UI.setQuestion('--');
      UI.setProgress(0, 0);
    },

    destroy(){
      this._end();
      this._clearAllBubbles();
      this.spawnBag.length = 0;
    },

    beginRound(){
      const total = GameCore.state.availableQuestions.length;
      UI.setProgress(GameCore.state.answeredSet.size, total);

      const remainingIdx = GameCore.state.availableQuestions.map((_,i)=>i).filter(i=>!GameCore.state.answeredSet.has(i));
      if(!remainingIdx.length){
        UI.showFinal(GameCore.state.answeredSet.size, total, ()=>GameCore.restart());
        return;
      }

      this.targetIdx = remainingIdx[Math.floor(Math.random()*remainingIdx.length)];
      const q = GameCore.state.availableQuestions[this.targetIdx];
      if(!q){
        this._clearAllBubbles();
        return;
      }
      this.currentPattern = q.pattern;
      const isMistake = GameCore.state.recoveryModeActive;
      UI.setQuestion(q.question, isMistake);

      this.spawnBag = q.options.map((_,i)=>i);
      shuffle(this.spawnBag);

      this._clearAllBubbles();
      this._end();
      this.spawnTimer = setInterval(()=>this._spawnTick(), this.TUNNEL.SPAWN_INTERVAL_MS);

      for(let i=0;i<3;i++) this._spawnTick();
    },

    _spawnTick(){
      const aq = GameCore.state.availableQuestions;
      if(!aq || !aq.length || this.targetIdx == null) return;

      const q = aq[this.targetIdx];
      if(!q) return;

      if(this.spawnBag.length === 0){
        this.spawnBag = q.options.map((_,i)=>i);
        shuffle(this.spawnBag);
      }

      const optIdx = this.spawnBag.shift();
      const text = q.options[optIdx] || '---';

      const x = (Math.random()-0.5) * 1400;
      const y = (Math.random()-0.5) * 500;
      const z = this.TUNNEL.SPAWN_Z;
      const velZ = this.TUNNEL.BASE_VEL + Math.random()*420;

      this._createBubble(optIdx, text, new THREE.Vector3(x,y,z), new THREE.Vector3(0,0,velZ));
    },

    _makeTextSprite(text, baseFont = 120, scaleY = 0.65){
      const canvas = document.createElement('canvas');
      canvas.width = 1024; canvas.height = 512;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.textBaseline='middle'; ctx.fillStyle='white';
      ctx.font = `bold ${baseFont}px monospace`;
      ctx.fillText(text, canvas.width/2 - ctx.measureText(text).width/2, canvas.height/2);
      const tex = new THREE.CanvasTexture(canvas); tex.minFilter = THREE.LinearFilter;
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
      const s = new THREE.Sprite(mat);
      s.scale.set(this.TUNNEL.BURBUJA_RADIO*1.6, this.TUNNEL.BURBUJA_RADIO*0.65, 1);
      return s;
    },

    _createBubble(idx, text, position, velocity){
      const geom = new THREE.SphereGeometry(this.TUNNEL.BURBUJA_RADIO, 32, 32);
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(Math.random(),0.7,0.5), transparent:true, opacity:0.5, depthWrite:false });
      const sphere = new THREE.Mesh(geom, mat);
      const sprite = this._makeTextSprite(text);
      const group = new THREE.Object3D();
      group.add(sphere);
      sprite.position.set(0,0,0);
      group.add(sprite);
      group.userData = { idxParam: idx, sphere, sprite, velocity, birth: performance.now() };
      if(position) group.position.copy(position);
      this.scene.add(group);
      this.burbujas.push(group);
      return group;
    },

    pick(nx, ny){
      if(GameCore.state.paused) return;
      if(!GameCore.state.availableQuestions.length) return;

      this.raycaster.setFromCamera(new THREE.Vector2(nx, ny), this.camera);
      const ints = this.raycaster.intersectObjects(this.burbujas.map(b=>b.userData.sphere));
      if(!ints.length) return;
      const mesh = ints[0].object;
      const group = this.burbujas.find(bb=>bb.userData.sphere===mesh);
      if(!group) return;

      const aq = GameCore.state.availableQuestions;
      const q = aq[this.targetIdx];
      if(!q) return;

      const selectedTranslation = q.options[group.userData.idxParam];
      const correct = selectedTranslation === q.translation;

      if(correct){
        UI.showFeedback('¡Correcto! ✅');
        GameCore._onCorrectCollection(q.pattern);
        this._clearAllBubbles();
        this._end();
        this.beginRound();
      } else {
        UI.showFeedback('Incorrecto ❌');
        GameCore._onWrongCollection(q.pattern);
      }
    },

    _clearAllBubbles(){ for(const b of this.burbujas) this.scene.remove(b); this.burbujas.length=0; },

    _end(){ if(this.spawnTimer){ clearInterval(this.spawnTimer); this.spawnTimer = null; } },

    update(dt){
      for(let i=this.burbujas.length-1;i>=0;i--){
        const b = this.burbujas[i];
        b.position.addScaledVector(b.userData.velocity, dt);
        if(b.position.z > this.TUNNEL.DESPAWN_Z){
          this.scene.remove(b);
          this.burbujas.splice(i,1);
        } else {
          if(b.userData.sprite) b.userData.sprite.quaternion.copy(this.camera.quaternion);
        }
      }
    }
  };

  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } }

  global.GameModes.tunnel = Tunnel;
})(window);
