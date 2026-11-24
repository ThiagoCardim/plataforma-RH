import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { type Scope } from "@/modules/career/model";
import { demoPdi } from "@/modules/pdi/fixtures";
import {
  pdiProjection,
  createPlan,
  savePlan,
  reviewPlan,
  actionDone,
  addEvidence,
  feedback,
  closePlan,
  progress,
  saveCycle,
} from "@/modules/pdi/model";
const leader: Scope = {
  user: "leader-actor",
  name: "Líder",
  org: "org-a",
  rh: false,
  director: false,
  leader: true,
  contract: "CLT",
  key: "a",
};
const rh = { ...leader, user: "rh-actor", name: "RH", rh: true, leader: false };
const employee = {
  ...leader,
  user: "employee-actor",
  name: "Profissional",
  leader: false,
};
const target = "pdi-demo-career-person-1";
describe("PDI ownership, approvals and progress", () => {
  it("does not include PJ participants for any profile", () => {
    for (const ctx of [
      leader,
      rh,
      employee,
      { ...leader, contract: "PJ" as const },
    ]) {
      const s = demoPdi(ctx);
      expect(s.people.every((p) => p.contract !== "PJ")).toBe(true);
      expect(
        s.plans.every((p) =>
          s.people.some((x) => x.id === p.person && x.contract !== "PJ"),
        ),
      ).toBe(true);
    }
  });
  it("creates only for the leader own CLT/intern team and requires an active cycle", () => {
    const s = demoPdi(leader);
    expect(() =>
      createPlan(s, leader, "career-person-1", "pdi-cycle-2"),
    ).not.toThrow();
    expect(() => createPlan(s, rh, "career-person-1", "pdi-cycle-2")).toThrow(
      "líder",
    );
    expect(() =>
      createPlan(s, leader, "career-person-4", "pdi-cycle-2"),
    ).toThrow("CLT");
    expect(() =>
      createPlan(s, leader, "career-person-0", "pdi-cycle-2"),
    ).toThrow("equipe");
  });
  it("prevents duplicate active plans in a cycle", () => {
    const s = demoPdi(leader);
    expect(() =>
      createPlan(s, leader, "career-person-1", "pdi-cycle-1"),
    ).toThrow("Já existe");
  });
  it("hides draft structures and nonapproved plans from the professional", () => {
    const s = demoPdi(leader),
      person = s.people.find((p) => p.id === "career-person-1")!;
    const ctx = { ...employee, user: person.user };
    const p = s.plans.find((p) => p.id === target)!;
    p.draft!.objective = "Unpublished objective marker";
    const view = pdiProjection(s, ctx);
    expect(view.plans.every((p) => !!p.published)).toBe(true);
    expect(view.plans[0].draft).toBeUndefined();
    expect(JSON.stringify(view)).not.toContain("Unpublished objective marker");
    expect(view.people).toHaveLength(1);
  });
  it("preserves the published snapshot while structural edits await RH", () => {
    let s = demoPdi(leader);
    const p = s.plans.find((p) => p.id === target)!,
      before = structuredClone(p.published);
    s = savePlan(
      s,
      leader,
      target,
      { ...p.draft!, objective: "Novo objetivo em revisão." },
      true,
    );
    expect(s.plans.find((p) => p.id === target)?.published).toEqual(before);
    expect(s.plans.find((p) => p.id === target)?.status).toBe("Em aprovação");
    s = reviewPlan(
      s,
      rh,
      target,
      true,
      "Objetivo de desenvolvimento conferido.",
    );
    expect(s.plans.find((p) => p.id === target)?.published?.objective).toBe(
      "Novo objetivo em revisão.",
    );
    expect(s.plans.find((p) => p.id === target)?.versions).toHaveLength(2);
  });
  it("requires RH approval, forbids own proposal approval and prevents premature employee writes", () => {
    let s = demoPdi(leader);
    const p = s.plans.find((p) => p.id === target)!;
    s = savePlan(s, leader, target, p.draft!, true);
    expect(() => reviewPlan(s, leader, target, true, "Teste")).toThrow(
      "Somente RH",
    );
    expect(() =>
      reviewPlan(s, { ...leader, rh: true }, target, true, "Própria proposta"),
    ).toThrow("autoaprovação");
    const pending = s.plans.find(
      (p) => p.status === "Em aprovação" && !p.published,
    )!;
    expect(() =>
      actionDone(s, leader, pending.id, pending.draft!.actions[0].id, true),
    ).toThrow("atividades");
  });
  it("keeps live evidence and progress when a pending structure is approved", () => {
    let s = demoPdi(leader);
    const p = s.plans.find((p) => p.id === target)!,
      action = p.published!.actions[0];
    s = savePlan(s, leader, target, p.draft!, true);
    s = actionDone(s, leader, target, action.id, true);
    s = addEvidence(
      s,
      leader,
      target,
      action.id,
      "Aprendizado registrado.",
      "https://example.com",
    );
    s = reviewPlan(s, rh, target, true, "Publicado.");
    const updated = s.plans.find((p) => p.id === target)!;
    expect(updated.published!.actions[0].done).toBe(true);
    expect(updated.published!.actions[0].evidence).toHaveLength(1);
  });
  it("rejects cross-team writes, private finance data and cross-organization reads", () => {
    const s = demoPdi(leader),
      p = s.plans.find((p) => p.id === target)!;
    expect(() =>
      actionDone(
        s,
        { ...leader, user: "other-leader" },
        target,
        p.published!.actions[0].id,
        true,
      ),
    ).toThrow("atividades");
    expect(() => pdiProjection(s, { ...employee, org: "other" })).toThrow(
      "Organização",
    );
    expect(JSON.stringify(s)).not.toContain("compensation");
    expect(JSON.stringify(s)).not.toContain("finance");
  });
  it("records feedback and evidence without allowing script links", () => {
    let s = demoPdi(employee);
    const p = s.plans[0],
      action = p.published!.actions[0];
    expect(() =>
      addEvidence(
        s,
        employee,
        p.id,
        action.id,
        "Evidência",
        "javascript:alert(1)",
      ),
    ).toThrow("HTTP");
    s = addEvidence(
      s,
      employee,
      p.id,
      action.id,
      "Aprendizado de revisão.",
      "https://example.com",
    );
    s = feedback(s, employee, p.id, "Minha reflexão sobre a atividade.");
    expect(s.plans[0].feedbacks.at(-1)?.by).toBe(employee.name);
    expect(s.plans[0].published!.actions[0].evidence).toHaveLength(1);
  });
  it("100% of actions does not automatically complete a PDI or change a role", () => {
    let s = demoPdi(leader);
    const p = s.plans.find((p) => p.id === target)!,
      person = structuredClone(s.people.find((x) => x.id === p.person));
    for (const a of p.published!.actions)
      s = actionDone(s, leader, target, a.id, true);
    expect(progress(s.plans.find((p) => p.id === target)!)).toBe(100);
    expect(s.plans.find((p) => p.id === target)?.status).toBe("Aprovado");
    expect(s.people.find((x) => x.id === p.person)).toEqual(person);
    s = closePlan(s, leader, target);
    expect(s.plans.find((p) => p.id === target)?.status).toBe("Concluído");
    expect(s.people.find((x) => x.id === p.person)).toEqual(person);
  });
  it("retains original cycle dates on existing plans", () => {
    const s = demoPdi(rh),
      old = structuredClone(s.plans[0].cycle);
    const updated = saveCycle(s, rh, {
      ...s.cycles[0],
      name: "Ciclo renomeado",
    });
    expect(updated.plans[0].cycle).toEqual(old);
    expect(updated.cycles[0].name).toBe("Ciclo renomeado");
  });
});
