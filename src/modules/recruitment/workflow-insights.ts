import { type State, funnelConversion } from "./model";
import { type PipelineStage, type WorkflowFilters } from "./workflow-types";
import { dateNow } from "../career/model";
import { normalized } from "./workflow-model";
export const daysBetween = (start: string, end = dateNow()) =>
  Math.max(0, Math.floor((Date.parse(end) - Date.parse(start)) / 86400000));
export function vacancyStats(s: State, id: string) {
  const j = s.jobs.find((j) => j.id === id)!;
  const hires = s.employments!.filter((e) => e.job === id);
  return {
    hires,
    remaining: Math.max(0, j.positions - hires.length),
    days: daysBetween(j.created, j.filledAt ?? dateNow()),
    average: hires.length
      ? Math.round(
          hires.reduce((n, e) => n + daysBetween(j.created, e.confirmedAt), 0) /
            hires.length,
        )
      : null,
  };
}
export function recruitmentInsights(
  s: State,
  f: WorkflowFilters,
  today = dateNow(),
) {
  const apps = s.applications.filter((a) => {
    const p = s.candidates.find((p) => p.id === a.candidate);
    return (
      (!f.from || a.created >= f.from) &&
      (!f.until || a.created <= f.until) &&
      (!f.sector || a.sector === f.sector) &&
      (!f.job || a.job === f.job) &&
      (!f.contract || a.contract === f.contract) &&
      (!f.origin || normalized(p?.source ?? "").includes(normalized(f.origin)))
    );
  });
  const ids = new Set(apps.map((a) => a.id)),
    hires = s.employments!.filter((e) => ids.has(e.application)),
    offers = s.offers.filter((o) => ids.has(o.application)),
    resolved = offers.filter((o) => ["Aceita", "Recusada"].includes(o.state));
  const count = (xs: string[]) =>
    Object.entries(
      xs.reduce<Record<string, number>>(
        (out, key) => ({
          ...out,
          [key || "Não informado"]: (out[key || "Não informado"] ?? 0) + 1,
        }),
        {},
      ),
    );
  const stages = [...s.central!.stages];
  for (const a of apps)
    for (const snapshot of a.stages) {
      if (!stages.some((st) => st.id === snapshot.id))
        stages.push({
          ...snapshot,
          color: (snapshot as PipelineStage).color ?? "#64748b",
          kind: (snapshot as PipelineStage).kind ?? "normal",
          name: snapshot.name + " (histórico)",
        });
    }
  const kindOf = (a: State["applications"][number], id = a.stage) =>
    (a.stages.find((st) => st.id === id) as PipelineStage | undefined)?.kind ??
    s.central!.stages.find((st) => st.id === id)?.kind;
  const funnel = stages.map((st, i, all) => {
    const passed = apps.filter((a) => a.visits.some((v) => v.stage === st.id));
    const previous = all[i - 1];
    const conversion = funnelConversion(apps, st.id, previous?.id);
    const spans = apps.flatMap((a) =>
      a.visits.flatMap((v, index) =>
        v.stage === st.id
          ? [
              daysBetween(
                v.at,
                a.visits[index + 1]?.at ?? today + "T23:59:59-03:00",
              ),
            ]
          : [],
      ),
    );
    return {
      ...st,
      count: passed.length,
      skipped: previous
        ? passed.filter((a) => !a.visits.some((v) => v.stage === previous.id))
            .length
        : 0,
      conversion,
      average: spans.length
        ? Math.round(spans.reduce((n, x) => n + x, 0) / spans.length)
        : null,
    };
  });
  const sources = count(
    apps.map(
      (a) => s.candidates.find((p) => p.id === a.candidate)?.source ?? "",
    ),
  );
  const jobs = s.jobs.filter(
    (j) =>
      (!f.sector || j.sector === f.sector) &&
      (!f.job || j.id === f.job) &&
      (!f.contract || j.contract === f.contract),
  );
  const costJobs = jobs.filter((j) => hires.some((e) => e.job === j.id));
  const cost =
    hires.length &&
    costJobs.length &&
    costJobs.every((j) => j.cost !== undefined)
      ? Math.round(
          costJobs.reduce((n, j) => n + (j.cost ?? 0), 0) / hires.length,
        )
      : null;
  return {
    apps,
    hires,
    jobs,
    funnel,
    sources,
    cost,
    qualified: apps.filter((a) =>
      a.visits.some((v) => kindOf(a, v.stage) === "qualified"),
    ).length,
    acceptance: resolved.length
      ? Math.round(
          (resolved.filter((o) => o.state === "Aceita").length /
            resolved.length) *
            100,
        )
      : null,
    declines: count(
      apps.filter((a) => kindOf(a) === "declined").map((a) => a.reason ?? ""),
    ),
    rejections: count(
      apps
        .filter((a) => ["rejected", "disqualified"].includes(kindOf(a) ?? ""))
        .map((a) => a.reason ?? ""),
    ),
    sectors: count(
      hires.map((e) => apps.find((a) => a.id === e.application)?.sector ?? ""),
    ),
    contracts: count(hires.map((e) => e.contract)),
    bankHires: hires.filter(
      (e) => apps.find((a) => a.id === e.application)?.fromBank,
    ).length,
    earlyExits: hires.filter((e) => e.end && daysBetween(e.start, e.end) <= 90)
      .length,
    retention: [30, 60, 90].map((days) => {
      const cohort = hires.filter((e) => daysBetween(e.start, today) >= days);
      return {
        days,
        total: cohort.length,
        retained: cohort.filter(
          (e) => !e.end || daysBetween(e.start, e.end) >= days,
        ).length,
      };
    }),
    effectiveness: sources.map(([source, total]) => ({
      source,
      total,
      hired: hires.filter((e) => e.origin === source).length,
    })),
  };
}
