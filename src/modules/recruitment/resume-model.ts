import {
  type State,
  type Candidate,
  type Application,
  guard,
  ev,
  saveCandidate,
  visibleFields,
  validFile,
} from "./model";
import { type Scope, assert, uid, dateNow, validDate } from "../career/model";
import {
  upgradeWorkflow,
  projectWorkflow,
  intakeCandidate,
  normalized,
} from "./workflow-model";
import {
  type ResumeConfig,
  type ResumeProfile,
  type ResumeField,
  type ResumeRevision,
  type DuplicateReview,
  type ResumeView,
  type AvailabilityStatus,
  availabilityStates,
  resumeFields,
} from "./resume-types";
import { type WorkflowFilters } from "./workflow-types";
const now = () => new Date().toISOString();
export const defaultResumeConfig = (): ResumeConfig => ({
  months: [3, 6, 12],
  linkHours: 48,
  message:
    "Olá, {nome}! Gostaríamos de atualizar seu currículo para futuras oportunidades. Acesse {link} até {validade}. Use somente dados fictícios nesta demonstração.",
  autoArchive: false,
  archiveDays: 30,
});
export function profileOf(p: Candidate): ResumeProfile {
  return {
    ...(Object.fromEntries(resumeFields.map((k) => [k, p[k]])) as Pick<
      Candidate,
      ResumeField
    >),
    contracts: [...p.contracts],
    cv: p.cv,
    portfolio: p.portfolio,
    availabilityStatus: p.availabilityStatus ?? "Disponibilidade desconhecida",
  };
}
function snapshot(
  p: Candidate,
  version: number,
  by: string,
  reason: string,
  at = now(),
): ResumeRevision {
  return {
    id: uid(),
    candidate: p.id,
    version,
    by,
    reason,
    at,
    until: p.retentionUntil,
    resumeUpdated: p.resumeUpdated ?? p.created,
    profile: structuredClone(profileOf(p)),
  };
}
export function upgradeResumeDatabase(input: State, c: Scope): State {
  const s = upgradeWorkflow(input, c);
  if (s.resumeVersion === 1) return s;
  const bank = new Set(
    s.central!.stages.filter((st) => st.kind === "bank").map((st) => st.id),
  );
  const ids = new Set(
    s.applications.filter((a) => bank.has(a.stage)).map((a) => a.candidate),
  );
  const candidates = s.candidates.map((p) => ({
    ...p,
    talent: p.talent ?? ids.has(p.id),
    resumeUpdated: p.resumeUpdated ?? p.created,
    availabilityStatus:
      p.availabilityStatus ??
      ("Disponibilidade desconhecida" as AvailabilityStatus),
  }));
  return {
    ...s,
    resumeVersion: 1,
    resumeConfig: defaultResumeConfig(),
    resumeHistory: candidates
      .filter((p) => !p.erased)
      .map((p) =>
        snapshot(
          p,
          1,
          "Cadastro demonstrativo preservado",
          "Primeiro currículo preservado",
          p.created + "T12:00:00Z",
        ),
      ),
    resumeContacts: [],
    resumeRequests: [],
    duplicateReviews: [],
    importReports: [],
    candidates,
    central: {
      ...s.central!,
      stages: s.central!.stages.filter((st) => !bank.has(st.id)),
    },
    applications: s.applications.map((a) =>
      bank.has(a.stage)
        ? {
            ...a,
            archived: {
              at: now(),
              by: "Atualização local",
              reason:
                "Antigo Banco preservado como classificação de talento. Processo anterior arquivado, sem alterar seu resultado.",
              automatic: false,
            },
          }
        : a,
    ),
    events: [
      ...s.events,
      ev(
        c,
        "Banco de Currículos centralizado. Talento independente da etapa; registros do antigo Banco preservados.",
      ),
    ],
  };
}
export function projectResumeDatabase(input: State, c: Scope): State {
  const s = upgradeResumeDatabase(input, c),
    base = projectWorkflow(s, c);
  if (c.rh) return s;
  return {
    ...base,
    candidates: base.candidates
      .filter((p) => !p.mergedInto)
      .map((p) => ({
        ...p,
        talent: undefined,
        resumeUpdated: undefined,
        lastContact: undefined,
        availabilityStatus: undefined,
        mergedInto: undefined,
      })),
    applications: base.applications.map((a) => ({
      ...a,
      archived: a.archived ? { ...a.archived, reason: "", by: "" } : undefined,
    })),
    resumeConfig: undefined,
    resumeHistory: [],
    resumeContacts: [],
    resumeRequests: [],
    duplicateReviews: [],
    importReports: [],
  };
}
function hr(s: State, c: Scope) {
  guard(s, c, "hr");
  assert(s.resumeVersion === 1, "Base de currículos indisponível.");
}
export function recordResumeChanges(
  before: State,
  after: State,
  c: Scope,
): State {
  if (!c.rh || !after.resumeVersion) return after;
  const history = [...(after.resumeHistory ?? [])];
  const candidates = after.candidates.map((p) => {
    const old = before.candidates.find((x) => x.id === p.id);
    if (p.erased || p.mergedInto) return p;
    const changed =
      old &&
      JSON.stringify({ ...profileOf(old), availabilityStatus: undefined }) !==
        JSON.stringify({ ...profileOf(p), availabilityStatus: undefined });
    const exists = history.some((h) => h.candidate === p.id);
    const recorded = history.some(
      (h) =>
        h.candidate === p.id &&
        !before.resumeHistory?.some((old) => old.id === h.id),
    );
    const merged = after.duplicateReviews?.some(
      (r) =>
        r.left === p.id &&
        r.state === "Unificados" &&
        !before.duplicateReviews?.some(
          (b) => b.id === r.id && b.state === "Unificados",
        ),
    );
    if ((changed && !recorded) || !exists) {
      history.push(
        snapshot(
          p,
          Math.max(
            0,
            ...history
              .filter((h) => h.candidate === p.id)
              .map((h) => h.version),
          ) + 1,
          c.name,
          old
            ? "Atualização cadastral / currículo preservado"
            : "Primeiro cadastro",
        ),
      );
    }
    return {
      ...p,
      created: merged ? p.created : (old?.created ?? p.created),
      resumeUpdated:
        merged || recorded
          ? (p.resumeUpdated ?? p.created)
          : changed
            ? dateNow()
            : (p.resumeUpdated ?? p.created),
    };
  });
  return { ...after, candidates, resumeHistory: history };
}
export function freshness(
  p: Candidate,
  config: ResumeConfig,
  today = dateNow(),
) {
  const date = p.resumeUpdated ?? p.created;
  const boundary = (months: number) => {
    const [y, m, d] = date.split("-").map(Number);
    const month = new Date(Date.UTC(y, m - 1 + months, 1));
    const last = new Date(
      Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0),
    ).getUTCDate();
    return new Date(
      Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), Math.min(d, last)),
    )
      .toISOString()
      .slice(0, 10);
  };
  if (!validDate(date)) return { label: "Data não informada", level: 3 };
  const level = config.months.findIndex((n) => today <= boundary(n));
  return {
    label: [
      "Atualizado",
      "Regular",
      "Atualização recomendada",
      "Desatualizado",
    ][level < 0 ? 3 : level],
    level: level < 0 ? 3 : level,
  };
}
export function saveResumeConfig(
  s: State,
  c: Scope,
  config: ResumeConfig,
): State {
  hr(s, c);
  const [a, b, d] = config.months;
  assert(
    [a, b, d].every((n) => Number.isInteger(n) && n > 0) && a < b && b < d,
    "Intervalos em meses devem ser positivos e crescentes.",
  );
  assert(
    Number.isInteger(config.linkHours) &&
      config.linkHours >= 1 &&
      config.linkHours <= 168 &&
      config.message.includes("{link}") &&
      config.message.includes("{nome}"),
    "Defina validade entre 1 e 168 horas e mensagem com {nome} e {link}.",
  );
  assert(
    Number.isInteger(config.archiveDays) && config.archiveDays >= 1,
    "Defina prazo de arquivamento positivo.",
  );
  return {
    ...s,
    resumeConfig: structuredClone(config),
    events: [
      ...s.events,
      ev(
        c,
        "Intervalos, mensagem e regra de arquivamento demonstrativos atualizados.",
      ),
    ],
  };
}
export function toggleTalent(s: State, c: Scope, id: string): State {
  hr(s, c);
  const p = s.candidates.find((p) => p.id === id && !p.erased && !p.mergedInto);
  assert(p, "Cadastro indisponível.");
  return {
    ...s,
    candidates: s.candidates.map((x) =>
      x.id === id ? { ...x, talent: !x.talent } : x,
    ),
    relationships: [
      ...s.relationships!,
      {
        id: uid(),
        candidate: id,
        at: now(),
        by: c.name,
        kind: "Movimentação",
        text: p.talent
          ? "Classificação de talento removida pelo RH."
          : "Marcado como talento para oportunidades futuras, sem movimentação de etapa.",
      },
    ],
  };
}
export function recordContact(
  s: State,
  c: Scope,
  id: string,
  note: string,
  availability: AvailabilityStatus,
  returnOn: string,
): State {
  hr(s, c);
  assert(
    note.trim() &&
      availabilityStates.includes(availability) &&
      (!returnOn || validDate(returnOn)),
    "Informe contato, disponibilidade e data de retorno válidos.",
  );
  assert(
    s.candidates.some((p) => p.id === id && !p.erased && !p.mergedInto),
    "Cadastro indisponível.",
  );
  return {
    ...s,
    candidates: s.candidates.map((p) =>
      p.id === id
        ? { ...p, lastContact: now(), availabilityStatus: availability }
        : p,
    ),
    resumeContacts: [
      {
        id: uid(),
        candidate: id,
        at: now(),
        by: c.name,
        note,
        returnOn,
        availability,
        done: false,
      },
      ...s.resumeContacts!,
    ],
  };
}
export function closeReminder(s: State, c: Scope, id: string): State {
  hr(s, c);
  return {
    ...s,
    resumeContacts: s.resumeContacts!.map((x) =>
      x.id === id ? { ...x, done: true } : x,
    ),
  };
}
export function archiveProcesses(
  s: State,
  c: Scope,
  ids: string[],
  reason: string,
  automatic = false,
): State {
  hr(s, c);
  assert(
    ids.length && reason.trim(),
    "Selecione processos e justifique o arquivamento.",
  );
  for (const id of ids) {
    const a = s.applications.find((a) => a.id === id);
    assert(
      a && a.status !== "Ativa",
      "Somente processos encerrados ou formalizados podem ser arquivados.",
    );
  }
  return {
    ...s,
    applications: s.applications.map((a) =>
      ids.includes(a.id) && !a.archived
        ? {
            ...a,
            archived: { at: now(), by: c.name, reason, automatic },
            events: [
              ...a.events,
              ev(
                c,
                `Processo arquivado: ${reason}. Cadastro e resultado preservados.`,
              ),
            ],
          }
        : a,
    ),
  };
}
export function runArchiveRules(s: State, c: Scope, today = dateNow()): State {
  hr(s, c);
  if (!s.resumeConfig!.autoArchive) return s;
  const ids = s.applications
    .filter(
      (a) =>
        !a.archived &&
        a.status !== "Ativa" &&
        (Date.parse(today) -
          Date.parse(
            a.closedAt ??
              a.hiredAt ??
              a.events.at(-1)?.at ??
              a.visits.at(-1)?.at ??
              a.entered,
          )) /
          86400000 >=
          s.resumeConfig!.archiveDays,
    )
    .map((a) => a.id);
  return ids.length
    ? archiveProcesses(
        s,
        c,
        ids,
        `Regra local: encerrado há ${s.resumeConfig!.archiveDays} dias ou mais.`,
        true,
      )
    : s;
}
export function resumeCandidates(
  s: State,
  view: ResumeView,
  filters: WorkflowFilters,
) {
  const inc = (value: string, q: string) =>
    !q || normalized(value).includes(normalized(q));
  return s.candidates.filter((p) => {
    if (p.erased || p.mergedInto) return false;
    const apps = s.applications.filter((a) => a.candidate === p.id),
      active = apps.some(
        (a) => !a.archived && !a.historical && a.status === "Ativa",
      );
    const quick =
      view === "Todos os currículos" ||
      (view === "Novos cadastros" &&
        (Date.parse(dateNow()) - Date.parse(p.created)) / 86400000 <= 30) ||
      (view === "Talentos selecionados" && p.talent) ||
      (view === "Em processo seletivo" && active) ||
      (view === "Currículos desatualizados" &&
        freshness(p, s.resumeConfig!).level === 3) ||
      (view === "Propostas recusadas" &&
        s.offers.some(
          (o) =>
            o.state === "Recusada" && apps.some((a) => a.id === o.application),
        )) ||
      (view === "Ex-profissionais" &&
        s.employments!.some(
          (e) => e.candidate === p.id && e.status === "Encerrado",
        )) ||
      (view === "Arquivados" && apps.some((a) => a.archived));
    return (
      quick &&
      (!filters.freshness ||
        freshness(p, s.resumeConfig!).level === Number(filters.freshness)) &&
      inc(
        [p.name, p.email, p.phone, p.summary, p.skills, p.software].join(" "),
        filters.search,
      ) &&
      inc(p.sector, filters.area) &&
      (!filters.sector ||
        apps.some((a) => inc(a.sector, filters.sector)) ||
        inc(p.sector, filters.sector)) &&
      inc(p.validatedLevel ?? p.experience, filters.level) &&
      inc(p.city, filters.city) &&
      inc(p.education, filters.education) &&
      inc(p.skills, filters.skills) &&
      inc(p.software, filters.software) &&
      inc(
        [p.availability, p.availabilityStatus].join(" "),
        filters.availability,
      ) &&
      (!filters.contract ||
        p.contracts.includes(
          filters.contract as Candidate["contracts"][number],
        )) &&
      (!filters.job || apps.some((a) => a.job === filters.job)) &&
      inc(p.source, filters.origin) &&
      inc(p.tags.join(" "), filters.tags) &&
      (!filters.stage || apps.some((a) => a.stage === filters.stage)) &&
      (!filters.from || p.created >= filters.from) &&
      (!filters.until || p.created <= filters.until)
    );
  });
}
export const eligibleResumes = (s: State) =>
  s.candidates.filter(
    (p) =>
      !p.erased &&
      !p.mergedInto &&
      p.retentionUntil >= dateNow() &&
      p.availabilityStatus !== "Sem interesse no momento",
  );
