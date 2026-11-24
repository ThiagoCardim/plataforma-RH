export type Mode = "rh" | "leader" | "professional";
export type Scope = {
  user: string;
  name: string;
  org: string;
  mode: Mode;
  key: string;
};
export type Period = "Manhã" | "Tarde" | "Dia completo";
export type Person = {
  id: string;
  user: string;
  org: string;
  name: string;
  sector: string;
  contract: "CLT" | "Estágio" | "PJ";
  leader: string;
  leaderName: string;
};
export type Rules = {
  id: string;
  number: number;
  at: string;
  by: string;
  text: string;
};
export type Agreement = {
  authorName?: string;
  id: string;
  person: string;
  mode: "Remoto permanente" | "Híbrido fixo";
  start: string;
  end: string;
  weekdays: number[];
  period: Period;
  rule: string;
  by: string;
  at: string;
};
export type Exception = {
  requiresReport?: boolean;
  id: string;
  person: string;
  date: string;
  period: Period;
  status: "Pendente" | "Autorizado" | "Cancelado";
  reason: string;
  rule: string;
  by: string;
  at: string;
  approvedBy?: string;
  approvedName?: string;
  approvedAt?: string;
  source: "Sinalização" | "Combinado" | "Troca" | "Cancelamento";
};
export type Occurrence = {
  person: string;
  date: string;
  period: Period;
  source: string;
  sourceId: string;
  rule: string;
  status: Exception["status"];
  requiresReport: boolean;
  approvedBy?: string;
  approvedName?: string;
};
export type Activity = {
  id: string;
  period: "Manhã" | "Tarde";
  project: string;
  work: string;
  result: string;
  reference: string;
};
export type Payload = {
  activities: Activity[];
  hasBlocker: boolean;
  blocker: string;
};
export type Note = {
  id: string;
  at: string;
  by: string;
  name: string;
  text: string;
  kind:
    | "Comentário"
    | "Esclarecimento solicitado"
    | "Complementação"
    | "Justificativa de atraso"
    | "Validação liderança"
    | "Validação RH";
};
export type Report = {
  id: string;
  occurrence: Occurrence;
  draft: Payload;
  original?: { payload: Payload; at: string; by: string; name: string };
  review: "leader" | "rh" | "validated";
  clarification?: "leader" | "rh";
  notes: Note[];
};
export type Event = {
  id: string;
  at: string;
  by: string;
  name: string;
  person?: string;
  text: string;
};
export type State = {
  version: 1;
  org: string;
  people: Person[];
  agreements: Agreement[];
  exceptions: Exception[];
  reports: Report[];
  rules: Rules[];
  events: Event[];
};
export const periods: Period[] = ["Manhã", "Tarde", "Dia completo"];
export const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export function day(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return ["year", "month", "day"]
    .map((t) => parts.find((p) => p.type === t)!.value)
    .join("-");
}
export function validDay(d: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(d) &&
    !Number.isNaN(Date.parse(d + "T12:00:00Z")) &&
    new Date(d + "T12:00:00Z").toISOString().slice(0, 10) === d
  );
}
export function shift(d: string, n: number) {
  const value = new Date(d + "T12:00:00Z");
  value.setUTCDate(value.getUTCDate() + n);
  return value.toISOString().slice(0, 10);
}
export function weekday(d: string) {
  return new Date(d + "T12:00:00Z").getUTCDay();
}
export const key = (person: string, date: string) => `${person}@${date}`;
export const requiredPeriods = (period: Period): Activity["period"][] =>
  period === "Dia completo" ? ["Manhã", "Tarde"] : [period];
