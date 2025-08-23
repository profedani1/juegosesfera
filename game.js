// game.js
let sceneRef, buildingGroupRef, uiRef;
let currentAnswer = [];
let allBuildings = [];

function initGame(scene, buildingGroup, ui){
  sceneRef = scene;
  buildingGroupRef = buildingGroup;
  uiRef = ui;
  loadQuestion();
}

const data = [
  {
    phrases: ["I USED TO WORK","I USED TO REST","I USED TO WALK"],
    translations: ["YO TRABAJABA","YO DESCANSABA","YO CAMINABA"]
  },
  {
    phrases: ["IN THE HOUSE","IN THE OFFICE","IN THE AVENUE"],
    translations: ["en la casa","en la oficina","en la avenida"]
  }
];

const exceptions = ["en la casa","en la oficina","en la avenida"];
const dataSets = [data];
let usedSets = [];

function shuffleArray(array){for(let i=array.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[array[i],array[j]]=[array[j],array[i]];}}
function shuffleSetPhrasesAndTranslations(set){const paired=set.phrases.map((p,i)=>({phrase:p,translation:set.translations[i]}));shuffleArray(paired);set.phrases=paired.map(x=>x.phrase);set.translations=paired.map(x=>x.translation);}
function getRandomDataSet(){if(usedSets.length===dataSets.length) usedSets=[];shuffleArray(dataSets);let idx;do{idx=Math.floor(Math.random()*dataSets.length);}while(usedSets.includes(idx));usedSets.push(idx);return dataSets[idx];}
function generateCombinations(sections,index=0,currentPhrase="",currentTranslation="",combinations=[]){if(index===sections.length){combinations.push({phrase:currentPhrase.trim(),translation:currentTranslation.trim()});return combinations;}sections[index].phrases.forEach((phrase,i)=>{generateCombinations(sections,index+1,currentPhrase+" "+phrase,currentTranslation+" "+sections[index].translations[i],combinations);});return combinations;}
function splitTranslation(translation){let words=[]; let remaining=translation.trim();while(remaining){let match=exceptions.find(ex=>remaining.startsWith(ex));if(match){words.push(match); remaining=remaining.slice(match.length).trim();}else{const firstSpace=remaining.indexOf(' ');if(firstSpace===-1){words.push(remaining);remaining='';}else{words.push(remaining.slice(0,firstSpace));remaining=remaining.slice(firstSpace+1).trim();}}}return words;}
function createColumnsByWordPosition(translations){const wordPositions=[];translations.forEach(t=>{const words=splitTranslation(t);words.forEach((w,i)=>{if(!wordPositions[i]) wordPositions[i]= new Set();wordPositions[i].add(w);});});return wordPositions.map(s=>Array.from(s));}

function loadQuestion(){
  const selectedData = getRandomDataSet();
  selectedData.forEach(shuffleSetPhrasesAndTranslations);
  const combos = generateCombinations(selectedData);
  const {phrase,translation} = combos[Math.floor(Math.random()*combos.length)];
  currentAnswer = splitTranslation(translation);

  uiRef.innerText = phrase;

  // Limpiar sprites anteriores
  buildingGroupRef.children.forEach(b=>{
    if(b.userData.sprite){
      sceneRef.remove(b.userData.sprite);
      b.userData.sprite = null;
    }
  });

  // Obtener edificios visibles
  allBuildings = [];
  buildingGroupRef.children.forEach(b=>{
    if(b.isMesh && b.visible && b.userData && b.userData.worldPos){
      allBuildings.push(b);
    }
  });

  const columnsData = createColumnsByWordPosition(combos.map(c=>c.translation));
  let allWords = [];
  columnsData.forEach(c=>allWords.push(...c));
  allWords = [...new Set(allWords)];
  shuffleArray(allWords);

  const wordsToShow = currentAnswer.concat(allWords.slice(0, Math.min(15, allWords.length)));
  shuffleArray(wordsToShow);

  for(let i=0; i<wordsToShow.length && i<allBuildings.length; i++){
    const b = allBuildings[i];
    const sprite = makeTextSprite(wordsToShow[i]);
    sprite.position.set(b.position.x, b.userData.topY + 1.5, b.position.z);
    sceneRef.add(sprite);
    b.userData.sprite = sprite;
    b.userData.word = wordsToShow[i];
  }
}

function makeTextSprite(message){
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = 'bold 32px Arial';
  context.strokeStyle = 'black';
  context.lineWidth = 6;
  context.strokeText(message, 10, 40);
  context.fillStyle = 'white';
  context.fillText(message, 10, 40);
  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(10, 5, 1);
  return sprite;
}

function checkLanding(playerPos){
  allBuildings.forEach(b=>{
    if(Math.abs(playerPos.x - b.userData.worldPos.x) < 4 &&
       Math.abs(playerPos.z - b.userData.worldPos.z) < 4){
      if(currentAnswer.includes(b.userData.word)){
        console.log("¡Correcto!", b.userData.word);
        loadQuestion();
      } else {
        console.log("Incorrecto:", b.userData.word);
      }
    }
  });
}
