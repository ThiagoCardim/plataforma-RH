import { type State, guard, ev } from "./model";
import { type Scope, assert, dateNow, uid, validDate } from "../career/model";
import {
  type State as JourneyState,
  type Process,
  type Termination,
  compose,
} from "../onboarding/model";
export function startRecruitmentOffboarding(
  target: JourneyState,
  source: State,
  c: Scope,
  employment: string,
  termination: Termination,
): JourneyState {
  guard(source, c, "hr");
  const e = source.employments?.find(
      (e) => e.id === employment && e.org === c.org && e.status === "Ativo",
    ),
    p = source.candidates.find((p) => p.id === e?.candidate && !p.erased),
    a = source.applications.find((a) => a.id === e?.application);
  assert(
    e && p && a,
    "Vínculo local ativo e cadastro disponíveis são obrigatórios.",
  );
  const ref = `recruitment-employment:${e.id}`;
  if (target.processes.some((p) => p.sources.includes(ref))) return target;
  const tracks = compose(
      target.templates,
      e.contract,
      a.sector,
      a.jobTitle,
      termination,
    ),
    id = uid();
  return {
    ...target,
    processes: [
      {
        id,
        name: p.name,
        user: `unlinked:${c.org}:${p.id}`,
        leader: a.assigned[0] ?? "fictional-unassigned",
        leaderName: "Liderança a confirmar",
        sector: a.sector,
        job: a.jobTitle,
        contract: e.contract,
        start: dateNow(),
        duration: 15,
        column: target.columns[0].id,
        archived: false,
        sources: [ref, ...tracks.sources],
        institutional: tracks.institutional,
        technical: tracks.technical,
        termination,
      },
      ...target.processes,
    ],
    events: [
      {
        id: uid(),
        at: new Date().toISOString(),
        actor: c.name,
        text: "Offboarding vinculado à contratação local. Vínculo segue ativo até confirmação explícita do RH.",
        process: id,
      },
      ...target.events,
    ],
  };
}
export function confirmRecruitmentExit(
  s: State,
  c: Scope,
  process: Process,
  end: string,
  confirmed: boolean,
): State {
  guard(s, c, "hr");
  const e = s.employments?.find(
    (e) =>
      process.sources.includes(`recruitment-employment:${e.id}`) &&
      e.org === c.org,
  );
  assert(
    e && confirmed && validDate(end) && end >= e.start && end <= dateNow(),
    "Confirme o encerramento demonstrativo e a data válida do vínculo.",
  );
  if (e.status === "Encerrado") {
    assert(
      e.offboarding === process.id,
      "Vínculo já encerrado em outro processo.",
    );
    return s;
  }
  assert(
    !process.archived,
    "Reabra o processo arquivado antes de confirmar a conclusão.",
  );
  assert(
    [...process.institutional, ...process.technical].every((st) =>
      st.tasks.every((t) => !t.required || t.done),
    ),
    "Conclua todas as atividades obrigatórias do Offboarding.",
  );
  const at = new Date().toISOString();
  return {
    ...s,
    employments: s.employments!.map((x) =>
      x.id === e.id
        ? {
            ...x,
            status: "Encerrado",
            end,
            exitConfirmedAt: at,
            offboarding: process.id,
          }
        : x,
    ),
    relationships: [
      ...s.relationships!,
      {
        id: uid(),
        candidate: e.candidate,
        application: e.application,
        kind: "Desligamento",
        at,
        by: c.name,
        text: `Encerramento ${process.termination ?? ""} confirmado em ${end}. Histórico de admissão preservado. Nenhuma revogação real.`,
      },
    ],
    events: [
      ...s.events,
      ev(
        c,
        "Offboarding concluído explicitamente; atualizado somente o vínculo demonstrativo local.",
      ),
    ],
  };
}
