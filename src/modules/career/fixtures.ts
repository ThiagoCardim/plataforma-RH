import "server-only";
import {
  type CareerState,
  type CareerRole,
  type Person,
  type Scope,
  type Movement,
  type Finance,
  uid,
  dateNow,
  impact,
  projection,
} from "./model";
export function peopleFor(ctx: Scope): Person[] {
  return [
    "Marina Demo",
    "Gabriel Exemplo",
    "Luana Teste",
    "Rafael Demo",
    "Estúdio PJ Fictício",
    "Clara Exemplo",
  ].map((name, i) => ({
    id: `career-person-${i}`,
    user: i === 0 ? ctx.user : `career-user-${i}`,
    org: ctx.org,
    name,
    sector:
      i === 4
        ? "engineering"
        : [
            "architecture",
            "engineering",
            "architecture",
            "operations",
            "engineering",
            "architecture",
          ][i],
    contract:
      i === 0 ? ctx.contract : i === 3 ? "Estágio" : i === 4 ? "PJ" : "CLT",
    role:
      (i === 0 && ctx.contract === "PJ") || i === 4
        ? ""
        : `${["architecture", "engineering", "architecture", "operations", "engineering", "architecture"][i]}-${i === 3 ? "base1" : "base2"}`,
    leader:
      i > 0 && i < 4 && ctx.leader
        ? ctx.user
        : i === 0
          ? "career-other-leader"
          : "career-team-leader",
    leaderName:
      i > 0 && i < 4 && ctx.leader ? ctx.name : "Liderança demonstrativa",
    service: i === 4 ? "Consultoria de projetos" : undefined,
  }));
}
export function demoCareer(ctx: Scope): CareerState {
  const today = dateNow(),
    at = new Date().toISOString();
  const sectors = [
    {
      id: "architecture",
      name: "Arquitetura",
      intro: "Projetos que conectam pessoas, espaço e intenção.",
    },
    {
      id: "engineering",
      name: "Engenharia",
      intro: "Rigor técnico, colaboração e continuidade nas entregas.",
    },
    {
      id: "operations",
      name: "Operações",
      intro: "Processos consistentes para sustentar o crescimento.",
    },
  ];
  const roles: CareerRole[] = sectors.flatMap((s) =>
    [
      {
        id: `${s.id}-base1`,
        sector: s.id,
        title: "Assistente",
        level: 1,
        levelName: "Fundamentos",
        branch: "Base" as const,
        parent: undefined,
      },
      {
        id: `${s.id}-base2`,
        sector: s.id,
        title: "Analista",
        level: 2,
        levelName: "Consolidação",
        branch: "Base" as const,
        parent: `${s.id}-base1`,
      },
      {
        id: `${s.id}-tech1`,
        sector: s.id,
        title: "Especialista",
        level: 3,
        levelName: "Especialização",
        branch: "Técnica" as const,
        parent: `${s.id}-base2`,
      },
      {
        id: `${s.id}-tech2`,
        sector: s.id,
        title: "Referência Técnica",
        level: 4,
        levelName: "Referência",
        branch: "Técnica" as const,
        parent: `${s.id}-tech1`,
      },
      {
        id: `${s.id}-lead1`,
        sector: s.id,
        title: "Coordenação",
        level: 3,
        levelName: "Coordenação",
        branch: "Liderança" as const,
        parent: `${s.id}-base2`,
      },
      {
        id: `${s.id}-lead2`,
        sector: s.id,
        title: "Gestão",
        level: 4,
        levelName: "Gestão",
        branch: "Liderança" as const,
        parent: `${s.id}-lead1`,
      },
    ].map((r) => ({
      ...r,
      responsibilities:
        r.branch === "Liderança"
          ? [
              "Organizar prioridades e acompanhar a equipe",
              "Promover feedbacks e qualidade das entregas",
            ]
          : [
              "Entregar com qualidade e responsabilidade",
              "Compartilhar conhecimento com a equipe",
            ],
      requirements: [
        "Comunicação clara e colaboração",
        "Domínio das práticas aplicáveis ao contexto",
      ],
      competencies: [
        {
          name: "Conhecimento técnico",
          description: "Aplicar fundamentos e revisar decisões com critério.",
        },
        {
          name: "Colaboração",
          description:
            "Construir soluções em conjunto e compartilhar contexto.",
        },
        {
          name:
            r.branch === "Liderança"
              ? "Desenvolvimento de pessoas"
              : "Autonomia responsável",
          description:
            r.branch === "Liderança"
              ? "Apoiar a evolução da equipe por meio de conversas e acompanhamento."
              : "Conduzir entregas com clareza sobre prioridades e limites.",
        },
      ],
      published: true,
    })),
  );
  const people = peopleFor(ctx),
    finance: Finance = {
      compensation: people.map((p, i) => ({
        person: p.id,
        gross:
          p.contract === "PJ"
            ? 800000
            : p.contract === "Estágio"
              ? 180000
              : [500000, 550000, 520000, 180000, 800000, 570000][i],
      })),
      bands: roles.map((r) => ({
        id: `band-${r.id}`,
        contract: "CLT",
        role: r.id,
        label: `${r.title} · ${sectors.find((s) => s.id === r.sector)?.name}`,
        min: 200000 + r.level * 100000,
        reference: 250000 + r.level * 150000,
        max: 300000 + r.level * 200000,
      })),
      cycles: [
        {
          id: "recognition-cycle-1",
          name: "Reconhecimento sustentável · Demonstração",
          start: today.slice(0, 4) + "-01-01",
          end: today.slice(0, 4) + "-12-31",
          months: 12,
          status: "Aberto",
          revenueTarget: 30000000,
          revenueActual: 28000000,
          costTarget: 21000000,
          costActual: 20500000,
          budget: 12000000,
        },
      ],
      rates: {
        CLT: { charges: 20, provisions: 18 },
        Estágio: { charges: 5, provisions: 8 },
        PJ: { charges: 0, provisions: 0 },
      },
      movements: [],
    };
  finance.bands.push(
    {
      id: "band-intern",
      contract: "Estágio",
      role: "operations-base1",
      label: "Bolsa de estágio · Operações",
      min: 150000,
      reference: 180000,
      max: 220000,
    },
    {
      id: "band-pj",
      contract: "PJ",
      role: "",
      label: "Consultoria de projetos · Honorários PJ",
      min: 600000,
      reference: 800000,
      max: 1000000,
    },
  );
  function movement(
    i: number,
    status: Movement["status"],
    personId: string,
    kind: Movement["kind"],
    delta: number,
  ): Movement {
    const p = people.find((p) => p.id === personId)!,
      current = finance.compensation.find((c) => c.person === personId)!.gross;
    const m: Movement = {
      id: `movement-${i}`,
      person: personId,
      cycle: finance.cycles[0].id,
      kind,
      current,
      proposed: current + delta,
      targetRole: kind === "Promoção" ? `${p.sector}-tech1` : "",
      effective: today,
      merit:
        "Análise fictícia de qualidade das entregas, colaboração e contribuição ao contexto organizacional. Não estabelece uma regra definitiva de reconhecimento.",
      rates: structuredClone(finance.rates[p.contract]),
      months: 12,
      status,
      by: "fictional-rh-analyst",
      at,
      events: [
        {
          id: uid(),
          at,
          by: "RH demonstrativo",
          text: "Análise demonstrativa conduzida pelo RH.",
        },
      ],
      approvedBy: ["Aprovado", "Efetivado"].includes(status)
        ? "fictional-director"
        : undefined,
    };
    if (["Em análise", "Aprovado", "Efetivado"].includes(status))
      m.quote = impact(m);
    return m;
  }
  finance.movements = [
    movement(1, "Em análise", people[1].id, "Promoção", 60000),
    movement(2, "Rascunho", people[4].id, "Honorários PJ", 40000),
    movement(3, "Aprovado", people[2].id, "Mérito", 30000),
    movement(4, "Efetivado", people[5].id, "Reajuste salarial", 20000),
  ];
  finance.compensation = finance.compensation.map((c) =>
    c.person === people[5].id ? { ...c, gross: c.gross + 20000 } : c,
  );
  const state: CareerState = {
    version: 1,
    org: ctx.org,
    sectors,
    roles,
    people,
    finance,
    history: people
      .filter((p) => p.contract !== "PJ")
      .map((p) => ({
        id: uid(),
        person: p.id,
        date: today.slice(0, 4) + "-01-15",
        title: "Posicionamento cadastrado na demonstração",
        from: "",
        to: roles.find((r) => r.id === p.role)?.title ?? "Assistente",
      })),
    directives: [
      {
        id: "career-directive-1",
        version: 1,
        text: "Desenvolvimento com clareza e responsabilidade\n\nAs trilhas apresentam possibilidades de atuação técnica e de liderança. Cargos descrevem responsabilidades e competências esperadas, sem constituir promessa de promoção.\n\nReconhecimentos são analisados de forma confidencial pelo RH e aprovados pela Diretoria, considerando mérito, contexto e sustentabilidade financeira. Tempo de empresa, cursos, certificações ou conclusão de um PDI não geram progressão automática.\n\nPDI é um plano de desenvolvimento de CLT e estagiários, criado pela liderança e aprovado pelo RH. PJs são tratados exclusivamente no reconhecimento contratual, sem integrar trilhas ou PDI de empregados.\n\nEsta experiência usa dados fictícios e efeitos apenas locais.",
        at,
        by: "RH demonstrativo",
        published: true,
      },
    ],
    publications: [
      {
        id: "career-news-1",
        title: "Conhecimento que circula",
        body: "Resultado organizacional fictício: a equipe consolidou uma biblioteca de boas práticas e compartilhou aprendizados entre os setores. Publicação institucional autorizada pelo RH.",
        at,
        by: "RH demonstrativo",
        published: true,
      },
    ],
    events: [
      {
        id: uid(),
        at,
        by: "RH demonstrativo",
        text: "Estrutura em Y disponibilizada para exploração, sem previsão de progressão.",
      },
    ],
  };
  return projection(state, ctx);
}