export function blank(period: Period): Payload {
  return {
    activities: requiredPeriods(period).map((p) => ({
      id: crypto.randomUUID(),
      period: p,
      project: "",
      work: "",
      result: "",
      reference: "",
    })),
    hasBlocker: false,
    blocker: "",
  };
}
function requireRule(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
export function visible(scope: Scope, p: Person) {
  return (
    p.org === scope.org &&
    (scope.mode === "rh" ||
      p.user === scope.user ||
      (scope.mode === "leader" && p.leader === scope.user))
  );
}
export function canRegister(scope: Scope, p: Person) {
  return (
    p.org === scope.org &&
    (scope.mode === "rh" ||
      (scope.mode === "leader" &&
        p.leader === scope.user &&
        p.user !== scope.user))
  );
}
export function project(state: State, scope: Scope): State {
  requireRule(state.org === scope.org, "Organização diferente da sessão.");
  const people =
    state.org === scope.org
      ? state.people.filter((p) => visible(scope, p))
      : [];
  const ids = new Set(people.map((p) => p.id));
  return {
    ...state,
    people,
    agreements: state.agreements.filter((a) => ids.has(a.person)),
    exceptions: state.exceptions.filter((e) => ids.has(e.person)),
    reports: state.reports.filter((r) => ids.has(r.occurrence.person)),
    events: state.events.filter((e) => !e.person || ids.has(e.person)),
  };
}
export function occurrence(
  state: State,
  person: string,
  date: string,
): Occurrence | undefined {
  const e = state.exceptions
    .filter((x) => x.person === person && x.date === date)
    .at(-1);
  if (e)
    return {
      person,
      date,
      period: e.period,
      source: e.source,
      sourceId: e.id,
      rule: e.rule,
      status: e.status,
      requiresReport: e.status === "Autorizado" && e.requiresReport !== false,
      approvedBy: e.approvedBy,
      approvedName: e.approvedName,
    };
  const a = state.agreements.find(
    (x) =>
      x.person === person &&
      date >= x.start &&
      date <= x.end &&
      x.weekdays.includes(weekday(date)),
  );
  return a
    ? {
        person,
        date,
        period: a.period,
        source: a.mode,
        sourceId: a.id,
        rule: a.rule,
        status: "Autorizado",
        requiresReport: a.mode !== "Remoto permanente",
        approvedBy: a.by,
        approvedName: a.authorName,
      }
    : undefined;
}
export function occurrences(state: State, from: string, to: string) {
  requireRule(
    validDay(from) && validDay(to) && from <= to,
    "Intervalo inválido.",
  );
  const out: Occurrence[] = [];
  for (let d = from, n = 0; d <= to; d = shift(d, 1), n++) {
    requireRule(n <= 400, "Selecione até 400 dias.");
    for (const p of state.people) {
      const o = occurrence(state, p.id, d);
      if (o) out.push(o);
    }
  }
  return out;
}
export function activeReport(state: State, r: Report) {
  const o = occurrence(state, r.occurrence.person, r.occurrence.date);
  return (
    !!o &&
    o.status === "Autorizado" &&
    o.requiresReport &&
    o.sourceId === r.occurrence.sourceId
  );
}
export function submissionStatus(
  o: Occurrence,
  r: Report | undefined,
  now: Date,
  active = true,
) {
  if (r?.original) return "Enviado";
  if (!active || o.status === "Cancelado") return "Ocorrência cancelada";
  if (o.status !== "Autorizado") return "Aguardando autorização";
  if (!o.requiresReport) return "Dispensado";
  if (o.date < day(now)) return "Não entregue no prazo";
  return r ? "Rascunho" : "Pendente de envio";
}
export function reviewStatus(r?: Report) {
  if (!r?.original) return "Sem envio original";
  if (r.clarification) return "Em esclarecimento";
  return r.review === "validated"
    ? "Validado"
    : r.review === "rh"
      ? "Aguardando RH"
      : "Enviado e aguardando liderança";
}
export function canReview(scope: Scope, p: Person, r: Report) {
  return (
    p.org === scope.org &&
    p.user !== scope.user &&
    r.original?.by !== scope.user &&
    !!r.original &&
    !r.clarification &&
    r.review !== "validated" &&
    (r.review === "leader"
      ? scope.mode === "leader" && p.leader === scope.user
      : scope.mode === "rh")
  );
}
export function reportRows(state: State, from: string, to: string) {
  const map = new Map(
    occurrences(state, from, to)
      .filter((o) => o.status === "Autorizado" && o.requiresReport)
      .map((o) => [
        key(o.person, o.date),
        {
          o,
          r: state.reports.find((r) => r.id === key(o.person, o.date)),
          active: true,
        },
      ]),
  );
  for (const r of state.reports.filter(
    (r) => r.occurrence.date >= from && r.occurrence.date <= to,
  ))
    map.set(r.id, { o: r.occurrence, r, active: activeReport(state, r) });
  return [...map.values()].sort((a, b) => b.o.date.localeCompare(a.o.date));
}
function personFor(s: State, ctx: Scope, id: string) {
  requireRule(s.org === ctx.org, "Organização não autorizada.");
  const p = s.people.find((p) => p.id === id);
  requireRule(p && visible(ctx, p), "Profissional fora do seu escopo.");
  return p;
}
function fresh(
  s: State,
  ctx: Scope,
  person: string,
  text: string,
  now: Date,
): State {
  return {
    ...s,
    events: [
      {
        id: crypto.randomUUID(),
        at: now.toISOString(),
        by: ctx.user,
        name: ctx.name,
        person,
        text,
      },
      ...s.events,
    ],
  };
}
function available(s: State, person: string, date: string) {
  const o = occurrence(s, person, date);
  requireRule(
    !o || o.status === "Cancelado",
    "Já existe escala ou sinalização nesta data.",
  );
  requireRule(
    !s.reports.some((r) => r.id === key(person, date)),
    "Há relatório registrado nesta data; preserve o histórico e escolha outra data.",
  );
}
export function registerDay(
  s: State,
  ctx: Scope,
  input: {
    person: string;
    date: string;
    period: Period;
    reason: string;
    signal: boolean;
  },
  now = new Date(),
): State {
  const p = personFor(s, ctx, input.person);
  requireRule(
    validDay(input.date) && input.date >= day(now),
    "Escolha hoje ou uma data futura.",
  );
  requireRule(
    periods.includes(input.period) && input.reason.trim(),
    "Informe período e justificativa resumida.",
  );
  requireRule(
    input.signal ? p.user === ctx.user : canRegister(ctx, p),
    "Você não pode autorizar esta pessoa.",
  );
  available(s, p.id, input.date);
  const e: Exception = {
    id: crypto.randomUUID(),
    person: p.id,
    date: input.date,
    period: input.period,
    reason: input.reason.trim(),
    rule: s.rules.at(-1)!.id,
    status: input.signal ? "Pendente" : "Autorizado",
    requiresReport: !s.agreements.some(
      (a) =>
        a.person === p.id &&
        a.mode === "Remoto permanente" &&
        input.date >= a.start &&
        input.date <= a.end,
    ),
    source: input.signal ? "Sinalização" : "Combinado",
    by: ctx.user,
    at: now.toISOString(),
    approvedBy: input.signal ? undefined : ctx.user,
    approvedName: input.signal ? undefined : ctx.name,
    approvedAt: input.signal ? undefined : now.toISOString(),
  };
  return fresh(
    { ...s, exceptions: [...s.exceptions, e] },
    ctx,
    p.id,
    `${input.signal ? "Data sinalizada, aguardando confirmação" : "Home office combinado registrado"}: ${input.date} · ${input.period}. ${e.reason}`,
    now,
  );
}
export function approveDay(
  s: State,
  ctx: Scope,
  id: string,
  now = new Date(),
): State {
  const e = s.exceptions.find((e) => e.id === id);
  requireRule(e, "Registro não encontrado.");
  const p = personFor(s, ctx, e.person);
  requireRule(canRegister(ctx, p), "Autorização fora do seu escopo.");
  requireRule(
    e.status === "Pendente" &&
      e.date >= day(now) &&
      occurrence(s, p.id, e.date)?.sourceId === id,
    "Sinalização expirada ou substituída.",
  );
  return fresh(
    {
      ...s,
      exceptions: s.exceptions.map((x) =>
        x.id === id
          ? {
              ...x,
              status: "Autorizado",
              requiresReport: !s.agreements.some(
                (a) =>
                  a.person === p.id &&
                  a.mode === "Remoto permanente" &&
                  e.date >= a.start &&
                  e.date <= a.end,
              ),
              approvedBy: ctx.user,
              approvedName: ctx.name,
              approvedAt: now.toISOString(),
            }
          : x,
      ),
    },
    ctx,
    p.id,
    `Sinalização confirmada: ${e.date} · ${e.period}.`,
    now,
  );
}
export function cancelOrSwap(
  s: State,
  ctx: Scope,
  person: string,
  date: string,
  reason: string,
  target?: string,
  now = new Date(),
): State {
  const p = personFor(s, ctx, person),
    o = occurrence(s, person, date);
  requireRule(canRegister(ctx, p), "Alteração fora do seu escopo.");
  requireRule(
    o && o.status !== "Cancelado" && date >= day(now),
    "Somente ocorrências de hoje ou futuras podem ser alteradas.",
  );
  requireRule(
    !s.reports.find((r) => r.id === key(person, date))?.original,
    "O envio original precisa ser preservado.",
  );
  requireRule(reason.trim(), "Informe o motivo.");
  if (target) {
    requireRule(
      validDay(target) && target >= day(now) && target !== date,
      "Data de destino inválida.",
    );
    available(s, person, target);
  }
  const canceled: Exception = {
    id: crypto.randomUUID(),
    person,
    date,
    period: o.period,
    reason: reason.trim(),
    rule: o.rule,
    status: "Cancelado",
    source: "Cancelamento",
    by: ctx.user,
    at: now.toISOString(),
  };
  const exceptions = [...s.exceptions, canceled];
  if (target)
    exceptions.push({
      ...canceled,
      id: crypto.randomUUID(),
      date: target,
      status: "Autorizado",
      source: "Troca",
      requiresReport:
        o.requiresReport &&
        !s.agreements.some(
          (a) =>
            a.person === person &&
            a.mode === "Remoto permanente" &&
            target >= a.start &&
            target <= a.end,
        ),
      approvedBy: ctx.user,
      approvedName: ctx.name,
      approvedAt: now.toISOString(),
      reason: `Troca de ${date}: ${reason.trim()}`,
    });
  return fresh(
    { ...s, exceptions },
    ctx,
    person,
    target
      ? `Troca de ${date} para ${target}, mantendo as próximas semanas. Motivo: ${reason.trim()}`
      : `Ocorrência de ${date} cancelada. Motivo: ${reason.trim()}`,
    now,
  );
}
export function addAgreement(
  s: State,
  ctx: Scope,
  input: Omit<Agreement, "id" | "rule" | "by" | "at" | "authorName">,
  now = new Date(),
): State {
  const p = personFor(s, ctx, input.person);
  requireRule(ctx.mode === "rh", "Somente RH/Diretoria cadastram acordos.");
  requireRule(
    validDay(input.start) &&
      validDay(input.end) &&
      input.start >= day(now) &&
      input.end >= input.start &&
      input.end <= shift(input.start, 366),
    "Defina uma vigência entre hoje e até um ano.",
  );
  requireRule(
    input.weekdays.length &&
      input.weekdays.every((d) => Number.isInteger(d) && d >= 0 && d <= 6) &&
      new Set(input.weekdays).size === input.weekdays.length,
    "Selecione dias da semana válidos.",
  );
  requireRule(
    periods.includes(input.period) &&
      ["Híbrido fixo", "Remoto permanente"].includes(input.mode),
    "Modalidade ou período inválido.",
  );
  requireRule(
    !s.agreements.some(
      (a) =>
        a.person === p.id &&
        a.start <= a.end &&
        a.start <= input.end &&
        a.end >= input.start,
    ),
    "Já existe acordo com vigência sobreposta para esta pessoa.",
  );
  for (let d = input.start; d <= input.end; d = shift(d, 1))
    if (input.weekdays.includes(weekday(d))) available(s, p.id, d);
  const a: Agreement = {
    ...structuredClone(input),
    authorName: ctx.name,
    id: crypto.randomUUID(),
    rule: s.rules.at(-1)!.id,
    by: ctx.user,
    at: now.toISOString(),
  };
  return fresh(
    { ...s, agreements: [...s.agreements, a] },
    ctx,
    p.id,
    `${a.mode} cadastrado de ${a.start} a ${a.end}. Dias: ${a.weekdays.map((d) => weekdays[d]).join(", ")}.`,
    now,
  );
}
export function endAgreement(
  s: State,
  ctx: Scope,
  id: string,
  stop: string,
  now = new Date(),
): State {
  const a = s.agreements.find((a) => a.id === id);
  requireRule(a, "Acordo não encontrado.");
  personFor(s, ctx, a.person);
  requireRule(
    ctx.mode === "rh" &&
      validDay(stop) &&
      stop >= day(now) &&
      stop >= a.start &&
      stop <= a.end,
    "Informe uma data de encerramento válida de hoje em diante.",
  );
  requireRule(
    !s.reports.some(
      (r) =>
        r.occurrence.sourceId === id && r.occurrence.date >= stop && r.original,
    ),
    "O envio original precisa ser preservado.",
  );
  return fresh(
    {
      ...s,
      agreements: s.agreements.map((x) =>
        x.id === id ? { ...x, end: shift(stop, -1) } : x,
      ),
    },
    ctx,
    a.person,
    `Acordo encerrado a partir de ${stop}. Vigência original: ${a.start} a ${a.end}. Histórico preservado.`,
    now,
  );
}
function reportFor(s: State, ctx: Scope, person: string, date: string) {
  const p = personFor(s, ctx, person);
  requireRule(
    p.user === ctx.user,
    "Somente o próprio profissional preenche seu relatório.",
  );
  const o = occurrence(s, person, date);
  requireRule(
    o && o.status === "Autorizado" && o.requiresReport,
    "Não há obrigação autorizada de relatório nesta data.",
  );
  const r = s.reports.find((r) => r.id === key(person, date));
  requireRule(
    !r || r.occurrence.sourceId === o.sourceId,
    "A ocorrência original foi alterada; o histórico permanece preservado.",
  );
  return { p, o, r };
}
export function validatePayload(payload: Payload, period: Period) {
  const needed = requiredPeriods(period);
  requireRule(
    payload.activities.length &&
      payload.activities.every(
        (a) =>
          needed.includes(a.period) &&
          a.project.trim() &&
          a.work.trim() &&
          a.result.trim(),
      ),
    "Preencha atividade/projeto, o que realizou e resultado de cada atividade.",
  );
  requireRule(
    needed.every((p) => payload.activities.some((a) => a.period === p)),
    "Preencha todos os períodos da escala.",
  );
  requireRule(
    !payload.hasBlocker || payload.blocker.trim(),
    "Explique brevemente a pendência ou impedimento.",
  );
  for (const a of payload.activities)
    if (a.reference.trim()) {
      let good = false;
      try {
        good = ["http:", "https:"].includes(new URL(a.reference).protocol);
      } catch {}
      requireRule(good, "Use referências HTTP ou HTTPS válidas.");
    }
}
export function saveReport(
  s: State,
  ctx: Scope,
  person: string,
  date: string,
  payload: Payload,
  submit: boolean,
  now = new Date(),
): State {
  const { o, r } = reportFor(s, ctx, person, date);
  requireRule(
    date === day(now),
    "O envio original e o rascunho só podem ser preenchidos no próprio dia, até 23h59 de Brasília.",
  );
  requireRule(
    !r?.original,
    "O original já foi enviado e não pode ser sobrescrito.",
  );
  if (submit) validatePayload(payload, o.period);
  const next: Report = {
    id: key(person, date),
    occurrence: r?.occurrence ?? structuredClone(o),
    draft: structuredClone(payload),
    review: "leader",
    notes: r?.notes ?? [],
    original: submit
      ? {
          payload: structuredClone(payload),
          at: now.toISOString(),
          by: ctx.user,
          name: ctx.name,
        }
      : undefined,
  };
  return fresh(
    {
      ...s,
      reports: s.reports.some((x) => x.id === next.id)
        ? s.reports.map((x) => (x.id === next.id ? next : x))
        : [...s.reports, next],
    },
    ctx,
    person,
    submit
      ? `Relatório de ${date} enviado no prazo; aguardando liderança.`
      : `Rascunho de ${date} salvo.`,
    now,
  );
}
export function reviewReport(
  s: State,
  ctx: Scope,
  id: string,
  action: "approve" | "clarify" | "comment",
  text: string,
  now = new Date(),
): State {
  const r = s.reports.find((r) => r.id === id);
  requireRule(r, "Relatório não encontrado.");
  const p = personFor(s, ctx, r.occurrence.person);
  requireRule(
    canReview(ctx, p, r),
    "Revisão indisponível: verifique a etapa, seu escopo e a vedação à autovalidação.",
  );
  requireRule(
    action === "approve" || text.trim(),
    "Informe o comentário ou esclarecimento solicitado.",
  );
  const note: Note = {
    id: crypto.randomUUID(),
    at: now.toISOString(),
    by: ctx.user,
    name: ctx.name,
    text: text.trim() || "Conferido.",
    kind:
      action === "clarify"
        ? "Esclarecimento solicitado"
        : action === "comment"
          ? "Comentário"
          : r.review === "leader"
            ? "Validação liderança"
            : "Validação RH",
  };
  const next: Report = {
    ...r,
    review:
      action === "approve"
        ? r.review === "leader"
          ? "rh"
          : "validated"
        : r.review,
    clarification:
      action === "clarify" ? (r.review as "leader" | "rh") : undefined,
    notes: [...r.notes, note],
  };
  return fresh(
    { ...s, reports: s.reports.map((x) => (x.id === id ? next : x)) },
    ctx,
    p.id,
    `${note.kind}: relatório de ${r.occurrence.date}.`,
    now,
  );
}
export function appendOwnNote(
  s: State,
  ctx: Scope,
  person: string,
  date: string,
  text: string,
  now = new Date(),
): State {
  const { o, r } = reportFor(s, ctx, person, date);
  requireRule(text.trim(), "Escreva a complementação ou justificativa.");
  const late = !r?.original && date < day(now);
  requireRule(
    late || r?.clarification,
    "Não há pedido de esclarecimento ou atraso para justificar.",
  );
  const note: Note = {
    id: crypto.randomUUID(),
    at: now.toISOString(),
    by: ctx.user,
    name: ctx.name,
    text: text.trim(),
    kind: late ? "Justificativa de atraso" : "Complementação",
  };
  const next: Report = r
    ? { ...r, clarification: undefined, notes: [...r.notes, note] }
    : {
        id: key(person, date),
        occurrence: structuredClone(o),
        draft: blank(o.period),
        review: "leader",
        notes: [note],
      };
  return fresh(
    {
      ...s,
      reports: r
        ? s.reports.map((x) => (x.id === r.id ? next : x))
        : [...s.reports, next],
    },
    ctx,
    person,
    `${note.kind} registrada para ${date}; o envio original e seu prazo foram preservados.`,
    now,
  );
}
export function editRules(
  s: State,
  ctx: Scope,
  text: string,
  now = new Date(),
): State {
  requireRule(
    s.org === ctx.org && ctx.mode === "rh",
    "Somente RH/Diretoria editam as regras.",
  );
  requireRule(text.trim(), "Informe as regras.");
  const r: Rules = {
    id: crypto.randomUUID(),
    number: s.rules.length + 1,
    at: now.toISOString(),
    by: ctx.name,
    text: text.trim(),
  };
  return {
    ...s,
    rules: [...s.rules, r],
    events: [
      {
        id: crypto.randomUUID(),
        at: now.toISOString(),
        by: ctx.user,
        name: ctx.name,
        text: `Regras v${r.number} publicadas. Acordos e registros anteriores mantêm sua versão.`,
      },
      ...s.events,
    ],
  };
}
