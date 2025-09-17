(function(global){

  const questionEl   = document.getElementById("preguntaMain");
  const estadoEl     = document.getElementById("preguntaEstado");
  const feedbackEl   = document.getElementById("feedbackBanner");
  const mistakeCount = document.getElementById("mistakeCount");
  const mistakeLogEl = document.getElementById("mistakeLog");
  const btnRecov = document.getElementById('btnRecovMode');
  const btnClear = document.getElementById('btnClearMistakes');
  const mensajeFinalEl = document.getElementById('mensajeFinal');

  function renderVerbSelector(container){
    container.innerHTML = '';
    const header = document.createElement('div');
    header.style.marginBottom = '6px';
    const selectAllBtn = document.createElement('button');
    selectAllBtn.className = 'btn';
    selectAllBtn.textContent = 'Seleccionar todo (verbos)';
    selectAllBtn.onclick = ()=>{
      const allSelected = QuestionsAPI.getSelectedVerbs().length === Object.keys(QuestionsAPI.allVerbs).length;
      Object.keys(QuestionsAPI.allVerbs).forEach(k => QuestionsAPI.allVerbs[k].selected = !allSelected);
      QuestionsAPI.saveStateToStorage();
      renderVerbSelector(container);
    };
    header.appendChild(selectAllBtn);
    container.appendChild(header);

    Object.keys(QuestionsAPI.allVerbs).forEach(verbKey=>{
      const verb = QuestionsAPI.allVerbs[verbKey];
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.style.margin = '4px 6px 4px 0';
      btn.style.background = verb.selected ? '#2b6cb0' : 'rgba(255,255,255,0.06)';
      btn.textContent = verbKey.toUpperCase();
      btn.onclick = ()=>{
        QuestionsAPI.toggleVerb(verbKey);
        QuestionsAPI.saveStateToStorage();
        renderVerbSelector(container);
      };
      container.appendChild(btn);
    });
  }

  function renderPronounSelector(container){
    container.innerHTML = '';

    // Play-group toggle top
    const playGroupBox = document.createElement('div');
    playGroupBox.style.marginBottom = '8px';
    const playBtn = document.createElement('button');
    playBtn.className = 'btn';
    playBtn.textContent = QuestionsAPI.isPlayGroup() ? 'Jugar con TODO el grupo: ON' : 'Jugar con TODO el grupo: OFF';
    playBtn.style.background = QuestionsAPI.isPlayGroup() ? '#16a34a' : 'rgba(255,255,255,0.06)';
    playBtn.onclick = ()=>{
      QuestionsAPI.setPlayGroup(!QuestionsAPI.isPlayGroup());
      QuestionsAPI.saveStateToStorage();
      renderPronounSelector(container);
    };
    playGroupBox.appendChild(playBtn);
    container.appendChild(playGroupBox);

    // Select/Deselect all pronouns
    const rowActions = document.createElement('div');
    rowActions.style.marginBottom = '6px';
    const selectAll = document.createElement('button');
    selectAll.className = 'btn';
    selectAll.textContent = 'Seleccionar todos (pronombres)';
    selectAll.onclick = ()=>{ QuestionsAPI.selectAllPronouns(); QuestionsAPI.saveStateToStorage(); renderPronounSelector(container); };
    const deselectAll = document.createElement('button');
    deselectAll.className = 'btn';
    deselectAll.textContent = 'Deseleccionar todos';
    deselectAll.style.marginLeft = '6px';
    deselectAll.onclick = ()=>{ QuestionsAPI.deselectAllPronouns(); QuestionsAPI.saveStateToStorage(); renderPronounSelector(container); };

    rowActions.appendChild(selectAll);
    rowActions.appendChild(deselectAll);
    container.appendChild(rowActions);

    Object.entries(QuestionsAPI.pronounGroups).forEach(([groupName, groupPronouns])=>{
      const groupDiv = document.createElement('div');
      groupDiv.style.marginBottom = '8px';

      const groupBtn = document.createElement('button');
      groupBtn.className = 'btn';
      const allSelected = groupPronouns.every(p => QuestionsAPI.getSelectedPronouns().includes(p));
      const isActiveGroupVisual = allSelected || (QuestionsAPI.getActivePronounGroup() === groupName);
      groupBtn.textContent = groupName.toUpperCase();
      groupBtn.style.marginBottom = '6px';
      groupBtn.style.background = isActiveGroupVisual ? '#38bdf8' : 'rgba(255,255,255,0.06)';
      groupBtn.onclick = ()=>{
        QuestionsAPI.togglePronounGroupByName(groupName);
        QuestionsAPI.saveStateToStorage();
        renderPronounSelector(container);
      };
      groupDiv.appendChild(groupBtn);

      // pronoun buttons
      const pronRow = document.createElement('div');
      groupPronouns.forEach(p=>{
        const btn = document.createElement('button');
        const sel = QuestionsAPI.getSelectedPronouns().includes(p);
        btn.className = 'btn';
        btn.textContent = p;
        btn.style.margin = '4px 6px 4px 0';
        btn.style.background = sel ? '#f59e0b' : 'rgba(255,255,255,0.06)';
        btn.onclick = ()=>{
          QuestionsAPI.togglePronoun(p);
          QuestionsAPI.saveStateToStorage();
          renderPronounSelector(container);
        };
        pronRow.appendChild(btn);
      });
      groupDiv.appendChild(pronRow);
      container.appendChild(groupDiv);
    });

    // visually show active pronoun group
    const active = QuestionsAPI.getActivePronounGroup();
    if(active){
      const info = document.createElement('div');
      info.style.fontSize = '12px';
      info.style.color = '#9fd';
      info.textContent = `Grupo activo: ${active}`;
      container.appendChild(info);
    }
  }

  // === UI API ===
  const UI = {
    setQuestion(text, mistake=false){
      if(questionEl) {
        questionEl.textContent = text || '';
        questionEl.style.color = mistake ? 'red' : 'white';
      }
    },

    setProgress(current, total){
      if(estadoEl) estadoEl.textContent = (typeof current !== 'undefined') ? `${current}/${total}` : '';
    },

    showFeedback(msg){
      if(!feedbackEl) return;
      feedbackEl.textContent = msg;
      feedbackEl.style.display = 'block';
      setTimeout(()=>{ feedbackEl.style.display='none'; }, 900);
    },

    updateMistakeCount(n){
      if(mistakeCount) mistakeCount.textContent = String(n || 0);
    },

    showMistakeLog(arr){
      if(mistakeLogEl) mistakeLogEl.value = (Array.isArray(arr) ? JSON.stringify(arr, null, 2) : '');
    },

    showRecoveryButtons(show){
      if(btnRecov) btnRecov.style.display = show ? 'inline-block' : 'none';
      if(btnClear) btnClear.style.display = show ? 'inline-block' : 'none';
    },

    buildAdvancedMenu(container){
      container.innerHTML = '';
      const verbBox = document.createElement('div');
      const pronounBox = document.createElement('div');
      verbBox.style.marginBottom = '10px';
      container.appendChild(verbBox);
      container.appendChild(pronounBox);

      renderVerbSelector(verbBox);
      renderPronounSelector(pronounBox);
    },

    // ---- NUEVO: mostrar final de ronda (usado por tunnel.js) ----
    showFinal(correctCount, total, onRestart){
      if(!mensajeFinalEl) return;
      mensajeFinalEl.innerHTML = '';

      const title = document.createElement('div');
      title.style.fontSize = '18px';
      title.style.marginBottom = '12px';
      title.textContent = `Has completado ${correctCount}/${total} preguntas`;

      const sub = document.createElement('div');
      sub.style.fontSize = '13px';
      sub.style.marginBottom = '18px';
      sub.style.opacity = '0.9';
      sub.textContent = (correctCount >= total) ? '¡Completado!' : 'Ronda terminada';

      const btnRow = document.createElement('div');
      btnRow.style.display = 'flex';
      btnRow.style.justifyContent = 'center';
      btnRow.style.gap = '8px';

      const btnRestart = document.createElement('button');
      btnRestart.className = 'btn';
      btnRestart.textContent = 'Reiniciar';

      const btnClose = document.createElement('button');
      btnClose.className = 'btn';
      btnClose.textContent = 'Cerrar';

      btnRow.appendChild(btnRestart);
      btnRow.appendChild(btnClose);

      mensajeFinalEl.appendChild(title);
      mensajeFinalEl.appendChild(sub);
      mensajeFinalEl.appendChild(btnRow);
      mensajeFinalEl.style.display = 'block';

      btnRestart.onclick = ()=>{
        mensajeFinalEl.style.display = 'none';
        if(typeof onRestart === 'function') onRestart();
      };
      btnClose.onclick = ()=>{
        mensajeFinalEl.style.display = 'none';
      };
    }
  };

  global.UI = UI;

})(window);
