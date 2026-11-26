import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { type Scope } from "@/modules/career/model";
import { demoResumeDatabase } from "@/modules/recruitment/resume-fixtures";
import { projectResumeDatabase } from "@/modules/recruitment/resume-model";
import {
  selectionConfig,
  selectionDemoActor,
  deleteSelectionPhase,
  saveSelectionPhase,
  reorderSelectionPhase,
  newSelectionPhase,
  moveSelectionCards,
  deleteSelectionCards,
  saveSelectionConfig,
  saveSelectionCandidate,
  selectionProfileValues,
} from "@/modules/recruitment/selection-model";
const rh: Scope = {
  org: "org-a",
  user: "hr",
  name: "RH fictício",
  key: "rh",
  rh: true,
  director: false,
  leader: false,
  contract: "CLT",
};
const director = {
  ...rh,
  rh: false,
  director: true,
  key: "director",
  user: "director",
};
const fresh = () => demoResumeDatabase(rh);
describe("Processo Seletivo — edição local e integridade", () => {
  it("cria, renomeia e reordena sem modificar identificadores ou snapshots", () => {
    let s = fresh();
    const phase = newSelectionPhase();
    s = saveSelectionPhase(s, rh, phase);
    const ids = s.applications.map((a) => a.id);
    s = saveSelectionPhase(s, rh, {
      ...phase,
      name: "Revisão técnica",
      color: "#112233",
    });
    s = reorderSelectionPhase(s, rh, phase.id, -1);
    expect(s.central!.stages.at(-2)!.name).toBe("Revisão técnica");
    expect(s.applications.map((a) => a.id)).toEqual(ids);
  });
  it("transfere fase ocupada e referências históricas, preserva automações sem executá-las", () => {
    let s = fresh();
    const source = s.central!.stages.find((st) => st.kind === "entry")!,
      target = s.central!.stages.find((st) => st.kind === "normal")!;
    const app = s.applications[0];
    s = {
      ...s,
      applications: [
        { ...app, stage: source.id, fields: { custom: "preservado" } },
        {
          ...structuredClone(app),
          id: "historical-ref",
          stage: source.id,
          historical: true,
        },
      ],
    };
    s.rules = [
      {
        ...s.rules[0],
        id: "move-rule",
        name: "Automação preservada",
        stage: source.id,
        active: true,
        trigger: "Mudança de etapa",
        action: "Gerar notificação local",
        sector: "",
        contract: "",
      },
    ];
    const before = structuredClone(s);
    const n = deleteSelectionPhase(s, rh, source.id, target.id, true);
    expect(n.applications.every((a) => a.stage === target.id)).toBe(true);
    expect(n.applications[0].fields.custom).toBe("preservado");
    expect(n.applications[1].historical).toBe(true);
    expect(n.applications[1].entered).toBe(before.applications[1].entered);
    expect(n.applications[1].visits).toEqual(before.applications[1].visits);
    expect(n.rules[0]).toEqual({ ...before.rules[0], stage: target.id });
    expect(n.logs).toEqual(before.logs);
    expect(n.offers).toEqual(before.offers);
    expect(n.admissions).toEqual(before.admissions);
    expect(n.central!.stages.find((st) => st.id === target.id)!.kind).toBe(
      "entry",
    );
    expect(n.applications[0].stages).toEqual(
      expect.arrayContaining(before.applications[0].stages),
    );
    expect(s).toEqual(before);
    const out = n.central!.stages.find(
      (st) => st.kind === "normal" && st.id !== target.id,
    )!;
    const moved = moveSelectionCards(
      moveSelectionCards(n, rh, [app.id], out.id, "Saída fictícia"),
      rh,
      [app.id],
      target.id,
      "Retorno fictício",
    );
    expect(moved.logs.filter((l) => l.rule === "move-rule")).toHaveLength(1);
  });
  it("exige confirmação e destino compatível; erros não alteram estado", () => {
    const s = fresh(),
      before = structuredClone(s),
      from = s.central!.stages.find((st) => st.kind === "entry")!,
      to = s.central!.stages.find((st) => st.kind === "hired")!;
    expect(() => deleteSelectionPhase(s, rh, from.id, to.id, true)).toThrow();
    expect(() => deleteSelectionPhase(s, rh, from.id, from.id, true)).toThrow();
    expect(() => deleteSelectionPhase(s, rh, from.id, to.id, false)).toThrow();
    expect(s).toEqual(before);
  });
  it("move cards livremente, inclusive formalizados, preservando vínculos/admissões", () => {
    let s = fresh();
    const app = s.applications.find((a) => !a.historical && !a.archived)!;
    s = {
      ...s,
      applications: s.applications.map((a) =>
        a.id === app.id ? { ...a, status: "Contratada" } : a,
      ),
    };
    const target = s.central!.stages.find((st) => st.id !== app.stage)!;
    const n = moveSelectionCards(
      s,
      rh,
      [app.id],
      target.id,
      "Organização fictícia",
    );
    expect(n.applications.find((a) => a.id === app.id)!.stage).toBe(target.id);
    expect(n.applications.find((a) => a.id === app.id)!.status).toBe(
      "Contratada",
    );
    expect(n.employments).toEqual(s.employments);
    expect(n.admissions).toEqual(s.admissions);
  });
  it("exclui card do quadro preservando cadastro, histórico e contratação", () => {
    const s = fresh(),
      a = s.applications.find((a) => !a.historical && !a.archived)!;
    const n = deleteSelectionCards(s, rh, [a.id], "Exemplo", true);
    expect(n.applications.find((x) => x.id === a.id)!.archived).toBeTruthy();
    expect(n.candidates).toEqual(s.candidates);
    expect(n.employments).toEqual(s.employments);
    expect(n.admissions).toEqual(s.admissions);
    expect(() =>
      deleteSelectionCards(s, rh, [a.id], "Exemplo", false),
    ).toThrow();
  });
  it("personaliza ficha, cor, campos exibidos e salva valores adicionais", () => {
    let s = fresh();
    const config = selectionConfig(s);
    config.profileFields.push({
      id: "portfolio-focus",
      label: "Especialidade do portfólio",
      type: "Texto",
      required: false,
      mapping: "",
      options: [],
    });
    s = saveSelectionConfig(s, rh, { ...config, cardColor: "#aabbcc" }, [
      "area",
      "profile:portfolio-focus",
    ]);
    const p = s.candidates.find((p) =>
      s.applications.some(
        (a) => a.candidate === p.id && !a.historical && !a.archived,
      ),
    )!;
    s = saveSelectionCandidate(
      s,
      rh,
      { ...p, city: "Cidade demonstrativa" },
      { "portfolio-focus": "BIM" },
      false,
      "#123456",
    );
    expect(selectionProfileValues(s, p.id)["portfolio-focus"]).toBe("BIM");
    expect(s.candidates.find((x) => x.id === p.id)!.city).toBe(
      "Cidade demonstrativa",
    );
    expect(s.central!.cards).toContain("profile:portfolio-focus");
    expect(s.central!.selection!.history).toHaveLength(1);
    const projected = projectResumeDatabase(s, director);
    expect(projected.central!.selection).toBeUndefined();
    expect(
      projected.applications.every(
        (a) => !a.fields["selection-profile:portfolio-focus"],
      ),
    ).toBe(true);
  });
  it("cria currículo manual e bloqueia edição fora de RH/organização", () => {
    const s = fresh(),
      p = {
        ...structuredClone(s.candidates[0]),
        id: "manual-fictional",
        name: "Currículo Fictício",
        email: "manual@exemplo.invalid",
        phone: "",
        cv: undefined,
        portfolio: undefined,
      };
    const n = saveSelectionCandidate(s, rh, p, {}, true, "#123456");
    expect(n.candidates.some((x) => x.id === p.id)).toBe(true);
    expect(n.applications.some((a) => a.candidate === p.id)).toBe(true);
    expect(() =>
      saveSelectionPhase(s, director, newSelectionPhase()),
    ).toThrow();
    expect(() =>
      saveSelectionPhase(s, { ...rh, org: "org-b" }, newSelectionPhase()),
    ).toThrow();
    expect(() =>
      saveSelectionConfig(
        s,
        rh,
        { ...selectionConfig(s), cardColor: "invalid" },
        [],
      ),
    ).toThrow();
  });
  it("conserva os campos personalizados na revisão de cadastro duplicado", () => {
    let s = fresh();
    const config = selectionConfig(s);
    config.profileFields.push({
      id: "extra-demo",
      label: "Área técnica",
      type: "Texto",
      required: false,
      mapping: "",
      options: [],
    });
    s = saveSelectionConfig(s, rh, config, s.central!.cards);
    const p = {
      ...structuredClone(s.candidates[0]),
      id: "duplicate-incoming-demo",
    };
    const n = saveSelectionCandidate(
      s,
      rh,
      p,
      { "extra-demo": "Detalhamento" },
      true,
      "#123456",
    );
    expect(n.candidates.some((c) => c.id === p.id)).toBe(false);
    expect(
      n.duplicateReviews!.find((r) => r.incoming?.id === p.id)!.intake!.answers[
        "extra-demo"
      ],
    ).toBe("Detalhamento");
  });
  it("isola a simulação RH mantendo identidade real e organização; nega perfis sem acesso", () => {
    const actor = selectionDemoActor(director);
    expect(actor.user).toBe(director.user);
    expect(actor.org).toBe(director.org);
    expect(actor.key).toBe("selection-rh-demo:director");
    expect(director.rh).toBe(false);
    expect(() =>
      selectionDemoActor({ ...director, director: false }),
    ).toThrow();
    const d = demoResumeDatabase(actor);
    expect(
      d.candidates.every((p) => p.email.endsWith("@exemplo.invalid")),
    ).toBe(true);
  });
});
