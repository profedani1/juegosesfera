import { scene, camera } from '../shared/core-scene.js';
import { raycaster } from '../shared/core-scene.js';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js';

export const verbs = {
    rest: { rootEn: "REST", rootEs: "DESCANS" },
    work: { rootEn: "WORK", rootEs: "TRABAJ" },
    play: { rootEn: "PLAY", rootEs: "JUG" },
    go: { rootEn: "GO", rootEs: "VÁ" }
};
export const pronouns = ["I", "I HAVE"];

export function generateQuestions(verb, pronoun) {
    const { rootEn, rootEs } = verb;
    if (pronoun === 'I')
        return [
            { question: `I ${rootEn}ED`, translation: `${rootEs}É`, pattern: `I ${rootEn}ED` },
            { question: `I USED TO ${rootEn}`, translation: `${rootEs}ABA`, pattern: `I USED TO ${rootEn}` }
        ];
    return [
        { question: `I HAD ${rootEn}ED`, translation: `HABÍA ${rootEs}ADO`, pattern: `I HAD ${rootEn}ED` },
        { question: `I HAVE ${rootEn}ED`, translation: `HE ${rootEs}ADO`, pattern: `I HAVE ${rootEn}ED` }
    ];
}

const STORAGE_KEY = 'translationMistakesV1';
export function getMistakes() {
    try {
        const s = localStorage.getItem(STORAGE_KEY);
        return s ? JSON.parse(s) : [];
    } catch (e) { return []; }
}
export function saveMistakes(arr) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr, null, 2)); }
    catch (e) { }
}

export let availableQuestions = [],
    usedIndexSet = new Set(),
    currentQuestion = null,
    MODE = 'normal';

function buildPoolFromVerbsPronouns() {
    const pool = [];
    for (const k of Object.keys(verbs))
        for (const p of pronouns)
            pool.push(...generateQuestions(verbs[k], p));
    return pool;
}

export function prepareAvailableQuestions() {
    const mistakes = getMistakes();
    if (MODE === 'recuperacion' && mistakes.length) {
        const pool = buildPoolFromVerbsPronouns();
        availableQuestions = pool.filter(q => mistakes.some(m => m.pattern === q.pattern));
        if (availableQuestions.length === 0) availableQuestions = buildPoolFromVerbsPronouns();
    } else availableQuestions = buildPoolFromVerbsPronouns();
    for (let i = availableQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableQuestions[i], availableQuestions[j]] = [availableQuestions[j], availableQuestions[i]];
    }
    usedIndexSet.clear();
}

export function nextQuestion() {
    if (availableQuestions.length === 0) { endGame(); return; }
    let nextIdx = null;
    for (let i = 0; i < availableQuestions.length; i++)
        if (!usedIndexSet.has(i)) { nextIdx = i; break; }
    if (nextIdx === null) { endGame(); return; }
    usedIndexSet.add(nextIdx);
    currentQuestion = availableQuestions[nextIdx];
    updatePreguntaArea();
    presentOptionsForCurrent();
}

export function resetState() {
    clearBurbujas();
    usedIndexSet.clear();
    currentQuestion = null;
    availableQuestions = [];
    updatePreguntaArea();
}

export function beginSession() {
    MODE = document.getElementById('chkRecov') ? (document.getElementById('chkRecov').checked ? 'recuperacion' : 'normal') : 'normal';
    prepareAvailableQuestions();
    nextQuestion();
}

/* UI y feedback */
const preguntaBox = document.getElementById('preguntaBox');
const mensajeFinal = document.getElementById('mensajeFinal');

function updatePreguntaArea() {
    if (!currentQuestion) {
        preguntaBox.innerHTML = `<div style="opacity:.85">Pulsa la esfera correcta</div><div style="font-size:12px;margin-top:6px">Respondidas: ${usedIndexSet.size} / ${availableQuestions.length || 0}</div>`;
        return;
    }
    preguntaBox.innerHTML = `<div style="font-weight:700">${currentQuestion.question}</div><div style="font-size:12px;margin-top:6px">Respondidas: ${usedIndexSet.size} / ${availableQuestions.length}</div>`;
}

