import { scene, raycaster, camera } from './core-scene.js';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js';

export const verbs = { rest:{rootEn:'REST',rootEs:'DESCANS'}, work:{rootEn:'WORK',rootEs:'TRABAJ'} };
export const pronouns = ['I','I HAVE'];

export function generateQuestions(verb, pronoun){
  const {rootEn,rootEs}=verb;
  if(pronoun==='I') return [{question:`I ${rootEn}ED`,translation:`${rootEs}É`,pattern:`I ${rootEn}ED`}];
  return [{question:`I HAVE ${rootEn}ED`,translation:`HE ${rootEs}ADO`,pattern:`I HAVE ${rootEn}ED`}];
}

const STORAGE_KEY='translationMistakesV1';
export function getMistakes(){ try{ const s=localStorage.getItem(STORAGE_KEY); return s?JSON.parse(s):[] }catch(e){return[]} }
export function saveMistakes(arr){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(arr, null,2)); }catch(e){} }

export let availableQuestions=[], usedIndexSet=new Set(), currentQuestion=null, MODE='normal';

function buildPool(){ const pool=[]; for(const k of Object.keys(verbs)) for(const p of pronouns) pool.push(...generateQuestions(verbs[k],p)); return pool; }

export function prepareAvailableQuestions(){
  const mistakes=getMistakes();
  if(MODE==='recuperacion' && mistakes.length){ const pool=buildPool(); availableQuestions=pool.filter(q=>mistakes.some(m=>m.pattern===q.pattern)); if(!availableQuestions.length) availableQuestions=pool; }
  else availableQuestions=buildPool();
  for(let i=availableQuestions.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [availableQuestions[i],availableQuestions[j]]=[availableQuestions[j],availableQuestions[i]]; }
  usedIndexSet.clear();
}

/* simple bubble system */
let burbujas=[];
function makeTextSprite(text){
  const canvas=document.createElement('canvas'); canvas.width=512; canvas.height=256;
  const ctx=canvas.getContext('2d'); ctx.font='bold 28px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.strokeStyle='rgba(0,0,0,0.95)'; ctx.lineWidth=8; ctx.strokeText(text,256,128); ctx.fillStyle='white'; ctx.fillText(text,256,128);
  const tex=new THREE.CanvasTexture(canvas); tex.minFilter=THREE.LinearFilter; tex.generateMipmaps=false;
  const mat=new THREE.SpriteMaterial({map:tex,transparent:true}); const s=new THREE.Sprite(mat); s.scale.set(160,80,1); return s;
}

export function clearBurbujas(){ for(const b of burbujas){ if(b.userData && b.userData.sprite) scene.remove(b.userData.sprite); scene.remove(b); } burbujas.length=0; }

export function presentOptionsForCurrent(camera){
  clearBurbujas(); if(!currentQuestion) return;
  const pool=availableQuestions.map((_,i)=>i);
  const chosen=new Set(); const correctIndex=availableQuestions.findIndex(q=>q.pattern===currentQuestion.pattern); chosen.add(correctIndex);
  while(chosen.size<Math.min(3,availableQuestions.length)) chosen.add(Math.floor(Math.random()*pool.length));
  const arr=Array.from(chosen);
  for(const idx of arr){
    const text=availableQuestions[idx].translation;
    const geom=new THREE.SphereGeometry(8+Math.random()*12,16,16);
    const mat=new THREE.MeshStandardMaterial({color:0x4fd1ff,transparent:true,opacity:0.8});
    const sphere=new THREE.Mesh(geom,mat); sphere.castShadow=true;
    const group=new THREE.Group(); group.add(sphere);
    const pos=new THREE.Vector3(camera.position.x+(Math.random()-0.5)*200,camera.position.y+10+Math.random()*30,camera.position.z+(Math.random()-0.5)*200);
    group.position.copy(pos);
    const sprite=makeTextSprite(text); scene.add(sprite);
    group.userData={idxParam:idx,sphere, sprite};
    scene.add(group); burbujas.push(group);
  }
}

export function processBubbleSelection(group){
  if(!currentQuestion) return false;
  const sel=group.userData.idxParam; const selText=availableQuestions[sel]?.translation||null; const mistakes=getMistakes();
  if(selText===currentQuestion.translation){ const cleaned=mistakes.filter(m=>m.pattern!==currentQuestion.pattern); saveMistakes(cleaned); }
  else { if(!mistakes.some(m=>m.pattern===currentQuestion.pattern)){ mistakes.push({pattern:currentQuestion.pattern}); saveMistakes(mistakes); } }
  setTimeout(()=> nextQuestion(),400);
  return true;
}

export function nextQuestion(){ if(!availableQuestions.length){ endGame(); return; } let idx=null; for(let i=0;i<availableQuestions.length;i++) if(!usedIndexSet.has(i)){ idx=i; break; } if(idx===null){ endGame(); return; } usedIndexSet.add(idx); currentQuestion=availableQuestions[idx]; updatePreguntaArea(); }

function updatePreguntaArea(){ const el=document.getElementById('preguntaBox'); if(!currentQuestion) el.innerHTML=`<div style="opacity:.85">Pulsa la esfera correcta</div><div style="font-size:12px;margin-top:6px">Respondidas: ${usedIndexSet.size}/${availableQuestions.length||0}</div>`; else el.innerHTML=`<div style="font-weight:700">${currentQuestion.question}</div><div style="font-size:12px;margin-top:6px">Respondidas: ${usedIndexSet.size}/${availableQuestions.length}</div>`; }

function endGame(){ clearBurbujas(); const m=document.getElementById('mensajeFinal'); m.style.display='block'; m.innerHTML=`<strong>¡Completado!</strong><div style="margin-top:8px">Respondidas: ${usedIndexSet.size}/${availableQuestions.length}.</div><div style="margin-top:12px"><button id="closeEnd" style="padding:6px 10px;border-radius:6px;border:0;background:#fff;color:#000;cursor:pointer">Cerrar</button></div>`; document.getElementById('closeEnd').addEventListener('click',()=>{ m.style.display='none'; resetState(); beginSession(); }); }

export function resetState(){ clearBurbujas(); usedIndexSet.clear(); currentQuestion=null; availableQuestions=[]; updatePreguntaArea(); }
export function beginSession(){ MODE = document.getElementById('chkRecov')?(document.getElementById('chkRecov').checked?'recuperacion':'normal'):'normal'; prepareAvailableQuestions(); nextQuestion(); }
export function getBurbujas(){ return burbujas; }
