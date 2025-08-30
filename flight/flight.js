import { scene, camera } from '../shared/core-scene.js';
import { getBurbujas } from '../shared/questions.js';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js';

// Simplified flight controls (continuous movement)
let flying=false;
let velocity = new THREE.Vector3(0,0,0);
let yaw=0, pitch=0;
export function startFlight(){
  flying=true;
}
export function stopFlight(){
  flying=false;
}
export function updateFlight(dt){
  if(!flying) return;
  // simple forward motion in camera direction
  const dir = new THREE.Vector3(Math.sin(yaw), Math.sin(pitch), Math.cos(yaw)).normalize();
  velocity.lerp(dir.multiplyScalar(20), 0.05);
  camera.position.addScaledVector(velocity, dt);
  // make camera look forwards
  camera.lookAt(camera.position.x + dir.x, camera.position.y + dir.y, camera.position.z + dir.z);
}
