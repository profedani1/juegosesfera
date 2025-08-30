import { scene, raycaster, playerPos, THREE_MODULE as THREE } from '../shared/core-scene.js';

export const CHARGE_MAX_TIME=1.6, MAX_JUMP_DISTANCE=140, JUMP_DURATION_BASE=0.7, JUMP_DURATION_PER_M=0.004;
export let charging=false, chargeStart=0, jumping=false, jumpStartTime=0, jumpFrom=new THREE.Vector3(), jumpTo=new THREE.Vector3(), jumpPeak=4, jumpDuration=JUMP_DURATION_BASE;

export function beginCharge(){ if(charging||jumping) return; charging=true; chargeStart=performance.now(); }
export function endCharge(){ if(!charging) return; charging=false; const elapsed=(performance.now()-chargeStart)/1000; const p=Math.min(1,elapsed/CHARGE_MAX_TIME); const range=Math.max(6,p*MAX_JUMP_DISTANCE); const dir=new THREE.Vector3(0,0,-1).applyQuaternion(scene.getObjectByName('cameraProxy')?.quaternion||new THREE.Quaternion()); const target=playerPos.clone().add(dir.multiplyScalar(range)); startJump(target); }

export function startJump(targetVec, peakOverride=null, distForDuration=null, allowBeyondMax=false){
  if(jumping) return; const dist=targetVec.clone().setY(0).distanceTo(playerPos.clone().setY(0)); if(dist>MAX_JUMP_DISTANCE && !allowBeyondMax) return;
  jumping=true; jumpStartTime=performance.now()/1000; jumpFrom.copy(playerPos); jumpTo.copy(targetVec); jumpPeak=(peakOverride!=null)?peakOverride:Math.max(4,2+dist*0.25); jumpDuration=JUMP_DURATION_BASE + (distForDuration!=null?distForDuration:dist)*JUMP_DURATION_PER_M;
}

export function animateJump(dt){
  if(!jumping) return;
  const t=(performance.now()/1000 - jumpStartTime)/jumpDuration;
  if(t>=1){ jumping=false; playerPos.copy(jumpTo); return; }
  const curr=new THREE.Vector3().lerpVectors(jumpFrom,jumpTo,t);
  const y = THREE.MathUtils.lerp(jumpFrom.y,jumpTo.y,t) + Math.sin(Math.min(1,t)*Math.PI)*jumpPeak;
  playerPos.set(curr.x,y,curr.z);
}
