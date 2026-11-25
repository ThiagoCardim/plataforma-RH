"use client";
import { AcademyReferences } from "@/modules/academy/links";
import { EvaluationReferences } from "@/modules/development-links/references";
import Link from "next/link";
import { useState } from "react";
import {
  Plus,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Wallet,
  GitBranch,
  Users,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/fields";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/modules/onboarding/components";
import { useLocalDemo } from "@/modules/local-demo/use-local-demo";
import {
  type CareerState,
  type Scope,
  type CareerRole,
  type Cycle,
  type Contract,
  admin,
  projection,
  uid,
  brl,
  cents,
  budget,
  impact,
  dateNow,
  saveSector,
  saveRole,
  saveBand,
  saveCycle,
  saveRates,
  saveMovement,
  submitMovement,
  decideMovement,
  implementMovement,
  saveDirective,
  savePublication,
} from "./model";
import {
  CareerMap,
  RoleDetails,
  EntityForm,
  MovementEditor,
  ImpactCards,
  type Field,
} from "./components";
const line = (s: string) =>
  s
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);
const opts = (items: { id: string; name: string }[]) =>
  items.map((x) => ({ value: x.id, label: x.name }));
const field = (
  key: string,
  label: string,
  type: Field["type"] = "text",
  options?: Field["options"],
): Field => ({ key, label, type, options });
export function CareerWorkspace({
  initial,
  scope,
}: {
  initial: CareerState;
  scope: Scope;
}) {
  const management = admin(scope);
  const {
    value: state,
    setValue: set,
    ready,
    error: storageError,
  } = useLocalDemo(
    `career-v1:${management ? "admin" : "public"}:${scope.key}`,
    initial,
    (s) => projection(s, scope),
  );
  const [tab, setTab] = useState(management ? "Visão Geral" : "Minha carreira"),
    [sector, setSector] = useState(
      initial.people.find((p) => p.user === scope.user && p.contract !== "PJ")
        ?.sector ??
        initial.sectors[0]?.id ??
        "",
    );
  const [selectedRole, setSelectedRole] = useState<string | null>(null),
    [edit, setEdit] = useState<{
      kind:
        | "sector"
        | "role"
        | "band"
        | "cycle"
        | "rates"
        | "movement"
        | "directive"
        | "publication";
      id?: string;
      source?: string;
    } | null>(null),
    [selectedMovement, setSelectedMovement] = useState<string | null>(null);
  const [comment, setComment] = useState(""),
    [localConsent, setConsent] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  const f = state.finance,
    role = state.roles.find((r) => r.id === selectedRole),
    movement = f?.movements.find((m) => m.id === selectedMovement),
    own = state.people.find(
      (p) => p.user === scope.user && p.contract !== "PJ",
    );
  const selectedSector = state.sectors.find((s) => s.id === sector);
  const modal = !!(role || edit || movement);
  const publishedDirective = state.directives.filter((d) => d.published).at(-1);
  function clear() {
    setError("");
    setNotice("");
    setComment("");
    setConsent(false);
  }
  function act(fn: (s: CareerState) => CareerState, text: string) {
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
  function begin(
    kind: NonNullable<typeof edit>["kind"],
    id?: string,
    source?: string,
  ) {
    clear();
    setSelectedMovement(null);
    setEdit({ kind, id, source });
  }
  const feedback = (
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
  function editor() {
    if (!edit) return null;
    const done = (fn: (s: CareerState) => CareerState) => {
      const ok = act(fn, "Alteração demonstrativa salva neste navegador.");
      if (ok) setEdit(null);
      return ok;
    };
    if (edit.kind === "movement")
      return (
        <MovementEditor
          state={state}
          initial={f?.movements.find((m) => m.id === edit.id)}
          save={(input) => done((s) => saveMovement(s, scope, input))}
        />
      );
    let fields: Field[] = [],
      values: Record<string, string> = {},
      save: (d: Record<string, string>) => boolean = () => false,
      description = "Alteração apenas demonstrativa, salva no navegador.";
    if (edit.kind === "sector") {
      const x = state.sectors.find((x) => x.id === edit.id);
      fields = [
        field("name", "Nome do setor"),
        field("intro", "Apresentação do setor", "textarea"),
      ];
      values = { name: x?.name ?? "", intro: x?.intro ?? "" };
      save = (d) =>
        done((s) =>
          saveSector(s, scope, {
            id: x?.id ?? uid(),
            name: d.name,
            intro: d.intro,
          }),
        );
    }
    if (edit.kind === "role") {
      const x = state.roles.find((x) => x.id === edit.id);
      fields = [
        field("title", "Nome do cargo"),
        field("sector", "Setor", "select", opts(state.sectors)),
        field("levelName", "Nome do nível"),
        field("level", "Ordem do nível", "number"),
        field(
          "branch",
          "Caminho",
          "select",
          ["Base", "Técnica", "Liderança"].map((v) => ({ value: v, label: v })),
        ),
        field("parent", "Cargo de origem", "select", [
          { value: "", label: "Sem origem (início da trilha)" },
          ...state.roles
            .filter((r) => r.id !== x?.id)
            .map((r) => ({
              value: r.id,
              label: `${r.title} · ${state.sectors.find((s) => s.id === r.sector)?.name} · ${r.levelName}`,
            })),
        ]),
        field(
          "responsibilities",
          "Responsabilidades (uma por linha)",
          "textarea",
        ),
        field("requirements", "Requisitos (um por linha)", "textarea"),
        field(
          "competencies",
          "Competências (nome | descrição, uma por linha)",
          "textarea",
        ),
        field(
          "published",
          "Publicar cargo no mapa dos profissionais",
          "checkbox",
        ),
      ];
      values = {
        title: x?.title ?? "",
        sector: x?.sector ?? sector,
        levelName: x?.levelName ?? "Novo nível",
        level: String(x?.level ?? 1),
        branch: x?.branch ?? "Base",
        parent: x?.parent ?? "",
        responsibilities: x?.responsibilities.join("\n") ?? "",
        requirements: x?.requirements.join("\n") ?? "",
        competencies:
          x?.competencies
            .map((c) => `${c.name} | ${c.description}`)
            .join("\n") ?? "",
        published: String(x?.published ?? false),
      };
      description =
        "Níveis e ligações são estruturais. Não criam progressão automática. Um cargo de origem deve ser do mesmo setor e de nível inferior; publique as origens primeiro.";
      save = (d) =>
        done((s) =>
          saveRole(s, scope, {
            id: x?.id ?? uid(),
            title: d.title,
            sector: d.sector,
            levelName: d.levelName,
            level: Number(d.level),
            branch: d.branch as CareerRole["branch"],
            parent: d.parent || undefined,
            responsibilities: line(d.responsibilities),
            requirements: line(d.requirements),
            competencies: line(d.competencies).map((v) => {
              const [name, ...description] = v.split("|");
              return {
                name: name.trim(),
                description: description.join("|").trim(),
              };
            }),
            published: d.published === "true",
          }),
        );
    }
    if (edit.kind === "band" && f) {
      const x = f.bands.find((x) => x.id === edit.id);
      fields = [
        field("label", "Nome da faixa / perfil contratual"),
        field(
          "contract",
          "Vínculo",
          "select",
          ["CLT", "Estágio", "PJ"].map((v) => ({ value: v, label: v })),
        ),
        field("role", "Cargo (deixe sem cargo para PJ)", "select", [
          { value: "", label: "Sem cargo · perfil contratual PJ" },
          ...state.roles.map((r) => ({
            value: r.id,
            label: `${r.title} · ${state.sectors.find((s) => s.id === r.sector)?.name}`,
          })),
        ]),
        field("min", "Mínimo bruto", "money"),
        field("reference", "Referência bruta", "money"),
        field("max", "Máximo bruto", "money"),
      ];
      values = {
        label: x?.label ?? "",
        contract: x?.contract ?? "CLT",
        role: x?.role ?? "",
        min: String((x?.min ?? 0) / 100),
        reference: String((x?.reference ?? 0) / 100),
        max: String((x?.max ?? 0) / 100),
      };
      description =
        "Faixas confidenciais e fictícias. Salários CLT, bolsas e honorários PJ têm naturezas distintas; não são parâmetros financeiros definitivos.";
      save = (d) =>
        done((s) =>
          saveBand(s, scope, {
            id: x?.id ?? uid(),
            label: d.label,
            contract: d.contract as Contract,
            role: d.role,
            min: cents(d.min),
            reference: cents(d.reference),
            max: cents(d.max),
          }),
        );
    }
    if (edit.kind === "cycle" && f) {
      const x = f.cycles.find((x) => x.id === edit.id);
      fields = [
        field("name", "Nome do ciclo"),
        field("start", "Início do ciclo", "date"),
        field("end", "Fim do ciclo", "date"),
        field("months", "Horizonte da reserva (meses)", "number"),
        field("status", "Estado do ciclo", "select", [
          { value: "Aberto", label: "Aberto" },
          { value: "Encerrado", label: "Encerrado" },
        ]),
        ...(
          [
            ["revenueTarget", "Receita meta"],
            ["revenueActual", "Receita realizada"],
            ["costTarget", "Custos meta"],
            ["costActual", "Custos realizados"],
            ["budget", "Orçamento autorizado"],
          ] as const
        ).map(([k, l]) => field(k, l, "money")),
      ];
      values = {
        name: x?.name ?? "",
        start: x?.start ?? dateNow(),
        end: x?.end ?? dateNow(),
        months: String(x?.months ?? 12),
        status: x?.status ?? "Aberto",
        revenueTarget: String((x?.revenueTarget ?? 0) / 100),
        revenueActual: String((x?.revenueActual ?? 0) / 100),
        costTarget: String((x?.costTarget ?? 0) / 100),
        costActual: String((x?.costActual ?? 0) / 100),
        budget: String((x?.budget ?? 0) / 100),
      };
      description =
        "Indicadores fictícios do período. O horizonte define a reserva de impacto adicional. Períodos vinculados a análises são preservados; não é possível reduzir o orçamento abaixo do comprometido.";
      save = (d) =>
        done((s) =>
          saveCycle(s, scope, {
            id: x?.id ?? uid(),
            name: d.name,
            start: d.start,
            end: d.end,
            months: Number(d.months),
            status: d.status as Cycle["status"],
            revenueTarget: cents(d.revenueTarget),
            revenueActual: cents(d.revenueActual),
            costTarget: cents(d.costTarget),
            costActual: cents(d.costActual),
            budget: cents(d.budget),
          }),
        );
    }
    if (edit.kind === "rates" && f) {
      for (const c of ["CLT", "Estágio", "PJ"] as Contract[]) {
        fields.push(
          field(`${c}-charges`, `${c} · encargos ilustrativos (%)`, "number"),
          field(
            `${c}-provisions`,
            `${c} · provisões mensais equivalentes (%)`,
            "number",
          ),
        );
        values[`${c}-charges`] = String(f.rates[c].charges);
        values[`${c}-provisions`] = String(f.rates[c].provisions);
      }
      description =
        "Parâmetros exclusivamente ilustrativos, sem definição de regra contábil ou contratual. Cada nova análise preserva sua própria cópia; alterar estes valores não reprecifica reservas existentes.";
      save = (d) =>
        done((s) =>
          saveRates(
            s,
            scope,
            Object.fromEntries(
              (["CLT", "Estágio", "PJ"] as Contract[]).map((c) => [
                c,
                {
                  charges: Number(d[`${c}-charges`]),
                  provisions: Number(d[`${c}-provisions`]),
                },
              ]),
            ) as NonNullable<CareerState["finance"]>["rates"],
          ),
        );
    }
    if (edit.kind === "directive") {
      const x = state.directives.at(-1);
      fields = [
        field("text", "Texto das diretrizes", "textarea"),
        field(
          "published",
          "Publicar esta versão para os profissionais",
          "checkbox",
        ),
      ];
      values = { text: x?.text ?? "", published: "true" };
      description =
        "Novas versões preservam o histórico. Não publique promessas de promoção nem regras de progressão automática por tempo, cursos ou certificações.";
      save = (d) =>
        done((s) => saveDirective(s, scope, d.text, d.published === "true"));
    }
    if (edit.kind === "publication") {
      const x = state.publications.find((x) => x.id === edit.id);
      fields = [
        field("title", "Título público"),
        field("body", "Conteúdo institucional", "textarea"),
        field(
          "published",
          "Disponibilizar na experiência dos profissionais",
          "checkbox",
        ),
        field(
          "authorized",
          "Autorizo a publicação deste conteúdo institucional como RH",
          "checkbox",
        ),
      ];
      values = {
        title:
          x?.title ??
          (edit.source
            ? "Reconhecimento efetivado"
            : "Resultado organizacional"),
        body: x?.body ?? "",
        published: String(x?.published ?? true),
        authorized: "false",
      };
      description =
        "Publique apenas resultados institucionais ou reconhecimentos já efetivados. A análise de mérito, os valores e as justificativas financeiras não são copiados. A divulgação nominal deve ser uma escolha explícita do RH no conteúdo.";
      save = (d) =>
        done((s) =>
          savePublication(
            s,
            scope,
            {
              id: x?.id ?? uid(),
              title: d.title,
              body: d.body,
              published: d.published === "true",
              source: x?.source ?? edit.source,
            },
            d.authorized === "true",
          ),
        );
    }
    return (
      <EntityForm
        key={`${edit.kind}:${edit.id ?? "new"}`}
        fields={fields}
        initial={values}
        save={save}
        description={description}
      />
    );
  }
  if (!ready)
    return <p role="status">Carregando Plano de Carreira demonstrativo…</p>;
  const tabs = management
    ? [
        "Visão Geral",
        "Trilhas de Carreira",
        "Cargos e Competências",
        "Faixas Salariais",
        "Ciclos de Reconhecimento",
        "Movimentações e Simulações",
        "Diretrizes",
      ]
    : [
        "Minha carreira",
        "Competências",
        "Histórico",
        "Diretrizes",
        "Resultados",
      ];
  const activeCycle =
      f?.cycles.find((c) => c.status === "Aberto") ?? f?.cycles[0],
    currentBudget = activeCycle ? budget(state, activeCycle.id) : undefined;
  return (
    <div className="relative w-full min-w-0 max-w-full space-y-6 overflow-x-clip">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-200 bg-accent p-4 text-xs leading-5 text-accent-foreground">
        <div>
          <strong>Demonstração local · desenvolvimento e reconhecimento</strong>
          <p>
            Dados fictícios, salvos apenas neste navegador/conta/organização.
            Sem efeitos em cargo, bolsa, folha ou contrato real.
          </p>
        </div>
        <Badge>
          {scope.director
            ? "Diretoria"
            : scope.rh
              ? "RH"
              : scope.leader
                ? "Minha carreira · liderança"
                : "Minha carreira"}
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
            Pessoas / Possibilidades e desenvolvimento
          </p>
          <h1 className="page-title">Plano de Carreira</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Clareza para desenvolver. Critério para reconhecer.
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            if (
              window.confirm("Restaurar somente a demonstração de carreira?")
            ) {
              set(initial);
              clear();
            }
          }}
        >
          <RotateCcw />
          Restaurar demonstração
        </Button>
      </header>
      <nav
        aria-label="Abas do Plano de Carreira"
        className="flex gap-1 overflow-x-auto border-b pb-2"
      >
        {tabs.map((t) => (
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
      {!modal && feedback}
      {!management && tab === "Minha carreira" && (
        <>
          <section className="relative overflow-hidden rounded-2xl bg-stone-900 p-7 text-white md:p-9">
            <div className="pointer-events-none absolute -right-16 -top-20 size-80 rounded-full bg-violet-500/15 blur-3xl" />
            <p className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.16em] text-orange-300">
              <Sparkles size={15} />
              Sua trajetória, com intenção
            </p>
            <h2 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight">
              Conhecimento que aprofunda.
              <br />
              Liderança que desenvolve.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-stone-300">
              Explore caminhos técnicos e de liderança. Converse sobre
              competências e transforme aprendizados em ações de
              desenvolvimento.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Badge className="border-orange-300/20 bg-orange-400/10 text-orange-200">
                Atual:{" "}
                {state.roles.find((r) => r.id === own?.role)?.title ??
                  "Cargo demonstrativo"}
              </Badge>
              <Button asChild>
                <Link href="/pdi">
                  Meu PDI
                  <ArrowUpRight />
                </Link>
              </Button>
            </div>
          </section>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              [
                "Seu contexto",
                state.sectors.find((s) => s.id === own?.sector)?.name ??
                  "Equipe",
              ],
              [
                "Seu nível",
                state.roles.find((r) => r.id === own?.role)?.levelName ??
                  "Cadastro atual",
              ],
              ["Seu desenvolvimento", "Ações, conversas e evidências"],
            ].map(([l, v]) => (
              <div className="rounded-xl border bg-card p-5" key={l}>
                <p className="text-xs text-muted-foreground">{l}</p>
                <p className="mt-2 text-sm font-semibold">{v}</p>
              </div>
            ))}
          </div>
        </>
      )}
      {management && tab === "Visão Geral" && f && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [
                Users,
                state.people.filter((p) => p.contract !== "PJ").length,
                "Profissionais nas trilhas",
              ],
              [
                GitBranch,
                state.roles.filter((r) => r.published).length,
                "Cargos publicados",
              ],
              [Wallet, currentBudget?.available ?? 0, "Disponível no ciclo"],
              [
                ShieldCheck,
                f.movements.filter((m) => m.status === "Em análise").length,
                "Análises na Diretoria",
              ],
            ].map(([Icon, n, label]) => {
              const I = Icon as typeof Users;
              return (
                <article
                  className="rounded-xl border bg-card p-5"
                  key={String(label)}
                >
                  <I size={20} className="mb-5 text-primary" />
                  <p className="text-[11px] text-muted-foreground">
                    {String(label)}
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {label === "Disponível no ciclo"
                      ? brl(n as number)
                      : String(n)}
                  </p>
                </article>
              );
            })}
          </section>
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border bg-card p-6">
              <h2 className="section-title mb-5">Distribuição por níveis</h2>
              {[...new Set(state.roles.map((r) => r.level))]
                .sort((a, b) => a - b)
                .map((level) => {
                  const count = state.people.filter(
                      (p) =>
                        p.contract !== "PJ" &&
                        state.roles.find((r) => r.id === p.role)?.level ===
                          level,
                    ).length,
                    total = state.people.filter(
                      (p) => p.contract !== "PJ",
                    ).length;
                  return (
                    <div className="mb-5" key={level}>
                      <p className="mb-2 flex justify-between text-xs">
                        <span>Nível estrutural {level}</span>
                        <span>{count} pessoas</span>
                      </p>
                      <div className="h-3 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-orange-300 to-primary"
                          style={{
                            width: `${total ? (count / total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              <p className="text-xs leading-5 text-muted-foreground">
                Distribuição cadastral, sem medir proximidade de promoção.
              </p>
            </section>
            <section className="rounded-2xl border bg-gradient-to-br from-violet-50 to-white p-6">
              <h2 className="section-title mb-5">Atuação por setor</h2>
              {state.sectors.map((s) => (
                <button
                  key={s.id}
                  className="mb-3 flex w-full items-center justify-between rounded-xl border bg-white p-4 text-left"
                  onClick={() => {
                    setSector(s.id);
                    setTab("Trilhas de Carreira");
                  }}
                >
                  <span>
                    <p className="text-sm font-semibold">{s.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {state.roles.filter((r) => r.sector === s.id).length}{" "}
                      cargos estruturados
                    </p>
                  </span>
                  <Badge>
                    {
                      state.people.filter(
                        (p) => p.sector === s.id && p.contract !== "PJ",
                      ).length
                    }{" "}
                    pessoas
                  </Badge>
                </button>
              ))}
            </section>
          </div>
          <section className="rounded-xl border bg-card p-5">
            <h2 className="section-title mb-5">Distribuição por cargo</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {state.roles
                .filter((r) =>
                  state.people.some(
                    (p) => p.contract !== "PJ" && p.role === r.id,
                  ),
                )
                .map((r) => {
                  const count = state.people.filter(
                    (p) => p.contract !== "PJ" && p.role === r.id,
                  ).length;
                  return (
                    <button
                      key={r.id}
                      className="rounded-xl border p-4 text-left transition-shadow hover:shadow-md"
                      onClick={() => {
                        clear();
                        setSelectedRole(r.id);
                      }}
                    >
                      <p className="text-sm font-semibold">
                        {r.title}{" "}
                        <span className="float-right text-primary">
                          {count}
                        </span>
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {state.sectors.find((s) => s.id === r.sector)?.name} ·{" "}
                        {r.levelName}
                      </p>
                    </button>
                  );
                })}
            </div>
          </section>
          <section className="rounded-xl border bg-card p-5">
            <h2 className="section-title mb-4">
              Movimentos administrativos recentes
            </h2>
            <div className="max-h-60 space-y-4 overflow-y-auto">
              {state.events.slice(0, 8).map((e) => (
                <div className="border-l-2 border-orange-200 pl-3" key={e.id}>
                  <p className="text-sm">{e.text}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {e.by} · {new Date(e.at).toLocaleString("pt-BR")}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
      {(tab === "Trilhas de Carreira" || tab === "Minha carreira") && (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <label className="min-w-52 text-xs">
              Explorar setor
              <Select
                aria-label="Setor do mapa"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
              >
                {state.sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </label>
            {management && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => begin("sector", sector)}
                >
                  Personalizar setor
                </Button>
                <Button onClick={() => begin("sector")}>
                  <Plus />
                  Novo setor
                </Button>
              </div>
            )}
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            {selectedSector?.intro}
          </p>
          <CareerMap
            roles={state.roles.filter((r) => r.sector === sector)}
            current={own?.role}
            select={(r) => {
              clear();
              setSelectedRole(r.id);
            }}
          />
          {management && (
            <Button variant="outline" onClick={() => begin("role")}>
              <Plus />
              Adicionar cargo e nível
            </Button>
          )}
        </>
      )}
      {(tab === "Cargos e Competências" || tab === "Competências") && (
        <>
          <div className="flex flex-wrap justify-between gap-3">
            <label className="min-w-52 text-xs">
              Setor
              <Select
                aria-label="Setor dos cargos"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
              >
                {state.sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </label>
            {management && (
              <Button onClick={() => begin("role")}>
                <Plus />
                Novo cargo
              </Button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {state.roles
              .filter((r) => r.sector === sector)
              .map((r) => (
                <article
                  className={`rounded-xl border bg-card p-5 transition-shadow hover:shadow-md ${r.id === own?.role ? "border-orange-400" : ""}`}
                  key={r.id}
                >
                  <Badge>
                    {r.branch} · {r.levelName}
                  </Badge>
                  <h3 className="mt-4 text-lg font-semibold">{r.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {r.responsibilities[0]}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1">
                    {r.competencies.slice(0, 3).map((c, i) => (
                      <Badge key={i}>{c.name}</Badge>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        clear();
                        setSelectedRole(r.id);
                      }}
                    >
                      Explorar competências
                    </Button>
                    {management && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => begin("role", r.id)}
                      >
                        Editar cargo
                      </Button>
                    )}
                  </div>
                  {management && (
                    <p className="mt-3 text-[10px] text-muted-foreground">
                      {r.published ? "Publicado" : "Rascunho administrativo"}
                    </p>
                  )}
                </article>
              ))}
          </div>
        </>
      )}
      {management && tab === "Faixas Salariais" && f && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="section-title">Faixas brutas de referência</h2>
              <p className="mt-2 text-xs text-muted-foreground">
                Confidencial · salários, bolsas e honorários possuem
                classificações próprias. Dados fictícios.
              </p>
            </div>
            <Button onClick={() => begin("band")}>
              <Plus />
              Nova faixa
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {f.bands.map((b) => (
              <article className="rounded-xl border bg-card p-5" key={b.id}>
                <div className="flex justify-between gap-3">
                  <h3 className="text-sm font-semibold">{b.label}</h3>
                  <Badge>{b.contract}</Badge>
                </div>
                <div className="relative mt-7 h-2 rounded-full bg-gradient-to-r from-orange-100 via-orange-400 to-violet-300">
                  <span
                    className="absolute -top-1 size-4 -translate-x-1/2 rounded-full border-2 border-white bg-stone-900 shadow"
                    style={{
                      left: `${b.max > b.min ? ((b.reference - b.min) / (b.max - b.min)) * 100 : 50}%`,
                    }}
                  />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  {[
                    [b.min, "Mínimo"],
                    [b.reference, "Referência"],
                    [b.max, "Máximo"],
                  ].map(([n, l]) => (
                    <div key={String(l)}>
                      <p className="text-[10px] text-muted-foreground">
                        {String(l)}
                      </p>
                      <p className="mt-1 font-semibold">{brl(n as number)}</p>
                    </div>
                  ))}
                </div>
                <Button
                  className="mt-4"
                  variant="ghost"
                  size="sm"
                  onClick={() => begin("band", b.id)}
                >
                  Editar faixa
                </Button>
              </article>
            ))}
          </div>
        </>
      )}
      {management && tab === "Ciclos de Reconhecimento" && f && (
        <>
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <h2 className="section-title">Reconhecer com sustentabilidade</h2>
              <p className="mt-2 text-xs text-muted-foreground">
                Metas e resultados apoiam a análise humana. Não há aprovação
                automática por um indicador.
              </p>
            </div>
            <Button onClick={() => begin("cycle")}>
              <Plus />
              Novo ciclo
            </Button>
          </div>
          {f.cycles.map((c) => {
            const b = budget(state, c.id),
              max = Math.max(
                c.revenueTarget,
                c.revenueActual,
                c.costTarget,
                c.costActual,
                1,
              );
            return (
              <article className="rounded-2xl border bg-card p-6" key={c.id}>
                <EvaluationReferences
                  scope={scope}
                  target="recognition"
                  targetId={c.id}
                />
                <header className="flex flex-wrap justify-between gap-3">
                  <div>
                    <Badge>{c.status}</Badge>
                    <h3 className="mt-3 text-lg font-semibold">{c.name}</h3>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {c.start} a {c.end} · reserva de {c.months} meses por
                      análise
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => begin("cycle", c.id)}
                  >
                    Configurar ciclo
                  </Button>
                </header>
                <div className="mt-6 grid gap-5 lg:grid-cols-2">
                  <div className="space-y-4">
                    {[
                      [c.revenueTarget, "Receita · meta", "bg-stone-300"],
                      [c.revenueActual, "Receita · realizado", "bg-orange-400"],
                      [c.costTarget, "Custos · meta", "bg-stone-300"],
                      [c.costActual, "Custos · realizado", "bg-violet-400"],
                    ].map(([n, label, color]) => (
                      <div key={String(label)}>
                        <p className="mb-1 flex justify-between gap-2 text-xs">
                          <span>{String(label)}</span>
                          <strong>{brl(n as number)}</strong>
                        </p>
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${color}`}
                            style={{ width: `${((n as number) / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl bg-muted/40 p-5">
                    <h4 className="mb-4 text-sm font-semibold">
                      Orçamento de reconhecimento
                    </h4>
                    {[
                      [b.authorized, "Autorizado"],
                      [b.committed, "Comprometido"],
                      [b.available, "Disponível"],
                    ].map(([n, l]) => (
                      <p
                        className="mb-3 flex justify-between gap-2 text-sm"
                        key={String(l)}
                      >
                        <span className="text-muted-foreground">
                          {String(l)}
                        </span>
                        <strong>{brl(n as number)}</strong>
                      </p>
                    ))}
                    <p className="mt-4 border-t pt-4 text-xs leading-5">
                      Resultado operacional demonstrativo:{" "}
                      <strong>{brl(c.revenueActual - c.costActual)}</strong>.
                      Diferença para a meta de resultado:{" "}
                      {brl(
                        c.revenueActual -
                          c.costActual -
                          (c.revenueTarget - c.costTarget),
                      )}
                      .
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </>
      )}
      {management && tab === "Movimentações e Simulações" && f && (
        <>
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <h2 className="section-title">Análises confidenciais</h2>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                RH conduz · Diretoria aprova · nenhuma solicitação ou indicação
                por colaboradores e líderes.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => begin("rates")}>
                Parâmetros de impacto
              </Button>
              {scope.rh && (
                <Button onClick={() => begin("movement")}>
                  <Sparkles />
                  Simular reconhecimento
                </Button>
              )}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {f.movements.map((m) => (
              <button
                className="rounded-xl border bg-card p-5 text-left transition-shadow hover:shadow-lg"
                key={m.id}
                onClick={() => {
                  clear();
                  setSelectedMovement(m.id);
                }}
              >
                <div className="flex justify-between gap-2">
                  <Badge>{m.kind}</Badge>
                  <Badge>{m.status}</Badge>
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  {state.people.find((p) => p.id === m.person)?.name}
                </h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  {f.cycles.find((c) => c.id === m.cycle)?.name}
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3 border-t pt-4">
                  <div>
                    <p className="text-[10px] text-muted-foreground">
                      Valor bruto mensal proposto
                    </p>
                    <p className="mt-1 font-semibold">{brl(m.proposed)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">
                      Impacto mensal adicional
                    </p>
                    <p className="mt-1 font-semibold">
                      {brl(impact(m).monthly)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
      {!management && tab === "Histórico" && (
        <section className="rounded-2xl border bg-card p-6">
          <h2 className="section-title mb-6">Sua trajetória efetivada</h2>
          <div className="space-y-6">
            {state.history
              .filter((h) => h.person === own?.id)
              .map((h) => (
                <article
                  className="relative border-l-2 border-orange-200 pl-6"
                  key={h.id}
                >
                  <span className="absolute -left-1.5 top-1 size-2.5 rounded-full bg-primary" />
                  <p className="text-[11px] text-muted-foreground">{h.date}</p>
                  <h3 className="mt-2 text-sm font-semibold">{h.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {h.from ? `${h.from} → ` : ""}
                    {h.to}
                  </p>
                </article>
              ))}
          </div>
          <p className="mt-6 text-xs leading-5 text-muted-foreground">
            Este histórico apresenta apenas fatos demonstrativos já efetivados.
            Não exibe análises, previsões ou garantias de movimentação.
          </p>
        </section>
      )}
      {tab === "Diretrizes" && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section className="rounded-xl border bg-card p-6">
            <div className="mb-5 flex flex-wrap justify-between gap-3">
              <div>
                <h2 className="section-title">Diretrizes institucionais</h2>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Versão publicada {publishedDirective?.version ?? "—"}
                </p>
              </div>
              {management && (
                <Button variant="outline" onClick={() => begin("directive")}>
                  Personalizar diretrizes
                </Button>
              )}
            </div>
            <p className="whitespace-pre-wrap text-sm leading-7">
              {publishedDirective?.text ?? "Nenhuma versão publicada."}
            </p>
          </section>
          <aside className="space-y-3 rounded-xl border bg-card p-5">
            <h3 className="font-semibold">Histórico de versões</h3>
            {[...state.directives].reverse().map((d) => (
              <details className="rounded-lg border p-3" key={d.id}>
                <summary className="cursor-pointer text-xs font-semibold">
                  v{d.version} · {d.published ? "Publicada" : "Rascunho"}
                </summary>
                <p className="mt-3 whitespace-pre-wrap text-xs leading-6">
                  {d.text}
                </p>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  {d.by} · {new Date(d.at).toLocaleDateString("pt-BR")}
                </p>
              </details>
            ))}
          </aside>
        </div>
      )}
      {((!management && tab === "Resultados") ||
        (management && tab === "Visão Geral")) && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="section-kicker mb-2">Conhecimento compartilhado</p>
              <h2 className="section-title">
                Resultados e reconhecimentos publicados
              </h2>
            </div>
            {scope.rh && (
              <Button variant="outline" onClick={() => begin("publication")}>
                <Plus />
                Publicação institucional
              </Button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {state.publications
              .filter((p) => management || p.published)
              .map((p) => (
                <article
                  className="rounded-2xl border bg-gradient-to-br from-orange-50/50 to-white p-6"
                  key={p.id}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {p.published ? "Autorizado pelo RH" : "Não publicado"}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold">{p.title}</h3>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {p.body}
                  </p>
                  <p className="mt-4 text-[10px] text-muted-foreground">
                    {p.by} · {new Date(p.at).toLocaleDateString("pt-BR")}
                  </p>
                  {scope.rh && (
                    <Button
                      className="mt-3"
                      size="sm"
                      variant="outline"
                      onClick={() => begin("publication", p.id)}
                    >
                      Editar publicação
                    </Button>
                  )}
                </article>
              ))}
          </div>
        </section>
      )}
      {role && (
        <Modal
          title={`Cargo · ${role.title}`}
          close={() => setSelectedRole(null)}
        >
          <RoleDetails role={role} />
          <AcademyReferences scope={scope} kind="career" target={role.id} />
          {management && (
            <Button
              className="mt-5"
              variant="outline"
              onClick={() => {
                setSelectedRole(null);
                begin("role", role.id);
              }}
            >
              Personalizar cargo
            </Button>
          )}
        </Modal>
      )}
      {edit && management && (
        <Modal
          title={
            edit.kind === "movement"
              ? "Simulação de reconhecimento"
              : edit.kind === "publication"
                ? "Publicação autorizada pelo RH"
                : edit.kind === "rates"
                  ? "Parâmetros financeiros ilustrativos"
                  : "Personalização administrativa"
          }
          close={() => {
            setEdit(null);
            clear();
          }}
        >
          {feedback}
          {editor()}
        </Modal>
      )}
      {movement && management && f && (
        <Modal
          title="Análise de reconhecimento · confidencial"
          close={() => {
            setSelectedMovement(null);
            clear();
          }}
        >
          {feedback}
          <div className="space-y-5">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <Badge>
                  {movement.kind} · {movement.status}
                </Badge>
                <h3 className="mt-3 text-xl font-semibold">
                  {state.people.find((p) => p.id === movement.person)?.name}
                </h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  Data de efeito: {movement.effective} · {movement.months} meses
                  na reserva
                </p>
              </div>
              {scope.rh &&
                ["Rascunho", "Ajustes solicitados"].includes(
                  movement.status,
                ) && (
                  <Button
                    variant="outline"
                    onClick={() => begin("movement", movement.id)}
                  >
                    Editar análise
                  </Button>
                )}
            </div>
            {movement.kind === "Promoção" && (
              <p className="rounded-xl border bg-card p-4 text-sm">
                Destino analisado:{" "}
                <strong>
                  {state.roles.find((r) => r.id === movement.targetRole)?.title}
                </strong>{" "}
                ·{" "}
                {
                  state.sectors.find(
                    (sec) =>
                      sec.id ===
                      state.roles.find((r) => r.id === movement.targetRole)
                        ?.sector,
                  )?.name
                }
                . O cargo atual só muda na efetivação local pelo RH.
              </p>
            )}
            <ImpactCards value={impact(movement)} />
            <section className="rounded-xl border bg-card p-4">
              <h4 className="mb-3 font-semibold">Mérito e contexto</h4>
              <p className="whitespace-pre-wrap text-sm leading-6">
                {movement.merit || "Sem fundamentação cadastrada."}
              </p>
              <p className="mt-4 text-xs text-muted-foreground">
                Atual: {brl(movement.current)} · Proposto:{" "}
                {brl(movement.proposed)}. Encargos {movement.rates.charges}% e
                provisões {movement.rates.provisions}% são parâmetros
                ilustrativos preservados nesta análise.
              </p>
            </section>
            <section className="rounded-xl bg-accent p-4 text-sm leading-6">
              <h4 className="font-semibold">Análise de viabilidade</h4>
              <p>
                Disponível no ciclo:{" "}
                {brl(budget(state, movement.cycle).available)} · Reserva desta
                análise: {brl(impact(movement).reserve)}.
              </p>
              <p>
                {["Aprovado", "Efetivado"].includes(movement.status)
                  ? "A reserva desta análise já está incluída no orçamento comprometido."
                  : impact(movement).reserve <=
                      budget(state, movement.cycle).available
                    ? "A simulação cabe no orçamento atualmente disponível."
                    : "A simulação excede o orçamento atualmente disponível."}
              </p>
              <p className="mt-2 text-xs">
                Orçamento e indicadores são subsídios à decisão. Não há regra
                financeira definitiva, recomendação automática ou efeito real
                sobre remuneração.
              </p>
            </section>
            {scope.rh &&
              ["Rascunho", "Ajustes solicitados"].includes(movement.status) && (
                <Button
                  onClick={() =>
                    act(
                      (s) => submitMovement(s, scope, movement.id),
                      "Análise enviada à Diretoria, sem reservar orçamento antes da aprovação.",
                    )
                  }
                >
                  Enviar à Diretoria
                </Button>
              )}
            {scope.director &&
              ["Em análise", "Aprovado"].includes(movement.status) && (
                <section className="space-y-3 rounded-xl border bg-card p-4">
                  <label className="block text-xs">
                    Parecer da Diretoria
                    <Textarea
                      aria-label="Parecer da Diretoria"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {movement.status === "Em análise" ? (
                      <>
                        <Button
                          onClick={() =>
                            act(
                              (s) =>
                                decideMovement(
                                  s,
                                  scope,
                                  movement.id,
                                  "approve",
                                  comment,
                                ),
                              "Aprovação e reserva demonstrativas registradas.",
                            )
                          }
                        >
                          Aprovar reconhecimento
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() =>
                            act(
                              (s) =>
                                decideMovement(
                                  s,
                                  scope,
                                  movement.id,
                                  "adjust",
                                  comment,
                                ),
                              "Ajustes solicitados ao RH.",
                            )
                          }
                        >
                          Solicitar ajustes
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() =>
                            act(
                              (s) =>
                                decideMovement(
                                  s,
                                  scope,
                                  movement.id,
                                  "reject",
                                  comment,
                                ),
                              "Análise rejeitada, sem reserva de orçamento.",
                            )
                          }
                        >
                          Rejeitar análise
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() =>
                          act(
                            (s) =>
                              decideMovement(
                                s,
                                scope,
                                movement.id,
                                "cancel",
                                comment,
                              ),
                            "Reserva cancelada; orçamento liberado.",
                          )
                        }
                      >
                        Cancelar reserva aprovada
                      </Button>
                    )}
                  </div>
                </section>
              )}
            {scope.rh && movement.status === "Aprovado" && (
              <section className="space-y-3 rounded-xl border bg-card p-4">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={localConsent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  Confirmo que a efetivação é somente uma simulação local
                </label>
                <Button
                  disabled={!localConsent}
                  onClick={() =>
                    act(
                      (s) => implementMovement(s, scope, movement.id),
                      "Reconhecimento efetivado somente na demonstração. Publicação depende de autorização separada do RH.",
                    )
                  }
                >
                  Efetivar na demonstração
                </Button>
              </section>
            )}
            {scope.rh &&
              movement.status === "Efetivado" &&
              state.people.find((p) => p.id === movement.person)?.contract !==
                "PJ" && (
                <Button
                  variant="outline"
                  onClick={() => begin("publication", undefined, movement.id)}
                >
                  Autorizar publicação do reconhecimento efetivado
                </Button>
              )}
            <section className="rounded-xl border bg-card p-4">
              <h4 className="mb-4 font-semibold">Histórico confidencial</h4>
              {movement.events.map((e) => (
                <div
                  className="mb-4 border-l-2 border-orange-200 pl-3"
                  key={e.id}
                >
                  <p className="text-sm">{e.text}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {e.by} · {new Date(e.at).toLocaleString("pt-BR")}
                  </p>
                </div>
              ))}
            </section>
          </div>
        </Modal>
      )}
    </div>
  );
}
