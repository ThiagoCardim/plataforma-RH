import {
  type Scope,
  type Contract,
  type Person,
  admin,
  assert,
  uid,
  dateNow,
  validDate,
} from "../career/model";
import type { Attachment } from "../documents/model";
export const kinds = [
  "Curso externo",
  "Treinamento gravado",
  "Treinamento ao vivo",
  "Material de aprendizagem",
  "Avaliação de conhecimento",
  "Atividade prática",
] as const;
export type CourseKind = (typeof kinds)[number];
export const documents = [
  "Certificado de conclusão",
  "Comprovante de participação",
  "Registro interno de aprendizagem",
  "Nenhum documento",
] as const;
export type AwardMode = (typeof documents)[number];
export type Block = {
  id: string;
  kind:
    | "Texto"
    | "Vídeo"
    | "Imagem"
    | "Apresentação"
    | "Arquivo"
    | "Link"
    | "Questionário";
  text: string;
  url?: string;
  file?: Attachment;
  question?: { options: string[]; correct: number; requireCorrect: boolean };
};
export type Lesson = { id: string; name: string; blocks: Block[] };
export type Module = { id: string; name: string; lessons: Lesson[] };
export type Audience = {
  contracts: Contract[];
  sectors: string[];
  people: string[];
  serviceRelevant: boolean;
};
export type Cover = {
  theme: "orange" | "ink" | "sand" | "blue" | "green";
  icon: "book" | "layers" | "play" | "compass" | "sparkles";
  image?: string;
};
export type CertificateTemplate = {
  title: string;
  subtitle: string;
  signature: string;
  footer: string;
  color: string;
};
export type CourseData = {
  title: string;
  description: string;
  kind: CourseKind;
  category: string;
  instructor: string;
  difficulty: "Fundamentos" | "Intermediário" | "Avançado";
  minutes: number;
  tags: string[];
  cover: Cover;
  audience: Audience;
  modules: Module[];
  awardMode: AwardMode;
  certificate: CertificateTemplate;
  featured: boolean;
  external?: {
    platform: string;
    vendor: string;
    url: string;
    instructions: string;
  };
  live?: {
    date: string;
    time: string;
    duration: number;
    format: "Online" | "Presencial";
    location: string;
  };
};
export type Event = { id: string; at: string; by: string; text: string };
export type Course = {
  id: string;
  author: string;
  state: "Rascunho" | "Em aprovação" | "Publicado" | "Arquivado";
  draft?: CourseData;
  published?: CourseData;
  version: number;
  events: Event[];
  sourceSession?: string;
};
export type Track = {
  id: string;
  name: string;
  description: string;
  sector: string;
  role: string;
  contracts: Contract[];
  competency: string;
  objective: string;
  serviceOptional: boolean;
  courseIds: string[];
  state: "Rascunho" | "Em aprovação" | "Publicada" | "Arquivada";
  author: string;
  published?: Omit<Track, "published">;
};
export const trackView = (t: Track): Track =>
  t.state === "Publicada" ? t : (t.published ?? t);
export type QuizAttempt = {
  id: string;
  lesson: string;
  answers: Record<string, number>;
  correct: number;
  total: number;
  passed: boolean;
  at: string;
};
export type Enrollment = {
  id: string;
  person: string;
  course: string;
  version: number;
  snapshot: CourseData;
  totalLessons: number;
  completedLessons: string[];
  attempts: QuizAttempt[];
  state:
    | "Em andamento"
    | "Aguardando RH"
    | "Ajustes solicitados"
    | "Concluído"
    | "Não participou";
  joinedAt: string;
  completedAt?: string;
  proof?: { text: string; file?: Attachment; at: string };
  proofHistory?: { text: string; file?: Attachment; at: string }[];
  review?: { by: string; at: string; comment: string };
  events: Event[];
};
export type Grant = {
  id: string;
  person: string;
  course: string;
  active: boolean;
  assignedAt: string;
  releasedAt?: string;
  validUntil?: string;
  by: string;
};
export type FinanceItem = {
  course: string;
  licenses: number;
  amount: number;
  validUntil: string;
  date: string;
  events: Event[];
};
export type LearningArtifact = {
  id: string;
  person: string;
  enrollment: string;
  course: string;
  title: string;
  student: string;
  minutes: number;
  mode: Exclude<AwardMode, "Nenhum documento">;
  template: CertificateTemplate;
  issuedAt: string;
  badge: string;
};
export type Session = {
  id: string;
  course: string;
  version: number;
  title: string;
  instructor: string;
  schedule: NonNullable<CourseData["live"]>;
  audience: Audience;
  participants: string[];
  present: string[];
  closed: boolean;
  recording?: string;
  materials: Block[];
  events: Event[];
};
export type Recommendation = {
  id: string;
  person: string;
  course: string;
  note: string;
  by: string;
  at: string;
};
export type AcademyState = {
  version: 1;
  org: string;
  people: Person[];
  categories: { id: string; name: string; active: boolean }[];
  courses: Course[];
  tracks: Track[];
  enrollments: Enrollment[];
  trackJoins: {
    id: string;
    person: string;
    track: string;
    at: string;
    courseIds?: string[];
    title?: string;
  }[];
  grants: Grant[];
  sessions: Session[];
  artifacts: LearningArtifact[];
  recommendations: Recommendation[];
  finance?: FinanceItem[];
  settings: { headline: string; description: string };
  events: Event[];
};
export const allLessons = (data: CourseData) =>
  data.modules.flatMap((m) => m.lessons);
