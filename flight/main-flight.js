import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js';
import { scene, camera, renderer } from '../shared/core-scene.js';
import { prepareAvailableQuestions, beginSession, getBurbujas, clearBurbujas } from '../shared/questions.js';
import * as flight from './flight.js';

let running=false;
let clock=null;

export async function startMode(){
  if(running) return;
  running=true;
  prepareAvailableQuestions();
  beginSession();
  flight.startFlight();
  clock=new THREE.Clock();
  animate();
}

export async function stopMode(){
  running=false;
  flight.stopFlight();
  clearBurbujas();
}

function animate(){
  if(!running) return;
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  flight.updateFlight(dt);

  // update bubbles simple
  const burb = getBurbujas();
  for(const b of burb){
    if(b.userData && b.userData.velocity) b.position.addScaledVector(b.userData.velocity, dt);
    if(b.userData && b.userData.sprite){
      const world=new THREE.Vector3(); b.getWorldPosition(world);
      const toCam=new THREE.Vector3().subVectors(camera.position, world).normalize();
      const radius = (b.children[0] && b.children[0].geometry && b.children[0].geometry.parameters && (b.children[0].geometry.parameters.radius || 12)) || 12;
      const offset = 10;
      const targetWorldPos = world.clone().add(toCam.multiplyScalar(radius+offset));
      b.userData.sprite.position.copy(targetWorldPos);
      b.userData.sprite.lookAt(camera.position);
    }
  }

  renderer.render(scene, camera);
}
