(function(global){
  const verbs = {
     rest: { rootEn: "REST", rootEs: "DESCANS" },
     work: { rootEn: "WORK", rootEs: "TRABAJ" },
     walk: { rootEn: "WALK", rootEs: "CAMIN" },
     help: { rootEn: "HELP", rootEs: "AYUD" },
     visit: { rootEn: "VISIT", rootEs: "VISIT" },
     wait: { rootEn: "WAIT", rootEs: "ESPER" }
  };

  const pronouns = ["I","I HAVE","IF I","YOU","YOU HAVE","IF YOU","HE","HE HAS","IF HE","WE","WE HAVE","IF WE","YOU ALL","YOU ALL HAVE","IF YOU ALL","THEY","THEY HAVE","IF THEY"];

  function generateQuestions(verb, pronoun){
    const { rootEn, rootEs } = verb;
    // Aquí va todo tu código original de generateQuestions (sin cambios)
    if(pronoun === 'I') return [
      { question:`I ${rootEn}ED`, translation:`${rootEs}É`, pattern:`I ${rootEn}ED` },
      { question:`I USED TO ${rootEn}`, translation:`${rootEs}ABA`, pattern:`I USED TO ${rootEn}` },
      { question:`I ${rootEn}`, translation:`${rootEs}O`, pattern:`I ${rootEn}` },
      { question:`I WILL ${rootEn}`, translation:`${rootEs}ARÉ`, pattern:`I WILL ${rootEn}` },
      { question:`I WOULD ${rootEn}`, translation:`${rootEs}ARÍA`, pattern:`I WOULD ${rootEn}` }
    ];
    if(pronoun === 'I HAVE') return [
      { question:`I HAD ${rootEn}ED`, translation:`HABÍA ${rootEs}ADO`, pattern:`I HAD ${rootEn}ED` },
      { question:`I HAVE ${rootEn}ED`, translation:`HE ${rootEs}ADO`, pattern:`I HAVE ${rootEn}ED` },
      { question:`I WOULD HAVE ${rootEn}ED`, translation:`HABRÍA ${rootEs}ADO`, pattern:`I WOULD HAVE ${rootEn}ED` }
    ];
    // ... resto de pronombres sigue igual
    return [];
  }

  // Función para barajar un array
  function shuffleArray(array){
    const arr = array.slice();
    for(let i = arr.length -1; i > 0; i--){
      const j = Math.floor(Math.random() * (i+1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Generador de pool aleatorio sin repetir pronombres
  function buildPoolFromVerbsPronouns(){
    const pool = [];
    const verbKeys = shuffleArray(Object.keys(verbs));   // verbos aleatorios
    let pronounPool = shuffleArray(pronouns);            // pronombres aleatorios
    let pronounIndex = 0;

    for(const k of verbKeys){
      const pronoun = pronounPool[pronounIndex];
      pool.push(...generateQuestions(verbs[k], pronoun));
      pronounIndex++;
      if(pronounIndex >= pronounPool.length){
        pronounPool = shuffleArray(pronouns);  // reinicia pronombres cuando se acaben
        pronounIndex = 0;
      }
    }
    return pool;
  }

  global.QuestionBank = { buildPoolFromVerbsPronouns };
})(window);
