"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Copy,
  Pencil,
  Trash2,
  Target,
  ArrowUpRight,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TextField, AreaField, Pick, Check } from "../academy/components";
import { Tabs, Notice, Empty } from "./components";
import { type Scope, admin, uid } from "../career/model";
import { type PerformanceState } from "./model";
import { usePerformance } from "./store";
import {
  type LeaderGoal,
  initialLeaderGoals,
  newLeaderGoal,
  saveLeaderGoal,
  deleteLeaderGoal,
} from "./leader-goals-model";
export function LeaderGoalsWorkspace({
  initial,
  scope,
}: {
  initial: PerformanceState;
  scope: Scope;
}) {
  const local = usePerformance(initial, scope),
    { state, act } = local,
    manager = admin(scope);
  const [tab, setTab] = useState("Acompanhamento"),
    [draft, setDraft] = useState<LeaderGoal>(),
    [search, setSearch] = useState(""),
    [month, setMonth] = useState(
      new Date()
        .toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" })
        .slice(0, 7),
    );
  const leaders = state.people.filter(
    (p) =>
      p.org === scope.org &&
      p.isLeader &&
      p.contract !== "PJ" &&
      (manager || p.user === scope.user),
  );
  const goals = initialLeaderGoals(state).filter(
    (g) => manager || g.leaders.some((id) => leaders.some((p) => p.id === id)),
  );
  const area = (id: string) => state.areas.find((a) => a.id === id)?.name ?? id;
  const visible = goals.filter((g) =>
    (g.name + " " + g.description).toLowerCase().includes(search.toLowerCase()),
  );
  if (!local.ready)
    return <p role="status">Preparando metas demonstrativas…</p>;
  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-3xl bg-stone-950 p-6 text-white sm:p-9">
        <div
          className="absolute -right-12 -top-16 h-64 w-64 rounded-full border-[40px] border-orange-500/15"
          aria-hidden="true"
        />
        <p className="text-xs font-medium uppercase tracking-[.25em] text-orange-400">
          Desempenho · Liderança
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Clareza para liderar.
          <br />
          <span className="text-orange-400">Direção para crescer.</span>
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-stone-300">
          Metas dos Líderes · organize expectativas, frequência e prioridades de
          cada liderança em um só lugar.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Badge className="bg-white/10 text-white">
            {leaders.length} lideranças
          </Badge>
          <Badge className="bg-white/10 text-white">
            {goals.length} metas configuradas
          </Badge>
          <Badge className="bg-orange-500/20 text-orange-200">
            Protótipo local
          </Badge>
        </div>
      </header>
      <p className="rounded-xl border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">
        Dados fictícios salvos somente neste navegador, separados por usuário,
        organização e perfil. Sem sincronização, avisos ou alterações remotas.
        Esta etapa configura metas; não registra execuções, evidências ou
        resultados reais. Pesos e quantidades são exemplos editáveis.
      </p>
      <Notice error={local.error} notice={local.notice} />
      <Tabs
        label="Metas dos Líderes"
        items={[
          "Acompanhamento",
          "Configuração de Metas",
          "Resultados e Relatórios",
        ]}
        value={tab}
        change={(t) => {
          setTab(t);
          setDraft(undefined);
        }}
      />
      {tab === "Acompanhamento" && (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                Cada liderança, uma direção
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Visualize as metas previstas para o mês selecionado.
              </p>
            </div>
            <TextField
              label="Mês de acompanhamento"
              type="month"
              value={month}
              onChange={setMonth}
            />
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {leaders.map((p) => {
              const assigned = goals.filter(
                (g) =>
                  g.leaders.includes(p.id) &&
                  g.start.slice(0, 7) <= month &&
                  g.end.slice(0, 7) >= month,
              );
              return (
                <article
                  key={p.id}
                  className="overflow-hidden rounded-2xl border bg-card shadow-sm"
                >
                  <div className="h-16 bg-gradient-to-r from-stone-900 to-orange-800" />
                  <div className="px-5 pb-5">
                    <div className="-mt-7 flex items-end justify-between">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-card bg-orange-100 text-xl font-semibold text-orange-800">
                        {state.leaderPhotos?.[p.id] ? (
                          <Image
                            unoptimized
                            width={64}
                            height={64}
                            src={state.leaderPhotos[p.id]}
                            alt={`Foto de ${p.name}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          p.name
                            .split(" ")
                            .slice(0, 2)
                            .map((x) => x[0])
                            .join("")
                        )}
                      </div>
                      <Badge>{area(p.sector)}</Badge>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{p.name}</h3>
                    <div className="my-5 flex items-center gap-4 rounded-xl bg-muted/40 p-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-stone-200 font-semibold text-muted-foreground">
                        —
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Performance mensal
                        </p>
                        <p className="text-sm font-medium">Sem apuração</p>
                        <p className="text-xs text-muted-foreground">
                          {assigned.length} metas na vigência
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {assigned.map((g) => (
                        <div key={g.id} className="rounded-lg border p-3">
                          <p className="text-sm font-medium">{g.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {g.frequency} · {g.quantity} por período · peso{" "}
                            {g.weight}
                          </p>
                        </div>
                      ))}
                      {!assigned.length && (
                        <p className="text-sm text-muted-foreground">
                          Nenhuma meta vigente neste mês.
                        </p>
                      )}
                    </div>
                    {manager && (
                      <label className="mt-4 block cursor-pointer text-xs text-primary">
                        Adicionar ou substituir foto demonstrativa
                        <input
                          aria-label={`Foto de ${p.name}`}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="mt-2 block w-full text-xs"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            if (
                              f.size > 2 * 1024 * 1024 ||
                              ![
                                "image/jpeg",
                                "image/png",
                                "image/webp",
                              ].includes(f.type)
                            ) {
                              alert("Use JPG, PNG ou WebP de até 2 MB.");
                              return;
                            }
                            const r = new FileReader();
                            r.onload = () =>
                              act((s) => ({
                                ...s,
                                leaderPhotos: {
                                  ...s.leaderPhotos,
                                  [p.id]: String(r.result),
                                },
                              }));
                            r.readAsDataURL(f);
                          }}
                        />
                      </label>
                    )}
                    {manager && state.leaderPhotos?.[p.id] && (
                      <Button
                        variant="ghost"
                        onClick={() =>
                          act((s) => ({
                            ...s,
                            leaderPhotos: Object.fromEntries(
                              Object.entries(s.leaderPhotos ?? {}).filter(
                                ([id]) => id !== p.id,
                              ),
                            ),
                          }))
                        }
                      >
                        Remover foto
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          {!leaders.length && (
            <Empty>Nenhuma liderança disponível no seu escopo.</Empty>
          )}
        </>
      )}
      {tab === "Configuração de Metas" && (
        <>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1">
              <TextField
                label="Pesquisar metas"
                value={search}
                onChange={setSearch}
              />
            </div>
            {manager && (
              <Button onClick={() => setDraft(newLeaderGoal())}>
                <Plus size={16} />
                Criar meta
              </Button>
            )}
          </div>
          {!manager && (
            <p className="text-sm text-muted-foreground">
              Consulta exclusiva das suas metas. RH e Diretoria administram as
              configurações.
            </p>
          )}
          {draft && manager && (
            <section
              aria-label="Editor de meta"
              className="space-y-5 rounded-2xl border-2 border-orange-300 bg-card p-5"
            >
              <h2 className="text-xl font-semibold">Configurar meta</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Nome da meta"
                  value={draft.name}
                  onChange={(name) => setDraft({ ...draft, name })}
                />
                <Pick
                  label="Tipo de meta"
                  value={draft.kind}
                  onChange={(kind) =>
                    setDraft({ ...draft, kind: kind as LeaderGoal["kind"] })
                  }
                  options={[
                    {
                      id: "Geral",
                      name: "Geral · aplicada aos líderes selecionados",
                    },
                    {
                      id: "Individual",
                      name: "Individual · configuração específica",
                    },
                  ]}
                />
              </div>
              <AreaField
                label="Descrição da meta"
                value={draft.description}
                onChange={(description) => setDraft({ ...draft, description })}
              />
              <fieldset className="space-y-3 rounded-xl border p-4">
                <legend className="px-2 text-sm font-medium">
                  Líderes vinculados
                </legend>
                <p className="text-xs text-muted-foreground">
                  Metas gerais compartilham a mesma configuração entre os
                  selecionados. Novos líderes precisam ser vinculados
                  explicitamente.
                </p>
                {leaders.map((p) => (
                  <Check
                    key={p.id}
                    label={`${p.name} · ${area(p.sector)}`}
                    checked={draft.leaders.includes(p.id)}
                    onChange={(yes) =>
                      setDraft({
                        ...draft,
                        leaders: yes
                          ? [...draft.leaders, p.id]
                          : draft.leaders.filter((id) => id !== p.id),
                      })
                    }
                  />
                ))}
              </fieldset>
              <div className="grid gap-4 sm:grid-cols-3">
                <Pick
                  label="Frequência"
                  value={draft.frequency}
                  onChange={(frequency) =>
                    setDraft({
                      ...draft,
                      frequency: frequency as LeaderGoal["frequency"],
                    })
                  }
                  options={["Semanal", "Quinzenal", "Mensal"].map((id) => ({
                    id,
                    name: id,
                  }))}
                />
                <TextField
                  label="Quantidade esperada por período"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={draft.quantity}
                  onChange={(v) => setDraft({ ...draft, quantity: Number(v) })}
                />
                <TextField
                  label="Peso"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={draft.weight}
                  onChange={(v) => setDraft({ ...draft, weight: Number(v) })}
                />
                <TextField
                  label="Início da vigência"
                  type="date"
                  value={draft.start}
                  onChange={(start) => setDraft({ ...draft, start })}
                />
                <TextField
                  label="Fim da vigência"
                  type="date"
                  value={draft.end}
                  onChange={(end) => setDraft({ ...draft, end })}
                />
              </div>
              <Check
                label="Exigir evidências na futura execução"
                checked={draft.evidence}
                onChange={(evidence) => setDraft({ ...draft, evidence })}
              />
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    if (act((s) => saveLeaderGoal(s, scope, draft)))
                      setDraft(undefined);
                  }}
                >
                  Salvar meta
                </Button>
                <Button variant="outline" onClick={() => setDraft(undefined)}>
                  Cancelar
                </Button>
              </div>
            </section>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            {visible.map((g) => (
              <article
                key={g.id}
                className="space-y-4 rounded-2xl border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
                    <Target size={22} />
                  </div>
                  <Badge>{g.kind}</Badge>
                </div>
                <h3 className="text-lg font-semibold">{g.name}</h3>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {g.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge>{g.frequency}</Badge>
                  <Badge>{g.quantity} por período</Badge>
                  <Badge>Peso {g.weight}</Badge>
                  {g.evidence && (
                    <Badge>
                      <ShieldCheck size={12} />
                      Evidência obrigatória
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  <CalendarDays size={13} className="mr-1 inline" />
                  {g.start.split("-").reverse().join("/")} a{" "}
                  {g.end.split("-").reverse().join("/")}
                </p>
                <p className="text-sm">
                  {g.leaders
                    .map((id) => leaders.find((p) => p.id === id)?.name)
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {manager && (
                  <div className="flex flex-wrap gap-2 border-t pt-3">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setDraft(structuredClone(g));
                        window.scrollTo({ top: 0, behavior: "instant" });
                      }}
                    >
                      <Pencil size={14} />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setDraft({
                          ...structuredClone(g),
                          id: uid(),
                          name: g.name + " · cópia",
                        });
                        window.scrollTo({ top: 0, behavior: "instant" });
                      }}
                    >
                      <Copy size={14} />
                      Duplicar
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        if (
                          confirm(
                            `Excluir a configuração local “${g.name}”? O acompanhamento anterior de Avaliação de Desempenho será preservado.`,
                          )
                        )
                          act((s) => deleteLeaderGoal(s, scope, g.id));
                      }}
                    >
                      <Trash2 size={14} />
                      Excluir
                    </Button>
                  </div>
                )}
              </article>
            ))}
          </div>
          {!visible.length && <Empty>Nenhuma meta encontrada.</Empty>}
        </>
      )}
      {tab === "Resultados e Relatórios" && (
        <section className="rounded-2xl border bg-card p-8">
          <div className="mb-5 inline-flex rounded-2xl bg-orange-50 p-4 text-orange-600">
            <Target size={28} />
          </div>
          <h2 className="text-2xl font-semibold">
            Uma visão clara dos próximos resultados
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Estrutura preparada para consolidar metas previstas versus
            realizadas, evidências e evolução mensal. Nesta etapa, não há
            lançamentos, cálculo de performance ou exportação de resultados.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              "Consolidado mensal",
              "Evolução por líder",
              "Evidências e relatórios",
            ].map((t) => (
              <div key={t} className="rounded-xl border border-dashed p-5">
                <h3 className="font-medium">{t}</h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  Disponível em uma próxima etapa
                </p>
              </div>
            ))}
          </div>
          {manager && (
            <Link
              href="/avaliacao-de-desempenho"
              className="mt-6 inline-flex items-center gap-2 text-sm text-primary"
            >
              Consultar acompanhamento existente em Avaliação de Desempenho
              <ArrowUpRight size={15} />
            </Link>
          )}
        </section>
      )}
    </div>
  );
}
