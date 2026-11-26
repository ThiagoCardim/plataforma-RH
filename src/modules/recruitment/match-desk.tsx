"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TextField, Pick, Check } from "../academy/components";
import { type Criterion, factFields } from "./model";
import { freshness, eligibleResumes } from "./resume-model";
import { Freshness } from "./resume-components";
import { uid } from "../career/model";
import { analyzeRequirements, normalized } from "./workflow-model";
import { type WorkflowProps, choices } from "./workflow-ui";
export function CriteriaEditor({
  rows,
  change,
}: {
  rows: Criterion[];
  change: (rows: Criterion[]) => void;
}) {
  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div
          key={r.id}
          className="grid gap-3 rounded-xl border p-3 sm:grid-cols-4"
        >
          <Pick
            label={`Critério ${i + 1}`}
            value={r.field}
            options={choices(factFields)}
            onChange={(v) =>
              change(
                rows.map((x) =>
                  x.id === r.id ? { ...x, field: v as Criterion["field"] } : x,
                ),
              )
            }
          />
          <TextField
            label={`Requisito ${i + 1}`}
            value={r.expected}
            onChange={(expected) =>
              change(rows.map((x) => (x.id === r.id ? { ...x, expected } : x)))
            }
          />
          <TextField
            label={`Peso ${i + 1}`}
            type="number"
            value={String(r.weight)}
            onChange={(v) =>
              change(
                rows.map((x) =>
                  x.id === r.id ? { ...x, weight: Number(v) } : x,
                ),
              )
            }
          />
          <div>
            <Check
              label="Obrigatório"
              checked={r.mandatory}
              onChange={(mandatory) =>
                change(
                  rows.map((x) => (x.id === r.id ? { ...x, mandatory } : x)),
                )
              }
            />
            <Button
              variant="ghost"
              onClick={() => change(rows.filter((x) => x.id !== r.id))}
            >
              Remover critério {i + 1}
            </Button>
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        onClick={() =>
          change([
            ...rows,
            {
              id: uid(),
              field: "Competências",
              expected: "",
              mandatory: false,
              weight: 1,
            },
          ])
        }
      >
        Adicionar requisito profissional
      </Button>
    </div>
  );
}
export function MatchDesk({
  state,
  scope,
  act,
  candidates,
}: { candidates: string[] } & WorkflowProps) {
  const [job, setJob] = useState(""),
    [rows, setRows] = useState<Criterion[]>(state.central!.customCriteria),
    [query, setQuery] = useState(""),
    [priority, setPriority] = useState(true),
    [availability, setAvailability] = useState(""),
    [currentOnly, setCurrentOnly] = useState(false),
    [selected, setSelected] = useState<string[]>(candidates);
  const terms = normalized(query)
    .replace(
      /\b(com|e|ou|de|para|profissional|pessoa|que|tenha|conheca|busco|preciso|em)\b/g,
      " ",
    )
    .split(/\s+/)
    .filter(Boolean);
  const people = (
    state.resumeVersion ? eligibleResumes(state) : state.candidates
  )
    .filter(
      (p) =>
        candidates.includes(p.id) &&
        (!availability || p.availabilityStatus === availability) &&
        (!currentOnly ||
          !state.resumeVersion ||
          freshness(p, state.resumeConfig!).level <= 1) &&
        (!terms.length ||
          terms.every((term) =>
            normalized(
              [
                p.name,
                p.skills,
                p.software,
                p.education,
                p.experience,
                ...p.claims.map((x) => x.value),
              ].join(" "),
            ).includes(term),
          )),
    )
    .sort((a, b) =>
      priority
        ? Number(!!b.talent) - Number(!!a.talent) ||
          (b.resumeUpdated ?? b.created).localeCompare(
            a.resumeUpdated ?? a.created,
          )
        : 0,
    );
  return (
    <div className="space-y-5">
      <p className="rounded-xl bg-accent p-4 text-sm">
        Simulação local baseada em evidências profissionais cadastradas. Sem IA
        externa, decisões automáticas ou inferências pessoais. Pesquisar
        linguagem natural usa termos profissionais; informações ausentes não são
        reprovação.
      </p>
      <TextField
        label="Pesquisar em linguagem natural"
        value={query}
        onChange={setQuery}
      />
      <Pick
        label="Comparar com"
        value={job}
        onChange={(id) => {
          setJob(id);
          setRows(
            structuredClone(
              state.jobs.find((j) => j.id === id)?.criteria ??
                state.central!.customCriteria,
            ),
          );
        }}
        options={[
          { id: "", name: "Requisitos profissionais avulsos" },
          ...state.jobs.map((j) => ({ id: j.id, name: j.title })),
        ]}
      />
      <div className="flex flex-wrap items-end gap-4">
        <Check
          label="Priorizar talentos selecionados"
          checked={priority}
          onChange={setPriority}
        />
        <Check
          label="Somente informações atualizadas ou regulares"
          checked={currentOnly}
          onChange={setCurrentOnly}
        />
        <Pick
          label="Disponibilidade na pesquisa Match"
          value={availability}
          options={choices([
            "",
            "Disponível para oportunidades",
            "Empregado, mas aberto a propostas",
            "Não respondeu ao contato",
            "Disponibilidade desconhecida",
          ])}
          onChange={setAvailability}
        />
      </div>
      <CriteriaEditor rows={rows} change={setRows} />
      <div className="flex flex-wrap gap-3">
        {people.map((p) => (
          <Check
            key={p.id}
            label={p.name}
            checked={selected.includes(p.id)}
            onChange={(yes) =>
              setSelected(
                yes
                  ? [...selected, p.id]
                  : selected.filter((id) => id !== p.id),
              )
            }
          />
        ))}
      </div>
      <Button
        disabled={!selected.length}
        onClick={() =>
          act((s) =>
            analyzeRequirements(
              s,
              scope,
              selected.filter((id) => people.some((p) => p.id === id)),
              rows,
              job,
            ),
          )
        }
      >
        Analisar e comparar selecionados
      </Button>
      <div className="grid gap-4 lg:grid-cols-2">
        {people
          .filter((p) => selected.includes(p.id))
          .map((p) => {
            const a = state.analyses.find((a) => a.candidate === p.id);
            return (
              <article key={p.id} className="space-y-3 rounded-xl border p-4">
                <h3 className="font-semibold">
                  {p.name} {p.talent ? "★" : ""}
                </h3>
                {state.resumeVersion && (
                  <>
                    <Freshness state={state} candidate={p} />
                    <p className="text-xs text-muted-foreground">
                      {p.availabilityStatus} · currículo{" "}
                      {p.resumeUpdated ?? p.created}
                    </p>
                  </>
                )}
                {a ? (
                  <>
                    <p className="text-sm">
                      {a.result.percentage === null
                        ? "Compatibilidade indeterminada"
                        : `${a.result.percentage}% sobre requisitos informados`}{" "}
                      · cobertura {a.result.coverage}%
                    </p>
                    <p className="text-sm">{a.result.summary}</p>
                    {a.result.criteria.map((r) => (
                      <div
                        key={r.criterion.id}
                        className="rounded-lg bg-muted p-3 text-xs"
                      >
                        <strong>
                          {r.criterion.expected} · {r.status}
                        </strong>
                        <p className="mt-2">{r.evidence}</p>
                      </div>
                    ))}
                    <h4 className="text-sm font-semibold">
                      Perguntas sugeridas
                    </h4>
                    {a.result.questions.map((q) => (
                      <p key={q} className="text-xs">
                        {q}
                      </p>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Snapshot {new Date(a.at).toLocaleString("pt-BR")} ·
                      decisão exclusivamente humana.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aguardando análise.
                  </p>
                )}
              </article>
            );
          })}
      </div>
    </div>
  );
}