export function createUpdateRequests(s: State, c: Scope, ids: string[]): State {
  hr(s, c);
  assert(ids.length, "Selecione currículos.");
  const created = now();
  const requests = [...s.resumeRequests!];
  for (const id of new Set(ids)) {
    const p = s.candidates.find(
      (p) => p.id === id && !p.erased && !p.mergedInto,
    );
    assert(
      p && p.retentionUntil >= dateNow(),
      "Reveja a finalidade e retenção antes de solicitar atualização.",
    );
    for (let i = 0; i < requests.length; i++)
      if (requests[i].candidate === id && requests[i].state === "Aberta")
        requests[i] = { ...requests[i], state: "Revogada" };
    requests.unshift({
      id: uid(),
      candidate: id,
      org: c.org,
      token: uid().replaceAll("-", "") + uid().replaceAll("-", ""),
      created,
      expires: new Date(
        Date.parse(created) + s.resumeConfig!.linkHours * 3600000,
      ).toISOString(),
      by: c.name,
      state: "Aberta",
      revision: Math.max(
        0,
        ...s
          .resumeHistory!.filter((h) => h.candidate === id)
          .map((h) => h.version),
      ),
      message: s.resumeConfig!.message,
    });
  }
  return { ...s, resumeRequests: requests };
}
export function revokeUpdateRequest(s: State, c: Scope, id: string): State {
  hr(s, c);
  return {
    ...s,
    resumeRequests: s.resumeRequests!.map((r) =>
      r.id === id && r.state === "Aberta" ? { ...r, state: "Revogada" } : r,
    ),
  };
}
export function updateProjection(
  s: State,
  c: Scope,
  id: string,
  token: string,
  at = now(),
) {
  hr(s, c);
  const r = s.resumeRequests!.find(
      (r) =>
        r.id === id &&
        r.org === c.org &&
        r.token === token &&
        r.state === "Aberta" &&
        Date.parse(r.expires) > Date.parse(at),
    ),
    p = s.candidates.find(
      (p) =>
        p.id === r?.candidate &&
        !p.erased &&
        !p.mergedInto &&
        p.retentionUntil >= dateNow(),
    );
  assert(
    r && p,
    "Link demonstrativo inválido, expirado, utilizado ou revogado.",
  );
  return {
    request: r.id,
    expires: r.expires,
    profile: profileOf(p),
    revision: r.revision,
  };
}
export function applyResumeUpdate(
  s: State,
  c: Scope,
  id: string,
  token: string,
  data: ResumeProfile,
  consent: boolean,
): State {
  hr(s, c);
  const dto = updateProjection(s, c, id, token),
    r = s.resumeRequests!.find((r) => r.id === id)!,
    p = s.candidates.find((p) => p.id === r.candidate)!;
  assert(consent, "Confirme os dados fictícios e a finalidade.");
  assert(
    Array.isArray(data.contracts) &&
      data.contracts.length > 0 &&
      data.contracts.every((x) => ["CLT", "Estágio", "PJ"].includes(x)),
    "Modalidades inválidas.",
  );
  assert(
    dto.revision ===
      Math.max(
        ...s
          .resumeHistory!.filter((h) => h.candidate === p.id)
          .map((h) => h.version),
      ),
    "O cadastro mudou desde o convite. RH deve emitir novo link.",
  );
  assert(
    availabilityStates.includes(data.availabilityStatus),
    "Disponibilidade inválida.",
  );
  const allowed = profileOf({
    ...p,
    ...Object.fromEntries(resumeFields.map((k) => [k, data[k]])),
    contracts: data.contracts,
    cv: data.cv,
    portfolio: data.portfolio,
    availabilityStatus: data.availabilityStatus,
  });
  let next = saveCandidate(s, c, { ...p, ...allowed });
  next = recordResumeChanges(s, next, c);
  if (next.resumeHistory!.length === s.resumeHistory!.length)
    next = {
      ...next,
      resumeHistory: [
        ...next.resumeHistory!,
        snapshot(
          { ...p, ...allowed },
          dto.revision + 1,
          "Candidato demonstrativo",
          "Confirmação cadastral recebida por convite",
        ),
      ],
    };
  next = {
    ...next,
    candidates: next.candidates.map((x) =>
      x.id === p.id
        ? { ...x, resumeUpdated: dateNow(), lastContact: now() }
        : x,
    ),
    resumeContacts: [
      {
        id: uid(),
        candidate: p.id,
        at: now(),
        by: "Candidato demonstrativo",
        note: "Atualização recebida por convite local; nenhuma mensagem externa.",
        returnOn: "",
        availability: allowed.availabilityStatus,
        done: true,
      },
      ...next.resumeContacts!,
    ],
  };
  const matches = resumeDuplicates(
    next,
    next.candidates.find((x) => x.id === p.id)!,
  ).filter((x) => !x.mergedInto);
  for (const match of matches)
    if (
      !next.duplicateReviews!.some(
        (r) =>
          r.state === "Pendente" &&
          [r.left, r.right].includes(p.id) &&
          [r.left, r.right].includes(match.id),
      )
    )
      next = openDuplicateReview(next, c, p.id, match.id);
  return {
    ...next,
    resumeRequests: next.resumeRequests!.map((x) =>
      x.id === id ? { ...x, state: "Utilizada", usedAt: now() } : x,
    ),
    relationships: [
      ...next.relationships!,
      {
        id: uid(),
        candidate: p.id,
        at: now(),
        by: "Atualização demonstrativa do candidato",
        kind: "Movimentação",
        text: "Dados cadastrais e currículo atualizados por convite local temporário. Avaliações e registros internos preservados.",
      },
    ],
  };
}
function queueDuplicate(
  s: State,
  c: Scope,
  incoming: Candidate,
  matches: Candidate[],
): State {
  const review: DuplicateReview = {
    id: uid(),
    left: matches[0].id,
    incoming: structuredClone(incoming),
    matches: matches.map((p) => p.id),
    state: "Pendente",
    at: now(),
    by: c.name,
    note: "",
  };
  return { ...s, duplicateReviews: [review, ...s.duplicateReviews!] };
}
export function registerResume(
  s: State,
  c: Scope,
  p: Candidate,
  intake = true,
): State {
  hr(s, c);
  if (s.candidates.some((x) => x.id === p.id))
    return recordResumeChanges(s, saveCandidate(s, c, p), c);
  const matches = resumeDuplicates(s, p);
  if (matches.length) {
    saveCandidate(s, c, p);
    return queueDuplicate(s, c, p, matches);
  }
  const next = intake ? intakeCandidate(s, c, p) : saveCandidate(s, c, p);
  return recordResumeChanges(s, next, c);
}
export function submitResumeIntake(
  s: State,
  c: Scope,
  answers: Record<string, string>,
  files: Application["answerFiles"],
  consent: boolean,
): State {
  hr(s, c);
  assert(consent, "Confirme o uso demonstrativo e a finalidade.");
  const form = s.forms.find((f) => f.id === s.central!.formId)!;
  const visible = visibleFields(form, answers);
  for (const f of visible) {
    assert(
      !f.required || answers[f.id]?.trim() || files[f.id],
      `Preencha ${f.label}.`,
    );
    if (files[f.id]) validFile(files[f.id]);
  }
  const get = (key: string) =>
    answers[visible.find((f) => f.mapping === key)?.id ?? ""] ?? "";
  const p: Candidate = {
    id: uid(),
    name: get("name"),
    email: get("email").trim(),
    phone: get("phone"),
    city: get("city"),
    sector: get("sector"),
    education: get("education"),
    experience: get("experience"),
    skills: get("skills"),
    software: get("software"),
    availability: get("availability"),
    expected: 0,
    contracts: ["CLT", "Estágio", "PJ"],
    source: "Formulário geral protegido",
    referral: "",
    tags: [],
    created: dateNow(),
    retentionUntil: new Date(
      Date.parse(dateNow() + "T12:00:00Z") + s.privacy.days * 86400000,
    )
      .toISOString()
      .slice(0, 10),
    consent: `Finalidade demonstrativa v${s.privacy.version}`,
    summary: get("notes"),
    claims: [],
    cv: files[visible.find((f) => f.mapping === "cv")?.id ?? ""],
    portfolio: files[visible.find((f) => f.mapping === "portfolio")?.id ?? ""],
  };
  let next = registerResume(s, c, p);
  const received = {
    form: structuredClone(form),
    answers: Object.fromEntries(
      visible
        .filter((f) => answers[f.id] !== undefined)
        .map((f) => [f.id, answers[f.id]]),
    ),
    files: Object.fromEntries(
      visible.filter((f) => files[f.id]).map((f) => [f.id, files[f.id]]),
    ),
  };
  next = {
    ...next,
    duplicateReviews: next.duplicateReviews!.map((r) =>
      r.incoming?.id === p.id ? { ...r, intake: received } : r,
    ),
  };
  const a = next.applications.find((a) => a.candidate === p.id);
  return a
    ? {
        ...next,
        applications: next.applications.map((x) =>
          x.id === a.id
            ? {
                ...x,
                form: structuredClone(form),
                answers: Object.fromEntries(
                  visible
                    .filter((f) => answers[f.id] !== undefined)
                    .map((f) => [f.id, answers[f.id]]),
                ),
                answerFiles: Object.fromEntries(
                  visible
                    .filter((f) => files[f.id])
                    .map((f) => [f.id, files[f.id]]),
                ),
              }
            : x,
        ),
      }
    : next;
}
export function openDuplicateReview(
  s: State,
  c: Scope,
  left: string,
  right: string,
): State {
  hr(s, c);
  assert(left !== right, "Selecione duas pessoas distintas.");
  if (
    s.duplicateReviews!.some(
      (r) =>
        r.state === "Pendente" &&
        !r.incoming &&
        [r.left, r.right].includes(left) &&
        [r.left, r.right].includes(right),
    )
  )
    return s;
  for (const id of [left, right])
    assert(
      s.candidates.some((p) => p.id === id && !p.erased && !p.mergedInto),
      "Cadastro indisponível.",
    );
  return {
    ...s,
    duplicateReviews: [
      {
        id: uid(),
        left,
        right,
        matches: [left, right],
        state: "Pendente",
        at: now(),
        by: c.name,
        note: "",
      },
      ...s.duplicateReviews!,
    ],
  };
}
export function resolveDuplicate(
  s: State,
  c: Scope,
  id: string,
  merge: boolean,
  choices: NonNullable<DuplicateReview["choices"]>,
  note: string,
): State {
  hr(s, c);
  const review = s.duplicateReviews!.find(
    (r) => r.id === id && r.state === "Pendente",
  );
  assert(
    review && note.trim(),
    "Selecione revisão pendente e justifique a decisão.",
  );
  const left = s.candidates.find(
      (p) => p.id === review.left && !p.erased && !p.mergedInto,
    ),
    right =
      review.incoming ??
      s.candidates.find(
        (p) => p.id === review.right && !p.erased && !p.mergedInto,
      );
  assert(left && right, "Os cadastros mudaram; abra outra revisão.");
  if (!merge) {
    let next = s;
    if (review.incoming)
      next = recordResumeChanges(s, intakeCandidate(s, c, right), c);
    if (review.incoming && review.intake)
      next = {
        ...next,
        applications: next.applications.map((a) =>
          a.candidate === right.id &&
          !s.applications.some((old) => old.id === a.id)
            ? {
                ...a,
                form: structuredClone(review.intake!.form),
                answers: structuredClone(review.intake!.answers),
                answerFiles: structuredClone(review.intake!.files),
              }
            : a,
        ),
      };
    return {
      ...next,
      duplicateReviews: next.duplicateReviews!.map((r) =>
        r.id === id
          ? {
              ...r,
              state: "Separados",
              note,
              resolvedAt: now(),
              choices,
              by: c.name,
            }
          : r,
      ),
    };
  }
  assert(
    s.employments!.filter(
      (e) => [left.id, right.id].includes(e.candidate) && e.status === "Ativo",
    ).length <= 1,
    "Dois vínculos ativos não podem ser unificados sem revisão do RH.",
  );
  const profile = profileOf(left);
  for (const key of [
    ...resumeFields,
    "cv",
    "portfolio",
    "availabilityStatus",
  ] as const) {
    if (choices[key] === "right")
      Object.assign(profile, { [key]: profileOf(right)[key] });
  }
  const merged: Candidate = {
    ...left,
    ...profile,
    talent: left.talent || right.talent,
    resumeUpdated: [
      left.resumeUpdated ?? left.created,
      right.resumeUpdated ?? right.created,
    ]
      .sort()
      .at(-1),
    created: left.created < right.created ? left.created : right.created,
    tags: [...new Set([...left.tags, ...right.tags])],
    claims: [
      ...left.claims,
      ...right.claims
        .filter(
          (x) =>
            !left.claims.some(
              (y) =>
                y.field === x.field &&
                y.value === x.value &&
                y.status === x.status &&
                y.source === x.source,
            ),
        )
        .map((x) =>
          left.claims.some((y) => y.id === x.id) ? { ...x, id: uid() } : x,
        ),
    ],
    contracts: [...new Set([...left.contracts, ...right.contracts])],
    lastContact:
      [left.lastContact ?? "", right.lastContact ?? ""].sort().at(-1) ||
      undefined,
  };
  const remap = <T extends { candidate: string }>(rows: T[]) =>
    rows.map((row) =>
      row.candidate === right.id ? { ...row, candidate: left.id } : row,
    );
  let next: State = {
    ...s,
    candidates: s.candidates.map((p) =>
      p.id === left.id
        ? merged
        : p.id === right.id
          ? { ...p, mergedInto: left.id }
          : p,
    ),
    applications: remap(s.applications),
    admissions: remap(s.admissions!),
    employments: remap(s.employments!),
    relationships: remap(s.relationships!),
    analyses: remap(s.analyses),
    assessments: remap(s.assessments),
    handoffs: remap(s.handoffs),
    resumeHistory: s.resumeHistory!.map((h) =>
      h.candidate === right.id
        ? { ...h, candidate: left.id, originCandidate: right.id }
        : h,
    ),
    resumeContacts: s.resumeContacts!.map((h) =>
      h.candidate === right.id
        ? { ...h, candidate: left.id, originCandidate: right.id }
        : h,
    ),
    resumeRequests: s.resumeRequests!.map((r) => ({
      ...r,
      ...(r.candidate === right.id
        ? { candidate: left.id, originCandidate: right.id }
        : {}),
      state:
        [left.id, right.id].includes(r.candidate) && r.state === "Aberta"
          ? "Revogada"
          : r.state,
    })),
    duplicateReviews: s.duplicateReviews!.map((r) =>
      r.id === id
        ? {
            ...r,
            state: "Unificados",
            note,
            choices,
            resolvedAt: now(),
            by: c.name,
          }
        : r,
    ),
  };
  if (review.incoming)
    next = {
      ...next,
      resumeHistory: [
        ...next.resumeHistory!,
        snapshot(
          { ...right, id: left.id },
          Math.max(
            ...next
              .resumeHistory!.filter((h) => h.candidate === left.id)
              .map((h) => h.version),
          ) + 1,
          c.name,
          "Dados recebidos preservados na unificação",
        ),
      ],
    };
  if (review.incoming && review.intake) {
    const last = next.resumeHistory!.at(-1)!;
    next = {
      ...next,
      resumeHistory: next.resumeHistory!.map((h) =>
        h.id === last.id
          ? { ...h, receivedForm: structuredClone(review.intake) }
          : h,
      ),
    };
  }
  next = recordResumeChanges(s, next, c);
  const canonical = next
    .resumeHistory!.filter((h) => h.candidate === left.id)
    .sort((a, b) => a.at.localeCompare(b.at));
  const reindexed = new Map(
    canonical.map((h, i) => [
      h.id,
      { ...h, originVersion: h.originVersion ?? h.version, version: i + 1 },
    ]),
  );
  next = {
    ...next,
    resumeHistory: next.resumeHistory!.map((h) => reindexed.get(h.id) ?? h),
  };
  return {
    ...next,
    relationships: [
      ...next.relationships!,
      {
        id: uid(),
        candidate: left.id,
        at: now(),
        by: c.name,
        kind: "Movimentação",
        text: `Unificação revisada: ${right.name} → ${left.name}. ${note}. Processos, propostas, avaliações e vínculos preservados.`,
      },
    ],
  };
}
export function purgeExpiredRevisions(s: State, c: Scope): State {
  hr(s, c);
  return {
    ...s,
    resumeHistory: s.resumeHistory!.map((h) =>
      h.until < dateNow()
        ? { ...h, profile: {}, receivedForm: undefined, purged: true }
        : h,
    ),
  };
}

