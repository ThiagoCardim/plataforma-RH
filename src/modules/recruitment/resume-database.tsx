"use client";
import { useState } from "react";
import {
  Search,
  Upload,
  SlidersHorizontal,
  Plus,
  Sparkles,
} from "lucide-react";
import { Notice } from "../performance/components";
import { saveWorkflowQuery } from "./workflow-model";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TextField, Pick, Check, AreaField } from "../academy/components";
import {
  type WorkflowProps,
  SideSheet,
  AdvancedFilters,
  choices,
} from "./workflow-ui";
import {
  type ResumeConfig,
  type ResumeView,
  resumeViews,
  availabilityStates,
} from "./resume-types";
import { clearWorkflowFilters } from "./workflow-types";
import {
  resumeCandidates,
  createUpdateRequests,
  openDuplicateReview,
  saveResumeConfig,
  runArchiveRules,
  eligibleResumes,
  resumeDuplicates,
  toggleTalent,
} from "./resume-model";
import { startResumeProcess } from "./resume-operations";
import { Freshness, TalentStar, UpdateLinks } from "./resume-components";
import { DuplicateReviewPanel } from "./duplicate-review";
import { ResumeImportPanel } from "./resume-import-panel";
import { MatchDesk } from "./match-desk";
export function ResumeDatabase(
  props: WorkflowProps & { open: (id: string) => void; create: () => void },
) {
  const { state, scope, act, open, create } = props,
    [view, setView] = useState<ResumeView>("Todos os currículos"),
    [filters, setFilters] = useState(clearWorkflowFilters),
    [advanced, setAdvanced] = useState(false),
    [mode, setMode] = useState("Tabela"),
    [checked, setSelected] = useState<string[]>([]),
    [modal, setModal] = useState(""),
    [reason, setReason] = useState(""),
    [queryName, setQueryName] = useState("");
  const selected = checked.filter((id) =>
    state.candidates.some((p) => p.id === id && !p.erased && !p.mergedInto),
  );
  const rows = resumeCandidates(state, view, filters),
    pending = state.duplicateReviews!.filter((r) => r.state === "Pendente");
  const select = (id: string, yes: boolean) =>
    setSelected(
      yes ? [...new Set([...selected, id])] : selected.filter((v) => v !== id),
    );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-2">
        <Button onClick={create}>
          <Plus size={15} />
          Cadastrar currículo
        </Button>
        <label className="flex min-w-48 flex-1 items-center gap-2 rounded-lg border px-3 py-2">
          <Search size={15} />
          <input
            aria-label="Pesquisar Banco de Currículos"
            placeholder="Pesquisar dados profissionais…"
            className="w-full min-w-0 bg-transparent text-sm outline-none"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </label>
        <Button variant="ghost" onClick={() => setAdvanced(!advanced)}>
          <SlidersHorizontal size={15} />
          Filtros
        </Button>
        <Button variant="outline" onClick={() => setModal("match")}>
          <Sparkles size={15} />
          YouCon Match
        </Button>
        <Button variant="outline" onClick={() => setModal("import")}>
          <Upload size={15} />
          Importar demonstração
        </Button>
        <Button variant="ghost" onClick={() => setModal("duplicates")}>
          Revisar duplicidades <Badge>{pending.length}</Badge>
        </Button>
        <Button variant="ghost" onClick={() => setModal("settings")}>
          Preferências
        </Button>
        <Button
          variant="ghost"
          onClick={() => setMode(mode === "Tabela" ? "Cards" : "Tabela")}
        >
          {mode === "Tabela" ? "Cards" : "Tabela"}
        </Button>
      </div>
      <div
        aria-label="Visualizações rápidas de currículos"
        className="flex gap-2 overflow-x-auto pb-2"
      >
        {resumeViews.map((label) => (
          <button
            key={label}
            aria-pressed={view === label}
            onClick={() => setView(label)}
            className={`shrink-0 rounded-lg border px-3 py-2 text-xs ${view === label ? "border-orange-200 bg-orange-50 font-semibold text-primary" : "bg-card text-muted-foreground"}`}
          >
            {label}{" "}
            <span className="ml-2 text-[10px]">
              {resumeCandidates(state, label, clearWorkflowFilters()).length}
            </span>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {rows.length} currículos · uma pessoa, um cadastro, múltiplos processos.
        A estrela de talento não altera etapas. Registros aguardando revisão não
        são unificados automaticamente.
      </p>
      {advanced && (
        <>
          <AdvancedFilters
            state={state}
            filters={filters}
            change={setFilters}
          />
          <Pick
            label="Situação profissional no Banco"
            value={filters.availability}
            options={choices(["", ...availabilityStates])}
            onChange={(availability) =>
              setFilters({ ...filters, availability })
            }
          />
          <Pick
            label="Atualidade do currículo"
            value={filters.freshness ?? ""}
            options={[
              { id: "", name: "Todas" },
              ...[
                "Atualizado",
                "Regular",
                "Atualização recomendada",
                "Desatualizado",
              ].map((name, i) => ({ id: String(i), name })),
            ]}
            onChange={(freshness) => setFilters({ ...filters, freshness })}
          />
          <div className="flex flex-wrap items-end gap-3">
            <TextField
              label="Nome da busca no Banco"
              value={queryName}
              onChange={setQueryName}
            />
            <Button
              variant="outline"
              onClick={() =>
                act((s) => saveWorkflowQuery(s, scope, queryName, filters))
              }
            >
              Salvar busca do Banco
            </Button>
            <Pick
              label="Buscas salvas de currículos"
              value=""
              options={[
                { id: "", name: "Selecionar" },
                ...(state.workflowQueries ?? []).map((q) => ({
                  id: q.id,
                  name: q.name,
                })),
              ]}
              onChange={(id) => {
                const q = state.workflowQueries?.find((q) => q.id === id);
                if (q) setFilters({ ...clearWorkflowFilters(), ...q.filters });
              }}
            />
          </div>
          <Button
            variant="ghost"
            onClick={() => setFilters(clearWorkflowFilters())}
          >
            Limpar filtros do Banco
          </Button>
        </>
      )}
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-orange-50 p-3 text-xs">
          <strong>{selected.length} selecionados</strong>
          <Button
            variant="outline"
            onClick={() => {
              if (act((s) => createUpdateRequests(s, scope, selected)))
                setModal("updates");
            }}
          >
            Solicitar atualização cadastral
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              act((s) =>
                selected.reduce(
                  (next, id) =>
                    next.candidates.find((p) => p.id === id)?.talent
                      ? next
                      : toggleTalent(next, scope, id),
                  s,
                ),
              )
            }
          >
            Marcar talentos
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setModal("start");
              setReason("");
            }}
          >
            Nova oportunidade
          </Button>
          {selected.length === 2 && (
            <Button
              variant="outline"
              onClick={() => {
                if (
                  act((s) =>
                    openDuplicateReview(s, scope, selected[0], selected[1]),
                  )
                )
                  setModal("duplicates");
              }}
            >
              Comparar 2 cadastros
            </Button>
          )}
          <Button variant="ghost" onClick={() => setSelected([])}>
            Limpar seleção
          </Button>
        </div>
      )}
      {mode === "Tabela" ? (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[980px] text-left text-xs">
            <thead className="bg-muted/70">
              <tr>
                <th className="w-14 p-3">Seleção</th>
                <th className="px-3 py-3 whitespace-nowrap">Talento</th>
                <th className="px-3 py-3 whitespace-nowrap">
                  Profissional / área
                </th>
                <th className="px-3 py-3 whitespace-nowrap">Atualização</th>
                <th className="px-3 py-3 whitespace-nowrap">Disponibilidade</th>
                <th className="px-3 py-3 whitespace-nowrap">
                  Cadastro / contato
                </th>
                <th className="px-3 py-3 whitespace-nowrap">Processos</th>
                <th className="px-3 py-3 whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const apps = state.applications.filter(
                    (a) => a.candidate === p.id,
                  ),
                  due = state.resumeContacts!.some(
                    (c) =>
                      c.candidate === p.id &&
                      !c.done &&
                      c.returnOn &&
                      c.returnOn <=
                        new Date().toLocaleDateString("en-CA", {
                          timeZone: "America/Sao_Paulo",
                        }),
                  );
                return (
                  <tr key={p.id} className="border-t">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        className="size-4 accent-orange-600"
                        aria-label={`Selecionar currículo ${p.name} · ${p.email}`}
                        checked={selected.includes(p.id)}
                        onChange={(e) => select(p.id, e.target.checked)}
                      />
                    </td>
                    <td>
                      <TalentStar {...props} candidate={p} />
                    </td>
                    <td className="min-w-48 px-3 py-3">
                      <button
                        onClick={() => open(p.id)}
                        className="font-semibold text-primary"
                      >
                        {p.name}
                      </button>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {p.sector} · {p.city}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {p.email}
                      </p>
                      {resumeDuplicates(state, p).length > 0 && (
                        <span className="text-[10px] text-amber-700">
                          Possível duplicidade · revisar
                        </span>
                      )}
                      {p.cv && <span className="text-[10px]">{p.cv.name}</span>}
                    </td>
                    <td className="min-w-36 px-3 py-3">
                      <Freshness state={state} candidate={p} />
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {p.resumeUpdated ?? p.created}
                      </p>
                    </td>
                    <td className="min-w-36 px-3 py-3">
                      {p.availabilityStatus}
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {p.availability}
                      </p>
                    </td>
                    <td className="min-w-32 px-3 py-3">
                      <p>{p.created}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Contato{" "}
                        {p.lastContact
                          ? new Date(p.lastContact).toLocaleDateString(
                              "pt-BR",
                              { timeZone: "America/Sao_Paulo" },
                            )
                          : "Não registrado"}
                      </p>
                      {due && <Badge>Retorno pendente</Badge>}
                    </td>
                    <td className="pr-3">
                      {apps.length}
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {apps.filter((a) => a.archived).length} arquivados
                      </p>
                    </td>
                    <td className="p-2">
                      <Button variant="ghost" onClick={() => open(p.id)}>
                        Abrir ficha
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((p) => (
            <article
              key={p.id}
              className="space-y-3 rounded-xl border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <input
                  type="checkbox"
                  className="size-4 accent-orange-600"
                  aria-label={`Selecionar currículo ${p.name} · ${p.email}`}
                  checked={selected.includes(p.id)}
                  onChange={(e) => select(p.id, e.target.checked)}
                />
                <TalentStar {...props} candidate={p} />
              </div>
              <button
                className="text-left font-semibold"
                onClick={() => open(p.id)}
              >
                {p.name}
              </button>
              <p className="text-xs text-muted-foreground">
                {p.sector} · {p.city}
              </p>
              <Freshness state={state} candidate={p} />
              <p className="text-xs">{p.availabilityStatus}</p>
              <Button variant="outline" onClick={() => open(p.id)}>
                Abrir ficha
              </Button>
            </article>
          ))}
        </div>
      )}
      {!rows.length && (
        <p className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
          Nenhum currículo corresponde a este recorte.
        </p>
      )}
      {modal && (
        <SideSheet
          title={
            {
              updates: "Atualizações cadastrais demonstrativas",
              duplicates: "Revisão humana de duplicidades",
              import: "Importação demonstrativa do Pipefy",
              settings: "Preferências do Banco de Currículos",
              match: "YouCon Match · toda a base elegível",
              start: "Nova oportunidade",
            }[modal] ?? modal
          }
          close={() => setModal("")}
        >
          <Notice error={props.error ?? ""} notice={props.notice ?? ""} />
          {modal === "updates" && <UpdateLinks {...props} ids={selected} />}
          {modal === "duplicates" && <DuplicateReviewPanel {...props} />}
          {modal === "import" && <ResumeImportPanel {...props} />}
          {modal === "settings" && <ResumePreferences {...props} />}
          {modal === "match" && (
            <MatchDesk
              {...props}
              candidates={(selected.length
                ? eligibleResumes(state).filter((p) => selected.includes(p.id))
                : eligibleResumes(state)
              ).map((p) => p.id)}
            />
          )}
          {modal === "start" && (
            <div className="space-y-4">
              <AreaField
                label="Motivo da nova oportunidade"
                value={reason}
                onChange={setReason}
              />
              <Button
                onClick={() => {
                  if (
                    act((s) =>
                      selected.reduce(
                        (next, id) =>
                          startResumeProcess(next, scope, id, reason),
                        s,
                      ),
                    )
                  ) {
                    setSelected([]);
                    setModal("");
                  }
                }}
              >
                Iniciar novos processos revisados
              </Button>
            </div>
          )}
        </SideSheet>
      )}
    </div>
  );
}
export function ResumePreferences({ state, scope, act }: WorkflowProps) {
  const [config, setConfig] = useState<ResumeConfig>(() =>
    structuredClone(state.resumeConfig!),
  );
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Atualidade das informações</h3>
      <p className="text-xs text-muted-foreground">
        Os três limites em meses definem Atualizado, Regular, Atualização
        recomendada; acima do último limite, Desatualizado. A data do primeiro
        cadastro permanece preservada.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {config.months.map((n, i) => (
          <TextField
            key={i}
            label={`Limite ${i + 1} em meses`}
            type="number"
            value={String(n)}
            onChange={(v) =>
              setConfig({
                ...config,
                months: config.months.map((x, j) =>
                  i === j ? Number(v) : x,
                ) as [number, number, number],
              })
            }
          />
        ))}
      </div>
      <TextField
        label="Validade do link demonstrativo em horas"
        type="number"
        value={String(config.linkHours)}
        onChange={(v) => setConfig({ ...config, linkHours: Number(v) })}
      />
      <AreaField
        label="Mensagem personalizável para WhatsApp"
        value={config.message}
        onChange={(message) => setConfig({ ...config, message })}
      />
      <p className="text-xs">
        Use {"{nome}"}, {"{link}"} e {"{validade}"}. Copiar a mensagem não envia
        nenhum aviso.
      </p>
      <Check
        label="Arquivar automaticamente processos encerrados nesta demonstração"
        checked={config.autoArchive}
        onChange={(autoArchive) => setConfig({ ...config, autoArchive })}
      />
      <TextField
        label="Arquivar após quantos dias do encerramento"
        type="number"
        value={String(config.archiveDays)}
        onChange={(v) => setConfig({ ...config, archiveDays: Number(v) })}
      />
      <p className="text-xs text-muted-foreground">
        A regra local é aplicada ao abrir o módulo e após alterações; não
        executa tarefas em segundo plano com o navegador fechado. Nunca encerra
        vínculo, cancela admissões ou exclui cadastros.
      </p>
      <Button
        onClick={() =>
          act((s) => runArchiveRules(saveResumeConfig(s, scope, config), scope))
        }
      >
        Salvar preferências locais
      </Button>
    </div>
  );
}
