import {
  type Scope,
  type Person,
  type Contract,
  assert,
  uid,
  validDate,
  admin,
  dateNow,
} from "../career/model";
import type { Attachment } from "../documents/model";
export type PdiCycle = {
  id: string;
  name: string;
  start: string;
  end: string;
  status: "Ativo" | "Encerrado";
};
export type Evidence = {
  id: string;
  at: string;
  by: string;
  text: string;
  url: string;
  file?: Attachment;
};
export type Action = {
  id: string;
  title: string;
  due: string;
  done: boolean;
  completedAt?: string;
  evidence: Evidence[];
};
export type PlanContent = {
  title: string;
  objective: string;
  actions: Action[];
};
export type Pdi = {
  id: string;
  person: string;
  leader: string;
  cycle: PdiCycle;
  status:
    | "Rascunho"
    | "Em aprovação"
    | "Ajustes solicitados"
    | "Aprovado"
    | "Concluído";
  draft?: PlanContent;
  published?: PlanContent;
  versions: { number: number; at: string; by: string; content: PlanContent }[];
  feedbacks: { id: string; at: string; by: string; text: string }[];
  history: { id: string; at: string; by: string; text: string }[];
};
export type PdiState = {
  version: 1;
  org: string;
  people: Person[];
  cycles: PdiCycle[];
  plans: Pdi[];
};
export function pdiProjection(s: PdiState, ctx: Scope): PdiState {
  assert(s.org === ctx.org, "Organização não autorizada.");
  const people = s.people.filter(
    (p) =>
      p.org === ctx.org &&
      p.contract !== "PJ" &&
      (admin(ctx) ||
        p.user === ctx.user ||
        (ctx.leader && p.leader === ctx.user)),
  );
  const ids = new Set(people.map((p) => p.id));
  return {
    ...s,
    people,
    cycles:
      admin(ctx) || ctx.leader
        ? s.cycles
        : s.cycles.filter((c) =>
            s.plans.some(
              (p) => ids.has(p.person) && p.published && p.cycle.id === c.id,
            ),
          ),
    plans: s.plans
      .filter(
        (p) =>
          ids.has(p.person) &&
          (admin(ctx) ||
            (ctx.leader && p.leader === ctx.user) ||
            !!p.published),
      )
      .map((p) =>
        admin(ctx) || (ctx.leader && p.leader === ctx.user)
          ? p
          : {
              ...p,
              draft: undefined,
              status: p.status === "Concluído" ? "Concluído" : "Aprovado",
            },
      ),
  };
}
export function progress(p: Pdi) {
  const actions = p.published?.actions ?? [];
  return actions.length
    ? Math.round((actions.filter((a) => a.done).length / actions.length) * 100)
    : 0;
}
export function mayEdit(s: PdiState, ctx: Scope, p: Pdi) {
  const person = s.people.find((x) => x.id === p.person);
  return (
    s.org === ctx.org &&
    ctx.leader &&
    p.leader === ctx.user &&
    person?.org === ctx.org &&
    person.leader === ctx.user &&
    person.contract !== "PJ" &&
    person.user !== ctx.user
  );
}
export function mayAct(s: PdiState, ctx: Scope, p: Pdi) {
  const person = s.people.find((x) => x.id === p.person);
  return (
    s.org === ctx.org &&
    person?.org === ctx.org &&
    person.contract !== "PJ" &&
    !!p.published &&
    p.status !== "Concluído" &&
    (person.user === ctx.user || mayEdit(s, ctx, p))
  );
}
function change(
  s: PdiState,
  ctx: Scope,
  p: Pdi,
  patch: Partial<Pdi>,
  text: string,
) {
  const next = {
    ...p,
    ...patch,
    history: [
      ...p.history,
      { id: uid(), at: new Date().toISOString(), by: ctx.name, text },
    ],
  };
  return { ...s, plans: s.plans.map((x) => (x.id === p.id ? next : x)) };
}
export function saveCycle(s: PdiState, ctx: Scope, c: PdiCycle) {
  assert(s.org === ctx.org && ctx.rh, "Somente RH configura os ciclos de PDI.");
  assert(
    c.name.trim() && validDate(c.start) && validDate(c.end) && c.start <= c.end,
    "Nome e período inválidos.",
  );
  assert(
    c.status !== "Encerrado" ||
      !s.plans.some((p) => p.cycle.id === c.id && p.status !== "Concluído"),
    "Conclua os PDIs antes de encerrar o ciclo.",
  );
  return {
    ...s,
    cycles: s.cycles.some((x) => x.id === c.id)
      ? s.cycles.map((x) => (x.id === c.id ? structuredClone(c) : x))
      : [...s.cycles, structuredClone(c)],
  };
}
export function createPlan(
  s: PdiState,
  ctx: Scope,
  personId: string,
  cycleId: string,
) {
  assert(s.org === ctx.org && ctx.leader, "O líder responsável cria o PDI.");
  const person = s.people.find(
    (p) =>
      p.id === personId &&
      p.org === ctx.org &&
      p.leader === ctx.user &&
      p.user !== ctx.user,
  );
  assert(
    person && person.contract !== "PJ",
    "Selecione CLT ou estagiário da sua equipe.",
  );
  const cycle = s.cycles.find((c) => c.id === cycleId && c.status === "Ativo");
  assert(cycle, "Selecione um ciclo ativo.");
  assert(
    !s.plans.some(
      (p) =>
        p.person === personId &&
        p.cycle.id === cycleId &&
        p.status !== "Concluído",
    ),
    "Já existe PDI em andamento neste ciclo.",
  );
  const p: Pdi = {
    id: uid(),
    person: person.id,
    leader: ctx.user,
    cycle: structuredClone(cycle),
    status: "Rascunho",
    draft: {
      title: "Desenvolvimento profissional",
      objective: "Defina o objetivo de desenvolvimento.",
      actions: [
        {
          id: uid(),
          title: "Defina uma ação concreta",
          due: cycle.end,
          done: false,
          evidence: [],
        },
      ],
    },
    versions: [],
    feedbacks: [],
    history: [
      {
        id: uid(),
        at: new Date().toISOString(),
        by: ctx.name,
        text: "PDI criado pela liderança, ainda sem publicação.",
      },
    ],
  };
  return { ...s, plans: [p, ...s.plans] };
}
export function savePlan(
  s: PdiState,
  ctx: Scope,
  id: string,
  content: PlanContent,
  send: boolean,
) {
  const p = s.plans.find((p) => p.id === id);
  assert(p && mayEdit(s, ctx, p), "Edição exclusiva da liderança responsável.");
  assert(p.status !== "Concluído", "PDI encerrado.");
  assert(
    s.cycles.some((c) => c.id === p.cycle.id && c.status === "Ativo"),
    "Ciclo encerrado.",
  );
  assert(
    content.title.trim() && content.objective.trim() && content.actions.length,
    "Informe título, objetivo e ações.",
  );
  assert(
    content.actions.every(
      (a) =>
        a.title.trim() &&
        validDate(a.due) &&
        a.due >= p.cycle.start &&
        a.due <= p.cycle.end,
    ),
    "As ações precisam de descrição e prazo dentro do ciclo de origem.",
  );
  const draft = structuredClone(content);
  draft.actions = draft.actions.map((a) => {
    const live = p.published?.actions.find((x) => x.id === a.id);
    return live
      ? {
          ...a,
          done: live.done,
          completedAt: live.completedAt,
          evidence: structuredClone(live.evidence),
        }
      : { ...a, done: false, completedAt: undefined, evidence: [] };
  });
  return change(
    s,
    ctx,
    p,
    { draft, status: send ? "Em aprovação" : "Rascunho" },
    send
      ? "Nova versão enviada à aprovação do RH. A versão publicada permanece disponível."
      : "Rascunho estrutural salvo pela liderança.",
  );
}
export function reviewPlan(
  s: PdiState,
  ctx: Scope,
  id: string,
  approve: boolean,
  comment: string,
) {
  assert(s.org === ctx.org && ctx.rh, "Somente RH aprova e revisa o PDI.");
  const p = s.plans.find((p) => p.id === id);
  assert(
    p?.draft && p.status === "Em aprovação",
    "PDI precisa estar em aprovação.",
  );
  const person = s.people.find((x) => x.id === p.person);
  assert(
    person?.org === ctx.org && person.contract !== "PJ",
    "PDI exclusivo de CLT/Estágio.",
  );
  assert(
    person.user !== ctx.user && p.leader !== ctx.user,
    "Não é permitida autoaprovação do próprio PDI ou da própria proposta.",
  );
  assert(comment.trim(), "Registre o parecer.");
  if (!approve)
    return change(
      s,
      ctx,
      p,
      { status: "Ajustes solicitados" },
      `RH solicitou ajustes: ${comment}`,
    );
  const published = structuredClone(p.draft);
  published.actions = published.actions.map((a) => {
    const live = p.published?.actions.find((x) => x.id === a.id);
    return live
      ? {
          ...a,
          done: live.done,
          completedAt: live.completedAt,
          evidence: structuredClone(live.evidence),
        }
      : a;
  });
  return change(
    s,
    ctx,
    p,
    {
      status: "Aprovado",
      published,
      versions: [
        ...p.versions,
        {
          number: p.versions.length + 1,
          at: new Date().toISOString(),
          by: ctx.name,
          content: structuredClone(published),
        },
      ],
    },
    `RH aprovou e publicou a versão ${p.versions.length + 1}: ${comment}`,
  );
}
export function actionDone(
  s: PdiState,
  ctx: Scope,
  id: string,
  actionId: string,
  done: boolean,
) {
  const p = s.plans.find((p) => p.id === id);
  assert(p && mayAct(s, ctx, p), "Você não pode alterar estas atividades.");
  assert(
    p.published!.actions.some((a) => a.id === actionId),
    "Ação não encontrada.",
  );
  const published = {
    ...p.published!,
    actions: p.published!.actions.map((a) =>
      a.id === actionId
        ? {
            ...a,
            done,
            completedAt: done ? new Date().toISOString() : undefined,
          }
        : a,
    ),
  };
  return change(
    s,
    ctx,
    p,
    { published },
    `Ação ${done ? "concluída" : "reaberta"} no PDI. Isso não altera cargo ou reconhecimento.`,
  );
}
export function addEvidence(
  s: PdiState,
  ctx: Scope,
  id: string,
  actionId: string,
  text: string,
  url: string,
  file?: Attachment,
) {
  const p = s.plans.find((p) => p.id === id);
  assert(p && mayAct(s, ctx, p), "Evidência fora do seu escopo.");
  assert(text.trim() || url.trim() || file, "Informe texto, link ou arquivo.");
  if (url.trim()) {
    let valid = false;
    try {
      valid = ["http:", "https:"].includes(new URL(url).protocol);
    } catch {}
    assert(valid, "Use um link HTTP(S) válido.");
  }
  if (file)
    assert(
      file.url.startsWith("blob:") && file.size <= 10 * 1024 * 1024,
      "Use um arquivo local de até 10 MB.",
    );
  assert(
    p.published!.actions.some((a) => a.id === actionId),
    "Ação não encontrada.",
  );
  const evidence: Evidence = {
    id: uid(),
    at: new Date().toISOString(),
    by: ctx.name,
    text: text.trim(),
    url: url.trim(),
    file,
  };
  return change(
    s,
    ctx,
    p,
    {
      published: {
        ...p.published!,
        actions: p.published!.actions.map((a) =>
          a.id === actionId ? { ...a, evidence: [...a.evidence, evidence] } : a,
        ),
      },
    },
    "Evidência local adicionada com autoria e data.",
  );
}
export function feedback(s: PdiState, ctx: Scope, id: string, text: string) {
  const p = s.plans.find((p) => p.id === id),
    person = s.people.find((x) => x.id === p?.person);
  assert(
    s.org === ctx.org &&
      p &&
      person?.org === ctx.org &&
      person.contract !== "PJ" &&
      (ctx.rh ||
        mayEdit(s, ctx, p) ||
        (person.user === ctx.user && !!p.published)),
    "Feedback fora do seu escopo.",
  );
  assert(text.trim(), "Escreva o feedback.");
  return change(
    s,
    ctx,
    p,
    {
      feedbacks: [
        ...p.feedbacks,
        {
          id: uid(),
          at: new Date().toISOString(),
          by: ctx.name,
          text: text.trim(),
        },
      ],
    },
    "Feedback registrado.",
  );
}
export function closePlan(s: PdiState, ctx: Scope, id: string) {
  const p = s.plans.find((p) => p.id === id);
  assert(
    p &&
      mayEdit(s, ctx, p) &&
      p.status === "Aprovado" &&
      p.published?.actions.length &&
      p.published.actions.every((a) => a.done),
    "Somente o líder encerra um PDI aprovado com todas as ações concluídas.",
  );
  return change(
    s,
    ctx,
    p,
    { status: "Concluído" },
    `PDI encerrado em ${dateNow()}; sem efeito automático sobre carreira ou remuneração.`,
  );
}
export const eligible = (contract: Contract) => contract !== "PJ";
