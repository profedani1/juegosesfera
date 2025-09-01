(function(global){
  function setQuestion(text, isMistake = false){
    const el = document.getElementById('preguntaMain');
    if(el){
      el.textContent = text || '--';
      el.style.color = isMistake ? '#f66' : '#fff';
    }
  }

  function setProgress(answered, total){
    const el = document.getElementById('preguntaEstado');
    if(el) el.textContent = `Respondidas: ${answered} / ${total}`;
  }

  function flashStatus(ok){
    const el = document.getElementById('preguntaEstado');
    if(!el) return;
    el.style.color = ok ? '#9be7a6' : '#ff5b5b';
    setTimeout(()=>{ el.style.color = '#9be7a6'; }, 900);
  }

  function showFeedback(text){
    const el = document.getElementById('feedbackBanner');
    if(!el) return;
    el.style.display = 'block';
    el.textContent = text;
    setTimeout(()=> el.style.display='none', 900);
  }

  function showFinal(answered, total, onClose){
    const el = document.getElementById('mensajeFinal');
    if(!el) return;
    el.style.display = 'block';
    el.innerHTML = `
      <strong>¡Completado!</strong><br>
      Respondidas: ${answered}/${total}.<br>
      <div class="btn" id="btnCloseEnd" style="margin-top:10px">Cerrar</div>`;
    const btn = document.getElementById('btnCloseEnd');
    if(btn) btn.onclick = () => { el.style.display='none'; if(onClose) onClose(); };
  }

  function updateMistakeInfo(count, log){
    const countEl = document.getElementById('mistakeCount');
    const logEl = document.getElementById('mistakeLog');
    if(countEl) countEl.textContent = count;
    if(logEl && typeof log === 'string') logEl.value = log;
  }

  function toggleLog(){
    const logEl = document.getElementById('mistakeLog');
    if(logEl){
      logEl.style.display = (logEl.style.display === 'none' || !logEl.style.display) ? 'block' : 'none';
    }
  }

  global.UI = { setQuestion, setProgress, flashStatus, showFeedback, showFinal, updateMistakeInfo, toggleLog };
})(window);
