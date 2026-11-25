import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { demoAcademy } from "@/modules/academy/fixtures";
import { type Scope } from "@/modules/career/model";
import { createAcademyLink } from "@/modules/academy/links";
import {
  allLessons,
  projection,
  own,
  visibleCourse,
  activeLicense,
  safeUrl,
  saveCourse,
  publishCourse,
  submitCourse,
  duplicateCourse,
  archiveCourse,
  enroll,
  checkQuiz,
  completeLesson,
  submitProof,
  reviewProof,
  saveFinance,
  assignLicense,
  releaseLicense,
  saveTrack,
  publishTrack,
  trackAllows,
  joinTrack,
  recommend,
  registerSession,
  addParticipant,
  markAttendance,
  closeSession,
  saveRecording,
  prepareRecording,
  sessionEnded,
  type AcademyState,
} from "@/modules/academy/model";
const rh: Scope = {
  user: "hr-demo",
  name: "RH fictício",
  org: "org-a",
  rh: true,
  director: false,
  leader: false,
  contract: "CLT",
  key: "rh",
};
const employee: Scope = { ...rh, rh: false, user: "employee", key: "employee" };
const leader: Scope = {
  ...employee,
  leader: true,
  user: "leader",
  key: "leader",
};
const pj: Scope = { ...employee, contract: "PJ", user: "pj", key: "pj" };
const s0 = () => demoAcademy(rh);
const course = (s: AcademyState, n = 0) =>
  s.courses.find((x) => x.id === `academy-course-${n}`)!;
const my = (s: AcademyState, n = 0) =>
  s.enrollments.find(
    (e) => e.person === s.people[0].id && e.course === `academy-course-${n}`,
  )!;
const future = "academy-course-4:session-v1",
  past = "academy-course-5:session-v1";
