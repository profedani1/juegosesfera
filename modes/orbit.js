// Modo Órbita: burbujas alrededor, cámara orbital, opciones por pregunta
(function(global){
  if(!global.GameModes) global.GameModes = {};
  const Orbit = {
    style: 'progresivo',
    scene:null, camera:null, renderer:null, raycaster:null,
    burbujas:[],
    BALS: { RADIO_LIMITE: 450, BURBUJA_RADIO: 85 },

    init(three){
      this.scene=three.scene; this.camera=three.camera; this.renderer=three.renderer; this.raycaster=three.raycaster;
      // cámara orbital
      this.camera.position.set(0,0,700); this.camera.lookAt(0,0,0);
      this.rotX=0; this.rotY=0; this.targetRotX=0; this.targetRotY=0;
      // drag para orbitar
      this._dragging=false; this._dragStart=null;
      window.addEventListener('mousedown', this._onDown = (e)=>{ if(e.button!==0) return; this._dragging=true; this._dragStart={x:e.clientX,y:e.clientY}; document.body.style.cursor='grabbing'; });
      window.addEventListener('mouseup', this._onUp = ()=>{ this._dragging=false; this._dragStart=null; document.body.style.cursor='default'; });
      window.addEventListener('mousemove', this._onMove = (e)=>{ if(this._dragging && this._dragStart){ const dx=e.clientX-this._dragStart.x; const dy=e.clientY-this._dragStart.y; this.targetRotY += dx*0.01; this.targetRotX += -dy*0.01; this._dragStart={x:e.clientX,y:e.clientY}; } });

      // primeras opciones se generan desde core vía presentOptionsForCurrent()
      UI.setQuestion('--');
    },

    destroy(){
      // limpiar burbujas
      for(const b of this.burbujas) this.scene.remove(b);
      this.burbujas.length = 0;
      // remover listeners
      window.removeEventListener('mousedown', this._onDown);
      window.removeEventListener('mouseup', this._onUp);
      window.removeEventListener('mousemove', this._onMove);
    },

    _makeTextSprite(text, font=120, scaleY=0.65){
      const c=document.createElement('canvas'); c.width=1024; c.height=512;
      const ctx=c.getContext('2d'); ctx.clearRect(0,0,c.width,c.height);
      ctx.textBaseline='middle'; ctx.fillStyle='white'; ctx.font=`bold ${font}px monospace`;
      ctx.fillText(text, c.width/2 - ctx.measureText(text).width/2, c.height/2);
      const tex=new THREE.CanvasTexture(c); tex.minFilter=THREE.LinearFilter;
      const mat=new THREE.SpriteMaterial({map:tex,transparent:true});
      const s=new THREE.Sprite(mat); s.scale.set(this.BALS.BURBUJA_RADIO*1.6, this.BALS.BURBUJA_RADIO*scaleY,1);
      return s;
    },

    _createBubble(idx, text){
      const radius = this.BALS.BURBUJA_RADIO;
      const geom = new THREE.SphereGeometry(radius, 30, 30);
      const color = new THREE.Color().setHSL(Math.random(), 0.7, 0.5);
      const mat = new THREE.MeshBasicMaterial({ color, transparent:true, opacity:0.6, depthWrite:false });
      const sphere = new THREE.Mesh(geom, mat);
      const sprite = this._makeTextSprite(text);
      const group = new THREE.Object3D(); group.add(sphere); sprite.position.set(0,0,0); group.add(sprite);
      group.userData = { idxParam: idx, sphere, sprite, velocity: new THREE.Vector3((Math.random()-0.5)*40,(Math.random()-0.5)*40,(Math.random()-0.5)*40), radius };
      // posición inicial aleatoria
      const u=Math.random(), v=Math.random(), theta=2*Math.PI*u, phi=Math.acos(2*v-1), r=this.BALS.RADIO_LIMITE*(0.6+Math.random()*0.4);
      const x=r*Math.sin(phi)*Math.cos(theta), y=r*Math.sin(phi)*Math.sin(theta), z=r*Math.cos(phi);
      group.position.set(x,y,z);
      this.scene.add(group); this.burbujas.push(group);
      return group;
    },

    _clearBubbles(){ for(const b of this.burbujas) this.scene.remove(b); this.burbujas.length=0; },

    presentOptionsForCurrent(){
      this._clearBubbles();
      const aq = GameCore.state.availableQuestions;
      const q = GameCore.state.currentQuestion;
      if(!q) return;
      UI.setQuestion(q.question);
      UI.setProgress(GameCore.state.answeredCount, aq.length);

      // armar conjunto de opciones (3 si es posible)
      const correctIndex = aq.findIndex(x=>x.pattern===q.pattern);
      const chosen = new Set();
      if(correctIndex>=0) chosen.add(correctIndex);
      const pool = aq.map((_,i)=>i).filter(i=>i!==correctIndex);
      while(chosen.size<Math.min(3, aq.length) && pool.length){
        const j=Math.floor(Math.random()*pool.length);
        chosen.add(pool[j]); pool.splice(j,1);
      }
      const arr = Array.from(chosen);
      for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]] }
      arr.forEach(i => this._createBubble(i, aq[i].translation));
    },

    pick(nx, ny){
      this.raycaster.setFromCamera(new THREE.Vector2(nx, ny), this.camera);
      const objects = this.burbujas.map(b=>b.userData.sphere);
      const ints = this.raycaster.intersectObjects(objects);
      if(!ints.length) return;
      const mesh = ints[0].object;
      const group = this.burbujas.find(bb=>bb.userData.sphere===mesh);
      if(!group) return;

      const selectedIdx = group.userData.idxParam;
      const aq = GameCore.state.availableQuestions;
      const selectedTranslation = (selectedIdx>=0 && aq[selectedIdx]) ? aq[selectedIdx].translation : null;
      const correct = GameCore.state.currentQuestion && selectedTranslation === GameCore.state.currentQuestion.translation;
      GameCore._answerProgressive(!!correct);
    },

    update(dt){
      // mover burbujas y mantener dentro de la esfera límite
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
      // orbitar cámara
      const blend = dt*4;
      this.rotY += (this.targetRotY - this.rotY)*blend;
      this.rotX += (this.targetRotX - this.rotX)*blend;
      this.rotX = Math.max(-Math.PI/2.2, Math.min(Math.PI/2.2, this.rotX));
      this.rotY = Math.max(-Math.PI*0.95, Math.min(Math.PI*0.95, this.rotY));
      const R=700;
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
