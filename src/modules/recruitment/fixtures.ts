import "server-only";
import { type Scope, dateNow } from "../career/model";
import {
  type State,
  type Form,
  type Job,
  type Candidate,
  type Stage,
  projection,
} from "./model";
const day = (n: number) =>
  new Date(Date.parse(dateNow() + "T12:00:00Z") + n * 86400000)
    .toISOString()
    .slice(0, 10);
export function baseForm(id = "bank-form"): Form {
  return {
    id,
    name: "Inscrição demonstrativa",
    message:
      "Cadastro de teste registrado apenas neste navegador. Nenhuma candidatura real foi enviada.",
    color: "#d75b09",
    version: 1,
    fields: [
      ["name", "Nome completo", "Texto"],
      ["phone", "Telefone/WhatsApp", "Telefone"],
      ["email", "E-mail", "E-mail"],
      ["city", "Cidade residente", "Texto"],
      ["sector", "Área de interesse", "Seleção"],
      ["experience", "Nível de experiência", "Texto"],
      ["cv", "Currículo", "Arquivo"],
      ["portfolio", "Portfólio", "Arquivo"],
      ["notes", "Observações", "Parágrafo"],
    ].map(([mapping, label, type], i) => ({
      id: "field-" + mapping,
      label,
      mapping,
      type: type as Form["fields"][number]["type"],
      required: [0, 2, 4].includes(i),
      options:
        mapping === "sector"
          ? ["Arquitetura", "Engenharia", "Aprovação", "Interiores", "Revenue"]
          : [],
    })),
  };
}
export function baseStages(): Stage[] {
  return [
    "Inscrição",
    "Triagem",
    "Entrevista",
    "Avaliação técnica",
    "Proposta",
    "Admissão",
  ].map((name, i) => ({
    id: "stage-" + i,
    name,
    days: i + 3,
    fields:
      i === 0
        ? [
            {
              id: "summary",
              label: "Síntese da triagem",
              type: "Parágrafo",
              required: true,
              options: [],
              mapping: "",
            },
          ]
        : [],
    tasks: [
      {
        id: "check-" + i,
        title: [
          "Conferir dados e currículo",
          "Revisar requisitos documentados",
          "Preparar roteiro de entrevista",
          "Conferir entrega técnica",
          "Conferir orçamento e proposta",
          "Confirmar dados autorizados",
        ][i],
        required: true,
      },
    ],
  }));
}
export function demoRecruitment(c: Scope): State {
  const today = dateNow(),
    form = baseForm();
  const jobs: Job[] = [
    "Analista de Arquitetura · Demo",
    "Projetista de Engenharia · Demo",
    "Assistente de Marketing · Demo",
    "Estágio em Interiores · Demo",
  ].map((title, i) => ({
    id: "rec-job-" + i,
    title,
    sector: ["Arquitetura", "Engenharia", "Revenue", "Interiores"][i],
    contract: i === 1 ? "PJ" : i === 3 ? "Estágio" : "CLT",
    positions: i === 0 ? 2 : 1,
    description:
      "Oportunidade fictícia para testar o processo seletivo. Sem recrutamento real nesta etapa.",
    activities:
      "Planejar e revisar entregas de projeto, conforme escopo demonstrativo.",
    requirements:
      "Conhecimentos técnicos pertinentes à atividade. Critérios e pesos apenas para demonstração.",
    benefits:
      i === 1
        ? "Condições contratuais a combinar. Sem benefícios típicos de empregado."
        : "Condições demonstrativas a validar pelo RH.",
    budget: [650000, 900000, 350000, 160000][i],
    cost: [120000, 80000, 40000, 10000][i],
    forecast: day(20 + i * 5),
    owner: "RH demonstrativo",
    state: i === 2 ? "Prevista" : i === 3 ? "Encerrada" : "Publicada",
    visibility: i === 1 ? "Link exclusivo" : "Listada",
    token: "demo-exclusive-" + i,
    form: { ...structuredClone(form), id: "rec-job-form-" + i },
    stages: baseStages(),
    criteria: [
      {
        id: "crit-skill",
        field: "Competências",
        expected: i === 2 ? "Comunicação" : "BIM",
        mandatory: true,
        weight: 50,
      },
      {
        id: "crit-software",
        field: "Softwares",
        expected: i === 2 ? "CRM" : "Revit",
        mandatory: false,
        weight: 30,
      },
      {
        id: "crit-availability",
        field: "Disponibilidade",
        expected: "30 dias",
        mandatory: false,
        weight: 20,
      },
    ],
    revision: 1,
    created: day(-35 - i),
    closed: i === 3 ? day(-4) : undefined,
  }));
  const names = [
    "Alex Demo",
    "Bia Exemplo",
    "Caio Teste",
    "Dani Demonstração",
    "Eli Fictício",
    "Fran Demo",
    "Gui Exemplo",
    "Iuri Teste",
  ];
  const candidates: Candidate[] = names.map((name, i) => ({
    id: "rec-candidate-" + i,
    name,
    email: `talento-${i}@exemplo.invalid`,
    phone: `(00) 90000-000${i}`,
    city: i % 2 ? "Curitiba" : "São Paulo",
    sector: i % 2 ? "Engenharia" : "Arquitetura",
    education:
      i % 2 ? "Engenharia civil (demonstração)" : "Arquitetura (demonstração)",
    experience:
      i % 3
        ? "Projetos demonstrativos de compatibilização"
        : "Experiência a confirmar",
    skills: i % 3 ? "BIM, revisão técnica" : "Documentação, revisão",
    software: i % 3 ? "Revit, AutoCAD" : "AutoCAD",
    availability: i % 2 ? "30 dias" : "A confirmar",
    expected: 400000 + i * 25000,
    contracts: i % 2 ? ["PJ", "CLT"] : ["CLT", "Estágio"],
    source: [
      "Página de Carreiras",
      "Indicação",
      "Banco de Talentos",
      "Cadastro manual",
    ][i % 4],
    referral: i % 4 === 1 ? "Indicação fictícia #DEMO-01" : "",
    tags: i % 2 ? ["Projetos", "BIM"] : ["Projetos"],
    created: day(-20 - i),
    retentionUntil: day(i === 7 ? -1 : 150),
    consent: "Uso autorizado exclusivamente para teste local; finalidade v1.",
    summary:
      "Perfil profissional inteiramente fictício. Confirme as informações antes de qualquer decisão humana.",
    claims: [
      ...(i % 3
        ? [
            {
              id: "claim-bim-" + i,
              field: "Competências" as const,
              value: "BIM",
              status: "Documentado" as const,
              source: "Currículo fictício · seção Projetos",
            },
            {
              id: "claim-revit-" + i,
              field: "Softwares" as const,
              value: "Revit",
              status:
                i === 2 ? ("Não atende" as const) : ("Documentado" as const),
              source: "Declaração fictícia · confirmar em entrevista",
            },
          ]
        : []),
      ...(i % 2
        ? [
            {
              id: "claim-time-" + i,
              field: "Disponibilidade" as const,
              value: "30 dias",
              status: "Documentado" as const,
              source: "Resposta fictícia do formulário",
            },
          ]
        : []),
    ],
  }));
  const applications: State["applications"] = names
    .slice(0, 7)
    .map<State["applications"][number]>((_, i) => ({
      id: "rec-application-" + i,
      candidate: candidates[i].id,
      job: jobs[i % 2].id,
      stage: "stage-" + Math.min(i % 5, 4),
      stages: structuredClone(jobs[i % 2].stages),
      jobTitle: jobs[i % 2].title,
      contract: jobs[i % 2].contract,
      sector: jobs[i % 2].sector,
      entered: day(-i),
      visits: jobs[i % 2].stages
        .slice(0, Math.min(i % 5, 4) + 1)
        .map((x) => ({ stage: x.id, at: day(-i) + "T15:00:00Z" })),
      created: day(-18 - i),
      assigned: [c.leader && i < 2 ? c.user : "leader-demo"],
      shareCV: i === 0,
      shareAnswers: i === 0,
      fields: (i === 0
        ? { "stage-0:summary": "Inscrição demonstrativa conferida." }
        : {}) as Record<string, string>,
      checks: (i === 0 ? { "stage-0:check-0": true } : {}) as Record<
        string,
        boolean
      >,
      answers: {
        "field-name": candidates[i].name,
        "field-email": candidates[i].email,
      },
      answerFiles: {},
      form: structuredClone(jobs[i % 2].form),
      status: "Ativa" as const,
      decision: i === 4 ? ("Aprovado RH" as const) : undefined,
      events: [
        {
          id: "seed-event-" + i,
          by: "RH demonstrativo",
          at: day(-i) + "T15:00:00Z",
          text: "Candidatura fictícia incluída no processo.",
        },
      ],
    }));
  const s: State = {
    version: 1,
    org: c.org,
    jobs,
    candidates,
    applications,
    notes: [
      {
        id: "private-note",
        application: "rec-application-0",
        kind: "Confidencial RH",
        text: "Observação confidencial demonstrativa: alinhar expectativas na conversa.",
        shared: false,
        by: "RH demo",
        at: today,
      },
      {
        id: "technical-note",
        application: "rec-application-0",
        kind: "Técnica",
        text: "Entrega fictícia revisada com base nos requisitos do projeto.",
        shared: true,
        by: "RH demo",
        at: today,
      },
    ],
    interviews: [
      {
        id: "interview-demo",
        application: "rec-application-0",
        title: "Conversa de contexto · fictícia",
        date: day(2),
        time: "14:00",
        responsible: "RH demonstrativo",
        note: "Roteiro local de entrevista.",
        state: "Agendada",
      },
    ],
    forms: [form],
    templates: [
      {
        id: "template-process",
        name: "Seleção técnica demonstrativa",
        kind: "Processo",
        body: "Etapas reutilizáveis; sem movimentação automática.",
        questions: [],
        stages: baseStages(),
        version: 1,
      },
      ...(
        [
          "DISC",
          "Temperamentos",
          "Entrevista",
          "Avaliação técnica",
          "Teste prático",
          "Proposta",
          "Mensagem",
          "Motivo de encerramento",
        ] as const
      ).map((kind, i) => ({
        id: "template-" + i,
        name: kind + " · modelo de teste",
        kind,
        body:
          kind === "Proposta"
            ? "Proposta fictícia de prestação/contratação. Validar condições e formalização antes de prosseguir."
            : "Roteiro demonstrativo personalizável, sem metodologia de cálculo definitiva.",
        questions: [
          "Descreva uma situação profissional que ajude a contextualizar este tema.",
          "Que informações você considera importantes para a conversa?",
        ],
        version: 1,
      })),
    ],
    assessments: [
      {
        id: "assessment-demo",
        candidate: "rec-candidate-0",
        template: {
          id: "private-disc",
          name: "DISC demonstrativo",
          kind: "DISC",
          body: "Sem diagnóstico ou cálculo validado.",
          questions: ["Como você organiza prioridades?"],
          version: 1,
        },
        token: "private-demo-token",
        answers: { "0": "Resposta fictícia confidencial." },
        created: today,
        completedAt: today,
      },
    ],
    offers: [
      {
        id: "offer-demo",
        application: "rec-application-4",
        amount: 700000,
        body: "Condições fictícias de proposta; sem envio real.",
        state: "Preparação",
        events: [],
      },
    ],
    exceptions: [
      {
        id: "exception-demo",
        application: "rec-application-4",
        amount: 700000,
        reason: "Exceção financeira demonstrativa para revisão pela Diretoria.",
        by: "seed-other-rh",
        state: "Pendente",
        at: today,
      },
    ],
    rules: [
      ["Nova candidatura", "Criar card"],
      ["Mudança de etapa", "Gerar checklist"],
      ["Entrevista agendada", "Registrar no calendário local"],
      ["Avaliação pendente", "Gerar notificação local"],
      ["Aprovação RH", "Preparar proposta"],
      ["Proposta aceita", "Preparar admissão"],
    ].map(([trigger, action], i) => ({
      id: "rule-" + i,
      name: `${trigger} → ${action}`,
      trigger: trigger as State["rules"][number]["trigger"],
      action: action as State["rules"][number]["action"],
      sector: "",
      contract: "",
      active: true,
    })),
    logs: [],
    filters: [],
    handoffs: [],
    privacy: {
      purpose:
        "Simulação de recrutamento com dados fictícios, sem coleta real de candidatos.",
      days: 180,
      version: 1,
    },
    career: {
      title: "Construa o próximo capítulo com a YouCon.",
      intro:
        "Prévia institucional protegida. Textos e diferenciais serão validados pelo RH.",
      culture:
        "Conheça a apresentação institucional no módulo Cultura. Conteúdo de recrutamento demonstrativo.",
      color: "#db5709",
    },
    analyses: [],
    events: [],
  };
  return projection(s, c);
}
