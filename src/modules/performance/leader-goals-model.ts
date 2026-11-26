import {
  type Scope,
  admin,
  assert,
  uid,
  dateNow,
  validDate,
} from "../career/model";
import { type PerformanceState } from "./model";
export type LeaderGoal = {
  id: string;
  name: string;
  description: string;
  kind: "Geral" | "Individual";
  leaders: string[];
  frequency: "Semanal" | "Quinzenal" | "Mensal";
  quantity: number;
  weight: number;
  evidence: boolean;
  start: string;
  end: string;
};
export function initialLeaderGoals(s: PerformanceState): LeaderGoal[] {
  const leaders = s.people
    .filter((p) => p.isLeader && p.contract !== "PJ")
    .map((p) => p.id);
  return (
    s.leaderGoals ??
    (leaders.length
      ? [
          {
            id: "goal-demo-alignment",
            name: "Alinhamento de prioridades",
            description:
              "Exemplo fictício: revisar prioridades, combinar entregas e identificar impedimentos da equipe.",
            kind: "Geral",
            leaders,
            frequency: "Semanal",
            quantity: 1,
            weight: 1,
            evidence: true,
            start: dateNow().slice(0, 4) + "-01-01",
            end: dateNow().slice(0, 4) + "-12-31",
          },
        ]
      : [])
  );
}
export function newLeaderGoal(): LeaderGoal {
  return {
    id: uid(),
    name: "",
    description: "",
    kind: "Individual",
    leaders: [],
    frequency: "Mensal",
    quantity: 1,
    weight: 1,
    evidence: false,
    start: dateNow(),
    end: dateNow().slice(0, 4) + "-12-31",
  };
}
export function saveLeaderGoal(
  s: PerformanceState,
  c: Scope,
  g: LeaderGoal,
): PerformanceState {
  assert(
    s.org === c.org && admin(c),
    "Somente RH e Diretoria podem configurar metas na organização autorizada.",
  );
  assert(g.name.trim() && g.description.trim(), "Preencha nome e descrição.");
  assert(
    ["Geral", "Individual"].includes(g.kind) &&
      ["Semanal", "Quinzenal", "Mensal"].includes(g.frequency),
    "Tipo ou frequência inválidos.",
  );
  assert(
    Number.isFinite(g.quantity) &&
      g.quantity > 0 &&
      Number.isFinite(g.weight) &&
      g.weight > 0,
    "Quantidade esperada e peso devem ser positivos.",
  );
  assert(
    validDate(g.start) && validDate(g.end) && g.start <= g.end,
    "Informe uma vigência válida, com início anterior ao fim.",
  );
  assert(
    g.leaders.length > 0 &&
      new Set(g.leaders).size === g.leaders.length &&
      g.leaders.every((id) =>
        s.people.some(
          (p) =>
            p.id === id && p.org === c.org && p.isLeader && p.contract !== "PJ",
        ),
      ),
    "Selecione líderes válidos da organização.",
  );
  return {
    ...s,
    leaderGoals: [
      ...initialLeaderGoals(s).filter((x) => x.id !== g.id),
      structuredClone({
        ...g,
        name: g.name.trim(),
        description: g.description.trim(),
      }),
    ],
  };
}
export function deleteLeaderGoal(
  s: PerformanceState,
  c: Scope,
  id: string,
): PerformanceState {
  assert(s.org === c.org && admin(c), "Gestão restrita ao RH e Diretoria.");
  return {
    ...s,
    leaderGoals: initialLeaderGoals(s).filter((g) => g.id !== id),
  };
}
