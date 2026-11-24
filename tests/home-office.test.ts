import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { demoHomeOffice } from "@/modules/home-office/fixtures";
import {
  type Scope,
  type Payload,
  type Period,
  day,
  shift,
  weekday,
  key,
  occurrence,
  occurrences,
  blank,
  addAgreement,
  endAgreement,
  registerDay,
  approveDay,
  cancelOrSwap,
  saveReport,
  validatePayload,
  submissionStatus,
  reviewReport,
  reviewStatus,
  appendOwnNote,
  editRules,
  project,
  reportRows,
} from "@/modules/home-office/model";
const now = new Date("2026-11-24T15:00:00Z"),
  today = day(now);
const rh: Scope = {
  user: "real-principal-demo",
  name: "Conta RH",
  mode: "rh",
  org: "org-test",
  key: "home-office-v1:org-test:rh",
};
const own = "home-person-0",
  free = "home-person-7";
const sample = () => demoHomeOffice(rh, now);
const full = (period: Period = "Dia completo"): Payload => {
  const p = blank(period);
  p.activities = p.activities.map((a) => ({
    ...a,
    project: "Projeto Aurora",
    work: "Revisei a etapa inicial.",
    result: "Revisão consolidada e enviada para conferência.",
    reference: "",
  }));
  return p;
};
const employee = { ...rh, mode: "professional" as const };
const leadership = {
  ...rh,
  user: "fictional-other-leader",
  name: "Líder",
  mode: "leader" as const,
};
const reviewer = { ...rh, user: "another-rh", name: "RH revisor" };
describe("Home Office schedules", () => {
  it("generates recurring days only within inclusive validity", () => {
    const s = sample(),
      a = s.agreements.find((a) => a.person === own)!;
    const dates = occurrences(s, today, shift(today, 7));
    expect(new Set(dates.map((o) => key(o.person, o.date))).size).toBe(
      dates.length,
    );
    expect(occurrence(s, own, a.start)?.sourceId).toBe(a.id);
    expect(occurrence(s, own, shift(a.start, -1))).toBeUndefined();
    expect(occurrence(s, own, shift(a.end, 1))).toBeUndefined();
    expect(occurrence(s, own, shift(today, 7))?.sourceId).toBe(a.id);
    expect(occurrence(s, own, shift(today, 3))).toBeUndefined();
  });
  it("exempts permanent agreements from reports", () => {
    const s = sample();
    const o = occurrence(s, "home-person-1", today)!;
    expect(o.requiresReport).toBe(false);
    expect(
      reportRows(s, today, today).some((r) => r.o.person === "home-person-1"),
    ).toBe(false);
    expect(() =>
      saveReport(
        s,
        { ...rh, user: s.people[1].user },
        o.person,
        today,
        full(),
        true,
        now,
      ),
    ).toThrow("obrigação");
  });
  it("keeps permanent workers exempt on swaps and exceptional combined dates during validity", () => {
    const target = shift(today, 5); // Sunday, outside the permanent weekday schedule.
    let s = cancelOrSwap(
      sample(),
      rh,
      "home-person-1",
      today,
      "Troca demonstrativa",
      target,
      now,
    );
    expect(occurrence(s, "home-person-1", target)?.requiresReport).toBe(false);
    expect(
      reportRows(s, target, target).some(
        (row) => row.o.person === "home-person-1",
      ),
    ).toBe(false);
    s = registerDay(
      sample(),
      rh,
      {
        person: "home-person-1",
        date: target,
        period: "Manhã",
        reason: "Combinado fictício",
        signal: false,
      },
      now,
    );
    expect(occurrence(s, "home-person-1", target)?.requiresReport).toBe(false);
  });
  it("registers a half-day combined date with the authenticated author", () => {
    const s = registerDay(
      sample(),
      rh,
      {
        person: free,
        date: today,
        period: "Tarde",
        reason: "Combinado demonstrativo",
        signal: false,
      },
      now,
    );
    const o = occurrence(s, free, today)!;
    expect(o.period).toBe("Tarde");
    expect(o.approvedBy).toBe(rh.user);
    expect(o.approvedName).toBe(rh.name);
    expect(o.requiresReport).toBe(true);
  });
  it("creates pending signals without an obligation and permits scoped approval", () => {
    const s = registerDay(
      sample(),
      employee,
      {
        person: own,
        date: shift(today, 3),
        period: "Manhã",
        reason: "Concentração na demanda",
        signal: true,
      },
      now,
    );
    const o = occurrence(s, own, shift(today, 3))!;
    expect(o.status).toBe("Pendente");
    expect(o.requiresReport).toBe(false);
    expect(reportRows(s, o.date, o.date).some((r) => r.o.person === own)).toBe(
      false,
    );
    const approved = approveDay(s, leadership, o.sourceId, now);
    expect(occurrence(approved, own, o.date)?.approvedBy).toBe(leadership.user);
    expect(occurrence(approved, own, o.date)?.requiresReport).toBe(true);
  });
  it("rejects duplicate authorized and pending dates", () => {
    expect(() =>
      registerDay(
        sample(),
        rh,
        {
          person: own,
          date: today,
          period: "Manhã",
          reason: "Duplicado",
          signal: false,
        },
        now,
      ),
    ).toThrow("Já existe");
    const s = registerDay(
      sample(),
      employee,
      {
        person: own,
        date: shift(today, 3),
        period: "Manhã",
        reason: "Teste",
        signal: true,
      },
      now,
    );
    expect(() =>
      registerDay(
        s,
        rh,
        {
          person: own,
          date: shift(today, 3),
          period: "Tarde",
          reason: "Duplicado",
          signal: false,
        },
        now,
      ),
    ).toThrow("Já existe");
  });
  it("changes only one occurrence and preserves next week and history", () => {
    const s = sample();
    const before = occurrence(s, own, shift(today, 7));
    const changed = cancelOrSwap(
      s,
      rh,
      own,
      today,
      "Troca combinada",
      shift(today, 3),
      now,
    );
    expect(occurrence(changed, own, today)?.status).toBe("Cancelado");
    expect(occurrence(changed, own, shift(today, 3))?.requiresReport).toBe(
      true,
    );
    expect(occurrence(changed, own, shift(today, 7))).toEqual(before);
    expect(
      changed.reports.find((r) => r.id === key(own, today))?.draft,
    ).toEqual(s.reports.find((r) => r.id === key(own, today))?.draft);
    expect(
      reportRows(changed, today, today).find((r) => r.o.person === own)?.active,
    ).toBe(false);
    expect(changed.events[0].text).toContain("mantendo as próximas semanas");
  });
  it("does not allow swapping onto an existing occurrence", () => {
    expect(() =>
      cancelOrSwap(sample(), rh, own, today, "Colisão", shift(today, 1), now),
    ).toThrow("Já existe");
  });
  it("does not cancel past days or submitted originals", () => {
    const s = sample();
    expect(() =>
      cancelOrSwap(s, rh, own, shift(today, -7), "Retroativo", undefined, now),
    ).toThrow("hoje");
    const sent = saveReport(s, employee, own, today, full(), true, now);
    expect(() =>
      cancelOrSwap(sent, rh, own, today, "Apagar original", undefined, now),
    ).toThrow("original");
  });
  it("creates recurring agreements only through RH and detects overlap", () => {
    const input = {
      person: free,
      mode: "Híbrido fixo" as const,
      start: today,
      end: shift(today, 30),
      weekdays: [weekday(today)],
      period: "Manhã" as const,
    };
    const s = addAgreement(sample(), rh, input, now);
    expect(occurrence(s, free, today)?.period).toBe("Manhã");
    expect(() => addAgreement(s, rh, input, now)).toThrow("sobreposta");
    expect(() =>
      addAgreement(sample(), employee, { ...input, person: own }, now),
    ).toThrow("Somente RH");
    expect(() =>
      addAgreement(sample(), rh, { ...input, weekdays: [] }, now),
    ).toThrow("dias");
  });
  it("terminates future validity while retaining prior dates", () => {
    let s = sample();
    const a = s.agreements.find((a) => a.person === own)!;
    s = endAgreement(s, rh, a.id, shift(today, 7), now);
    expect(occurrence(s, own, shift(today, 7))).toBeUndefined();
    expect(occurrence(s, own, today)?.sourceId).toBe(a.id);
    expect(s.events[0].text).toContain("Vigência original");
  });
  it("forbids ending a submitted original and retroactive termination", () => {
    const s = saveReport(sample(), employee, own, today, full(), true, now),
      a = s.agreements.find((a) => a.person === own)!;
    expect(() => endAgreement(s, rh, a.id, today, now)).toThrow("original");
    expect(() => endAgreement(s, rh, a.id, shift(today, -1), now)).toThrow(
      "válida",
    );
  });
});
describe("Home Office deadline and content", () => {
  it("uses Sao Paulo at the midnight boundary, including the full 23:59 minute", () => {
    expect(day(new Date("2026-11-25T02:59:59.999Z"))).toBe("2026-11-24");
    expect(day(new Date("2026-11-25T03:00:00Z"))).toBe("2026-11-25");
    expect(() =>
      saveReport(
        sample(),
        employee,
        own,
        today,
        full(),
        true,
        new Date("2026-11-25T02:59:59.999Z"),
      ),
    ).not.toThrow();
    expect(() =>
      saveReport(
        sample(),
        employee,
        own,
        today,
        full(),
        true,
        new Date("2026-11-25T03:00:00Z"),
      ),
    ).toThrow("próprio dia");
  });
  it("blocks original drafts and submissions for future dates", () => {
    expect(() =>
      saveReport(sample(), employee, own, shift(today, 1), full(), true, now),
    ).toThrow("próprio dia");
    expect(() =>
      saveReport(sample(), employee, own, shift(today, 1), full(), false, now),
    ).toThrow("próprio dia");
  });
  for (const period of ["Manhã", "Tarde", "Dia completo"] as Period[])
    it(`validates the required periods for ${period}`, () => {
      expect(() => validatePayload(full(period), period)).not.toThrow();
      if (period === "Dia completo") {
        const p = full("Manhã");
        expect(() => validatePayload(p, period)).toThrow("todos os períodos");
      } else
        expect(() => validatePayload(full("Dia completo"), period)).toThrow(
          "Preencha",
        );
    });
  it("requires concrete fields, impediment explanation and safe references", () => {
    const p = full();
    p.activities[0].result = "";
    expect(() => validatePayload(p, "Dia completo")).toThrow("resultado");
    const q = full();
    q.hasBlocker = true;
    expect(() => validatePayload(q, "Dia completo")).toThrow("pendência");
    q.blocker = "Aguardando material";
    q.activities[0].reference = "javascript:alert(1)";
    expect(() => validatePayload(q, "Dia completo")).toThrow("HTTP");
  });
  it("preserves the original snapshot and prevents overwrites", () => {
    const input = full(),
      s = saveReport(sample(), employee, own, today, input, true, now);
    input.activities[0].result = "Mutação externa";
    const r = s.reports.find((r) => r.id === key(own, today))!;
    expect(r.original?.payload.activities[0].result).not.toBe(
      "Mutação externa",
    );
    expect(() =>
      saveReport(s, employee, own, today, full(), false, now),
    ).toThrow("sobrescrito");
  });
  it("keeps overdue status after a justification and prevents late cancellation", () => {
    const date = shift(today, -7);
    const s = appendOwnNote(
        sample(),
        employee,
        own,
        date,
        "Justificativa demonstrativa.",
        now,
      ),
      r = s.reports.find((r) => r.id === key(own, date))!;
    expect(r.original).toBeUndefined();
    expect(submissionStatus(r.occurrence, r, now)).toBe(
      "Não entregue no prazo",
    );
    expect(r.notes.at(-1)?.kind).toBe("Justificativa de atraso");
    expect(() =>
      saveReport(s, employee, own, date, full("Tarde"), true, now),
    ).toThrow("próprio dia");
  });
});
describe("Home Office review and permissions", () => {
  it("requires sequential leadership and RH review with no self-validation", () => {
    let s = saveReport(sample(), employee, own, today, full(), true, now);
    const id = key(own, today);
    expect(() => reviewReport(s, rh, id, "approve", "", now)).toThrow(
      "autovalidação",
    );
    expect(() => reviewReport(s, reviewer, id, "approve", "", now)).toThrow(
      "etapa",
    );
    s = reviewReport(s, leadership, id, "approve", "Conferido", now);
    expect(reviewStatus(s.reports.find((r) => r.id === id))).toBe(
      "Aguardando RH",
    );
    expect(() => reviewReport(s, leadership, id, "approve", "", now)).toThrow(
      "etapa",
    );
    s = reviewReport(s, reviewer, id, "approve", "Validado", now);
    expect(reviewStatus(s.reports.find((r) => r.id === id))).toBe("Validado");
  });
  it("preserves the original through next-day clarification and comments", () => {
    let s = saveReport(sample(), employee, own, today, full(), true, now);
    const id = key(own, today),
      original = structuredClone(s.reports.find((r) => r.id === id)!.original);
    s = reviewReport(s, leadership, id, "comment", "Comentário inicial", now);
    s = reviewReport(
      s,
      leadership,
      id,
      "clarify",
      "Qual versão foi entregue?",
      now,
    );
    expect(reviewStatus(s.reports.find((r) => r.id === id))).toBe(
      "Em esclarecimento",
    );
    expect(() => reviewReport(s, leadership, id, "approve", "", now)).toThrow(
      "Revisão",
    );
    s = appendOwnNote(
      s,
      employee,
      own,
      today,
      "A primeira versão revisada.",
      new Date("2026-11-25T15:00:00Z"),
    );
    const r = s.reports.find((r) => r.id === id)!;
    expect(r.original).toEqual(original);
    expect(r.notes.at(-1)?.kind).toBe("Complementação");
    expect(reviewStatus(r)).toBe("Enviado e aguardando liderança");
  });
  it("prevents writing other employees and crossing organizations", () => {
    expect(() =>
      saveReport(
        sample(),
        employee,
        "home-person-3",
        today,
        full("Tarde"),
        true,
        now,
      ),
    ).toThrow("escopo");
    expect(() =>
      registerDay(
        sample(),
        { ...rh, org: "org-other" },
        {
          person: free,
          date: today,
          period: "Manhã",
          reason: "Teste",
          signal: false,
        },
        now,
      ),
    ).toThrow("Organização");
    expect(() => project(sample(), { ...rh, org: "org-other" })).toThrow(
      "Organização",
    );
  });
  it("projects only own records to professionals and team records to leaders", () => {
    const s = project(sample(), employee);
    expect(s.people).toHaveLength(1);
    expect(JSON.stringify(s)).not.toContain("Felipe Engenharia");
    const lead = { ...rh, mode: "leader" as const };
    const team = demoHomeOffice(lead, now);
    expect(team.people.some((p) => p.id === "home-person-6")).toBe(false);
    expect(() =>
      registerDay(
        team,
        lead,
        {
          person: "home-person-6",
          date: shift(today, 5),
          period: "Manhã",
          reason: "Fora do escopo",
          signal: false,
        },
        now,
      ),
    ).toThrow("escopo");
  });
  it("versions rules without changing existing agreements and original reports", () => {
    let s = saveReport(sample(), employee, own, today, full(), true, now);
    const old = structuredClone(
        s.reports.find((r) => r.id === key(own, today))!,
      ),
      oldRule = s.agreements[0].rule;
    s = editRules(s, rh, "Nova orientação demonstrativa.", now);
    expect(s.rules).toHaveLength(3);
    expect(s.agreements[0].rule).toBe(oldRule);
    expect(s.reports.find((r) => r.id === old.id)).toEqual(old);
    s = registerDay(
      s,
      rh,
      {
        person: free,
        date: today,
        period: "Tarde",
        reason: "Novo combinado",
        signal: false,
      },
      now,
    );
    expect(occurrence(s, free, today)?.rule).toBe(s.rules.at(-1)?.id);
    expect(() => editRules(s, employee, "Não autorizado", now)).toThrow(
      "Somente RH",
    );
  });
});
