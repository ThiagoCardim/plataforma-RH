"use client";
import { useState } from "react";
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  Plus,
  Medal,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/modules/onboarding/components";
import { EntityForm, type Field } from "@/modules/career/components";
import { FileCard } from "@/modules/documents/file-card";
import {
  Tabs,
  Stat,
  Notice,
  Empty,
  Events,
  GoalBar,
} from "@/modules/performance/components";
import {
  type Scope,
  type Contract,
  admin,
  uid,
  dateNow,
  brl,
  cents,
} from "../career/model";
import {
  type AcademyState,
  type Course,
  type Track,
  type Enrollment,
  own,
  team,
  visibleCourse,
  activeLicense,
  progress,
  kinds,
  audienceAllows,
  sessionEnded,
  saveCourse,
  submitCourse,
  publishCourse,
  duplicateCourse,
  archiveCourse,
  enroll,
  completeLesson,
  checkQuiz,
  submitProof,
  reviewProof,
  saveTrack,
  publishTrack,
  submitTrack,
  archiveTrack,
  trackAllows,
  trackView,
  joinTrack,
  recommend,
  saveFinance,
  assignLicense,
  releaseLicense,
  registerSession,
  addParticipant,
  markAttendance,
  closeSession,
  saveRecording,
  prepareRecording,
  saveCategory,
  saveSettings,
} from "./model";
import { useAcademy } from "./store";
import { CourseEditor } from "./editor";
import { LearningPlayer } from "./player";
import { Certificate } from "./certificate";
import {
  type AcademyDestination,
  AcademyLinkEditor,
  useAcademyLinks,
} from "./links";
import {
  CourseCard,
  Cover,
  BlockView,
  TextField,
  AreaField,
  Pick,
  Check,
  Upload,
  Reorder,
  move,
  sectors,
  sectorName,
  jobName,
  hours,
  dt,
} from "./components";
import "./academy.css";
const academyTabs = [
  "Início",
  "Catálogo",
  "Trilhas de Aprendizagem",
  "Agenda de Treinamentos",
  "Meu Aprendizado",
  "Minhas Conquistas",
  "Gestão Academy",
];
const choices = (items: readonly string[]) =>
  items.map((v) => ({ id: v, name: v }));
