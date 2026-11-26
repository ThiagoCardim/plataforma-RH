import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { type Scope, dateNow } from "@/modules/career/model";
import { recruitmentFixture } from "@/modules/recruitment/fixtures";
import { demoWorkflow } from "@/modules/recruitment/workflow-fixtures";
import { baseForm } from "@/modules/recruitment/fixtures";
import {
  type State,
  decide,
  assign,
  saveOffer,
  offerState,
  formalize,
  saveRule,
} from "@/modules/recruitment/model";
import {
  type Admission,
  clearWorkflowFilters,
} from "@/modules/recruitment/workflow-types";
import {
  upgradeWorkflow,
  projectWorkflow,
  currentCycles,
  submitIntake,
  moveCentral,
  reactivateCycle,
  attachVacancy,
  selectProcesses,
  savePipeline,
  validateExperience,
  saveAdmission,
  finalizeAdmission,
  moveAdmission,
  recordDeclinedOffer,
  workflowAllowed,
  workflowErase,
  analyzeRequirements,
  rehireEligibility,
} from "@/modules/recruitment/workflow-model";
import {
  recruitmentInsights,
  vacancyStats,
} from "@/modules/recruitment/workflow-insights";
import { demoOffboarding } from "@/modules/offboarding/fixtures";
import {
  startRecruitmentOffboarding,
  confirmRecruitmentExit,
} from "@/modules/recruitment/offboarding-model";
import { demoOnboarding } from "@/modules/onboarding/fixtures";
import { adoptOnboarding } from "@/modules/recruitment/handoff-model";
const rh: Scope = {
  org: "org-a",
  user: "hr",
  name: "RH fictício",
  key: "hr",
  contract: "CLT",
  rh: true,
  director: false,
  leader: false,
};
const director = { ...rh, rh: false, director: true, user: "director" },
  leader = { ...rh, rh: false, leader: true, user: "leader" };
const s0 = () => demoWorkflow(rh),
  app = "rec-application-0",
  person = "rec-candidate-0";
const stage = (s: State, kind: string) =>
  s.central!.stages.find((st) => st.kind === kind)!.id;
const move = (s: State, kind: string, id = app) =>
  moveCentral(s, rh, [id], stage(s, kind), "Movimento fictício revisado.");
