(function(global){
  const STORAGE_KEY = 'translationMistakesV1';

  function getMistakes(){
    try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : []; }
    catch(e){ return []; }
  }

  function saveMistakes(arr){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr || [], null, 2)); } catch(e){}
    const cntEl = document.getElementById('mistakeCount');
    if(cntEl) cntEl.textContent = (arr && arr.length) ? arr.length : 0;
    const log = document.getElementById('mistakeLog');
    if(log) log.value = JSON.stringify(arr || [], null, 2);
  }

  function escapeRegExp(s){ return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  // Normaliza entrada (string o pregunta) a template-escaped pattern: "THEY \\{rootEn\\}ED"
  function toTemplatePattern(input){
    if(!input) return '';
    // si ya es string, asumimos que es la plantilla deseada (aseguramos escapar llaves)
    if(typeof input === 'string'){
      return input.replace(/{/g,'\\{').replace(/}/g,'\\}');
    }

    const q = input;
    // si la pregunta trae plantilla explícita, úsala
    if(q.templatePattern) return String(q.templatePattern).replace(/{/g,'\\{').replace(/}/g,'\\}');
    if(q.templateQuestion) return String(q.templateQuestion).replace(/{/g,'\\{').replace(/}/g,'\\}');

    // intentar reconstruir plantilla a partir del pattern generado buscando la raíz del verbo
    // requiere que QuestionBank.verbs esté disponible (si no, fallback al pattern).
    let pat = (q.pattern || q.question || q.translation || '').toString();
    if(window.QuestionBank && QuestionBank.verbs){
      for(const vk of Object.keys(QuestionBank.verbs)){
        const v = QuestionBank.verbs[vk];
        if(!v) continue;
        // buscar rootEn y rootEs en el patrón y reemplazarlos por placeholders
        const reEn = new RegExp(escapeRegExp(v.rootEn), 'g');
        const reEs = new RegExp(escapeRegExp(v.rootEs), 'g');
        if(reEn.test(pat) || reEs.test(pat)){
          pat = pat.replace(reEn, '{rootEn}').replace(reEs, '{rootEs}');
          break;
        }
      }
    }

    // asegurar que las llaves quedan escapadas para almacenamiento/regex literal
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
      // aún refrescamos UI por si cambió otra cosa
      saveMistakes(mistakes);
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
