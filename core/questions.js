// core/questions.js
(function(global){

  // ==== Datos base ====
  const allVerbs = {
    rest: { rootEn: "REST", rootEs: "DESCANS", selected: true },
    work: { rootEn: "WORK", rootEs: "TRABAJ", selected: true },
    walk: { rootEn: "WALK", rootEs: "CAMIN", selected: true },
    help: { rootEn: "HELP", rootEs: "AYUD", selected: true },
    visit:{ rootEn: "VISIT", rootEs: "VISIT", selected: false },
    wait: { rootEn: "WAIT", rootEs: "ESPER", selected: true },
    call: { rootEn: "CALL", rootEs: "LLAM", selected: false }
  };

  const pronouns = [
    "I","I HAVE","IF I",
    "YOU","YOU HAVE","IF YOU",
    "HE","HE HAS","IF HE",
    "WE","WE HAVE","IF WE",
    "YOU ALL","YOU ALL HAVE","IF YOU ALL",
    "THEY","THEY HAVE","IF THEY"
  ];

  const pronounGroups = {
    yo: ["I","I HAVE","IF I"],
    tu: ["YOU","YOU HAVE","IF YOU"],
    el: ["HE","HE HAS","IF HE"],
    nosotros: ["WE","WE HAVE","IF WE"],
    vosotros: ["YOU ALL","YOU ALL HAVE","IF YOU ALL"],
    ellos: ["THEY","THEY HAVE","IF THEY"]
  };

  // ==== Estado interno ====
  let availableVerbs = [];
  let usedVerbHistory = [];
  let usedPronouns = [];
  let selectedPronouns = [...pronouns];
  let currentQuestion = null;

  // Play-group state
  let playGroupOptions = false;
  let activePronounGroup = null;

  // ==== Utilidades ====
  function shuffleArray(array){ for(let i=array.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [array[i],array[j]]=[array[j],array[i]];} return array; }
  function pickRandom(array, usedArray){ if(!Array.isArray(array)||array.length===0) return undefined; if(usedArray.length>=array.length) usedArray.length=0; const available=array.filter(o=>!usedArray.includes(o)); const item=available[Math.floor(Math.random()*available.length)]; usedArray.push(item); return item; }

  // ==== Generador de preguntas (replicando recu4.txt) ====
  function generateQuestions(verb, pronoun){
    const { rootEn, rootEs } = verb;
    let questionSet = [];

    if (pronoun === "I") {
      questionSet = [
        { question: `I ${rootEn}ED`, translation: `${rootEs}É` },
        { question: `I USED TO ${rootEn}`, translation: `${rootEs}ABA` },
        { question: `I ${rootEn}`, translation: `${rootEs}O` },
        { question: `I WILL ${rootEn}`, translation: `${rootEs}ARÉ` },
        { question: `I WOULD ${rootEn}`, translation: `${rootEs}ARÍA` }
      ];
    } else if (pronoun === "I HAVE") {
      questionSet = [
        { question: `I HAD ${rootEn}ED`, translation: `HABÍA ${rootEs}ADO` },
        { question: `I HAVE ${rootEn}ED`, translation: `HE ${rootEs}ADO` },
        { question: `I WOULD HAVE ${rootEn}ED`, translation: `HABRÍA ${rootEs}ADO` }
      ];
    } else if (pronoun === "IF I") {
      questionSet = [
        { question: `IF I HAD ${rootEn}ED`, translation: `SI HUBIERA ${rootEs}ADO` },
        { question: `IF I ${rootEn}ED`, translation: `SI ${rootEs}ARA` },
        { question: `IF I WAS ${rootEn}ING`, translation: `SI ESTUVIERA ${rootEs}ANDO` }
      ];
    } else if (pronoun === "YOU") {
      questionSet = [
        { question: `YOU ${rootEn}ED`, translation: `${rootEs}ASTE` },
        { question: `YOU USED TO ${rootEn}`, translation: `${rootEs}ABAS` },
        { question: `YOU ${rootEn}`, translation: `${rootEs}AS` },
        { question: `YOU WILL ${rootEn}`, translation: `${rootEs}ARÁS` },
        { question: `YOU WOULD ${rootEn}`, translation: `${rootEs}ARÍAS` }
      ];
    } else if (pronoun === "YOU HAVE") {
      questionSet = [
        { question: `YOU HAD ${rootEn}ED`, translation: `HABÍAS ${rootEs}ADO` },
        { question: `YOU HAVE ${rootEn}ED`, translation: `HAS ${rootEs}ADO` },
        { question: `YOU WOULD HAVE ${rootEn}ED`, translation: `HABRÍAS ${rootEs}ADO` }
      ];
    } else if (pronoun === "IF YOU") {
      questionSet = [
        { question: `IF YOU HAD ${rootEn}ED`, translation: `SI HUBIERAS ${rootEs}ADO` },
        { question: `IF YOU ${rootEn}ED`, translation: `SI ${rootEs}ARAS` },
        { question: `IF YOU WERE ${rootEn}ING`, translation: `SI ESTUVIERAS ${rootEs}ANDO` }
      ];
    } else if (pronoun === "HE") {
      questionSet = [
        { question: `HE ${rootEn}ED`, translation: `${rootEs}Ó` },
        { question: `HE USED TO ${rootEn}`, translation: `${rootEs}ABA` },
        { question: `HE ${rootEn}`, translation: `${rootEs}A` },
        { question: `HE WILL ${rootEn}`, translation: `${rootEs}ARÁ` },
        { question: `HE WOULD ${rootEn}`, translation: `${rootEs}ARÍA` }
      ];
    } else if (pronoun === "HE HAS") {
      questionSet = [
        { question: `HE HAD ${rootEn}ED`, translation: `HABÍA ${rootEs}ADO` },
        { question: `HE HAS ${rootEn}ED`, translation: `HA ${rootEs}ADO` },
        { question: `HE WOULD HAVE ${rootEn}ED`, translation: `HABRÍA ${rootEs}ADO` }
      ];
    } else if (pronoun === "IF HE") {
      questionSet = [
        { question: `IF HE HAD ${rootEn}ED`, translation: `SI HUBIERA ${rootEs}ADO` },
        { question: `IF HE ${rootEn}ED`, translation: `SI ${rootEs}ARA` },
        { question: `IF HE WAS ${rootEn}ING`, translation: `SI ESTUVIERA ${rootEs}ANDO` }
      ];
    } else if (pronoun === "WE") {
      questionSet = [
        { question: `WE ${rootEn}ED`, translation: `${rootEs}AMOS` },
        { question: `WE USED TO ${rootEn}`, translation: `${rootEs}ÁBAMOS` },
        { question: `WE ${rootEn}`, translation: `${rootEs}AMOS` },
        { question: `WE WILL ${rootEn}`, translation: `${rootEs}AREMOS` },
        { question: `WE WOULD ${rootEn}`, translation: `${rootEs}ARÍAMOS` }
      ];
    } else if (pronoun === "WE HAVE") {
      questionSet = [
        { question: `WE HAD ${rootEn}ED`, translation: `HABÍAMOS ${rootEs}ADO` },
        { question: `WE HAVE ${rootEn}ED`, translation: `HEMOS ${rootEs}ADO` },
        { question: `WE WOULD HAVE ${rootEn}ED`, translation: `HABRÍAMOS ${rootEs}ADO` }
      ];
    } else if (pronoun === "IF WE") {
      questionSet = [
        { question: `IF WE HAD ${rootEn}ED`, translation: `SI HUBIÉRAMOS ${rootEs}ADO` },
        { question: `IF WE ${rootEn}ED`, translation: `SI ${rootEs}ÁRAMOS` },
        { question: `IF WE WERE ${rootEn}ING`, translation: `SI ESTUVIÉRAMOS ${rootEs}ANDO` }
      ];
    } else if (pronoun === "YOU ALL") {
      questionSet = [
        { question: `YOU ALL ${rootEn}ED`, translation: `${rootEs}ASTEIS` },
        { question: `YOU ALL USED TO ${rootEn}`, translation: `${rootEs}ABAIS` },
        { question: `YOU ALL ${rootEn}`, translation: `${rootEs}ÁIS` },
        { question: `YOU ALL WILL ${rootEn}`, translation: `${rootEs}ARÉIS` },
        { question: `YOU ALL WOULD ${rootEn}`, translation: `${rootEs}ARÍAIS` }
      ];
    } else if (pronoun === "YOU ALL HAVE") {
      questionSet = [
        { question: `YOU ALL HAD ${rootEn}ED`, translation: `HABÍAIS ${rootEs}ADO` },
        { question: `YOU ALL HAVE ${rootEn}ED`, translation: `HABÉIS ${rootEs}ADO` },
        { question: `YOU ALL WOULD HAVE ${rootEn}ED`, translation: `HABRÍAIS ${rootEs}ADO` }
      ];
    } else if (pronoun === "IF YOU ALL") {
      questionSet = [
        { question: `IF YOU ALL HAD ${rootEn}ED`, translation: `SI HUBIERAIS ${rootEs}ADO` },
        { question: `IF YOU ALL ${rootEn}ED`, translation: `SI ${rootEs}ARAIS` },
        { question: `IF YOU ALL WERE ${rootEn}ING`, translation: `SI ESTUVIERAIS ${rootEs}ANDO` }
      ];
    } else if (pronoun === "THEY") {
      questionSet = [
        { question: `THEY ${rootEn}ED`, translation: `${rootEs}ARON` },
        { question: `THEY USED TO ${rootEn}`, translation: `${rootEs}ABAN` },
        { question: `THEY ${rootEn}`, translation: `${rootEs}AN` },
        { question: `THEY WILL ${rootEn}`, translation: `${rootEs}ARÁN` },
        { question: `THEY WOULD ${rootEn}`, translation: `${rootEs}ARÍAN` }
      ];
    } else if (pronoun === "THEY HAVE") {
      questionSet = [
        { question: `THEY HAD ${rootEn}ED`, translation: `HABÍAN ${rootEs}ADO` },
        { question: `THEY HAVE ${rootEn}ED`, translation: `HAN ${rootEs}ADO` },
        { question: `THEY WOULD HAVE ${rootEn}ED`, translation: `HABRÍAN ${rootEs}ADO` }
      ];
    } else if (pronoun === "IF THEY") {
      questionSet = [
        { question: `IF THEY HAD ${rootEn}ED`, translation: `SI HUBIERAN ${rootEs}ADO` },
        { question: `IF THEY ${rootEn}ED`, translation: `SI ${rootEs}ARAN` },
        { question: `IF THEY WERE ${rootEn}ING`, translation: `SI ESTUVIERAN ${rootEs}ANDO` }
      ];
    }

    return questionSet.map(item => ({ question: item.question, translation: item.translation, pattern: item.question }));
  }

  // ==== Helpers de estado ====
  function updateAvailableVerbs(){ availableVerbs = Object.keys(allVerbs).filter(k => allVerbs[k].selected); }

  // ==== Toggle grupo de pronombres ====
  function togglePronounGroupByName(groupName){
    const group = pronounGroups[groupName];
    if(!group) return;
    const allSelected = group.every(p => selectedPronouns.includes(p));
    if(allSelected) selectedPronouns = selectedPronouns.filter(p => !group.includes(p));
    else group.forEach(p => { if(!selectedPronouns.includes(p)) selectedPronouns.push(p); });

    activePronounGroup = group.some(p => selectedPronouns.includes(p)) ? groupName : null;
    saveStateToStorage();
  }

  function togglePronoun(pronoun){
    const idx = selectedPronouns.indexOf(pronoun);
    if(idx === -1) selectedPronouns.push(pronoun); else selectedPronouns.splice(idx,1);
    activePronounGroup = null;
    saveStateToStorage();
  }

  function toggleVerb(verbKey){
    if(allVerbs[verbKey]){ allVerbs[verbKey].selected = !allVerbs[verbKey].selected; saveStateToStorage(); updateAvailableVerbs(); }
  }

  function selectAllPronouns(){
    selectedPronouns = [...pronouns];
    activePronounGroup = null;
    saveStateToStorage();
  }
  function deselectAllPronouns(){
    selectedPronouns = [];
    activePronounGroup = null;
    saveStateToStorage();
  }

  function setPlayGroup(enabled){
    playGroupOptions = !!enabled;
    if(playGroupOptions && !activePronounGroup){
      for(const [gName,gPronouns] of Object.entries(pronounGroups)){
        if(gPronouns.some(p => selectedPronouns.includes(p))){
          activePronounGroup = gName; break;
        }
      }
    }
    if(!playGroupOptions) activePronounGroup = null;
    saveStateToStorage();
  }

  function setActivePronounGroup(name){
    if(!pronounGroups[name]) { activePronounGroup = null; saveStateToStorage(); return; }
    const groupPronouns = pronounGroups[name];
    // make sure at least some are selected
    const usable = groupPronouns.filter(p => selectedPronouns.includes(p));
    if(usable.length===0){
      // nothing to set as active
      activePronounGroup = null;
    } else {
      activePronounGroup = name;
    }
    saveStateToStorage();
  }

  // ==== getNextQuestion con playGroup ====
  function getNextQuestion(){
    updateAvailableVerbs();
    if(availableVerbs.length === 0) return null;
    if(usedVerbHistory.length >= availableVerbs.length) usedVerbHistory.length = 0;
    if(selectedPronouns.length === 0) selectedPronouns = [...pronouns];

    const randomVerbKey = pickRandom(availableVerbs, usedVerbHistory);
    const selectedVerb = allVerbs[randomVerbKey];
    if(!randomVerbKey) return null;

    // --- playGroup mode ---
    if(playGroupOptions){
      // find groups that have at least one selected pronoun
      const validGroups = Object.entries(pronounGroups).filter(([gName, gPronouns]) => gPronouns.some(p => selectedPronouns.includes(p)));
      if(validGroups.length === 0) return null;

      let chosenGroupName = null;
      if(activePronounGroup && validGroups.some(([gName]) => gName === activePronounGroup)) {
        chosenGroupName = activePronounGroup;
      } else {
        const idx = Math.floor(Math.random() * validGroups.length);
        chosenGroupName = validGroups[idx][0];
      }
      const groupPronouns = pronounGroups[chosenGroupName];
      const usablePronouns = groupPronouns.filter(p => selectedPronouns.includes(p));
      let combinedQuestions = [];
      usablePronouns.forEach(p => {
        combinedQuestions = combinedQuestions.concat(generateQuestions(selectedVerb, p));
      });

      if(combinedQuestions.length === 0) return null;
      const randomIndex = Math.floor(Math.random() * combinedQuestions.length);
      currentQuestion = combinedQuestions[randomIndex];
      // options: translations from combinedQuestions (shuffled)
      const options = shuffleArray(combinedQuestions.map(q => q.translation));
      return {
        question: currentQuestion.question,
        translation: currentQuestion.translation,
        options,
        playGroup: true,
        activePronounGroup: chosenGroupName
      };
    }

    // --- normal mode ---
    const randomPronoun = pickRandom(selectedPronouns, usedPronouns);
    if(!randomPronoun) return null;
    const generated = generateQuestions(selectedVerb, randomPronoun);
    const randomIndex = Math.floor(Math.random() * generated.length);
    currentQuestion = generated[randomIndex];
    return {
      question: currentQuestion.question,
      translation: currentQuestion.translation,
      options: shuffleArray(generated.map(q => q.translation)),
      playGroup: false,
      activePronounGroup: null
    };
  }

  // ==== Recovery question (simple) ====
  function getRecoveryQuestion(){
    const mistakes = (typeof StorageAPI !== 'undefined') ? StorageAPI.getMistakes() : [];
    if(!mistakes || mistakes.length === 0) return null;
    const idx = Math.floor(Math.random()*mistakes.length);
    return mistakes[idx];
  }

  // ==== Persistence (uses StorageAPI which is loaded before this file in index.html) ====
  function saveStateToStorage(){
    try {
      const verbs = Object.keys(allVerbs).filter(k => allVerbs[k].selected);
      if(typeof StorageAPI !== 'undefined') StorageAPI.saveSelectedVerbs(verbs);
      if(typeof StorageAPI !== 'undefined') StorageAPI.saveSelectedPronouns(selectedPronouns);
      if(typeof StorageAPI !== 'undefined') StorageAPI.savePlayGroupState({ playGroupOptions, activePronounGroup });
    } catch(e){}
  }

  function loadStateFromStorage(){
    try {
      if(typeof StorageAPI !== 'undefined'){
        const sv = StorageAPI.loadSelectedVerbs();
        if(Array.isArray(sv) && sv.length>0){
          Object.keys(allVerbs).forEach(k => allVerbs[k].selected = sv.includes(k));
        }
        const sp = StorageAPI.loadSelectedPronouns();
        if(Array.isArray(sp) && sp.length>0) selectedPronouns = sp.filter(p => pronouns.includes(p));
        const pg = StorageAPI.loadPlayGroupState();
        if(pg && typeof pg.playGroupOptions !== 'undefined'){
          playGroupOptions = !!pg.playGroupOptions;
          activePronounGroup = (typeof pg.activePronounGroup === 'string') ? pg.activePronounGroup : null;
        }
      }
    } catch(e){}
    updateAvailableVerbs();
  }

  // ==== API pública ====
  const QuestionsAPI = {
    allVerbs,
    pronouns,
    pronounGroups,
    // state accessors
    isPlayGroup(){ return !!playGroupOptions; },
    getActivePronounGroup(){ return activePronounGroup; },
    getSelectedPronouns(){ return selectedPronouns.slice(); },
    getSelectedVerbs(){ return Object.keys(allVerbs).filter(k => allVerbs[k].selected); },
    // actions
    toggleVerb,
    togglePronoun,
    togglePronounGroupByName,
    selectAllPronouns,
    deselectAllPronouns,
    setPlayGroup,
    setActivePronounGroup,
    saveStateToStorage,
    loadStateFromStorage,
    // questions
    getNextQuestion,
    getRecoveryQuestion
  };

  // init from storage (if any)
  loadStateFromStorage();

  global.QuestionsAPI = QuestionsAPI;

})(window);
