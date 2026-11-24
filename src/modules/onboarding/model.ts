export type Contract = "CLT" | "Estágio" | "PJ";
export type Mode = "rh" | "leader" | "professional";
export type Scope = { mode: Mode; user: string; name: string; key: string };
export const kinds = [
  "Texto",
  "Checklist",
  "Apresentação",
  "Vídeo",
  "Imagem",
  "Arquivo",
  "Link",
  "Formulário",
  "Reunião",
] as const;
export type ContentBlock = {
  id: string;
  kind: (typeof kinds)[number];
  text: string;
  url?: string;
  fileName?: string;
  size?: number;
  mime?: string;
};
export type Task = {
  id: string;
  title: string;
  required: boolean;
  done: boolean;
};
export type Stage = {
  id: string;
  name: string;
  owner: "RH" | "Liderança" | "Profissional";
  days: number;
  public: boolean;
  tasks: Task[];
  blocks: ContentBlock[];
  answers: Record<string, string>;
  checked: string[];
};
export type Template = {
  id: string;
  name: string;
  track: "institutional" | "technical";
  contract: Contract;
  sector: string;
  job: string;
  status: "Rascunho" | "Em revisão" | "Aprovado";
  leader: string;
  stages: Stage[];
  version: number;
};
export type Process = {
  id: string;
  name: string;
  user: string;
  leader: string;
  leaderName: string;
  sector: string;
  job: string;
  contract: Contract;
  start: string;
  duration: number;
  column: string;
  archived: boolean;
  institutional: Stage[];
  technical: Stage[];
  sources: string[];
};
export type Event = {
  id: string;
  at: string;
  actor: string;
  text: string;
  process?: string;
};
export type State = {
  version: 1;
  columns: { id: string; name: string; color: string }[];
  processes: Process[];
  templates: Template[];
  events: Event[];
};
export const sectors = ["Arquitetura", "Engenharia", "Operações"];
export const jobs = ["Analista", "Assistente", "Especialista"];
export const defaultDuration = (contract: Contract) =>
  contract === "CLT" ? 90 : contract === "Estágio" ? 60 : 30;
export function progress(stages: Stage[]) {
  const tasks = stages.flatMap((s) => s.tasks);
  return tasks.length
    ? Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100)
    : 0;
}
export function overdue(process: Process, stage: Stage, today = new Date()) {
  return (
    stage.tasks.some((t) => t.required && !t.done) &&
    new Date(process.start + "T12:00:00").getTime() + stage.days * 86400000 <
      today.getTime()
  );
}
export function canManage(
  scope: Scope,
  p: Process,
  track: "institutional" | "technical",
) {
  return (
    scope.mode === "rh" ||
    (scope.mode === "leader" &&
      p.leader === scope.user &&
      track === "technical")
  );
}
export function canComplete(
  scope: Scope,
  p: Process,
  track: "institutional" | "technical",
  stage: Stage,
) {
  return (
    canManage(scope, p, track) ||
    (scope.mode === "professional" &&
      p.user === scope.user &&
      stage.public &&
      stage.owner === "Profissional")
  );
}
export function project(state: State, scope: Scope): State {
  const processes = state.processes
    .filter(
      (p) =>
        scope.mode === "rh" ||
        (scope.mode === "leader"
          ? p.leader === scope.user
          : p.user === scope.user),
    )
    .map((p) =>
      scope.mode !== "professional"
        ? p
        : {
            ...p,
            institutional: p.institutional.filter(
              (s) => s.public && s.owner === "Profissional",
            ),
            technical: p.technical.filter(
              (s) => s.public && s.owner === "Profissional",
            ),
            sources: [],
          },
    );
  return {
    ...state,
    processes,
    templates:
      scope.mode === "rh"
        ? state.templates
        : scope.mode === "leader"
          ? state.templates.filter(
              (t) => t.track === "technical" && t.leader === scope.user,
            )
          : [],
    events: state.events.filter(
      (e) =>
        scope.mode === "rh" ||
        (!!e.process && processes.some((p) => p.id === e.process)),
    ),
  };
}
export function compose(
  templates: Template[],
  contract: Contract,
  sector: string,
  job: string,
) {
  const matches = templates.filter(
    (t) =>
      t.status === "Aprovado" &&
      t.contract === contract &&
      (t.sector === "Todos" || t.sector === sector) &&
      (t.job === "Todos" || t.job === job),
  );
  const best = (track: Template["track"]) =>
    matches
      .filter((t) => t.track === track)
      .sort(
        (a, b) =>
          Number(b.sector !== "Todos") +
          Number(b.job !== "Todos") -
          (Number(a.sector !== "Todos") + Number(a.job !== "Todos")),
      )[0];
  const institutional = best("institutional"),
    technical = best("technical");
  if (!institutional || !technical)
    throw new Error(
      "É necessário um modelo institucional e um técnico aprovados para esta combinação.",
    );
  const copy = (t: Template) =>
    structuredClone(t.stages).map((s) => ({
      ...s,
      id: crypto.randomUUID(),
      tasks: s.tasks.map((task) => ({
        ...task,
        id: crypto.randomUUID(),
        done: false,
      })),
      answers: {},
      checked: [],
    }));
  return {
    institutional: copy(institutional),
    technical: copy(technical),
    sources: [
      `${institutional.name} · v${institutional.version}`,
      `${technical.name} · v${technical.version}`,
    ],
  };
}
export function newStage(): Stage {
  return {
    id: crypto.randomUUID(),
    name: "Nova etapa",
    owner: "Profissional",
    days: 7,
    public: true,
    tasks: [
      {
        id: crypto.randomUUID(),
        title: "Concluir atividade de integração",
        required: true,
        done: false,
      },
    ],
    blocks: [
      {
        id: crypto.randomUUID(),
        kind: "Texto",
        text: "Orientações para esta etapa.",
      },
    ],
    answers: {},
    checked: [],
  };
}