function finishInternal(s: AcademyState, c: Scope, n: number) {
  s = enroll(s, c, course(s, n).id);
  const e = my(s, n);
  for (const l of allLessons(e.snapshot)) {
    const answers = Object.fromEntries(
      l.blocks
        .filter((b) => b.question)
        .map((b) => [b.id, b.question!.correct]),
    );
    if (Object.keys(answers).length) s = checkQuiz(s, c, e.id, l.id, answers);
    s = completeLesson(s, c, e.id, l.id);
  }
  return s;
}
describe("Academy identity, organization and scoped projections", () => {
  it("rejects all cross-organization mutations and projections", () => {
    const s = s0(),
      c = { ...rh, org: "org-b" };
    for (const fn of [
      () => projection(s, c),
      () => enroll(s, c, course(s).id),
      () => saveCourse(s, c, "new", course(s).published!),
      () => saveFinance(s, c, s.finance![0]),
      () => joinTrack(s, c, s.tracks[0].id),
    ])
      expect(fn).toThrow(/Organização/);
  });
  it("learners receive own progress only and never finance, other proofs or drafts", () => {
    const s = demoAcademy(employee);
    expect(s.people).toHaveLength(1);
    expect(s.finance).toBeUndefined();
    expect(s.enrollments.every((e) => e.person === s.people[0].id)).toBe(true);
    expect(s.courses.every((c) => !c.draft)).toBe(true);
    expect(JSON.stringify(s)).not.toContain("180000");
  });
  it("leadership receives own CLT/intern team metadata, never private lesson bodies, proofs or finance", () => {
    const s = demoAcademy(leader);
    expect(s.people.map((p) => p.id)).toEqual([
      "career-person-0",
      "career-person-1",
      "career-person-2",
      "career-person-3",
    ]);
    expect(s.finance).toBeUndefined();
    for (const e of s.enrollments.filter((e) => e.person !== s.people[0].id)) {
      expect(e.snapshot.modules).toEqual([]);
      expect(e.proof).toBeUndefined();
      expect(e.attempts).toEqual([]);
      expect(e.totalLessons).toBeGreaterThan(0);
    }
  });
  it("PJ sees only authorized service-relevant courses and optional tracks", () => {
    const s = demoAcademy(pj);
    expect(s.courses.every((x) => x.published?.audience.serviceRelevant)).toBe(
      true,
    );
    expect(s.tracks.every((t) => t.serviceOptional)).toBe(true);
    expect(s.courses.some((x) => x.id === "academy-course-2")).toBe(false);
    expect(() => enroll(s, pj, "academy-course-2")).toThrow();
  });
  it("managerial PJ has management but their own learning still follows PJ audience", () => {
    const c = { ...rh, contract: "PJ" as const },
      s = demoAcademy(c);
    expect(s.finance).toBeDefined();
    expect(visibleCourse(s, c, course(s, 2))).toBe(false);
    expect(() => enroll(s, c, course(s, 2).id)).toThrow();
  });
  it("does not broaden an author course's restricted people audience while projecting", () => {
    let s = demoAcademy(leader);
    const d = structuredClone(course(s).published!);
    d.audience.people = ["not-the-actor"];
    s = {
      ...s,
      courses: [{ ...course(s), author: leader.user, published: d }],
    };
    const view = projection(s, leader);
    expect(view.courses[0].published!.audience.people.length).toBeGreaterThan(
      0,
    );
    expect(visibleCourse(view, leader, view.courses[0])).toBe(false);
  });
  it("cannot complete another person's enrollment", () => {
    const s = s0();
    expect(() =>
      completeLesson(s, rh, "academy-enrollment-2-1", "lesson-1-1"),
    ).toThrow(/autorizado/);
  });
});
describe("Academy content versions, authorship and publication", () => {
  it("leader authors a proposal but cannot publish or edit another author", () => {
    let s = demoAcademy(leader);
    s = saveCourse(s, leader, "proposal-new", course(s).published!);
    s = submitCourse(s, leader, "proposal-new");
    expect(s.courses[0].state).toBe("Em aprovação");
    expect(() => publishCourse(s, leader, "proposal-new")).toThrow(/exclusiva/);
    expect(() =>
      saveCourse(s, leader, course(s).id, course(s).published!),
    ).toThrow(/restrita/);
  });
  it("ordinary professional cannot author, publish, finance or recommend", () => {
    const s = demoAcademy(employee);
    for (const fn of [
      () => saveCourse(s, employee, "x", course(s).published!),
      () => publishCourse(s, employee, course(s).id),
      () =>
        saveFinance(s, employee, {
          course: course(s).id,
          licenses: 1,
          amount: 0,
          date: "2026-01-01",
          validUntil: "2099-12-31",
        }),
      () => recommend(s, employee, s.people[0].id, course(s).id, "Test"),
    ])
      expect(fn).toThrow();
  });
  it.each([rh, { ...rh, rh: false, director: true }])(
    "RH/Director publishes with immutable existing enrollment snapshots",
    (c) => {
      let s = demoAcademy(c);
      const old = structuredClone(my(s));
      s = saveCourse(s, c, course(s).id, {
        ...course(s).published!,
        title: "Nova edição",
      });
      expect(course(s).published!.title).toBe(old.snapshot.title);
      s = publishCourse(s, c, course(s).id);
      expect(course(s).version).toBe(2);
      expect(my(s).snapshot.title).toBe(old.snapshot.title);
      const n = s.enrollments.length;
      s = enroll(s, c, course(s).id);
      expect(s.enrollments.length).toBe(n + 1);
      s = enroll(s, c, course(s).id);
      expect(s.enrollments.length).toBe(n + 1);
    },
  );
  it("duplicate never copies investment, grants, enrollments or publication", () => {
    const s = s0(),
      next = duplicateCourse(s, rh, course(s, 3).id);
    expect(next.courses.length).toBe(s.courses.length + 1);
    expect(next.courses[0].published).toBeUndefined();
    expect(next.finance).toEqual(s.finance);
    expect(next.grants).toEqual(s.grants);
    expect(next.enrollments).toEqual(s.enrollments);
  });
  it("archive stops access while keeping artifacts and history", () => {
    const s = s0(),
      next = archiveCourse(s, rh, course(s, 1).id);
    expect(visibleCourse(next, rh, course(next, 1))).toBe(false);
    expect(next.enrollments).toEqual(s.enrollments);
    expect(next.artifacts).toEqual(s.artifacts);
  });
  it("rejects credentials and script URLs and never publishes empty media", () => {
    for (const url of [
      "javascript:alert(1)",
      "https://user:pass@example.com",
      "https://example.com?token=x",
      "https://example.com?senha=x",
    ])
      expect(safeUrl(url)).toBe(false);
    let s = s0();
    const d = structuredClone(course(s, 3).published!);
    d.external!.instructions = "senha: secret";
    expect(() => saveCourse(s, rh, "x", d)).toThrow(/credenciais/);
    const media = structuredClone(course(s).published!);
    media.modules[0].lessons[0].blocks = [
      { id: "empty-video", kind: "Vídeo", text: "Video" },
    ];
    s = saveCourse(s, rh, "empty", media);
    expect(() => publishCourse(s, rh, "empty")).toThrow(/mídia/);
  });
});
describe("Licenses, evidence review and learning completion", () => {
  it("preserves investment/assignment history and capacity", () => {
    let s = s0();
    const id = course(s, 3).id;
    s = assignLicense(s, rh, id, "career-person-2");
    expect(() => assignLicense(s, rh, id, "career-person-2")).toThrow(
      /já atribuída/,
    );
    expect(() => assignLicense(s, rh, id, "career-person-3")).toThrow(
      /disponíveis/,
    );
    expect(() => saveFinance(s, rh, { ...s.finance![0], licenses: 1 })).toThrow(
      /abaixo/,
    );
    const grant = s.grants.find((g) => g.person === "career-person-2")!;
    s = releaseLicense(s, rh, grant.id);
    expect(s.grants.find((g) => g.id === grant.id)!.releasedAt).toBeDefined();
    s = assignLicense(s, rh, id, "career-person-3");
    expect(s.grants.filter((g) => g.active)).toHaveLength(3);
  });
  it("expires licenses including private learner projections and hides access instructions", () => {
    const s = s0();
    s.finance = s.finance!.map((f) => ({ ...f, validUntil: "2000-01-01" }));
    const view = projection(s, { ...rh, rh: false });
    expect(activeLicense(view, course(s, 3).id, s.people[0].id)).toBe(false);
    expect(course(view, 3).published!.external!.url).toBe("");
    expect(() => enroll(s, rh, course(s, 3).id)).toThrow(/licença/);
  });
  it("rejects license allocations to outsiders, ineligible audiences and leaders", () => {
    const s = s0();
    expect(() => assignLicense(s, rh, course(s, 3).id, "other-org")).toThrow();
    expect(() =>
      assignLicense(s, leader, course(s, 3).id, "career-person-2"),
    ).toThrow();
  });
  it("requires all quiz answers and configured correctness before marking complete", () => {
    let s = s0();
    const e = my(s),
      l = allLessons(e.snapshot)[1];
    expect(() => completeLesson(s, rh, e.id, l.id)).toThrow(/questionário/);
    expect(() => checkQuiz(s, rh, e.id, l.id, {})).toThrow(/todas/);
    s = checkQuiz(s, rh, e.id, l.id, { "quiz-0": 1 });
    expect(my(s).attempts[0].passed).toBe(false);
    expect(() => completeLesson(s, rh, e.id, l.id)).toThrow();
    s = checkQuiz(s, rh, e.id, l.id, { "quiz-0": 0 });
    s = completeLesson(s, rh, e.id, l.id);
    expect(my(s).state).toBe("Concluído");
    expect(s.artifacts.filter((a) => a.enrollment === e.id)).toHaveLength(1);
    expect(() => completeLesson(s, rh, e.id, l.id)).toThrow(/editável/);
  });
  it("configures certificate/internal record/none independently and uses no Hall state", () => {
    let s = s0();
    const n = s.artifacts.length;
    s = finishInternal(s, rh, 7);
    expect(my(s, 7).state).toBe("Concluído");
    expect(s.artifacts).toHaveLength(n);
    expect(s).not.toHaveProperty("awards");
    expect(s).not.toHaveProperty("movements");
    expect(
      s.artifacts.some((a) => a.mode === "Registro interno de aprendizagem"),
    ).toBe(true);
  });
  it("external evidence requires RH and blocks own approval; supplements preserve original proofs and reviewer comments", () => {
    let s = s0();
    const e = my(s, 3);
    s = submitProof(s, rh, e.id, "Primeira evidência");
    expect(my(s, 3).state).toBe("Aguardando RH");
    expect(() => reviewProof(s, rh, e.id, true, "ok")).toThrow(/própria/);
    const dir = {
      ...rh,
      user: "other-director",
      rh: false,
      director: true,
      name: "Diretoria fictícia",
    };
    s = reviewProof(s, dir, e.id, false, "Complementar referência");
    s = submitProof(s, rh, e.id, "Complementação");
    expect(my(s, 3).proofHistory![0].text).toBe("Primeira evidência");
    expect(
      my(s, 3).events.some((e) => e.text.includes("Complementar referência")),
    ).toBe(true);
    s = reviewProof(s, dir, e.id, true, "Validado");
    expect(my(s, 3).state).toBe("Concluído");
    expect(s.artifacts.some((a) => a.enrollment === e.id)).toBe(true);
  });
  it("practical activity requires lessons and separate RH review", () => {
    let s = s0();
    s = enroll(s, rh, course(s, 8).id);
    expect(() => submitProof(s, rh, my(s, 8).id, "Proof")).toThrow(/aulas/);
    s = finishInternal(s, rh, 8);
    expect(my(s, 8).state).toBe("Em andamento");
    s = submitProof(s, rh, my(s, 8).id, "Aplicação prática fictícia");
    expect(my(s, 8).state).toBe("Aguardando RH");
  });
  it("team recommendations exclude PJ and out-of-team people", () => {
    let s = demoAcademy(leader);
    s = recommend(
      s,
      leader,
      "career-person-1",
      course(s).id,
      "Revisar entregas",
    );
    expect(s.recommendations[0].person).toBe("career-person-1");
    expect(() =>
      recommend(s, leader, "career-person-4", course(s).id, "Test"),
    ).toThrow();
    expect(() =>
      recommend(s, leader, "career-person-5", course(s).id, "Test"),
    ).toThrow();
  });
});
describe("Tracks, live agenda and canonical integration", () => {
  it("track edits keep the public version and joined sequence snapshots", () => {
    let s = s0();
    s.trackJoins = [];
    s = joinTrack(s, rh, s.tracks[0].id);
    const original = [...s.tracks[0].courseIds],
      id = s.tracks[0].id;
    s = saveTrack(s, rh, {
      ...s.tracks[0],
      name: "Draft title",
      courseIds: [...original].reverse(),
    });
    expect(projection(s, { ...rh, rh: false }).tracks[0].name).toBe(
      "Entregas com qualidade",
    );
    s = publishTrack(s, rh, id);
    expect(s.tracks[0].name).toBe("Draft title");
    expect(s.trackJoins[0].courseIds).toEqual(original);
    expect(joinTrack(s, rh, id).trackJoins).toHaveLength(1);
  });
  it("rejects nonoptional PJ tracks and nonservice courses", () => {
    const s = s0(),
      t = s.tracks[0];
    expect(() => saveTrack(s, rh, { ...t, serviceOptional: false })).toThrow(
      /opcionais/,
    );
    expect(() =>
      saveTrack(s, rh, { ...t, courseIds: ["academy-course-2"] }),
    ).toThrow(/empregados/);
    expect(trackAllows(demoAcademy(pj), pj, s.tracks[1])).toBe(false);
  });
  it("registers live attendance idempotently for the current version and refuses early closure", () => {
    let s = s0();
    s = registerSession(s, rh, future);
    s = registerSession(s, rh, future);
    expect(
      s.sessions[0].participants.filter((p) => p === "career-person-0"),
    ).toHaveLength(1);
    expect(() => closeSession(s, rh, future)).toThrow(/término/);
    s = {
      ...s,
      courses: s.courses.map((x) =>
        x.id === "academy-course-4" ? { ...x, version: 2 } : x,
      ),
    };
    expect(() => registerSession(s, rh, future)).toThrow(/disponível/);
  });
  it("manager adds a participant without substituting the actor identity", () => {
    const s = addParticipant(s0(), rh, future, "career-person-3");
    const e = s.enrollments.find(
      (e) => e.person === "career-person-3" && e.course === "academy-course-4",
    )!;
    expect(e.events[0].by).toBe(rh.name);
    expect(e.person).not.toBe(own(s, rh)!.id);
    expect(() => addParticipant(s, rh, future, "career-person-4")).toThrow(
      /incompatível/,
    );
  });
  it("past attendance issues only demo participation; approved recording reuses the same content", () => {
    let s = s0();
    const count = s.courses.length;
    s = markAttendance(s, rh, past, "career-person-2", true);
    expect(sessionEnded(s.sessions.find((x) => x.id === past)!)).toBe(true);
    s = closeSession(s, rh, past);
    expect(
      s.artifacts.filter((a) => a.course === "academy-course-5"),
    ).toHaveLength(2);
    expect(() =>
      markAttendance(s, rh, past, "career-person-2", false),
    ).toThrow();
    s = saveRecording(s, rh, past, "/demo/academy/intro.webm");
    s = prepareRecording(s, rh, past);
    expect(s.courses).toHaveLength(count);
    expect(course(s, 5).state).toBe("Em aprovação");
    expect(course(s, 5).published!.kind).toBe("Treinamento ao vivo");
    s = publishCourse(s, rh, course(s, 5).id);
    expect(course(s, 5).published!.kind).toBe("Treinamento gravado");
    expect(s.sessions.find((x) => x.id === past)!.closed).toBe(true);
    expect(
      s.enrollments.find((e) => e.course === "academy-course-5")!.snapshot.kind,
    ).toBe("Treinamento ao vivo");
    expect(() => prepareRecording(s, rh, past)).toThrow(/já foi/);
  });
  it("references store canonical IDs, enforce organization/role/PJ compatibility and do not copy content", () => {
    const s = s0();
    for (const kind of [
      "onboarding",
      "pdi",
      "career",
      "performance",
    ] as const) {
      const link = createAcademyLink(
        s,
        rh,
        course(s).id,
        { id: "destination", name: "Contexto", kind, contract: "CLT" },
        "Recurso recomendado",
      );
      expect(link.course).toBe(course(s).id);
      expect(link).not.toHaveProperty("modules");
    }
    expect(() =>
      createAcademyLink(
        s,
        employee,
        course(s).id,
        { id: "d", kind: "pdi", name: "d" },
        "Test",
      ),
    ).toThrow();
    expect(() =>
      createAcademyLink(
        s,
        leader,
        course(s).id,
        { id: "d", kind: "career", name: "d" },
        "Test",
      ),
    ).toThrow();
    expect(() =>
      createAcademyLink(
        s,
        rh,
        course(s, 2).id,
        { id: "d", kind: "onboarding", name: "d", contract: "PJ" },
        "Test",
      ),
    ).toThrow(/incompatível/);
  });
});
