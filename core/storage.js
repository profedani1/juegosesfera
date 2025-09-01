(function(global){
  const STORAGE_KEY = 'translationMistakesV1';

  function getMistakes(){
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      return s ? JSON.parse(s) : [];
    } catch(e){
      return [];
    }
  }

  function saveMistakes(arr){
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr || [], null, 2));
    } catch(e){}

    // Actualiza contador y log en la UI usando la API unificada
    if(global.UI && typeof UI.updateMistakeInfo === 'function'){
      UI.updateMistakeInfo(
        (arr && arr.length) ? arr.length : 0,
        JSON.stringify(arr || [], null, 2)
      );
    } else {
      // Fallback por si no está UI cargado
      const cntEl = document.getElementById('mistakeCount');
      if(cntEl) cntEl.textContent = (arr && arr.length) ? arr.length : 0;
      const log = document.getElementById('mistakeLog');
      if(log) log.value = JSON.stringify(arr || [], null, 2);
    }
  }

  function escapeRegExp(s){
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Normaliza entrada (string o pregunta) a template-escaped pattern: "THEY \\{rootEn\\}ED"
  function toTemplatePattern(input){
    if(!input) return '';

    if(typeof input === 'string'){
      return input.replace(/{/g,'\\{').replace(/}/g,'\\}');
    }

    const q = input;

    // Usa la plantilla explícita si está definida
    if(q.templatePattern) return String(q.templatePattern).replace(/{/g,'\\{').replace(/}/g,'\\}');
    if(q.templateQuestion) return String(q.templateQuestion).replace(/{/g,'\\{').replace(/}/g,'\\}');

    // Reconstruye a partir del pattern buscando raíces
    let pat = (q.pattern || q.question || q.translation || '').toString();
    if(window.QuestionBank && QuestionBank.verbs){
      for(const vk of Object.keys(QuestionBank.verbs)){
        const v = QuestionBank.verbs[vk];
        if(!v) continue;
        const reEn = new RegExp(escapeRegExp(v.rootEn), 'g');
        const reEs = new RegExp(escapeRegExp(v.rootEs), 'g');
        if(reEn.test(pat) || reEs.test(pat)){
          pat = pat.replace(reEn, '{rootEn}').replace(reEs, '{rootEs}');
          break;
        }
      }
    }

    return pat.replace(/{/g,'\\{').replace(/}/g,'\\}');
  }

  function markWrong(input){
    if(!input) return;
    const mistakes = getMistakes();
    const tpl = toTemplatePattern(input);
    if(!tpl) return;
    if(!mistakes.some(m => m.pattern === tpl)){
      mistakes.push({ pattern: tpl });
      saveMistakes(mistakes);
    } else {
      saveMistakes(mistakes); // refresca UI igual
    }
  }

  function clearIfCorrect(input){
    if(!input) return;
    const tpl = toTemplatePattern(input);
    if(!tpl) return;
    const cleaned = getMistakes().filter(m => m.pattern !== tpl);
    saveMistakes(cleaned);
  }

  global.StorageAPI = { getMistakes, saveMistakes, markWrong, clearIfCorrect, toTemplatePattern };
})(window);
