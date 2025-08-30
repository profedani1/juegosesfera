import { scene, camera, renderer, initGridFull, playerPos, raycaster, THREE_MODULE as THREE } from '../shared/core-scene.js';
import * as Q from '../shared/questions.js';
import * as J from './jumper.js';

export function start(){
  // camera proxy so jumper can read orientation
  const proxy = new THREE.Object3D(); proxy.name='cameraProxy'; scene.add(proxy);
  // basic camera placement
  camera.position.set(0,2,8); camera.lookAt(0,2,0);
  // link UI
  Q.beginSession(); Q.presentOptionsForCurrent(camera);
  // input: touch/ mouse simple
  let touchStart=0, moved=false;
  renderer.domElement.addEventListener('pointerdown', e=>{ touchStart=performance.now(); moved=false; J.beginCharge(); }, {passive:false});
  renderer.domElement.addEventListener('pointerup', e=>{ const dt=(performance.now()-touchStart)/1000; if(dt<0.2 && !moved){ // tap: jump center
    // try center raycast
    raycaster.setFromCamera({x:0,y:0}, camera);
    const hits = raycaster.intersectObjects(scene.children, true);
    if(hits.length) { const it=hits[0]; const t=new THREE.Vector3(it.point.x, it.point.y+2, it.point.z); J.startJump(t); }
  } else { J.endCharge(); } }, {passive:false});
  renderer.domElement.addEventListener('pointermove', e=>{ moved=true; }, {passive:false});

  // animate
  const clock=new THREE.Clock();
  (function loop(){
    requestAnimationFrame(loop);
    const dt=Math.min(clock.getDelta(), .05);
    J.animateJump(dt);
    // bubble motion & sprite follow
    const burb=Q.getBurbujas();
    for(const b of burb){ if(b.userData && b.userData.sprite){ const world=new THREE.Vector3(); b.getWorldPosition(world); const toCam=new THREE.Vector3().subVectors(camera.position, world).normalize(); b.userData.sprite.position.copy(world.add(toCam.multiplyScalar( (b.children[0].geometry.parameters?.radius||12)+10 ))); b.userData.sprite.lookAt(camera.position); } }
    renderer.render(scene, camera);
  })();
}
