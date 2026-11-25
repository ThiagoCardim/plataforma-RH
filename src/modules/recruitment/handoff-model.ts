import { type State, guard } from "./model";
import { type Scope, assert, dateNow, uid } from "../career/model";
import {
  type State as OnboardingState,
  compose,
  defaultDuration,
} from "../onboarding/model";
export function adoptOnboarding(
  target: OnboardingState,
  source: State,
  c: Scope,
  handoff: string,
): OnboardingState {
  guard(source, c, "hr");
  const h = source.handoffs.find((h) => h.id === handoff && h.org === c.org),
    a = source.applications.find((a) => a.id === h?.application),
    p = source.candidates.find((p) => p.id === h?.candidate && !p.erased);
  assert(
    h && a?.status === "Contratada" && p && h.fields.name,
    "Contratação formalizada e dados autorizados são necessários.",
  );
  if (target.processes.some((p) => p.sources.includes(h.id))) return target;
  const tracks = compose(target.templates, a.contract, a.sector, a.jobTitle);
  const id = h.id;
  return {
    ...target,
    processes: [
      {
        id,
        name: h.fields.name,
        user: `unlinked:${c.org}:${p.id}`,
        leader: a.assigned[0] ?? "fictional-unassigned",
        leaderName: "Liderança a confirmar",
        sector: a.sector,
        job: a.jobTitle,
        contract: a.contract,
        start: dateNow(),
        duration: defaultDuration(a.contract),
        column: target.columns[0].id,
        archived: false,
        sources: [h.id],
        institutional: tracks.institutional,
        technical: tracks.technical,
      },
      ...target.processes,
    ],
    events: [
      {
        id: uid(),
        at: new Date().toISOString(),
        actor: c.name,
        text: "Onboarding demonstrativo iniciado a partir de contratação confirmada pelo RH. Sem conta, vínculo ou revogação real.",
        process: id,
      },
      ...target.events,
    ],
  };
}
