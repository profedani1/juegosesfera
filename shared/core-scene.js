import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js';

export const CITY_BLOCK_SIZE = 7.5;
export const BLOCKS_RANGE = 8;
export const GRID_SIZE = BLOCKS_RANGE * 2 + 1;
export const STREET_EVERY = 5;
export const SIDEWALK_HEIGHT = 0.2;
export const BUILDING_PADDING = 0.6;

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

export const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 900);
export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});

const addLight = (Type, i, p, sh = false) => {
    const L = new Type(0xffffff, i);
    L.position.set(...p);
    if (sh) {
        L.castShadow = true;
        L.shadow.mapSize.width = 2048;
        L.shadow.mapSize.height = 2048;
    }
    scene.add(L);
};
addLight(THREE.DirectionalLight, 1.1, [50, 100, 50], true);
addLight(THREE.DirectionalLight, 0.35, [-50, 40, -60]);
scene.add(new THREE.AmbientLight(0x666666));

const mats = {
    road: new THREE.MeshStandardMaterial({ color: 0x9b9b9b }),
    sidewalk: new THREE.MeshStandardMaterial({ color: 0xbdbdbd }),
    border: new THREE.MeshStandardMaterial({ color: 0x000000 })
};
const buildingColors = [0x8B8B7A, 0xA0522D, 0xC0C0C0, 0x708090, 0xB0C4DE, 0xD2B48C];
const buildingMats = buildingColors.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: .6, metalness: .05 }));

export const buildingGroup = new THREE.Group();
scene.add(buildingGroup);
const unitBoxGeom = new THREE.BoxGeometry(1, 1, 1);
export const grid = [];
export const raycastTargets = [];

for (let i = 0; i < GRID_SIZE; i++) {
    grid[i] = [];
    for (let j = 0; j < GRID_SIZE; j++) {
        const sidewalk = new THREE.Mesh(unitBoxGeom, mats.sidewalk);
        sidewalk.receiveShadow = true;
        sidewalk.scale.set(CITY_BLOCK_SIZE, SIDEWALK_HEIGHT, CITY_BLOCK_SIZE);
        buildingGroup.add(sidewalk);
        const bn = new THREE.Mesh(unitBoxGeom, mats.border),
            be = new THREE.Mesh(unitBoxGeom, mats.border),
            bs = new THREE.Mesh(unitBoxGeom, mats.border),
            bw = new THREE.Mesh(unitBoxGeom, mats.border);
        bn.visible = be.visible = bs.visible = bw.visible = false;
        buildingGroup.add(bn, be, bs, bw);
        const building = new THREE.Mesh(unitBoxGeom, buildingMats[0]);
        building.castShadow = building.receiveShadow = true;
        building.visible = false;
        buildingGroup.add(building);
        const buildingEdges = new THREE.LineSegments(new THREE.EdgesGeometry(unitBoxGeom), new THREE.LineBasicMaterial({ color: 0x000 }));
        buildingEdges.visible = false;
        buildingGroup.add(buildingEdges);
        const baseEdge = new THREE.LineSegments(new THREE.EdgesGeometry(unitBoxGeom), new THREE.LineBasicMaterial({ color: 0x000 }));
        baseEdge.visible = false;
        buildingGroup.add(baseEdge);
        raycastTargets.push(sidewalk, building);
        grid[i][j] = { sidewalk, borders: { N: bn, E: be, S: bs, W: bw }, building, buildingEdges, baseEdge };
    }
}

let baseX = Math.floor(-BLOCKS_RANGE),
    baseZ = Math.floor(-BLOCKS_RANGE);

const mod = (n, m) => ((n % m) + m) % m;
export const isStreetAt = (bx, bz) => (mod(bx, STREET_EVERY) === 0) || (mod(bz, STREET_EVERY) === 0);

// deterministic PRNG (pi digits)
const piDigits = ("14159265358979323846264338327950288419716939937510" +
    "58209749445923078164062862089986280348253421170679" +
    "82148086513282306647093844609550582231725359408128" +
    "48111745028410270193852110555964462294895493038196").split('');
const getPiRandom = (ix, iz) => parseInt(piDigits[Math.abs((ix * 374761393) ^ (iz * 668265263)) % piDigits.length]) || 1;

