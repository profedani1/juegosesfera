// Manejo de localStorage para errores
(function(global){
  const STORAGE_KEY = 'translationMistakesV1';

  function getMistakes(){
    try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : []; }
    catch(e){ return []; }
  }

  function saveMistakes(arr){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr, null, 2)); } catch(e){}
    // refrescar UI básica
    const cntEl = document.getElementById('mistakeCount');
    if(cntEl) cntEl.textContent = (arr && arr.length) ? arr.length : 0;
    const log = document.getElementById('mistakeLog');
    if(log) log.value = JSON.stringify(arr || [], null, 2);
  }

  function markWrong(pattern){
    if(!pattern) return;
    const mistakes = getMistakes();
    if(!mistakes.some(m=>m.pattern===pattern)){
      mistakes.push({ pattern });
      saveMistakes(mistakes);
    } else {
      saveMistakes(mistakes);
    }
  }

  function clearIfCorrect(pattern){
    if(!pattern) return;
    const cleaned = getMistakes().filter(m=>m.pattern!==pattern);
    saveMistakes(cleaned);
  }

  global.StorageAPI = { getMistakes, saveMistakes, markWrong, clearIfCorrect };
})(window);