function endGame() {
    clearBurbujas();
    mensajeFinal.style.display = 'block';
    const answered = usedIndexSet.size;
    mensajeFinal.innerHTML = `<strong>¡Completado!</strong><div style="margin-top:8px">Respondidas: ${answered}/${availableQuestions.length}.</div><div style="margin-top:12px"><button id="closeEnd" style="padding:6px 10px;border-radius:6px;border:0;background:#fff;color:#000;cursor:pointer">Cerrar</button></div>`;
    document.getElementById('closeEnd').addEventListener('click', () => {
        mensajeFinal.style.display = 'none';
        resetState();
        beginSession();
    });
}

/* Burbujas (simplified spawn near camera) */
let burbujas = [];
function makeTextSprite(text) {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(0,0,0,0.95)';
    ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = 'white'; ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(160, 80, 1); sprite.renderOrder = 999;
    return sprite;
}

export function clearBurbujas() {
    for (const b of burbujas) {
        if (b.userData && b.userData.sprite) scene.remove(b.userData.sprite);
        scene.remove(b);
    }
    burbujas.length = 0;
}

function presentOptionsForCurrent() {
    clearBurbujas();
    if (!currentQuestion) return;
    const correctIndex = availableQuestions.findIndex(q => q.pattern === currentQuestion.pattern);
    const chosen = new Set();
    if (correctIndex >= 0) chosen.add(correctIndex);
    const pool = availableQuestions.map((_, i) => i).filter(i => i !== correctIndex);
    while (chosen.size < Math.min(3, availableQuestions.length) && pool.length) {
        const j = Math.floor(Math.random() * pool.length);
        chosen.add(pool[j]); pool.splice(j, 1);
    }
    const arr = Array.from(chosen);
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    for (const idx of arr) {
        createOptionBubble(idx);
    }
}

function createOptionBubble(idx) {
    const text = availableQuestions[idx].translation;
    const geom = new THREE.SphereGeometry(8 + 12 * Math.random(), 32, 32);
    const mat = new THREE.MeshStandardMaterial({ color: 0x4fd1ff, transparent: true, opacity: 0.85, roughness: 0.05, metalness: 0.02 });
    const sphere = new THREE.Mesh(geom, mat); sphere.castShadow = true; sphere.frustumCulled = false;
    const group = new THREE.Group(); group.add(sphere);
    const pos = new THREE.Vector3(camera.position.x + (Math.random() - 0.5) * 200, camera.position.y + 10 + Math.random() * 20, camera.position.z + (Math.random() - 0.5) * 200);
    group.position.copy(pos);
    const sprite = makeTextSprite(text); scene.add(sprite);
    group.userData = { idxParam: idx, sphere, sprite, velocity: new THREE.Vector3((Math.random()-0.5)*6, Math.random()*4+1, (Math.random()-0.5)*6), baseY: pos.y };
    scene.add(group); burbujas.push(group);
}

export function processBubbleSelection(group) {
    if (!currentQuestion) return;
    const selectedIdx = group.userData.idxParam;
    const selectedTranslation = availableQuestions[selectedIdx]?.translation || null;
    const mistakes = getMistakes();
    if (selectedTranslation === currentQuestion.translation) {
        const cleaned = mistakes.filter(m => m.pattern !== currentQuestion.pattern);
        saveMistakes(cleaned);
    } else {
        if (!mistakes.some(m => m.pattern === currentQuestion.pattern)) {
            mistakes.push({ pattern: currentQuestion.pattern });
            saveMistakes(mistakes);
        }
    }
    setTimeout(() => nextQuestion(), 550);
}

export function getBurbujas() { return burbujas; }
export function getCurrentQuestion() { return currentQuestion; }
