import "server-only";
import { openDuplicateReview } from "./resume-model";
import { type Scope, dateNow } from "../career/model";
import { demoWorkflow } from "./workflow-fixtures";
import { upgradeResumeDatabase, projectResumeDatabase } from "./resume-model";
export function demoResumeDatabase(c: Scope) {
  const base = demoWorkflow(c),
    day = (n: number) =>
      new Date(Date.parse(dateNow() + "T12:00:00Z") + n * 86400000)
        .toISOString()
        .slice(0, 10);
  base.candidates = base.candidates.map((p, i) => ({
    ...p,
    resumeUpdated: day(-[20, 140, 230, 400, 30, 60, 200, 500][i % 8]),
  }));
  const ref = base.candidates[0];
  if (c.rh && ref) {
    base.candidates.push({
      ...structuredClone(ref),
      id: "resume-only-demo",
      name: "Nina Currículo Demo",
      email: "nina-cv@exemplo.invalid",
      phone: "(00) 91111-1111",
      source: "Pipefy · origem 1 (exemplo fictício)",
      resumeUpdated: day(-410),
      created: day(-500),
      availabilityStatus: "Empregado, mas aberto a propostas",
      cv: undefined,
    });
    base.candidates.push({
      ...structuredClone(ref),
      id: "resume-duplicate-demo",
      name: ref.name,
      email: "alex-alternativo@exemplo.invalid",
      city: "Campinas",
      source: "Pipefy · origem 2 (exemplo fictício)",
      cv: undefined,
    });
  }
  let s = upgradeResumeDatabase(base, c);
  if (c.rh && s.candidates.some((p) => p.id === "resume-duplicate-demo"))
    s = openDuplicateReview(s, c, "rec-candidate-0", "resume-duplicate-demo");
  return projectResumeDatabase(s, c);
}
