/** UI contract only. No database client, persistent storage or Auth mutations. */
export type ContractType = "clt" | "intern" | "pj";
export type Engagement = {
  id: string;
  type: ContractType;
  start: string;
  end?: string;
  position: string;
  department: string;
  unit: string;
  leader: string;
  detail: string;
};
export type HistoryEvent = {
  id: string;
  date: string;
  title: string;
  description: string;
  origin: "fixture" | "simulation";
};
export type Person = {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  displayName: string;
  email: string;
  phone: string;
  access: "none" | "enabled" | "revoked" | "exception";
  engagements: Engagement[];
  history: HistoryEvent[];
};
export type PersonDraft = {
  name: string;
  displayName: string;
  email: string;
  phone: string;
  type: ContractType;
  start: string;
  position: string;
  department: string;
  unit: string;
  leader: string;
  detail: string;
};
export const contractNames: Record<ContractType, string> = {
  clt: "CLT",
  intern: "Estágio",
  pj: "Prestação PJ",
};
export const departments = [
  "Arquitetura",
  "Engenharia",
  "Gente & Gestão",
  "Operações",
  "Administrativo",
];
export const units = ["Sede", "Escritório de projetos", "Operação externa"];
export const DEMO_DATE = "2026-11-13";
export const peoplePath = "/gente-gestao/pessoas";
export const currentEngagement = (person: Person, at = DEMO_DATE) =>
  person.engagements.find((e) => e.start <= at && (!e.end || e.end >= at));
export function personStatus(person: Person) {
  if (currentEngagement(person)) return "Vigente";
  if (person.engagements.some((e) => e.start > DEMO_DATE)) return "Programado";
  return "Encerrado";
}
export function formatDate(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T12:00:00Z`),
  );
}
export const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
export function filterPeople(
  people: Person[],
  organizationId: string,
  filters: { search: string; department: string; type: string; status: string },
) {
  return people.filter((person) => {
    if (person.organizationId !== organizationId) return false;
    const engagement = currentEngagement(person) ?? person.engagements.at(-1);
    return (
      normalize(person.name).includes(normalize(filters.search)) &&
      (!filters.department || engagement?.department === filters.department) &&
      (!filters.type || engagement?.type === filters.type) &&
      (!filters.status || personStatus(person) === filters.status)
    );
  });
}
export type DraftErrors = Partial<Record<keyof PersonDraft | "form", string>>;
function validDate(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}
export function validateDraft(draft: PersonDraft): DraftErrors {
  const errors: DraftErrors = {};
  if (draft.name.trim().length < 3)
    errors.name = "Informe o nome completo, com pelo menos 3 caracteres.";
  if (!validDate(draft.start))
    errors.start = "Informe uma data de início válida.";
  if (!draft.position.trim())
    errors.position = "Informe o cargo ou a função contratada.";
  if (!departments.includes(draft.department))
    errors.department = "Selecione um setor da lista.";
  if (!units.includes(draft.unit))
    errors.unit = "Selecione uma unidade da lista.";
  if (!Object.hasOwn(contractNames, draft.type))
    errors.type = "Selecione um tipo de vínculo válido.";
  if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email))
    errors.email = "Informe um e-mail profissional válido ou deixe em branco.";
  if (draft.phone && !/^[\d\s()+-]{8,24}$/.test(draft.phone))
    errors.phone = "Informe um telefone válido ou deixe em branco.";
  for (const field of [
    "name",
    "displayName",
    "position",
    "leader",
    "email",
  ] as const) {
    if (draft[field].length > 160) errors[field] = "Use até 160 caracteres.";
  }
  if (draft.detail.length > 300) errors.detail = "Use até 300 caracteres.";
  return errors;
}
export function draftFromPerson(person?: Person): PersonDraft {
  const e = person && (currentEngagement(person) ?? person.engagements.at(-1));
  return {
    name: person?.name ?? "",
    displayName: person?.displayName ?? "",
    email: person?.email ?? "",
    phone: person?.phone ?? "",
    type: e?.type ?? "clt",
    start: e?.start ?? "",
    position: e?.position ?? "",
    department: e?.department ?? "",
    unit: e?.unit ?? "",
    leader: e?.leader ?? "",
    detail: e?.detail ?? "",
  };
}
/** Inclusive contractual periods must never overlap, including scheduled ones. */
export function hasOverlap(engagements: Engagement[], candidate: Engagement) {
  return engagements.some(
    (e) =>
      e.id !== candidate.id &&
      e.start <= (candidate.end ?? "9999-12-31") &&
      candidate.start <= (e.end ?? "9999-12-31"),
  );
}
export type SaveResult = { person: Person } | { errors: DraftErrors };
export function simulateSave(
  people: Person[],
  organizationId: string,
  draft: PersonDraft,
  id: string,
  existingId?: string,
): SaveResult {
  const errors = validateDraft(draft);
  const existing = existingId
    ? people.find(
        (p) => p.id === existingId && p.organizationId === organizationId,
      )
    : undefined;
  if (existingId && !existing)
    return { errors: { form: "Ficha indisponível nesta organização." } };
  if (Object.keys(errors).length) return { errors };
  const e =
    existing && (currentEngagement(existing) ?? existing.engagements.at(-1));
  if (existing && !currentEngagement(existing))
    return {
      errors: {
        form: "Vínculos encerrados ou programados não podem ser editados nesta demonstração.",
      },
    };
  if (e && (e.type !== draft.type || e.start !== draft.start))
    return {
      errors: {
        form: "Tipo e início do vínculo são preservados. Reingresso deve gerar outro vínculo em uma etapa futura.",
      },
    };
  const candidate: Engagement = {
    id: e?.id ?? `${id}-v1`,
    type: draft.type,
    start: draft.start,
    position: draft.position.trim(),
    department: draft.department,
    unit: draft.unit,
    leader: draft.leader.trim(),
    detail: draft.detail.trim(),
  };
  if (hasOverlap(existing?.engagements ?? [], candidate))
    return {
      errors: {
        form: "Já existe um vínculo nesse período. É permitido apenas um vínculo ativo por organização.",
      },
    };
  const events: HistoryEvent[] = [];
  const addEvent = (title: string, description: string) =>
    events.push({
      id: `${id}-${events.length}`,
      date: DEMO_DATE,
      title,
      description,
      origin: "simulation",
    });
  if (!existing)
    addEvent(
      draft.start > DEMO_DATE ? "Vínculo programado" : "Início do vínculo",
      `${contractNames[draft.type]} · ${draft.position.trim()}`,
    );
  else {
    for (const [field, label] of [
      ["department", "Alteração de setor"],
      ["position", "Alteração de cargo ou função"],
      ["leader", "Alteração de liderança"],
      ["unit", "Alteração de unidade"],
    ] as const) {
      if (e?.[field] !== candidate[field])
        addEvent(
          label,
          `${e?.[field] || "Não informado"} → ${candidate[field] || "Não informado"}`,
        );
    }
    addEvent(
      "Edição cadastral simulada",
      "Alterações aplicadas somente à sessão de demonstração.",
    );
  }
  return {
    person: {
      id: existing?.id ?? id,
      organizationId,
      code: existing?.code ?? `DEMO-${id.slice(-6).toUpperCase()}`,
      name: draft.name.trim(),
      displayName: draft.displayName.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      access: existing?.access ?? "none",
      engagements: existing
        ? existing.engagements.map((item) =>
            item.id === e?.id ? candidate : item,
          )
        : [candidate],
      history: [...(existing?.history ?? []), ...events],
    },
  };
}
