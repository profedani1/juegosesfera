import { scene, camera, raycaster, playerPos, THREE } from '../shared/core-scene.js';
import { getBurbujas, processBubbleSelection } from '../shared/questions.js';

// jumper-specific logic: charge, auto-jump, startJump
export const MAX_JUMP_DISTANCE = 140;
export const JUMP_DURATION_BASE = 0.7;
export const JUMP_DURATION_PER_M = 0.004;
export const CHARGE_MAX_TIME = 1.6;
export const POWER_JUMP_MULTIPLIER = 2.0;
export const MAX_POWER_JUMP_DISTANCE = MAX_JUMP_DISTANCE * POWER_JUMP_MULTIPLIER;

let charging=false, chargeStart=0;
let jumping=false, jumpStartTime=0, jumpFrom=new THREE.Vector3(), jumpTo=new THREE.Vector3(), jumpPeak=4, jumpDuration=JUMP_DURATION_BASE;
let yaw=0, pitch=0;
let autoJumpActive=false, plannedAutoTarget=null, lastAutoTarget=null;

export function beginCharge(){ if(charging||jumping) return; charging=true; chargeStart=performance.now(); showPowerUI(true); setPowerUI(0); }
export function endCharge(){ if(!charging) return; charging=false; showPowerUI(false); const elapsed=(performance.now()-chargeStart)/1000; const p=Math.min(1, elapsed/CHARGE_MAX_TIME); const range=Math.max(6, p * MAX_POWER_JUMP_DISTANCE); const target=pickAutoTarget(range); if(target){ const dist=target.clone().setY(0).distanceTo(playerPos.clone().setY(0)); const extraPeak=3*p; const peak=Math.max(4, 2 + dist*0.6 + extraPeak); startJump(target, peak, dist, true); } }

export function startJump(targetVec, peakOverride=null, distForDuration=null, allowBeyondMax=false){
  if(jumping) return;
  const dist=targetVec.clone().setY(0).distanceTo(playerPos.clone().setY(0));
  const maxAllowed=allowBeyondMax ? MAX_POWER_JUMP_DISTANCE : MAX_JUMP_DISTANCE;
  if(dist>maxAllowed) return;
  jumping=true; jumpStartTime=performance.now()/1000; jumpFrom.copy(playerPos); jumpTo.copy(targetVec);
  jumpPeak=(peakOverride!=null)?peakOverride:Math.max(4, 2 + dist*0.25);
  jumpDuration=JUMP_DURATION_BASE + (distForDuration!=null ? distForDuration : dist) * JUMP_DURATION_PER_M;
}

function pickAutoTarget(range){
  const origin = playerPos.clone();
  const dir = new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw)).normalize();
  raycaster.set(origin, dir);
  const hits = raycaster.intersectObjects(scene.children, true);
  let best=null;
  for(const it of hits){
    const o=it.object; if(!(o && o.userData && o.userData.worldPos && o.visible)) continue;
    if(it.distance > range) break;
    const pos = new THREE.Vector3(o.userData.worldPos.x, o.userData.topY + 2.0, o.userData.worldPos.z);
    if(!best || it.distance > best.distance) best={distance:it.distance,pos};
  }
  if(best) return best.pos;
  // fallback: some random forward point
  return origin.clone().add(dir.multiplyScalar(Math.min(range, 30)));
}

/* power UI (simple) */
let powerWrapEl=null, powerFillEl=null, powerPctEl=null;
export function initPowerUI(){
  powerWrapEl = document.getElementById('powerWrap');
  powerFillEl = document.getElementById('powerFill');
  powerPctEl = document.getElementById('powerPct');
  if(!powerWrapEl){
    const wrap=document.createElement('div'); wrap.id='powerWrap';
    wrap.style.position='fixed'; wrap.style.left='50%'; wrap.style.transform='translateX(-50%)'; wrap.style.bottom='18px';
    wrap.style.width='62%'; wrap.style.maxWidth='420px'; wrap.style.height='28px'; wrap.style.background='#222';
    wrap.style.borderRadius='14px'; wrap.style.display='none'; wrap.style.zIndex='20'; wrap.style.boxShadow='0 2px 8px rgba(0,0,0,.4)';
    const fill=document.createElement('div'); fill.id='powerFill'; fill.style.height='100%'; fill.style.width='0%'; fill.style.background='linear-gradient(90deg,#6cf,#09f)'; fill.style.transition='width .05s';
    const pct=document.createElement('div'); pct.id='powerPct'; pct.style.position='absolute'; pct.style.left='50%'; pct.style.top='0'; pct.style.transform='translateX(-50%)'; pct.style.color='#fff'; pct.style.fontFamily='system-ui,sans-serif'; pct.style.fontSize='12px'; pct.style.lineHeight='28px';
    wrap.appendChild(fill); wrap.appendChild(pct); document.body.appendChild(wrap);
    powerWrapEl = wrap; powerFillEl = fill; powerPctEl = pct;
  }
}
export function showPowerUI(s){ if(!powerWrapEl) initPowerUI(); powerWrapEl.style.display = s ? 'block' : 'none'; }
export function setPowerUI(p){ if(!powerFillEl) initPowerUI(); const pct=Math.round(p*100); powerFillEl.style.width=pct+'%'; powerPctEl.textContent=pct+'%'; }

/* animate jump integration - called from main loop */
export function updateJumping(dt){
  if(jumping){
    const t=(performance.now()/1000 - jumpStartTime)/jumpDuration;
    if(t>=1){
      playerPos.copy(jumpTo); jumping=false;
      // check nearby bubbles
      const burb = getBurbujas();
      for(const b of burb.slice()){
        const d2 = b.position.distanceTo(playerPos);
        const verticalClose = Math.abs(b.position.y - playerPos.y) < 12;
        if(d2 < 18 && verticalClose){ processBubbleSelection(b); break; }
      }
      // chain auto jump
      if(autoJumpActive && plannedAutoTarget){
        const dist=plannedAutoTarget.clone().setY(0).distanceTo(playerPos.clone().setY(0));
        if(dist>0.15 && dist <= MAX_POWER_JUMP_DISTANCE){ lastAutoTarget=plannedAutoTarget.clone(); const peak=Math.max(4, 2 + dist * 0.6); startJump(plannedAutoTarget.clone(), peak, dist, true); }
        else { autoJumpActive=false; plannedAutoTarget=null; lastAutoTarget=null; }
      }
    } else {
      const curr=new THREE.Vector3().lerpVectors(jumpFrom, jumpTo, t);
      const y = THREE.MathUtils.lerp(jumpFrom.y, jumpTo.y, t) + Math.sin(Math.min(1,t)*Math.PI) * jumpPeak;
      playerPos.set(curr.x,y,curr.z);
      if(autoJumpActive){
        plannedAutoTarget = pickAutoTarget(MAX_JUMP_DISTANCE);
        if(plannedAutoTarget && lastAutoTarget && plannedAutoTarget.distanceTo(lastAutoTarget) < 0.1) plannedAutoTarget = null;
      }
    }
  }
}
