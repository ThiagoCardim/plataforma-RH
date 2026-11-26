"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, Events } from "../performance/components";
import {
  TextField,
  AreaField,
  Pick,
  Check,
  Reorder,
  move,
} from "../academy/components";
import { type Contract, uid } from "../career/model";
import {
  type Template,
  type Rule,
  saveForm,
  saveTemplate,
  saveRule,
  triggers,
  actions,
  privacySettings,
} from "./model";
import {
  type CentralConfig,
  type PipelineStage,
  type AdmissionStage,
} from "./workflow-types";
import { savePipeline } from "./workflow-model";
import { FieldBuilder, FormEditor, CandidateForm } from "./forms";
import { CriteriaEditor } from "./match-desk";
import { type WorkflowProps, choices, SideSheet } from "./workflow-ui";
function StageEditor({
  rows,
  change,
  admission = false,
}: {
  rows: (PipelineStage | AdmissionStage)[];
  change: (xs: (PipelineStage | AdmissionStage)[]) => void;
  admission?: boolean;
}) {
  const patch = (id: string, value: Partial<PipelineStage & AdmissionStage>) =>
    change(rows.map((x) => (x.id === id ? { ...x, ...value } : x)));
  return (
    <div className="space-y-3">
      {rows.map((st, i) => (
        <details key={st.id} className="rounded-xl border bg-card p-4">
          <summary
            className="cursor-pointer font-medium"
            style={{ borderLeft: `4px solid ${st.color}`, paddingLeft: 12 }}
          >
            {st.name} · {st.fields.length} campos · {st.tasks.length} atividades
          </summary>
          <div className="mt-4 space-y-4">
            <Reorder
              name={st.name}
              first={!i}
              last={i === rows.length - 1}
              up={() => change(move(rows, i, -1))}
              down={() => change(move(rows, i, 1))}
              remove={() => change(rows.filter((x) => x.id !== st.id))}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <TextField
                label={`Nome da etapa ${i + 1}`}
                value={st.name}
                onChange={(name) => patch(st.id, { name })}
              />
              <TextField
                label={`Cor da etapa ${i + 1}`}
                type="color"
                value={st.color}
                onChange={(color) => patch(st.id, { color })}
              />
              <TextField
                label={`Prazo da etapa ${i + 1} em dias`}
                type="number"
                value={String(st.days)}
                onChange={(v) => patch(st.id, { days: Number(v) })}
              />
            </div>
            {admission ? (
              <Pick
                label="Finalidade da etapa de admissão"
                value={(st as AdmissionStage).purpose}
                options={choices(["normal", "confirmed", "final", "canceled"])}
                onChange={(v) =>
                  patch(st.id, { purpose: v as AdmissionStage["purpose"] })
                }
              />
            ) : (
              <Pick
                label="Função operacional"
                value={(st as PipelineStage).kind}
                options={[
                  ["entry", "Entrada de currículos"],
                  ["normal", "Etapa livre"],
                  ["qualified", "Qualificados"],
                  ["hired", "Aprovado para contratar"],
                  ["bank", "Banco selecionado"],
                  ["disqualified", "Desqualificados"],
                  ["rejected", "Reprovados"],
                  ["declined", "Proposta recusada"],
                ].map(([id, name]) => ({ id, name }))}
                onChange={(v) =>
                  patch(st.id, { kind: v as PipelineStage["kind"] })
                }
              />
            )}
            <FieldBuilder
              fields={st.fields}
              stageFields
              change={(fields) => patch(st.id, { fields })}
            />
            <h4 className="font-medium">Checklist</h4>
            {st.tasks.map((t, index) => (
              <div key={t.id} className="flex flex-wrap items-end gap-3">
                <TextField
                  label={`Atividade ${index + 1}`}
                  value={t.title}
                  onChange={(title) =>
                    patch(st.id, {
                      tasks: st.tasks.map((x) =>
                        x.id === t.id ? { ...x, title } : x,
                      ),
                    })
                  }
                />
                <Check
                  label={`Atividade ${index + 1} obrigatória`}
                  checked={t.required}
                  onChange={(required) =>
                    patch(st.id, {
                      tasks: st.tasks.map((x) =>
                        x.id === t.id ? { ...x, required } : x,
                      ),
                    })
                  }
                />
                <Button
                  variant="ghost"
                  onClick={() =>
                    patch(st.id, {
                      tasks: st.tasks.filter((x) => x.id !== t.id),
                    })
                  }
                >
                  Remover atividade {index + 1}
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() =>
                patch(st.id, {
                  tasks: [
                    ...st.tasks,
                    { id: uid(), title: "Nova atividade", required: false },
                  ],
                })
              }
            >
              Adicionar atividade
            </Button>
          </div>
        </details>
      ))}
      <Button
        variant="outline"
        onClick={() =>
          change([
            ...rows,
            {
              id: uid(),
              name: "Nova etapa",
              color: "#64748b",
              days: 3,
              fields: [],
              tasks: [],
              ...(admission
                ? { purpose: "normal" as const }
                : { kind: "normal" as const }),
            },
          ])
        }
      >
        Adicionar etapa
      </Button>
    </div>
  );
}
const cardFields = [
  ["city", "Cidade"],
  ["area", "Área"],
  ["experience", "Experiência declarada"],
  ["job", "Vaga"],
  ["tags", "Tags"],
  ["attachments", "Anexos"],
  ["stageTime", "Tempo na etapa"],
  ["totalTime", "Tempo no processo"],
  ["alerts", "Pendências"],
];
export function WorkflowSettings({ state, scope, act }: WorkflowProps) {
  const [tab, setTab] = useState("Kanban central"),
    [config, setConfig] = useState<CentralConfig>(() =>
      structuredClone(state.central!),
    ),
    [contract, setContract] = useState<Contract>("Estágio"),
    [form, setForm] = useState<string>(),
    [preview, setPreview] = useState(false),
    [template, setTemplate] = useState<Template>(),
    [rule, setRule] = useState<Rule>(),
    [days, setDays] = useState(String(state.privacy.days)),
    [policy, setPolicy] = useState(state.privacy.purpose);
  const commit = () =>
    act(
      (s) => savePipeline(s, scope, config),
      "Configurações locais salvas. Etapas ocupadas e histórico preservados.",
    );
  return (
    <div className="space-y-5">
      <Tabs
        label="Configurações do recrutamento"
        items={[
          "Kanban central",
          "Formulários",
          "Cards e tags",
          "Admissão por vínculo",
          "Modelos e instrumentos",
          "Automações",
          "Privacidade e histórico",
        ]}
        value={tab}
        change={setTab}
      />
      {tab === "Kanban central" && (
        <>
          <p className="text-sm text-muted-foreground">
            Etapas opcionais e movimentação livre. A função operacional mantém
            Entrada, curadoria do Banco e admissão independentes do nome e da
            posição. Etapas ocupadas não podem ser excluídas.
          </p>
          <StageEditor
            rows={config.stages}
            change={(rows) =>
              setConfig({ ...config, stages: rows as PipelineStage[] })
            }
          />
          <Button onClick={commit}>Salvar processo</Button>
        </>
      )}
      {tab === "Formulários" && (
        <>
          <p className="text-sm">
            Formulário geral protegido, sem inscrição por vaga.{" "}
            <a
              className="text-primary underline"
              href="/candidatura-demonstrativa"
              target="_blank"
            >
              Abrir demonstração independente
            </a>
          </p>
          <AreaField
            label="Aviso de privacidade do formulário geral"
            value={config.privacyNotice}
            onChange={(privacyNotice) =>
              setConfig({ ...config, privacyNotice })
            }
          />
          <Button onClick={commit}>Salvar aviso</Button>
          {state.forms.map((f) => (
            <article
              key={f.id}
              className="flex flex-wrap justify-between gap-3 rounded-xl border p-4"
            >
              <div>
                <strong>{f.name}</strong>
                <p className="text-xs">
                  Versão {f.version} · {f.fields.length} campos{" "}
                  {f.id === config.formId ? "· formulário de entrada" : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPreview(false);
                    setForm(f.id);
                  }}
                >
                  Editar formulário
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setPreview(true);
                    setForm(f.id);
                  }}
                >
                  Pré-visualizar
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setConfig({ ...config, formId: f.id })}
                >
                  Usar como entrada
                </Button>
              </div>
            </article>
          ))}
          <Button onClick={commit}>Salvar formulário de entrada</Button>
        </>
      )}
      {tab === "Cards e tags" && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {cardFields.map(([id, label]) => (
              <Check
                key={id}
                label={label}
                checked={config.cards.includes(id)}
                onChange={(yes) =>
                  setConfig({
                    ...config,
                    cards: yes
                      ? [...config.cards, id]
                      : config.cards.filter((x) => x !== id),
                  })
                }
              />
            ))}
          </div>
          <AreaField
            label="Tags personalizáveis (uma por linha)"
            value={config.tags.join("\n")}
            onChange={(v) =>
              setConfig({ ...config, tags: v.split("\n").filter(Boolean) })
            }
          />
          <h3 className="font-semibold">Requisitos avulsos padrão do Match</h3>
          <CriteriaEditor
            rows={config.customCriteria}
            change={(customCriteria) =>
              setConfig({ ...config, customCriteria })
            }
          />
          <Button onClick={commit}>Salvar cards, tags e requisitos</Button>
        </>
      )}
      {tab === "Admissão por vínculo" && (
        <>
          <Pick
            label="Configurar vínculo"
            value={contract}
            options={choices(["CLT", "Estágio", "PJ"])}
            onChange={(v) => setContract(v as Contract)}
          />
          <p className="text-sm text-muted-foreground">
            Novas admissões guardam cópia das etapas, documentos e formulários
            vigentes. Alterações futuras não apagam exigências históricas. CLT
            usa acompanhamento externo Flash, sem coleta documental interna.
          </p>
          <StageEditor
            key={contract}
            rows={config.admissionStages[contract]}
            admission
            change={(rows) =>
              setConfig({
                ...config,
                admissionStages: {
                  ...config.admissionStages,
                  [contract]: rows as AdmissionStage[],
                },
              })
            }
          />
          {contract !== "CLT" && (
            <>
              <h3 className="font-semibold">Documentação de {contract}</h3>
              {config.documents[contract].map((d, i) => (
                <div key={d.id} className="space-y-3 rounded-xl border p-4">
                  <TextField
                    label={`Documento ${i + 1}`}
                    value={d.name}
                    onChange={(name) =>
                      setConfig({
                        ...config,
                        documents: {
                          ...config.documents,
                          [contract]: config.documents[contract].map((x) =>
                            x.id === d.id ? { ...x, name } : x,
                          ),
                        },
                      })
                    }
                  />
                  <AreaField
                    label={`Instruções ${i + 1}`}
                    value={d.instructions}
                    onChange={(instructions) =>
                      setConfig({
                        ...config,
                        documents: {
                          ...config.documents,
                          [contract]: config.documents[contract].map((x) =>
                            x.id === d.id ? { ...x, instructions } : x,
                          ),
                        },
                      })
                    }
                  />
                  <Check
                    label={`Documento ${i + 1} obrigatório`}
                    checked={d.required}
                    onChange={(required) =>
                      setConfig({
                        ...config,
                        documents: {
                          ...config.documents,
                          [contract]: config.documents[contract].map((x) =>
                            x.id === d.id ? { ...x, required } : x,
                          ),
                        },
                      })
                    }
                  />
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setConfig({
                        ...config,
                        documents: {
                          ...config.documents,
                          [contract]: config.documents[contract].filter(
                            (x) => x.id !== d.id,
                          ),
                        },
                      })
                    }
                  >
                    Remover documento {i + 1}
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() =>
                  setConfig({
                    ...config,
                    documents: {
                      ...config.documents,
                      [contract]: [
                        ...config.documents[contract],
                        {
                          id: uid(),
                          name: "Novo documento",
                          required: false,
                          instructions: "",
                        },
                      ],
                    },
                  })
                }
              >
                Adicionar documento
              </Button>
              <h3 className="font-semibold">
                Formulário individual de {contract}
              </h3>
              <FieldBuilder
                fields={config.admissionForms[contract].fields}
                change={(fields) =>
                  setConfig({
                    ...config,
                    admissionForms: {
                      ...config.admissionForms,
                      [contract]: {
                        ...config.admissionForms[contract],
                        fields,
                        version: config.admissionForms[contract].version + 1,
                      },
                    },
                  })
                }
              />
            </>
          )}
          <Button onClick={commit}>Salvar configuração de admissão</Button>
        </>
      )}
      {tab === "Modelos e instrumentos" && (
        <>
          <p className="text-sm text-muted-foreground">
            DISC e Temperamentos são instrumentos demonstrativos, sem
            metodologia definitiva ou diagnóstico. Versões já aplicadas
            permanecem preservadas.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {state.templates.map((t) => (
              <article key={t.id} className="space-y-3 rounded-xl border p-4">
                <strong>{t.name}</strong>
                <p className="text-xs">
                  {t.kind} · v{t.version}
                </p>
                <Button
                  variant="outline"
                  onClick={() => setTemplate(structuredClone(t))}
                >
                  Editar modelo
                </Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    setTemplate({
                      ...structuredClone(t),
                      id: uid(),
                      name: t.name + " · cópia",
                    })
                  }
                >
                  Duplicar
                </Button>
              </article>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={() =>
              setTemplate({
                id: uid(),
                name: "Novo modelo",
                kind: "Entrevista",
                body: "",
                questions: [],
                version: 1,
              })
            }
          >
            Novo modelo
          </Button>
        </>
      )}
      {tab === "Automações" && (
        <>
          <p className="text-sm">
            Regras executam somente simulações locais e registram
            rastreabilidade. Nunca enviam mensagens, decidem candidatos ou
            confirmam vínculos.
          </p>
          {state.rules.map((r) => (
            <article
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
            >
              <div>
                <strong>{r.name}</strong>
                <p className="text-xs">
                  {r.trigger} → {r.action} · {r.active ? "Ativa" : "Pausada"}
                </p>
              </div>
              <Button variant="outline" onClick={() => setRule({ ...r })}>
                Editar automação
              </Button>
            </article>
          ))}
          <Button
            onClick={() =>
              setRule({
                id: uid(),
                name: "Nova regra",
                trigger: "Mudança de etapa",
                action: "Gerar notificação local",
                sector: "",
                contract: "",
                active: true,
              })
            }
          >
            Criar automação
          </Button>
          <Events
            events={state.logs.map((l) => ({
              id: l.id,
              at: l.at,
              by: "Automação local",
              text: l.action,
            }))}
          />
        </>
      )}
      {tab === "Privacidade e histórico" && (
        <>
          <TextField
            label="Retenção demonstrativa em dias"
            type="number"
            value={days}
            onChange={setDays}
          />
          <AreaField
            label="Finalidade dos dados fictícios"
            value={policy}
            onChange={setPolicy}
          />
          <Button
            onClick={() =>
              act((s) => privacySettings(s, scope, policy, Number(days)))
            }
          >
            Salvar finalidade e retenção
          </Button>
          <Events events={state.events} />
        </>
      )}
      {form && (
        <SideSheet
          title={
            preview ? "Pré-visualização protegida" : "Editar formulário geral"
          }
          close={() => setForm(undefined)}
        >
          {preview ? (
            <CandidateForm
              form={state.forms.find((f) => f.id === form)!}
              preview
              submit={() => {}}
            />
          ) : (
            <FormEditor
              initial={state.forms.find((f) => f.id === form)!}
              save={(f) => {
                if (act((s) => saveForm(s, scope, f))) setForm(undefined);
              }}
            />
          )}
        </SideSheet>
      )}
      {template && (
        <SideSheet
          title="Modelo configurável"
          close={() => setTemplate(undefined)}
        >
          <div className="space-y-4">
            <TextField
              label="Nome do modelo"
              value={template.name}
              onChange={(name) => setTemplate({ ...template, name })}
            />
            <Pick
              label="Tipo do modelo"
              value={template.kind}
              options={choices([
                "DISC",
                "Temperamentos",
                "Entrevista",
                "Avaliação técnica",
                "Teste prático",
                "Proposta",
                "Mensagem",
                "Motivo de encerramento",
              ])}
              onChange={(v) =>
                setTemplate({ ...template, kind: v as Template["kind"] })
              }
            />
            <AreaField
              label="Conteúdo do modelo"
              value={template.body}
              onChange={(body) => setTemplate({ ...template, body })}
            />
            <AreaField
              label="Perguntas (uma por linha)"
              value={template.questions.join("\n")}
              onChange={(v) =>
                setTemplate({
                  ...template,
                  questions: v.split("\n").filter(Boolean),
                })
              }
            />
            <Button
              onClick={() => {
                if (act((s) => saveTemplate(s, scope, template)))
                  setTemplate(undefined);
              }}
            >
              Salvar modelo versionado
            </Button>
          </div>
        </SideSheet>
      )}
      {rule && (
        <SideSheet title="Automação local" close={() => setRule(undefined)}>
          <div className="space-y-4">
            <TextField
              label="Nome da automação"
              value={rule.name}
              onChange={(name) => setRule({ ...rule, name })}
            />
            <Pick
              label="Gatilho"
              value={rule.trigger}
              options={choices(triggers)}
              onChange={(v) =>
                setRule({ ...rule, trigger: v as Rule["trigger"] })
              }
            />
            <Pick
              label="Ação simulada"
              value={rule.action}
              options={choices(actions)}
              onChange={(v) =>
                setRule({ ...rule, action: v as Rule["action"] })
              }
            />
            <Pick
              label="Etapa de aplicação"
              value={rule.stage ?? ""}
              options={[{ id: "", name: "Todas" }, ...state.central!.stages]}
              onChange={(stage) => setRule({ ...rule, stage })}
            />
            <TextField
              label="Setor (vazio para todos)"
              value={rule.sector}
              onChange={(sector) => setRule({ ...rule, sector })}
            />
            <Pick
              label="Vínculo da regra"
              value={rule.contract}
              options={choices(["", "CLT", "Estágio", "PJ"])}
              onChange={(contract) => setRule({ ...rule, contract })}
            />
            <Check
              label="Automação ativa"
              checked={rule.active}
              onChange={(active) => setRule({ ...rule, active })}
            />
            <Button
              onClick={() => {
                if (act((s) => saveRule(s, scope, rule))) setRule(undefined);
              }}
            >
              Salvar automação
            </Button>
          </div>
        </SideSheet>
      )}
    </div>
  );
}
