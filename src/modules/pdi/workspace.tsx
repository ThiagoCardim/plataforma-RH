"use client";
import { EvaluationReferences } from "@/modules/development-links/references";
import { useState } from "react";
import {
  Plus,
  ArrowRight,
  MessageSquare,
  CheckCircle2,
  Clock3,
  Target,
  Paperclip,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, Textarea } from "@/components/ui/fields";
import { Badge } from "@/components/ui/badge";
import { Modal, Meter } from "@/modules/onboarding/components";
import { FileCard } from "@/modules/documents/file-card";
import type { Attachment } from "@/modules/documents/model";
import { EntityForm, type Field } from "@/modules/career/components";
import { type Scope, admin, uid, dateNow } from "@/modules/career/model";
import { useLocalDemo } from "@/modules/local-demo/use-local-demo";
import {
  type PdiState,
  type PlanContent,
  type PdiCycle,
  pdiProjection,
  progress,
  mayEdit,
  mayAct,
  createPlan,
  savePlan,
  reviewPlan,
  actionDone,
  addEvidence,
  feedback,
  closePlan,
  saveCycle,
} from "./model";
export function PdiWorkspace({
  initial,
  scope,
}: {
  initial: PdiState;
  scope: Scope;
}) {
  const {
    value: state,
    setValue: set,
    ready,
    error: storageError,
  } = useLocalDemo(`pdi-v1:${scope.key}`, initial, (s) =>
    pdiProjection(s, scope),
  );
  const [tab, setTab] = useState("Planos de desenvolvimento"),
    [cycleFilter, setCycleFilter] = useState(""),
    [selected, setSelected] = useState<string | null>(null),
    [editing, setEditing] = useState(false),
    [creating, setCreating] = useState(false),
    [cycleEdit, setCycleEdit] = useState<{ id?: string } | null>(null);
  const [personId, setPerson] = useState(""),
    [cycleId, setCycle] = useState(""),
    [comment, setComment] = useState(""),
    [evidenceAction, setEvidenceAction] = useState<string | null>(null),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  const management = admin(scope),
    p = state.plans.find((p) => p.id === selected),
    person = state.people.find((x) => x.id === p?.person),
    modal = !!(p || creating || cycleEdit);
  const visible = state.plans.filter(
    (p) => !cycleFilter || p.cycle.id === cycleFilter,
  );
  const editablePeople = state.people.filter(
    (p) =>
      scope.leader &&
      p.leader === scope.user &&
      p.user !== scope.user &&
      p.contract !== "PJ",
  );
  const pending = state.plans.filter((p) => p.status === "Em aprovação").length;
  const late = state.plans
    .flatMap((p) => p.published?.actions ?? [])
    .filter((a) => !a.done && a.due < dateNow()).length;
  function clear() {
    setNotice("");
    setError("");
    setComment("");
    setEvidenceAction(null);
    setEditing(false);
  }
  function act(fn: (s: PdiState) => PdiState, text: string) {
    try {
      set(fn(state));
      setError("");
      setNotice(text);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  }
  const messages = (
    <>
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mb-4 text-xs text-emerald-800">
          {notice}
        </p>
      )}
    </>
  );
  function cycleEditor() {
    const c = state.cycles.find((x) => x.id === cycleEdit?.id);
    const fields: Field[] = [
      { key: "name", label: "Nome do ciclo de PDI" },
      { key: "start", label: "Início do ciclo de PDI", type: "date" },
      { key: "end", label: "Fim do ciclo de PDI", type: "date" },
      {
        key: "status",
        label: "Estado do ciclo de PDI",
        type: "select",
        options: [
          { value: "Ativo", label: "Ativo" },
          { value: "Encerrado", label: "Encerrado" },
        ],
      },
    ];
    return (
      <EntityForm
        key={c?.id ?? "new"}
        fields={fields}
        initial={{
          name: c?.name ?? "",
          start: c?.start ?? dateNow(),
          end: c?.end ?? dateNow(),
          status: c?.status ?? "Ativo",
        }}
        description="Cada PDI preserva o período do ciclo de origem. Alterar este cadastro não reescreve planos existentes. Ciclos com planos em andamento não podem ser encerrados."
        save={(d) => {
          const ok = act(
            (s) =>
              saveCycle(s, scope, {
                id: c?.id ?? uid(),
                name: d.name,
                start: d.start,
                end: d.end,
                status: d.status as PdiCycle["status"],
              }),
            "Ciclo demonstrativo salvo.",
          );
          if (ok) setCycleEdit(null);
          return ok;
        }}
      />
    );
  }
  if (!ready)
    return <p role="status">Carregando planos de desenvolvimento locais…</p>;
  return (
    <div className="relative w-full min-w-0 max-w-full space-y-6 overflow-x-clip">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-200 bg-accent p-4 text-xs leading-5 text-accent-foreground">
        <div>
          <strong>
            PDI demonstrativo · desenvolvimento de CLT e estagiários
          </strong>
          <p>
            Registros e arquivos apenas neste navegador, sem sincronização. PDI
            não solicita nem garante promoção. PJs não integram os planos
            individuais.
          </p>
        </div>
        <Badge>
          {scope.rh
            ? "RH · aprovação e acompanhamento"
            : scope.director
              ? "Diretoria · acompanhamento"
              : scope.leader
                ? "Liderança · meus planos e equipe"
                : "Meu desenvolvimento"}
        </Badge>
      </div>
      {storageError && (
        <p role="alert" className="text-sm text-destructive">
          {storageError}
        </p>
      )}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-kicker mb-3">
            Desempenho / Desenvolvimento individual
          </p>
          <h1 className="page-title">PDI</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Aprendizados que viram prática. Conversas que abrem caminhos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm("Restaurar somente a demonstração de PDI?")) {
                set(initial);
                clear();
              }
            }}
          >
            <RotateCcw />
            Restaurar demonstração
          </Button>
          {scope.leader && (
            <Button
              onClick={() => {
                clear();
                setCreating(true);
                setPerson(editablePeople[0]?.id ?? "");
                setCycle(
                  state.cycles.find((c) => c.status === "Ativo")?.id ?? "",
                );
              }}
            >
              <Plus />
              Criar PDI da equipe
            </Button>
          )}
        </div>
      </header>
      <nav
        aria-label="Abas do PDI"
        className="flex gap-1 overflow-x-auto border-b pb-2"
      >
        {[
          "Planos de desenvolvimento",
          ...(management || scope.leader ? ["Ciclos"] : []),
          "Histórico",
        ].map((t) => (
          <Button
            key={t}
            variant={tab === t ? "secondary" : "ghost"}
            aria-pressed={tab === t}
            onClick={() => {
              setTab(t);
              clear();
            }}
          >
            {t}
          </Button>
        ))}
      </nav>
      {!modal && messages}
      {tab === "Planos de desenvolvimento" && (
        <>
          <section className="relative overflow-hidden rounded-2xl bg-stone-900 p-6 text-white md:p-8">
            <div className="pointer-events-none absolute -right-10 -top-10 size-60 rounded-full bg-orange-500/15 blur-3xl" />
            <p className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-wider text-orange-300">
              <Sparkles size={15} />
              Foco no desenvolvimento
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">
              Pequenas ações. Aprendizado contínuo.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-stone-300">
              Planeje ações relevantes, compartilhe evidências e transforme
              feedbacks em próximos passos. O progresso abaixo mede ações do
              PDI, sem relação automática com cargo ou remuneração.
            </p>
            <div className="mt-6 flex flex-wrap gap-6">
              {[
                [state.plans.length, "planos no seu escopo"],
                [pending, "em aprovação do RH"],
                [late, "ações com prazo pendente"],
              ].map(([n, l]) => (
                <div key={String(l)}>
                  <p className="text-2xl font-semibold">{n}</p>
                  <p className="mt-1 text-[11px] text-stone-400">{l}</p>
                </div>
              ))}
            </div>
          </section>
          <label className="block max-w-sm text-xs">
            Filtrar ciclo
            <Select
              aria-label="Filtrar ciclo de PDI"
              value={cycleFilter}
              onChange={(e) => setCycleFilter(e.target.value)}
            >
              <option value="">Todos os ciclos</option>
              {state.cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </label>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((p) => {
              const person = state.people.find((x) => x.id === p.person)!;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    clear();
                    setSelected(p.id);
                  }}
                  className="rounded-2xl border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transition-none"
                >
                  <div className="mb-5 flex justify-between">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                      <Target size={20} />
                    </span>
                    <Badge>{p.status}</Badge>
                  </div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {person.contract} ·{" "}
                    {(
                      {
                        architecture: "Arquitetura",
                        engineering: "Engenharia",
                        operations: "Operações",
                      } as Record<string, string>
                    )[person.sector] ?? person.sector}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">{person.name}</h3>
                  <p className="mt-2 min-h-10 text-xs leading-5 text-muted-foreground">
                    {p.published?.title ?? p.draft?.title}
                  </p>
                  <div className="mt-5">
                    <p className="mb-2 flex justify-between text-[11px] text-muted-foreground">
                      <span>Ações concluídas</span>
                      <span>{progress(p)}%</span>
                    </p>
                    <Meter value={progress(p)} color="bg-violet-400" />
                  </div>
                  <p className="mt-4 border-t pt-3 text-[11px] text-muted-foreground">
                    {p.cycle.name}
                    <ArrowRight
                      size={14}
                      className="float-right text-primary"
                    />
                  </p>
                </button>
              );
            })}
          </div>
          {!visible.length && (
            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Nenhum PDI disponível neste contexto. A liderança cria o plano e o
              RH aprova antes de disponibilizá-lo ao profissional.
            </p>
          )}
        </>
      )}
      {tab === "Ciclos" && (management || scope.leader) && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="section-title">Ciclos personalizáveis</h2>
              <p className="mt-2 text-xs text-muted-foreground">
                Prazos de desenvolvimento, sem regra de progressão automática.
              </p>
            </div>
            {scope.rh && (
              <Button
                onClick={() => {
                  clear();
                  setCycleEdit({});
                }}
              >
                <Plus />
                Novo ciclo de PDI
              </Button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {state.cycles.map((c) => (
              <article className="rounded-xl border bg-card p-5" key={c.id}>
                <Badge>{c.status}</Badge>
                <h3 className="mt-4 text-lg font-semibold">{c.name}</h3>
                <p className="mt-3 text-sm text-muted-foreground">
                  {c.start} a {c.end}
                </p>
                <p className="mt-3 text-xs">
                  {state.plans.filter((p) => p.cycle.id === c.id).length} planos
                  no seu escopo
                </p>
                {scope.rh && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      clear();
                      setCycleEdit({ id: c.id });
                    }}
                  >
                    Configurar ciclo de PDI
                  </Button>
                )}
              </article>
            ))}
          </div>
        </>
      )}
      {tab === "Histórico" && (
        <section className="rounded-xl border bg-card p-6">
          <h2 className="section-title mb-5">
            Conversas e atividades de desenvolvimento
          </h2>
          <div className="space-y-5">
            {state.plans
              .flatMap((p) =>
                p.history.map((h) => ({ ...h, person: p.person })),
              )
              .sort((a, b) => b.at.localeCompare(a.at))
              .map((h) => (
                <article
                  className="border-l-2 border-violet-200 pl-4"
                  key={h.id}
                >
                  <p className="text-[11px] text-muted-foreground">
                    {state.people.find((p) => p.id === h.person)?.name}
                  </p>
                  <p className="mt-1 text-sm">{h.text}</p>
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    {h.by} · {new Date(h.at).toLocaleString("pt-BR")}
                  </p>
                </article>
              ))}
          </div>
        </section>
      )}
      {p && person && (
        <Modal
          title={`PDI · ${person.name}`}
          close={() => {
            setSelected(null);
            clear();
          }}
        >
          {messages}
          <div className="space-y-5">
            <EvaluationReferences scope={scope} target="pdi" targetId={p.id} />
            <header className="flex flex-wrap justify-between gap-3">
              <div>
                <Badge>
                  {p.status} · {person.contract}
                </Badge>
                <h3 className="mt-3 text-xl font-semibold">{person.name}</h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  {p.cycle.name} · {p.cycle.start} a {p.cycle.end}
                </p>
              </div>
              {mayEdit(state, scope, p) && p.status !== "Concluído" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(!editing);
                    setEvidenceAction(null);
                  }}
                >
                  Editar estrutura do PDI
                </Button>
              )}
            </header>
            {editing && mayEdit(state, scope, p) ? (
              <PlanEditor
                key={p.id}
                initial={p.draft ?? p.published!}
                cycle={p.cycle}
                save={(content, send) => {
                  const ok = act(
                    (s) => savePlan(s, scope, p.id, content, send),
                    send
                      ? "Versão enviada à aprovação do RH."
                      : "Rascunho salvo pela liderança.",
                  );
                  if (ok) setEditing(false);
                  return ok;
                }}
              />
            ) : (
              <>
                {p.published ? (
                  <>
                    <section className="rounded-xl bg-violet-50/60 p-5">
                      <p className="text-[10px] uppercase tracking-wider text-violet-700">
                        Versão publicada · ações de desenvolvimento
                      </p>
                      <h4 className="mt-3 text-lg font-semibold">
                        {p.published.title}
                      </h4>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {p.published.objective}
                      </p>
                      <div className="mt-4">
                        <p className="mb-2 text-xs">
                          {progress(p)}% das ações concluídas
                        </p>
                        <Meter value={progress(p)} color="bg-violet-400" />
                      </div>
                    </section>
                    {p.published.actions.map((a) => (
                      <article
                        className="space-y-4 rounded-xl border bg-card p-4"
                        key={a.id}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <label className="flex items-start gap-3 text-sm font-semibold">
                            <input
                              className="mt-1"
                              type="checkbox"
                              aria-label={`Concluir ação ${a.title}`}
                              checked={a.done}
                              disabled={!mayAct(state, scope, p)}
                              onChange={(e) =>
                                act(
                                  (s) =>
                                    actionDone(
                                      s,
                                      scope,
                                      p.id,
                                      a.id,
                                      e.target.checked,
                                    ),
                                  "Progresso da ação atualizado, sem efeito na carreira.",
                                )
                              }
                            />
                            {a.title}
                          </label>
                          <Badge>
                            {a.done
                              ? "Concluída"
                              : a.due < dateNow()
                                ? "Prazo pendente"
                                : "Em desenvolvimento"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <Clock3 size={12} className="mr-1 inline" />
                          Até {a.due}
                          {a.completedAt &&
                            ` · concluída em ${new Date(a.completedAt).toLocaleDateString("pt-BR")}`}
                        </p>
                        {a.evidence.map((e) => (
                          <div
                            className="space-y-2 rounded-lg bg-muted/40 p-3"
                            key={e.id}
                          >
                            <p className="whitespace-pre-wrap text-sm">
                              {e.text}
                            </p>
                            {e.url && /^https?:\/\//i.test(e.url) && (
                              <a
                                href={e.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary underline"
                              >
                                Abrir evidência
                              </a>
                            )}
                            {e.file && <FileCard file={e.file} />}
                            <p className="text-[10px] text-muted-foreground">
                              {e.by} · {new Date(e.at).toLocaleString("pt-BR")}
                            </p>
                          </div>
                        ))}
                        {mayAct(state, scope, p) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setEvidenceAction(
                                evidenceAction === a.id ? null : a.id,
                              )
                            }
                          >
                            <Paperclip />
                            Adicionar evidência
                          </Button>
                        )}
                        {evidenceAction === a.id && mayAct(state, scope, p) && (
                          <EvidenceEditor
                            save={(text, url, file) => {
                              const ok = act(
                                (s) =>
                                  addEvidence(
                                    s,
                                    scope,
                                    p.id,
                                    a.id,
                                    text,
                                    url,
                                    file,
                                  ),
                                "Evidência salva apenas neste navegador.",
                              );
                              if (ok) setEvidenceAction(null);
                              return ok;
                            }}
                          />
                        )}
                      </article>
                    ))}
                  </>
                ) : (
                  <p className="rounded-xl bg-accent p-4 text-sm">
                    O plano ainda não foi aprovado e publicado pelo RH.
                  </p>
                )}
                {(management || mayEdit(state, scope, p)) && p.draft && (
                  <details
                    className="rounded-xl border bg-card p-4"
                    open={!p.published}
                  >
                    <summary className="cursor-pointer text-sm font-semibold">
                      Estrutura em rascunho / revisão
                    </summary>
                    <h4 className="mt-4 font-semibold">{p.draft.title}</h4>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {p.draft.objective}
                    </p>
                    <ul className="mt-3 space-y-2">
                      {p.draft.actions.map((a) => (
                        <li key={a.id} className="text-sm">
                          {a.title} · até {a.due}
                        </li>
                      ))}
                    </ul>
                    {mayEdit(state, scope, p) &&
                      ["Rascunho", "Ajustes solicitados"].includes(
                        p.status,
                      ) && (
                        <Button
                          className="mt-4"
                          onClick={() =>
                            act(
                              (s) => savePlan(s, scope, p.id, p.draft!, true),
                              "PDI enviado à aprovação do RH.",
                            )
                          }
                        >
                          Enviar PDI ao RH
                        </Button>
                      )}
                  </details>
                )}
                {scope.rh && p.status === "Em aprovação" && (
                  <section className="space-y-3 rounded-xl border border-orange-200 bg-accent p-4">
                    <label className="block text-xs">
                      Parecer do RH
                      <Textarea
                        aria-label="Parecer do RH no PDI"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() =>
                          act(
                            (s) => reviewPlan(s, scope, p.id, true, comment),
                            "PDI aprovado e publicado pelo RH.",
                          )
                        }
                      >
                        Aprovar e publicar PDI
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          act(
                            (s) => reviewPlan(s, scope, p.id, false, comment),
                            "Ajustes solicitados à liderança.",
                          )
                        }
                      >
                        Solicitar ajustes no PDI
                      </Button>
                    </div>
                  </section>
                )}
                {mayEdit(state, scope, p) && p.status === "Aprovado" && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      act(
                        (s) => closePlan(s, scope, p.id),
                        "PDI concluído, sem qualquer progressão ou reconhecimento automático.",
                      )
                    }
                  >
                    <CheckCircle2 />
                    Concluir PDI
                  </Button>
                )}
                <section className="space-y-4 rounded-xl border bg-card p-4">
                  <h4 className="flex items-center gap-2 font-semibold">
                    <MessageSquare size={17} />
                    Feedbacks e conversas
                  </h4>
                  {p.feedbacks.map((f) => (
                    <div
                      className="border-l-2 border-violet-200 pl-3"
                      key={f.id}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-6">
                        {f.text}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {f.by} · {new Date(f.at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  ))}
                  {(scope.rh ||
                    mayEdit(state, scope, p) ||
                    (person.user === scope.user && !!p.published)) && (
                    <>
                      <Textarea
                        aria-label="Feedback do PDI"
                        placeholder="Registre um feedback de desenvolvimento."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (
                            act(
                              (s) => feedback(s, scope, p.id, comment),
                              "Feedback registrado.",
                            )
                          )
                            setComment("");
                        }}
                      >
                        Registrar feedback
                      </Button>
                    </>
                  )}
                </section>
                <details className="rounded-xl border bg-card p-4">
                  <summary className="cursor-pointer text-sm font-semibold">
                    Histórico e versões do PDI
                  </summary>
                  <div className="mt-4 space-y-3">
                    {p.versions.map((v) => (
                      <details
                        key={v.number}
                        className="rounded-lg bg-muted/40 p-3"
                      >
                        <summary className="cursor-pointer text-xs font-semibold">
                          Versão aprovada {v.number} ·{" "}
                          {new Date(v.at).toLocaleDateString("pt-BR")}
                        </summary>
                        <p className="mt-3 text-sm font-semibold">
                          {v.content.title}
                        </p>
                        <p className="mt-2 text-xs leading-6">
                          {v.content.objective}
                        </p>
                        {v.content.actions.map((a) => (
                          <p className="mt-2 text-xs" key={a.id}>
                            {a.title} · {a.due}
                          </p>
                        ))}
                      </details>
                    ))}
                    {p.history.map((h) => (
                      <div
                        key={h.id}
                        className="border-l-2 border-orange-200 pl-3"
                      >
                        <p className="text-xs leading-5">{h.text}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {h.by} · {new Date(h.at).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    ))}
                  </div>
                </details>
              </>
            )}
          </div>
        </Modal>
      )}
      {creating && scope.leader && (
        <Modal
          title="Criar PDI da equipe"
          close={() => {
            setCreating(false);
            clear();
          }}
        >
          {messages}
          <div className="space-y-4">
            <p className="rounded-xl bg-accent p-4 text-xs leading-5">
              Selecione CLT ou estagiário sob sua responsabilidade. O
              profissional só acessa o plano depois da aprovação do RH. PJs não
              integram este cadastro.
            </p>
            <label className="block text-xs">
              Profissional do PDI
              <Select
                aria-label="Profissional do PDI"
                value={personId}
                onChange={(e) => setPerson(e.target.value)}
              >
                <option value="">Selecione</option>
                {editablePeople.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.contract}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block text-xs">
              Ciclo do PDI
              <Select
                aria-label="Ciclo do PDI"
                value={cycleId}
                onChange={(e) => setCycle(e.target.value)}
              >
                <option value="">Selecione</option>
                {state.cycles
                  .filter((c) => c.status === "Ativo")
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </Select>
            </label>
            <Button
              disabled={!personId || !cycleId}
              onClick={() => {
                if (
                  act(
                    (s) => createPlan(s, scope, personId, cycleId),
                    "PDI criado como rascunho da liderança.",
                  )
                )
                  setCreating(false);
              }}
            >
              Criar plano em rascunho
            </Button>
          </div>
        </Modal>
      )}
      {cycleEdit && scope.rh && (
        <Modal
          title="Configurar ciclo de PDI"
          close={() => {
            setCycleEdit(null);
            clear();
          }}
        >
          {messages}
          {cycleEditor()}
        </Modal>
      )}
    </div>
  );
}
function PlanEditor({
  initial,
  cycle,
  save,
}: {
  initial: PlanContent;
  cycle: PdiCycle;
  save: (p: PlanContent, send: boolean) => boolean;
}) {
  const [content, set] = useState(() => structuredClone(initial));
  return (
    <div className="space-y-4 rounded-xl border bg-card p-4">
      <p className="rounded-lg bg-accent p-3 text-xs leading-5">
        Alterações estruturais precisam de nova aprovação do RH. A versão
        publicada continua disponível ao profissional.
      </p>
      <label className="block text-xs">
        Título do PDI
        <Input
          aria-label="Título do PDI"
          value={content.title}
          onChange={(e) => set({ ...content, title: e.target.value })}
        />
      </label>
      <label className="block text-xs">
        Objetivo de desenvolvimento
        <Textarea
          aria-label="Objetivo de desenvolvimento"
          value={content.objective}
          onChange={(e) => set({ ...content, objective: e.target.value })}
        />
      </label>
      {content.actions.map((a, i) => (
        <div
          key={a.id}
          className="grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_180px]"
        >
          <label className="text-xs">
            Ação {i + 1}
            <Input
              aria-label={`Ação do PDI ${i + 1}`}
              value={a.title}
              onChange={(e) =>
                set({
                  ...content,
                  actions: content.actions.map((x) =>
                    x.id === a.id ? { ...x, title: e.target.value } : x,
                  ),
                })
              }
            />
          </label>
          <label className="text-xs">
            Prazo
            <Input
              aria-label={`Prazo da ação ${i + 1}`}
              type="date"
              min={cycle.start}
              max={cycle.end}
              value={a.due}
              onChange={(e) =>
                set({
                  ...content,
                  actions: content.actions.map((x) =>
                    x.id === a.id ? { ...x, due: e.target.value } : x,
                  ),
                })
              }
            />
          </label>
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Remover ação ${i + 1}`}
            onClick={() =>
              set({
                ...content,
                actions: content.actions.filter((x) => x.id !== a.id),
              })
            }
          >
            Remover ação
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        onClick={() =>
          set({
            ...content,
            actions: [
              ...content.actions,
              {
                id: uid(),
                title: "Nova ação de desenvolvimento",
                due: cycle.end,
                done: false,
                evidence: [],
              },
            ],
          })
        }
      >
        <Plus />
        Adicionar ação ao PDI
      </Button>
      <footer className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={() => save(content, false)}>
          Salvar rascunho do PDI
        </Button>
        <Button onClick={() => save(content, true)}>Enviar versão ao RH</Button>
      </footer>
    </div>
  );
}
function EvidenceEditor({
  save,
}: {
  save: (text: string, url: string, file?: Attachment) => boolean;
}) {
  const [text, setText] = useState(""),
    [url, setUrl] = useState(""),
    [file, setFile] = useState<Attachment | undefined>(),
    [error, setError] = useState("");
  return (
    <div className="space-y-3 rounded-xl border border-dashed p-4">
      <label className="block text-xs">
        Descrição da evidência
        <Textarea
          aria-label="Descrição da evidência"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      <label className="block text-xs">
        Link da evidência (opcional)
        <Input
          aria-label="Link da evidência"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </label>
      <label className="block text-xs">
        Arquivo demonstrativo · até 10 MB
        <input
          aria-label="Arquivo da evidência"
          className="mt-2 block w-full text-xs"
          type="file"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            if (f.size > 10 * 1024 * 1024) {
              setError("Use arquivo fictício de até 10 MB.");
              return;
            }
            setError("");
            const safe = /^(application\/pdf|image\/(png|jpeg|webp|gif))$/.test(
              f.type,
            );
            setFile({
              id: uid(),
              name: f.name,
              size: f.size,
              type: f.type,
              url: URL.createObjectURL(
                new Blob([f], {
                  type: safe ? f.type : "application/octet-stream",
                }),
              ),
            });
            e.target.value = "";
          }}
        />
      </label>
      {file && <FileCard file={file} />}
      <p className="text-xs text-destructive" role="alert">
        {error}
      </p>
      <Button variant="outline" onClick={() => save(text, url, file)}>
        Salvar evidência local
      </Button>
    </div>
  );
}
