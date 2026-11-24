import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { demoCareer } from "@/modules/career/fixtures";
import {
  type Scope,
  type Movement,
  projection,
  monthly,
  impact,
  budget,
  saveMovement,
  submitMovement,
  decideMovement,
  implementMovement,
  saveRates,
  saveCycle,
  saveRole,
  saveBand,
  savePublication,
  cents,
  dateNow,
} from "@/modules/career/model";
const rh: Scope = {
  user: "actor-rh",
  name: "RH fictício",
  org: "org-a",
  rh: true,
  director: false,
  leader: false,
  contract: "CLT",
  key: "a",
};
const director = {
  ...rh,
  user: "actor-director",
  name: "Diretoria",
  rh: false,
  director: true,
};
const leader = {
  ...rh,
  user: "actor-leader",
  name: "Liderança",
  rh: false,
  leader: true,
};
const employee = {
  ...rh,
  user: "actor-employee",
  name: "Profissional",
  rh: false,
};
const state = () => demoCareer(rh);
describe("Confidential career projections and structure", () => {
  it.each([employee, leader])(
    "never serializes finance or recognition analyses for $name",
    (ctx) => {
      const s = projection(state(), ctx);
      expect(s.finance).toBeUndefined();
      const serialized = JSON.stringify(s);
      for (const key of [
        "compensation",
        "revenueActual",
        "costActual",
        "proposed",
        "approvedBy",
        "movements",
        "revenueTarget",
      ])
        expect(serialized).not.toContain(key);
    },
  );
  it("hides draft roles and unpublished directives and publications", () => {
    const s = demoCareer(employee);
    s.roles.push({
      ...s.roles[0],
      id: "draft-role",
      title: "Secret future structure",
      published: false,
    });
    s.directives.push({
      id: "private-directive",
      version: 2,
      text: "Unpublished policy",
      published: false,
      at: "2026-01-01",
      by: "RH",
    });
    s.publications.push({
      id: "private-news",
      title: "Unpublished recognition",
      body: "private",
      published: false,
      at: "2026-01-01",
      by: "RH",
    });
    const view = projection(s, employee);
    expect(JSON.stringify(view)).not.toContain("Secret future");
    expect(JSON.stringify(view)).not.toContain("Unpublished");
  });
  it("excludes PJs from employee paths and history while preserving contractual administration", () => {
    const s = demoCareer({ ...rh, contract: "PJ" });
    expect(s.people.find((p) => p.user === rh.user)?.role).toBe("");
    expect(s.finance?.compensation).toHaveLength(s.people.length);
    const view = projection(s, { ...employee, user: rh.user, contract: "PJ" });
    expect(view.roles).toHaveLength(0);
    expect(view.history).toHaveLength(0);
    expect(view.finance).toBeUndefined();
  });
  it("rejects cross-organization reads and administrative writes", () => {
    expect(() => projection(state(), { ...employee, org: "org-b" })).toThrow(
      "Organização",
    );
    expect(() => saveRates(state(), leader, state().finance!.rates)).toThrow(
      "exclusiva",
    );
  });
  it("validates graph ordering, sector boundaries and visibility of occupied roles", () => {
    const s = state(),
      role = s.roles.find((r) => r.id === "architecture-base2")!;
    expect(() =>
      saveRole(s, rh, { ...role, parent: "architecture-tech1" }),
    ).toThrow("inferior");
    expect(() =>
      saveRole(s, rh, { ...role, parent: "engineering-base1" }),
    ).toThrow("mesmo setor");
    expect(() => saveRole(s, rh, { ...role, published: false })).toThrow();
  });
  it("requires ordered gross salary bands and PJ contractual profiles", () => {
    const s = state(),
      band = s.finance!.bands[0];
    expect(() =>
      saveBand(s, rh, { ...band, min: 600, max: 400, reference: 500 }),
    ).toThrow("mínimo");
    expect(() => saveBand(s, rh, { ...band, contract: "PJ" })).toThrow("PJ");
  });
});
describe("Financial simulator in cents", () => {
  it("calculates monthly, annual and cycle differences without double-counting provisions", () => {
    const q = impact({
      current: 500000,
      proposed: 550000,
      rates: { charges: 20, provisions: 18 },
      months: 6,
    });
    expect(monthly(500000, { charges: 20, provisions: 18 }).total).toBe(690000);
    expect(q).toEqual({
      gross: 50000,
      charges: 10000,
      provisions: 9000,
      monthly: 69000,
      annual: 828000,
      reserve: 414000,
    });
  });
  it("rounds components to cents and rejects invalid values", () => {
    expect(cents("10.25")).toBe(1025);
    expect(() => cents("")).toThrow();
    expect(() => cents("-1")).toThrow();
    expect(() => monthly(10000, { charges: NaN, provisions: 0 })).toThrow();
    expect(() =>
      impact({
        current: 500,
        proposed: 499,
        rates: { charges: 0, provisions: 0 },
        months: 12,
      }),
    ).toThrow("reduzir");
  });
  it("does not reserve money for drafts or pending analyses", () => {
    const s = state();
    const expected = s
      .finance!.movements.filter((m) =>
        ["Aprovado", "Efetivado"].includes(m.status),
      )
      .reduce((n, m) => n + m.quote!.reserve, 0);
    expect(budget(s, "recognition-cycle-1").committed).toBe(expected);
  });
  it("reserves on director approval and releases a canceled approval", () => {
    let s = state();
    const before = budget(s, "recognition-cycle-1");
    s = decideMovement(
      s,
      director,
      "movement-1",
      "approve",
      "Mérito e orçamento conferidos.",
    );
    const m = s.finance!.movements.find((m) => m.id === "movement-1")!;
    expect(budget(s, m.cycle).available).toBe(
      before.available - m.quote!.reserve,
    );
    s = decideMovement(
      s,
      director,
      m.id,
      "cancel",
      "Reserva cancelada na demonstração.",
    );
    expect(budget(s, m.cycle).available).toBe(before.available);
  });
  it("blocks approvals above the remaining budget", () => {
    const s = state();
    s.finance!.cycles[0].budget = budget(s, "recognition-cycle-1").committed;
    expect(() =>
      decideMovement(s, director, "movement-1", "approve", "Teste de limite"),
    ).toThrow("excede");
  });
  it("preserves analyses when default financial parameters change", () => {
    const s = state(),
      old = structuredClone(s.finance!.movements);
    const changed = saveRates(s, rh, {
      CLT: { charges: 99, provisions: 99 },
      Estágio: { charges: 0, provisions: 0 },
      PJ: { charges: 0, provisions: 0 },
    });
    expect(changed.finance!.movements).toEqual(old);
  });
  it("cannot reduce cycle budget below committed amounts or rewrite horizons", () => {
    const s = state(),
      c = s.finance!.cycles[0];
    expect(() => saveCycle(s, rh, { ...c, budget: 0 })).toThrow("comprometido");
    expect(() => saveCycle(s, rh, { ...c, months: 6 })).toThrow("horizonte");
  });
});
function proposal(
  s = state(),
  person = "career-person-0",
  kind: Movement["kind"] = "Mérito",
) {
  return {
    id: "new-analysis",
    person,
    cycle: s.finance!.cycles[0].id,
    kind,
    proposed:
      (s.finance!.compensation.find((c) => c.person === person)?.gross ?? 0) +
      50000,
    targetRole: "",
    effective: dateNow(),
    merit: "Contribuição demonstrativa sustentada por evidências.",
  };
}
describe("Confidential recognition workflow", () => {
  it("only RH prepares an analysis and only Directorate decides", () => {
    expect(() => saveMovement(state(), leader, proposal())).toThrow(
      "exclusiva",
    );
    expect(() => saveMovement(state(), director, proposal())).toThrow(
      "conduzidas",
    );
    expect(() =>
      decideMovement(state(), rh, "movement-1", "approve", "Conferido"),
    ).toThrow("Diretoria");
  });
  it("forbids self-approval by author or beneficiary", () => {
    const both = { ...rh, director: true };
    let s = saveMovement(state(), both, proposal());
    s = submitMovement(s, both, "new-analysis");
    expect(() =>
      decideMovement(
        s,
        both,
        "new-analysis",
        "approve",
        "Não pode autoaprovar",
      ),
    ).toThrow("autoaprovação");
    const otherAuthor = {
      ...s,
      finance: {
        ...s.finance!,
        movements: s.finance!.movements.map((m) =>
          m.id === "new-analysis" ? { ...m, by: "other-rh" } : m,
        ),
      },
    };
    expect(() =>
      decideMovement(
        otherAuthor,
        both,
        "new-analysis",
        "approve",
        "Próprio reconhecimento",
      ),
    ).toThrow("autoaprovação");
  });
  it("accepts only the appropriate contract recognition type", () => {
    expect(() =>
      saveMovement(state(), rh, {
        ...proposal(state(), "career-person-3", "Mérito"),
      }),
    ).toThrow("incompatível");
    const s = state();
    s.finance!.movements = s.finance!.movements.filter(
      (m) => m.person !== "career-person-4",
    );
    expect(() =>
      saveMovement(s, rh, {
        ...proposal(s, "career-person-4", "Promoção"),
        targetRole: "engineering-tech1",
      }),
    ).toThrow("incompatível");
    expect(() =>
      saveMovement(s, rh, proposal(s, "career-person-4", "Honorários PJ")),
    ).not.toThrow();
  });
  it("requires merit, valid target and separate manual implementation", () => {
    let s = state();
    expect(() =>
      saveMovement(s, rh, { ...proposal(), kind: "Promoção", targetRole: "" }),
    ).toThrow("destino");
    s = saveMovement(s, rh, { ...proposal(), merit: "" });
    expect(() => submitMovement(s, rh, "new-analysis")).toThrow("mérito");
    expect(() => implementMovement(s, rh, "new-analysis")).toThrow("aprovação");
  });
  it("does not change a current role on approval; implementation is a local RH action", () => {
    let s = state();
    const person = s.people.find((p) => p.id === "career-person-1")!,
      before = person.role;
    s = decideMovement(
      s,
      director,
      "movement-1",
      "approve",
      "Conferido orçamento e mérito.",
    );
    expect(s.people.find((p) => p.id === person.id)?.role).toBe(before);
    expect(() => implementMovement(s, director, "movement-1")).toThrow(
      "Somente RH",
    );
    s = implementMovement(s, rh, "movement-1");
    expect(s.people.find((p) => p.id === person.id)?.role).toBe(
      "engineering-tech1",
    );
    expect(s.history[0].person).toBe(person.id);
    expect(() => implementMovement(s, rh, "movement-1")).toThrow("aprovação");
  });
  it("keeps PJ implementation out of career history and public recognitions", () => {
    let s = state();
    s.finance!.movements = s.finance!.movements.filter(
      (m) => m.person !== "career-person-4",
    );
    s = saveMovement(s, rh, proposal(s, "career-person-4", "Honorários PJ"));
    s = submitMovement(s, rh, "new-analysis");
    s = decideMovement(
      s,
      director,
      "new-analysis",
      "approve",
      "Honorários fictícios.",
    );
    const history = structuredClone(s.history);
    s = implementMovement(s, rh, "new-analysis");
    expect(s.history).toEqual(history);
    expect(s.people.find((p) => p.id === "career-person-4")?.role).toBe("");
    expect(() =>
      savePublication(
        s,
        rh,
        {
          id: "pj-news",
          title: "Contrato",
          body: "Teste",
          published: true,
          source: "new-analysis",
        },
        true,
      ),
    ).toThrow("PJ");
  });
  it("requires RH authorization and an already implemented recognition for publication", () => {
    const s = state(),
      input = {
        id: "news",
        title: "Reconhecimento",
        body: "Texto público autorizado.",
        published: true,
        source: "movement-1",
      };
    expect(() => savePublication(s, rh, input, true)).toThrow("efetivados");
    expect(() =>
      savePublication(s, director, { ...input, source: "movement-4" }, true),
    ).toThrow("RH");
    expect(() =>
      savePublication(s, rh, { ...input, source: "movement-4" }, false),
    ).toThrow("autorização");
    const next = savePublication(
      s,
      rh,
      { ...input, source: "movement-4" },
      true,
    );
    const view = projection(next, employee);
    expect(view.publications.find((p) => p.id === "news")?.body).toBe(
      input.body,
    );
    expect(
      view.publications.find((p) => p.id === "news")?.source,
    ).toBeUndefined();
    expect(view.finance).toBeUndefined();
  });
});
