"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EntityForm, type Field } from "../career/components";
import { type Contract, uid, dateNow, brl } from "../career/model";
import { type Job, reviewException } from "./model";
import { experienceLevels } from "./workflow-types";
import {
  saveVacancy,
  cancelVacancy,
  duplicateVacancy,
  vacancyState,
} from "./workflow-model";
import { vacancyStats } from "./workflow-insights";
import { CriteriaEditor } from "./match-desk";
import { type WorkflowProps, SideSheet } from "./workflow-ui";
export function VacancyDesk({ state, scope, act }: WorkflowProps) {
  const [editing, setEditing] = useState<Job>(),
    [requirements, setRequirements] = useState<Job>(),
    [filter, setFilter] = useState("");
  const fields: Field[] = [
    {
      key: "state",
      label: "Situação gerencial",
      type: "select",
      options: ["Rascunho", "Prevista", "Publicada", "Pausada"].map(
        (value) => ({
          value,
          label: value === "Publicada" ? "Aberta (local)" : value,
        }),
      ),
    },
    { key: "title", label: "Cargo", type: "text", required: true },
    { key: "sector", label: "Setor", type: "text", required: true },
    {
      key: "contract",
      label: "Modalidade",
      type: "select",
      options: ["CLT", "Estágio", "PJ"].map((value) => ({
        value,
        label: value,
      })),
    },
    {
      key: "desiredLevel",
      label: "Experiência desejada",
      type: "select",
      options: ["A confirmar", ...experienceLevels].map((value) => ({
        value,
        label: value,
      })),
    },
    {
      key: "positions",
      label: "Quantidade de posições",
      type: "number",
      required: true,
    },
    {
      key: "hiringReason",
      label: "Motivo da contratação",
      type: "select",
      options: ["Expansão", "Substituição"].map((value) => ({
        value,
        label: value,
      })),
    },
    { key: "created", label: "Data de abertura", type: "date", required: true },
    { key: "forecast", label: "Previsão de preenchimento", type: "date" },
    {
      key: "budget",
      label: "Orçamento aprovado (R$ por posição)",
      type: "number",
    },
    {
      key: "cost",
      label: "Custo de recrutamento informado (R$)",
      type: "number",
    },
    {
      key: "requirements",
      label: "Requisitos profissionais opcionais",
      type: "textarea",
    },
    { key: "observations", label: "Observações", type: "textarea" },
  ];
  const rows = state.jobs.filter(
    (j) =>
      !filter ||
      [j.title, j.sector, j.state]
        .join(" ")
        .toLowerCase()
        .includes(filter.toLowerCase()),
  );
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          className="rounded-lg border px-3 py-2 text-sm"
          aria-label="Pesquisar vagas"
          placeholder="Pesquisar vagas"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        {scope.rh && (
          <Button
            onClick={() =>
              setEditing({
                ...structuredClone(state.jobs[0]),
                id: uid(),
                title: "",
                sector: "",
                created: dateNow(),
                forecast: "",
                positions: 1,
                state: "Rascunho",
                filledAt: undefined,
                cancelled: false,
                closed: undefined,
                budget: 0,
                cost: undefined,
                hiringReason: "Expansão",
                observations: "",
                description: "",
                activities: "",
                benefits: "",
                requirements: "",
                criteria: [],
                token: uid(),
              })
            }
          >
            Nova vaga
          </Button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          [
            "Abertas",
            state.jobs.filter(
              (j) => j.state === "Publicada" && !j.filledAt && !j.cancelled,
            ).length,
          ],
          [
            "Previstas",
            state.jobs.filter((j) => j.state === "Prevista").length,
          ],
          ["Preenchidas", state.jobs.filter((j) => j.filledAt).length],
          ["Canceladas", state.jobs.filter((j) => j.cancelled).length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((j) => {
          const stats = vacancyStats(state, j.id);
          return (
            <article
              key={j.id}
              className="space-y-4 rounded-xl border bg-card p-5"
            >
              <div className="flex justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{j.title}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {j.sector} · {j.contract} · {j.hiringReason ?? "Expansão"}
                  </p>
                </div>
                <Badge>
                  {j.cancelled
                    ? "Cancelada"
                    : j.filledAt
                      ? "Preenchida"
                      : j.state}
                </Badge>
              </div>
              <p className="text-xs">
                {j.desiredLevel ?? "Nível a confirmar"} · abertura {j.created} ·
                previsão {j.forecast || "A definir"}
              </p>
              <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted p-3 text-sm">
                <p>
                  <strong>
                    {stats.hires.length}/{j.positions}
                  </strong>{" "}
                  preenchidas
                </p>
                <p>
                  <strong>{stats.remaining}</strong> restantes
                </p>
                <p>
                  <strong>{stats.days}</strong> dias
                </p>
              </div>
              <p className="text-xs">
                {state.applications.filter((a) => a.job === j.id).length} ciclos
                vinculados · tempo médio{" "}
                {stats.average === null ? "Sem dados" : `${stats.average} dias`}{" "}
                · preenchimento integral {j.filledAt ?? "Pendente"}
              </p>
              <p className="text-xs">
                Orçamento: {brl(j.budget ?? 0)} · custo informado{" "}
                {j.cost === undefined ? "Não informado" : brl(j.cost)}
              </p>
              <details>
                <summary className="text-sm cursor-pointer">
                  Candidatos e contratações
                </summary>
                <ul className="mt-2 space-y-2 text-xs">
                  {state.applications
                    .filter((a) => a.job === j.id)
                    .map((a) => (
                      <li key={a.id}>
                        {
                          state.candidates.find((p) => p.id === a.candidate)
                            ?.name
                        }{" "}
                        · {a.status}{" "}
                        {stats.hires.some((e) => e.application === a.id)
                          ? "· formalização confirmada pelo RH"
                          : ""}
                      </li>
                    ))}
                </ul>
              </details>
              {scope.rh && !j.filledAt && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setEditing(j)}>
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => act((s) => duplicateVacancy(s, scope, j.id))}
                  >
                    Duplicar
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setRequirements(structuredClone(j))}
                  >
                    Requisitos Match
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      act((s) =>
                        vacancyState(
                          s,
                          scope,
                          j.id,
                          j.state === "Pausada" ? "Publicada" : "Pausada",
                        ),
                      )
                    }
                  >
                    {j.state === "Pausada" ? "Reabrir" : "Pausar"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (confirm("Cancelar vaga preservando o histórico?"))
                        act((s) => cancelVacancy(s, scope, j.id, true));
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      act((s) => cancelVacancy(s, scope, j.id, false))
                    }
                  >
                    Encerrar
                  </Button>
                </div>
              )}
            </article>
          );
        })}
      </div>
      {scope.director && (
        <section className="space-y-3 rounded-xl border p-4">
          <h2 className="font-semibold">Exceções financeiras</h2>
          {state.exceptions
            .filter((e) => e.state === "Pendente")
            .map((e) => (
              <div key={e.id} className="space-y-2">
                <p className="text-sm">
                  {brl(e.amount)} · {e.reason}
                </p>
                <Button
                  onClick={() =>
                    act((s) =>
                      reviewException(
                        s,
                        scope,
                        e.id,
                        true,
                        "Exceção financeira revisada pela Diretoria.",
                      ),
                    )
                  }
                >
                  Aprovar exceção
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    act((s) =>
                      reviewException(
                        s,
                        scope,
                        e.id,
                        false,
                        "Exceção não autorizada pela Diretoria.",
                      ),
                    )
                  }
                >
                  Recusar exceção
                </Button>
              </div>
            ))}
        </section>
      )}
      {editing && (
        <SideSheet
          title="Cadastro gerencial de vaga"
          close={() => setEditing(undefined)}
        >
          <EntityForm
            fields={fields}
            initial={{
              ...Object.fromEntries(
                Object.entries(editing).map(([k, v]) => [k, String(v ?? "")]),
              ),
              hiringReason: editing.hiringReason ?? "Expansão",
              desiredLevel: editing.desiredLevel ?? "A confirmar",
              budget: String((editing.budget ?? 0) / 100),
              cost:
                editing.cost === undefined ? "" : String(editing.cost / 100),
            }}
            label="Salvar vaga"
            save={(v) => {
              const next = act((s) =>
                saveVacancy(s, scope, {
                  ...editing,
                  ...v,
                  contract: v.contract as Contract,
                  state: v.state as Job["state"],
                  hiringReason: v.hiringReason as "Expansão" | "Substituição",
                  positions: Number(v.positions),
                  budget: Math.round(Number(v.budget) * 100),
                  cost:
                    v.cost === ""
                      ? undefined
                      : Math.round(Number(v.cost) * 100),
                }),
              );
              if (next) setEditing(undefined);
              return !!next;
            }}
          />
        </SideSheet>
      )}
      {requirements && (
        <SideSheet
          title="Requisitos profissionais da vaga"
          close={() => setRequirements(undefined)}
        >
          <CriteriaEditor
            rows={requirements.criteria}
            change={(criteria) =>
              setRequirements({ ...requirements, criteria })
            }
          />
          <Button
            onClick={() => {
              if (act((s) => saveVacancy(s, scope, requirements)))
                setRequirements(undefined);
            }}
          >
            Salvar requisitos
          </Button>
        </SideSheet>
      )}
    </div>
  );
}
