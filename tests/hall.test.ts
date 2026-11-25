import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { type Scope } from "@/modules/career/model";
import { demoPerformance } from "@/modules/performance/fixtures";
import {
  eligible,
  ranking,
  hallProjection,
  saveCategory,
  saveCampaign,
  saveAward,
  validateAward,
  publishAward,
  saveRegulation,
  ensureSeason,
} from "@/modules/performance/model";
const rh: Scope = {
  user: "rh-actor",
  name: "RH",
  org: "org-a",
  rh: true,
  director: false,
  leader: false,
  contract: "CLT",
  key: "rh",
};
const employee = { ...rh, rh: false, user: "professional" };
const state = () => demoPerformance(rh);
function input(s = state()) {
  const a = s.awards.find((a) => a.id === "award-draft")!;
  return {
    id: a.id,
    person: a.person,
    month: a.month,
    message: a.message,
    phrase: a.phrase,
    photo: a.photo,
    order: a.order,
    source: a.source,
  };
}
describe("Recognition eligibility, publication and immutable history", () => {
  it("requires independent sector categories, with cultural and leader eligibility", () => {
    const s = state(),
      pj = s.people.find((p) => p.id === "career-person-4")!,
      clt = s.people.find((p) => p.id === "career-person-1")!,
      lead = s.people.find((p) => p.id === "career-person-10")!;
    expect(
      eligible(
        s.categories.find((c) => c.id === "hall-engineering")!,
        pj,
      ),
    ).toBe(true);
    expect(
      eligible(
        s.categories.find((c) => c.id === "hall-architecture")!,
        pj,
      ),
    ).toBe(false);
    expect(
      eligible(
        s.categories.find((c) => c.id === "hall-culture")!,
        pj,
      ),
    ).toBe(false);
    expect(
      eligible(
        s.categories.find((c) => c.id === "hall-culture")!,
        clt,
      ),
    ).toBe(true);
    expect(
      eligible(
        s.categories.find((c) => c.id === "hall-leadership")!,
        lead,
      ),
    ).toBe(true);
    expect(
      eligible(
        s.categories.find((c) => c.id === "hall-architecture")!,
        lead,
      ),
    ).toBe(false);
  });
  it("does not permit a general operational category or PJ cultural/leadership configuration", () => {
    const s = state(),
      c = s.categories[0];
    expect(() => saveCategory(s, rh, { ...c, sector: "" })).toThrow(
      "Não há categoria geral",
    );
    expect(() =>
      saveCategory(s, rh, { ...c, kind: "Comportamental", contracts: ["PJ"] }),
    ).toThrow("PJ");
    expect(() => saveCategory(s, employee, c)).toThrow("exclusiva");
  });
  it("keeps preparation private and requires separate validation and publication consent", () => {
    let s = state();
    const a = input(s),
      cat = "hall-culture",
      camp = s.campaigns[0].id;
    s = saveAward(
      s,
      rh,
      { ...a, message: "Mensagem fictícia atualizada." },
      cat,
      camp,
    );
    expect(s.awards.find((x) => x.id === a.id)?.status).toBe("Rascunho");
    expect(hallProjection(s, employee).awards.some((x) => x.id === a.id)).toBe(
      false,
    );
    expect(() => publishAward(s, rh, a.id, true)).toThrow("Valide");
    s = validateAward(s, rh, a.id);
    expect(hallProjection(s, employee).awards.some((x) => x.id === a.id)).toBe(
      false,
    );
    expect(() => publishAward(s, rh, a.id, false)).toThrow("explicitamente");
    s = publishAward(s, rh, a.id, true, a.month + "-28");
    expect(hallProjection(s, employee).awards.some((x) => x.id === a.id)).toBe(
      true,
    );
    expect(() => publishAward(s, rh, a.id, true)).toThrow("Valide");
  });
  it("blocks own validation, monthly duplicates, future publication and unauthorized writes", () => {
    const s = state(),
      a = s.awards.find((a) => a.id === "award-draft")!;
    expect(() =>
      validateAward(s, { ...rh, user: "career-user-2" }, a.id),
    ).toThrow("próprio");
    expect(() =>
      saveAward(
        s,
        rh,
        { ...input(s), id: "duplicate" },
        a.category.id,
        a.campaign.id,
      ),
    ).toThrow("Já existe vencedor");
    expect(() => validateAward(s, employee, a.id)).toThrow("exclusiva");
    const v = validateAward(s, rh, a.id);
    expect(() => publishAward(v, rh, a.id, true, "2020-01-01")).toThrow(
      "futuro",
    );
  });
  it("validates the person, evaluation type, category and semester before saving", () => {
    const s = state(),
      a = input(s),
      camp = s.campaigns[0].id;
    expect(() =>
      saveAward(
        s,
        rh,
        { ...a, person: "career-person-4" },
        "hall-culture",
        camp,
      ),
    ).toThrow("Elegibilidade");
    expect(() =>
      saveAward(s, rh, { ...a, month: "2020-01" }, "hall-culture", camp),
    ).toThrow("semestre");
    expect(() =>
      saveAward(
        s,
        rh,
        { ...a, source: "evaluation-career-person-2-Operacional" },
        "hall-culture",
        camp,
      ),
    ).toThrow("tipo");
    expect(() =>
      saveAward(
        s,
        rh,
        { ...a, photo: "https://example.com/image.png" },
        "hall-culture",
        camp,
      ),
    ).toThrow("imagem demonstrativa");
  });
  it("freezes published awards and preserves category, campaign, points and regulation snapshots", () => {
    let s = state();
    const a = input(s),
      camp = s.campaigns[0];
    s = saveAward(s, rh, a, "hall-culture", camp.id);
    const original = structuredClone(s.awards.find((x) => x.id === a.id)!);
    s = saveCategory(s, rh, {
      ...s.categories.find((c) => c.id === "hall-culture")!,
      name: "Categoria editada",
      badge: "Selo novo",
    });
    s = saveCampaign(s, rh, {
      ...camp,
      name: "Nome editado",
      points: 7,
      prize: "Outro reconhecimento demonstrativo",
    });
    s = saveRegulation(
      s,
      rh,
      "Regulamento novo para próximas preparações.",
      true,
    );
    expect(s.awards.find((x) => x.id === a.id)).toEqual(original);
    expect(original.regulation?.version).toBe(1);
    s = validateAward(s, rh, a.id);
    expect(() => saveAward(s, rh, a, "hall-culture", camp.id)).toThrow(
      "imutável",
    );
  });
  it("strips candidate drafts, internal scores, evaluation IDs and confidential notes from public Hall", () => {
    const s = hallProjection(state(), { ...employee, contract: "PJ" }),
      json = JSON.stringify(s);
    expect(s.evaluations).toEqual([]);
    expect(s.diary).toEqual([]);
    expect(
      s.awards.every(
        (a) => !a.source && !a.author && !a.validatedBy && !a.events.length,
      ),
    ).toBe(true);
    expect(json).not.toContain("Uma mensagem confidencial preparada");
    expect(json).not.toContain("Registro reservado fictício");
    expect(s.awards.length).toBeGreaterThan(0);
  });
  it("does not reassign campaigns to a different semester or allow duplicate semester campaigns", () => {
    const s = state(),
      c = s.campaigns[0];
    expect(() =>
      saveCampaign(s, rh, { ...c, semester: c.semester === 1 ? 2 : 1 }),
    ).toThrow();
    expect(() => saveCampaign(s, rh, { ...c, id: "same-semester" })).toThrow(
      "Já existe",
    );
  });
});
describe("Category rankings and semester rollover", () => {
  it("keeps the same fictional portrait for a person across campaigns and achievements", () => {
    const s = state();
    for (const p of s.people) {
      const photos = new Set(
        s.awards.filter((a) => a.person === p.id).map((a) => a.photo),
      );
      expect(photos.size).toBeLessThanOrEqual(1);
    }
  });
  it("counts published recognitions only, scoped to category and campaign", () => {
    const s = state(),
      cat = "hall-architecture",
      camp = s.campaigns[0].id;
    const rows = ranking(s, cat, camp);
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      const awards = s.awards.filter(
        (a) =>
          a.status === "Publicado" &&
          a.category.id === cat &&
          a.campaign.id === camp &&
          a.person === r.person,
      );
      expect(r.wins).toBe(awards.length);
      expect(r.points).toBe(awards.reduce((n, a) => n + a.points, 0));
    }
    expect(ranking(s, "all-sectors", camp)).toEqual([]);
    expect(ranking(s, cat, "no-campaign")).toEqual([]);
  });
  it("shares ties without imposing a definitive tiebreaker and applies configured manual priority", () => {
    const s = state(),
      seed = s.awards.find((a) => a.status === "Publicado")!,
      camp = s.campaigns[0];
    s.awards = [0, 1, 2].map((n) => ({
      ...structuredClone(seed),
      id: "tie-" + n,
      person: `career-person-${n}`,
      points: 1,
      campaign: structuredClone(camp),
    }));
    expect(
      ranking(s, seed.category.id, camp.id).map((r) => r.position),
    ).toEqual([1, 1, 1]);
    s.campaigns = s.campaigns.map((c) =>
      c.id === camp.id
        ? {
            ...c,
            tie: "Decisão do RH",
            tieOrder: ["career-person-2", "career-person-1"],
          }
        : c,
    );
    expect(ranking(s, seed.category.id, camp.id).map((r) => r.person)).toEqual([
      "career-person-2",
      "career-person-1",
      "career-person-0",
    ]);
    const publicView = hallProjection(s, employee);
    expect(ranking(publicView, seed.category.id, camp.id)).toEqual(
      ranking(s, seed.category.id, camp.id),
    );
  });
  it("starts a new semester empty without modifying previous winners or creating payments", () => {
    const s = state(),
      awards = structuredClone(s.awards),
      next = ensureSeason(s, "2028-07-01");
    expect(next.campaigns[0].year).toBe(2028);
    expect(next.campaigns[0].semester).toBe(2);
    expect(ranking(next, s.categories[0].id, next.campaigns[0].id)).toEqual([]);
    expect(next.awards).toEqual(awards);
    expect(ensureSeason(next, "2028-07-02")).toEqual(next);
  });
  it("published historical categories remain consultable after deactivation", () => {
    const s = state(),
      c = s.categories[0],
      updated = saveCategory(s, rh, { ...c, enabled: false });
    expect(
      hallProjection(updated, employee).categories.some((x) => x.id === c.id),
    ).toBe(true);
    expect(ranking(updated, c.id, s.campaigns[0].id)).toEqual(
      ranking(s, c.id, s.campaigns[0].id),
    );
  });
});