export const progress = (e: Enrollment) =>
  e.totalLessons
    ? Math.round((e.completedLessons.length / e.totalLessons) * 100)
    : 0;
export const defaultCertificate: CertificateTemplate = {
  title: "YouCon Academy",
  subtitle: "Aprender, compartilhar e transformar.",
  signature: "Equipe de Desenvolvimento · demonstração",
  footer:
    "Documento demonstrativo, sem validade oficial. Não gera promoção ou reconhecimento de desempenho.",
  color: "#c84b05",
};
const event = (c: Scope, text: string): Event => ({
  id: uid(),
  at: new Date().toISOString(),
  by: c.name,
  text,
});
function org(s: AcademyState, c: Scope) {
  assert(s.org === c.org, "Organização não autorizada.");
}
function manage(s: AcademyState, c: Scope) {
  org(s, c);
  assert(admin(c), "Ação exclusiva de RH e Diretoria.");
}
export function own(s: AcademyState, c: Scope) {
  return s.people.find((p) => p.user === c.user && p.org === c.org);
}
export function team(s: AcademyState, c: Scope, p: Person) {
  return (
    s.org === c.org &&
    p.org === c.org &&
    c.leader &&
    p.leader === c.user &&
    p.user !== c.user &&
    p.contract !== "PJ"
  );
}
export function audienceAllows(a: Audience, p: Person) {
  return (
    a.contracts.includes(p.contract) &&
    (!a.sectors.length || a.sectors.includes(p.sector)) &&
    (!a.people.length || a.people.includes(p.id)) &&
    (p.contract !== "PJ" || a.serviceRelevant)
  );
}
export function visibleCourse(
  s: AcademyState,
  c: Scope,
  course: Course,
  p = own(s, c),
) {
  return (
    s.org === c.org &&
    !!p &&
    p.org === c.org &&
    course.state !== "Arquivado" &&
    !!course.published &&
    audienceAllows(course.published.audience, p)
  );
}
export function activeLicense(
  s: AcademyState,
  course: string,
  person: string,
  today = dateNow(),
) {
  const grant = s.grants.some(
    (g) => g.course === course && g.person === person && g.active,
  );
  // Authorized learner projections keep only their assigned grant and validity; no financial data.
  const validity =
    s.finance?.find((f) => f.course === course)?.validUntil ??
    s.grants.find((g) => g.course === course && g.person === person && g.active)
      ?.validUntil;
  return grant && (!validity || validity >= today);
}
export function safeUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      ![...url.searchParams.keys()].some((k) =>
        /password|senha|token|secret|api.?key/i.test(k),
      )
    );
  } catch {
    return false;
  }
}
export function localUrl(value: string) {
  return value.startsWith("blob:") || value.startsWith("/demo/academy/");
}
function validateData(s: AcademyState, d: CourseData, publishing = false) {
  assert(
    d.title.trim() &&
      d.description.trim() &&
      d.instructor.trim() &&
      s.categories.some((c) => c.id === d.category),
    "Informe título, descrição, instrutor e categoria.",
  );
  assert(
    kinds.includes(d.kind) &&
      documents.includes(d.awardMode) &&
      Number.isInteger(d.minutes) &&
      d.minutes > 0 &&
      d.minutes <= 100000,
    "Tipo, documento ou carga horária inválidos.",
  );
  assert(
    d.audience.contracts.length &&
      (!d.audience.contracts.includes("PJ") || d.audience.serviceRelevant),
    "Conteúdo PJ deve ser expressamente pertinente aos serviços.",
  );
  assert(
    d.audience.people.every((id) =>
      s.people.some((p) => p.id === id && p.org === s.org),
    ),
    "Público de outra organização.",
  );
  assert(!d.cover.image || localUrl(d.cover.image), "Use uma capa local.");
  assert(
    /^#[0-9a-fA-F]{6}$/.test(d.certificate.color),
    "Cor do certificado inválida.",
  );
  const lessons = allLessons(d);
  assert(
    lessons.length > 0 &&
      new Set(lessons.map((l) => l.id)).size === lessons.length,
    "Inclua aulas com identificadores distintos.",
  );
  for (const m of d.modules)
    assert(
      m.name.trim() && m.lessons.length,
      "Cada módulo exige nome e aulas.",
    );
  for (const l of lessons) {
    assert(
      l.name.trim() && l.blocks.length,
      "Cada aula exige nome e conteúdo.",
    );
    assert(
      new Set(l.blocks.map((b) => b.id)).size === l.blocks.length,
      "Blocos duplicados.",
    );
    for (const b of l.blocks) {
      if (publishing) {
        if (["Vídeo", "Imagem", "Apresentação", "Arquivo"].includes(b.kind))
          assert(
            b.file || b.url,
            "Adicione o arquivo ou link dos blocos de mídia antes de publicar.",
          );
        if (b.kind === "Link")
          assert(
            b.url && safeUrl(b.url),
            "Configure o link antes de publicar.",
          );
        if (b.kind === "Texto")
          assert(b.text.trim(), "Preencha o texto antes de publicar.");
      }
      if (b.url)
        assert(
          localUrl(b.url) || safeUrl(b.url),
          "URL inválida ou com credenciais.",
        );
      if (b.file)
        assert(
          localUrl(b.file.url) && b.file.size <= 25 * 1024 * 1024,
          "Arquivo deve ser local e ter até 25 MB.",
        );
      if (b.kind === "Questionário")
        assert(
          b.text.trim() &&
            b.question &&
            b.question.options.length >= 2 &&
            b.question.options.every((x) => x.trim()) &&
            Number.isInteger(b.question.correct) &&
            b.question.correct >= 0 &&
            b.question.correct < b.question.options.length,
          "Configure pergunta, alternativas e resposta.",
        );
    }
  }
  if (d.kind === "Avaliação de conhecimento")
    assert(
      lessons.some((l) => l.blocks.some((b) => b.kind === "Questionário")),
      "Avaliação de conhecimento exige questionário.",
    );
  if (d.kind === "Curso externo")
    assert(
      d.external &&
        d.external.platform.trim() &&
        d.external.vendor.trim() &&
        safeUrl(d.external.url) &&
        d.external.instructions.trim() &&
        !/(senha|password|token|secret)\s*[:=]/i.test(d.external.instructions),
      "Configure plataforma, fornecedor e orientações sem senhas, tokens ou credenciais.",
    );
  if (d.kind === "Treinamento ao vivo")
    assert(
      d.live &&
        validDate(d.live.date) &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(d.live.time) &&
        Number.isInteger(d.live.duration) &&
        d.live.duration > 0 &&
        d.live.duration <= 1440 &&
        d.live.location.trim() &&
        (d.live.format !== "Online" || safeUrl(d.live.location)),
      "Configure data, horário de Brasília, duração e local/link válidos.",
    );
}
export function saveCourse(
  s: AcademyState,
  c: Scope,
  id: string,
  d: CourseData,
) {
  org(s, c);
  const old = s.courses.find((v) => v.id === id);
  assert(
    admin(c) || (c.leader && (!old || old.author === c.user)),
    "Criação/edição restrita à gestão ou autor com papel de liderança.",
  );
  assert(!old || old.state !== "Arquivado", "Conteúdo arquivado.");
  validateData(s, d);
  const course: Course = {
    id,
    author: old?.author ?? c.user,
    state: "Rascunho",
    draft: structuredClone(d),
    published: old?.published,
    version: old?.version ?? 0,
    sourceSession: old?.sourceSession,
    events: [
      ...(old?.events ?? []),
      event(
        c,
        "Versão de conteúdo salva como rascunho; publicação anterior preservada.",
      ),
    ],
  };
  return { ...s, courses: [course, ...s.courses.filter((v) => v.id !== id)] };
}
export function submitCourse(s: AcademyState, c: Scope, id: string) {
  org(s, c);
  const x = s.courses.find((x) => x.id === id);
  assert(
    x?.draft &&
      x.state === "Rascunho" &&
      (admin(c) || (c.leader && x.author === c.user)),
    "Rascunho não disponível para envio.",
  );
  return {
    ...s,
    courses: s.courses.map((v) =>
      v.id === id
        ? {
            ...v,
            state: "Em aprovação" as const,
            events: [
              ...v.events,
              event(c, "Conteúdo enviado à aprovação de RH/Diretoria."),
            ],
          }
        : v,
    ),
  };
}
export function publishCourse(s: AcademyState, c: Scope, id: string) {
  manage(s, c);
  const x = s.courses.find((x) => x.id === id);
  assert(
    x?.draft && ["Rascunho", "Em aprovação"].includes(x.state),
    "Conteúdo não está em aprovação.",
  );
  validateData(s, x.draft, true);
  const data = structuredClone(x.draft),
    version = x.version + 1;
  let next: AcademyState = {
    ...s,
    courses: s.courses.map((v) =>
      v.id === id
        ? {
            ...v,
            published: data,
            draft: undefined,
            version,
            state: "Publicado",
            events: [
              ...v.events,
              event(c, "Conteúdo aprovado e publicado explicitamente."),
            ],
          }
        : v,
    ),
  };
  if (data.kind === "Treinamento ao vivo" && data.live) {
    const session: Session = {
      id: `${id}:session-v${version}`,
      course: id,
      version,
      title: data.title,
      instructor: data.instructor,
      schedule: structuredClone(data.live),
      audience: structuredClone(data.audience),
      participants: [],
      present: [],
      closed: false,
      materials: allLessons(data).flatMap((l) =>
        l.blocks.filter((b) =>
          ["Arquivo", "Apresentação", "Link", "Imagem"].includes(b.kind),
        ),
      ),
      events: [event(c, "Agenda criada a partir do conteúdo publicado.")],
    };
    next = { ...next, sessions: [session, ...next.sessions] };
  }
  return next;
}
export function duplicateCourse(s: AcademyState, c: Scope, id: string) {
  org(s, c);
  const x = s.courses.find((x) => x.id === id);
  assert(
    x &&
      (admin(c) ||
        (c.leader && (visibleCourse(s, c, x) || x.author === c.user))),
    "Conteúdo fora do escopo.",
  );
  const data = structuredClone(x.draft ?? x.published!);
  data.title += " · cópia";
  return saveCourse(s, c, uid(), data);
}
export function archiveCourse(s: AcademyState, c: Scope, id: string) {
  org(s, c);
  const x = s.courses.find((x) => x.id === id);
  assert(
    x && (admin(c) || (c.leader && x.author === c.user && !x.published)),
    "Somente gestão arquiva conteúdo publicado.",
  );
  return {
    ...s,
    courses: s.courses.map((v) =>
      v.id === id
        ? {
            ...v,
            state: "Arquivado" as const,
            events: [
              ...v.events,
              event(
                c,
                "Conteúdo arquivado; histórico e conquistas preservados.",
              ),
            ],
          }
        : v,
    ),
  };
}
export function saveCategory(
  s: AcademyState,
  c: Scope,
  category: AcademyState["categories"][number],
) {
  manage(s, c);
  assert(category.name.trim(), "Informe a categoria.");
  return {
    ...s,
    categories: [...s.categories.filter((x) => x.id !== category.id), category],
  };
}
export function saveFinance(
  s: AcademyState,
  c: Scope,
  f: Omit<FinanceItem, "events">,
) {
  manage(s, c);
  assert(s.finance, "Financeiro indisponível.");
  assert(
    s.courses.some((x) => x.id === f.course),
    "Conteúdo não encontrado.",
  );
  assert(
    Number.isSafeInteger(f.amount) &&
      f.amount >= 0 &&
      Number.isInteger(f.licenses) &&
      f.licenses >= 0 &&
      validDate(f.date) &&
      validDate(f.validUntil) &&
      f.date <= f.validUntil,
    "Valores, licenças ou vigência inválidos.",
  );
  assert(
    f.licenses >=
      s.grants.filter((g) => g.course === f.course && g.active).length,
    "Licenças não podem ficar abaixo das atribuições ativas.",
  );
  const old = s.finance.find((x) => x.course === f.course);
  return {
    ...s,
    finance: [
      {
        ...f,
        events: [
          ...(old?.events ?? []),
          event(
            c,
            "Condições demonstrativas de investimento e licenças atualizadas.",
          ),
        ],
      },
      ...s.finance.filter((x) => x.course !== f.course),
    ],
  };
}
export function assignLicense(
  s: AcademyState,
  c: Scope,
  course: string,
  person: string,
) {
  manage(s, c);
  const x = s.courses.find((x) => x.id === course),
    p = s.people.find((p) => p.id === person && p.org === c.org),
    f = s.finance?.find((x) => x.course === course);
  assert(
    x?.published?.kind === "Curso externo" &&
      p &&
      visibleCourse(s, c, x, p) &&
      f &&
      f.validUntil >= dateNow(),
    "Conteúdo, pessoa ou vigência inelegível.",
  );
  assert(
    !s.grants.some(
      (g) => g.course === course && g.person === person && g.active,
    ),
    "Licença já atribuída.",
  );
  assert(
    s.grants.filter((g) => g.course === course && g.active).length < f.licenses,
    "Não há licenças disponíveis.",
  );
  return {
    ...s,
    grants: [
      {
        id: uid(),
        course,
        person,
        active: true,
        assignedAt: new Date().toISOString(),
        validUntil: f.validUntil,
        by: c.name,
      },
      ...s.grants,
    ],
  };
}
export function releaseLicense(s: AcademyState, c: Scope, id: string) {
  manage(s, c);
  const g = s.grants.find((g) => g.id === id);
  assert(g?.active, "Atribuição não encontrada.");
  return {
    ...s,
    grants: s.grants.map((g) =>
      g.id === id
        ? { ...g, active: false, releasedAt: new Date().toISOString() }
        : g,
    ),
  };
}
export function enroll(s: AcademyState, c: Scope, course: string) {
  org(s, c);
  const x = s.courses.find((x) => x.id === course),
    p = own(s, c);
  assert(
    x && p && visibleCourse(s, c, x, p),
    "Conteúdo não autorizado para seu público.",
  );
  if (x.published!.kind === "Curso externo")
    assert(
      activeLicense(s, course, p.id),
      "É necessária uma licença atribuída e vigente.",
    );
  const old = s.enrollments.find(
    (e) => e.course === course && e.person === p.id && e.version === x.version,
  );
  if (old) return s;
  const snapshot = structuredClone(x.published!),
    e: Enrollment = {
      id: uid(),
      course,
      person: p.id,
      version: x.version,
      snapshot,
      totalLessons: allLessons(snapshot).length,
      completedLessons: [],
      attempts: [],
      state: "Em andamento",
      joinedAt: new Date().toISOString(),
      events: [
        event(
          c,
          "Inscrição demonstrativa na versão publicada, sem custo ou aviso real.",
        ),
      ],
    };
  return { ...s, enrollments: [e, ...s.enrollments] };
}
function myEnrollment(s: AcademyState, c: Scope, id: string) {
  org(s, c);
  const e = s.enrollments.find((e) => e.id === id),
    p = own(s, c),
    course = s.courses.find((x) => x.id === e?.course);
  assert(
    e && p && e.person === p.id && course && visibleCourse(s, c, course),
    "Aprendizado não autorizado neste escopo.",
  );
  return e;
}
function changeEnrollment(
  s: AcademyState,
  e: Enrollment,
  patch: Partial<Enrollment>,
  c: Scope,
  text: string,
) {
  return {
    ...s,
    enrollments: s.enrollments.map((v) =>
      v.id === e.id
        ? { ...e, ...patch, events: [...e.events, event(c, text)] }
        : v,
    ),
  };
}
export function checkQuiz(
  s: AcademyState,
  c: Scope,
  id: string,
  lessonId: string,
  answers: Record<string, number>,
) {
  const e = myEnrollment(s, c, id),
    l = allLessons(e.snapshot).find((l) => l.id === lessonId);
  assert(l && e.state !== "Concluído", "Aula não disponível para avaliação.");
  const qs = l.blocks.filter((b) => b.kind === "Questionário");
  assert(
    qs.length &&
      qs.every(
        (b) =>
          b.question &&
          Number.isInteger(answers[b.id]) &&
          answers[b.id] >= 0 &&
          answers[b.id] < b.question.options.length,
      ),
    "Responda a todas as perguntas.",
  );
  const attempt: QuizAttempt = {
    id: uid(),
    lesson: lessonId,
    answers: structuredClone(answers),
    correct: qs.filter((b) => answers[b.id] === b.question!.correct).length,
    total: qs.length,
    passed: qs.every(
      (b) =>
        !b.question!.requireCorrect || answers[b.id] === b.question!.correct,
    ),
    at: new Date().toISOString(),
  };
  return changeEnrollment(
    s,
    e,
    { attempts: [...e.attempts, attempt] },
    c,
    "Questionário demonstrativo verificado localmente; sem efeito em desempenho ou carreira.",
  );
}
function finish(s: AcademyState, c: Scope, e: Enrollment) {
  const at = new Date().toISOString(),
    next = changeEnrollment(
      s,
      e,
      {
        state: "Concluído",
        completedAt: at,
        completedLessons: allLessons(e.snapshot).map((l) => l.id),
      },
      c,
      "Aprendizagem concluída somente na demonstração.",
    );
  if (
    e.snapshot.awardMode === "Nenhum documento" ||
    s.artifacts.some((a) => a.enrollment === e.id)
  )
    return next;
  const p = s.people.find((p) => p.id === e.person)!;
  const artifact: LearningArtifact = {
    id: `academy-artifact-${e.id}`,
    person: p.id,
    enrollment: e.id,
    course: e.course,
    title: e.snapshot.title,
    student: p.name,
    minutes: e.snapshot.minutes,
    mode: e.snapshot.awardMode,
    template: structuredClone(e.snapshot.certificate),
    issuedAt: at,
    badge: "Aprendizado em prática",
  };
  return { ...next, artifacts: [artifact, ...next.artifacts] };
}
export function completeLesson(
  s: AcademyState,
  c: Scope,
  id: string,
  lessonId: string,
) {
  const e = myEnrollment(s, c, id);
  assert(
    !["Concluído", "Aguardando RH", "Não participou"].includes(e.state),
    "Aprendizado não editável.",
  );
  assert(
    !["Curso externo", "Treinamento ao vivo"].includes(e.snapshot.kind),
    "Este conteúdo exige validação ou participação registrada.",
  );
  assert(
    allLessons(e.snapshot).some((l) => l.id === lessonId),
    "Aula inexistente.",
  );
  const lesson = allLessons(e.snapshot).find((l) => l.id === lessonId)!;
  if (lesson.blocks.some((b) => b.kind === "Questionário"))
    assert(
      [...e.attempts].reverse().find((a) => a.lesson === lessonId)?.passed,
      "Verifique o questionário e atenda aos critérios configurados.",
    );
  const completed = [...new Set([...e.completedLessons, lessonId])];
  const next = changeEnrollment(
    s,
    e,
    { completedLessons: completed },
    c,
    "Aula marcada como concluída, sem medir tempo de trabalho.",
  );
  const updated = next.enrollments.find((v) => v.id === id)!;
  return completed.length === e.totalLessons &&
    e.snapshot.kind !== "Atividade prática"
    ? finish(next, c, updated)
    : next;
}
export function submitProof(
  s: AcademyState,
  c: Scope,
  id: string,
  text: string,
  file?: Attachment,
) {
  const e = myEnrollment(s, c, id);
  assert(
    ["Curso externo", "Atividade prática"].includes(e.snapshot.kind) &&
      ["Em andamento", "Ajustes solicitados"].includes(e.state),
    "Conteúdo não aceita envio neste estado.",
  );
  assert(
    text.trim() || file,
    "Adicione certificado ou evidência de conclusão.",
  );
  if (file)
    assert(
      localUrl(file.url) && file.size <= 10 * 1024 * 1024,
      "Arquivo local de até 10 MB.",
    );
  if (e.snapshot.kind === "Atividade prática")
    assert(
      e.completedLessons.length === e.totalLessons,
      "Conclua as aulas da atividade antes de enviar.",
    );
  return changeEnrollment(
    s,
    e,
    {
      state: "Aguardando RH",
      proof: { text, file, at: new Date().toISOString() },
      proofHistory: e.proof
        ? [...(e.proofHistory ?? []), structuredClone(e.proof)]
        : e.proofHistory,
    },
    c,
    "Evidência enviada à validação da gestão.",
  );
}
export function reviewProof(
  s: AcademyState,
  c: Scope,
  id: string,
  approve: boolean,
  comment: string,
) {
  manage(s, c);
  const e = s.enrollments.find((e) => e.id === id),
    p = s.people.find((p) => p.id === e?.person);
  assert(
    e && p?.org === c.org && e.state === "Aguardando RH" && e.proof,
    "Evidência deve estar pendente.",
  );
  assert(p.user !== c.user, "Não valide sua própria conclusão.");
  assert(comment.trim(), "Registre o parecer.");
  const next = changeEnrollment(
    s,
    e,
    {
      state: approve ? "Aguardando RH" : "Ajustes solicitados",
      review: { by: c.name, at: new Date().toISOString(), comment },
    },
    c,
    approve
      ? `Conclusão validada pela gestão: ${comment}`
      : `Gestão solicitou complementação separadamente: ${comment}`,
  );
  return approve
    ? finish(
        next,
        c,
        next.enrollments.find((v) => v.id === id)!,
      )
    : next;
}
export function saveTrack(s: AcademyState, c: Scope, t: Track) {
  org(s, c);
  const old = s.tracks.find((x) => x.id === t.id);
  assert(
    admin(c) || (c.leader && (!old || old.author === c.user)),
    "Trilha fora do escopo de autoria.",
  );
  assert(
    t.name.trim() &&
      t.objective.trim() &&
      t.contracts.length &&
      t.courseIds.length &&
      new Set(t.courseIds).size === t.courseIds.length,
    "Informe trilha, objetivo, público e conteúdos distintos.",
  );
  assert(
    !t.contracts.includes("PJ") || t.serviceOptional,
    "Trilhas PJ devem ser opcionais e pertinentes aos serviços.",
  );
  for (const id of t.courseIds) {
    const course = s.courses.find((x) => x.id === id);
    assert(
      course?.published && course.state !== "Arquivado",
      "Selecione conteúdos publicados.",
    );
    if (t.contracts.includes("PJ"))
      assert(
        course.published.audience.serviceRelevant &&
          course.published.audience.contracts.includes("PJ"),
        "Trilha PJ não pode incluir desenvolvimento típico de empregados.",
      );
  }
  return {
    ...s,
    tracks: [
      {
        ...structuredClone(t),
        author: old?.author ?? c.user,
        published:
          old?.state === "Publicada"
            ? structuredClone({ ...old, published: undefined })
            : old?.published,
        state: "Rascunho" as const,
      },
      ...s.tracks.filter((x) => x.id !== t.id),
    ],
  };
}
export function publishTrack(s: AcademyState, c: Scope, id: string) {
  manage(s, c);
  const t = s.tracks.find((x) => x.id === id);
  assert(t && t.state !== "Arquivada", "Trilha indisponível.");
  return {
    ...s,
    tracks: saveTrack(s, c, t).tracks.map((t) =>
      t.id === id
        ? { ...t, published: undefined, state: "Publicada" as const }
        : t,
    ),
  };
}
export function trackAllows(
  s: AcademyState,
  c: Scope,
  t: Track,
  p = own(s, c),
) {
  if (t.state === "Arquivada") return false;
  t = trackView(t);
  return (
    !!p &&
    p.org === c.org &&
    t.state === "Publicada" &&
    t.contracts.includes(p.contract) &&
    (!t.sector || t.sector === p.sector) &&
    (!t.role || t.role === p.role) &&
    (p.contract !== "PJ" || t.serviceOptional) &&
    t.courseIds.every((id) =>
      s.courses.some((x) => x.id === id && visibleCourse(s, c, x, p)),
    )
  );
}
export function joinTrack(s: AcademyState, c: Scope, id: string) {
  org(s, c);
  const t = s.tracks.find((t) => t.id === id),
    p = own(s, c);
  assert(t && p && trackAllows(s, c, t), "Trilha não autorizada.");
  if (s.trackJoins.some((j) => j.track === id && j.person === p.id)) return s;
  return {
    ...s,
    trackJoins: [
      {
        id: uid(),
        track: id,
        person: p.id,
        at: new Date().toISOString(),
        courseIds: [...trackView(t).courseIds],
        title: trackView(t).name,
      },
      ...s.trackJoins,
    ],
  };
}
export function recommend(
  s: AcademyState,
  c: Scope,
  person: string,
  course: string,
  note: string,
) {
  org(s, c);
  const p = s.people.find((p) => p.id === person),
    x = s.courses.find((x) => x.id === course);
  assert(
    p && x && (admin(c) || team(s, c, p)) && visibleCourse(s, c, x, p),
    "Recomendação fora do público/equipe.",
  );
  assert(
    admin(c) || p.contract !== "PJ",
    "Liderança acompanha somente CLT e Estágio da equipe.",
  );
  assert(note.trim(), "Escreva uma orientação.");
  return {
    ...s,
    recommendations: [
      {
        id: uid(),
        person,
        course,
        note,
        by: c.name,
        at: new Date().toISOString(),
      },
      ...s.recommendations,
    ],
  };
}
export function sessionEnded(x: Session, now = Date.now()) {
  return (
    Date.parse(`${x.schedule.date}T${x.schedule.time}:00-03:00`) +
      x.schedule.duration * 60000 <=
    now
  );
}
export function registerSession(s: AcademyState, c: Scope, id: string) {
  org(s, c);
  const session = s.sessions.find((x) => x.id === id),
    p = own(s, c),
    course = s.courses.find((x) => x.id === session?.course);
  assert(
    session &&
      !session.closed &&
      !sessionEnded(session) &&
      p &&
      course &&
      visibleCourse(s, c, course) &&
      course.version === session.version &&
      audienceAllows(session.audience, p),
    "Treinamento não disponível para inscrição.",
  );
  const next = enroll(s, c, course.id);
  return {
    ...next,
    sessions: next.sessions.map((x) =>
      x.id === id
        ? {
            ...x,
            participants: [...new Set([...x.participants, p.id])],
            events: [
              ...x.events,
              event(c, "Participação registrada localmente, sem convite real."),
            ],
          }
        : x,
    ),
  };
}
export function markAttendance(
  s: AcademyState,
  c: Scope,
  id: string,
  person: string,
  present: boolean,
) {
  manage(s, c);
  const session = s.sessions.find((x) => x.id === id);
  assert(
    session && !session.closed && session.participants.includes(person),
    "Participante ou treinamento indisponível.",
  );
  return {
    ...s,
    sessions: s.sessions.map((x) =>
      x.id === id
        ? {
            ...x,
            present: present
              ? [...new Set([...x.present, person])]
              : x.present.filter((p) => p !== person),
          }
        : x,
    ),
  };
}
export function closeSession(s: AcademyState, c: Scope, id: string) {
  manage(s, c);
  const x = s.sessions.find((x) => x.id === id);
  assert(
    x && !x.closed && sessionEnded(x),
    "Aguarde o término do treinamento antes de encerrar.",
  );
  let next = {
    ...s,
    sessions: s.sessions.map((v) =>
      v.id === id
        ? {
            ...v,
            closed: true,
            events: [
              ...v.events,
              event(c, "Registro demonstrativo de participação encerrado."),
            ],
          }
        : v,
    ),
  };
  for (const p of x.participants) {
    const e = next.enrollments.find(
      (e) => e.person === p && e.course === x.course && e.version === x.version,
    );
    if (e && e.state !== "Concluído")
      next = x.present.includes(p)
        ? finish(next, c, e)
        : changeEnrollment(
            next,
            e,
            { state: "Não participou" },
            c,
            "Participação não confirmada; sem emissão de documento.",
          );
  }
  return next;
}
export function saveRecording(
  s: AcademyState,
  c: Scope,
  id: string,
  url: string,
) {
  manage(s, c);
  const x = s.sessions.find((x) => x.id === id);
  assert(
    x && x.closed && sessionEnded(x) && localUrl(url),
    "Use gravação local de um treinamento realizado e encerrado.",
  );
  return {
    ...s,
    sessions: s.sessions.map((x) =>
      x.id === id
        ? {
            ...x,
            recording: url,
            events: [
              ...x.events,
              event(
                c,
                "Gravação local adicionada, sem publicação no catálogo.",
              ),
            ],
          }
        : x,
    ),
  };
}
export function prepareRecording(s: AcademyState, c: Scope, id: string) {
  manage(s, c);
  const session = s.sessions.find((x) => x.id === id),
    course = s.courses.find((x) => x.id === session?.course);
  assert(
    session?.closed &&
      session.recording &&
      course?.published &&
      course.state !== "Arquivado",
    "Treinamento realizado com gravação é necessário.",
  );
  assert(
    course.sourceSession !== id,
    "A gravação deste conteúdo já foi preparada.",
  );
  const data: CourseData = {
    ...structuredClone(course.published),
    kind: "Treinamento gravado",
    live: undefined,
    modules: [
      {
        id: uid(),
        name: "Gravação e materiais",
        lessons: [
          {
            id: uid(),
            name: "Assista ao treinamento",
            blocks: [
              {
                id: uid(),
                kind: "Vídeo",
                text: "Gravação demonstrativa, com material complementar.",
                url: session.recording,
              },
              ...structuredClone(session.materials),
            ],
          },
        ],
      },
    ],
  };
  const next = saveCourse(s, c, course.id, data);
  return {
    ...next,
    courses: next.courses.map((x) =>
      x.id === course.id
        ? {
            ...x,
            state: "Em aprovação" as const,
            sourceSession: id,
            events: [
              ...x.events,
              event(
                c,
                "Gravação preparada no mesmo conteúdo; aprovação/publicação ainda necessárias.",
              ),
            ],
          }
        : x,
    ),
  };
}
export function projection(s: AcademyState, c: Scope): AcademyState {
  org(s, c);
  if (admin(c)) return s;
  const p = own(s, c),
    people = s.people.filter((x) => x.user === c.user || team(s, c, x));
  const ids = new Set(people.map((x) => x.id));
  const grants = s.grants
    .filter((g) => ids.has(g.person))
    .map((g) => {
      const f = s.finance?.find((f) => f.course === g.course);
      return {
        ...g,
        validUntil: f?.validUntil ?? g.validUntil,
        active:
          g.active && (f?.validUntil ?? g.validUntil ?? dateNow()) >= dateNow(),
      };
    });
  const allowed = (course: Course) => visibleCourse(s, c, course, p);
  const courses = s.courses
    .filter((x) => allowed(x) || (c.leader && x.author === c.user))
    .map((x) => {
      const published = x.published ? structuredClone(x.published) : undefined;
      if (published) {
        if (published.audience.people.length) {
          const retained = published.audience.people.filter((id) =>
            ids.has(id),
          );
          published.audience.people = retained.length
            ? retained
            : ["academy-no-authorized-person"];
        }
        if (
          published.kind === "Curso externo" &&
          !grants.some(
            (g) => g.course === x.id && g.person === p?.id && g.active,
          )
        )
          published.external = {
            ...published.external!,
            url: "",
            instructions:
              "Acesso disponível após atribuição de licença pela gestão.",
          };
      }
      return {
        ...x,
        published,
        draft: c.leader && x.author === c.user ? x.draft : undefined,
        events: c.leader && x.author === c.user ? x.events : [],
      };
    });
  const enrollments = s.enrollments
    .filter((e) => ids.has(e.person))
    .map((e) => {
      const mine = e.person === p?.id,
        course = s.courses.find((x) => x.id === e.course),
        canRead = mine && course && allowed(course);
      const snapshot = structuredClone(e.snapshot);
      if (!canRead) {
        snapshot.modules = [];
        snapshot.external = undefined;
        snapshot.description = "";
        snapshot.audience.people = [];
      } else if (
        snapshot.external &&
        !grants.some(
          (g) => g.person === p?.id && g.course === e.course && g.active,
        )
      )
        snapshot.external = {
          ...snapshot.external,
          url: "",
          instructions: "Licença não disponível para abertura.",
        };
      return {
        ...e,
        snapshot,
        attempts: mine ? e.attempts : [],
        proof: mine ? e.proof : undefined,
        proofHistory: mine ? e.proofHistory : undefined,
        review: mine ? e.review : undefined,
        events: mine ? e.events : [],
      };
    });
  return {
    version: 1,
    org: s.org,
    people,
    categories: s.categories,
    courses,
    tracks: s.tracks
      .filter(
        (t) => trackAllows(s, c, t, p) || (c.leader && t.author === c.user),
      )
      .map((t) =>
        c.leader && t.author === c.user
          ? t
          : { ...trackView(t), published: undefined },
      ),
    enrollments,
    trackJoins: s.trackJoins.filter((j) => ids.has(j.person)),
    grants,
    sessions: s.sessions
      .filter(
        (x) =>
          p &&
          audienceAllows(x.audience, p) &&
          s.courses.some((course) => course.id === x.course && allowed(course)),
      )
      .map((x) => ({
        ...x,
        participants: x.participants.filter((id) => ids.has(id)),
        present: x.present.filter((id) => ids.has(id)),
        events: [],
      })),
    artifacts: s.artifacts.filter((a) => a.person === p?.id),
    recommendations: s.recommendations.filter(
      (r) =>
        r.person === p?.id ||
        (c.leader && s.people.some((p) => p.id === r.person && team(s, c, p))),
    ),
    settings: s.settings,
    events: [],
  };
}

