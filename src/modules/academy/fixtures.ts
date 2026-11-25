import "server-only";
import { type Scope, uid, dateNow } from "../career/model";
import { peopleFor } from "../career/fixtures";
import {
  type AcademyState,
  type CourseData,
  type Enrollment,
  type Course,
  defaultCertificate,
  projection,
  allLessons,
} from "./model";
const shift = (d: string, n: number) =>
  new Date(Date.parse(d + "T12:00:00Z") + n * 86400000)
    .toISOString()
    .slice(0, 10);
export function demoAcademy(ctx: Scope): AcademyState {
  const today = dateNow(),
    at = new Date().toISOString(),
    year = today.slice(0, 4),
    people = peopleFor(ctx);
  const categories = [
    { id: "technical", name: "Excelência técnica", active: true },
    { id: "culture", name: "Cultura e colaboração", active: true },
    { id: "tools", name: "Ferramentas e processos", active: true },
    { id: "business", name: "Visão de negócio", active: true },
  ];
  function data(title: string, index: number, service = true): CourseData {
    return {
      title,
      description:
        "Aprenda com exemplos práticos da YouCon e transforme conhecimento em entregas mais claras. Conteúdo inteiramente demonstrativo.",
      kind: "Treinamento gravado",
      category: index % 2 ? "tools" : "technical",
      instructor:
        index % 2
          ? "Equipe de Projetos · Demo"
          : "Academy · Instrutoria fictícia",
      difficulty: index % 3 === 0 ? "Fundamentos" : "Intermediário",
      minutes: 60 + index * 30,
      tags:
        index % 2 ? ["Processos", "Colaboração"] : ["Projetos", "Qualidade"],
      cover: {
        theme: (["orange", "ink", "sand", "blue", "green"] as const)[index % 5],
        icon: (["layers", "play", "compass", "book", "sparkles"] as const)[
          index % 5
        ],
      },
      audience: {
        contracts: service ? ["CLT", "Estágio", "PJ"] : ["CLT", "Estágio"],
        sectors: [],
        people: [],
        serviceRelevant: service,
      },
      modules: [
        {
          id: `module-${index}-1`,
          name: "Conhecer e experimentar",
          lessons: [
            {
              id: `lesson-${index}-1`,
              name: "O essencial para começar",
              blocks: [
                {
                  id: `video-${index}`,
                  kind: "Vídeo",
                  text: "Uma introdução demonstrativa. A transcrição está disponível nos controles de legendas.",
                  url: "/demo/academy/intro.webm",
                },
                {
                  id: `text-${index}`,
                  kind: "Texto",
                  text: "Antes de executar uma entrega, identifique o resultado esperado, os critérios de qualidade e os responsáveis pela revisão. Este exemplo usa somente dados fictícios.",
                },
              ],
            },
            {
              id: `lesson-${index}-2`,
              name: "Aplicar no seu contexto",
              blocks: [
                {
                  id: `apply-${index}`,
                  kind: "Texto",
                  text: "Organize uma revisão e registre um aprendizado que possa ser aplicado à próxima entrega.",
                },
                {
                  id: `quiz-${index}`,
                  kind: "Questionário",
                  text: "Qual atitude ajuda a produzir uma entrega com qualidade?",
                  question: {
                    options: [
                      "Confirmar expectativas e revisar a entrega",
                      "Enviar sem revisar",
                      "Ignorar os critérios acordados",
                    ],
                    correct: 0,
                    requireCorrect: true,
                  },
                },
              ],
            },
          ],
        },
      ],
      awardMode: "Certificado de conclusão",
      certificate: { ...defaultCertificate },
      featured: index < 2,
    };
  }
  const seed = [
    data("Projetos com clareza: da intenção à entrega", 0),
    data("Revisão técnica e qualidade que se constrói", 1),
    data("Cultura YouCon: aprender e colaborar", 2, false),
    data("Biblioteca externa de ferramentas BIM", 3),
    data("Workshop: comunicação de projetos", 4, false),
    data("Encontro realizado: padrões de entrega", 5),
    data("Guia rápido de organização de arquivos", 6),
    data("Conhecimento em ação: qualidade de projetos", 7),
    data("Prática acompanhada: revisão de uma entrega", 8),
  ];
  seed[2].category = "culture";
  seed[3].kind = "Curso externo";
  seed[3].external = {
    platform: "Plataforma de cursos · fictícia",
    vendor: "Fornecedor demonstrativo",
    url: "https://example.com/academy-bim",
    instructions:
      "Utilize sua conta autorizada na plataforma externa. Nenhuma credencial é armazenada na Academy. Link demonstrativo, sem integração de acesso.",
  };
  seed[4].kind = "Treinamento ao vivo";
  seed[4].awardMode = "Comprovante de participação";
  seed[4].live = {
    date: shift(today, 7),
    time: "14:00",
    duration: 90,
    format: "Online",
    location: "https://example.com/reuniao-demo",
  };
  seed[5].kind = "Treinamento ao vivo";
  seed[5].awardMode = "Comprovante de participação";
  seed[5].live = {
    date: shift(today, -8),
    time: "10:00",
    duration: 60,
    format: "Presencial",
    location: "Sala de encontros · local fictício",
  };
  seed[6].kind = "Material de aprendizagem";
  seed[6].awardMode = "Registro interno de aprendizagem";
  seed[6].minutes = 20;
  seed[6].modules[0].lessons = [seed[6].modules[0].lessons[0]];
  seed[7].kind = "Avaliação de conhecimento";
  seed[7].awardMode = "Nenhum documento";
  seed[7].minutes = 30;
  seed[8].kind = "Atividade prática";
  seed[8].minutes = 120;
  const courses: Course[] = seed.map((published, i) => ({
    id: `academy-course-${i}`,
    author: "academy-seed-author",
    version: 1,
    published,
    state: "Publicado",
    events: [
      {
        id: uid(),
        at,
        by: "RH demonstrativo",
        text: "Conteúdo fictício aprovado e publicado para testes.",
      },
    ],
  }));
  const draft = data("Oficina proposta pela liderança", 9);
  courses.push({
    id: "academy-proposal",
    author: ctx.leader ? ctx.user : "academy-team-leader",
    version: 0,
    state: "Em aprovação",
    draft,
    events: [
      {
        id: uid(),
        at,
        by: "Liderança demonstrativa",
        text: "Proposta aguardando aprovação da gestão.",
      },
    ],
  });
  const enrollments: Enrollment[] = [];
  function enrollment(
    person: number,
    course: number,
    state: Enrollment["state"] = "Em andamento",
  ): Enrollment {
    const snapshot = structuredClone(seed[course]);
    const e: Enrollment = {
      id: `academy-enrollment-${person}-${course}`,
      person: people[person].id,
      course: `academy-course-${course}`,
      version: 1,
      snapshot,
      totalLessons: allLessons(snapshot).length,
      completedLessons:
        state === "Concluído"
          ? allLessons(snapshot).map((l) => l.id)
          : state === "Em andamento" && course === 0
            ? [allLessons(snapshot)[0].id]
            : [],
      attempts: [],
      state,
      joinedAt: shift(today, -15) + "T15:00:00Z",
      completedAt:
        state === "Concluído" ? shift(today, -3) + "T15:00:00Z" : undefined,
      events: [
        {
          id: uid(),
          at,
          by: "Academy demonstrativa",
          text: "Exemplo individual de aprendizagem.",
        },
      ],
    };
    enrollments.push(e);
    return e;
  }
  enrollment(0, 0);
  enrollment(1, 0, "Concluído");
  enrollment(2, 1);
  enrollment(3, 6, "Concluído");
  enrollment(4, 0);
  enrollment(5, 8);
  const ownCompleted = enrollment(0, 6, "Concluído");
  enrollment(0, 1, "Concluído");
  const proof = enrollment(1, 3, "Aguardando RH");
  proof.proof = {
    text: "Certificado fictício e relato de aprendizagem externa para revisão da gestão.",
    at,
  };
  const externalOwn = enrollment(0, 3);
  externalOwn.completedLessons = [];
  const sessions = ([4, 5] as const).map((i) => ({
    id: `academy-course-${i}:session-v1`,
    course: `academy-course-${i}`,
    version: 1,
    title: seed[i].title,
    instructor: seed[i].instructor,
    schedule: structuredClone(seed[i].live!),
    audience: structuredClone(seed[i].audience),
    participants: i === 5 ? [people[1].id, people[2].id] : [people[2].id],
    present: i === 5 ? [people[1].id] : [],
    closed: false,
    recording: undefined as string | undefined,
    materials: [
      {
        id: "live-material-" + i,
        kind: "Link" as const,
        text: "Material complementar demonstrativo",
        url: "https://example.com/material-demo",
      },
    ],
    events: [],
  }));
  // Past training stays open for attendance review and later recording approval.
  enrollment(1, 5);
  enrollment(2, 5);
  enrollment(2, 4);
  const s: AcademyState = {
    version: 1,
    org: ctx.org,
    people,
    categories,
    courses,
    tracks: [
      {
        id: "academy-track-deliveries",
        name: "Entregas com qualidade",
        description:
          "Um caminho técnico, com sequência sugerida para aprender e aplicar.",
        sector: "",
        role: "",
        contracts: ["CLT", "Estágio", "PJ"],
        competency: "Qualidade técnica",
        objective: "Organizar entregas e revisões com clareza.",
        serviceOptional: true,
        courseIds: ["academy-course-0", "academy-course-1", "academy-course-6"],
        state: "Publicada",
        author: "academy-seed-author",
      },
      {
        id: "academy-track-development",
        name: "Colaboração e desenvolvimento contínuo",
        description:
          "Uma trilha para empregados e estagiários, sem promessas de progressão.",
        sector: "",
        role: "",
        contracts: ["CLT", "Estágio"],
        competency: "Colaboração",
        objective: "Ampliar repertório de colaboração.",
        serviceOptional: false,
        courseIds: ["academy-course-2", "academy-course-8"],
        state: "Publicada",
        author: "academy-seed-author",
      },
    ],
    enrollments,
    trackJoins: [
      {
        id: uid(),
        person: people[0].id,
        track: "academy-track-deliveries",
        at,
      },
    ],
    grants: [0, 1].map((i) => ({
      id: `academy-license-${i}`,
      course: "academy-course-3",
      person: people[i].id,
      active: true,
      assignedAt: at,
      validUntil: `${year}-12-31`,
      by: "RH demonstrativo",
    })),
    sessions,
    artifacts: [
      {
        id: "academy-artifact-own",
        person: people[0].id,
        enrollment: ownCompleted.id,
        course: "academy-course-6",
        title: ownCompleted.snapshot.title,
        student: people[0].name,
        minutes: 20,
        mode: "Registro interno de aprendizagem",
        template: structuredClone(defaultCertificate),
        issuedAt: shift(today, -3) + "T15:00:00Z",
        badge: "Aprendizado em prática",
      },
    ],
    recommendations: [
      {
        id: uid(),
        person: people[0].id,
        course: "academy-course-1",
        note: "Uma recomendação demonstrativa para ampliar o repertório técnico, sem obrigação ou efeito na carreira.",
        by: "Liderança demonstrativa",
        at,
      },
    ],
    finance: [
      {
        course: "academy-course-3",
        licenses: 3,
        amount: 180000,
        validUntil: `${year}-12-31`,
        date: `${year}-01-15`,
        events: [],
      },
      {
        course: "academy-course-4",
        licenses: 0,
        amount: 45000,
        validUntil: `${year}-12-31`,
        date: today,
        events: [],
      },
    ],
    settings: {
      headline: "Conhecimento que transforma o próximo passo.",
      description:
        "Aprenda com quem faz. Explore novos repertórios. Compartilhe o que transforma as nossas entregas.",
    },
    events: [],
  };
  for (const e of s.enrollments.filter((e) => e.state === "Concluído")) {
    const mode = e.snapshot.awardMode;
    if (
      mode !== "Nenhum documento" &&
      !s.artifacts.some((a) => a.enrollment === e.id)
    )
      s.artifacts.push({
        id: "academy-artifact-" + e.id,
        person: e.person,
        enrollment: e.id,
        course: e.course,
        title: e.snapshot.title,
        student: people.find((p) => p.id === e.person)!.name,
        minutes: e.snapshot.minutes,
        mode,
        template: structuredClone(e.snapshot.certificate),
        issuedAt: e.completedAt!,
        badge: "Aprendizado em prática",
      });
  }
  return projection(s, ctx);
}
