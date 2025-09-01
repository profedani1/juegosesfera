// Generador de preguntas (compartido por todos los modos)
(function(global){
  const verbs = {
     rest: { rootEn: "REST", rootEs: "DESCANS" },
     work: { rootEn: "WORK", rootEs: "TRABAJ" },
     walk: { rootEn: "WALK", rootEs: "CAMIN" },
     help: { rootEn: "HELP", rootEs: "AYUD" },
     visit: { rootEn: "VISIT", rootEs: "VISIT" },
     wait: { rootEn: "WAIT", rootEs: "ESPER" }
  };

  const pronouns = [
    "I","I HAVE","IF I",
    "YOU","YOU HAVE","IF YOU",
    "HE","HE HAS","IF HE",
    "WE","WE HAVE","IF WE",
    "YOU ALL","YOU ALL HAVE","IF YOU ALL",
    "THEY","THEY HAVE","IF THEY"
  ];

  // Genera preguntas para un verbo + pronombre.
  // Cada item incluye:
  //  - question: texto mostrado (con root reemplazado)
  //  - translation: traducción mostrada (con rootEs reemplazado)
  //  - pattern: plantilla SIN ESCAPAR (ej. "YOU HAVE {rootEn}ED")
  //  - templateQuestion: la plantilla original (idem pattern)
  //  - templateTranslation: plantilla de la traducción (ej. "{rootEs}ADO")
  function generateQuestions(verb, pronoun){
    const { rootEn, rootEs } = verb;

    if(pronoun === 'I') return [
      { question:`I ${rootEn}ED`, translation:`${rootEs}É`, pattern:`I {rootEn}ED`, templateQuestion:`I {rootEn}ED`, templateTranslation:`{rootEs}É` },
      { question:`I USED TO ${rootEn}`, translation:`${rootEs}ABA`, pattern:`I USED TO {rootEn}`, templateQuestion:`I USED TO {rootEn}`, templateTranslation:`{rootEs}ABA` },
      { question:`I ${rootEn}`, translation:`${rootEs}O`, pattern:`I {rootEn}`, templateQuestion:`I {rootEn}`, templateTranslation:`{rootEs}O` },
      { question:`I WILL ${rootEn}`, translation:`${rootEs}ARÉ`, pattern:`I WILL {rootEn}`, templateQuestion:`I WILL {rootEn}`, templateTranslation:`{rootEs}ARÉ` },
      { question:`I WOULD ${rootEn}`, translation:`${rootEs}ARÍA`, pattern:`I WOULD {rootEn}`, templateQuestion:`I WOULD {rootEn}`, templateTranslation:`{rootEs}ARÍA` }
    ];

    if(pronoun === 'I HAVE') return [
      { question:`I HAD ${rootEn}ED`, translation:`HABÍA ${rootEs}ADO`, pattern:`I HAD {rootEn}ED`, templateQuestion:`I HAD {rootEn}ED`, templateTranslation:`HABÍA {rootEs}ADO` },
      { question:`I HAVE ${rootEn}ED`, translation:`HE ${rootEs}ADO`, pattern:`I HAVE {rootEn}ED`, templateQuestion:`I HAVE {rootEn}ED`, templateTranslation:`HE {rootEs}ADO` },
      { question:`I WOULD HAVE ${rootEn}ED`, translation:`HABRÍA ${rootEs}ADO`, pattern:`I WOULD HAVE {rootEn}ED`, templateQuestion:`I WOULD HAVE {rootEn}ED`, templateTranslation:`HABRÍA {rootEs}ADO` }
    ];

    if(pronoun === 'IF I') return [
      { question:`IF I HAD ${rootEn}ED`, translation:`SI HUBIERA ${rootEs}ADO`, pattern:`IF I HAD {rootEn}ED`, templateQuestion:`IF I HAD {rootEn}ED`, templateTranslation:`SI HUBIERA {rootEs}ADO` },
      { question:`IF I ${rootEn}ED`, translation:`SI ${rootEs}ARA`, pattern:`IF I {rootEn}ED`, templateQuestion:`IF I {rootEn}ED`, templateTranslation:`SI {rootEs}ARA` },
      { question:`IF I WAS ${rootEn}ING`, translation:`SI ESTUVIERA ${rootEs}ANDO`, pattern:`IF I WAS {rootEn}ING`, templateQuestion:`IF I WAS {rootEn}ING`, templateTranslation:`SI ESTUVIERA {rootEs}ANDO` }
    ];

    if(pronoun === 'YOU') return [
      { question:`YOU ${rootEn}ED`, translation:`${rootEs}ASTE`, pattern:`YOU {rootEn}ED`, templateQuestion:`YOU {rootEn}ED`, templateTranslation:`{rootEs}ASTE` },
      { question:`YOU USED TO ${rootEn}`, translation:`${rootEs}ABAS`, pattern:`YOU USED TO {rootEn}`, templateQuestion:`YOU USED TO {rootEn}`, templateTranslation:`{rootEs}ABAS` },
      { question:`YOU ${rootEn}`, translation:`${rootEs}AS`, pattern:`YOU {rootEn}`, templateQuestion:`YOU {rootEn}`, templateTranslation:`{rootEs}AS` },
      { question:`YOU WILL ${rootEn}`, translation:`${rootEs}ARÁS`, pattern:`YOU WILL {rootEn}`, templateQuestion:`YOU WILL {rootEn}`, templateTranslation:`{rootEs}ARÁS` },
      { question:`YOU WOULD ${rootEn}`, translation:`${rootEs}ARÍAS`, pattern:`YOU WOULD {rootEn}`, templateQuestion:`YOU WOULD {rootEn}`, templateTranslation:`{rootEs}ARÍAS` }
    ];

    if(pronoun === 'YOU HAVE') return [
      { question:`YOU HAD ${rootEn}ED`, translation:`HABÍAS ${rootEs}ADO`, pattern:`YOU HAD {rootEn}ED`, templateQuestion:`YOU HAD {rootEn}ED`, templateTranslation:`HABÍAS {rootEs}ADO` },
      { question:`YOU HAVE ${rootEn}ED`, translation:`HAS ${rootEs}ADO`, pattern:`YOU HAVE {rootEn}ED`, templateQuestion:`YOU HAVE {rootEn}ED`, templateTranslation:`HAS {rootEs}ADO` },
      { question:`YOU WOULD HAVE ${rootEn}ED`, translation:`HABRÍAS ${rootEs}ADO`, pattern:`YOU WOULD HAVE {rootEn}ED`, templateQuestion:`YOU WOULD HAVE {rootEn}ED`, templateTranslation:`HABRÍAS {rootEs}ADO` }
    ];

    if(pronoun === 'IF YOU') return [
      { question:`IF YOU HAD ${rootEn}ED`, translation:`SI HUBIERAS ${rootEs}ADO`, pattern:`IF YOU HAD {rootEn}ED`, templateQuestion:`IF YOU HAD {rootEn}ED`, templateTranslation:`SI HUBIERAS {rootEs}ADO` },
      { question:`IF YOU ${rootEn}ED`, translation:`SI ${rootEs}ARAS`, pattern:`IF YOU {rootEn}ED`, templateQuestion:`IF YOU {rootEn}ED`, templateTranslation:`SI {rootEs}ARAS` },
      { question:`IF YOU WERE ${rootEn}ING`, translation:`SI ESTUVIERAS ${rootEs}ANDO`, pattern:`IF YOU WERE {rootEn}ING`, templateQuestion:`IF YOU WERE {rootEn}ING`, templateTranslation:`SI ESTUVIERAS {rootEs}ANDO` }
    ];

    if(pronoun === 'HE') return [
      { question:`HE ${rootEn}ED`, translation:`${rootEs}Ó`, pattern:`HE {rootEn}ED`, templateQuestion:`HE {rootEn}ED`, templateTranslation:`{rootEs}Ó` },
      { question:`HE USED TO ${rootEn}`, translation:`${rootEs}ABA`, pattern:`HE USED TO {rootEn}`, templateQuestion:`HE USED TO {rootEn}`, templateTranslation:`{rootEs}ABA` },
      { question:`HE ${rootEn}`, translation:`${rootEs}A`, pattern:`HE {rootEn}`, templateQuestion:`HE {rootEn}`, templateTranslation:`{rootEs}A` },
      { question:`HE WILL ${rootEn}`, translation:`${rootEs}ARÁ`, pattern:`HE WILL {rootEn}`, templateQuestion:`HE WILL {rootEn}`, templateTranslation:`{rootEs}ARÁ` },
      { question:`HE WOULD ${rootEn}`, translation:`${rootEs}ARÍA`, pattern:`HE WOULD {rootEn}`, templateQuestion:`HE WOULD {rootEn}`, templateTranslation:`{rootEs}ARÍA` }
    ];

    if(pronoun === 'HE HAS') return [
      { question:`HE HAD ${rootEn}ED`, translation:`HABÍA ${rootEs}ADO`, pattern:`HE HAD {rootEn}ED`, templateQuestion:`HE HAD {rootEn}ED`, templateTranslation:`HABÍA {rootEs}ADO` },
      { question:`HE HAS ${rootEn}ED`, translation:`HA ${rootEs}ADO`, pattern:`HE HAS {rootEn}ED`, templateQuestion:`HE HAS {rootEn}ED`, templateTranslation:`HA {rootEs}ADO` },
      { question:`HE WOULD HAVE ${rootEn}ED`, translation:`HABRÍA ${rootEs}ADO`, pattern:`HE WOULD HAVE {rootEn}ED`, templateQuestion:`HE WOULD HAVE {rootEn}ED`, templateTranslation:`HABRÍA {rootEs}ADO` }
    ];

    if(pronoun === 'IF HE') return [
      { question:`IF HE HAD ${rootEn}ED`, translation:`SI HUBIERA ${rootEs}ADO`, pattern:`IF HE HAD {rootEn}ED`, templateQuestion:`IF HE HAD {rootEn}ED`, templateTranslation:`SI HUBIERA {rootEs}ADO` },
      { question:`IF HE ${rootEn}ED`, translation:`SI ${rootEs}ARA`, pattern:`IF HE {rootEn}ED`, templateQuestion:`IF HE {rootEn}ED`, templateTranslation:`SI {rootEs}ARA` },
      { question:`IF HE WAS ${rootEn}ING`, translation:`SI ESTUVIERA ${rootEs}ANDO`, pattern:`IF HE WAS {rootEn}ING`, templateQuestion:`IF HE WAS {rootEn}ING`, templateTranslation:`SI ESTUVIERA {rootEs}ANDO` }
    ];

    if(pronoun === 'WE') return [
      { question:`WE ${rootEn}ED`, translation:`${rootEs}AMOS`, pattern:`WE {rootEn}ED`, templateQuestion:`WE {rootEn}ED`, templateTranslation:`{rootEs}AMOS` },
      { question:`WE USED TO ${rootEn}`, translation:`${rootEs}ÁBAMOS`, pattern:`WE USED TO {rootEn}`, templateQuestion:`WE USED TO {rootEn}`, templateTranslation:`{rootEs}ÁBAMOS` },
      { question:`WE ${rootEn}`, translation:`${rootEs}AMOS`, pattern:`WE {rootEn}`, templateQuestion:`WE {rootEn}`, templateTranslation:`{rootEs}AMOS` },
      { question:`WE WILL ${rootEn}`, translation:`${rootEs}AREMOS`, pattern:`WE WILL {rootEn}`, templateQuestion:`WE WILL {rootEn}`, templateTranslation:`{rootEs}AREMOS` },
      { question:`WE WOULD ${rootEn}`, translation:`${rootEs}ARÍAMOS`, pattern:`WE WOULD {rootEn}`, templateQuestion:`WE WOULD {rootEn}`, templateTranslation:`{rootEs}ARÍAMOS` }
    ];

    if(pronoun === 'WE HAVE') return [
      { question:`WE HAD ${rootEn}ED`, translation:`HABÍAMOS ${rootEs}ADO`, pattern:`WE HAD {rootEn}ED`, templateQuestion:`WE HAD {rootEn}ED`, templateTranslation:`HABÍAMOS {rootEs}ADO` },
      { question:`WE HAVE ${rootEn}ED`, translation:`HEMOS ${rootEs}ADO`, pattern:`WE HAVE {rootEn}ED`, templateQuestion:`WE HAVE {rootEn}ED`, templateTranslation:`HEMOS {rootEs}ADO` },
      { question:`WE WOULD HAVE ${rootEn}ED`, translation:`HABRÍAMOS ${rootEs}ADO`, pattern:`WE WOULD HAVE {rootEn}ED`, templateQuestion:`WE WOULD HAVE {rootEn}ED`, templateTranslation:`HABRÍAMOS {rootEs}ADO` }
    ];

    if(pronoun === 'IF WE') return [
      { question:`IF WE HAD ${rootEn}ED`, translation:`SI HUBIÉRAMOS ${rootEs}ADO`, pattern:`IF WE HAD {rootEn}ED`, templateQuestion:`IF WE HAD {rootEn}ED`, templateTranslation:`SI HUBIÉRAMOS {rootEs}ADO` },
      { question:`IF WE ${rootEn}ED`, translation:`SI ${rootEs}ÁRAMOS`, pattern:`IF WE {rootEn}ED`, templateQuestion:`IF WE {rootEn}ED`, templateTranslation:`SI {rootEs}ÁRAMOS` },
      { question:`IF WE WERE ${rootEn}ING`, translation:`SI ESTUVIÉRAMOS ${rootEs}ANDO`, pattern:`IF WE WERE {rootEn}ING`, templateQuestion:`IF WE WERE {rootEn}ING`, templateTranslation:`SI ESTUVIÉRAMOS {rootEs}ANDO` }
    ];

    if(pronoun === 'YOU ALL') return [
      { question:`YOU ALL ${rootEn}ED`, translation:`${rootEs}ASTEIS`, pattern:`YOU ALL {rootEn}ED`, templateQuestion:`YOU ALL {rootEn}ED`, templateTranslation:`{rootEs}ASTEIS` },
      { question:`YOU ALL USED TO ${rootEn}`, translation:`${rootEs}ABAIS`, pattern:`YOU ALL USED TO {rootEn}`, templateQuestion:`YOU ALL USED TO {rootEn}`, templateTranslation:`{rootEs}ABAIS` },
      { question:`YOU ALL ${rootEn}`, translation:`${rootEs}ÁIS`, pattern:`YOU ALL {rootEn}`, templateQuestion:`YOU ALL {rootEn}`, templateTranslation:`{rootEs}ÁIS` },
      { question:`YOU ALL WILL ${rootEn}`, translation:`${rootEs}ARÉIS`, pattern:`YOU ALL WILL {rootEn}`, templateQuestion:`YOU ALL WILL {rootEn}`, templateTranslation:`{rootEs}ARÉIS` },
      { question:`YOU ALL WOULD ${rootEn}`, translation:`${rootEs}ARÍAIS`, pattern:`YOU ALL WOULD {rootEn}`, templateQuestion:`YOU ALL WOULD {rootEn}`, templateTranslation:`{rootEs}ARÍAIS` }
    ];

    if(pronoun === 'YOU ALL HAVE') return [
      { question:`YOU ALL HAD ${rootEn}ED`, translation:`HABÍAIS ${rootEs}ADO`, pattern:`YOU ALL HAD {rootEn}ED`, templateQuestion:`YOU ALL HAD {rootEn}ED`, templateTranslation:`HABÍAIS {rootEs}ADO` },
      { question:`YOU ALL HAVE ${rootEn}ED`, translation:`HABÉIS ${rootEs}ADO`, pattern:`YOU ALL HAVE {rootEn}ED`, templateQuestion:`YOU ALL HAVE {rootEn}ED`, templateTranslation:`HABÉIS {rootEs}ADO` },
      { question:`YOU ALL WOULD HAVE ${rootEn}ED`, translation:`HABRÍAIS ${rootEs}ADO`, pattern:`YOU ALL WOULD HAVE {rootEn}ED`, templateQuestion:`YOU ALL WOULD HAVE {rootEn}ED`, templateTranslation:`HABRÍAIS {rootEs}ADO` }
    ];

    if(pronoun === 'IF YOU ALL') return [
      { question:`IF YOU ALL HAD ${rootEn}ED`, translation:`SI HUBIERAIS ${rootEs}ADO`, pattern:`IF YOU ALL HAD {rootEn}ED`, templateQuestion:`IF YOU ALL HAD {rootEn}ED`, templateTranslation:`SI HUBIERAIS {rootEs}ADO` },
      { question:`IF YOU ALL ${rootEn}ED`, translation:`SI ${rootEs}ARAIS`, pattern:`IF YOU ALL {rootEn}ED`, templateQuestion:`IF YOU ALL {rootEn}ED`, templateTranslation:`SI {rootEs}ARAIS` },
      { question:`IF YOU ALL WERE ${rootEn}ING`, translation:`SI ESTUVIERAIS ${rootEs}ANDO`, pattern:`IF YOU ALL WERE {rootEn}ING`, templateQuestion:`IF YOU ALL WERE {rootEn}ING`, templateTranslation:`SI ESTUVIERAIS {rootEs}ANDO` }
    ];

    if(pronoun === 'THEY') return [
      { question:`THEY ${rootEn}ED`, translation:`${rootEs}ARON`, pattern:`THEY {rootEn}ED`, templateQuestion:`THEY {rootEn}ED`, templateTranslation:`{rootEs}ARON` },
      { question:`THEY USED TO ${rootEn}`, translation:`${rootEs}ABAN`, pattern:`THEY USED TO {rootEn}`, templateQuestion:`THEY USED TO {rootEn}`, templateTranslation:`{rootEs}ABAN` },
      { question:`THEY ${rootEn}`, translation:`${rootEs}AN`, pattern:`THEY {rootEn}`, templateQuestion:`THEY {rootEn}`, templateTranslation:`{rootEs}AN` },
      { question:`THEY WILL ${rootEn}`, translation:`${rootEs}ARÁN`, pattern:`THEY WILL {rootEn}`, templateQuestion:`THEY WILL {rootEn}`, templateTranslation:`{rootEs}ARÁN` },
      { question:`THEY WOULD ${rootEn}`, translation:`${rootEs}ARÍAN`, pattern:`THEY WOULD {rootEn}`, templateQuestion:`THEY WOULD {rootEn}`, templateTranslation:`{rootEs}ARÍAN` }
    ];

    if(pronoun === 'THEY HAVE') return [
      { question:`THEY HAD ${rootEn}ED`, translation:`HABÍAN ${rootEs}ADO`, pattern:`THEY HAD {rootEn}ED`, templateQuestion:`THEY HAD {rootEn}ED`, templateTranslation:`HABÍAN {rootEs}ADO` },
      { question:`THEY HAVE ${rootEn}ED`, translation:`HAN ${rootEs}ADO`, pattern:`THEY HAVE {rootEn}ED`, templateQuestion:`THEY HAVE {rootEn}ED`, templateTranslation:`HAN {rootEs}ADO` },
      { question:`THEY WOULD HAVE ${rootEn}ED`, translation:`HABRÍAN ${rootEs}ADO`, pattern:`THEY WOULD HAVE {rootEn}ED`, templateQuestion:`THEY WOULD HAVE {rootEn}ED`, templateTranslation:`HABRÍAN {rootEs}ADO` }
    ];

    if(pronoun === 'IF THEY') return [
      { question:`IF THEY HAD ${rootEn}ED`, translation:`SI HUBIERAN ${rootEs}ADO`, pattern:`IF THEY HAD {rootEn}ED`, templateQuestion:`IF THEY HAD {rootEn}ED`, templateTranslation:`SI HUBIERAN {rootEs}ADO` },
      { question:`IF THEY ${rootEn}ED`, translation:`SI ${rootEs}ARAN`, pattern:`IF THEY {rootEn}ED`, templateQuestion:`IF THEY {rootEn}ED`, templateTranslation:`SI {rootEs}ARAN` },
      { question:`IF THEY WERE ${rootEn}ING`, translation:`SI ESTUVIERAN ${rootEs}ANDO`, pattern:`IF THEY WERE {rootEn}ING`, templateQuestion:`IF THEY WERE {rootEn}ING`, templateTranslation:`SI ESTUVIERAN {rootEs}ANDO` }
    ];

    return [];
  }

  function shuffleArray(arr){
    const a = arr.slice();
    for(let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // === buildPool corregido: cada entrada tiene .options (solo traducciones del mismo verbo)
  function buildPoolFromVerbsPronouns(){
    const pool = [];
    const verbKeys = shuffleArray(Object.keys(verbs));   // verbos en orden aleatorio
    let pronounOrder = shuffleArray(pronouns);           // pronombres en orden aleatorio
    let pIndex = 0;

    for(const vk of verbKeys){
      const verb = verbs[vk];

      // cada verbo toma un pronombre de pronounOrder; al agotarse, rebarajar pronombres
      const pronoun = pronounOrder[pIndex];
      pIndex++;
      if(pIndex >= pronounOrder.length){
        pronounOrder = shuffleArray(pronouns);
        pIndex = 0;
      }

      // generamos todas las preguntas para ESTE verbo+pronombre
      const questionsForThisPair = generateQuestions(verb, pronoun);

      // obtenemos SOLO las traducciones de ESTE verbo (para usar como opciones)
      const translationsSameVerb = questionsForThisPair.map(q => q.translation);

      // añadimos cada pregunta al pool, pero con la propiedad options que contiene solo traducciones del mismo verbo
      for(const q of questionsForThisPair){
        pool.push({
          question: q.question,
          translation: q.translation,
          pattern: q.pattern,                 // plantilla NO escapada, ej. "YOU HAVE {rootEn}ED"
          templateQuestion: q.templateQuestion,
          templateTranslation: q.templateTranslation,
          verbKey: vk,
          pronoun: pronoun,
          // opciones seguras (solo traducciones del mismo verbo)
          options: shuffleArray(translationsSameVerb)
        });
      }
    }

    return pool;
  }

  global.QuestionBank = { buildPoolFromVerbsPronouns };
})(window);
