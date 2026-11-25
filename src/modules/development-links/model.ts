import { type Scope, admin, assert, uid } from "../career/model";
import { type PerformanceState } from "../performance/model";
export type EvaluationReference = {
  id: string;
  org: string;
  source: string;
  person: string;
  title: string;
  summary: string;
  target: "pdi" | "recognition";
  targetId: string;
  at: string;
  by: string;
};
export function linkEvaluation(
  s: PerformanceState,
  c: Scope,
  source: string,
  target: EvaluationReference["target"],
  targetId: string,
  summary: string,
): EvaluationReference {
  const e = s.evaluations.find((e) => e.id === source),
    p = s.people.find((p) => p.id === e?.person);
  assert(
    s.org === c.org && e && p && ["Validada", "Publicada"].includes(e.status),
    "Vincule somente uma avaliação finalizada e validada.",
  );
  assert(
    admin(c) ||
      (target === "pdi" &&
        c.leader &&
        p.leader === c.user &&
        p.sector === s.people.find((x) => x.user === c.user)?.sector),
    "Vínculo fora do escopo autorizado.",
  );
  assert(target !== "pdi" || p.contract !== "PJ", "PJ não participa de PDI.");
  assert(
    targetId && summary.trim(),
    "Selecione o destino e descreva o aprendizado ou evidência relevante.",
  );
  return {
    id: uid(),
    org: c.org,
    source,
    person: p.id,
    title: `${e.template.name} · ${e.cycle.name}`,
    summary,
    target,
    targetId,
    at: new Date().toISOString(),
    by: c.name,
  };
}