export function chooseDuplicateReference(
  s: State,
  c: Scope,
  id: string,
  left: string,
): State {
  hr(s, c);
  const r = s.duplicateReviews!.find(
    (r) => r.id === id && r.state === "Pendente" && r.incoming,
  );
  assert(
    r &&
      r.matches.includes(left) &&
      s.candidates.some((p) => p.id === left && !p.erased && !p.mergedInto),
    "Referência de comparação indisponível.",
  );
  return {
    ...s,
    duplicateReviews: s.duplicateReviews!.map((r) =>
      r.id === id ? { ...r, left } : r,
    ),
  };
}

export function resumeDuplicates(
  s: State,
  p: Pick<Candidate, "id" | "name" | "email" | "phone">,
): Candidate[] {
  const phone = (x: string) => {
    const n = x.replace(/\D/g, "");
    return n.length > 11 && n.startsWith("55") ? n.slice(2) : n;
  };
  const name = (x: string) => normalized(x).trim().replace(/\s+/g, " ");
  return s.candidates.filter(
    (x) =>
      x.id !== p.id &&
      !x.erased &&
      !x.mergedInto &&
      ((p.email.trim() &&
        x.email.trim().toLowerCase() === p.email.trim().toLowerCase()) ||
        (phone(p.phone).length >= 10 && phone(x.phone) === phone(p.phone)) ||
        (name(p.name) && name(x.name) === name(p.name))),
  );
}
