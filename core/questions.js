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
  const pronouns = ["I","I HAVE"];

  function generateQuestions(verb, pronoun){
    const { rootEn, rootEs } = verb;
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

    if(pronoun === 'IF I') return [
      { question:`IF I HAD ${rootEn}ED`, translation:`SI HUBIERA ${rootEs}ADO`, pattern:`IF I HAD ${rootEn}ED` },
      { question:`IF I ${rootEn}ED`, translation:`SI ${rootEs}ARA`, pattern:`IF I ${rootEn}ED` },
      { question:`IF I WAS ${rootEn}ING`, translation:`SI ESTUVIERA ${rootEs}ANDO`, pattern:`IF I WAS ${rootEn}ING` }
    ];

    if(pronoun === 'YOU') return [
      { question:`YOU ${rootEn}ED`, translation:`${rootEs}ASTE`, pattern:`YOU ${rootEn}ED` },
      { question:`YOU USED TO ${rootEn}`, translation:`${rootEs}ABAS`, pattern:`YOU USED TO ${rootEn}` },
      { question:`YOU ${rootEn}`, translation:`${rootEs}AS`, pattern:`YOU ${rootEn}` },
      { question:`YOU WILL ${rootEn}`, translation:`${rootEs}ARÁS`, pattern:`YOU WILL ${rootEn}` },
      { question:`YOU WOULD ${rootEn}`, translation:`${rootEs}ARÍAS`, pattern:`YOU WOULD ${rootEn}` }
    ];

    if(pronoun === 'YOU HAVE') return [
      { question:`YOU HAD ${rootEn}ED`, translation:`HABÍAS ${rootEs}ADO`, pattern:`YOU HAD ${rootEn}ED` },
      { question:`YOU HAVE ${rootEn}ED`, translation:`HAS ${rootEs}ADO`, pattern:`YOU HAVE ${rootEn}ED` },
      { question:`YOU WOULD HAVE ${rootEn}ED`, translation:`HABRÍAS ${rootEs}ADO`, pattern:`YOU WOULD HAVE ${rootEn}ED` }
    ];

    if(pronoun === 'IF YOU') return [
      { question:`IF YOU HAD ${rootEn}ED`, translation:`SI HUBIERAS ${rootEs}ADO`, pattern:`IF YOU HAD ${rootEn}ED` },
      { question:`IF YOU ${rootEn}ED`, translation:`SI ${rootEs}ARAS`, pattern:`IF YOU ${rootEn}ED` },
      { question:`IF YOU WERE ${rootEn}ING`, translation:`SI ESTUVIERAS ${rootEs}ANDO`, pattern:`IF YOU WERE ${rootEn}ING` }
    ];

    if(pronoun === 'HE') return [
      { question:`HE ${rootEn}ED`, translation:`${rootEs}Ó`, pattern:`HE ${rootEn}ED` },
      { question:`HE USED TO ${rootEn}`, translation:`${rootEs}ABA`, pattern:`HE USED TO ${rootEn}` },
      { question:`HE ${rootEn}`, translation:`${rootEs}A`, pattern:`HE ${rootEn}` },
      { question:`HE WILL ${rootEn}`, translation:`${rootEs}ARÁ`, pattern:`HE WILL ${rootEn}` },
      { question:`HE WOULD ${rootEn}`, translation:`${rootEs}ARÍA`, pattern:`HE WOULD ${rootEn}` }
    ];

    if(pronoun === 'HE HAS') return [
      { question:`HE HAD ${rootEn}ED`, translation:`HABÍA ${rootEs}ADO`, pattern:`HE HAD ${rootEn}ED` },
      { question:`HE HAS ${rootEn}ED`, translation:`HA ${rootEs}ADO`, pattern:`HE HAS ${rootEn}ED` },
      { question:`HE WOULD HAVE ${rootEn}ED`, translation:`HABRÍA ${rootEs}ADO`, pattern:`HE WOULD HAVE ${rootEn}ED` }
    ];

    if(pronoun === 'IF HE') return [
      { question:`IF HE HAD ${rootEn}ED`, translation:`SI HUBIERA ${rootEs}ADO`, pattern:`IF HE HAD ${rootEn}ED` },
      { question:`IF HE ${rootEn}ED`, translation:`SI ${rootEs}ARA`, pattern:`IF HE ${rootEn}ED` },
      { question:`IF HE WAS ${rootEn}ING`, translation:`SI ESTUVIERA ${rootEs}ANDO`, pattern:`IF HE WAS ${rootEn}ING` }
    ];

    if(pronoun === 'WE') return [
      { question:`WE ${rootEn}ED`, translation:`${rootEs}AMOS`, pattern:`WE ${rootEn}ED` },
      { question:`WE USED TO ${rootEn}`, translation:`${rootEs}ÁBAMOS`, pattern:`WE USED TO ${rootEn}` },
      { question:`WE ${rootEn}`, translation:`${rootEs}AMOS`, pattern:`WE ${rootEn}` },
      { question:`WE WILL ${rootEn}`, translation:`${rootEs}AREMOS`, pattern:`WE WILL ${rootEn}` },
      { question:`WE WOULD ${rootEn}`, translation:`${rootEs}ARÍAMOS`, pattern:`WE WOULD ${rootEn}` }
    ];

    if(pronoun === 'WE HAVE') return [
      { question:`WE HAD ${rootEn}ED`, translation:`HABÍAMOS ${rootEs}ADO`, pattern:`WE HAD ${rootEn}ED` },
      { question:`WE HAVE ${rootEn}ED`, translation:`HEMOS ${rootEs}ADO`, pattern:`WE HAVE ${rootEn}ED` },
      { question:`WE WOULD HAVE ${rootEn}ED`, translation:`HABRÍAMOS ${rootEs}ADO`, pattern:`WE WOULD HAVE ${rootEn}ED` }
    ];

    if(pronoun === 'IF WE') return [
      { question:`IF WE HAD ${rootEn}ED`, translation:`SI HUBIÉRAMOS ${rootEs}ADO`, pattern:`IF WE HAD ${rootEn}ED` },
      { question:`IF WE ${rootEn}ED`, translation:`SI ${rootEs}ÁRAMOS`, pattern:`IF WE ${rootEn}ED` },
      { question:`IF WE WERE ${rootEn}ING`, translation:`SI ESTUVIÉRAMOS ${rootEs}ANDO`, pattern:`IF WE WERE ${rootEn}ING` }
    ];

    if(pronoun === 'YOU ALL') return [
      { question:`YOU ALL ${rootEn}ED`, translation:`${rootEs}ASTEIS`, pattern:`YOU ALL ${rootEn}ED` },
      { question:`YOU ALL USED TO ${rootEn}`, translation:`${rootEs}ABAIS`, pattern:`YOU ALL USED TO ${rootEn}` },
      { question:`YOU ALL ${rootEn}`, translation:`${rootEs}ÁIS`, pattern:`YOU ALL ${rootEn}` },
      { question:`YOU ALL WILL ${rootEn}`, translation:`${rootEs}ARÉIS`, pattern:`YOU ALL WILL ${rootEn}` },
      { question:`YOU ALL WOULD ${rootEn}`, translation:`${rootEs}ARÍAIS`, pattern:`YOU ALL WOULD ${rootEn}` }
    ];

    if(pronoun === 'YOU ALL HAVE') return [
      { question:`YOU ALL HAD ${rootEn}ED`, translation:`HABÍAIS ${rootEs}ADO`, pattern:`YOU ALL HAD ${rootEn}ED` },
      { question:`YOU ALL HAVE ${rootEn}ED`, translation:`HABÉIS ${rootEs}ADO`, pattern:`YOU ALL HAVE ${rootEn}ED` },
      { question:`YOU ALL WOULD HAVE ${rootEn}ED`, translation:`HABRÍAIS ${rootEs}ADO`, pattern:`YOU ALL WOULD HAVE ${rootEn}ED` }
    ];

    if(pronoun === 'IF YOU ALL') return [
      { question:`IF YOU ALL HAD ${rootEn}ED`, translation:`SI HUBIERAIS ${rootEs}ADO`, pattern:`IF YOU ALL HAD ${rootEn}ED` },
      { question:`IF YOU ALL ${rootEn}ED`, translation:`SI ${rootEs}ARAIS`, pattern:`IF YOU ALL ${rootEn}ED` },
      { question:`IF YOU ALL WERE ${rootEn}ING`, translation:`SI ESTUVIERAIS ${rootEs}ANDO`, pattern:`IF YOU ALL WERE ${rootEn}ING` }
    ];

    if(pronoun === 'THEY') return [
      { question:`THEY ${rootEn}ED`, translation:`${rootEs}ARON`, pattern:`THEY ${rootEn}ED` },
      { question:`THEY USED TO ${rootEn}`, translation:`${rootEs}ABAN`, pattern:`THEY USED TO ${rootEn}` },
      { question:`THEY ${rootEn}`, translation:`${rootEs}AN`, pattern:`THEY ${rootEn}` },
      { question:`THEY WILL ${rootEn}`, translation:`${rootEs}ARÁN`, pattern:`THEY WILL ${rootEn}` },
      { question:`THEY WOULD ${rootEn}`, translation:`${rootEs}ARÍAN`, pattern:`THEY WOULD ${rootEn}` }
    ];

    if(pronoun === 'THEY HAVE') return [
      { question:`THEY HAD ${rootEn}ED`, translation:`HABÍAN ${rootEs}ADO`, pattern:`THEY HAD ${rootEn}ED` },
      { question:`THEY HAVE ${rootEn}ED`, translation:`HAN ${rootEs}ADO`, pattern:`THEY HAVE ${rootEn}ED` },
      { question:`THEY WOULD HAVE ${rootEn}ED`, translation:`HABRÍAN ${rootEs}ADO`, pattern:`THEY WOULD HAVE ${rootEn}ED` }
    ];

    if(pronoun === 'IF THEY') return [
      { question:`IF THEY HAD ${rootEn}ED`, translation:`SI HUBIERAN ${rootEs}ADO`, pattern:`IF THEY HAD ${rootEn}ED` },
      { question:`IF THEY ${rootEn}ED`, translation:`SI ${rootEs}ARAN`, pattern:`IF THEY ${rootEn}ED` },
      { question:`IF THEY WERE ${rootEn}ING`, translation:`SI ESTUVIERAN ${rootEs}ANDO`, pattern:`IF THEY WERE ${rootEn}ING` }
    ];
  return [];
  }

   function buildPoolFromVerbsPronouns(){
    const pool = [];
    for(const k of Object.keys(verbs))
      for(const p of pronouns)
        pool.push(...generateQuestions(verbs[k], p));
    return pool;
  }
  global.QuestionBank = { buildPoolFromVerbsPronouns };
})(window);

