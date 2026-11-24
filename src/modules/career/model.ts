export type Contract = "CLT" | "Estágio" | "PJ";
export type Scope = {
  user: string;
  name: string;
  org: string;
  rh: boolean;
  director: boolean;
  leader: boolean;
  contract: Contract;
  key: string;
};
export type Sector = { id: string; name: string; intro: string };
export type CareerRole = {
  id: string;
  sector: string;
  title: string;
  level: number;
  levelName: string;
  branch: "Base" | "Técnica" | "Liderança";
  parent?: string;
  responsibilities: string[];
  requirements: string[];
  competencies: { name: string; description: string }[];
  published: boolean;
};
export type Person = {
  id: string;
  user: string;
  org: string;
  name: string;
  sector: string;
  contract: Contract;
  role: string;
  leader: string;
  leaderName: string;
  service?: string;
};
export type CareerHistory = {
  id: string;
  person: string;
  date: string;
  title: string;
  from: string;
  to: string;
};
export type Directive = {
  id: string;
  version: number;
  text: string;
  at: string;
  by: string;
  published: boolean;
};
export type Publication = {
  id: string;
  title: string;
  body: string;
  at: string;
  by: string;
  published: boolean;
  source?: string;
};
export type Band = {
  id: string;
  contract: Contract;
  role: string;
  label: string;
  min: number;
  reference: number;
  max: number;
};
export type Rates = { charges: number; provisions: number };
export type Cycle = {
  id: string;
  name: string;
  start: string;
  end: string;
  months: number;
  status: "Aberto" | "Encerrado";
  revenueTarget: number;
  revenueActual: number;
  costTarget: number;
  costActual: number;
  budget: number;
};
export type Kind =
  | "Mérito"
  | "Promoção"
  | "Reajuste salarial"
  | "Revisão de bolsa"
  | "Honorários PJ";
export type Movement = {
  id: string;
  person: string;
  cycle: string;
  kind: Kind;
  current: number;
  proposed: number;
  targetRole: string;
  effective: string;
  merit: string;
  rates: Rates;
  months: number;
  status:
    | "Rascunho"
    | "Em análise"
    | "Ajustes solicitados"
    | "Aprovado"
    | "Efetivado"
    | "Rejeitado"
    | "Cancelado";
  by: string;
  at: string;
  quote?: Impact;
  approvedBy?: string;
  events: { id: string; at: string; by: string; text: string }[];
};
export type Impact = {
  gross: number;
  charges: number;
  provisions: number;
  monthly: number;
  annual: number;
  reserve: number;
};
export type Finance = {
  compensation: { person: string; gross: number }[];
  bands: Band[];
  cycles: Cycle[];
  movements: Movement[];
  rates: Record<Contract, Rates>;
};
export type CareerState = {
  version: 1;
  org: string;
  sectors: Sector[];
  roles: CareerRole[];
  people: Person[];
  history: CareerHistory[];
  directives: Directive[];
  publications: Publication[];
  finance?: Finance;
  events: { id: string; at: string; by: string; text: string }[];
};
export const admin = (s: Scope) => s.rh || s.director;
export function assert(ok: unknown, text: string): asserts ok {
  if (!ok) throw new Error(text);
}
export const uid = () => crypto.randomUUID();
export const dateNow = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export function validDate(d: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(d) &&
    Number.isFinite(Date.parse(d + "T12:00:00Z")) &&
    new Date(d + "T12:00:00Z").toISOString().slice(0, 10) === d
  );
}
export function cents(value: string) {
  const n = Number(value);
  assert(
    value.trim() !== "" &&
      Number.isFinite(n) &&
      n >= 0 &&
      Number.isSafeInteger(Math.round(n * 100)),
    "Informe um valor monetário não negativo e válido.",
  );
  return Math.round(n * 100);
}
export const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    n / 100,
  );
