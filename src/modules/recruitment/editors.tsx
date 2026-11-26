"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  TextField,
  AreaField,
  Pick,
  Check,
  Upload,
  Reorder,
  move,
} from "../academy/components";
import { Tabs } from "../performance/components";
import { type Contract, uid, dateNow } from "../career/model";
import {
  type State,
  type Job,
  type Candidate,
  type Criterion,
  factFields,
  type Claim,
} from "./model";
import { FieldBuilder, StageField } from "./forms";
import { type Field, visibleFields } from "./model";
const choices = (xs: readonly string[]) => xs.map((x) => ({ id: x, name: x }));
export function JobEditor({
  initial,
  state,
  save,
}: {
  initial: Job;
  state: State;
  save: (j: Job) => void;
}) {
  const [j, set] = useState(() => structuredClone(initial)),
    [tab, setTab] = useState("Informações");
  const patch = (p: Partial<Job>) => set({ ...j, ...p });
  return (
    <div className="space-y-5">
      <Tabs
        items={[
          "Informações",
          "Etapas e campos",
          "Formulário",
          "Critérios Match",
        ]}
        value={tab}
        change={setTab}
        label="Editor da vaga"
      />
      {tab === "Informações" && (
        <>
          <TextField
            label="Cargo da vaga"
            value={j.title}
            onChange={(title) => patch({ title })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Pick
              label="Setor da vaga"
              value={j.sector}
              onChange={(sector) => patch({ sector })}
              options={choices([
                "Arquitetura",
                "Engenharia",
                "Aprovação",
                "Interiores",
                "Revenue",
                "Operações",
              ])}
            />
            <Pick
              label="Vínculo da vaga"
              value={j.contract}
              onChange={(v) => patch({ contract: v as Contract })}
              options={choices(["CLT", "Estágio", "PJ"])}
            />
            <TextField
              label="Quantidade de posições"
              type="number"
              min="1"
              value={j.positions}
              onChange={(v) => patch({ positions: Number(v) })}
            />
            <TextField
              label="Orçamento mensal aprovado (R$)"
              type="number"
              min="0"
              step="0.01"
              value={(j.budget ?? 0) / 100}
              onChange={(v) => patch({ budget: Math.round(Number(v) * 100) })}
            />
            <TextField
              label="Custo do processo (R$)"
              type="number"
              min="0"
              step="0.01"
              value={(j.cost ?? 0) / 100}
              onChange={(v) => patch({ cost: Math.round(Number(v) * 100) })}
            />
            <TextField
              label="Previsão de contratação"
              type="date"
              value={j.forecast}
              onChange={(forecast) => patch({ forecast })}
            />
            <TextField
              label="Responsável pela vaga"
              value={j.owner}
              onChange={(owner) => patch({ owner })}
            />
            <Pick
              label="Visibilidade da vaga"
              value={j.visibility}
              onChange={(v) => patch({ visibility: v as Job["visibility"] })}
              options={choices(["Listada", "Link exclusivo"])}
            />
          </div>
          {(
            [
              ["description", "Descrição da oportunidade"],
              ["activities", "Atividades da oportunidade"],
              ["requirements", "Requisitos da oportunidade"],
              ["benefits", "Benefícios ou condições contratuais"],
            ] as const
          ).map(([k, label]) => (
            <AreaField
              key={k}
              label={label}
              value={j[k]}
              onChange={(v) => patch({ [k]: v })}
            />
          ))}
          <p className="text-xs leading-6 text-muted-foreground">
            Valores somente demonstrativos. A publicação não divulga orçamento.
            PJ utiliza condições da prestação de serviços.
          </p>
        </>
      )}
      {tab === "Etapas e campos" && (
        <>
          <Pick
            label="Aplicar modelo de processo"
            value=""
            onChange={(id) => {
              const t = state.templates.find((t) => t.id === id);
              if (t?.stages) patch({ stages: structuredClone(t.stages) });
            }}
            options={[
              { id: "", name: "Selecione para copiar a estrutura" },
              ...state.templates
                .filter((t) => t.kind === "Processo" && t.stages)
                .map((t) => ({ id: t.id, name: t.name })),
            ]}
          />
          {j.stages.map((stage, i) => (
            <details key={stage.id} className="rounded-xl border p-4">
              <summary className="cursor-pointer font-medium">
                {i + 1}. {stage.name}
              </summary>
              <div className="mt-5 space-y-4">
                <Reorder
                  name={`etapa ${i + 1}`}
                  first={!i}
                  last={i === j.stages.length - 1}
                  up={() => patch({ stages: move(j.stages, i, -1) })}
                  down={() => patch({ stages: move(j.stages, i, 1) })}
                  remove={() =>
                    patch({ stages: j.stages.filter((x) => x.id !== stage.id) })
                  }
                />
                <TextField
                  label={`Nome da etapa ${i + 1}`}
                  value={stage.name}
                  onChange={(name) =>
                    patch({
                      stages: j.stages.map((x) =>
                        x.id === stage.id ? { ...x, name } : x,
                      ),
                    })
                  }
                />
                <TextField
                  label={`Prazo da etapa ${i + 1} (dias)`}
                  type="number"
                  min="0"
                  value={stage.days}
                  onChange={(v) =>
                    patch({
                      stages: j.stages.map((x) =>
                        x.id === stage.id ? { ...x, days: Number(v) } : x,
                      ),
                    })
                  }
                />
                <h4 className="text-sm font-semibold">Checklist específico</h4>
                {stage.tasks.map((task, k) => (
                  <div
                    key={task.id}
                    className="space-y-3 rounded-xl bg-muted p-3"
                  >
                    <TextField
                      label={`Atividade ${i + 1}.${k + 1}`}
                      value={task.title}
                      onChange={(title) =>
                        patch({
                          stages: j.stages.map((x) =>
                            x.id === stage.id
                              ? {
                                  ...x,
                                  tasks: x.tasks.map((t) =>
                                    t.id === task.id ? { ...t, title } : t,
                                  ),
                                }
                              : x,
                          ),
                        })
                      }
                    />
                    <Check
                      label={`Atividade ${i + 1}.${k + 1} obrigatória`}
                      checked={task.required}
                      onChange={(required) =>
                        patch({
                          stages: j.stages.map((x) =>
                            x.id === stage.id
                              ? {
                                  ...x,
                                  tasks: x.tasks.map((t) =>
                                    t.id === task.id ? { ...t, required } : t,
                                  ),
                                }
                              : x,
                          ),
                        })
                      }
                    />
                    <Button
                      variant="ghost"
                      onClick={() =>
                        patch({
                          stages: j.stages.map((x) =>
                            x.id === stage.id
                              ? {
                                  ...x,
                                  tasks: x.tasks.filter(
                                    (t) => t.id !== task.id,
                                  ),
                                }
                              : x,
                          ),
                        })
                      }
                    >
                      Remover atividade {i + 1}.{k + 1}
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() =>
                    patch({
                      stages: j.stages.map((x) =>
                        x.id === stage.id
                          ? {
                              ...x,
                              tasks: [
                                ...x.tasks,
                                {
                                  id: uid(),
                                  title: "Nova atividade",
                                  required: false,
                                },
                              ],
                            }
                          : x,
                      ),
                    })
                  }
                >
                  Adicionar atividade na etapa {i + 1}
                </Button>
                <FieldBuilder
                  stageFields
                  fields={stage.fields}
                  change={(fields) =>
                    patch({
                      stages: j.stages.map((x) =>
                        x.id === stage.id ? { ...x, fields } : x,
                      ),
                    })
                  }
                />
              </div>
            </details>
          ))}
          <Button
            variant="outline"
            onClick={() =>
              patch({
                stages: [
                  ...j.stages,
                  {
                    id: uid(),
                    name: "Nova etapa",
                    days: 5,
                    fields: [],
                    tasks: [],
                  },
                ],
              })
            }
          >
            Adicionar etapa
          </Button>
        </>
      )}
      {tab === "Formulário" && (
        <>
          <Pick
            label="Copiar formulário salvo"
            value=""
            onChange={(id) => {
              const f = state.forms.find((x) => x.id === id);
              if (f) patch({ form: structuredClone(f) });
            }}
            options={[
              { id: "", name: "Selecione" },
              ...state.forms.map((f) => ({ id: f.id, name: f.name })),
            ]}
          />
          <FieldBuilder
            fields={j.form.fields}
            change={(fields) =>
              patch({
                form: { ...j.form, fields, version: j.form.version + 1 },
              })
            }
          />
        </>
      )}
      {tab === "Critérios Match" && (
        <>
          <p className="rounded-xl bg-accent p-4 text-sm leading-7">
            Pesos demonstrativos e editáveis. Somente requisitos profissionais;
            informação ausente fica como não informada. Nunca há aprovação ou
            movimentação automática.
          </p>
          {j.criteria.map((x, i) => (
            <div key={x.id} className="space-y-3 rounded-xl border p-4">
              <Pick
                label={`Dimensão do critério ${i + 1}`}
                value={x.field}
                onChange={(v) =>
                  patch({
                    criteria: j.criteria.map((r) =>
                      r.id === x.id
                        ? { ...r, field: v as Criterion["field"] }
                        : r,
                    ),
                  })
                }
                options={choices(factFields)}
              />
              <TextField
                label={`Requisito do critério ${i + 1}`}
                value={x.expected}
                onChange={(expected) =>
                  patch({
                    criteria: j.criteria.map((r) =>
                      r.id === x.id ? { ...r, expected } : r,
                    ),
                  })
                }
              />
              <TextField
                label={`Peso demonstrativo ${i + 1}`}
                type="number"
                min="1"
                value={x.weight}
                onChange={(v) =>
                  patch({
                    criteria: j.criteria.map((r) =>
                      r.id === x.id ? { ...r, weight: Number(v) } : r,
                    ),
                  })
                }
              />
              <Check
                label={`Requisito ${i + 1} obrigatório`}
                checked={x.mandatory}
                onChange={(mandatory) =>
                  patch({
                    criteria: j.criteria.map((r) =>
                      r.id === x.id ? { ...r, mandatory } : r,
                    ),
                  })
                }
              />
              <Button
                variant="ghost"
                onClick={() =>
                  patch({ criteria: j.criteria.filter((r) => r.id !== x.id) })
                }
              >
                Remover critério {i + 1}
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() =>
              patch({
                criteria: [
                  ...j.criteria,
                  {
                    id: uid(),
                    field: "Competências",
                    expected: "Novo requisito profissional",
                    mandatory: false,
                    weight: 10,
                  },
                ],
              })
            }
          >
            Adicionar critério profissional
          </Button>
        </>
      )}
      <Button onClick={() => save(j)}>Salvar vaga</Button>
    </div>
  );
}
export function CandidateEditor({
  initial,
  save,
  profileFields,
  initialExtra,
}: {
  initial: Candidate;
  save: (p: Candidate, extra?: Record<string, string>) => void;
  profileFields?: Field[];
  initialExtra?: Record<string, string>;
}) {
  const [p, set] = useState(() => structuredClone(initial)),
    [tab, setTab] = useState("Cadastro"),
    [extra, setExtra] = useState<Record<string, string>>(initialExtra ?? {});
  const patch = (x: Partial<Candidate>) => set({ ...p, ...x });
  return (
    <div className="space-y-5">
      <Tabs
        label="Editar talento"
        items={["Cadastro", "Currículo e evidências"]}
        value={tab}
        change={setTab}
      />
      {tab === "Cadastro" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {profileFields
              ? visibleFields(
                  {
                    id: "profile",
                    name: "Ficha",
                    version: 1,
                    color: "#f97316",
                    message: "",
                    fields: profileFields,
                  },
                  Object.fromEntries(
                    profileFields.map((f) => [
                      f.id,
                      f.mapping
                        ? String(p[f.mapping as keyof Candidate] ?? "")
                        : (extra[f.id] ?? ""),
                    ]),
                  ),
                ).map((f) => (
                  <StageField
                    key={f.id}
                    field={f}
                    value={
                      f.mapping
                        ? String(p[f.mapping as keyof Candidate] ?? "")
                        : (extra[f.id] ?? "")
                    }
                    change={(v) =>
                      f.mapping
                        ? patch({ [f.mapping]: v })
                        : setExtra({ ...extra, [f.id]: v })
                    }
                  />
                ))
              : (
                  [
                    ["name", "Nome completo"],
                    ["email", "E-mail"],
                    ["phone", "Telefone/WhatsApp"],
                    ["city", "Localização"],
                    ["sector", "Setor de interesse"],
                    ["education", "Formação"],
                    ["experience", "Experiência"],
                    ["skills", "Competências técnicas"],
                    ["software", "Softwares"],
                    ["availability", "Disponibilidade"],
                    ["source", "Origem"],
                    ["referral", "Indicação ou referência"],
                  ] as const
                ).map(([k, label]) => (
                  <TextField
                    key={k}
                    label={label}
                    type={k === "email" ? "email" : "text"}
                    value={p[k]}
                    onChange={(v) => patch({ [k]: v })}
                  />
                ))}
            <TextField
              label="Pretensão mensal (R$)"
              type="number"
              min="0"
              step="0.01"
              value={p.expected / 100}
              onChange={(v) => patch({ expected: Math.round(Number(v) * 100) })}
            />
            <TextField
              label="Retenção demonstrativa até"
              type="date"
              value={p.retentionUntil}
              onChange={(retentionUntil) => patch({ retentionUntil })}
            />
            <TextField
              label="Tags (separadas por vírgula)"
              value={p.tags.join(",")}
              onChange={(v) => patch({ tags: v.split(",") })}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            {(["CLT", "Estágio", "PJ"] as Contract[]).map((x) => (
              <Check
                key={x}
                label={`Interesse em ${x}`}
                checked={p.contracts.includes(x)}
                onChange={(yes) =>
                  patch({
                    contracts: yes
                      ? [...p.contracts, x]
                      : p.contracts.filter((v) => v !== x),
                  })
                }
              />
            ))}
          </div>
          <AreaField
            label="Finalidade e autorização demonstrativa"
            value={p.consent}
            onChange={(consent) => patch({ consent })}
          />
          <AreaField
            label="Resumo do currículo fictício"
            value={p.summary}
            onChange={(summary) => patch({ summary })}
          />
        </>
      ) : (
        <>
          <p className="rounded-xl bg-accent p-4 text-sm leading-6">
            Importação demonstrativa: o arquivo fica local. Não há extração
            automática, OCR ou IA. Cadastre abaixo as evidências profissionais
            fictícias usadas na simulação Match.
          </p>
          <Upload
            label="Importar currículo demonstrativo"
            accept=".pdf,.doc,.docx"
            onFile={(cv) => patch({ cv })}
          />
          {p.cv && (
            <p className="text-xs">
              {p.cv.name}
              <Button variant="ghost" onClick={() => patch({ cv: undefined })}>
                Remover currículo
              </Button>
            </p>
          )}
          <Upload
            label="Portfólio demonstrativo"
            onFile={(portfolio) => patch({ portfolio })}
          />
          {p.claims.map((x, i) => (
            <div key={x.id} className="space-y-3 rounded-xl border p-4">
              <Pick
                label={`Dimensão da evidência ${i + 1}`}
                value={x.field}
                options={choices(factFields)}
                onChange={(v) =>
                  patch({
                    claims: p.claims.map((f) =>
                      f.id === x.id ? { ...f, field: v as Claim["field"] } : f,
                    ),
                  })
                }
              />
              <TextField
                label={`Informação profissional ${i + 1}`}
                value={x.value}
                onChange={(value) =>
                  patch({
                    claims: p.claims.map((f) =>
                      f.id === x.id ? { ...f, value } : f,
                    ),
                  })
                }
              />
              <TextField
                label={`Fonte da evidência ${i + 1}`}
                value={x.source}
                onChange={(source) =>
                  patch({
                    claims: p.claims.map((f) =>
                      f.id === x.id ? { ...f, source } : f,
                    ),
                  })
                }
              />
              <Pick
                label={`Situação da evidência ${i + 1}`}
                value={x.status}
                options={choices(["Documentado", "Não atende"])}
                onChange={(v) =>
                  patch({
                    claims: p.claims.map((f) =>
                      f.id === x.id
                        ? { ...f, status: v as Claim["status"] }
                        : f,
                    ),
                  })
                }
              />
              <Button
                variant="ghost"
                onClick={() =>
                  patch({ claims: p.claims.filter((f) => f.id !== x.id) })
                }
              >
                Remover evidência {i + 1}
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() =>
              patch({
                claims: [
                  ...p.claims,
                  {
                    id: uid(),
                    field: "Competências",
                    value: "",
                    source: "Currículo fictício · página/seção",
                    status: "Documentado",
                  },
                ],
              })
            }
          >
            Adicionar evidência profissional
          </Button>
        </>
      )}
      <Button onClick={() => save(p, extra)}>Salvar talento</Button>
    </div>
  );
}
export function newCandidate(retentionDays = 180): Candidate {
  return {
    id: uid(),
    name: "",
    email: "",
    phone: "",
    city: "",
    sector: "",
    education: "",
    experience: "",
    skills: "",
    software: "",
    availability: "",
    expected: 0,
    contracts: ["CLT"],
    source: "Cadastro manual",
    referral: "",
    tags: [],
    created: dateNow(),
    retentionUntil: new Date(
      Date.parse(dateNow() + "T12:00:00Z") + retentionDays * 86400000,
    )
      .toISOString()
      .slice(0, 10),
    consent: "Uso de dados fictícios nesta demonstração local.",
    summary: "",
    claims: [],
  };
}
