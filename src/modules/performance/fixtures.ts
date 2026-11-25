import "server-only";
import { type Scope, uid, dateNow } from "../career/model";
import {
  type PerformanceState,
  type Template,
  type Member,
  type Evaluation,
  type Category,
  type Campaign,
  type Award,
  materialize,
  projection,
  values,
  dimensions,
  compatible,
} from "./model";
export function demoPerformance(ctx: Scope): PerformanceState {
  const today = dateNow(),
    year = Number(today.slice(0, 4)),
    month = today.slice(0, 7),
    semester = (Number(today.slice(5, 7)) <= 6 ? 1 : 2) as 1 | 2,
    at = new Date().toISOString();
  const areas = [
    {
      id: "architecture",
      name: "Arquitetura",
      functions: [{ id: "architecture-analyst", name: "Analista de projetos" }],
    },
    {
      id: "engineering",
      name: "Engenharia",
      functions: [
        { id: "engineering-analyst", name: "Projetista de engenharia" },
        { id: "engineering-service", name: "Consultoria contratual" },
      ],
    },
    {
      id: "approval",
      name: "Aprovação",
      functions: [
        { id: "approval-analyst", name: "Analista de aprovação" },
        { id: "approval-service", name: "Serviços de aprovação" },
      ],
    },
    {
      id: "interiors",
      name: "Interiores",
      functions: [
        { id: "interiors-analyst", name: "Projetista de interiores" },
      ],
    },
    {
      id: "revenue",
      name: "Revenue",
      functions: [
        { id: "marketing", name: "Marketing" },
        { id: "sales", name: "Comercial" },
      ],
    },
    {
      id: "operations",
      name: "Operações · apoio",
      functions: [
        { id: "operations-assistant", name: "Assistência de operações" },
      ],
    },
  ];
  const names = [
    "Marina Demo",
    "Gabriel Exemplo",
    "Luana Teste",
    "Rafael Demo",
    "Estúdio PJ Fictício",
    "Clara Exemplo",
    "Ana Modelo",
    "Bruno Demo",
    "Lia Exemplo",
    "Núcleo Comercial PJ",
    "Camila Liderança",
    "Diego Liderança",
    "Ateliê Aprovação PJ",
    "Júlia Modelo",
    "Pedro Teste",
    "Sofia Demo",
  ];
  const sectors = [
    "architecture",
    "engineering",
    "architecture",
    "operations",
    "engineering",
    "architecture",
    "approval",
    "interiors",
    "revenue",
    "revenue",
    "architecture",
    "engineering",
    "approval",
    "interiors",
    "revenue",
    "revenue",
  ];
  const people: Member[] = names.map((name, i) => ({
    id: `career-person-${i}`,
    user: i === 0 ? ctx.user : `career-user-${i}`,
    org: ctx.org,
    name,
    sector: sectors[i],
    functionId:
      i === 4
        ? "engineering-service"
        : i === 12
          ? "approval-service"
          : i === 8 || i === 14
            ? "marketing"
            : i === 9 || i === 15
              ? "sales"
              : areas.find((a) => a.id === sectors[i])!.functions[0].id,
    contract:
      i === 0
        ? ctx.contract
        : [4, 9, 12].includes(i)
          ? "PJ"
          : [3, 7, 14].includes(i)
            ? "Estágio"
            : "CLT",
    leader:
      ctx.leader && [1, 2, 3, 5].includes(i)
        ? ctx.user
        : i === 0
          ? "career-other-leader"
          : "career-team-leader",
    isLeader: i === 0 ? ctx.leader : [10, 11].includes(i),
  }));
  const templates: Template[] = [];
  for (const area of areas)
    for (const fun of area.functions) {
      const subject =
        fun.id === "marketing"
          ? "Oportunidades qualificadas de marketing"
          : fun.id === "sales"
            ? "Conversões comerciais qualificadas"
            : fun.id.includes("service")
              ? "Marcos contratuais aceitos"
              : "Entregas previstas aceitas";
      templates.push({
        id: `op-${fun.id}`,
        name: `${area.name} · ${fun.name}`,
        kind: "Operacional",
        sector: area.id,
        functionId: fun.id,
        contracts: ["CLT", "Estágio", "PJ"],
        leaderPerson: "",
        version: 1,
        min: 0,
        max: 100,
        periodicity: "Mensal · demonstração",
        updatedAt: at,
        criteria: dimensions.map((dimension, i) => ({
          id: `criterion-${fun.id}-${i}`,
          name:
            i === 0
              ? subject
              : [
                  subject,
                  "Qualidade das entregas",
                  "Cumprimento de prazos",
                  "Complexidade atendida",
                  "Resultado acordado",
                ][i],
          dimension,
          question: `Qual o realizado frente à expectativa de ${dimension.toLowerCase()} desta função/serviço?`,
          weight: 1,
          target:
            i === 0
              ? fun.id === "marketing"
                ? 12
                : fun.id === "sales"
                  ? 4
                  : 10
              : 100,
          direction: "Maior é melhor",
          unit: i === 0 ? "entregas acordadas" : "% da expectativa",
        })),
      });
    }
  templates.push({
    id: "behavior-culture",
    name: "Valores YouCon · CLT e Estágio",
    kind: "Comportamental",
    sector: "",
    functionId: "",
    leaderPerson: "",
    contracts: ["CLT", "Estágio"],
    version: 1,
    min: 1,
    max: 5,
    periodicity: "Trimestral · demonstração",
    updatedAt: at,
    criteria: values.map((v, i) => ({
      id: `culture-${i}`,
      name: v,
      dimension: v,
      question: `Que situações observáveis demonstram ${v.toLowerCase()} neste ciclo?`,
      weight: 1,
      target: 1,
      direction: "Maior é melhor",
      unit: "escala demonstrativa",
    })),
  });
  for (const p of people.filter((p) => p.isLeader && p.contract !== "PJ"))
    templates.push({
      id: `lead-${p.id}`,
      name: `Acompanhamento personalizado · ${p.name}`,
      kind: "Liderança",
      sector: p.sector,
      functionId: "",
      leaderPerson: p.id,
      contracts: ["CLT", "Estágio"],
      version: 1,
      min: 1,
      max: 5,
      periodicity: "Mensal · demonstração",
      updatedAt: at,
      criteria: [
        {
          id: "lead-common",
          name: "Clareza e desenvolvimento da equipe",
          dimension: "Gestão",
          question: "Como orienta, acompanha e desenvolve as pessoas?",
          weight: 1,
          target: 1,
          direction: "Maior é melhor",
          unit: "escala",
        },
        {
          id: "lead-sector",
          name: `Continuidade das entregas · ${areas.find((a) => a.id === p.sector)?.name}`,
          dimension: "Setor",
          question:
            "Como remove impedimentos e conduz as responsabilidades recorrentes do setor?",
          weight: 1,
          target: 1,
          direction: "Maior é melhor",
          unit: "escala",
        },
      ],
    });
  const cycles = [
    {
      id: "performance-current",
      name: "Ciclo de desenvolvimento · demonstração",
      start: `${year}-01-01`,
      end: `${year}-12-31`,
      state: "Aberto" as const,
    },
    {
      id: "performance-history",
      name: "Ciclo anterior · histórico demonstrativo",
      start: `${year - 1}-01-01`,
      end: `${year - 1}-12-31`,
      state: "Encerrado" as const,
    },
  ];
  cycles.push({
    id: "performance-lab",
    name: "Laboratório de avaliação · ciclo configurável",
    start: `${year}-01-01`,
    end: `${year}-12-31`,
    state: "Aberto",
  });
  const evaluations: Evaluation[] = [];
  for (const p of people) {
    const ts = templates.filter(
      (t) =>
        compatible(t, p) &&
        ((p.isLeader && t.kind === "Liderança") ||
          (!p.isLeader && t.kind !== "Liderança")),
    );
    for (const t of ts) {
      const status =
        p.id === "career-person-2" && t.kind === "Operacional"
          ? "Em validação"
          : p.id === "career-person-3" && t.kind === "Operacional"
            ? "Rascunho"
            : p.id === "career-person-10"
              ? "Rascunho"
              : "Publicada";
      evaluations.push({
        id: `evaluation-${p.id}-${t.kind}`,
        person: p.id,
        cycle: structuredClone(cycles[0]),
        template: structuredClone(t),
        answers: t.criteria.map((cr, i) => ({
          criterion: cr.id,
          value:
            t.kind === "Operacional"
              ? Math.round(
                  cr.target *
                    (0.82 + ((Number(p.id.split("-").at(-1)) + i) % 4) * 0.08),
                )
              : i === 4
                ? null
                : 4,
          justification:
            i === 4 && t.kind === "Comportamental"
              ? "Não houve situação observável suficiente neste período."
              : "Entregas e expectativas verificadas em exemplos fictícios deste ciclo.",
          evidence:
            "Referência demonstrativa: revisão acompanhada e material aceito.",
        })),
        status,
        author: "synthetic-assessor",
        reviewer: status === "Publicada" ? "synthetic-rh" : undefined,
        releasedAt: status === "Publicada" ? at : undefined,
        events: [
          {
            id: uid(),
            at,
            by: "RH demonstrativo",
            text:
              status === "Publicada"
                ? "Publicação de avaliação fictícia finalizada e liberada."
                : "Exemplo em elaboração/validação para testar o fluxo.",
          },
        ],
      });
    }
  }
  for (const current of [...evaluations])
    evaluations.push({
      ...structuredClone(current),
      id: current.id + "-history",
      cycle: structuredClone(cycles[1]),
      status: "Publicada",
      author: "synthetic-assessor",
      reviewer: "synthetic-rh",
      releasedAt: `${year - 1}-12-20T15:00:00Z`,
      answers: current.answers.map((a) => ({
        ...a,
        value:
          a.value === null
            ? null
            : current.template.kind === "Operacional"
              ? Math.round(a.value * 0.9)
              : 3,
      })),
      events: [
        {
          id: uid(),
          at: `${year - 1}-12-20T15:00:00Z`,
          by: "RH demonstrativo",
          text: "Publicação histórica com critérios de origem preservados.",
        },
      ],
    });
  const categories: Category[] = [
    ...areas
      .filter((a) => a.id !== "operations")
      .map((a) => ({
        id: `hall-${a.id}`,
        name: `Destaque de ${a.name}`,
        kind: "Operacional" as const,
        sector: a.id,
        contracts: ["CLT", "Estágio", "PJ"] as Member["contract"][],
        badge: "Excelência nas entregas",
        criteria:
          "Cumprimento das expectativas específicas da função/serviço, qualidade e prazos. Pesos e critérios são apenas demonstrativos.",
        enabled: true,
      })),
    {
      id: "hall-culture",
      name: "Destaque Cultural",
      kind: "Comportamental",
      sector: "",
      contracts: ["CLT", "Estágio"],
      badge: "Valores em ação",
      criteria:
        "Situações observáveis dos valores YouCon; exclusivo de empregados e estagiários.",
      enabled: true,
    },
    {
      id: "hall-leadership",
      name: "Destaque de Liderança",
      kind: "Liderança",
      sector: "",
      contracts: ["CLT", "Estágio"],
      badge: "Liderança que inspira",
      criteria:
        "Categoria independente; análise humana do acompanhamento de gestão.",
      enabled: true,
    },
  ];
  const campaigns: Campaign[] = [
    {
      id: `campaign-${year}-${semester}`,
      name: `Temporada ${semester} · ${year}`,
      year,
      semester,
      prize:
        "Reconhecimento simbólico · premiações ainda serão definidas pelo RH",
      tie: "Empate compartilhado",
      tieOrder: [],
      points: 1,
    },
    {
      id: `campaign-${semester === 1 ? year - 1 : year}-${semester === 1 ? 2 : 1}`,
      name: "Temporada anterior · arquivo",
      year: semester === 1 ? year - 1 : year,
      semester: semester === 1 ? 2 : 1,
      prize: "Selo demonstrativo de excelência",
      tie: "Empate compartilhado",
      tieOrder: [],
      points: 1,
    },
  ];
  const awards: Award[] = [];
  const winners = [5, 1, 6, 7, 9, 14, 11];
  categories.forEach((cat, i) => {
    const p = people[winners[i]];
    const source = evaluations.find(
      (e) =>
        e.person === p.id &&
        e.template.kind === cat.kind &&
        e.status === "Publicada",
    );
    awards.push({
      id: `award-current-${i}`,
      person: p.id,
      category: structuredClone(cat),
      campaign: structuredClone(campaigns[0]),
      month,
      message: `${p.name}: qualidade, colaboração e consistência nas entregas acordadas. Uma conquista fictícia para celebrar.`,
      phrase:
        i === 4
          ? "Excelência que transforma oportunidades em resultados."
          : "O cuidado em cada entrega constrói grandes conquistas.",
      photo: `/demo/hall/portraits.png#${[1, 0, 3, 2, 4, 2, 4][i]}`,
      order: i + 1,
      points: 1,
      status: "Publicado",
      source: source?.id,
      author: "synthetic-rh",
      validatedBy: "synthetic-director",
      publishedAt: at,
      events: [],
    });
    if (i < 5) {
      for (let n = 0; n < 2; n++) {
        awards.push({
          ...structuredClone(awards.at(-1)!),
          id: `award-history-${i}-${n}`,
          campaign: structuredClone(campaigns[1]),
          month: `${campaigns[1].year}-${String(campaigns[1].semester === 1 ? 5 + n : 10 + n).padStart(2, "0")}`,
        });
      }
    }
  });
  awards.push({
    id: "award-draft",
    person: "career-person-2",
    category: structuredClone(categories[5]),
    campaign: structuredClone(campaigns[0]),
    month: month,
    message:
      "Uma mensagem confidencial preparada pelo RH, ainda não divulgada.",
    phrase: "Cada atitude inspira o próximo passo.",
    photo: "/demo/hall/portraits.png#1",
    order: 8,
    points: 1,
    status: "Rascunho",
    author: "synthetic-rh",
    events: [],
  });
  const cultural = awards.find((a) => a.id === "award-current-5")!;
  cultural.campaign = structuredClone(campaigns[1]);
  cultural.month = `${campaigns[1].year}-${campaigns[1].semester === 1 ? "06" : "12"}`;
  const ownCategory = categories.find(
    (c) =>
      c.kind === (people[0].isLeader ? "Liderança" : "Operacional") &&
      (!c.sector || c.sector === people[0].sector),
  );
  if (ownCategory && !(people[0].isLeader && ctx.contract === "PJ"))
    awards.push({
      id: "award-own-history",
      person: people[0].id,
      category: structuredClone(ownCategory),
      campaign: structuredClone(campaigns[1]),
      month: `${campaigns[1].year}-${campaigns[1].semester === 1 ? "02" : "08"}`,
      message:
        "Conquista fictícia individual, preservada no histórico de uma campanha anterior.",
      phrase: "Um aprendizado que se transforma em uma entrega de excelência.",
      photo: "/demo/hall/portraits.png#1",
      order: 1,
      points: 1,
      status: "Publicado",
      author: "synthetic-rh",
      validatedBy: "synthetic-director",
      publishedAt: at,
      events: [],
    });
  const semesterStart = semester === 1 ? 1 : 7,
    currentMonth = Number(month.slice(5));
  const addPast = (i: number, person: number, monthNumber: number) => {
    if (monthNumber >= currentMonth || monthNumber < semesterStart) return;
    const cat = categories[i],
      p = people[person];
    if (!cat || p.isLeader || !cat.contracts.includes(p.contract)) return;
    awards.push({
      id: `award-semester-${i}-${person}`,
      person: p.id,
      category: structuredClone(cat),
      campaign: structuredClone(campaigns[0]),
      month: `${year}-${String(monthNumber).padStart(2, "0")}`,
      message:
        "Excelência contextualizada das entregas e expectativas da função, reconhecida manualmente nesta demonstração.",
      phrase: "O resultado de hoje começa no cuidado de cada entrega.",
      photo: `/demo/hall/portraits.png#${person % 6}`,
      order: i + 1,
      points: 1,
      status: "Publicado",
      author: "synthetic-rh",
      validatedBy: "synthetic-director",
      publishedAt: at,
      events: [],
    });
  };
  addPast(0, 2, semesterStart);
  addPast(0, 0, semesterStart + 1);
  addPast(0, 5, semesterStart + 2);
  addPast(1, 4, semesterStart);
  addPast(2, 12, semesterStart);
  addPast(3, 13, semesterStart);
  addPast(4, 8, semesterStart);
  addPast(5, 5, semesterStart);
  const responsibility = {
    id: "responsibility-weekly",
    person: "career-person-10",
    name: "Revisar impedimentos e orientar prioridades do setor",
    start: month + "-01",
    end: new Date(Date.UTC(year, Number(month.slice(5)), 0))
      .toISOString()
      .slice(0, 10),
    frequency: "Semanal" as const,
    interval: 7,
    criterion: "Clareza de prioridades e remoção de impedimentos",
  };
  let s: PerformanceState = {
    version: 1,
    org: ctx.org,
    areas,
    people,
    templates,
    cycles,
    evaluations,
    responsibilities: [responsibility],
    occurrences: [],
    diary: [
      {
        id: uid(),
        person: "career-person-10",
        date: today,
        type: "Diário confidencial",
        text: "Registro reservado fictício: acompanhar a conversa sobre distribuição de responsabilidades.",
        by: "RH demonstrativo",
      },
    ],
    categories,
    campaigns,
    awards,
    regulations: [
      {
        id: "regulation-1",
        version: 1,
        published: true,
        at,
        by: "RH demonstrativo",
        text: "Reconhecemos entregas e atitudes de forma contextualizada. Cada setor possui categoria e ranking próprios. Critérios, pesos, pontos, premiações e desempates são demonstrativos e serão definidos pelo RH.\n\nCLT e Estágio: categorias setoriais e Cultural, respeitada a elegibilidade. Lideranças têm categoria independente.\n\nPJ: reconhecimento exclusivamente pela excelência dos serviços prestados, entregas, qualidade e prazos. Não há critérios culturais, comportamentais, disciplinares ou de jornada. Eventuais premiações financeiras a PJ exigem tratamento contratual próprio e autorização específica; esta demonstração não efetua pagamentos.\n\nResultados e vencedores são analisados e divulgados manualmente. Notas individuais e resultados negativos não são publicados no Hall. Campanhas reiniciam o ranking por semestre, preservando os reconhecimentos anteriores. Não há promoção, reajuste, premiação financeira ou divulgação automática.",
      },
    ],
  };
  // Stable portraits across months, campaigns, galleries and ceremony for each fictional person.
  const portraits = [5, 0, 3, 2, 4, 1, 3, 2, 5, 4, 5, 4, 0, 5, 2, 1];
  s.awards = s.awards.map((a) => ({
    ...a,
    photo: `/demo/hall/portraits.png#${portraits[Number(a.person.split("-").at(-1))] ?? 1}`,
  }));
  s = materialize(s);
  s.occurrences = s.occurrences.map((o, i) =>
    i < 2
      ? {
          ...o,
          done: true,
          doneAt: at,
          evidence: "Prioridades e impedimentos revisados na reunião fictícia.",
          feedback: "Boa clareza nas orientações.",
          events: [],
        }
      : o,
  );
  return projection(s, ctx);
}
