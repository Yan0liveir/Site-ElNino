/* ===== Clima em Foco – JavaScript ===== */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- Menu hambúrguer ---------- */
  const burger = $("#burger"), menu = $("#menu");
  function setMenu(open) {
    menu.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  }
  burger.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
  $$("a", menu).forEach(a => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

  /* ---------- Progresso de leitura, voltar ao topo e link ativo ---------- */
  const bar = $("#progress"), totop = $("#totop");
  const links = $$("a", menu);
  const sections = links.map(a => $(a.getAttribute("href"))).filter(Boolean);
  function onScroll() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    totop.classList.toggle("show", h.scrollTop > 600);
    let current = null;
    sections.forEach(s => { if (s.getBoundingClientRect().top <= 120) current = s.id; });
    links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + current));
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();
  totop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- Fases do ENOS ---------- */
  const ensoInfo = {
    neutro: "Condições neutras: os ventos alísios sopram de leste para oeste, a água quente se acumula no Pacífico oeste e águas frias afloram na costa da América do Sul.",
    elnino: "El Niño: os alísios enfraquecem e a água quente avança para o centro e o leste do Pacífico. A superfície do mar fica mais quente que a média e a circulação da atmosfera muda.",
    lanina: "La Niña: os alísios se intensificam, a água quente fica ainda mais concentrada no oeste e o Pacífico central/leste esfria acima do normal."
  };
  const ensoBox = $("#enso"), ensoSvg = $(".enso-svg", ensoBox), ensoText = $("#ensoText");
  function setEnso(state) {
    ensoSvg.dataset.state = state;
    ensoText.textContent = ensoInfo[state];
    $$("[role=tab]", ensoBox).forEach(b => b.setAttribute("aria-selected", String(b.dataset.state === state)));
  }
  $$("[role=tab]", ensoBox).forEach(b => b.addEventListener("click", () => setEnso(b.dataset.state)));
  setEnso("elnino");

  /* ---------- Regiões do Brasil ---------- */
  const regions = {
    "Norte": "Tendência de chuvas abaixo da média e temperaturas mais altas, com maior risco de seca, queda no nível dos rios e incêndios florestais. Isso foi observado em 2015–2016 e em 2023.",
    "Nordeste": "O norte do Nordeste, incluindo o semiárido, tende a ter chuvas abaixo da média na estação chuvosa, o que aumenta o risco de estiagem e de perdas agrícolas.",
    "Centro-Oeste": "O sinal é menos consistente. Costuma haver temperaturas acima da média e chuvas irregulares, o que pode prolongar períodos secos e favorecer queimadas.",
    "Sudeste": "Tendência de temperaturas mais elevadas e de ondas de calor mais frequentes. A chuva varia bastante de um episódio para outro.",
    "Sul": "Tendência de chuvas acima da média, com maior risco de enchentes e deslizamentos, como ocorreu em episódios como os de 2015 e 2023."
  };
  const regTabs = $("#regions .tabs");
  function setRegion(name) {
    $("#regTitle").textContent = name;
    $("#regText").textContent = regions[name];
    $$("button", regTabs).forEach(b => b.setAttribute("aria-selected", String(b.textContent === name)));
  }
  Object.keys(regions).forEach(name => {
    const b = document.createElement("button");
    b.type = "button"; b.setAttribute("role", "tab"); b.textContent = name;
    b.addEventListener("click", () => setRegion(name));
    regTabs.appendChild(b);
  });
  setRegion("Sul");

  /* ---------- Motor das atividades ---------- */
  function shuffle(a) {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  }
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  /* cfg: {body, count, data, fixed, themes, messages:[[min, texto]...], unit} */
  function runActivity(cfg) {
    let order, idx, score, byTheme;
    function start() {
      order = shuffle(cfg.data);
      idx = 0; score = 0; byTheme = {};
      show();
    }
    function show() {
      cfg.body.innerHTML = "";
      cfg.count.textContent = (idx + 1) + " de " + order.length;
      const q = order[idx];
      const prog = el("div", "bar-prog"); const fill = el("i"); fill.style.width = (idx / order.length * 100) + "%";
      prog.appendChild(fill);
      const title = el("p", "q", q.q);
      const opts = el("div", cfg.binary ? "opts two" : "opts");
      const list = q.options.map((t, i) => ({ t, ok: i === q.answer }));
      (cfg.binary ? list : shuffle(list)).forEach(o => {
        const b = el("button", "opt", o.t); b.type = "button";
        b.addEventListener("click", () => answer(b, o.ok, q, opts, fb, next));
        b.dataset.ok = o.ok ? "1" : "0";
        opts.appendChild(b);
      });
      const fb = el("div", "fb"); fb.hidden = true; fb.setAttribute("aria-live", "polite");
      const next = el("button", "btn dark", idx === order.length - 1 ? "Ver resultado" : "Próxima pergunta");
      next.type = "button"; next.hidden = true; next.addEventListener("click", () => { idx++; idx < order.length ? show() : finish(); });
      const row = el("div", "act-actions"); row.appendChild(next);
      cfg.body.append(prog, title, opts, fb, row);
    }
    function answer(btn, ok, q, opts, fb, next) {
      $$("button", opts).forEach(b => {
        b.disabled = true;
        if (b.dataset.ok === "1") b.classList.add("ok");
      });
      if (!ok) btn.classList.add("bad");
      if (ok) score++;
      if (q.theme) { byTheme[q.theme] = byTheme[q.theme] || [0, 0]; byTheme[q.theme][1]++; if (ok) byTheme[q.theme][0]++; }
      fb.hidden = false; fb.textContent = "";
      const lab = el("b", ok ? "ok" : "bad", ok ? "Correto. " : "Incorreto. ");
      fb.append(lab, document.createTextNode(q.explain));
      next.hidden = false; next.focus();
    }
    function finish() {
      cfg.body.innerHTML = "";
      cfg.count.textContent = "Concluído";
      const pct = score / order.length;
      const msg = cfg.messages.find(m => pct >= m[0])[1];
      const res = el("div", "result");
      res.append(el("div", "score", score + " / " + order.length), el("p", "", Math.round(pct * 100) + "% de acertos"), el("p", "", msg));
      res.lastChild.style.marginInline = "auto";
      const themes = Object.keys(byTheme);
      themes.forEach(t => {
        const r = el("div", "theme-row"); r.append(el("span", "", t), el("strong", "", byTheme[t][0] + " de " + byTheme[t][1]));
        res.appendChild(r);
      });
      const again = el("button", "btn line", "Refazer atividade"); again.type = "button"; again.addEventListener("click", start);
      const row = el("div", "act-actions"); row.style.justifyContent = "center"; row.appendChild(again);
      res.appendChild(row);
      cfg.body.appendChild(res);
    }
    start();
  }

  /* ---------- Dados: Quiz ---------- */
  const quiz = [
    { q: "Qual gás é o principal responsável pelo reforço do efeito estufa causado por atividades humanas?", options: ["Dióxido de carbono (CO₂)", "Oxigênio (O₂)", "Nitrogênio (N₂)", "Hélio (He)"], answer: 0, explain: "O CO₂, emitido principalmente pela queima de combustíveis fósseis e pelo desmatamento, é o maior responsável pelo aquecimento causado pelo ser humano." },
    { q: "Qual é a diferença entre tempo e clima?", options: ["São sinônimos", "Clima é o padrão médio do tempo ao longo de décadas", "Tempo é a média de 30 anos", "Clima só muda nos polos"], answer: 1, explain: "Tempo é a condição momentânea da atmosfera. Clima é o padrão médio, observado em períodos de 30 anos ou mais." },
    { q: "O que acontece com os ventos alísios durante um El Niño?", options: ["Ficam mais fortes", "Mudam para o Atlântico", "Enfraquecem", "Deixam de existir"], answer: 2, explain: "Os alísios enfraquecem, o que permite que a água quente se desloque para o centro e o leste do Pacífico." },
    { q: "Qual região brasileira costuma ter chuvas acima da média durante o El Niño?", options: ["Sul", "Norte", "Norte do Nordeste", "Nenhuma"], answer: 0, explain: "O Sul tem tendência de mais chuva. Já o Norte e o norte do Nordeste tendem a ficar mais secos." },
    { q: "Quanto o planeta aqueceu, em média, de 2011–2020 em relação a 1850–1900, segundo o IPCC?", options: ["Cerca de 0,1 °C", "Cerca de 1,1 °C", "Cerca de 5 °C", "Cerca de 10 °C"], answer: 1, explain: "O IPCC (AR6) estima aquecimento de cerca de 1,1 °C, mesmo parecendo pouco. Pequenas variações na média alteram muito os extremos." },
    { q: "O que contribui para a elevação do nível do mar?", options: ["Só a chuva", "Expansão da água aquecida e derretimento do gelo continental", "A evaporação dos oceanos", "O aumento das marés"], answer: 1, explain: "A água se expande ao aquecer e o gelo de terra firme, como geleiras e calotas, derrete e escoa para o mar." },
    { q: "O que caracteriza a La Niña?", options: ["Aquecimento anormal do Pacífico central e leste", "Resfriamento anormal do Pacífico central e leste", "Fim do efeito estufa", "Um tipo de furacão"], answer: 1, explain: "La Niña é a fase fria do ENOS: os alísios ficam mais fortes e a superfície do Pacífico central e leste esfria." },
    { q: "Na lógica dos 3 Rs (reduzir, reutilizar, reciclar), qual atitude vem em primeiro lugar?", options: ["Reciclar", "Reduzir o consumo", "Descartar", "Incinerar"], answer: 1, explain: "Evitar a geração de resíduos é a opção que menos consome recursos e energia. Reciclar é importante, mas vem por último." }
  ];

  /* ---------- Dados: Mito ou verdade ---------- */
  const T = ["Verdade", "Mito"];
  const myths = [
    { q: "Um dia muito frio prova que o aquecimento global não existe.", options: T, answer: 1, explain: "Mito. Tempo e clima são diferentes. O aquecimento global é medido por médias de longo prazo, e dias frios ainda ocorrem." },
    { q: "O El Niño é um fenômeno natural que existe há muito tempo.", options: T, answer: 0, explain: "Verdade. O ENOS é uma variação natural do sistema oceano-atmosfera. Os cientistas estudam se o aquecimento global altera sua intensidade e seus efeitos." },
    { q: "Sem nenhum efeito estufa, a Terra seria mais agradável.", options: T, answer: 1, explain: "Mito. O efeito estufa natural mantém o planeta habitável. Sem ele, a temperatura média seria cerca de −18 °C. O problema é o excesso de gases emitidos." },
    { q: "Os oceanos armazenam a maior parte do calor extra retido pelo aquecimento global.", options: T, answer: 0, explain: "Verdade. Segundo o IPCC, mais de 90% do excesso de calor ficou armazenado nos oceanos." },
    { q: "O El Niño causa exatamente os mesmos efeitos em todas as regiões do Brasil e em todos os episódios.", options: T, answer: 1, explain: "Mito. Há tendências por região, mas cada episódio é diferente e é influenciado por outros fatores, como o Atlântico." },
    { q: "O nível do mar sobe apenas por causa do derretimento do gelo.", options: T, answer: 1, explain: "Mito. A expansão térmica da água também contribui bastante. Além disso, só o gelo que está em terra eleva o nível ao derreter." },
    { q: "Desmatamento e queimadas liberam carbono para a atmosfera.", options: T, answer: 0, explain: "Verdade. As árvores armazenam carbono. Ao serem derrubadas ou queimadas, parte dele volta à atmosfera como CO₂." }
  ];

  /* ---------- Dados: Desafio ---------- */
  const challenge = [
    { theme: "Conceitos", q: "O jornal informa que amanhã haverá tempestade em Recife. Isso descreve:", options: ["O clima da cidade", "O tempo", "Uma mudança climática", "O El Niño"], answer: 1, explain: "Uma previsão para o dia seguinte descreve o tempo, não o clima." },
    { theme: "El Niño", q: "A água do Pacífico central está acima da média há meses e os alísios estão fracos. Qual é a fase do ENOS?", options: ["La Niña", "Neutra", "El Niño", "Inverno rigoroso"], answer: 2, explain: "Esse é o quadro típico de El Niño: aquecimento anormal da superfície e alísios enfraquecidos." },
    { theme: "El Niño", q: "Qual impacto é típico do El Niño no norte do Nordeste?", options: ["Chuvas acima da média", "Chuvas abaixo da média", "Neve", "Nenhum efeito possível"], answer: 1, explain: "Chuvas abaixo da média na estação chuvosa são uma tendência do El Niño na região." },
    { theme: "Impactos", q: "O branqueamento em massa de corais está ligado principalmente a:", options: ["Ondas de calor marinhas", "Terremotos", "Falta de sal", "Aumento da luz da Lua"], answer: 0, explain: "A água muito quente leva os corais a expulsar as algas de que dependem, o que provoca o branqueamento." },
    { theme: "Impactos", q: "Por que uma atmosfera mais quente favorece chuvas mais intensas?", options: ["Porque o ar quente retém mais vapor de água", "Porque há menos nuvens", "Porque o vento para", "Porque a água fica mais pesada"], answer: 0, explain: "O ar mais quente comporta mais vapor de água, que pode ser liberado em chuvas mais fortes." },
    { theme: "Ações", q: "Qual escolha cotidiana reduz mais as emissões de CO₂ no deslocamento para a escola ou trabalho?", options: ["Ir sozinho de carro", "Usar transporte coletivo, bicicleta ou ir a pé", "Deixar o motor ligado", "Trocar de carro todo ano"], answer: 1, explain: "Transporte coletivo e modos ativos emitem muito menos CO₂ por pessoa." }
  ];

  runActivity({
    body: $("#quizBody"), count: $("#quizCount"), data: quiz,
    messages: [[0.85, "Excelente! Você domina bem o assunto. Compartilhe o que aprendeu."], [0.5, "Bom caminho! Releia as seções e tente de novo para chegar ao topo."], [0, "Tudo bem, o importante é aprender. Releia o conteúdo do site e tente novamente."]]
  });
  runActivity({
    body: $("#mythBody"), count: $("#mythCount"), data: myths, binary: true,
    messages: [[0.85, "Ótimo olhar crítico! Você distingue bem informação confiável de desinformação."], [0.5, "Bom resultado. Alguns mitos são persuasivos, vale revisar as explicações."], [0, "Mitos são comuns e fáceis de acreditar. Releia as explicações e tente de novo."]]
  });
  runActivity({
    body: $("#chBody"), count: $("#chCount"), data: challenge,
    messages: [[0.85, "Desempenho de destaque! Você entendeu conceitos, El Niño, impactos e ações."], [0.5, "Bom desempenho. Veja os temas abaixo para saber onde revisar."], [0, "Use os temas abaixo para decidir o que revisar e tente novamente."]]
  });
})();
