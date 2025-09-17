(function(global){
  if(!global.GameModes) global.GameModes = {};

  const Orbit = {
    style: 'progresivo',
    scene:null, camera:null, renderer:null, raycaster:null,
    burbujas:[],
    BALS: { RADIO_LIMITE: 450, BURBUJA_RADIO: 85 },

    init(three){
      this.scene = three.scene;
      this.camera = three.camera;
      this.renderer = three.renderer;
      this.raycaster = three.raycaster;

      // cámara orbital
      this.camera.position.set(0,0,700);
      this.camera.lookAt(0,0,0);
      this.rotX = 0;
      this.rotY = 0;
      this.targetRotX = 0;
      this.targetRotY = 0;

      // drag para orbitar - mejor con pointer events (soporta mouse/touch/pen)
      this._dragging = false;
      this._dragStart = null;
      this._dragMoved = false;   // detecta si hubo movimiento significativo
      this._justDragged = false; // marca que acaba de ocurrir un drag (para ignorar click)

      // pointerdown
      window.addEventListener('pointerdown', this._onDown = (e)=>{
        // solo botón primario / o toque
        if(e.pointerType === 'mouse' && e.button !== 0) return;
        this._dragging = true;
        this._dragMoved = false;
        this._dragStart = { x: e.clientX, y: e.clientY };
        document.body.style.cursor = 'grabbing';
      });

      // pointermove
      window.addEventListener('pointermove', this._onMove = (e)=>{
        if(this._dragging && this._dragStart){
          const dx = e.clientX - this._dragStart.x;
          const dy = e.clientY - this._dragStart.y;
          // umbral pequeño para distinguir click vs drag
          if(Math.hypot(dx, dy) > 6) this._dragMoved = true;

          if(this._dragMoved){
            this.targetRotY += dx*0.01;
            this.targetRotX += -dy*0.01;
            this._dragStart = { x: e.clientX, y: e.clientY };
          }
        }
      });

      // pointerup
      window.addEventListener('pointerup', this._onUp = (e)=>{
        // terminar drag
        this._dragging = false;
        this._dragStart = null;
        // si hubo movimiento, marcar que acabo de arrastrar y mantenlo hasta que llegue el click
        this._justDragged = this._dragMoved;
        // limpieza muy breve: click suele venir inmediatamente después, así que esto no borra el flag antes de comprobarlo.
        setTimeout(()=>{ this._justDragged = false; }, 0);
        document.body.style.cursor = 'default';
      });

      // click para seleccionar respuestas (attach al canvas actual)
      if(this.renderer && this.renderer.domElement){
        this.renderer.domElement.addEventListener('click', this._onClick = (e) => {
          // si justo hubo un drag (movimiento) ignorar el click
          if(this._justDragged) return;

          const rect = this.renderer.domElement.getBoundingClientRect();
          const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          // DEBUG: descomentar para ver coordenadas
          // console.log('click normalized', nx, ny);
          this.pick(nx, ny);
        });
      }

      UI.setQuestion('--');
    },

    destroy(){
      for(const b of this.burbujas) this.scene.remove(b);
      this.burbujas.length = 0;

      // remover listeners registrados
      window.removeEventListener('pointerdown', this._onDown);
      window.removeEventListener('pointermove', this._onMove);
      window.removeEventListener('pointerup', this._onUp);
      if(this.renderer && this.renderer.domElement) {
        this.renderer.domElement.removeEventListener('click', this._onClick);
      }
    },

    _makeTextSprite(text, font=120, scaleY=0.65){
      const c = document.createElement('canvas');
      c.width = 1024; c.height = 512;
      const ctx = c.getContext('2d');
      ctx.clearRect(0,0,c.width,c.height);
      ctx.textBaseline='middle';
      ctx.fillStyle='white';
      ctx.font = `bold ${font}px monospace`;
      ctx.fillText(text, c.width/2 - ctx.measureText(text).width/2, c.height/2);
      const tex = new THREE.CanvasTexture(c); tex.minFilter = THREE.LinearFilter;
      const mat = new THREE.SpriteMaterial({map:tex,transparent:true});
      const s = new THREE.Sprite(mat);
      s.scale.set(this.BALS.BURBUJA_RADIO*1.6, this.BALS.BURBUJA_RADIO*scaleY,1);
      return s;
    },

    _createBubble(idx, text){
      const radius = this.BALS.BURBUJA_RADIO;
      const geom = new THREE.SphereGeometry(radius, 30, 30);
      const color = new THREE.Color().setHSL(Math.random(),0.7,0.5);
      const mat = new THREE.MeshBasicMaterial({ color, transparent:true, opacity:0.6, depthWrite:false });
      const sphere = new THREE.Mesh(geom, mat);
      const sprite = this._makeTextSprite(text);
      const group = new THREE.Object3D();
      group.add(sphere);
      sprite.position.set(0,0,0);
      group.add(sprite);
      group.userData = {
        idxParam: idx,
        sphere,
        sprite,
        velocity: new THREE.Vector3((Math.random()-0.5)*40,(Math.random()-0.5)*40,(Math.random()-0.5)*40),
        radius
      };

      const u=Math.random(), v=Math.random();
      const theta=2*Math.PI*u, phi=Math.acos(2*v-1);
      const r=this.BALS.RADIO_LIMITE*(0.6+Math.random()*0.4);
      const x = r*Math.sin(phi)*Math.cos(theta);
      const y = r*Math.sin(phi)*Math.sin(theta);
      const z = r*Math.cos(phi);
      group.position.set(x,y,z);

      this.scene.add(group);
      this.burbujas.push(group);
      return group;
    },

    _clearBubbles(){
      for(const b of this.burbujas) this.scene.remove(b);
      this.burbujas.length=0;
    },

    presentOptionsForCurrent(){
      this._clearBubbles();
      const q = GameCore.state.currentQuestion;
      if(!q) return;

      const isMistake = GameCore.state.recoveryModeActive;
      UI.setQuestion(q.question, isMistake);
      UI.setProgress(GameCore.state.answeredCount, GameCore.state.availableQuestions.length);

      const options = q.options || [q.translation];
      options.forEach((opt, idx) => this._createBubble(idx, opt));
    },

    pick(nx, ny){
      if(GameCore.state.paused) return;

      this.raycaster.setFromCamera(new THREE.Vector2(nx, ny), this.camera);
      const objects = this.burbujas.map(b=>b.userData.sphere);
      const ints = this.raycaster.intersectObjects(objects);
      // DEBUG: puedes descomentar para ver intersecciones
      // console.log('intersections:', ints.length, ints);
      if(!ints.length) return;

      const mesh = ints[0].object;
      const group = this.burbujas.find(bb=>bb.userData.sphere===mesh);
      if(!group) return;

      const selectedIdx = group.userData.idxParam;
      const q = GameCore.state.currentQuestion;
      const selectedTranslation = q.options[selectedIdx];
      const correct = selectedTranslation === q.translation;

      GameCore._answerProgressive(correct);
    },

    update(dt){
      for(let i=this.burbujas.length-1;i>=0;i--){
        const b=this.burbujas[i];
        b.position.addScaledVector(b.userData.velocity, dt);
        if(b.position.length()>this.BALS.RADIO_LIMITE){
          const n=b.position.clone().normalize();
          b.position.setLength(this.BALS.RADIO_LIMITE);
          b.userData.velocity.reflect(n);
        }
        if(b.userData.sprite) b.userData.sprite.quaternion.copy(this.camera.quaternion);
      }

      const blend = dt*4;
      this.rotY += (this.targetRotY - this.rotY)*blend;
      this.rotX += (this.targetRotX - this.rotX)*blend;
      this.rotX = Math.max(-Math.PI/2.2, Math.min(Math.PI/2.2, this.rotX));
      this.rotY = Math.max(-Math.PI*0.95, Math.min(Math.PI*0.95, this.rotY));

      const R = 700;
      this.camera.position.set(
        R*Math.sin(this.rotY)*Math.cos(this.rotX),
        R*Math.sin(this.rotX),
        R*Math.cos(this.rotY)*Math.cos(this.rotX)
      );
      this.camera.lookAt(0,0,0);
    }
  };

  global.GameModes.orbit = Orbit;
})(window);
