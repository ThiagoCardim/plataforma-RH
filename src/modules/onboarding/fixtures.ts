import "server-only";
import {
  type Scope,
  type State,
  type Stage,
  type Template,
  type Contract,
  project,
  defaultDuration,
  compose,
} from "./model";
function stage(
  name: string,
  days: number,
  owner: Stage["owner"],
  technical = false,
): Stage {
  return {
    id: crypto.randomUUID(),
    name,
    days,
    owner,
    public: owner === "Profissional",
    tasks: [
      {
        id: crypto.randomUUID(),
        title: technical
          ? "Conhecer o fluxo de entrega do setor"
          : "Conhecer os valores e os canais da YouCon",
        required: true,
        done: false,
      },
      {
        id: crypto.randomUUID(),
        title: technical
          ? "Realizar a primeira entrega acompanhada"
          : "Participar da conversa de boas-vindas",
        required: true,
        done: false,
      },
    ],
    blocks: [
      {
        id: crypto.randomUUID(),
        kind: "Texto",
        text: technical
          ? "Explore as ferramentas da equipe, combine expectativas com sua liderança e registre suas dúvidas. Conteúdo inteiramente fictício."
          : "Boas-vindas à YouCon! Aqui começa uma jornada de conexão, aprendizado e colaboração. Esta é uma demonstração fictícia.",
      },
      {
        id: crypto.randomUUID(),
        kind: "Checklist",
        text: "Conhecer a equipe\nRevisar os materiais\nRegistrar dúvidas",
      },
      {
        id: crypto.randomUUID(),
        kind: "Formulário",
        text: "O que você espera desta jornada?\nComo podemos apoiar seu início?",
      },
      {
        id: crypto.randomUUID(),
        kind: "Reunião",
        text: "Conversa de acompanhamento",
        url: "",
      },
    ],
    answers: {},
    checked: [],
  };
}
export function demoOnboarding(scope: Scope): State {
  const templates: Template[] = (
    ["CLT", "Estágio", "PJ"] as Contract[]
  ).flatMap((contract) => [
    {
      id: `inst-${contract}`,
      name: `Boas-vindas YouCon · ${contract}`,
      track: "institutional" as const,
      contract,
      sector: "Todos",
      job: "Todos",
      leader: scope.user,
      status: "Aprovado" as const,
      version: 1,
      stages: [
        stage("Preparar a chegada", 0, "RH"),
        stage("Conectar com a cultura", 7, "Profissional"),
        stage("Acompanhar a adaptação", defaultDuration(contract), "RH"),
      ],
    },
    {
      id: `tech-${contract}`,
      name: `Primeiros passos técnicos · ${contract}`,
      track: "technical" as const,
      contract,
      sector: "Todos",
      job: "Todos",
      leader: scope.user,
      status: "Aprovado" as const,
      version: 1,
      stages: [
        stage("Apresentar ferramentas e rotinas", 3, "Liderança", true),
        stage("Primeira entrega acompanhada", 14, "Profissional", true),
      ],
    },
  ]);
  templates.push({
    ...structuredClone(templates[1]),
    id: "architecture",
    name: "Ateliê de projetos · Arquitetura",
    sector: "Arquitetura",
    job: "Analista",
    status: "Em revisão",
    stages: [stage("Padrões de projeto e revisão", 10, "Liderança", true)],
  });
  const columns = [
    { id: "arrival", name: "Preparar chegada", color: "#a8a29e" },
    { id: "welcome", name: "Boas-vindas", color: "#fb923c" },
    { id: "learning", name: "Em desenvolvimento", color: "#a78bfa" },
    { id: "done", name: "Concluído", color: "#34d399" },
  ];
  const names = [
    "Marina Costa",
    "Gabriel Alves",
    "Beatriz Lima",
    "Rafael Souza",
    "Luana Martins",
    "Pedro Rocha",
  ];
  const processes = names.map((name, i) => {
    const contract = (["CLT", "Estágio", "PJ"] as Contract[])[i % 3];
    const start = new Date();
    start.setDate(start.getDate() - [2, 8, 20, 4, 15, 100][i]);
    const tracks = compose(
      templates,
      contract,
      ["Arquitetura", "Engenharia", "Operações"][i % 3],
      "Analista",
    );
    if (i > 0) tracks.institutional[0].tasks.forEach((t) => (t.done = true));
    if (i === 5)
      [...tracks.institutional, ...tracks.technical].forEach((s) =>
        s.tasks.forEach((t) => (t.done = true)),
      );
    return {
      ...tracks,
      id: `demo-onboarding-${i}`,
      name,
      user: i === 0 ? scope.user : `fictional-${i}`,
      leader: i < 4 ? scope.user : "fictional-other-leader",
      leaderName:
        i < 4 ? "Liderança demonstrativa" : "Outra liderança fictícia",
      sector: ["Arquitetura", "Engenharia", "Operações"][i % 3],
      job: "Analista",
      contract,
      start: start.toISOString().slice(0, 10),
      duration: defaultDuration(contract),
      column: columns[[1, 2, 2, 0, 1, 3][i]].id,
      archived: i === 5,
    };
  });
  return project(
    {
      version: 1,
      columns,
      templates,
      processes,
      events: [
        {
          id: "welcome-event",
          at: new Date().toISOString(),
          actor: "RH demonstrativo",
          text: "Jornada de Marina Costa criada com dois modelos aprovados.",
          process: processes[0].id,
        },
      ],
    },
    scope,
  );
}