export function AcademyWorkspace({
  initial,
  scope,
  targets,
  initialContent,
}: {
  initial: AcademyState;
  scope: Scope;
  targets: AcademyDestination[];
  initialContent?: string;
}) {
  const { state, ready, act, error, notice, clear } = useAcademy(
      initial,
      scope,
    ),
    manager = admin(scope),
    creator = manager || scope.leader,
    me = own(state, scope),
    links = useAcademyLinks(scope);
  const [tab, setTab] = useState("Início"),
    [management, setManagement] = useState("Visão gerencial"),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState(""),
    [type, setType] = useState(""),
    [sector, setSector] = useState(""),
    [person, setPerson] = useState(""),
    [contract, setContract] = useState(""),
    [start, setStart] = useState(""),
    [end, setEnd] = useState("");
  const [detail, setDetail] = useState<string | null>(initialContent ?? null),
    [editorial, setEditorial] = useState(false),
    [editor, setEditor] = useState<string | null | undefined>(undefined),
    [player, setPlayer] = useState<string | null>(null),
    [trackEdit, setTrackEdit] = useState<Track | null | undefined>(undefined),
    [trackDetail, setTrackDetail] = useState<string | null>(null),
    [sessionId, setSession] = useState<string | null>(null),
    [artifactId, setArtifact] = useState<string | null>(null),
    [reviewId, setReview] = useState<string | null>(null),
    [terms, setTerms] = useState<string | null>(null),
    [linkId, setLink] = useState<string | null>(null),
    [config, setConfig] = useState<"category" | "settings" | null>(null),
    [recommendCourse, setRecommendCourse] = useState<string | null>(null);
  const [comment, setComment] = useState(""),
    [licensePerson, setLicensePerson] = useState(""),
    [attendee, setAttendee] = useState(""),
    [agenda, setAgenda] = useState("Próximos");
  const selected = state.courses.find((c) => c.id === detail),
    data = selected
      ? editorial && (manager || selected.author === scope.user)
        ? (selected.draft ?? selected.published)
        : selected.published
      : undefined;
  const enrollment = state.enrollments.find(
      (e) => e.id === player && e.person === me?.id,
    ),
    editing = state.courses.find((c) => c.id === editor),
    track = state.tracks.find((t) => t.id === trackDetail),
    session = state.sessions.find((s) => s.id === sessionId),
    artifact = state.artifacts.find(
      (a) => a.id === artifactId && (manager || a.person === me?.id),
    ),
    review = state.enrollments.find(
      (e) =>
        e.id === reviewId &&
        (manager ||
          team(
            state,
            scope,
            state.people.find((p) => p.id === e.person)!,
          )),
    ),
    commercial = state.courses.find((c) => c.id === terms);
  const catalog = state.courses.filter(
    (c) =>
      c.published &&
      c.state !== "Arquivado" &&
      (manager || visibleCourse(state, scope, c)),
  );
  const match = (c: Course) => {
    const d = c.published!;
    return (
      (!category || d.category === category) &&
      (!type || d.kind === type) &&
      (!sector ||
        d.audience.sectors.length === 0 ||
        d.audience.sectors.includes(sector)) &&
      (!search ||
        `${d.title} ${d.description} ${d.tags.join(" ")} ${d.instructor}`
          .toLocaleLowerCase("pt-BR")
          .includes(search.toLocaleLowerCase("pt-BR")))
    );
  };
  const my = state.enrollments.filter((e) => e.person === me?.id),
    ongoing = my.filter(
      (e) =>
        e.state !== "Concluído" &&
        e.state !== "Não participou" &&
        state.courses.some(
          (c) => c.id === e.course && visibleCourse(state, scope, c),
        ),
    );
  const counts = {
    courses: catalog.length,
    completed: my.filter((e) => e.state === "Concluído").length,
    minutes: my
      .filter((e) => e.state === "Concluído")
      .reduce((n, e) => n + e.snapshot.minutes, 0),
    artifacts: state.artifacts.filter((a) => a.person === me?.id).length,
  };
  const ownArtifacts = state.artifacts.filter((a) => a.person === me?.id);
  const teamPeople = state.people.filter(
    (p) => manager || team(state, scope, p),
  );
  const rows = state.enrollments.filter((e) => {
    const p = state.people.find((p) => p.id === e.person);
    return (
      p &&
      (manager || team(state, scope, p)) &&
      (!sector || p.sector === sector) &&
      (!person || p.id === person) &&
      (!contract || p.contract === contract) &&
      (!start || e.joinedAt.slice(0, 10) >= start) &&
      (!end || e.joinedAt.slice(0, 10) <= end)
    );
  });
  const f = (
    key: string,
    label: string,
    type: Field["type"] = "text",
    options?: Field["options"],
  ): Field => ({ key, label, type, options });
  const modal =
    detail ||
    editor !== undefined ||
    player ||
    trackEdit !== undefined ||
    trackDetail ||
    sessionId ||
    artifactId ||
    reviewId ||
    terms ||
    linkId ||
    config ||
    recommendCourse;
  const message = <Notice error={error || links.error} notice={notice} />;
  function openCourse(id: string, draft = false) {
    clear();
    setTrackDetail(null);
    setPlayer(null);
    setDetail(id);
    setEditorial(draft);
  }
  function openPlayer(e: Enrollment) {
    clear();
    setDetail(null);
    setPlayer(e.id);
  }
  function learn(course: Course) {
    const next = act(
      (s) => enroll(s, scope, course.id),
      "Inscrição local registrada.",
    );
    if (next) {
      const e = next.enrollments.find(
        (e) =>
          e.course === course.id &&
          e.version === course.version &&
          e.person === me?.id,
      );
      if (e) openPlayer(e);
    }
  }
  function close() {
    clear();
    setComment("");
    setLicensePerson("");
    setAttendee("");
  }
  function reset() {
    if (
      window.confirm(
        "Restaurar somente os exemplos da Academy desta conta? Referências em outros módulos permanecem como histórico.",
      )
    ) {
      act(() => initial, "Exemplos da Academy restaurados.");
    }
  }
  function courseGrid(list: Course[], carousel = false) {
    return list.length ? (
      <div
        className={
          carousel
            ? "academy-carousel grid auto-cols-[300px] grid-flow-col gap-4 overflow-x-auto pb-3"
            : "grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
        }
      >
        {list.map((c) => {
          const e = my.find(
            (e) => e.course === c.id && e.version === c.version,
          );
          return (
            <CourseCard
              key={c.id}
              data={c.published!}
              onOpen={() => openCourse(c.id)}
              progressValue={e ? progress(e) : undefined}
              extra={
                c.published!.kind === "Curso externo" &&
                !activeLicense(state, c.id, me?.id ?? "")
                  ? "Licença não atribuída a esta conta"
                  : undefined
              }
            />
          );
        })}
      </div>
    ) : (
      <Empty>Nenhum conteúdo autorizado neste filtro.</Empty>
    );
  }
  function launchTrack(t: Track) {
    clear();
    setTrackDetail(t.id);
  }
  if (!ready) return <p role="status">Preparando sua YouCon Academy…</p>;
  return (
    <div className="academy-shell min-w-0 space-y-6 overflow-x-clip">
      <div className="rounded-xl border border-orange-200 bg-accent p-4 text-sm leading-6">
        <strong>Academy demonstrativa · conhecimento em prática</strong>
        <p>
          Dados e arquivos apenas neste navegador, usuário e organização, sem
          sincronização entre contas. Não há emissão oficial, avisos, pagamentos
          ou integração externa. Conquistas não geram pontos no Hall ou
          promoções.
        </p>
      </div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-kicker mb-3">
            Desempenho / Aprendizagem em movimento
          </p>
          <h1 className="page-title">YouCon Academy</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Novos repertórios. Melhores entregas. Conhecimento compartilhado.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={reset}>
            Restaurar exemplos
          </Button>
          {creator && (
            <Button
              onClick={() => {
                close();
                setEditor(null);
              }}
            >
              <Plus size={16} />
              {manager ? "Novo conteúdo" : "Propor conteúdo"}
            </Button>
          )}
        </div>
      </header>
      <Tabs
        items={academyTabs.filter((t) => t !== "Gestão Academy" || creator)}
        value={tab}
        change={(v) => {
          setTab(v);
          clear();
        }}
        label="Abas da YouCon Academy"
      />
      {!modal && message}
      {tab === "Início" && (
        <>
          <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-stone-950 via-stone-900 to-orange-950 p-7 text-white sm:p-10">
            <div className="absolute -right-16 -top-24 size-96 rounded-full border-[70px] border-white/[.035]" />
            <div className="relative grid gap-8 lg:grid-cols-[1.3fr_.7fr]">
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-orange-200">
                  <GraduationCap size={18} />
                  Universidade corporativa YouCon
                </p>
                <h2 className="mt-6 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
                  {state.settings.headline}
                </h2>
                <p className="mt-6 max-w-2xl text-base leading-8 text-stone-300">
                  {state.settings.description}
                </p>
                <Button
                  className="mt-7 bg-orange-600 hover:bg-orange-500"
                  onClick={() => setTab("Catálogo")}
                >
                  Explorar o catálogo
                </Button>
                <p className="mt-4 text-xs text-stone-400">
                  {scope.contract === "PJ"
                    ? "Aprendizagem opcional, pertinente aos serviços autorizados."
                    : "Escolha um conteúdo e transforme conhecimento em prática."}
                </p>
              </div>
              <div className="grid content-center gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <BookOpen className="text-orange-300" size={24} />
                  <p className="mt-4 text-3xl font-semibold">
                    {counts.courses}
                  </p>
                  <p className="mt-2 text-sm text-stone-300">
                    conteúdos no seu contexto
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-2xl font-semibold">{counts.completed}</p>
                    <p className="mt-2 text-xs text-stone-300">conclusões</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-2xl font-semibold">
                      {hours(counts.minutes)}
                    </p>
                    <p className="mt-2 text-xs text-stone-300">
                      carga horária concluída
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="section-title">Continue aprendendo</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTab("Meu Aprendizado")}
              >
                Meu aprendizado
              </Button>
            </div>
            {ongoing.length ? (
              <div className="academy-carousel grid auto-cols-[320px] grid-flow-col gap-4 overflow-x-auto pb-3">
                {ongoing.map((e) => (
                  <CourseCard
                    key={e.id}
                    data={e.snapshot}
                    onOpen={() => openPlayer(e)}
                    progressValue={progress(e)}
                    extra={e.state}
                  />
                ))}
              </div>
            ) : (
              <Empty>Seu próximo aprendizado começa no catálogo.</Empty>
            )}
          </section>
          <section className="space-y-4">
            <h2 className="section-title">
              Para ampliar o seu repertório · {sectorName(me?.sector ?? "")}
            </h2>
            {courseGrid(
              catalog
                .filter(
                  (c) =>
                    !c.published!.audience.sectors.length ||
                    c.published!.audience.sectors.includes(me?.sector ?? ""),
                )
                .filter(
                  (c) =>
                    !my.some(
                      (e) => e.course === c.id && e.state === "Concluído",
                    ),
                )
                .slice(0, 6),
              true,
            )}
          </section>
          <section className="space-y-4">
            <h2 className="section-title">Novidades e conteúdos em destaque</h2>
            {courseGrid(
              catalog.filter((c) => c.published!.featured).slice(0, 4),
              true,
            )}
          </section>
          {state.recommendations.filter((r) => r.person === me?.id).length >
            0 && (
            <section className="space-y-3 rounded-2xl border bg-card p-6">
              <h2 className="section-title">
                Uma orientação para o seu aprendizado
              </h2>
              {state.recommendations
                .filter((r) => r.person === me?.id)
                .map((r) => (
                  <article
                    key={r.id}
                    className="rounded-xl border bg-muted/30 p-4"
                  >
                    <p className="text-sm leading-6">{r.note}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {r.by} · recomendação, sem progressão automática
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => openCourse(r.course)}
                    >
                      Explorar conteúdo recomendado
                    </Button>
                  </article>
                ))}
            </section>
          )}
        </>
      )}
      {tab === "Catálogo" && (
        <>
          <div className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 xl:grid-cols-4">
            <TextField
              label="Buscar no catálogo"
              value={search}
              onChange={setSearch}
            />
            <Pick
              label="Categoria do catálogo"
              value={category}
              onChange={setCategory}
              options={[
                { id: "", name: "Todas" },
                ...state.categories.map((c) => ({ id: c.id, name: c.name })),
              ]}
            />
            <Pick
              label="Tipo no catálogo"
              value={type}
              onChange={setType}
              options={[{ id: "", name: "Todos" }, ...choices(kinds)]}
            />
            <Pick
              label="Setor do catálogo"
              value={sector}
              onChange={setSector}
              options={[{ id: "", name: "Todos autorizados" }, ...sectors]}
            />
          </div>
          {courseGrid(catalog.filter(match))}
        </>
      )}
      {tab === "Trilhas de Aprendizagem" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="section-title">
                Caminhos para aprender e aplicar
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Sequências personalizáveis por setor, cargo, vínculo,
                competência e objetivo. Nenhuma progressão de carreira é
                automática.
              </p>
            </div>
            {creator && (
              <Button
                onClick={() => {
                  close();
                  setTrackEdit(null);
                }}
              >
                Nova trilha
              </Button>
            )}
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {state.tracks
              .filter(
                (t) =>
                  manager ||
                  trackAllows(state, scope, t) ||
                  (scope.leader && t.author === scope.user),
              )
              .map((t) => {
                const v = trackView(t),
                  completed = v.courseIds.filter((id) =>
                    my.some((e) => e.course === id && e.state === "Concluído"),
                  ).length;
                return (
                  <button
                    key={t.id}
                    onClick={() => launchTrack(t)}
                    className="rounded-2xl border bg-card p-6 text-left transition-shadow hover:shadow-xl"
                  >
                    <div className="flex items-center justify-between">
                      <Layers className="text-primary" />
                      <Badge>{v.state}</Badge>
                    </div>
                    <h3 className="mt-5 text-2xl font-semibold">{v.name}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {v.objective}
                    </p>
                    <p className="mt-4 text-xs text-muted-foreground">
                      {v.competency} · {v.contracts.join(" · ")}
                    </p>
                    <div className="mt-5 flex gap-2">
                      {v.courseIds.map((id, i) => (
                        <span
                          key={id}
                          className={`flex size-9 items-center justify-center rounded-full border text-xs font-semibold ${my.some((e) => e.course === id && e.state === "Concluído") ? "border-orange-300 bg-orange-50 text-primary" : "bg-muted"}`}
                        >
                          {i + 1}
                        </span>
                      ))}
                    </div>
                    <p className="mt-4 text-sm">
                      {completed}/{v.courseIds.length} conteúdos concluídos
                      {v.serviceOptional ? " · opcional para serviços" : ""}
                    </p>
                  </button>
                );
              })}
          </div>
        </>
      )}
      {tab === "Agenda de Treinamentos" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="section-title">
                Encontros para compartilhar conhecimento
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Datas e horários de Brasília. Inscrições e registros são
                demonstrativos, sem convites reais.
              </p>
            </div>
            <Pick
              label="Período da agenda"
              value={agenda}
              onChange={setAgenda}
              options={choices(["Próximos", "Realizados e histórico", "Todos"])}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {state.sessions
              .filter(
                (s) =>
                  agenda === "Todos" ||
                  (agenda === "Próximos" ? !sessionEnded(s) : sessionEnded(s)),
              )
              .map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    close();
                    setSession(s.id);
                  }}
                  className="flex gap-5 rounded-2xl border bg-card p-5 text-left hover:shadow-lg"
                >
                  <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-orange-50 text-primary">
                    <CalendarDays size={23} />
                    <p className="mt-2 text-xs font-semibold">
                      {dt(s.schedule.date)}
                    </p>
                  </div>
                  <div>
                    <Badge>
                      {s.closed
                        ? "Realizado"
                        : sessionEnded(s)
                          ? "Aguardando registro"
                          : "Inscrições abertas"}{" "}
                      · v{s.version}
                    </Badge>
                    <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {s.schedule.time} · {s.schedule.duration} min ·{" "}
                      {s.schedule.format}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {s.instructor}
                    </p>
                  </div>
                </button>
              ))}
          </div>
        </>
      )}
      {tab === "Meu Aprendizado" && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Em andamento / em revisão" value={ongoing.length} />
            <Stat label="Conteúdos concluídos" value={counts.completed} />
            <Stat
              label="Carga horária de catálogo concluída"
              value={hours(counts.minutes)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Carga horária declarada dos conteúdos, sem cálculo de jornada ou
            garantia por tempo de reprodução. Arquivados permanecem no
            histórico.
          </p>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {my.map((e) => (
              <CourseCard
                key={e.id}
                data={e.snapshot}
                progressValue={progress(e)}
                extra={`${e.state} · versão ${e.version}`}
                onOpen={() => openPlayer(e)}
              />
            ))}
          </div>
          {!my.length && (
            <Empty>Explore o catálogo para iniciar seu aprendizado.</Empty>
          )}
        </>
      )}
      {tab === "Minhas Conquistas" && (
        <>
          <section className="rounded-3xl bg-gradient-to-br from-stone-950 to-orange-950 p-7 text-white">
            <Medal size={38} className="text-orange-200" />
            <h2 className="mt-5 text-3xl font-semibold">
              Cada aprendizado amplia o seu repertório.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-300">
              Uma coleção de certificados, participações e registros
              demonstrativos. Selos da Academy são independentes do Hall e não
              geram pontos ou elegibilidade para promoções.
            </p>
          </section>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {ownArtifacts.map((a) => (
              <button
                key={a.id}
                onClick={() => setArtifact(a.id)}
                className="rounded-2xl border bg-gradient-to-br from-white to-orange-50 p-6 text-left hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <Medal size={34} className="text-primary" />
                  <Badge>{a.mode}</Badge>
                </div>
                <h3 className="mt-6 text-xl font-semibold">{a.title}</h3>
                <p className="mt-4 text-sm text-muted-foreground">
                  {a.badge} · {hours(a.minutes)}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {new Date(a.issuedAt).toLocaleDateString("pt-BR")} · sem
                  validade oficial
                </p>
              </button>
            ))}
          </div>
          {!ownArtifacts.length && (
            <Empty>
              Conquistas aparecerão aqui conforme a configuração de cada
              conteúdo. Concluir não gera reconhecimento de desempenho.
            </Empty>
          )}
        </>
      )}
      {tab === "Gestão Academy" && creator && (
        <>
          <Tabs
            items={
              manager
                ? [
                    "Visão gerencial",
                    "Conteúdos e aprovação",
                    "Cursos externos e licenças",
                    "Conclusões e evidências",
                    "Trilhas e configurações",
                    "Histórico individual",
                  ]
                : [
                    "Equipe",
                    "Meus conteúdos propostos",
                    "Recomendar treinamento",
                  ]
            }
            value={
              manager
                ? management
                : [
                      "Equipe",
                      "Meus conteúdos propostos",
                      "Recomendar treinamento",
                    ].includes(management)
                  ? management
                  : "Equipe"
            }
            change={(v) => {
              setManagement(v);
              clear();
            }}
            label="Gestão da Academy"
          />
          {((manager &&
            ["Visão gerencial", "Histórico individual"].includes(management)) ||
            (!manager &&
              ["Visão gerencial", "Equipe"].includes(management))) && (
            <>
              <div className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 xl:grid-cols-5">
                <Pick
                  label="Setor nos indicadores Academy"
                  value={sector}
                  onChange={setSector}
                  options={[{ id: "", name: "Todos no escopo" }, ...sectors]}
                />
                <Pick
                  label="Profissional nos indicadores Academy"
                  value={person}
                  onChange={setPerson}
                  options={[
                    { id: "", name: "Todos no escopo" },
                    ...teamPeople.map((p) => ({ id: p.id, name: p.name })),
                  ]}
                />
                <Pick
                  label="Vínculo nos indicadores Academy"
                  value={contract}
                  onChange={setContract}
                  options={[
                    { id: "", name: "Todos no escopo" },
                    ...choices(
                      manager ? ["CLT", "Estágio", "PJ"] : ["CLT", "Estágio"],
                    ),
                  ]}
                />
                <TextField
                  label="Inscrições a partir de"
                  type="date"
                  value={start}
                  onChange={setStart}
                />
                <TextField
                  label="Inscrições até"
                  type="date"
                  value={end}
                  onChange={setEnd}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="Inscrições no contexto" value={rows.length} />
                <Stat
                  label="Taxa de conclusão"
                  value={
                    rows.length
                      ? `${Math.round((rows.filter((e) => e.state === "Concluído").length / rows.length) * 100)}%`
                      : "—"
                  }
                />
                <Stat
                  label="Carga horária declarada concluída"
                  value={hours(
                    rows
                      .filter((e) => e.state === "Concluído")
                      .reduce((n, e) => n + e.snapshot.minutes, 0),
                  )}
                />
                <Stat
                  label="Treinamentos pendentes"
                  value={
                    rows.filter(
                      (e) =>
                        e.state !== "Concluído" && e.state !== "Não participou",
                    ).length
                  }
                />
              </div>
              {manager && (
                <div className="grid gap-4 md:grid-cols-3">
                  <Stat
                    label="Investimento demonstrativo em capacitação"
                    value={brl(
                      (state.finance ?? [])
                        .filter(
                          (f) =>
                            (!start || f.date >= start) &&
                            (!end || f.date <= end),
                        )
                        .reduce((n, f) => n + f.amount, 0),
                    )}
                    note="Total cadastrado no período financeiro, sem rateio por pessoa"
                  />
                  <Stat
                    label="Licenças adquiridas"
                    value={(state.finance ?? [])
                      .filter(
                        (f) =>
                          state.courses.find((c) => c.id === f.course)
                            ?.published?.kind === "Curso externo",
                      )
                      .reduce((n, f) => n + f.licenses, 0)}
                  />
                  <Stat
                    label="Licenças atribuídas"
                    value={state.grants.filter((g) => g.active).length}
                  />
                </div>
              )}
              <div className="grid gap-5 lg:grid-cols-2">
                <section className="space-y-5 rounded-2xl border bg-card p-6">
                  <h3 className="section-title">Participação por setor</h3>
                  {sectors.map((s) => {
                    const members = new Set(
                      rows
                        .filter(
                          (e) =>
                            state.people.find((p) => p.id === e.person)
                              ?.sector === s.id,
                        )
                        .map((e) => e.person),
                    );
                    return (
                      <button
                        key={s.id}
                        className="block w-full text-left"
                        onClick={() => setSector(s.id)}
                      >
                        <GoalBar
                          label={`${s.name} · ${members.size} participantes`}
                          value={
                            rows.length
                              ? (members.size /
                                  new Set(rows.map((e) => e.person)).size) *
                                100
                              : 0
                          }
                          note="Pessoas distintas com inscrições; clique para filtrar"
                        />
                      </button>
                    );
                  })}
                </section>
                <section className="space-y-5 rounded-2xl border bg-card p-6">
                  <h3 className="section-title">Aprendizagem por conteúdo</h3>
                  {[...new Set(rows.map((e) => e.course))].map((id) => {
                    const list = rows.filter((e) => e.course === id);
                    return (
                      <button
                        key={id}
                        className="block w-full text-left"
                        onClick={() => openCourse(id)}
                      >
                        <GoalBar
                          label={list[0].snapshot.title}
                          value={
                            (list.filter((e) => e.state === "Concluído")
                              .length /
                              list.length) *
                            100
                          }
                          note={`${list.filter((e) => e.state === "Concluído").length}/${list.length} inscrições concluídas`}
                        />
                      </button>
                    );
                  })}
                </section>
              </div>
              <section className="space-y-3 rounded-2xl border bg-card p-5">
                <h3 className="mb-4 font-semibold">
                  Histórico individual de aprendizagem
                </h3>
                {rows.map((e) => (
                  <article
                    key={e.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
                  >
                    <div>
                      <h4 className="text-sm font-semibold">
                        {state.people.find((p) => p.id === e.person)?.name} ·{" "}
                        {e.snapshot.title}
                      </h4>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {e.state} · {progress(e)}% · {hours(e.snapshot.minutes)}{" "}
                        declaradas · v{e.version}
                      </p>
                    </div>
                    {manager ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          close();
                          setReview(e.id);
                        }}
                      >
                        Consultar aprendizagem
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          close();
                          setRecommendCourse(e.course);
                          setLicensePerson(e.person);
                        }}
                      >
                        Recomendar próximo passo
                      </Button>
                    )}
                  </article>
                ))}
              </section>
            </>
          )}
          {((manager && management === "Conteúdos e aprovação") ||
            (!manager && management === "Meus conteúdos propostos")) && (
            <>
              <div className="flex flex-wrap justify-between gap-3">
                <h2 className="section-title">Curadoria e publicação</h2>
                <Button
                  onClick={() => {
                    close();
                    setEditor(null);
                  }}
                >
                  Cadastrar conteúdo
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {state.courses
                  .filter((c) => manager || c.author === scope.user)
                  .map((c) => {
                    const d = c.draft ?? c.published!;
                    return (
                      <article
                        key={c.id}
                        className="rounded-2xl border bg-card p-4"
                      >
                        <Cover cover={d.cover} title={d.title} />
                        <div className="mt-4 flex flex-wrap justify-between gap-2">
                          <Badge>{c.state}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {c.published
                              ? `Publicado v${c.version}`
                              : "Ainda não publicado"}
                          </span>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">
                          {d.title}
                        </h3>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {d.kind} · {d.instructor}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openCourse(c.id, true)}
                          >
                            Prévia editorial
                          </Button>
                          {c.state !== "Arquivado" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                close();
                                setEditor(c.id);
                              }}
                            >
                              Editar conteúdo
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              act(
                                (s) => duplicateCourse(s, scope, c.id),
                                "Cópia criada como rascunho, sem copiar licenças ou investimento.",
                              )
                            }
                          >
                            Duplicar conteúdo
                          </Button>
                          {c.draft && c.state === "Rascunho" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                act(
                                  (s) => submitCourse(s, scope, c.id),
                                  "Proposta enviada para aprovação.",
                                )
                              }
                            >
                              Enviar para aprovação
                            </Button>
                          )}
                          {manager && c.draft && c.state !== "Arquivado" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                act(
                                  (s) => publishCourse(s, scope, c.id),
                                  "Conteúdo aprovado e publicado explicitamente.",
                                )
                              }
                            >
                              Aprovar e publicar
                            </Button>
                          )}
                          {c.published && c.state !== "Arquivado" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                close();
                                setLink(c.id);
                              }}
                            >
                              Vincular a outro módulo
                            </Button>
                          )}
                          {(manager || !c.published) &&
                            c.state !== "Arquivado" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Arquivar este conteúdo sem apagar o histórico ou documentos?",
                                    )
                                  )
                                    act(
                                      (s) => archiveCourse(s, scope, c.id),
                                      "Conteúdo arquivado.",
                                    );
                                }}
                              >
                                Arquivar conteúdo
                              </Button>
                            )}
                        </div>
                      </article>
                    );
                  })}
              </div>
            </>
          )}
          {manager && management === "Cursos externos e licenças" && (
            <>
              <p className="rounded-xl bg-accent p-4 text-sm leading-6">
                Licenças e investimentos são exclusivos da gestão. Não há senhas
                na Academy nem integração que conceda ou revogue acesso real ao
                fornecedor.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {state.courses
                  .filter(
                    (c) => (c.published ?? c.draft)?.kind === "Curso externo",
                  )
                  .map((c) => {
                    const pool = state.finance?.find((f) => f.course === c.id),
                      used = state.grants.filter(
                        (g) => g.course === c.id && g.active,
                      ).length;
                    return (
                      <article
                        key={c.id}
                        className="space-y-4 rounded-2xl border bg-card p-6"
                      >
                        <h3 className="text-xl font-semibold">
                          {(c.published ?? c.draft)!.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {(c.published ?? c.draft)!.external?.platform} ·{" "}
                          {(c.published ?? c.draft)!.external?.vendor}
                        </p>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Adquiridas
                            </p>
                            <strong>{pool?.licenses ?? 0}</strong>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Atribuídas
                            </p>
                            <strong>{used}</strong>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Disponíveis
                            </p>
                            <strong>
                              {pool && pool.validUntil >= dateNow()
                                ? pool.licenses - used
                                : 0}
                            </strong>
                          </div>
                        </div>
                        <p className="text-sm">
                          Investimento: {brl(pool?.amount ?? 0)} · Validade:{" "}
                          {pool?.validUntil ?? "Não configurada"}
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => {
                            close();
                            setTerms(c.id);
                          }}
                        >
                          Gerenciar condições e licenças
                        </Button>
                      </article>
                    );
                  })}
              </div>
            </>
          )}
          {manager && management === "Conclusões e evidências" && (
            <>
              <h2 className="section-title">Validações de aprendizagem</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {state.enrollments
                  .filter(
                    (e) =>
                      e.state === "Aguardando RH" ||
                      e.state === "Ajustes solicitados",
                  )
                  .map((e) => (
                    <article
                      key={e.id}
                      className="rounded-2xl border bg-card p-5"
                    >
                      <Badge>{e.state}</Badge>
                      <h3 className="mt-4 text-lg font-semibold">
                        {state.people.find((p) => p.id === e.person)?.name}
                      </h3>
                      <p className="mt-2 text-sm">{e.snapshot.title}</p>
                      <Button
                        className="mt-4"
                        onClick={() => {
                          close();
                          setReview(e.id);
                        }}
                      >
                        Revisar conclusão
                      </Button>
                    </article>
                  ))}
              </div>
            </>
          )}
          {manager && management === "Trilhas e configurações" && (
            <>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => {
                    close();
                    setTrackEdit(null);
                  }}
                >
                  Cadastrar trilha
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    close();
                    setConfig("category");
                  }}
                >
                  Configurar categorias
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    close();
                    setConfig("settings");
                  }}
                >
                  Personalizar início
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {state.tracks.map((t) => (
                  <article
                    key={t.id}
                    className="rounded-2xl border bg-card p-5"
                  >
                    <Badge>{t.state}</Badge>
                    <h3 className="mt-4 text-lg font-semibold">{t.name}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {t.objective}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          close();
                          setTrackEdit(t);
                        }}
                      >
                        Personalizar trilha
                      </Button>
                      {t.state !== "Arquivada" && t.state !== "Publicada" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            act(
                              (s) => publishTrack(s, scope, t.id),
                              "Trilha aprovada e publicada.",
                            )
                          }
                        >
                          Aprovar trilha
                        </Button>
                      )}
                      {t.state !== "Arquivada" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (
                              window.confirm(
                                "Arquivar a trilha, preservando suas inscrições e o aprendizado?",
                              )
                            )
                              act(
                                (s) => archiveTrack(s, scope, t.id),
                                "Trilha arquivada.",
                              );
                          }}
                        >
                          Arquivar trilha
                        </Button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
              <section className="space-y-3 rounded-2xl border bg-card p-5">
                <h3 className="font-semibold">Investimentos por conteúdo</h3>
                <p className="text-sm text-muted-foreground">
                  Dados demonstrativos, sem integração contábil ou pagamentos.
                  Utilize o cadastro por conteúdo para incluir treinamentos
                  internos.
                </p>
                {catalog.map((c) => (
                  <button
                    key={c.id}
                    className="flex w-full justify-between rounded-xl border p-3 text-left text-sm"
                    onClick={() => {
                      close();
                      setTerms(c.id);
                    }}
                  >
                    <span>{c.published!.title}</span>
                    <span>
                      {brl(
                        state.finance?.find((f) => f.course === c.id)?.amount ??
                          0,
                      )}
                    </span>
                  </button>
                ))}
              </section>
            </>
          )}
          {!manager && management === "Recomendar treinamento" && (
            <section className="rounded-2xl border bg-card p-6">
              <h2 className="section-title">
                Compartilhe uma orientação de aprendizagem
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Recomende conteúdos autorizados a CLT e estagiários da sua
                equipe. Nenhuma indicação de promoção, imposição ou aviso real é
                gerado.
              </p>
              <div className="mt-5">{courseGrid(catalog.slice(0, 6))}</div>
            </section>
          )}
        </>
      )}
      {selected &&
        data &&
        (manager ||
          selected.author === scope.user ||
          visibleCourse(state, scope, selected)) && (
          <Modal
            title={
              editorial
                ? "Prévia editorial do conteúdo"
                : "Explorar aprendizagem"
            }
            close={() => {
              setDetail(null);
              close();
            }}
          >
            {message}
            <div className="space-y-5">
              <Cover cover={data.cover} title={data.title} large />
              <div className="flex flex-wrap gap-2">
                <Badge>{data.kind}</Badge>
                <Badge>{data.difficulty}</Badge>
                <Badge>{hours(data.minutes)}</Badge>
                {editorial && (
                  <Badge>
                    Prévia privada · não concede acesso como aprendiz
                  </Badge>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-8">
                {data.description}
              </p>
              <p className="text-sm text-muted-foreground">
                {data.instructor} ·{" "}
                {state.categories.find((c) => c.id === data.category)?.name} ·{" "}
                {data.tags.join(" · ")}
              </p>
              <div className="space-y-3">
                {data.modules.map((m) => (
                  <details key={m.id} className="rounded-xl border p-4">
                    <summary className="cursor-pointer text-sm font-semibold">
                      {m.name} · {m.lessons.length} aulas
                    </summary>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {m.lessons.map((l) => (
                        <li key={l.id}>{l.name}</li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
              {data.external && (
                <div className="rounded-xl border p-4">
                  <p className="text-sm font-semibold">
                    {data.external.platform} · {data.external.vendor}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
                    {data.external.instructions}
                  </p>
                  {!activeLicense(state, selected.id, me?.id ?? "") && (
                    <p className="mt-3 text-sm text-primary">
                      Licença não atribuída ou fora da vigência. Procure a
                      gestão pelos canais existentes; a demonstração não envia
                      solicitações.
                    </p>
                  )}
                </div>
              )}
              <p className="rounded-xl bg-accent p-4 text-sm leading-6">
                Documento configurado: {data.awardMode}. Emissão apenas
                demonstrativa, conforme os critérios de conclusão. Não gera
                pontos no Hall nem elegibilidade automática de carreira.
              </p>
              <div className="flex flex-wrap gap-3">
                {!editorial &&
                  selected.state !== "Arquivado" &&
                  visibleCourse(state, scope, selected) &&
                  data.kind !== "Treinamento ao vivo" && (
                    <Button
                      onClick={() => learn(selected)}
                      disabled={
                        data.kind === "Curso externo" &&
                        !activeLicense(state, selected.id, me?.id ?? "")
                      }
                    >
                      {my.some(
                        (e) =>
                          e.course === selected.id &&
                          e.version === selected.version,
                      )
                        ? "Continuar aprendizado"
                        : "Iniciar aprendizado"}
                    </Button>
                  )}
                {!editorial && data.kind === "Treinamento ao vivo" && (
                  <Button
                    onClick={() => {
                      setDetail(null);
                      setTab("Agenda de Treinamentos");
                    }}
                  >
                    Consultar agenda deste treinamento
                  </Button>
                )}
                {creator && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDetail(null);
                      close();
                      setRecommendCourse(selected.id);
                    }}
                  >
                    Recomendar conteúdo
                  </Button>
                )}
                {creator &&
                  selected.published &&
                  selected.state !== "Arquivado" && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDetail(null);
                        close();
                        setLink(selected.id);
                      }}
                    >
                      Conectar conteúdo a outro módulo
                    </Button>
                  )}
              </div>
              {editorial && (
                <div className="space-y-6 rounded-xl border p-4">
                  <h3 className="font-semibold">Prévia dos blocos</h3>
                  {data.modules
                    .flatMap((m) => m.lessons)
                    .flatMap((l) => l.blocks)
                    .filter((b) => b.kind !== "Questionário")
                    .map((b) => (
                      <BlockView key={b.id} block={b} />
                    ))}
                </div>
              )}
            </div>
          </Modal>
        )}
      {detail && !selected && (
        <Modal title="Conteúdo indisponível" close={() => setDetail(null)}>
          <p className="text-sm leading-7">
            O conteúdo não está disponível para este perfil, organização ou
            navegador.
          </p>
        </Modal>
      )}
      {editor !== undefined && creator && (
        <Modal
          title={
            editor ? "Editar conteúdo Academy" : "Cadastrar conteúdo Academy"
          }
          close={() => {
            setEditor(undefined);
            close();
          }}
        >
          {message}
          <CourseEditor
            initial={editing?.draft ?? editing?.published}
            state={state}
            save={(d) => {
              if (
                act(
                  (s) => saveCourse(s, scope, editing?.id ?? uid(), d),
                  "Rascunho salvo. Aprovação e publicação são ações separadas.",
                )
              )
                setEditor(undefined);
            }}
          />
        </Modal>
      )}
      {enrollment && (
        <Modal
          title="Sala de aprendizagem"
          close={() => {
            setPlayer(null);
            close();
          }}
        >
          {message}
          <LearningPlayer
            key={enrollment.id}
            enrollment={enrollment}
            state={state}
            scope={scope}
            complete={(lesson) =>
              act(
                (s) => completeLesson(s, scope, enrollment.id, lesson),
                "Progresso atualizado localmente.",
              )
            }
            quiz={(lesson, answers) =>
              act(
                (s) => checkQuiz(s, scope, enrollment.id, lesson, answers),
                "Tentativa de conhecimento registrada localmente.",
              )
            }
            proof={(text, file) =>
              act(
                (s) => submitProof(s, scope, enrollment.id, text, file),
                "Evidência enviada para validação demonstrativa.",
              )
            }
          />
        </Modal>
      )}
      {artifact && (
        <Modal
          title="Conquista de aprendizagem"
          close={() => setArtifact(null)}
        >
          <Certificate artifact={artifact} />
        </Modal>
      )}
      {review && manager && (
        <Modal
          title="Histórico e validação de aprendizagem"
          close={() => {
            setReview(null);
            close();
          }}
        >
          {message}
          <div className="space-y-5">
            <h3 className="text-xl font-semibold">
              {state.people.find((p) => p.id === review.person)?.name}
            </h3>
            <p className="text-sm">
              {review.snapshot.title} · {review.state} · v{review.version}
            </p>
            <GoalBar
              label="Progresso registrado"
              value={progress(review)}
              note="Conclusões são registros locais de aprendizagem, sem equivalência a jornada."
            />
            {review.proof && (
              <section className="space-y-3 rounded-xl border p-4">
                <h4 className="font-semibold">Evidência enviada</h4>
                <p className="whitespace-pre-wrap text-sm leading-7">
                  {review.proof.text}
                </p>
                {review.proof.file && <FileCard file={review.proof.file} />}
                <p className="text-xs text-muted-foreground">
                  Enviada em {new Date(review.proof.at).toLocaleString("pt-BR")}
                </p>
              </section>
            )}
            {review.state === "Aguardando RH" && (
              <>
                <AreaField
                  label="Parecer da conclusão Academy"
                  value={comment}
                  onChange={setComment}
                />
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() =>
                      act(
                        (s) => reviewProof(s, scope, review.id, true, comment),
                        "Conclusão validada; documento demonstrativo gerado conforme configuração.",
                      )
                    }
                  >
                    Validar conclusão Academy
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      act(
                        (s) => reviewProof(s, scope, review.id, false, comment),
                        "Complementação solicitada localmente, sem envio de mensagem.",
                      )
                    }
                  >
                    Solicitar complementação Academy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Não é permitida a validação da própria conclusão.
                </p>
              </>
            )}
            <Events events={review.events} />
          </div>
        </Modal>
      )}
      {commercial && manager && (
        <Modal
          title="Condições, investimento e licenças"
          close={() => {
            setTerms(null);
            close();
          }}
        >
          {message}
          <h3 className="mb-5 text-xl font-semibold">
            {(commercial.published ?? commercial.draft)!.title}
          </h3>
          <EntityForm
            key={commercial.id}
            fields={[
              f("amount", "Investimento demonstrativo (R$)", "money"),
              f("date", "Data do investimento", "date"),
              f("validUntil", "Validade das condições / licenças", "date"),
              ...((commercial.published ?? commercial.draft)!.kind ===
              "Curso externo"
                ? [f("licenses", "Licenças adquiridas", "number")]
                : []),
            ]}
            initial={{
              amount: String(
                (state.finance?.find((f) => f.course === commercial.id)
                  ?.amount ?? 0) / 100,
              ),
              date:
                state.finance?.find((f) => f.course === commercial.id)?.date ??
                dateNow(),
              validUntil:
                state.finance?.find((f) => f.course === commercial.id)
                  ?.validUntil ?? dateNow().slice(0, 4) + "-12-31",
              licenses: String(
                state.finance?.find((f) => f.course === commercial.id)
                  ?.licenses ?? 0,
              ),
            }}
            description="Valores fictícios. Alterar este cadastro não realiza pagamento ou compra e não concede acesso real ao fornecedor. Quantidade não pode ficar abaixo das atribuições ativas."
            save={(d) =>
              !!act(
                (s) =>
                  saveFinance(s, scope, {
                    course: commercial.id,
                    amount: cents(d.amount),
                    date: d.date,
                    validUntil: d.validUntil,
                    licenses: Number(d.licenses ?? 0),
                  }),
                "Condições registradas localmente.",
              )
            }
          />
          {commercial.published?.kind === "Curso externo" && (
            <section className="mt-6 space-y-4 rounded-xl border p-4">
              <h4 className="font-semibold">
                Profissionais autorizados e utilização
              </h4>
              <Pick
                label="Profissional para atribuir licença"
                value={licensePerson}
                onChange={setLicensePerson}
                options={[
                  { id: "", name: "Selecione elegível" },
                  ...state.people
                    .filter((p) => visibleCourse(state, scope, commercial, p))
                    .map((p) => ({
                      id: p.id,
                      name: `${p.name} · ${p.contract}`,
                    })),
                ]}
              />
              <Button
                onClick={() =>
                  act(
                    (s) =>
                      assignLicense(s, scope, commercial.id, licensePerson),
                    "Licença demonstrativa atribuída.",
                  )
                }
              >
                Atribuir licença
              </Button>
              {state.grants
                .filter((g) => g.course === commercial.id)
                .map((g) => (
                  <article
                    key={g.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {state.people.find((p) => p.id === g.person)?.name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {g.active ? "Ativa" : "Liberada"} · atribuída em{" "}
                        {new Date(g.assignedAt).toLocaleDateString("pt-BR")}
                        {g.releasedAt
                          ? ` · liberada em ${new Date(g.releasedAt).toLocaleDateString("pt-BR")}`
                          : ""}
                      </p>
                    </div>
                    {g.active && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Liberar apenas a licença demonstrativa? O fornecedor não será alterado.",
                            )
                          )
                            act(
                              (s) => releaseLicense(s, scope, g.id),
                              "Atribuição local liberada; histórico preservado.",
                            );
                        }}
                      >
                        Liberar licença demonstrativa
                      </Button>
                    )}
                  </article>
                ))}
            </section>
          )}
        </Modal>
      )}
      {session && (
        <Modal
          title="Treinamento e participantes"
          close={() => {
            setSession(null);
            close();
          }}
        >
          {message}
          <div className="space-y-5">
            <h3 className="text-2xl font-semibold">{session.title}</h3>
            <div className="flex flex-wrap gap-2">
              <Badge>
                {session.closed ? "Registro encerrado" : "Registro em aberto"}
              </Badge>
              <Badge>{session.schedule.format}</Badge>
              <Badge>v{session.version}</Badge>
            </div>
            <p className="text-sm">
              {dt(session.schedule.date)} · {session.schedule.time} (Brasília) ·{" "}
              {session.schedule.duration} min
            </p>
            <p className="text-sm text-muted-foreground">
              {session.instructor} · {session.schedule.location}
            </p>
            {!session.closed &&
              !sessionEnded(session) &&
              state.courses.some(
                (c) =>
                  c.id === session.course &&
                  c.version === session.version &&
                  visibleCourse(state, scope, c),
              ) && (
                <Button
                  onClick={() =>
                    act(
                      (s) => registerSession(s, scope, session.id),
                      "Inscrição demonstrativa registrada, sem convite real.",
                    )
                  }
                  disabled={session.participants.includes(me?.id ?? "")}
                >
                  {session.participants.includes(me?.id ?? "")
                    ? "Minha participação registrada"
                    : "Registrar minha participação"}
                </Button>
              )}
            <section className="space-y-3">
              <h4 className="font-semibold">Materiais complementares</h4>
              {session.materials.map((b) => (
                <BlockView key={b.id} block={b} />
              ))}
            </section>
            {manager && (
              <section className="space-y-4 rounded-xl border bg-muted/20 p-4">
                <h4 className="font-semibold">
                  Registro de participantes e presença
                </h4>
                {!session.closed && (
                  <>
                    <Pick
                      label="Participante autorizado para incluir"
                      value={attendee}
                      onChange={setAttendee}
                      options={[
                        { id: "", name: "Selecione" },
                        ...state.people
                          .filter(
                            (p) =>
                              audienceAllows(session.audience, p) &&
                              !session.participants.includes(p.id),
                          )
                          .map((p) => ({ id: p.id, name: p.name })),
                      ]}
                    />
                    <Button
                      variant="outline"
                      onClick={() =>
                        act(
                          (s) => addParticipant(s, scope, session.id, attendee),
                          "Participante registrado localmente.",
                        )
                      }
                    >
                      Incluir participante
                    </Button>
                  </>
                )}
                {session.participants.map((id) => (
                  <Check
                    key={id}
                    label={`Presença: ${state.people.find((p) => p.id === id)?.name}`}
                    checked={session.present.includes(id)}
                    disabled={session.closed}
                    onChange={(present) =>
                      act(
                        (s) =>
                          markAttendance(s, scope, session.id, id, present),
                        "Presença preparada; confirme ao encerrar o registro.",
                      )
                    }
                  />
                ))}
                {!session.closed && (
                  <Button
                    onClick={() => {
                      if (
                        window.confirm(
                          "Encerrar o registro de participação e gerar somente os documentos demonstrativos configurados?",
                        )
                      )
                        act(
                          (s) => closeSession(s, scope, session.id),
                          "Participação consolidada localmente.",
                        );
                    }}
                  >
                    Encerrar registro de participação
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  O encerramento requer que a sessão tenha terminado. Registros
                  encerrados são preservados, sem avisos ou certificados
                  oficiais.
                </p>
              </section>
            )}
            {manager && session.closed && (
              <section className="space-y-4 rounded-xl border p-4">
                <h4 className="font-semibold">Gravação posterior e catálogo</h4>
                <Upload
                  label="Gravação demonstrativa local"
                  accept="video/mp4,video/webm"
                  limit={25}
                  onFile={(f) =>
                    act(
                      (s) => saveRecording(s, scope, session.id, f.url),
                      "Gravação local adicionada.",
                    )
                  }
                />
                <Button
                  variant="outline"
                  onClick={() =>
                    act(
                      (s) =>
                        saveRecording(
                          s,
                          scope,
                          session.id,
                          "/demo/academy/intro.webm",
                        ),
                      "Vídeo demonstrativo local associado.",
                    )
                  }
                >
                  Usar gravação demonstrativa
                </Button>
                {session.recording && (
                  <>
                    <BlockView
                      block={{
                        id: "recording",
                        kind: "Vídeo",
                        text: "Gravação local, sem publicação automática.",
                        url: session.recording,
                      }}
                    />
                    <Button
                      onClick={() =>
                        act(
                          (s) => prepareRecording(s, scope, session.id),
                          "Gravação enviada à aprovação no mesmo conteúdo do catálogo, sem duplicidade.",
                        )
                      }
                    >
                      Preparar conteúdo permanente
                    </Button>
                  </>
                )}
              </section>
            )}
            <Events events={session.events} />
          </div>
        </Modal>
      )}
      {trackEdit !== undefined && creator && (
        <Modal
          title="Configurar trilha Academy"
          close={() => {
            setTrackEdit(undefined);
            close();
          }}
        >
          {message}
          <TrackEditor
            state={state}
            initial={trackEdit ?? undefined}
            save={(t) => {
              if (
                act(
                  (s) => saveTrack(s, scope, t),
                  "Trilha salva como rascunho.",
                )
              )
                setTrackEdit(undefined);
            }}
          />
        </Modal>
      )}
      {track && (
        <Modal
          title="Mapa da trilha de aprendizagem"
          close={() => {
            setTrackDetail(null);
            close();
          }}
        >
          {message}
          <TrackDetail
            state={state}
            scope={scope}
            track={track}
            open={openCourse}
            join={() =>
              act(
                (s) => joinTrack(s, scope, track.id),
                "Trilha adicionada ao meu aprendizado.",
              )
            }
            edit={() => {
              setTrackDetail(null);
              setTrackEdit(track);
            }}
            submit={() =>
              act(
                (s) => submitTrack(s, scope, track.id),
                "Trilha enviada para aprovação.",
              )
            }
            publish={() =>
              act((s) => publishTrack(s, scope, track.id), "Trilha publicada.")
            }
          />
        </Modal>
      )}
      {linkId && creator && (
        <Modal
          title="Reutilizar conteúdo em outro módulo"
          close={() => {
            setLink(null);
            close();
          }}
        >
          {message}
          <AcademyLinkEditor
            state={state}
            scope={scope}
            course={linkId}
            initial={targets}
            add={(ref) => {
              if (
                links.value.some(
                  (r) =>
                    r.course === ref.course &&
                    r.kind === ref.kind &&
                    r.target === ref.target,
                )
              ) {
                act(() => {
                  throw new Error(
                    "Este conteúdo já está vinculado ao destino.",
                  );
                });
                return;
              }
              links.setValue([...links.value, ref]);
              act(
                (s) => s,
                "Referência ao catálogo adicionada. Nenhuma aula, avaliação ou etapa foi concluída automaticamente.",
              );
            }}
          />
        </Modal>
      )}
      {config === "category" && manager && (
        <Modal
          title="Categorias Academy"
          close={() => {
            setConfig(null);
            close();
          }}
        >
          {message}
          <EntityForm
            fields={[f("name", "Nome da nova categoria")]}
            initial={{ name: "" }}
            save={(d) =>
              !!act(
                (s) =>
                  saveCategory(s, scope, {
                    id: uid(),
                    name: d.name,
                    active: true,
                  }),
                "Categoria adicionada.",
              )
            }
          />
          <div className="mt-5 space-y-3">
            {state.categories.map((c) => (
              <CategoryRow
                key={c.id}
                category={c}
                save={(name) =>
                  act(
                    (s) => saveCategory(s, scope, { ...c, name }),
                    "Categoria atualizada.",
                  )
                }
                toggle={() =>
                  act(
                    (s) => saveCategory(s, scope, { ...c, active: !c.active }),
                    "Disponibilidade da categoria atualizada, sem apagar conteúdos.",
                  )
                }
              />
            ))}
          </div>
        </Modal>
      )}
      {config === "settings" && manager && (
        <Modal
          title="Identidade do início Academy"
          close={() => {
            setConfig(null);
            close();
          }}
        >
          {message}
          <EntityForm
            fields={[
              f("headline", "Título do banner"),
              f("description", "Mensagem do banner", "textarea"),
            ]}
            initial={state.settings}
            save={(d) => {
              const ok = act(
                (s) => saveSettings(s, scope, d.headline, d.description),
                "Início personalizado localmente.",
              );
              if (ok) setConfig(null);
              return !!ok;
            }}
          />
        </Modal>
      )}
      {recommendCourse && creator && (
        <Modal
          title="Recomendar aprendizagem"
          close={() => {
            setRecommendCourse(null);
            close();
          }}
        >
          {message}
          <Pick
            label="Profissional da recomendação"
            value={licensePerson}
            onChange={setLicensePerson}
            options={[
              { id: "", name: "Selecione no escopo" },
              ...teamPeople
                .filter((p) =>
                  state.courses.some(
                    (c) =>
                      c.id === recommendCourse &&
                      visibleCourse(state, scope, c, p),
                  ),
                )
                .map((p) => ({ id: p.id, name: `${p.name} · ${p.contract}` })),
            ]}
          />
          <div className="mt-4">
            <AreaField
              label="Orientação de aprendizagem"
              value={comment}
              onChange={setComment}
            />
          </div>
          <Button
            className="mt-4"
            onClick={() => {
              if (
                act(
                  (s) =>
                    recommend(
                      s,
                      scope,
                      licensePerson,
                      recommendCourse,
                      comment,
                    ),
                  "Recomendação registrada somente na demonstração.",
                )
              )
                setRecommendCourse(null);
            }}
          >
            Registrar recomendação local
          </Button>
        </Modal>
      )}
    </div>
  );
}
function CategoryRow({
  category,
  save,
  toggle,
}: {
  category: AcademyState["categories"][number];
  save: (name: string) => unknown;
  toggle: () => void;
}) {
  const [name, setName] = useState(category.name);
  return (
    <article className="space-y-3 rounded-xl border p-4">
      <TextField
        label={`Categoria: ${category.name}`}
        value={name}
        onChange={setName}
      />
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => save(name)}>
          Salvar nome da categoria
        </Button>
        <Button size="sm" variant="ghost" onClick={toggle}>
          {category.active ? "Desativar categoria" : "Ativar categoria"}
        </Button>
      </div>
    </article>
  );
}
function TrackEditor({
  state,
  initial,
  save,
}: {
  state: AcademyState;
  initial?: Track;
  save: (t: Track) => void;
}) {
  const [t, set] = useState<Track>(() =>
    initial
      ? structuredClone(initial)
      : {
          id: uid(),
          name: "",
          description: "",
          sector: "",
          role: "",
          contracts: ["CLT", "Estágio"],
          competency: "",
          objective: "",
          serviceOptional: false,
          courseIds: [],
          state: "Rascunho",
          author: "",
        },
  );
  const patch = (p: Partial<Track>) => set({ ...t, ...p });
  const courses = state.courses.filter(
    (c) => c.published && c.state !== "Arquivado",
  );
  const roles = [...new Set(state.people.map((p) => p.role).filter(Boolean))];
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        save(t);
      }}
    >
      <p className="rounded-xl bg-accent p-4 text-sm leading-6">
        Referências ao catálogo central, sem duplicar aulas. A sequência pode
        ser reorganizada. Para PJ, a trilha deve ser opcional, pertinente aos
        serviços e conter somente conteúdos autorizados.
      </p>
      <TextField
        label="Nome da trilha"
        value={t.name}
        onChange={(name) => patch({ name })}
        required
      />
      <AreaField
        label="Descrição da trilha"
        value={t.description}
        onChange={(description) => patch({ description })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Pick
          label="Setor da trilha"
          value={t.sector}
          onChange={(sector) => patch({ sector })}
          options={[{ id: "", name: "Todos os setores" }, ...sectors]}
        />
        <Pick
          label="Cargo da trilha"
          value={t.role}
          onChange={(role) => patch({ role })}
          options={[
            { id: "", name: "Todos os cargos elegíveis" },
            ...roles.map((id) => ({
              id,
              name: `${jobName(id)} · ${sectorName(id.split("-")[0])}`,
            })),
          ]}
        />
        <TextField
          label="Competência da trilha"
          value={t.competency}
          onChange={(competency) => patch({ competency })}
        />
        <TextField
          label="Objetivo de desenvolvimento ou serviços"
          value={t.objective}
          onChange={(objective) => patch({ objective })}
          required
        />
      </div>
      <fieldset className="flex flex-wrap gap-5">
        <legend className="mb-3 text-sm font-semibold">
          Modalidades autorizadas
        </legend>
        {(["CLT", "Estágio", "PJ"] as Contract[]).map((c) => (
          <Check
            key={c}
            label={`Trilha para ${c}`}
            checked={t.contracts.includes(c)}
            onChange={(checked) =>
              patch({
                contracts: checked
                  ? [...t.contracts, c]
                  : t.contracts.filter((x) => x !== c),
              })
            }
          />
        ))}
      </fieldset>
      <Check
        label="Trilha opcional e pertinente à prestação de serviços PJ"
        checked={t.serviceOptional}
        onChange={(serviceOptional) => patch({ serviceOptional })}
      />
      <section className="space-y-3 rounded-xl border p-4">
        <h3 className="text-sm font-semibold">
          Selecionar conteúdos publicados
        </h3>
        {courses.map((c) => (
          <Check
            key={c.id}
            label={c.published!.title}
            checked={t.courseIds.includes(c.id)}
            onChange={(checked) =>
              patch({
                courseIds: checked
                  ? [...t.courseIds, c.id]
                  : t.courseIds.filter((id) => id !== c.id),
              })
            }
          />
        ))}
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Ordem da aprendizagem</h3>
        {t.courseIds.map((id, i) => (
          <div
            key={id}
            className="flex items-center justify-between gap-3 rounded-xl border p-3"
          >
            <p className="text-sm">
              {i + 1}.{" "}
              {state.courses.find((c) => c.id === id)?.published?.title}
            </p>
            <Reorder
              name={`conteúdo da trilha ${i + 1}`}
              first={i === 0}
              last={i === t.courseIds.length - 1}
              up={() => patch({ courseIds: move(t.courseIds, i, -1) })}
              down={() => patch({ courseIds: move(t.courseIds, i, 1) })}
              remove={() =>
                patch({ courseIds: t.courseIds.filter((x) => x !== id) })
              }
            />
          </div>
        ))}
      </section>
      <Button type="submit">Salvar trilha como rascunho</Button>
    </form>
  );
}
function TrackDetail({
  state,
  scope,
  track,
  open,
  join,
  edit,
  submit,
  publish,
}: {
  state: AcademyState;
  scope: Scope;
  track: Track;
  open: (id: string) => void;
  join: () => void;
  edit: () => void;
  submit: () => void;
  publish: () => void;
}) {
  const t = trackView(track),
    p = own(state, scope),
    joined = state.trackJoins.find(
      (j) => j.person === p?.id && j.track === t.id,
    ),
    ids = joined?.courseIds ?? t.courseIds,
    my = state.enrollments.filter((e) => e.person === p?.id),
    done = ids.filter((id) =>
      my.some((e) => e.course === id && e.state === "Concluído"),
    ).length;
  return (
    <div className="space-y-5">
      <header className="rounded-2xl bg-gradient-to-br from-stone-950 to-orange-950 p-6 text-white">
        <p className="text-xs uppercase tracking-widest text-orange-200">
          Trilha de aprendizagem
        </p>
        <h3 className="mt-4 text-2xl font-semibold">
          {joined?.title ?? t.name}
        </h3>
        <p className="mt-3 text-sm leading-7 text-stone-300">{t.objective}</p>
        <p className="mt-4 text-sm">
          {done}/{ids.length} conteúdos concluídos · {t.competency}
        </p>
        <p className="mt-3 text-xs text-stone-300">
          Sequência orientadora, sem promoção ou elegibilidade automática.{" "}
          {t.serviceOptional ? "Opcional para prestadores autorizados." : ""}
        </p>
      </header>
      {ids.map((id, i) => {
        const c = state.courses.find((c) => c.id === id),
          completed = my.some(
            (e) => e.course === id && e.state === "Concluído",
          );
        return (
          <div
            key={id}
            className="relative flex items-start gap-4 rounded-xl border bg-card p-4"
          >
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${completed ? "border-orange-300 bg-orange-50 text-primary" : "bg-muted"}`}
            >
              {i + 1}
            </span>
            <div className="flex-1">
              <h4 className="text-sm font-semibold">
                {c?.published?.title ?? "Conteúdo indisponível ou arquivado"}
              </h4>
              <p className="mt-2 text-xs text-muted-foreground">
                {completed
                  ? "Aprendizagem concluída"
                  : (c?.published?.kind ?? "Referência histórica")}
              </p>
              {c?.published && c.state !== "Arquivado" && (
                <Button
                  className="mt-3"
                  size="sm"
                  variant="outline"
                  onClick={() => open(id)}
                >
                  Explorar etapa da trilha
                </Button>
              )}
            </div>
          </div>
        );
      })}
      <div className="flex flex-wrap gap-3">
        {trackAllows(state, scope, track) && (
          <Button disabled={!!joined} onClick={join}>
            {joined
              ? "Trilha no meu aprendizado"
              : "Adicionar ao meu aprendizado"}
          </Button>
        )}
        {(admin(scope) || (scope.leader && track.author === scope.user)) && (
          <Button variant="outline" onClick={edit}>
            Personalizar esta trilha
          </Button>
        )}
        {scope.leader &&
          track.author === scope.user &&
          track.state === "Rascunho" && (
            <Button onClick={submit}>Enviar trilha para aprovação</Button>
          )}
        {admin(scope) &&
          track.state !== "Publicada" &&
          track.state !== "Arquivada" && (
            <Button onClick={publish}>Aprovar e publicar trilha</Button>
          )}
      </div>
    </div>
  );
}
