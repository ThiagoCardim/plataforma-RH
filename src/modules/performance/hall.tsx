"use client";
import { useState, useCallback, useRef } from "react";
import {
  Trophy,
  Medal,
  Sparkles,
  Crown,
  Plus,
  Play,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, Textarea } from "@/components/ui/fields";
import { Modal } from "@/modules/onboarding/components";
import { EntityForm, type Field } from "@/modules/career/components";
import {
  type Scope,
  type Contract,
  admin,
  uid,
  dateNow,
} from "@/modules/career/model";
import {
  type PerformanceState,
  type Award,
  type Category,
  type Campaign,
  eligible,
  ranking,
  score,
  saveAward,
  validateAward,
  publishAward,
  saveCategory,
  saveCampaign,
  saveRegulation,
} from "./model";
import { usePerformance } from "./store";
import { Notice, Tabs, Empty, Events, fmt } from "./components";
import { Portrait, Ceremony } from "./ceremony";
import "./hall.css";
export function HallWorkspace({
  initial,
  scope,
}: {
  initial: PerformanceState;
  scope: Scope;
}) {
  const { state, ready, act, error, notice, clear } = usePerformance(
      initial,
      scope,
      true,
    ),
    management = admin(scope);
  const [tab, setTab] = useState("Destaques do Mês"),
    [month, setMonth] = useState(dateNow().slice(0, 7)),
    [campaignChoice, setCampaign] = useState(""),
    [categoryId, setCategory] = useState(state.categories[0]?.id ?? ""),
    [sector, setSector] = useState(""),
    [config, setConfig] = useState("Reconhecimentos");
  const [selected, setSelected] = useState<string | null>(null),
    [gallery, setGallery] = useState<string | null>(null),
    [awardEdit, setAwardEdit] = useState<Partial<Award> | null>(null),
    [categoryEdit, setCategoryEdit] = useState<Category | null | undefined>(
      undefined,
    ),
    [campaignEdit, setCampaignEdit] = useState<Campaign | null | undefined>(
      undefined,
    ),
    [regEdit, setRegEdit] = useState(false),
    [ceremony, setCeremony] = useState(false),
    [preview, setPreview] = useState(true),
    [candidates, setCandidates] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const ceremonyTrigger = useRef<HTMLButtonElement>(null);
  const stopPresentation = useCallback(() => {
    setPresenting(false);
    ceremonyTrigger.current?.focus();
  }, []);
  const campaignId =
    (
      state.campaigns.find((c) => c.id === campaignChoice) ??
      state.campaigns.find(
        (c) =>
          c.year === Number(dateNow().slice(0, 4)) &&
          c.semester === (Number(dateNow().slice(5, 7)) <= 6 ? 1 : 2),
      ) ??
      state.campaigns[0]
    )?.id ?? "";
  const own = state.people.find((p) => p.user === scope.user),
    award = state.awards.find((a) => a.id === selected),
    campaign = state.campaigns.find((c) => c.id === campaignId),
    category = state.categories.find((c) => c.id === categoryId);
  const visible = state.awards.filter(
    (a) =>
      a.status === "Publicado" &&
      a.month === month &&
      (!sector || a.category.sector === sector),
  );
  const ranks = ranking(state, categoryId, campaignId),
    ceremonyRows = state.awards.filter(
      (a) =>
        a.month === month &&
        a.campaign.id === campaignId &&
        (preview || a.status === "Publicado"),
    );
  const regulation = state.regulations.filter((r) => r.published).at(-1),
    message = <Notice error={error} notice={notice} />;
  const f = (
    key: string,
    label: string,
    type: Field["type"] = "text",
    options?: Field["options"],
  ): Field => ({ key, label, type, options });
  function openAward(a: Award) {
    clear();
    setGallery(null);
    setSelected(a.id);
  }
  function nextMonth() {
    const d = new Date(dateNow() + "T12:00:00Z");
    d.setUTCMonth(d.getUTCMonth() + 1);
    const v = d.toISOString().slice(0, 7);
    return campaign &&
      Number(v.slice(0, 4)) === campaign.year &&
      (Number(v.slice(5)) <= 6 ? 1 : 2) === campaign.semester
      ? v
      : month;
  }
  function newAward() {
    clear();
    setAwardEdit({
      month: nextMonth(),
      campaign: campaign,
      order: state.awards.filter((a) => a.month === nextMonth()).length + 1,
    });
  }
  function cards(rows: Award[]) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((a) => {
          const p = state.people.find((p) => p.id === a.person);
          return (
            p && (
              <button
                key={a.id}
                onClick={() => openAward(a)}
                className="hall-card group relative overflow-hidden rounded-2xl border border-amber-300/30 bg-stone-950 text-left text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-amber-900/20 motion-reduce:transform-none"
              >
                <div className="relative">
                  <Portrait
                    photo={a.photo}
                    name={p.name}
                    className="aspect-[4/5] w-full"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/10 to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full border border-amber-200/40 bg-stone-950/75 px-3 py-1.5 text-xs font-medium text-amber-100">
                    {a.month} · {a.category.badge}
                  </span>
                  <div className="absolute inset-x-5 bottom-5">
                    <Trophy className="mb-3 text-amber-200" size={30} />
                    <p className="text-xs uppercase tracking-[.15em] text-amber-200">
                      {a.category.name}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold">{p.name}</h3>
                  </div>
                </div>
                <div className="border-t border-amber-100/10 px-5 py-4">
                  <p className="line-clamp-2 text-sm leading-6 text-stone-300">
                    {a.phrase}
                  </p>
                  <p className="mt-3 text-xs text-amber-100/80">
                    Explorar a conquista
                  </p>
                </div>
              </button>
            )
          );
        })}
      </div>
    );
  }
  if (!ready) return <p role="status">Preparando o Hall de Destaques…</p>;
  return (
    <div className="min-w-0 space-y-6 overflow-x-clip">
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        Demonstração local · reconhecimentos e retratos fictícios, gerados por
        IA. Sem pagamentos, mensagens ou publicação automática. Dados separados
        por navegador, conta e organização.
      </p>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-kicker mb-3">
            Desempenho / Pessoas que fazem a diferença
          </p>
          <h1 className="page-title">Hall de Destaques</h1>
        </div>
        {management && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              ref={ceremonyTrigger}
              onClick={() => {
                clear();
                setPreview(true);
                setCeremony(true);
              }}
            >
              <Play size={16} />
              Modo Cerimônia
            </Button>
            <Button onClick={newAward}>
              <Plus size={16} />
              Preparar reconhecimento
            </Button>
          </div>
        )}
      </header>
      <Tabs
        items={[
          "Destaques do Mês",
          "Ranking Semestral",
          "Minhas Conquistas",
          "Hall da Fama",
          "Regulamento",
          ...(management ? ["Gerenciar Reconhecimentos"] : []),
        ]}
        value={tab}
        change={(v) => {
          clear();
          setTab(v);
        }}
        label="Abas do Hall de Destaques"
      />
      {!(
        award ||
        awardEdit ||
        categoryEdit !== undefined ||
        campaignEdit !== undefined ||
        regEdit
      ) && message}
      {tab === "Destaques do Mês" && (
        <>
          <section className="relative isolate overflow-hidden rounded-3xl border border-amber-200/20 bg-[#14120f] px-7 py-10 text-white sm:px-10">
            <div className="hall-aura pointer-events-none absolute inset-0" />
            <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
              <div>
                <p className="text-sm uppercase tracking-[.25em] text-amber-200">
                  Excelência tem nome. E tem história.
                </p>
                <h2 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
                  Grandes entregas.
                  <br />
                  <span className="hall-metal">Pessoas extraordinárias.</span>
                </h2>
                <p className="mt-6 max-w-xl text-base leading-7 text-stone-300">
                  Um palco para celebrar a excelência, os valores e as
                  conquistas que constroem a YouCon.
                </p>
                <p className="mt-5 text-sm text-amber-200/80">
                  Categorias independentes · divulgação autorizada · histórias
                  que inspiram
                </p>
              </div>
              <div className="relative mx-auto flex size-48 items-center justify-center rounded-full border border-amber-200/15 bg-gradient-to-br from-amber-100/15 via-amber-500/5 to-stone-950 shadow-[0_0_100px_#d8942920]">
                <Crown className="text-amber-200" size={92} strokeWidth={1.1} />
                <Sparkles
                  className="absolute right-4 top-6 text-amber-100"
                  size={24}
                />
              </div>
            </div>
          </section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="section-title">Destaques do mês</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Somente reconhecimentos já publicados pela gestão.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="text-sm">
                Mês dos destaques
                <Input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </label>
              <label className="text-sm">
                Setor do Hall
                <Select
                  aria-label="Setor do Hall"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                >
                  <option value="">Todos os destaques</option>
                  {state.areas
                    .filter((a) => a.id !== "operations")
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </Select>
              </label>
            </div>
          </div>
          {cards(visible)}
          {!visible.length && (
            <Empty>
              Os destaques deste período ainda não foram divulgados. Preparações
              privadas não aparecem aqui.
            </Empty>
          )}
        </>
      )}
      {tab === "Ranking Semestral" && (
        <>
          <div className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-2">
            <label className="text-sm">
              Categoria do ranking
              <Select
                aria-label="Categoria do ranking"
                value={categoryId}
                onChange={(e) => setCategory(e.target.value)}
              >
                {state.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-sm">
              Campanha semestral
              <Select
                aria-label="Campanha semestral"
                value={campaignId}
                onChange={(e) => setCampaign(e.target.value)}
              >
                {state.campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          <section className="relative overflow-hidden rounded-3xl bg-stone-950 p-6 text-white sm:p-9">
            <div className="hall-aura pointer-events-none absolute inset-0" />
            <div className="relative">
              <p className="text-sm uppercase tracking-[.2em] text-amber-200">
                Um pódio para cada contexto
              </p>
              <h2 className="mt-4 text-3xl font-semibold">{category?.name}</h2>
              <p className="mt-3 text-sm text-stone-300">
                {campaign?.name} · acúmulo de reconhecimentos publicados, sem
                notas de avaliação.
              </p>
              <div className="mt-8 grid items-end gap-4 sm:grid-cols-3">
                {ranks
                  .filter((r) => r.position <= 3)
                  .map((r) => {
                    const p = state.people.find((p) => p.id === r.person),
                      a = state.awards.find(
                        (a) =>
                          a.person === r.person &&
                          a.status === "Publicado" &&
                          a.category.id === categoryId &&
                          a.campaign.id === campaignId,
                      );
                    return (
                      p &&
                      a && (
                        <button
                          key={r.person}
                          className={`hall-card rounded-2xl border p-5 text-center transition-transform hover:-translate-y-1 ${r.position === 1 ? "border-amber-200/50 bg-gradient-to-br from-amber-200/15 to-amber-800/10 sm:pb-12" : "border-stone-600 bg-stone-900"}`}
                          onClick={() => setGallery(p.id)}
                        >
                          <Medal
                            className="mx-auto mb-4 text-amber-200"
                            size={34}
                          />
                          <Portrait
                            photo={a.photo}
                            name={p.name}
                            className="mx-auto aspect-square w-28 rounded-full border-2 border-amber-200/50"
                          />
                          <p className="mt-4 text-xl font-semibold">
                            {r.position}º · {p.name}
                          </p>
                          <p className="mt-3 text-sm text-amber-100">
                            {r.wins} reconhecimentos · {r.points} pontos
                          </p>
                          {ranks.some(
                            (x) =>
                              x.person !== r.person &&
                              x.position === r.position,
                          ) && (
                            <p className="mt-2 text-xs text-stone-300">
                              Posição compartilhada
                            </p>
                          )}
                        </button>
                      )
                    );
                  })}
              </div>
              {!ranks.length && (
                <p className="mt-8 text-sm text-stone-300">
                  O ranking começa após a primeira divulgação desta categoria no
                  semestre.
                </p>
              )}
            </div>
          </section>
          <section className="rounded-2xl border bg-card p-5">
            <h3 className="font-semibold">Regras desta campanha</h3>
            <p className="mt-3 text-sm leading-6">{campaign?.prize}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Critério de desempate: {campaign?.tie}. Pontos de novos
              reconhecimentos: {campaign?.points}. Parâmetros demonstrativos,
              configuráveis pela gestão.
            </p>
            {ranks
              .filter((r) => r.position > 3)
              .map((r) => (
                <button
                  key={r.person}
                  onClick={() => setGallery(r.person)}
                  className="mt-3 flex w-full justify-between rounded-xl bg-muted p-4 text-sm"
                >
                  <span>
                    {r.position}º ·{" "}
                    {state.people.find((p) => p.id === r.person)?.name}
                  </span>
                  <strong>{r.wins} reconhecimentos</strong>
                </button>
              ))}
          </section>
        </>
      )}
      {tab === "Minhas Conquistas" && (
        <>
          <div className="rounded-3xl border border-amber-300/30 bg-gradient-to-br from-stone-950 to-orange-950 p-7 text-white">
            <Medal className="text-amber-200" size={38} />
            <h2 className="mt-4 text-3xl font-semibold">
              Cada conquista conta a sua história.
            </h2>
            <p className="mt-4 text-sm leading-7 text-stone-300">
              Sua coleção de reconhecimentos publicados, medalhas e selos.
              Nenhuma nota privada ou resultado negativo é exibido.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {state.awards
              .filter((a) => a.status === "Publicado" && a.person === own?.id)
              .map((a) => (
                <span
                  key={a.id}
                  className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"
                >
                  <Medal className="text-amber-700" size={24} />
                  <span className="text-sm font-medium">
                    {a.category.badge} · {a.month}
                  </span>
                </span>
              ))}
          </div>
          {cards(
            state.awards.filter(
              (a) => a.status === "Publicado" && a.person === own?.id,
            ),
          )}
          {!state.awards.some(
            (a) => a.status === "Publicado" && a.person === own?.id,
          ) && (
            <Empty>
              Seu espaço está pronto para receber conquistas publicadas.
            </Empty>
          )}
        </>
      )}
      {tab === "Hall da Fama" && (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="section-title">Histórias que ficam</h2>
            <label className="text-sm">
              Temporada do Hall da Fama
              <Select
                aria-label="Temporada do Hall da Fama"
                value={campaignId}
                onChange={(e) => setCampaign(e.target.value)}
              >
                {state.campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {state.categories.map((cat) => {
              const champions = ranking(state, cat.id, campaignId).filter(
                (r) => r.position === 1,
              );
              return (
                <article
                  key={cat.id}
                  className="rounded-2xl border border-amber-200/50 bg-gradient-to-br from-amber-50 to-white p-6"
                >
                  <Trophy className="text-amber-700" size={30} />
                  <h3 className="mt-4 text-lg font-semibold">{cat.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {campaign?.name}
                  </p>
                  {champions.length ? (
                    champions.map((r) => (
                      <button
                        key={r.person}
                        onClick={() => setGallery(r.person)}
                        className="mt-5 block w-full rounded-xl border border-amber-200 bg-white p-4 text-left"
                      >
                        <strong className="text-sm">
                          {state.people.find((p) => p.id === r.person)?.name}
                        </strong>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {r.wins} reconhecimentos publicados
                          {campaignId === state.campaigns[0]?.id
                            ? " · temporada em andamento"
                            : " · temporada arquivada"}
                        </p>
                      </button>
                    ))
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">
                      Sem campeão publicado neste período.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
          <p className="text-sm text-muted-foreground">
            Cada categoria mantém seu próprio campeão. Novo semestre inicia
            outro ranking e preserva as conquistas anteriores.
          </p>
        </>
      )}
      {tab === "Regulamento" && (
        <section className="space-y-5 rounded-2xl border bg-card p-6">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <ShieldCheck className="mb-3 text-amber-700" />
              <h2 className="section-title">
                Reconhecer com clareza e respeito
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Versão publicada {regulation?.version ?? "—"}
              </p>
            </div>
            {management && (
              <Button
                variant="outline"
                onClick={() => {
                  clear();
                  setRegEdit(true);
                }}
              >
                Personalizar regulamento
              </Button>
            )}
          </div>
          <p className="whitespace-pre-wrap text-sm leading-8">
            {regulation?.text ?? "A gestão ainda não publicou o regulamento."}
          </p>
          <div className="space-y-3">
            {state.regulations.map((r) => (
              <details key={r.id} className="rounded-xl border p-4">
                <summary className="cursor-pointer text-sm font-semibold">
                  Versão {r.version} · {r.published ? "Publicada" : "Rascunho"}
                </summary>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7">
                  {r.text}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {r.by} · {new Date(r.at).toLocaleDateString("pt-BR")}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}
      {tab === "Gerenciar Reconhecimentos" && management && (
        <>
          <Tabs
            items={["Reconhecimentos", "Categorias", "Campanhas"]}
            value={config}
            change={(v) => {
              setConfig(v);
              clear();
            }}
            label="Gestão do Hall"
          />
          {config === "Reconhecimentos" && (
            <>
              <div className="flex flex-wrap justify-between gap-3">
                <h2 className="section-title">
                  Preparação e divulgação sob controle
                </h2>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setCandidates(true)}>
                    Analisar candidatos
                  </Button>
                  <Button onClick={newAward}>Novo reconhecimento</Button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {state.awards.map((a) => (
                  <article
                    key={a.id}
                    className="space-y-3 rounded-2xl border bg-card p-5"
                  >
                    <Badge>{a.status}</Badge>
                    <h3 className="text-lg font-semibold">
                      {state.people.find((p) => p.id === a.person)?.name}
                    </h3>
                    <p className="text-sm">
                      {a.category.name} · {a.month}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.campaign.name}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openAward(a)}
                    >
                      Abrir preparação
                    </Button>
                  </article>
                ))}
              </div>
            </>
          )}
          {config === "Categorias" && (
            <>
              <div className="flex flex-wrap justify-between gap-3">
                <h2 className="section-title">
                  Categorias, elegibilidade e selos
                </h2>
                <Button
                  onClick={() => {
                    clear();
                    setCategoryEdit(null);
                  }}
                >
                  Nova categoria
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {state.categories.map((c) => (
                  <article
                    key={c.id}
                    className="rounded-2xl border bg-card p-5"
                  >
                    <Badge>
                      {c.enabled ? "Ativa" : "Inativa"} · {c.kind}
                    </Badge>
                    <h3 className="mt-4 text-lg font-semibold">{c.name}</h3>
                    <p className="mt-3 text-sm">
                      {c.contracts.join(" · ")} · {c.badge}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {c.criteria}
                    </p>
                    <Button
                      className="mt-4"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        clear();
                        setCategoryEdit(c);
                      }}
                    >
                      Personalizar categoria
                    </Button>
                  </article>
                ))}
              </div>
            </>
          )}
          {config === "Campanhas" && (
            <>
              <div className="flex flex-wrap justify-between gap-3">
                <h2 className="section-title">
                  Temporadas independentes por semestre
                </h2>
                <Button
                  onClick={() => {
                    clear();
                    setCampaignEdit(null);
                  }}
                >
                  Nova campanha
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {state.campaigns.map((c) => (
                  <article
                    key={c.id}
                    className="rounded-2xl border bg-card p-5"
                  >
                    <Badge>
                      {c.semester}º semestre · {c.year}
                    </Badge>
                    <h3 className="mt-4 text-lg font-semibold">{c.name}</h3>
                    <p className="mt-3 text-sm leading-6">{c.prize}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Desempate: {c.tie} · novos reconhecimentos: {c.points}{" "}
                      pontos
                    </p>
                    <Button
                      className="mt-4"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        clear();
                        setCampaignEdit(c);
                      }}
                    >
                      Configurar campanha
                    </Button>
                  </article>
                ))}
              </div>
            </>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              if (
                window.confirm(
                  "Restaurar os exemplos de Avaliação, Metas e Hall desta conta?",
                )
              )
                act(() => initial, "Base integrada restaurada.");
            }}
          >
            Restaurar base integrada
          </Button>
        </>
      )}
      {award && (
        <Modal
          title={`Conquista · ${state.people.find((p) => p.id === award.person)?.name}`}
          close={() => {
            setSelected(null);
            clear();
          }}
        >
          {message}
          <div className="space-y-5">
            <div className="mx-auto max-w-sm">
              <Portrait
                photo={award.photo}
                name={
                  state.people.find((p) => p.id === award.person)?.name ?? ""
                }
                className="aspect-[4/5] w-full rounded-2xl border border-amber-200"
              />
            </div>
            <Badge>
              {award.category.name} · {award.month}
            </Badge>
            <h3 className="text-2xl font-semibold">{award.phrase}</h3>
            <p className="whitespace-pre-wrap text-sm leading-7">
              {award.message}
            </p>
            <p className="text-sm text-muted-foreground">
              {award.category.badge} · {award.campaign.prize}
            </p>
            {award.regulation && (
              <details className="rounded-xl border p-4">
                <summary className="cursor-pointer text-sm font-semibold">
                  Regulamento na preparação · v{award.regulation.version}
                </summary>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7">
                  {award.regulation.text}
                </p>
              </details>
            )}
            {award.status === "Publicado" && (
              <Button
                variant="outline"
                onClick={() => {
                  setGallery(award.person);
                  setSelected(null);
                }}
              >
                Ver conquistas publicadas
              </Button>
            )}
            {management && (
              <section className="space-y-3 rounded-xl bg-accent p-4">
                <p className="text-sm font-semibold">
                  Preparação confidencial · {award.status}
                </p>
                {award.source && (
                  <p className="text-sm">
                    Fonte: avaliação validada vinculada, sem copiar notas para
                    divulgação.
                  </p>
                )}
                {award.status === "Rascunho" && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        clear();
                        setAwardEdit(award);
                        setSelected(null);
                      }}
                    >
                      Editar preparação
                    </Button>
                    <Button
                      onClick={() =>
                        act(
                          (s) => validateAward(s, scope, award.id),
                          "Vencedor validado, ainda sem divulgação.",
                        )
                      }
                    >
                      Validar vencedor
                    </Button>
                  </div>
                )}
                {award.status === "Validado" && (
                  <Button
                    onClick={() => {
                      if (
                        window.confirm(
                          "Divulgar explicitamente este reconhecimento para os públicos autorizados? Não há efeito financeiro ou promoção.",
                        )
                      )
                        act(
                          (s) => publishAward(s, scope, award.id, true),
                          "Reconhecimento divulgado manualmente.",
                        );
                    }}
                  >
                    Publicar reconhecimento
                  </Button>
                )}
                <Events events={award.events} />
              </section>
            )}
          </div>
        </Modal>
      )}
      {gallery && (
        <Modal
          title={`Galeria de conquistas · ${state.people.find((p) => p.id === gallery)?.name}`}
          close={() => setGallery(null)}
        >
          {cards(
            state.awards.filter(
              (a) => a.person === gallery && a.status === "Publicado",
            ),
          )}
        </Modal>
      )}
      {awardEdit && management && (
        <Modal
          title="Preparar reconhecimento e cerimônia"
          close={() => setAwardEdit(null)}
        >
          {message}
          <AwardEditor
            state={state}
            initial={awardEdit}
            save={(a, cat, camp) => {
              const ok = act((s) => saveAward(s, scope, a, cat, camp));
              if (ok) setAwardEdit(null);
              return ok;
            }}
          />
        </Modal>
      )}
      {categoryEdit !== undefined && management && (
        <Modal
          title="Configurar categoria do Hall"
          close={() => setCategoryEdit(undefined)}
        >
          {message}
          <CategoryEditor
            state={state}
            initial={categoryEdit ?? undefined}
            save={(v) => {
              const ok = act((s) => saveCategory(s, scope, v));
              if (ok) setCategoryEdit(undefined);
              return ok;
            }}
          />
        </Modal>
      )}
      {campaignEdit !== undefined && management && (
        <Modal
          title="Configurar campanha semestral"
          close={() => setCampaignEdit(undefined)}
        >
          {message}
          <CampaignEditor
            state={state}
            initial={campaignEdit ?? undefined}
            save={(v) => {
              const ok = act((s) => saveCampaign(s, scope, v));
              if (ok) setCampaignEdit(undefined);
              return ok;
            }}
          />
        </Modal>
      )}
      {regEdit && management && (
        <Modal
          title="Personalizar regulamento do Hall"
          close={() => setRegEdit(false)}
        >
          {message}
          <EntityForm
            fields={[
              f("text", "Texto do regulamento", "textarea"),
              f("published", "Publicar nova versão do regulamento", "checkbox"),
            ]}
            initial={{
              text: state.regulations.at(-1)?.text ?? "",
              published: "true",
            }}
            description="Preserva as versões anteriores. PJ: excelência dos serviços prestados, sem critérios culturais ou de jornada; eventual premiação financeira requer tratamento contratual próprio."
            save={(d) => {
              const ok = act((s) =>
                saveRegulation(s, scope, d.text, d.published === "true"),
              );
              if (ok) setRegEdit(false);
              return ok;
            }}
          />
        </Modal>
      )}
      {candidates && management && (
        <Modal
          title="Análise confidencial dos candidatos"
          close={() => setCandidates(false)}
        >
          <div className="space-y-4">
            <p className="rounded-xl bg-accent p-4 text-sm leading-6">
              A análise não elege ou publica vencedores. Resultados são
              contextualizados por função; não compare volumes absolutos. Notas
              permanecem confidenciais.
            </p>
            <label className="block text-sm">
              Categoria para analisar
              <Select
                aria-label="Categoria para analisar"
                value={categoryId}
                onChange={(e) => setCategory(e.target.value)}
              >
                {state.categories
                  .filter((c) => c.enabled)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </Select>
            </label>
            {state.evaluations
              .filter(
                (e) =>
                  ["Validada", "Publicada"].includes(e.status) &&
                  e.template.kind === category?.kind &&
                  state.people.some(
                    (p) => p.id === e.person && eligible(category!, p),
                  ),
              )
              .map((e) => (
                <article key={e.id} className="rounded-xl border p-4">
                  <h3 className="font-semibold">
                    {state.people.find((p) => p.id === e.person)?.name}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {e.template.name} · {e.cycle.name} · {fmt(score(e))} privado
                  </p>
                  <Button
                    className="mt-3"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCandidates(false);
                      setAwardEdit({
                        person: e.person,
                        source: e.id,
                        category: category,
                        campaign,
                        month: nextMonth(),
                        order: 8,
                      });
                    }}
                  >
                    Preparar candidatura para revisão
                  </Button>
                </article>
              ))}
          </div>
        </Modal>
      )}
      {ceremony && management && (
        <Modal title="Preparar Modo Cerimônia" close={() => setCeremony(false)}>
          <div className="space-y-4">
            <p className="text-sm leading-6">
              Pré-visualização não publica os resultados. A apresentação
              respeita a preferência de movimento reduzido.
            </p>
            <label className="block text-sm">
              Mês da cerimônia
              <Input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Campanha da cerimônia
              <Select
                aria-label="Campanha da cerimônia"
                value={campaignId}
                onChange={(e) => setCampaign(e.target.value)}
              >
                {state.campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={preview}
                onChange={(e) => setPreview(e.target.checked)}
              />
              Incluir rascunhos e validados · prévia privada
            </label>
            <p className="text-sm">
              {ceremonyRows.length} destaques na ordem configurada.
            </p>
            <Button
              disabled={!ceremonyRows.length}
              onClick={() => {
                setCeremony(false);
                setPresenting(true);
              }}
            >
              Iniciar apresentação
            </Button>
          </div>
        </Modal>
      )}
      {presenting && management && (
        <Ceremony
          awards={ceremonyRows}
          people={state.people}
          preview={preview}
          close={stopPresentation}
        />
      )}
    </div>
  );
}
function AwardEditor({
  state,
  initial,
  save,
}: {
  state: PerformanceState;
  initial: Partial<Award>;
  save: (
    a: Pick<
      Award,
      | "id"
      | "person"
      | "month"
      | "message"
      | "phrase"
      | "photo"
      | "order"
      | "source"
    >,
    cat: string,
    campaign: string,
  ) => boolean;
}) {
  const [categoryId, setCategory] = useState(
      initial.category?.id ?? state.categories.find((c) => c.enabled)?.id ?? "",
    ),
    [campaignId, setCampaign] = useState(
      initial.campaign?.id ?? state.campaigns[0]?.id ?? "",
    ),
    [person, setPerson] = useState(initial.person ?? ""),
    [month, setMonth] = useState(initial.month ?? dateNow().slice(0, 7)),
    [message, setMessage] = useState(initial.message ?? ""),
    [phrase, setPhrase] = useState(initial.phrase ?? ""),
    [photo, setPhoto] = useState(initial.photo ?? "/demo/hall/portraits.png#1"),
    [order, setOrder] = useState(initial.order ?? 1),
    [source, setSource] = useState(initial.source ?? ""),
    [error, setError] = useState("");
  const cat = state.categories.find((c) => c.id === categoryId),
    p = state.people.find((p) => p.id === person),
    people = state.people.filter((p) => cat && eligible(cat, p));
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        save(
          {
            id: initial.id ?? uid(),
            person,
            month,
            message,
            phrase,
            photo,
            order,
            source: source || undefined,
          },
          categoryId,
          campaignId,
        );
      }}
    >
      <p className="rounded-xl bg-amber-50 p-4 text-sm leading-6">
        Preparação privada. A gestão valida o vencedor e divulga em ações
        separadas. Fotos e arquivos ficam somente neste navegador. Para PJ,
        reconheça exclusivamente a excelência dos serviços; nenhuma premiação
        financeira é executada.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          Categoria do reconhecimento
          <Select
            aria-label="Categoria do reconhecimento"
            value={categoryId}
            onChange={(e) => {
              setCategory(e.target.value);
              setPerson("");
              setSource("");
            }}
          >
            {state.categories
              .filter((c) => c.enabled)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </Select>
        </label>
        <label className="text-sm">
          Campanha do reconhecimento
          <Select
            aria-label="Campanha do reconhecimento"
            value={campaignId}
            onChange={(e) => setCampaign(e.target.value)}
          >
            {state.campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="text-sm">
          Profissional / prestador homenageado
          <Select
            aria-label="Profissional / prestador homenageado"
            required
            value={person}
            onChange={(e) => {
              setPerson(e.target.value);
              setSource("");
            }}
          >
            <option value="">Selecione elegível</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.contract}
              </option>
            ))}
          </Select>
        </label>
        <label className="text-sm">
          Mês do reconhecimento
          <Input
            type="month"
            required
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>
        <label className="text-sm sm:col-span-2">
          Avaliação validada de referência (opcional)
          <Select
            aria-label="Avaliação validada de referência (opcional)"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            <option value="">
              Análise manual documentada, sem vínculo a uma avaliação
            </option>
            {state.evaluations
              .filter(
                (e) =>
                  e.person === person &&
                  e.template.kind === cat?.kind &&
                  ["Validada", "Publicada"].includes(e.status),
              )
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.template.name} · {e.cycle.name}
                </option>
              ))}
          </Select>
        </label>
        <label className="text-sm sm:col-span-2">
          Mensagem personalizada
          <Textarea
            aria-label="Mensagem personalizada"
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>
        <label className="text-sm sm:col-span-2">
          Frase de impacto
          <Input
            required
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Ordem de apresentação
          <Input
            type="number"
            min="1"
            step="1"
            required
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="grid gap-5 rounded-2xl border p-4 sm:grid-cols-[160px_1fr]">
        <Portrait
          photo={photo}
          name={p?.name ?? "Profissional fictício"}
          className="aspect-[4/5] w-40 rounded-xl"
        />
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">
            Fotografia para o destaque e a cerimônia
          </h3>
          <label className="block text-sm">
            Selecionar foto demonstrativa
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (
                  ![
                    "image/png",
                    "image/jpeg",
                    "image/webp",
                    "image/avif",
                  ].includes(file.type) ||
                  file.size > 4 * 1024 * 1024
                ) {
                  setError("Selecione JPG, PNG, WebP ou AVIF de até 4 MB.");
                  return;
                }
                setPhoto(
                  URL.createObjectURL(new Blob([file], { type: file.type })),
                );
                setError("");
              }}
            />
          </label>
          <p className="text-xs text-muted-foreground">
            Use dados demonstrativos. Sem upload remoto.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPhoto("/demo/hall/portraits.png#1")}
          >
            Restaurar retrato fictício
          </Button>
          {error && (
            <p role="alert" className="text-sm text-rose-800">
              {error}
            </p>
          )}
        </div>
      </div>
      <Button type="submit">Salvar preparação privada</Button>
    </form>
  );
}
function CategoryEditor({
  state,
  initial,
  save,
}: {
  state: PerformanceState;
  initial?: Category;
  save: (c: Category) => boolean;
}) {
  const [c, set] = useState<Category>(() =>
    initial
      ? structuredClone(initial)
      : {
          id: uid(),
          name: "",
          kind: "Operacional",
          sector: state.areas[0].id,
          contracts: ["CLT", "Estágio", "PJ"],
          badge: "",
          criteria: "",
          enabled: true,
        },
  );
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        save(c);
      }}
    >
      <p className="rounded-xl bg-accent p-4 text-sm leading-6">
        Categorias operacionais exigem um setor. Cultura é exclusiva de CLT e
        Estágio; lideranças têm categoria independente. Alterações valem para
        novas preparações; reconhecimentos já registrados preservam a categoria
        original.
      </p>
      <label className="block text-sm">
        Nome da categoria
        <Input
          required
          value={c.name}
          onChange={(e) => set({ ...c, name: e.target.value })}
        />
      </label>
      <label className="block text-sm">
        Natureza do reconhecimento
        <Select
          aria-label="Natureza do reconhecimento"
          value={c.kind}
          onChange={(e) => {
            const kind = e.target.value as Category["kind"];
            set({
              ...c,
              kind,
              sector: kind === "Operacional" ? state.areas[0].id : "",
              contracts:
                kind === "Operacional"
                  ? c.contracts
                  : c.contracts.filter((x) => x !== "PJ"),
            });
          }}
        >
          <option>Operacional</option>
          <option>Comportamental</option>
          <option>Liderança</option>
        </Select>
      </label>
      {c.kind === "Operacional" && (
        <label className="block text-sm">
          Setor obrigatório da categoria
          <Select
            aria-label="Setor obrigatório da categoria"
            value={c.sector}
            onChange={(e) => set({ ...c, sector: e.target.value })}
          >
            {state.areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </label>
      )}
      <fieldset className="flex flex-wrap gap-4">
        <legend className="mb-2 text-sm font-semibold">Elegibilidade</legend>
        {(["CLT", "Estágio", "PJ"] as Contract[]).map((x) => (
          <label key={x} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={c.contracts.includes(x)}
              disabled={c.kind !== "Operacional" && x === "PJ"}
              onChange={(e) =>
                set({
                  ...c,
                  contracts: e.target.checked
                    ? [...c.contracts, x]
                    : c.contracts.filter((v) => v !== x),
                })
              }
            />
            {x}
          </label>
        ))}
      </fieldset>
      <label className="block text-sm">
        Nome do selo colecionável
        <Input
          required
          value={c.badge}
          onChange={(e) => set({ ...c, badge: e.target.value })}
        />
      </label>
      <label className="block text-sm">
        Critérios demonstrativos
        <Textarea
          aria-label="Critérios demonstrativos"
          required
          value={c.criteria}
          onChange={(e) => set({ ...c, criteria: e.target.value })}
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={c.enabled}
          onChange={(e) => set({ ...c, enabled: e.target.checked })}
        />
        Categoria ativa para novas preparações
      </label>
      <Button type="submit">Salvar categoria</Button>
    </form>
  );
}
function CampaignEditor({
  state,
  initial,
  save,
}: {
  state: PerformanceState;
  initial?: Campaign;
  save: (c: Campaign) => boolean;
}) {
  const [c, set] = useState<Campaign>(() =>
      initial
        ? structuredClone(initial)
        : {
            id: uid(),
            name: "",
            year: Number(dateNow().slice(0, 4)),
            semester: 1,
            prize: "Premiações serão definidas pelo RH.",
            tie: "Empate compartilhado",
            tieOrder: [],
            points: 1,
          },
    ),
    [person, setPerson] = useState("");
  function move(id: string, n: number) {
    const list = [...c.tieOrder],
      index = list.indexOf(id);
    if (index + n < 0 || index + n >= list.length) return;
    [list[index], list[index + n]] = [list[index + n], list[index]];
    set({ ...c, tieOrder: list });
  }
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        save(c);
      }}
    >
      <p className="rounded-xl bg-accent p-4 text-sm leading-6">
        Parâmetros demonstrativos. Mudanças de pontos e premiações valem para
        novos reconhecimentos; os anteriores preservam suas cópias. Não há
        pagamento nem regra definitiva.
      </p>
      <label className="block text-sm">
        Nome da campanha
        <Input
          required
          value={c.name}
          onChange={(e) => set({ ...c, name: e.target.value })}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          Ano da campanha
          <Input
            type="number"
            min="2020"
            max="2100"
            value={c.year}
            onChange={(e) => set({ ...c, year: Number(e.target.value) })}
          />
        </label>
        <label className="text-sm">
          Semestre
          <Select
            aria-label="Semestre"
            value={c.semester}
            onChange={(e) =>
              set({ ...c, semester: Number(e.target.value) as 1 | 2 })
            }
          >
            <option value="1">1º semestre</option>
            <option value="2">2º semestre</option>
          </Select>
        </label>
      </div>
      <label className="block text-sm">
        Premiações demonstrativas e condições
        <Textarea
          aria-label="Premiações demonstrativas e condições"
          required
          value={c.prize}
          onChange={(e) => set({ ...c, prize: e.target.value })}
        />
      </label>
      <label className="block text-sm">
        Pontos por novo reconhecimento
        <Input
          type="number"
          min="0.01"
          step="any"
          value={c.points}
          onChange={(e) => set({ ...c, points: Number(e.target.value) })}
        />
      </label>
      <label className="block text-sm">
        Critério de desempate
        <Select
          aria-label="Critério de desempate"
          value={c.tie}
          onChange={(e) =>
            set({ ...c, tie: e.target.value as Campaign["tie"] })
          }
        >
          <option>Empate compartilhado</option>
          <option>Reconhecimento mais recente</option>
          <option>Decisão do RH</option>
        </Select>
      </label>
      {c.tie === "Decisão do RH" && (
        <section className="space-y-3 rounded-xl border p-4">
          <h3 className="text-sm font-semibold">
            Prioridade manual para empates de pontos
          </h3>
          <p className="text-xs text-muted-foreground">
            A ordem só se aplica a empatados da mesma categoria. Nomes sem
            prioridade permanecem empatados.
          </p>
          <label className="block text-sm">
            Adicionar pessoa ao desempate
            <Select
              aria-label="Adicionar pessoa ao desempate"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
            >
              <option value="">Selecione</option>
              {state.people
                .filter((p) => !c.tieOrder.includes(p.id))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </Select>
          </label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!person}
            onClick={() => {
              set({ ...c, tieOrder: [...c.tieOrder, person] });
              setPerson("");
            }}
          >
            Adicionar prioridade
          </Button>
          {c.tieOrder.map((id, i) => (
            <div
              key={id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted p-3"
            >
              <span className="text-sm">
                {i + 1}. {state.people.find((p) => p.id === id)?.name}
              </span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={!i}
                  onClick={() => move(id, -1)}
                >
                  Subir
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={i === c.tieOrder.length - 1}
                  onClick={() => move(id, 1)}
                >
                  Descer
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    set({ ...c, tieOrder: c.tieOrder.filter((x) => x !== id) })
                  }
                >
                  Remover
                </Button>
              </div>
            </div>
          ))}
        </section>
      )}
      <Button type="submit">Salvar campanha</Button>
    </form>
  );
}
