// Generador de preguntas (compartido por todos los modos)
(function(global){
  const verbs = {
    rest: { rootEn: "REST", rootEs: "DESCANS" },
    work: { rootEn: "WORK", rootEs: "TRABAJ" },
    play: { rootEn: "PLAY", rootEs: "JUG" },
    go:   { rootEn: "GO",   rootEs: "VÁ" }
  };
  const pronouns = ["I","I HAVE"];

  function generateQuestions(verb, pronoun){
    const { rootEn, rootEs } = verb;
    if(pronoun === 'I') return [
      { question:`I ${rootEn}ED`, translation:`${rootEs}É`, pattern:`I ${rootEn}ED` },
      { question:`I USED TO ${rootEn}`, translation:`${rootEs}ABA`, pattern:`I USED TO ${rootEn}` }
    ];
    return [
      { question:`I HAD ${rootEn}ED`, translation:`HABÍA ${rootEs}ADO`, pattern:`I HAD ${rootEn}ED` },
      { question:`I HAVE ${rootEn}ED`, translation:`HE ${rootEs}ADO`, pattern:`I HAVE ${rootEn}ED` }
    ];
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
