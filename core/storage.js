// core/storage.js
(function(global){

  const STORAGE_KEYS = {
    VERBS: 'selectedVerbsV1',
    PRONOUNS: 'selectedPronounsV1',
    MISTAKES: 'translationMistakesV1',
    PLAY_GROUP: 'playGroupOptionsV1',
    ACTIVE_PRONOUN_GROUP: 'activePronounGroupV1'
  };

  function safeParse(raw){
    try { return JSON.parse(raw); } catch(e){ return null; }
  }

  // --- Mistakes
  function getMistakes(){
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MISTAKES);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch(e){
      return [];
    }
  }

  function saveMistakes(arr){
    try {
      localStorage.setItem(STORAGE_KEYS.MISTAKES, JSON.stringify(arr, null, 2));
      if (typeof UI !== 'undefined' && UI.updateMistakeCount) UI.updateMistakeCount(arr.length);
      if (typeof UI !== 'undefined' && UI.showMistakeLog) UI.showMistakeLog(arr);
    } catch(e){}
  }

  function hasMistakes(){
    return getMistakes().length > 0;
  }

  function addMistake(questionObj){
    try {
      const arr = getMistakes();
      if(!arr.some(m => m.question === questionObj.question)){
        arr.push({
          question: questionObj.question,
          translation: questionObj.translation
        });
        saveMistakes(arr);
      }
    } catch(e){}
  }

  function clearMistakes(){
    saveMistakes([]);
  }

  // --- Verbs & Pronouns persistence
  function saveSelectedVerbs(verbs){
    try { localStorage.setItem(STORAGE_KEYS.VERBS, JSON.stringify(verbs)); } catch(e){}
  }
  function loadSelectedVerbs(){
    try { return safeParse(localStorage.getItem(STORAGE_KEYS.VERBS)) || []; } catch(e){ return []; }
  }

  function saveSelectedPronouns(pronouns){
    try { localStorage.setItem(STORAGE_KEYS.PRONOUNS, JSON.stringify(pronouns)); } catch(e){}
  }
  function loadSelectedPronouns(){
    try { return safeParse(localStorage.getItem(STORAGE_KEYS.PRONOUNS)) || []; } catch(e){ return []; }
  }

  // --- Play group state
  function savePlayGroupState(obj){
    // obj: { playGroupOptions: bool, activePronounGroup: string|null }
    try {
      localStorage.setItem(STORAGE_KEYS.PLAY_GROUP, JSON.stringify(!!obj.playGroupOptions));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PRONOUN_GROUP, JSON.stringify(obj.activePronounGroup || null));
    } catch(e){}
  }

  function loadPlayGroupState(){
    try {
      const p = safeParse(localStorage.getItem(STORAGE_KEYS.PLAY_GROUP));
      const a = safeParse(localStorage.getItem(STORAGE_KEYS.ACTIVE_PRONOUN_GROUP));
      return { playGroupOptions: !!p, activePronounGroup: (typeof a === 'string' ? a : null) };
    } catch(e){
      return { playGroupOptions: false, activePronounGroup: null };
    }
  }

  // --- API
  const StorageAPI = {
    // mistakes
    getMistakes,
    saveMistakes,
    hasMistakes,
    addMistake,
    clearMistakes,
    // verbs / pronouns
    saveSelectedVerbs,
    loadSelectedVerbs,
    saveSelectedPronouns,
    loadSelectedPronouns,
    // play-group
    savePlayGroupState,
    loadPlayGroupState
  };

  global.StorageAPI = StorageAPI;

})(window);
