import { scene, camera, renderer, initGridFull, playerPos, raycaster, THREE_MODULE as THREE } from '../shared/core-scene.js';
import * as Q from '../shared/questions.js';
import * as F from './flight.js';

export function start(){
  camera.position.set(0,8,30); camera.lookAt(0,2,0);
  Q.beginSession(); Q.presentOptionsForCurrent(camera);
  F.startFlight();
  // simple WASD/arrow control -> direction vector
  const dir=new THREE.Vector3();
  const keys={}; window.addEventListener('keydown',e=>keys[e.key.toLowerCase()]=true); window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
  const clock=new THREE.Clock();
  (function loop(){
    requestAnimationFrame(loop);
    const dt=Math.min(clock.getDelta(), .05);
    dir.set(0,0,0);
    if(keys['w']||keys['arrowup']) dir.z=-1;
    if(keys['s']||keys['arrowdown']) dir.z=1;
    if(keys['a']||keys['arrowleft']) dir.x=-1;
    if(keys['d']||keys['arrowright']) dir.x=1;
    dir.normalize();
    F.updateFlight(dt, dir);
    // update bubbles' sprites
    const burb=Q.getBurbujas();
    for(const b of burb){ if(b.userData && b.userData.sprite){ const world=new THREE.Vector3(); b.getWorldPosition(world); const toCam=new THREE.Vector3().subVectors(camera.position, world).normalize(); b.userData.sprite.position.copy(world.add(toCam.multiplyScalar( (b.children[0].geometry.parameters?.radius||12)+10 ))); b.userData.sprite.lookAt(camera.position); } }
    renderer.render(scene, camera);
  })();
}
