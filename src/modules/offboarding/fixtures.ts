import "server-only";
import {
  type Scope,
  type Stage,
  type State,
  type Template,
  type Contract,
  type Termination,
  compose,
  project,
} from "../onboarding/model";
function stage(
  name: string,
  days: number,
  owner: Stage["owner"],
  tasks: string[],
  interview = false,
): Stage {
  return {
    id: crypto.randomUUID(),
    name,
    days,
    owner,
    public: false,
    tasks: tasks.map((title) => ({
      id: crypto.randomUUID(),
      title,
      required: true,
      done: false,
    })),
    blocks: [
      {
        id: crypto.randomUUID(),
        kind: "Texto",
        text:
          owner === "RH"
            ? "Etapa administrativa inteiramente fictícia. Os itens não executam desligamentos, pagamentos ou revogações. Não inclua dados reais."
            : "Registre apenas a transferência operacional demonstrativa. Nenhum acesso ou projeto real será alterado.",
      },
      { id: crypto.randomUUID(), kind: "Checklist", text: tasks.join("\n") },
      ...(interview
        ? [
            {
              id: crypto.randomUUID(),
              kind: "Formulário" as const,
              text: "Quais aprendizados deseja compartilhar?\nQue melhorias sugere para a experiência na equipe?",
            },
            {
              id: crypto.randomUUID(),
              kind: "Reunião" as const,
              text: "Entrevista de desligamento fictícia",
            },
          ]
        : []),
    ],
    answers: {},
    checked: [],
  };
}
export function demoOffboarding(scope: Scope): State {
  const templates: Template[] = (
    ["CLT", "Estágio", "PJ"] as Contract[]
  ).flatMap((contract) =>
    (["Voluntário", "Involuntário"] as Termination[]).flatMap((termination) => [
      {
        id: `off-rh-${contract}-${termination}`,
        name: `Encerramento administrativo · ${contract} · ${termination}`,
        track: "institutional" as const,
        contract,
        termination,
        sector: "Todos",
        job: "Todos",
        status: "Aprovado" as const,
        leader: scope.user,
        version: 1,
        stages: [
          stage("Pendências administrativas e contratuais", 3, "RH", [
            "Conferir documentação fictícia de encerramento",
            "Revisar pendências contratuais demonstrativas",
          ]),
          stage("Planejamento de revogação de acessos", 7, "RH", [
            "Conferir inventário demonstrativo de acessos",
            "Marcar revogação fictícia como conferida (não executa revogação)",
          ]),
          stage(
            "Entrevista de desligamento",
            10,
            "RH",
            [
              "Registrar entrevista fictícia",
              "Conferir encerramento documental demonstrativo",
            ],
            true,
          ),
        ],
      },
      {
        id: `off-ops-${contract}-${termination}`,
        name: `Transferência operacional · ${contract} · ${termination}`,
        track: "technical" as const,
        contract,
        termination,
        sector: "Todos",
        job: "Todos",
        status: "Aprovado" as const,
        leader: scope.user,
        version: 1,
        stages: [
          stage("Transferência de projetos e conhecimento", 5, "Liderança", [
            "Listar projetos demonstrativos em andamento",
            "Registrar responsáveis fictícios pela continuidade",
            "Compartilhar documentação demonstrativa",
          ]),
          stage("Devolução de equipamentos", 7, "Liderança", [
            "Conferir devolução fictícia de notebook e acessórios",
            "Conferir materiais e arquivos de trabalho demonstrativos",
          ]),
        ],
      },
    ]),
  );
  templates.push({
    ...structuredClone(templates[1]),
    id: "off-architecture",
    name: "Transferência de projetos · Arquitetura",
    sector: "Arquitetura",
    status: "Em revisão",
  });
  const columns = [
    { id: "planning", name: "Planejamento", color: "#a8a29e" },
    { id: "handover", name: "Em transferência", color: "#fb923c" },
    { id: "checking", name: "Conferência final", color: "#a78bfa" },
    { id: "done", name: "Concluído", color: "#34d399" },
  ];
  const processes = [
    "Camila Demo",
    "Lucas Exemplo",
    "Sofia Teste",
    "Bruno Demo",
    "Lara Exemplo",
    "André Teste",
  ].map((name, i) => {
    const contract = (["CLT", "Estágio", "PJ"] as Contract[])[i % 3];
    const termination = (["Voluntário", "Involuntário"] as Termination[])[
      i % 2
    ];
    const sector = ["Arquitetura", "Engenharia", "Operações"][i % 3];
    const start = new Date();
    start.setDate(start.getDate() - [1, 6, 9, -2, 4, 35][i]);
    const tracks = compose(
      templates,
      contract,
      sector,
      "Analista",
      termination,
    );
    if (i > 0) tracks.institutional[0].tasks.forEach((t) => (t.done = true));
    if (i === 5)
      [...tracks.institutional, ...tracks.technical].forEach((s) =>
        s.tasks.forEach((t) => (t.done = true)),
      );
    return {
      ...tracks,
      id: `demo-offboarding-${i}`,
      name,
      user: `fictional-off-${i}`,
      leader: i < 4 ? scope.user : "fictional-other-leader",
      leaderName:
        i < 4 ? "Liderança demonstrativa" : "Outra liderança fictícia",
      sector,
      job: "Analista",
      contract,
      termination,
      start: start.toISOString().slice(0, 10),
      duration: 30,
      column: columns[[0, 1, 2, 0, 1, 3][i]].id,
      archived: i === 5,
    };
  });
  return project(
    {
      version: 1,
      columns,
      processes,
      templates,
      events: [
        {
          id: "off-rh-event",
          at: new Date().toISOString(),
          actor: "RH demonstrativo",
          text: "Processo fictício criado. Nenhum desligamento real executado.",
          process: processes[0].id,
          track: "institutional",
        },
        {
          id: "off-ops-event",
          at: new Date().toISOString(),
          actor: "Liderança demonstrativa",
          text: "Transferência operacional demonstrativa iniciada.",
          process: processes[0].id,
          track: "technical",
        },
      ],
    },
    scope,
  );
}
