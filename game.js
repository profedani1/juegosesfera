
// game.txt - lógica del juego (usa la API expuesta)
(function(){
  console.log("Game module listo");
  (function(){
  // Config y datos (puedes ampliarlos)
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

  function shuffleArray(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } }

  function shuffleSetPhrasesAndTranslations(set){
    const paired = set.phrases.map((p,i)=>({phrase:p, translation:set.translations[i]}));
    shuffleArray(paired);
    set.phrases = paired.map(x=>x.phrase);
    set.translations = paired.map(x=>x.translation);
  }

  function getRandomDataSet(){
    if(usedSets.length === dataSets.length) usedSets = [];
    shuffleArray(dataSets);
    let idx;
    do{ idx = Math.floor(Math.random()*dataSets.length); } while(usedSets.includes(idx));
    usedSets.push(idx);
    return dataSets[idx];
  }

  function generateCombinations(sections, index=0, curPhrase="", curTrans="", out=[]){
    if(index===sections.length){ out.push({phrase:curPhrase.trim(), translation:curTrans.trim()}); return out; }
    sections[index].phrases.forEach((p,i)=>{
      generateCombinations(sections, index+1, curPhrase+" "+p, curTrans+" "+sections[index].translations[i], out);
    });
    return out;
  }

  function splitTranslation(translation){
    let words = [];
    let remaining = translation.trim();
    while(remaining){
      let match = exceptions.find(ex => remaining.startsWith(ex));
      if(match){ words.push(match); remaining = remaining.slice(match.length).trim(); }
      else {
        const firstSpace = remaining.indexOf(' ');
        if(firstSpace === -1){ words.push(remaining); remaining=''; }
        else { words.push(remaining.slice(0, firstSpace)); remaining = remaining.slice(firstSpace+1).trim(); }
      }
    }
    return words;
  }

  function createColumnsByWordPosition(translations){
    const positions = [];
    translations.forEach(t=>{
      const words = splitTranslation(t);
      words.forEach((w,i)=>{
        if(!positions[i]) positions[i] = new Set();
        positions[i].add(w);
      });
    });
    return positions.map(s=>Array.from(s));
  }

  // --- API polling para esperar a que jumper.txt exponga window.__CITY_API
  function waitForCityAPI(timeoutMs = 5000){
    return new Promise((resolve, reject) => {
      const start = performance.now();
      (function poll(){
        if(window.__CITY_API && window.__CITY_API.scene && window.__CITY_API.buildingGroup && window.__CITY_API.playerPos){
          resolve(window.__CITY_API);
          return;
        }
        if(performance.now() - start > timeoutMs){
          reject(new Error("No se encontró window.__CITY_API en el tiempo esperado."));
          return;
        }
        setTimeout(poll, 100);
      })();
    });
  }

  // --- Util: crear sprite de texto para Three.js
  function makeTextSpriteTHREE(message){
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const fontSize = 48;
    ctx.font = `bold ${fontSize}px sans-serif`;
    // ajustar canvas al texto
    const metrics = ctx.measureText(message);
    const w = Math.ceil(metrics.width + 40);
    const h = fontSize + 40;
    canvas.width = w;
    canvas.height = h;
    // dibujar con stroke para legibilidad
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textBaseline = 'top';
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    ctx.strokeText(message, 20, 10);
    ctx.fillStyle = 'white';
    ctx.fillText(message, 20, 10);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    // escalado razonable en unidades del mundo (ajustable)
    const scaleFactor = 0.06; // reduce a un valor visible
    sprite.scale.set(w * scaleFactor, h * scaleFactor, 1);
    return sprite;
  }

  // --- Juego
  let api = null;
  let currentCombinations = [];
  let currentAnswerWords = [];
  let activeBuildings = []; // edificios actualmente con palabras
  let lastLandedBuildingId = null;
  let landedPreviously = false;

  function clearGameSprites(){
    if(!api) return;
    activeBuildings.forEach(obj=>{
      if(obj.sprite){
        try{ api.scene.remove(obj.sprite); } catch(e){}
      }
      delete obj.building.userData.gameWord;
      delete obj.building.userData.gameSprite;
    });
    activeBuildings = [];
  }

  function pickBuildingsAndPlaceWords(words){
    // recoge edificios válidos (los que tienen userData.worldPos)
    const buildings = [];
    api.buildingGroup.children.forEach(child=>{
      if(child && child.userData && child.userData.worldPos && child.visible && child.isMesh){
        buildings.push(child);
      }
    });
    shuffleArray(buildings);
    const used = [];
    for(let i=0;i<Math.min(words.length, buildings.length); i++){
      const b = buildings[i];
      const word = words[i];
      const sprite = makeTextSpriteTHREE(word);
      // eleva el sprite un poco arriba del building top
      const topY = (b.userData && b.userData.topY) ? b.userData.topY : (b.position.y + (b.scale.y/2));
      sprite.position.set(b.position.x, topY + 1.0, b.position.z);
      api.scene.add(sprite);
      b.userData.gameWord = word;
      b.userData.gameSprite = sprite;
      used.push({ building: b, word, sprite });
    }
    activeBuildings = used;
  }

  function chooseWordsForQuestion(combos){
    const columns = createColumnsByWordPosition(combos.map(c=>c.translation));
    let allWords = [];
    columns.forEach(c=>allWords.push(...c));
    allWords = [...new Set(allWords)];
    shuffleArray(allWords);
    // words to show = correct words + some distractors (max 16)
    const wordsToShow = currentAnswerWords.concat(allWords.slice(0, Math.max(0, Math.min(16, allWords.length-1))));
    shuffleArray(wordsToShow);
    return wordsToShow;
  }

  function loadQuestion(){
    clearGameSprites();
    const selectedData = getRandomDataSet();
    selectedData.forEach(shuffleSetPhrasesAndTranslations);
    currentCombinations = generateCombinations(selectedData);
    const chosen = currentCombinations[Math.floor(Math.random() * currentCombinations.length)];
    currentAnswerWords = splitTranslation(chosen.translation);
    // escribir la pregunta en el UI (usamos #ui del HTML ya presente)
    const uiEl = document.getElementById('ui') || (function(){
      const d = document.createElement('div'); d.id='ui'; d.style.position='fixed'; d.style.left='10px'; d.style.top='10px'; d.style.zIndex=9999; document.body.appendChild(d); return d;
    })();
    uiEl.innerText = chosen.phrase;

    const wordsToShow = chooseWordsForQuestion(currentCombinations);
    pickBuildingsAndPlaceWords(wordsToShow);
  }

  // detectar aterrizajes: comprobamos la posición playerPos y si coincide con un building cercano
  function detectLandingAndValidate(){
    if(!api) return;
    const p = api.playerPos;
    if(!p) return;
    // encontrar edificio cercano (dentro de radio)
    let nearest = null;
    let nearestDist = Infinity;
    activeBuildings.forEach(obj=>{
      const b = obj.building;
      const dx = p.x - b.userData.worldPos.x;
      const dz = p.z - b.userData.worldPos.z;
      const dist = Math.hypot(dx, dz);
      if(dist < nearestDist){ nearestDist = dist; nearest = obj; }
    });
    if(!nearest) { landedPreviously = false; return; }
    const buildingTop = nearest.building.userData.topY;
    // criterio de "aterrizado": proximidad en XZ y Y suficientemente cerca al top + camera height
    const horizontalThreshold = Math.max( (nearest.building.scale.x / 2) + 0.5, 1.4 );
    const verticalThreshold = 1.0; // tolerancia en altura
    const onTopYX = Math.abs( (buildingTop + (api.cameraEyeHeight || 2.0)) - p.y ) < verticalThreshold;
    const onTopXZ = nearestDist < horizontalThreshold;

    const id = nearest.building.id || (nearest.building.uuid || (nearest.building.userData && nearest.building.userData.worldPos && JSON.stringify(nearest.building.userData.worldPos)));
    if(onTopYX && onTopXZ){
      if(!landedPreviously || lastLandedBuildingId !== id){
        // nuevo aterrizaje detectado
        lastLandedBuildingId = id;
        landedPreviously = true;
        validateLanding(nearest);
      }
    } else {
      landedPreviously = false;
      lastLandedBuildingId = null;
    }
  }

  function validateLanding(obj){
    const word = obj.word || obj.building.userData.gameWord;
    if(!word) return;
    const correct = currentAnswerWords.includes(word);
    if(correct){
      // feedback visual: agrandar sprite y parpadeo
      try{
        const s = obj.building.userData.gameSprite;
        if(s){
          const origScale = s.scale.clone();
          // anim simple (no dependencia) con requestAnimationFrame
          let phase = 0;
          const anim = ()=>{
            phase += 0.08;
            s.scale.set(origScale.x * (1+Math.sin(phase)*0.15), origScale.y * (1+Math.sin(phase)*0.15), 1);
            if(phase < Math.PI*2){
              requestAnimationFrame(anim);
            } else {
              // restaurar
              s.scale.copy(origScale);
            }
          };
          anim();
        }
      }catch(e){}
      // cargar siguiente pregunta tras una pequeña espera
      setTimeout(()=>{ loadQuestion(); }, 450);
    } else {
      // wrong feedback: flash red stroke on canvas texture
      try{
        const s = obj.building.userData.gameSprite;
        if(s && s.material && s.material.map){
          // tint temporal: bajar alpha y restaurar
          const mat = s.material;
          const oldOpacity = mat.opacity;
          mat.opacity = 0.6;
          setTimeout(()=>{ mat.opacity = oldOpacity; }, 300);
        }
      }catch(e){}
    }
  }

  // iniciar: esperar API y lanzar el juego
  waitForCityAPI(8000).then(apiObj=>{
    api = apiObj;
    // hook: si #ui ya existe, lo usamos; si no, lo creamos.
    const uiEl = document.getElementById('ui') || (function(){ const d=document.createElement('div'); d.id='ui'; d.style.position='fixed'; d.style.left='10px'; d.style.top='10px'; d.style.zIndex=9999; document.body.appendChild(d); return d; })();

    // primera carga
    loadQuestion();

    // chequear aterrizajes periódicamente (no interfiere con el loop de jumper)
    setInterval(detectLandingAndValidate, 120);

    // si quieres detectar salto por tecla o iniciar salto desde el juego:
    // puedes usar api.startJump(targetVec) (si startJump fue expuesto).
    console.log("Game module conectado a city API. Juego iniciado.");
  }).catch(err=>{
    console.warn("[game.txt] No se pudo conectar a la API de la ciudad:", err);
  });

})();


})();