function intake(s = s0(), email = "novo@exemplo.invalid") {
  return submitIntake(
    s,
    rh,
    {
      "field-name": "Novo Fictício",
      "field-email": email,
      "field-sector": "Arquitetura",
      "field-experience": "Júnior: até 3 anos de experiência",
    },
    {},
    true,
  );
}
function pending(contract: Admission["contract"] = "CLT") {
  let s = intake();
  const a = currentCycles(s)[0];
  s = attachVacancy(s, rh, [a.id], "", contract);
  return move(s, "hired", a.id);
}
function ready(contract: Admission["contract"] = "CLT") {
  let s = pending(contract);
  const x = s.admissions![0];
  const file = {
    id: "test",
    name: "contrato-ficticio.pdf",
    type: "application/pdf",
    size: 50,
    url: "blob:ficticio",
  };
  s = saveAdmission(s, rh, {
    ...x,
    start: dateNow(),
    amount: 100000,
    externalRef: "FLASH-DEMO",
    externalConfirmed: true,
    signedOn: dateNow(),
    answers: { "contract-party": "Instituição / prestação fictícia" },
    files: Object.fromEntries(x.rules.map((d) => [d.id, file])),
  });
  return s;
}
function hired(contract: Admission["contract"] = "CLT") {
  const s = ready(contract);
  return finalizeAdmission(s, rh, s.admissions![0].id, true, ["name"]);
}
const offscope = {
  journey: "offboarding" as const,
  mode: "rh" as const,
  user: rh.user,
  name: rh.name,
  key: "off-demo",
};
describe("Recrutamento central: preservação e entrada", () => {
  it("atualiza dados antigos preservando respostas, instrumentos, visitas originais e definições de campos", () => {
    const old = recruitmentFixture(rh),
      s = upgradeWorkflow(old, rh);
    expect(s.candidates).toEqual(old.candidates);
    expect(s.assessments).toEqual(old.assessments);
    expect(s.notes).toEqual(old.notes);
    for (const a of old.applications) {
      const next = s.applications.find((x) => x.id === a.id)!;
      expect(next.answers).toEqual(a.answers);
      expect(next.legacy?.stages).toEqual(a.stages);
      expect(next.legacy?.visits).toEqual(a.visits);
    }
    expect(upgradeWorkflow(s, rh)).toBe(s);
  });
  it("inclui formulário geral em Entrada sem vaga e evita duplicidade por e-mail", () => {
    const s = intake(),
      a = currentCycles(s)[0];
    expect(a.job).toBe("");
    expect(a.stage).toBe(stage(s, "entry"));
    expect(intake(s).candidates.length).toBe(s.candidates.length);
    expect(intake(s).applications.length).toBe(s.applications.length);
  });
  it("entrada continua correta após reordenar colunas", () => {
    let s = s0();
    s = savePipeline(s, rh, {
      ...s.central!,
      stages: [...s.central!.stages].reverse(),
    });
    expect(currentCycles(intake(s))[0].stage).toBe(stage(s, "entry"));
  });
  it("não aceita formulário sem finalidade e campos obrigatórios", () => {
    expect(() => submitIntake(s0(), rh, {}, {}, false)).toThrow();
    expect(() => submitIntake(s0(), rh, {}, {}, true)).toThrow();
  });
  it("permite pular e retornar etapas com história real das passagens", () => {
    let s = move(s0(), "qualified");
    expect(s.applications.find((a) => a.id === app)!.visits.at(-1)?.stage).toBe(
      stage(s, "qualified"),
    );
    s = move(s, "entry");
    expect(
      s.relationships!.filter((r) => r.application === app).length,
    ).toBeGreaterThan(2);
  });
  it("somente Banco selecionado aparece no Banco; reprovação não inclui", () => {
    let s = move(s0(), "bank");
    expect(
      selectProcesses(s, clearWorkflowFilters(), true).some(
        (a) => a.id === app,
      ),
    ).toBe(true);
    s = move(s, "rejected");
    expect(
      selectProcesses(s, clearWorkflowFilters(), true).some(
        (a) => a.id === app,
      ),
    ).toBe(false);
  });
  it("reativa Banco preservando ciclo e proveniência", () => {
    let s = move(s0(), "bank");
    const count = s.applications.length;
    s = reactivateCycle(s, rh, app, "Nova oportunidade");
    expect(s.applications.length).toBe(count);
    expect(s.applications.find((a) => a.id === app)?.fromBank).toBe(true);
  });
  it("nível RH não substitui autodeclaração e filtros combinam", () => {
    const s = validateExperience(
      s0(),
      rh,
      person,
      "Sênior: 7 anos ou mais de experiência",
    );
    expect(s.candidates.find((p) => p.id === person)?.experience).not.toMatch(
      /^Sênior/,
    );
    expect(
      selectProcesses(s, {
        ...clearWorkflowFilters(),
        level: "Sênior",
        city: "São Paulo",
        area: "Arquitetura",
      }).map((a) => a.candidate),
    ).toContain(person);
  });
  it("não permite remover etapa ocupada nem funções obrigatórias", () => {
    const s = s0();
    expect(() =>
      savePipeline(s, rh, {
        ...s.central!,
        stages: s.central!.stages.filter((st) => st.kind !== "entry"),
      }),
    ).toThrow();
  });
  it("movimento em lote inválido é atômico", () => {
    const s = s0(),
      before = structuredClone(s);
    expect(() =>
      moveCentral(s, rh, [app, "ausente"], stage(s, "bank"), "teste"),
    ).toThrow();
    expect(s).toEqual(before);
  });
  it("automação por etapa é registrada sem decisão externa", () => {
    let s = s0();
    s = saveRule(s, rh, {
      id: "r-stage",
      name: "Aviso",
      trigger: "Mudança de etapa",
      action: "Gerar notificação local",
      stage: stage(s, "qualified"),
      sector: "",
      contract: "",
      active: true,
    });
    s = move(s, "qualified");
    expect(s.logs.some((l) => l.rule === "r-stage")).toBe(true);
    expect(s.admissions).toHaveLength(0);
  });
});
describe("Admissão e formalização RH", () => {
  it.each(["CLT", "Estágio", "PJ"] as const)(
    "cria uma admissão por ciclo de %s sem ativar vínculo",
    (contract) => {
      let s = pending(contract);
      const a = s.applications.find(
        (a) => a.id === s.admissions![0].application,
      )!;
      expect(a.status).toBe("Ativa");
      expect(s.employments).toHaveLength(0);
      s = moveCentral(s, rh, [a.id], stage(s, "entry"), "Revisão");
      s = move(s, "hired", a.id);
      expect(s.admissions).toHaveLength(1);
      expect(s.admissions![0].contract).toBe(contract);
    },
  );
  it.each(["CLT", "Estágio", "PJ"] as const)(
    "formaliza %s apenas com confirmação e pré-requisitos",
    (contract) => {
      let s = ready(contract);
      const id = s.admissions![0].id;
      expect(() => finalizeAdmission(s, rh, id, false, ["name"])).toThrow();
      s = finalizeAdmission(s, rh, id, true, ["name"]);
      expect(s.employments![0].status).toBe("Ativo");
      expect(s.handoffs).toHaveLength(1);
      expect(Object.keys(s.handoffs[0].fields)).toEqual(["name"]);
      expect(finalizeAdmission(s, rh, id, true, ["name"])).toBe(s);
    },
  );
  it("CLT exige referência e confirmação externa, sem coleta Flash interna", () => {
    const s = pending();
    expect(s.admissions![0].form.fields).toHaveLength(0);
    expect(() =>
      finalizeAdmission(s, rh, s.admissions![0].id, true, ["name"]),
    ).toThrow(/Flash/);
  });
  it("PJ exige assinatura/documentos e estágio exige dados próprios", () => {
    for (const contract of ["PJ", "Estágio"] as const) {
      const s = pending(contract);
      expect(() =>
        finalizeAdmission(s, rh, s.admissions![0].id, true, ["name"]),
      ).toThrow();
    }
  });
  it("não finaliza candidato removido da aprovação nem por simples arrastar final", () => {
    let s = ready();
    const x = s.admissions![0];
    s = moveAdmission(
      s,
      rh,
      x.id,
      x.stages.find((st) => st.purpose === "final")!.id,
    );
    expect(s.employments).toHaveLength(0);
    s = move(s, "rejected", x.application);
    expect(() => finalizeAdmission(s, rh, x.id, true, ["name"])).toThrow(
      /aprovação/,
    );
  });
  it("cancelamento de admissão é preservado e reativação gera novo ciclo", () => {
    let s = pending("PJ");
    const x = s.admissions![0];
    s = moveAdmission(
      s,
      rh,
      x.id,
      x.stages.find((st) => st.purpose === "canceled")!.id,
    );
    s = reactivateCycle(s, rh, x.application, "Retomar em novo processo");
    const a = currentCycles(s).find((a) => a.candidate === x.candidate)!;
    expect(a.id).not.toBe(x.application);
    s = move(s, "hired", a.id);
    expect(s.admissions).toHaveLength(2);
    expect(s.admissions!.find((a) => a.id === x.id)?.state).toBe("Cancelada");
  });
  it("não sobrescreve identidade ou snapshots por alteração de acompanhamento", () => {
    const s = ready(),
      x = s.admissions![0];
    const next = saveAdmission(s, rh, {
      ...x,
      token: "FORJADO",
      rules: [],
      state: "Confirmada",
      created: "1990-01-01",
    });
    expect(next.admissions![0].token).toBe(x.token);
    expect(next.admissions![0].state).toBe("Aberta");
    expect(next.admissions![0].created).toBe(x.created);
  });
  it("impede caminho antigo de formalização e criação de vínculo repetido", () => {
    const s = hired();
    expect(() => formalize(s, rh, s.admissions![0].application, true)).toThrow(
      /Admissão/,
    );
    expect(() =>
      reactivateCycle(s, rh, s.admissions![0].application, "Reingresso"),
    ).toThrow(/ativo/);
    expect(() => move(s, "entry", s.admissions![0].application)).toThrow(
      /formalizada/,
    );
  });
  it("recusa exige motivo e conserva proposta e ciclo", () => {
    let s = decide(s0(), rh, app, true, "Continuidade aprovada");
    s = saveOffer(s, rh, app, 100000, "Proposta fictícia");
    s = offerState(s, rh, s.offers[0].id, "Enviada (simulação)");
    expect(() => recordDeclinedOffer(s, rh, s.offers[0].id, "")).toThrow();
    s = recordDeclinedOffer(s, rh, s.offers[0].id, "Condições contratuais");
    expect(s.offers[0].state).toBe("Recusada");
    expect(s.applications.find((a) => a.id === app)?.stage).toBe(
      stage(s, "declined"),
    );
  });
  it("reativação de proposta recusada abre novo ciclo e conserva negociação anterior", () => {
    let s = decide(s0(), rh, app, true, "Parecer fictício");
    s = saveOffer(s, rh, app, 100000, "Proposta fictícia");
    s = offerState(s, rh, s.offers[0].id, "Enviada (simulação)");
    s = recordDeclinedOffer(s, rh, s.offers[0].id, "Condições recusadas");
    const oldId = s.offers[0].id;
    s = reactivateCycle(s, rh, app, "Nova oportunidade");
    expect(s.applications.find((a) => a.id === app)?.historical).toBe(true);
    expect(s.offers.find((o) => o.id === oldId)?.state).toBe("Recusada");
    expect(currentCycles(s).find((a) => a.candidate === person)?.id).not.toBe(
      app,
    );
  });
  it("formalização não contorna recusa ou altera valor de proposta aceita", () => {
    let s = move(s0(), "hired");
    const x = s.admissions![0];
    s = saveAdmission(s, rh, {
      ...x,
      externalRef: "FLASH-FICTICIO",
      externalConfirmed: true,
      amount: 100000,
    });
    s = saveOffer(s, rh, app, 200000, "Proposta fictícia");
    s = offerState(s, rh, s.offers[0].id, "Enviada (simulação)");
    s = offerState(s, rh, s.offers[0].id, "Aceita");
    expect(() => finalizeAdmission(s, rh, x.id, true, ["name"])).toThrow(
      /valor/,
    );
  });
  it("vagas contam apenas formalizações RH, inclusive múltiplas posições", () => {
    let s = s0();
    s = move(s, "hired");
    expect(vacancyStats(s, "rec-job-0").hires).toHaveLength(0);
    const x = s.admissions![0];
    s = saveAdmission(s, rh, {
      ...x,
      externalConfirmed: true,
      externalRef: "FLASH-LOCAL",
      amount: 100000,
    });
    s = finalizeAdmission(s, rh, x.id, true, ["name"]);
    expect(vacancyStats(s, "rec-job-0").remaining).toBe(1);
    expect(s.jobs[0].filledAt).toBeUndefined();
  });
});
describe("Integrações demonstrativas e permissões", () => {
  it("Onboarding exige confirmação RH e não repete cadastro", () => {
    const s = hired(),
      c = { mode: "rh" as const, user: rh.user, name: rh.name, key: "onb" },
      target = demoOnboarding(c);
    const next = adoptOnboarding(target, s, rh, s.handoffs[0].id);
    expect(next.processes.length).toBe(target.processes.length + 1);
    expect(adoptOnboarding(next, s, rh, s.handoffs[0].id)).toBe(next);
  });
  it("Offboarding inicia do módulo existente; arquivamento não encerra, conclusão explícita encerra", () => {
    let s = hired();
    const target = demoOffboarding(offscope),
      next = startRecruitmentOffboarding(
        target,
        s,
        rh,
        s.employments![0].id,
        "Voluntário",
      ),
      p = next.processes[0];
    expect(s.employments![0].status).toBe("Ativo");
    expect(
      startRecruitmentOffboarding(
        next,
        s,
        rh,
        s.employments![0].id,
        "Voluntário",
      ),
    ).toBe(next);
    expect(() =>
      confirmRecruitmentExit(s, rh, { ...p, archived: true }, dateNow(), true),
    ).toThrow();
    expect(() => confirmRecruitmentExit(s, rh, p, dateNow(), true)).toThrow(
      /atividades/,
    );
    const done = {
      ...p,
      institutional: p.institutional.map((st) => ({
        ...st,
        tasks: st.tasks.map((t) => ({ ...t, done: true })),
      })),
      technical: p.technical.map((st) => ({
        ...st,
        tasks: st.tasks.map((t) => ({ ...t, done: true })),
      })),
    };
    s = confirmRecruitmentExit(s, rh, done, dateNow(), true);
    expect(s.employments![0].status).toBe("Encerrado");
    expect(s.admissions![0].state).toBe("Confirmada");
    expect(s.relationships!.at(-1)?.kind).toBe("Desligamento");
    const oldApp = s.admissions![0].application,
      oldPerson = s.employments![0].candidate;
    s = reactivateCycle(s, rh, oldApp, "Novo processo");
    expect(s.applications.find((a) => a.id === oldApp)?.historical).toBe(true);
    expect(
      currentCycles(s).find((a) => a.candidate === oldPerson)?.id,
    ).not.toBe(oldApp);
  });
  it("RH deve revisar elegibilidade antes de nova formalização para ex-profissional", () => {
    const s = rehireEligibility(
      s0(),
      rh,
      person,
      "Não elegível",
      "Revisão documentada",
    );
    expect(s.candidates.find((p) => p.id === person)?.rehire?.reason).toBe(
      "Revisão documentada",
    );
  });
  it("nega organização e identidades sem papel; liderança somente designados sem privacidade", () => {
    const s = s0();
    expect(() =>
      moveCentral(
        s,
        { ...rh, org: "outra" },
        [app],
        stage(s, "hired"),
        "teste",
      ),
    ).toThrow();
    expect(() =>
      moveCentral(s, leader, [app], stage(s, "hired"), "teste"),
    ).toThrow();
    expect(() =>
      moveCentral(s, director, [app], stage(s, "hired"), "teste"),
    ).toThrow();
    let next = assign(s, rh, app, leader.user, false, false);
    next = projectWorkflow(next, leader);
    expect(
      next.applications.every((a) => a.assigned.includes(leader.user)),
    ).toBe(true);
    expect(next.admissions).toHaveLength(0);
    expect(next.relationships).toHaveLength(0);
    expect(next.applications[0].legacy).toBeUndefined();
    expect(next.templates).toHaveLength(0);
    expect(next.jobs.every((j) => j.budget === undefined)).toBe(true);
  });
  it("Diretoria recebe projeção gerencial sem documentos ou novas notas privadas", () => {
    const s = projectWorkflow(ready(), director);
    expect(
      s.candidates.every((p) => !p.email && !p.rehire && !p.validatedLevel),
    ).toBe(true);
    expect(s.admissions![0].token).toBe("");
    expect(s.admissions![0].files).toEqual({});
    expect(s.central!.admissionStages.PJ.every((st) => !st.fields.length)).toBe(
      true,
    );
    expect(workflowAllowed(director, "admissao")).toBe(false);
    expect(workflowAllowed(leader, "vagas")).toBe(false);
  });
  it("anonimização também elimina novos anexos e relacionamento privados", () => {
    let s = ready("PJ");
    const id = s.admissions![0].candidate;
    s = workflowErase(s, rh, id, "Retenção teste");
    expect(s.admissions![0].files).toEqual({});
    expect(s.relationships!.some((r) => r.candidate === id)).toBe(false);
  });
  it("Match avulso tem evidências, pesos configuráveis e não movimenta", () => {
    const s = s0(),
      criteria = [
        {
          id: "only",
          field: "Competências" as const,
          expected: "BIM",
          weight: 10,
          mandatory: true,
        },
      ];
    const next = analyzeRequirements(s, rh, [person], criteria);
    expect(next.analyses[0].result.criteria).toHaveLength(1);
    expect(next.applications).toEqual(s.applications);
  });
  it("indicadores respeitam passagens, formalização e ausência de coorte madura", () => {
    const s = hired(),
      m = recruitmentInsights(s, clearWorkflowFilters());
    expect(m.hires).toHaveLength(1);
    expect(m.retention.every((r) => r.total === 0)).toBe(true);
    expect(m.funnel.some((st) => st.skipped > 0)).toBe(true);
    expect(m.acceptance).toBeNull();
    expect(
      recruitmentInsights(s, { ...clearWorkflowFilters(), from: "2090-01-01" })
        .hires,
    ).toHaveLength(0);
  });
  it("remoção futura de etapa vazia preserva motivos históricos nos indicadores", () => {
    let s = move(s0(), "rejected");
    s = reactivateCycle(s, rh, app, "Novo ciclo");
    const rejected = stage(s, "rejected");
    s = savePipeline(s, rh, {
      ...s.central!,
      stages: s.central!.stages.filter((st) => st.id !== rejected),
    });
    expect(
      recruitmentInsights(s, clearWorkflowFilters()).rejections.some(
        ([reason]) => reason === "Movimento fictício revisado.",
      ),
    ).toBe(true);
  });
  it("não altera snapshots de formulários já recebidos", () => {
    const s = intake();
    const a = currentCycles(s)[0];
    expect(a.form.fields).toEqual(
      s.forms.find((f) => f.id === s.central!.formId)?.fields,
    );
    expect(baseForm().fields.length).toBeGreaterThan(5);
  });
});
