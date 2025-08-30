import { playerPos } from '../shared/core-scene.js';
import { THREE_MODULE as THREE } from '../shared/core-scene.js';

export let velocity=new THREE.Vector3(0,0,0), flying=false;
export function startFlight(){ flying=true; }
export function stopFlight(){ flying=false; }
export function updateFlight(dt, inputDir){
  if(!flying) return;
  const speed=40;
  velocity.lerp(inputDir.multiplyScalar(speed), dt*2);
  playerPos.addScaledVector(velocity, dt);
}
