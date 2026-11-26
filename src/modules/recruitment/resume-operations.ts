import { type State, guard } from "./model";
import { type Scope, assert, dateNow } from "../career/model";
import {
  intakeCandidate,
  currentCycles,
  reactivateCycle,
  workflowErase,
} from "./workflow-model";
export function startResumeProcess(
  s: State,
  c: Scope,
  id: string,
  reason: string,
): State {
  guard(s, c, "hr");
  const p = s.candidates.find((p) => p.id === id && !p.erased && !p.mergedInto);
  assert(
    p && reason.trim() && p.retentionUntil >= dateNow(),
    "Informe motivo e cadastro com finalidade/retenção vigentes.",
  );
  assert(
    !currentCycles(s).some((a) => a.candidate === id && a.status === "Ativa"),
    "Já existe processo operacional ativo. Consulte a ficha antes de abrir outra oportunidade.",
  );
  const previous = s.applications
    .filter((a) => a.candidate === id)
    .sort((a, b) => b.created.localeCompare(a.created))[0];
  const next = previous
    ? reactivateCycle(s, c, previous.id, reason)
    : intakeCandidate(s, c, p);
  return {
    ...next,
    applications: next.applications.map((a) =>
      a.candidate === id && !s.applications.some((old) => old.id === a.id)
        ? { ...a, fromBank: true }
        : a,
    ),
  };
}
export function eraseResumeData(
  s: State,
  c: Scope,
  id: string,
  reason: string,
): State {
  guard(s, c, "hr");
  const ids = new Set([
    id,
    ...s.candidates.filter((p) => p.mergedInto === id).map((p) => p.id),
  ]);
  let next = s;
  for (const key of ids)
    if (!next.candidates.find((p) => p.id === key)?.erased)
      next = workflowErase(next, c, key, reason);
  return {
    ...next,
    candidates: next.candidates.map((p) =>
      ids.has(p.id)
        ? {
            ...p,
            talent: undefined,
            availabilityStatus: undefined,
            resumeUpdated: undefined,
            lastContact: undefined,
          }
        : p,
    ),
    applications: next.applications.map((a) =>
      ids.has(a.candidate) && a.archived
        ? { ...a, archived: { ...a.archived, reason: "Registro anonimizado" } }
        : a,
    ),
    resumeHistory: next.resumeHistory?.map((h) =>
      ids.has(h.candidate)
        ? { ...h, profile: {}, receivedForm: undefined, purged: true }
        : h,
    ),
    resumeContacts: next.resumeContacts?.filter((r) => !ids.has(r.candidate)),
    resumeRequests: next.resumeRequests?.filter((r) => !ids.has(r.candidate)),
    duplicateReviews: next.duplicateReviews?.filter(
      (r) =>
        !ids.has(r.left) &&
        !ids.has(r.right ?? "") &&
        !r.matches.some((id) => ids.has(id)),
    ),
  };
}