/** Management registers an eligible attendee; the actor never becomes the selected person. */
export function addParticipant(
  s: AcademyState,
  c: Scope,
  id: string,
  person: string,
) {
  manage(s, c);
  const session = s.sessions.find((x) => x.id === id),
    p = s.people.find((p) => p.id === person && p.org === c.org),
    course = s.courses.find((x) => x.id === session?.course);
  assert(
    session &&
      !session.closed &&
      p &&
      course?.published &&
      course.version === session.version &&
      audienceAllows(session.audience, p) &&
      visibleCourse(s, c, course, p),
    "Participante, público ou versão de agenda incompatível.",
  );
  const old = s.enrollments.find(
    (e) =>
      e.course === course.id &&
      e.version === session.version &&
      e.person === p.id,
  );
  const snapshot = structuredClone(course.published);
  const e: Enrollment = {
    id: uid(),
    person: p.id,
    course: course.id,
    version: session.version,
    snapshot,
    totalLessons: allLessons(snapshot).length,
    completedLessons: [],
    attempts: [],
    state: "Em andamento",
    joinedAt: new Date().toISOString(),
    events: [
      event(c, "Participante registrado pela gestão, sem convite real."),
    ],
  };
  return {
    ...s,
    enrollments: old ? s.enrollments : [e, ...s.enrollments],
    sessions: s.sessions.map((x) =>
      x.id === id
        ? {
            ...x,
            participants: [...new Set([...x.participants, p.id])],
            events: [
              ...x.events,
              event(c, "Participante autorizado incluído pela gestão."),
            ],
          }
        : x,
    ),
  };
}
export function submitTrack(s: AcademyState, c: Scope, id: string) {
  org(s, c);
  const x = s.tracks.find((t) => t.id === id);
  assert(
    x &&
      (admin(c) || (c.leader && x.author === c.user)) &&
      x.state === "Rascunho",
    "Trilha não disponível para envio.",
  );
  return {
    ...s,
    tracks: s.tracks.map((t) =>
      t.id === id ? { ...t, state: "Em aprovação" as const } : t,
    ),
  };
}
export function archiveTrack(s: AcademyState, c: Scope, id: string) {
  manage(s, c);
  assert(
    s.tracks.some((t) => t.id === id),
    "Trilha não encontrada.",
  );
  return {
    ...s,
    tracks: s.tracks.map((t) =>
      t.id === id ? { ...t, state: "Arquivada" as const } : t,
    ),
  };
}
export function saveSettings(
  s: AcademyState,
  c: Scope,
  headline: string,
  description: string,
) {
  manage(s, c);
  assert(
    headline.trim() && description.trim(),
    "Informe título e mensagem institucional.",
  );
  return { ...s, settings: { headline, description } };
}