export function updateCell(cell, worldBlockX, worldBlockZ) {
    const worldX = worldBlockX * CITY_BLOCK_SIZE,
        worldZ = worldBlockZ * CITY_BLOCK_SIZE;
    const currentIsStreet = isStreetAt(worldBlockX, worldBlockZ);
    const sidewalk = cell.sidewalk;
    sidewalk.position.set(worldX + CITY_BLOCK_SIZE / 2, SIDEWALK_HEIGHT / 2, worldZ + CITY_BLOCK_SIZE / 2);
    sidewalk.scale.set(CITY_BLOCK_SIZE, SIDEWALK_HEIGHT, CITY_BLOCK_SIZE);
    sidewalk.material = currentIsStreet ? mats.road : mats.sidewalk;
    const northIsStreet = isStreetAt(worldBlockX, worldBlockZ + 1),
        southIsStreet = isStreetAt(worldBlockX, worldBlockZ - 1),
        eastIsStreet = isStreetAt(worldBlockX + 1, worldBlockZ),
        westIsStreet = isStreetAt(worldBlockX - 1, worldBlockZ);
    const showN = (!currentIsStreet && northIsStreet),
        showS = (!currentIsStreet && southIsStreet),
        showE = (!currentIsStreet && eastIsStreet),
        showW = (!currentIsStreet && westIsStreet);
    const borderHeight = SIDEWALK_HEIGHT + 0.02,
        borderThickness = 0.06;
    const bn = cell.borders.N;
    bn.visible = !!showN;
    if (bn.visible) {
        bn.scale.set(CITY_BLOCK_SIZE, borderHeight, borderThickness);
        bn.position.set(worldX + CITY_BLOCK_SIZE / 2, SIDEWALK_HEIGHT / 2 + (borderHeight / 2) - 0.01, worldZ + CITY_BLOCK_SIZE - borderThickness / 2);
    }
    const bs = cell.borders.S;
    bs.visible = !!showS;
    if (bs.visible) {
        bs.scale.set(CITY_BLOCK_SIZE, borderHeight, borderThickness);
        bs.position.set(worldX + CITY_BLOCK_SIZE / 2, SIDEWALK_HEIGHT / 2 + (borderHeight / 2) - 0.01, worldZ + borderThickness / 2);
    }
    const be = cell.borders.E;
    be.visible = !!showE;
    if (be.visible) {
        be.scale.set(borderThickness, borderHeight, CITY_BLOCK_SIZE);
        be.position.set(worldX + CITY_BLOCK_SIZE - borderThickness / 2, SIDEWALK_HEIGHT / 2 + (borderHeight / 2) - 0.01, worldZ + CITY_BLOCK_SIZE / 2);
    }
    const bw = cell.borders.W;
    bw.visible = !!showW;
    if (bw.visible) {
        bw.scale.set(borderThickness, borderHeight, CITY_BLOCK_SIZE);
        bw.position.set(worldX + borderThickness / 2, SIDEWALK_HEIGHT / 2 + (borderHeight / 2) - 0.01, worldZ + CITY_BLOCK_SIZE / 2);
    }
    if (currentIsStreet) {
        cell.building.visible = false;
        cell.buildingEdges.visible = false;
        cell.baseEdge.visible = false;
        cell.building.userData = {};
        return;
    }
    const seed = getPiRandom(worldBlockX, worldBlockZ);
    const h = (seed * 2) + 5;
    const buildingSize = Math.max(1, CITY_BLOCK_SIZE - (BUILDING_PADDING * 2));
    const b = cell.building;
    b.visible = true;
    b.scale.set(buildingSize, h, buildingSize);
    b.position.set(worldX + CITY_BLOCK_SIZE / 2, (h / 2) + SIDEWALK_HEIGHT, worldZ + CITY_BLOCK_SIZE / 2);
    b.material = buildingMats[seed % buildingMats.length];
    b.userData = b.userData || {};
    b.userData.worldPos = b.position.clone();
    b.userData.topY = b.position.y + (h / 2);
    const bex = cell.buildingEdges;
    bex.visible = true;
    bex.position.copy(b.position);
    bex.scale.copy(b.scale);
    const baseEdge = cell.baseEdge;
    baseEdge.visible = true;
    baseEdge.position.set(worldX + CITY_BLOCK_SIZE / 2, SIDEWALK_HEIGHT / 2 + (Math.max(.2, SIDEWALK_HEIGHT + .05) / 2), worldZ + CITY_BLOCK_SIZE / 2);
    baseEdge.scale.set(buildingSize + 0.02, Math.max(.2, SIDEWALK_HEIGHT + .05), buildingSize + 0.02);
}

export function initGridFull(bx, bz) {
    for (let i = 0; i < GRID_SIZE; i++)
        for (let j = 0; j < GRID_SIZE; j++) updateCell(grid[i][j], bx + i, bz + j);
}
initGridFull(baseX, baseZ);

export const raycaster = new THREE.Raycaster();
export const playerPos = new THREE.Vector3(0, 2.0, 0);

export { THREE };
