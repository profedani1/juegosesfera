import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js';
import { scene, camera, renderer, raycaster, playerPos, grid, updateCell, buildingGroup } from '../shared/core-scene.js';
import { beginSession, prepareAvailableQuestions, beginSession as qBeginSession, getBurbujas, clearBurbujas, processBubbleSelection, beginSession as startQuestions } from '../shared/questions.js';
import * as jumper from './jumper.js';

let running=false;
let clock=null;

export async function startMode(){
  if(running) return;
  running=true;
  // initialize camera/player
  camera.position.set(0,2,0);
  camera.lookAt(0,2,10);
  // initialize power UI
  jumper.initPowerUI();
  prepareAvailableQuestions();
  startQuestions();
  initInput();
  clock = new THREE.Clock();
  animate();
}

export async function stopMode(){
  running=false;
  // clear scene objects created by questions
  clearBurbujas();
  // try to remove event listeners (we used simple ones, so reload page recommended)
  // remove power UI if present
  const pw = document.getElementById('powerWrap'); if(pw) pw.remove();
}

function initInput(){
  // pointer/touch simplified: click to jump to center intersect or charge when holding
  let pointerDown=false, pdX=0, pdY=0, pdT=0;
  window.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('mousemove', onMove);
  function onDown(e){ pointerDown=true; pdX=e.clientX; pdY=e.clientY; pdT=performance.now(); jumper.beginCharge(); }
  function onUp(e){ pointerDown=false; const dt=(performance.now()-pdT); if(dt<250) { // short click - attempt center jump if bubble
      const hit=raycastCenterBubble();
      if(hit){ const land = new THREE.Vector3(hit.position.x, (hit.userData.attachedBuildingTop||hit.userData.baseY)+2.0, hit.position.z); jumper.startJump(land); }
      else { // try jump to object under center
        const target = pickCenterGround(); if(target) jumper.startJump(target);
      }
    } else { jumper.endCharge(); }
  }
  function onMove(e){
    // optional: update camera yaw/pitch (not full pointerlock)
  }
  function raycastCenterBubble(){
    raycaster.setFromCamera({x:0,y:0}, camera);
    const meshes = getBurbujas().map(b=>b.userData.sphere);
    const hits = raycaster.intersectObjects(meshes, true);
    if(hits.length>0){
      const hit=hits[0].object;
      const found = getBurbujas().find(b => b.userData && (b.userData.sphere === hit || b.userData.sphere === hit.parent || (hit.parent && hit.parent === b)));
      return found || null;
    }
    return null;
  }
  function pickCenterGround(){
    raycaster.setFromCamera({x:0,y:0}, camera);
    const intersects = raycaster.intersectObjects(buildingGroup.children, true);
    for(const it of intersects){ if(it.object && it.object.userData && it.object.userData.worldPos && it.object.visible){ return new THREE.Vector3(it.object.userData.worldPos.x, it.object.userData.topY + 2.0, it.object.userData.worldPos.z); } }
    return null;
  }
}

function animate(){
  if(!running) return;
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  // update bubbles physics simple
  const burb = getBurbujas();
  for(const b of burb){
    if(b.userData && b.userData.velocity) b.position.addScaledVector(b.userData.velocity, dt);
    // simple gravity
    if(b.position.y <= b.userData.baseY){
      b.position.y = b.userData.baseY;
      b.userData.velocity.y = Math.abs(b.userData.velocity.y)*0.6;
    }
    // update sprite
    if(b.userData && b.userData.sprite){
      const world = new THREE.Vector3(); b.getWorldPosition(world);
      const toCam = new THREE.Vector3().subVectors(camera.position, world).normalize();
      const radius = (b.children[0] && b.children[0].geometry && b.children[0].geometry.parameters && (b.children[0].geometry.parameters.radius || 12)) || 12;
      const offset = 10;
      const targetWorldPos = world.clone().add(toCam.multiplyScalar(radius+offset));
      b.userData.sprite.position.copy(targetWorldPos);
      b.userData.sprite.lookAt(camera.position);
    }
  }

  // jumper update
  jumper.updateJumping(dt);

  // camera follow playerPos
  camera.position.copy(playerPos());
  camera.lookAt(playerPos().x, playerPos().y, playerPos().z+1);

  renderer.render(scene, camera);
}

// helper to access playerPos from core-scene by function (to avoid circular import)
function playerPos(){
  // small getter via global scene userData (we store pos in scene.userData.playerPos if present)
  return scene.userData && scene.userData.playerPos ? scene.userData.playerPos : new THREE.Vector3(0,2,0);
}
