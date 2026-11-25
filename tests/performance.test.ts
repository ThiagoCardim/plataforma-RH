import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { type Scope, uid } from "@/modules/career/model";
import { demoPerformance } from "@/modules/performance/fixtures";
import {
  projection,
  hallProjection,
  mayEvaluate,
  compatible,
  score,
  criterionResult,
  saveTemplate,
  createEvaluation,
  saveEvaluation,
  reviewEvaluation,
  releaseEvaluation,
  saveCycle,
  saveResponsibility,
  materialize,
  stopResponsibility,
  completeOccurrence,
  addDiary,
  consolidate,
} from "@/modules/performance/model";
import { linkEvaluation } from "@/modules/development-links/model";
const rh: Scope = {
  user: "rh-test",
  name: "RH fictício",
  org: "org-a",
  rh: true,
  director: false,
  leader: false,
  contract: "CLT",
  key: "rh-key",
};
const leader = {
  ...rh,
  user: "lead-test",
  name: "Líder fictício",
  rh: false,
  leader: true,
  key: "lead-key",
};
const employee = {
  ...rh,
  user: "professional-test",
  rh: false,
  key: "pro-key",
};
const director = {
  ...rh,
  user: "director-test",
  rh: false,
  director: true,
  key: "dir-key",
};
const state = () => demoPerformance(rh);
const target = "evaluation-career-person-2-Operacional";
const responsibility = (
  frequency: "Semanal" | "Quinzenal" | "Mensal" | "Personalizada",
  start = "2026-01-01",
  end = "2026-02-01",
  interval = 7,
) => ({
  id: uid(),
  person: "career-person-10",
  name: "Revisar prioridades de entregas",
  start,
  end,
  frequency,
  interval,
  criterion: "Remover impedimentos e orientar equipe",
});
describe("Evaluation privacy, context and immutable criteria", () => {
  it("keeps professionals limited to own finalized/released evaluations", () => {
    const s = demoPerformance(employee);
    expect(s.evaluations.length).toBeGreaterThan(0);
    expect(
      s.evaluations.every(
        (e) =>
          e.status === "Publicada" &&
          s.people.find((p) => p.id === e.person)?.user === employee.user,
      ),
    ).toBe(true);
    expect(s.templates).toEqual([]);
    expect(s.diary).toEqual([]);
  });
  it("projects leaders to assigned people in their own sector and hides leadership diaries", () => {
    const s = demoPerformance(leader),
      own = s.people.find((p) => p.user === leader.user)!;
    expect(
      s.evaluations.every((e) => {
        const p = s.people.find((p) => p.id === e.person)!;
        return p.user === leader.user
          ? e.status === "Publicada"
          : p.sector === own.sector && p.leader === leader.user && !p.isLeader;
      }),
    ).toBe(true);
    expect(s.diary).toEqual([]);
    expect(s.responsibilities).toEqual([]);
    expect(s.templates.every((t) => t.kind !== "Liderança")).toBe(true);
  });
  it("removes internal evaluations entirely from public Hall payloads, including PJ", () => {
    for (const c of [
      employee,
      leader,
      { ...employee, contract: "PJ" as const },
    ]) {
      const s = hallProjection(demoPerformance(c), c);
      expect(s.evaluations).toEqual([]);
      expect(s.templates).toEqual([]);
      expect(s.diary).toEqual([]);
      expect(
        s.awards.every(
          (a) => a.status === "Publicado" && !a.source && !a.events.length,
        ),
      ).toBe(true);
      expect(JSON.stringify(s)).not.toContain("Registro reservado fictício");
    }
  });
  it("PJ has no own internal evaluations or behavioral participation", () => {
    const pj = { ...employee, contract: "PJ" as const },
      s = demoPerformance(pj);
    expect(s.evaluations).toEqual([]);
    const a = state(),
      p = a.people.find((p) => p.contract === "PJ")!;
    expect(
      compatible(
        a.templates.find((t) => t.kind === "Comportamental")!,
        p,
      ),
    ).toBe(false);
    expect(
      a.evaluations
        .filter(
          (e) => a.people.find((p) => p.id === e.person)?.contract === "PJ",
        )
        .every((e) => e.template.kind === "Operacional"),
    ).toBe(true);
  });
  it("rejects foreign organizations and write attempts by employees", () => {
    expect(() => projection(state(), { ...employee, org: "org-b" })).toThrow(
      "Organização",
    );
    expect(() =>
      saveCycle(state(), employee, {
        id: "x",
        name: "Teste",
        start: "2026-01-01",
        end: "2026-02-01",
        state: "Aberto",
      }),
    ).toThrow("RH");
    expect(() =>
      addDiary(state(), leader, {
        person: "career-person-10",
        date: "2026-01-01",
        type: "Diário confidencial",
        text: "Sem autorização",
      }),
    ).toThrow("exclusiva");
  });
  it("does not allow leaders to evaluate across sectors, another team, themselves or leadership", () => {
    const s = demoPerformance(leader);
    expect(
      mayEvaluate(
        s,
        leader,
        s.people.find((p) => p.id === "career-person-1")!,
        "Operacional",
      ),
    ).toBe(false);
    expect(
      mayEvaluate(
        s,
        leader,
        s.people.find((p) => p.user === leader.user)!,
        "Operacional",
      ),
    ).toBe(false);
    expect(
      mayEvaluate(
        s,
        leader,
        s.people.find((p) => p.id === "career-person-2")!,
        "Operacional",
      ),
    ).toBe(true);
    expect(
      mayEvaluate(
        s,
        leader,
        s.people.find((p) => p.id === "career-person-2")!,
        "Liderança",
      ),
    ).toBe(false);
  });
  it("supports distinct Revenue marketing and commercial delivery expectations", () => {
    const s = state(),
      ts = s.templates.filter((t) => t.sector === "revenue");
    expect(ts.some((t) => t.functionId === "marketing")).toBe(true);
    expect(ts.some((t) => t.functionId === "sales")).toBe(true);
    expect(
      ts.find((t) => t.functionId === "marketing")!.criteria[0].target,
    ).not.toBe(ts.find((t) => t.functionId === "sales")!.criteria[0].target);
  });
  it("creates independent model versions and preserves previous evaluation snapshots", () => {
    const s = state(),
      t = s.templates[0],
      snap = structuredClone(s.evaluations);
    const changed = saveTemplate(s, rh, {
      ...t,
      name: "Modelo revisado local",
      criteria: t.criteria.map((x) => ({ ...x, weight: 2, target: 20 })),
    });
    expect(changed.templates.find((x) => x.id === t.id)?.version).toBe(2);
    expect(changed.evaluations).toEqual(snap);
    const duplicate = saveTemplate(changed, rh, {
      ...t,
      id: "copy",
      name: "Cópia",
    });
    expect(duplicate.templates.find((x) => x.id === "copy")?.version).toBe(1);
  });
  it("prevents PJ cultural models, invalid operational dimensions and invalid weights", () => {
    const s = state(),
      t = s.templates[0];
    expect(() =>
      saveTemplate(s, rh, { ...t, kind: "Comportamental", contracts: ["PJ"] }),
    ).toThrow("PJ");
    expect(() =>
      saveTemplate(s, rh, {
        ...t,
        criteria: [{ ...t.criteria[0], dimension: "Jornada" }],
      }),
    ).toThrow("dimensão");
    expect(() =>
      saveTemplate(s, rh, {
        ...t,
        criteria: [{ ...t.criteria[0], weight: NaN }],
      }),
    ).toThrow("peso");
    expect(() => saveTemplate(s, director, t)).toThrow("RH");
  });
  it("excludes not-observed criteria instead of assigning zero; all not-observed is null", () => {
    const e = structuredClone(
      state().evaluations.find((e) => e.template.kind === "Comportamental")!,
    );
    e.answers = e.answers.map((a, i) => ({
      ...a,
      value: i === 0 ? e.template.max : null,
    }));
    expect(score(e)).toBe(100);
    e.answers[0].value = null;
    expect(score(e)).toBeNull();
  });
  it("normalizes target fulfillment and supports lower-is-better without comparing volumes", () => {
    const t = state().templates[0],
      c = { ...t.criteria[0], target: 10 };
    const a = { criterion: c.id, value: 5, justification: "", evidence: "" };
    expect(criterionResult(t, a, c)).toBe(50);
    expect(
      criterionResult(
        t,
        { ...a, value: 20 },
        { ...c, direction: "Menor é melhor" },
      ),
    ).toBe(50);
    expect(
      criterionResult(
        t,
        { ...a, value: 0 },
        { ...c, direction: "Menor é melhor" },
      ),
    ).toBe(100);
  });
  it("requires contextual explanations and evidence when submitting a draft", () => {
    const s = state(),
      e = s.evaluations.find(
        (e) => e.person === "career-person-3" && e.status === "Rascunho",
      )!;
    expect(() =>
      saveEvaluation(
        s,
        rh,
        e.id,
        e.answers.map((a) => ({ ...a, justification: "" })),
        true,
      ),
    ).toThrow("Explique");
    expect(
      saveEvaluation(
        s,
        rh,
        e.id,
        e.answers.map((a) => ({
          ...a,
          value: null,
          justification: "Não houve situação observável.",
          evidence: "",
        })),
        true,
      ).evaluations.find((x) => x.id === e.id)?.status,
    ).toBe("Em validação");
  });
  it("requires RH review and an explicit separate publication, without self-approval", () => {
    let s = state();
    expect(() => releaseEvaluation(s, rh, target)).toThrow("validação");
    s = reviewEvaluation(
      s,
      rh,
      target,
      true,
      "Entregas conferidas em contexto.",
    );
    expect(s.evaluations.find((e) => e.id === target)?.status).toBe("Validada");
    expect(() =>
      reviewEvaluation(state(), director, target, true, "Parecer"),
    ).toThrow("RH");
    const e = state().evaluations.find((e) => e.id === target)!;
    expect(() =>
      reviewEvaluation(
        state(),
        { ...rh, user: e.author },
        target,
        true,
        "Parecer",
      ),
    ).toThrow("autoaprovação");
    expect(() =>
      reviewEvaluation(
        state(),
        { ...rh, user: "career-user-2" },
        target,
        true,
        "Parecer",
      ),
    ).toThrow("autoaprovação");
    s = releaseEvaluation(s, director, target);
    expect(s.evaluations.find((e) => e.id === target)?.status).toBe(
      "Publicada",
    );
    expect(() => releaseEvaluation(s, director, target)).toThrow("validação");
  });
  it("copies a model on creation, blocks duplicates and keeps cycle periods stable", () => {
    let s = state();
    const cy = {
      id: "cycle-new",
      name: "Ciclo de teste",
      start: "2026-01-01",
      end: "2026-12-31",
      state: "Aberto" as const,
    };
    s = saveCycle(s, rh, cy);
    const t = s.templates.find((t) => t.id === "op-architecture-analyst")!;
    s = createEvaluation(s, rh, "career-person-2", t.id, cy.id);
    expect(() =>
      createEvaluation(s, rh, "career-person-2", t.id, cy.id),
    ).toThrow("Já existe");
    expect(() => saveCycle(s, rh, { ...cy, end: "2026-11-30" })).toThrow(
      "vigência",
    );
    const snap = structuredClone(s.evaluations[0].template);
    s = saveTemplate(s, rh, { ...t, name: "Alteração posterior" });
    expect(s.evaluations[0].template).toEqual(snap);
  });
});
describe("Leadership recurrence and confidential consolidation", () => {
  it.each([
    ["Semanal", 5],
    ["Quinzenal", 3],
    ["Personalizada", 5],
  ] as const)(
    "generates %s occurrences once, with deterministic IDs",
    (frequency, count) => {
      const s = saveResponsibility(state(), rh, responsibility(frequency));
      const id = s.responsibilities.at(-1)!.id;
      expect(s.occurrences.filter((o) => o.responsibility === id)).toHaveLength(
        count,
      );
      expect(materialize(s).occurrences).toEqual(s.occurrences);
    },
  );
  it("preserves monthly anchor dates across short months and leap years", () => {
    const r = responsibility("Mensal", "2024-01-31", "2024-04-30"),
      s = saveResponsibility(state(), rh, r);
    expect(
      s.occurrences.filter((o) => o.responsibility === r.id).map((o) => o.due),
    ).toEqual(["2024-01-31", "2024-02-29", "2024-03-31", "2024-04-30"]);
  });
  it("keeps past evidence and cancels future occurrences without regeneration", () => {
    const r = responsibility("Semanal"),
      a = saveResponsibility(state(), rh, r),
      items = a.occurrences.filter((o) => o.responsibility === r.id);
    let s = completeOccurrence(
      a,
      rh,
      items[0].id,
      true,
      "Revisão fictícia concluída.",
      "Conversa registrada.",
    );
    s = stopResponsibility(s, rh, r.id, "2026-01-10");
    expect(s.occurrences.find((o) => o.id === items[0].id)?.done).toBe(true);
    expect(
      s.occurrences
        .filter((o) => o.responsibility === r.id && o.due > "2026-01-10")
        .every((o) => o.cancelled),
    ).toBe(true);
    expect(materialize(s).occurrences).toEqual(s.occurrences);
    expect(() =>
      completeOccurrence(s, rh, items.at(-1)!.id, true, "Tentativa", ""),
    ).toThrow("cancelada");
  });
  it("requires completion evidence and restricts diaries to management", () => {
    const s = state(),
      o = s.occurrences.find((o) => !o.done)!;
    expect(() => completeOccurrence(s, rh, o.id, true, "", "")).toThrow(
      "evidência",
    );
    expect(() =>
      completeOccurrence(s, leader, o.id, true, "Entrega", ""),
    ).toThrow("exclusiva");
    const changed = addDiary(s, director, {
      person: "career-person-10",
      date: "2026-11-25",
      text: "Marcador privado de teste",
      type: "Feedback",
    });
    expect(JSON.stringify(projection(changed, employee))).not.toContain(
      "Marcador privado",
    );
  });
  it("consolidates evidence in a draft without setting scores, publishing or exposing the diary", () => {
    const s = state(),
      e = s.evaluations.find(
        (e) => e.person === "career-person-10" && e.status === "Rascunho",
      )!;
    const next = consolidate(s, rh, e.id),
      result = next.evaluations.find((x) => x.id === e.id)!;
    expect(result.status).toBe("Rascunho");
    expect(result.answers).toEqual(e.answers);
    expect(result.consolidation).toContain("Diário restrito");
    expect(
      projection(next, employee).evaluations.some((x) => x.consolidation),
    ).toBe(false);
  });
});
describe("Manual development evidence links", () => {
  it("links finalized results as references without changing PDI, career or the source", () => {
    const s = state(),
      e = s.evaluations.find(
        (e) => e.status === "Publicada" && e.person === "career-person-1",
      )!,
      before = structuredClone(s);
    const ref = linkEvaluation(
      s,
      rh,
      e.id,
      "pdi",
      "pdi-demo-career-person-1",
      "Aprendizado para acompanhamento.",
    );
    expect(ref.source).toBe(e.id);
    expect(s).toEqual(before);
    expect(() =>
      linkEvaluation(
        s,
        employee,
        e.id,
        "recognition",
        "cycle",
        "Sem permissão",
      ),
    ).toThrow("escopo");
  });
  it("blocks draft links, cross-organization links and PJ PDI participation", () => {
    const s = state(),
      draft = s.evaluations.find((e) => e.status === "Rascunho")!,
      pj = s.evaluations.find(
        (e) =>
          s.people.find((p) => p.id === e.person)?.contract === "PJ" &&
          e.status === "Publicada",
      )!;
    expect(() => linkEvaluation(s, rh, draft.id, "pdi", "x", "Teste")).toThrow(
      "finalizada",
    );
    expect(() =>
      linkEvaluation(
        s,
        { ...rh, org: "org-b" },
        pj.id,
        "recognition",
        "x",
        "Teste",
      ),
    ).toThrow("finalizada");
    expect(() => linkEvaluation(s, rh, pj.id, "pdi", "x", "Teste")).toThrow(
      "PJ",
    );
    expect(
      linkEvaluation(
        s,
        rh,
        pj.id,
        "recognition",
        "cycle",
        "Excelência dos serviços prestados.",
      ).target,
    ).toBe("recognition");
  });
});
