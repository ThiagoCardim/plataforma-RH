import "server-only";
import { type Scope, dateNow } from "../career/model";
import { recruitmentFixture } from "./fixtures";
import { upgradeWorkflow, projectWorkflow } from "./workflow-model";
export function demoWorkflow(c: Scope) {
  const s = upgradeWorkflow(recruitmentFixture(c), c);
  s.jobs = s.jobs.map((j) => ({
    ...j,
    hiringReason: "Expansão",
    desiredLevel: "A confirmar",
  }));
  s.applications = s.applications.map((a, i) => {
    const st = s.central!.stages[i === 1 ? 9 : i === 2 ? 2 : i === 3 ? 7 : 0];
    return {
      ...a,
      stage: st.id,
      status: st.kind === "bank" ? "Encerrada" : "Ativa",
      entered: dateNow(),
      visits: [...a.visits, { stage: st.id, at: new Date().toISOString() }],
    };
  });
  s.candidates = s.candidates.map((p, i) => ({
    ...p,
    experience: [
      "Júnior: até 3 anos de experiência",
      "Pleno: de 4 a 6 anos de experiência",
      "Estudante: cursando ensino médio ou superior",
      "Sênior: 7 anos ou mais de experiência",
    ][i % 4],
  }));
  return projectWorkflow(s, c);
}