function money(n: number) {
  assert(
    Number.isSafeInteger(n) && n >= 0,
    "Valores devem ser expressos em centavos, sem negativos ou perda de precisão.",
  );
}
export function monthly(gross: number, rates: Rates) {
  money(gross);
  assert(
    [rates.charges, rates.provisions].every(
      (n) => Number.isFinite(n) && n >= 0 && n <= 1000,
    ),
    "Parâmetros percentuais inválidos.",
  );
  const charges = Math.round((gross * rates.charges) / 100),
    provisions = Math.round((gross * rates.provisions) / 100);
  const total = gross + charges + provisions;
  money(total);
  return { gross, charges, provisions, total };
}
export function impact(
  m: Pick<Movement, "current" | "proposed" | "rates" | "months">,
): Impact {
  assert(
    m.proposed >= m.current,
    "O reconhecimento não pode reduzir o valor atual.",
  );
  assert(
    Number.isInteger(m.months) && m.months >= 1 && m.months <= 120,
    "Informe um horizonte entre 1 e 120 meses.",
  );
  const before = monthly(m.current, m.rates),
    after = monthly(m.proposed, m.rates);
  const result = {
    gross: after.gross - before.gross,
    charges: after.charges - before.charges,
    provisions: after.provisions - before.provisions,
    monthly: after.total - before.total,
    annual: (after.total - before.total) * 12,
    reserve: (after.total - before.total) * m.months,
  };
  money(result.reserve);
  money(result.annual);
  return result;
}
export function budget(s: CareerState, id: string) {
  const f = s.finance;
  assert(f, "Análise financeira restrita.");
  const c = f.cycles.find((c) => c.id === id);
  assert(c, "Ciclo não encontrado.");
  const committed = f.movements
    .filter(
      (m) => m.cycle === id && ["Aprovado", "Efetivado"].includes(m.status),
    )
    .reduce((n, m) => n + (m.quote?.reserve ?? 0), 0);
  return { authorized: c.budget, committed, available: c.budget - committed };
}
export function projection(s: CareerState, ctx: Scope): CareerState {
  assert(s.org === ctx.org, "Organização não autorizada.");
  if (admin(ctx)) return s;
  const roles = ctx.contract === "PJ" ? [] : s.roles.filter((r) => r.published);
  const ids = new Set(roles.map((r) => r.id));
  return {
    version: 1,
    org: s.org,
    sectors: ctx.contract === "PJ" ? [] : s.sectors,
    roles: roles.map((r) => ({
      ...r,
      parent: r.parent && ids.has(r.parent) ? r.parent : undefined,
    })),
    people: s.people.filter(
      (p) => p.user === ctx.user && p.contract !== "PJ" && p.org === ctx.org,
    ),
    history: s.history.filter((h) =>
      s.people.some(
        (p) =>
          p.id === h.person &&
          p.user === ctx.user &&
          p.contract !== "PJ" &&
          p.org === ctx.org,
      ),
    ),
    directives: s.directives.filter((d) => d.published),
    publications:
      ctx.contract === "PJ"
        ? []
        : s.publications
            .filter((p) => p.published)
            .map(({ id, title, body, at, by, published }) => ({
              id,
              title,
              body,
              at,
              by,
              published,
            })),
    events: [],
  };
}
function auth(s: CareerState, c: Scope) {
  assert(s.org === c.org && admin(c), "Área exclusiva de RH e Diretoria.");
  assert(s.finance, "Estado financeiro indisponível.");
  return s.finance;
}
function event(s: CareerState, ctx: Scope, text: string): CareerState {
  return {
    ...s,
    events: [
      { id: uid(), at: new Date().toISOString(), by: ctx.name, text },
      ...s.events,
    ],
  };
}
export function saveSector(s: CareerState, ctx: Scope, value: Sector) {
  auth(s, ctx);
  assert(value.name.trim(), "Informe o nome do setor.");
  return event(
    {
      ...s,
      sectors: s.sectors.some((x) => x.id === value.id)
        ? s.sectors.map((x) => (x.id === value.id ? structuredClone(value) : x))
        : [...s.sectors, structuredClone(value)],
    },
    ctx,
    `Setor ${value.name} personalizado.`,
  );
}
export function saveRole(s: CareerState, ctx: Scope, value: CareerRole) {
  auth(s, ctx);
  assert(
    value.title.trim() &&
      value.levelName.trim() &&
      Number.isInteger(value.level) &&
      value.level >= 1 &&
      value.level <= 20,
    "Informe cargo, nível e ordem de 1 a 20.",
  );
  assert(
    s.sectors.some((x) => x.id === value.sector),
    "Setor não encontrado.",
  );
  assert(
    ["Base", "Técnica", "Liderança"].includes(value.branch),
    "Caminho inválido.",
  );
  if (value.parent) {
    const parent = s.roles.find((r) => r.id === value.parent);
    assert(
      parent && parent.sector === value.sector && parent.level < value.level,
      "O cargo de origem deve ser do mesmo setor e de nível inferior.",
    );
  }
  assert(
    !s.roles.some(
      (r) =>
        r.parent === value.id &&
        (r.sector !== value.sector || r.level <= value.level),
    ),
    "A alteração invalida um cargo ligado a esta origem.",
  );
  assert(
    value.responsibilities.length &&
      value.responsibilities.every((v) => v.trim()) &&
      value.requirements.length &&
      value.requirements.every((v) => v.trim()) &&
      value.competencies.length &&
      value.competencies.every((c) => c.name.trim() && c.description.trim()),
    "Preencha responsabilidades, requisitos e competências com descrição.",
  );
  assert(
    value.published ||
      !s.roles.some((r) => r.parent === value.id && r.published),
    "Um cargo de origem com caminhos publicados precisa permanecer publicado.",
  );
  assert(
    value.published ||
      !s.people.some((p) => p.role === value.id && p.contract !== "PJ"),
    "Não é possível ocultar um cargo atualmente ocupado.",
  );
  assert(
    !value.published ||
      !value.parent ||
      s.roles.find((r) => r.id === value.parent)?.published,
    "Publique primeiro o cargo de origem.",
  );
  return event(
    {
      ...s,
      roles: s.roles.some((r) => r.id === value.id)
        ? s.roles.map((r) => (r.id === value.id ? structuredClone(value) : r))
        : [...s.roles, structuredClone(value)],
    },
    ctx,
    `Cargo ${value.title} ${value.published ? "publicado" : "salvo como rascunho"}.`,
  );
}
export function saveBand(s: CareerState, ctx: Scope, value: Band) {
  const f = auth(s, ctx);
  [value.min, value.reference, value.max].forEach(money);
  assert(
    value.min <= value.reference && value.reference <= value.max,
    "A faixa deve respeitar mínimo ≤ referência ≤ máximo.",
  );
  assert(value.label.trim(), "Informe o nome da faixa.");
  assert(
    value.contract === "PJ"
      ? !value.role
      : s.roles.some((r) => r.id === value.role),
    "PJ usa perfil contratual; empregados usam cargo válido.",
  );
  return event(
    {
      ...s,
      finance: {
        ...f,
        bands: f.bands.some((b) => b.id === value.id)
          ? f.bands.map((b) => (b.id === value.id ? structuredClone(value) : b))
          : [...f.bands, structuredClone(value)],
      },
    },
    ctx,
    `Faixa bruta ${value.label} atualizada.`,
  );
}
export function saveCycle(s: CareerState, ctx: Scope, value: Cycle) {
  const f = auth(s, ctx);
  assert(
    value.name.trim() &&
      validDate(value.start) &&
      validDate(value.end) &&
      value.start <= value.end,
    "Informe nome e período válidos.",
  );
  assert(
    Number.isInteger(value.months) && value.months >= 1 && value.months <= 120,
    "Horizonte inválido.",
  );
  [
    value.revenueTarget,
    value.revenueActual,
    value.costTarget,
    value.costActual,
    value.budget,
  ].forEach(money);
  const previous = f.cycles.find((c) => c.id === value.id);
  if (previous) {
    const movements = f.movements.filter(
      (m) =>
        m.cycle === value.id && !["Rejeitado", "Cancelado"].includes(m.status),
    );
    assert(
      !movements.length ||
        (value.months === previous.months &&
          value.start === previous.start &&
          value.end === previous.end),
      "O período e horizonte estão vinculados a análises existentes. Crie outro ciclo.",
    );
    assert(
      value.budget >= budget(s, value.id).committed,
      "O orçamento não pode ficar abaixo do valor comprometido.",
    );
    assert(
      value.status !== "Encerrado" ||
        !movements.some((m) =>
          [
            "Em análise",
            "Aprovado",
            "Rascunho",
            "Ajustes solicitados",
          ].includes(m.status),
        ),
      "Conclua ou cancele as análises abertas antes de encerrar o ciclo.",
    );
  }
  return event(
    {
      ...s,
      finance: {
        ...f,
        cycles: previous
          ? f.cycles.map((c) =>
              c.id === value.id ? structuredClone(value) : c,
            )
          : [...f.cycles, structuredClone(value)],
      },
    },
    ctx,
    `Ciclo ${value.name} atualizado.`,
  );
}
export function saveRates(s: CareerState, ctx: Scope, rates: Finance["rates"]) {
  const f = auth(s, ctx);
  (["CLT", "Estágio", "PJ"] as Contract[]).forEach((c) =>
    monthly(10000, rates[c]),
  );
  return event(
    { ...s, finance: { ...f, rates: structuredClone(rates) } },
    ctx,
    "Parâmetros ilustrativos atualizados para novas simulações. Análises existentes preservam seus parâmetros.",
  );
}
export function kinds(contract: Contract): Kind[] {
  return contract === "PJ"
    ? ["Honorários PJ"]
    : contract === "Estágio"
      ? ["Revisão de bolsa"]
      : ["Mérito", "Promoção", "Reajuste salarial"];
}
export function saveMovement(
  s: CareerState,
  ctx: Scope,
  input: Pick<
    Movement,
    | "id"
    | "person"
    | "cycle"
    | "kind"
    | "proposed"
    | "targetRole"
    | "effective"
    | "merit"
  >,
) {
  const f = auth(s, ctx);
  assert(ctx.rh, "As análises são conduzidas pelo RH.");
  const person = s.people.find(
    (p) => p.id === input.person && p.org === ctx.org,
  );
  assert(person, "Pessoa não encontrada.");
  const cycle = f.cycles.find((c) => c.id === input.cycle);
  assert(cycle && cycle.status === "Aberto", "Selecione um ciclo aberto.");
  assert(
    kinds(person.contract).includes(input.kind),
    "Tipo incompatível com o vínculo.",
  );
  assert(
    validDate(input.effective) &&
      input.effective >= cycle.start &&
      input.effective <= cycle.end,
    "A data deve estar dentro do ciclo.",
  );
  if (input.kind === "Promoção")
    assert(
      s.roles.some(
        (r) => r.id === input.targetRole && r.id !== person.role && r.published,
      ),
      "Selecione um cargo de destino publicado e diferente do atual.",
    );
  else
    assert(
      !input.targetRole,
      "Cargo de destino se aplica apenas à promoção CLT.",
    );
  const old = f.movements.find((m) => m.id === input.id);
  assert(
    !old || ["Rascunho", "Ajustes solicitados"].includes(old.status),
    "Somente rascunhos ou ajustes podem ser editados.",
  );
  assert(
    !f.movements.some(
      (m) =>
        m.person === person.id &&
        m.id !== input.id &&
        ["Rascunho", "Em análise", "Aprovado", "Ajustes solicitados"].includes(
          m.status,
        ),
    ),
    "Já existe uma análise aberta para esta pessoa.",
  );
  const current = f.compensation.find((c) => c.person === person.id)?.gross;
  assert(current !== undefined, "Valor atual não encontrado.");
  const m: Movement = {
    ...structuredClone(input),
    current,
    months: old?.months ?? cycle.months,
    rates: structuredClone(old?.rates ?? f.rates[person.contract]),
    status: "Rascunho",
    by: old?.by ?? ctx.user,
    at: old?.at ?? new Date().toISOString(),
    events: [
      ...(old?.events ?? []),
      {
        id: uid(),
        at: new Date().toISOString(),
        by: ctx.name,
        text: "Rascunho salvo pelo RH.",
      },
    ],
  };
  impact(m);
  return event(
    {
      ...s,
      finance: {
        ...f,
        movements: old
          ? f.movements.map((x) => (x.id === m.id ? m : x))
          : [m, ...f.movements],
      },
    },
    ctx,
    "Análise confidencial salva pelo RH.",
  );
}
export function submitMovement(s: CareerState, ctx: Scope, id: string) {
  const f = auth(s, ctx);
  assert(ctx.rh, "Somente RH envia análises.");
  const m = f.movements.find((m) => m.id === id);
  assert(
    m && ["Rascunho", "Ajustes solicitados"].includes(m.status),
    "Análise não editável.",
  );
  assert(m.merit.trim(), "Descreva os fundamentos de mérito e as evidências.");
  const c = f.cycles.find((c) => c.id === m.cycle);
  assert(c?.status === "Aberto", "Ciclo encerrado.");
  return movementChange(
    s,
    ctx,
    m,
    { status: "Em análise", quote: impact(m) },
    "Análise encaminhada à Diretoria; sem reserva de orçamento nesta etapa.",
  );
}
function movementChange(
  s: CareerState,
  ctx: Scope,
  m: Movement,
  patch: Partial<Movement>,
  text: string,
) {
  const f = s.finance!;
  const next = {
    ...m,
    ...patch,
    events: [
      ...m.events,
      { id: uid(), at: new Date().toISOString(), by: ctx.name, text },
    ],
  };
  return event(
    {
      ...s,
      finance: {
        ...f,
        movements: f.movements.map((x) => (x.id === m.id ? next : x)),
      },
    },
    ctx,
    text,
  );
}
export function decideMovement(
  s: CareerState,
  ctx: Scope,
  id: string,
  decision: "approve" | "reject" | "adjust" | "cancel",
  reason: string,
) {
  const f = auth(s, ctx);
  assert(ctx.director, "A aprovação é exclusiva da Diretoria.");
  const m = f.movements.find((m) => m.id === id);
  assert(m, "Análise não encontrada.");
  const p = s.people.find((p) => p.id === m.person);
  assert(
    p?.user !== ctx.user && m.by !== ctx.user,
    "Não é permitida autoaprovação.",
  );
  assert(reason.trim(), "Registre a justificativa da decisão.");
  if (decision === "cancel") {
    assert(
      m.status === "Aprovado",
      "Somente uma reserva aprovada pode ser cancelada.",
    );
    return movementChange(
      s,
      ctx,
      m,
      { status: "Cancelado" },
      `Reserva cancelada pela Diretoria: ${reason}`,
    );
  }
  assert(
    m.status === "Em análise",
    "A análise deve estar em revisão da Diretoria.",
  );
  const c = f.cycles.find((c) => c.id === m.cycle);
  assert(c?.status === "Aberto", "O ciclo precisa estar aberto.");
  if (decision === "approve") {
    const quote = impact(m);
    assert(
      quote.reserve <= budget(s, m.cycle).available,
      "O impacto excede o orçamento disponível.",
    );
    return movementChange(
      s,
      ctx,
      m,
      { status: "Aprovado", approvedBy: ctx.user, quote },
      `Diretoria aprovou a reserva demonstrativa: ${reason}`,
    );
  }
  return movementChange(
    s,
    ctx,
    m,
    { status: decision === "reject" ? "Rejeitado" : "Ajustes solicitados" },
    `Diretoria ${decision === "reject" ? "rejeitou" : "solicitou ajustes"}: ${reason}`,
  );
}
export function implementMovement(
  s: CareerState,
  ctx: Scope,
  id: string,
  today = dateNow(),
) {
  const f = auth(s, ctx);
  assert(ctx.rh, "Somente RH efetiva a simulação.");
  const m = f.movements.find((m) => m.id === id);
  assert(
    m?.status === "Aprovado" && m.approvedBy,
    "A análise precisa de aprovação da Diretoria.",
  );
  assert(m.effective <= today, "A data de efeito ainda não chegou.");
  const p = s.people.find((p) => p.id === m.person)!;
  const role =
    m.kind === "Promoção"
      ? s.roles.find((r) => r.id === m.targetRole)
      : undefined;
  assert(
    m.kind !== "Promoção" || role?.published,
    "Cargo de destino indisponível.",
  );
  let next = movementChange(
    s,
    ctx,
    m,
    { status: "Efetivado" },
    "Reconhecimento efetivado somente na demonstração local; sem alteração de folha ou contrato.",
  );
  next = {
    ...next,
    people: next.people.map((x) =>
      x.id === p.id && role ? { ...x, role: role.id, sector: role.sector } : x,
    ),
    finance: {
      ...next.finance!,
      compensation: f.compensation.map((c) =>
        c.person === p.id ? { ...c, gross: m.proposed } : c,
      ),
    },
    history:
      p.contract === "PJ"
        ? next.history
        : [
            {
              id: uid(),
              person: p.id,
              date: m.effective,
              title: `${m.kind} efetivado (demonstração)`,
              from: s.roles.find((r) => r.id === p.role)?.title ?? "",
              to:
                role?.title ??
                s.roles.find((r) => r.id === p.role)?.title ??
                "",
            },
            ...next.history,
          ],
  };
  return next;
}
export function saveDirective(
  s: CareerState,
  ctx: Scope,
  text: string,
  published: boolean,
) {
  auth(s, ctx);
  assert(text.trim(), "Informe o texto das diretrizes.");
  return event(
    {
      ...s,
      directives: [
        ...s.directives,
        {
          id: uid(),
          version: s.directives.length + 1,
          text: text.trim(),
          at: new Date().toISOString(),
          by: ctx.name,
          published,
        },
      ],
    },
    ctx,
    `Diretrizes ${published ? "publicadas" : "salvas como rascunho"}.`,
  );
}
export function savePublication(
  s: CareerState,
  ctx: Scope,
  input: Pick<Publication, "id" | "title" | "body" | "published" | "source">,
  authorized: boolean,
) {
  auth(s, ctx);
  assert(ctx.rh, "A publicação depende de autorização do RH.");
  assert(
    authorized && input.title.trim() && input.body.trim(),
    "Confirme a autorização e preencha título e conteúdo público.",
  );
  if (input.source) {
    const m = s.finance!.movements.find((m) => m.id === input.source);
    assert(
      m?.status === "Efetivado",
      "Somente reconhecimentos já efetivados podem ser publicados.",
    );
    assert(
      s.people.find((p) => p.id === m.person)?.contract !== "PJ",
      "Reconhecimento PJ permanece exclusivamente na análise contratual.",
    );
  }
  const publication: Publication = {
    ...structuredClone(input),
    at: new Date().toISOString(),
    by: ctx.name,
  };
  return event(
    {
      ...s,
      publications: s.publications.some((p) => p.id === input.id)
        ? s.publications.map((p) => (p.id === input.id ? publication : p))
        : [publication, ...s.publications],
    },
    ctx,
    `Publicação institucional ${input.published ? "autorizada" : "retirada"} pelo RH. Valores e justificativas financeiras não são copiados.`,
  );
}
