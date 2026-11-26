"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { TextField, Pick, Check, Reorder } from "../academy/components";
import { Tabs, Notice } from "../performance/components";
import { FieldBuilder, FormEditor } from "./forms";
import { saveForm } from "./model";
import { SideSheet, type WorkflowProps } from "./workflow-ui";
import { type PipelineStage } from "./workflow-types";
import {
  selectionMappings,
  defaultSelectionConfig,
  selectionConfig,
  saveSelectionConfig,
  saveSelectionPhase,
  reorderSelectionPhase,
  deleteSelectionPhase,
  newSelectionPhase,
} from "./selection-model";
export function SelectionSettings(
  props: WorkflowProps & { close: () => void; phase?: string },
) {
  const { state, scope, act, close } = props;
  const [tab, setTab] = useState("Fases"),
    [phase, setPhase] = useState<PipelineStage | undefined>(() =>
      props.phase
        ? structuredClone(
            state.central!.stages.find((s) => s.id === props.phase),
          )
        : undefined,
    ),
    [deleting, setDeleting] = useState(""),
    [destination, setDestination] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [config, setConfig] = useState(() =>
      structuredClone(selectionConfig(state)),
    ),
    [cards, setCards] = useState(state.central!.cards);
  const form = state.forms.find((f) => f.id === state.central!.formId)!;
  const deleted = state.central!.stages.find((s) => s.id === deleting);
  const editorRef = useRef<HTMLElement>(null);
  useEffect(() => {
    editorRef.current?.scrollIntoView({ block: "nearest" });
    editorRef.current?.querySelector<HTMLElement>("input,select")?.focus();
  }, [phase?.id, deleting, tab]);
  return (
    <SideSheet title="Configurar Kanban" close={close}>
      <div className="space-y-5">
        <Notice error={props.error ?? ""} notice={props.notice ?? ""} />
        <Tabs
          label="Configuração do Kanban"
          items={[
            "Fases",
            "Aparência dos cards",
            "Formulário de currículos",
            "Campos da ficha",
          ]}
          value={tab}
          change={setTab}
        />
        {tab === "Fases" && (
          <>
            <p className="text-sm text-muted-foreground">
              Altere a organização visual sem apagar fichas, históricos ou
              automações. A exclusão transfere também referências de ciclos
              arquivados.
            </p>
            {state.central!.stages.map((st, i) => (
              <div key={st.id} className="space-y-3 rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: st.color }}
                  />
                  <strong className="flex-1">{st.name}</strong>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPhase(structuredClone(st));
                      setDeleting("");
                    }}
                  >
                    Editar fase
                  </Button>
                </div>
                <Reorder
                  name={`fase ${st.name}`}
                  first={!i}
                  last={i === state.central!.stages.length - 1}
                  up={() =>
                    act((s) => reorderSelectionPhase(s, scope, st.id, -1))
                  }
                  down={() =>
                    act((s) => reorderSelectionPhase(s, scope, st.id, 1))
                  }
                  remove={() => {
                    setDeleting(st.id);
                    setPhase(undefined);
                    setDestination("");
                    setConfirmed(false);
                  }}
                />
              </div>
            ))}
            <Button
              onClick={() => {
                setPhase(newSelectionPhase());
                setDeleting("");
              }}
            >
              Adicionar fase
            </Button>
            {phase && (
              <section
                className="space-y-4 rounded-xl border border-primary p-4"
                ref={editorRef}
                aria-label="Editar fase"
              >
                <TextField
                  label="Nome da fase"
                  value={phase.name}
                  onChange={(name) => setPhase({ ...phase, name })}
                />
                <TextField
                  label="Cor da fase"
                  type="color"
                  value={phase.color}
                  onChange={(color) => setPhase({ ...phase, color })}
                />
                <TextField
                  label="Prazo de acompanhamento (dias)"
                  type="number"
                  min="0"
                  value={phase.days}
                  onChange={(v) => setPhase({ ...phase, days: Number(v) })}
                />
                <FieldBuilder
                  fields={phase.fields}
                  change={(fields) => setPhase({ ...phase, fields })}
                  stageFields
                />
                <Button
                  onClick={() => {
                    if (act((s) => saveSelectionPhase(s, scope, phase)))
                      setPhase(undefined);
                  }}
                >
                  Salvar fase
                </Button>
              </section>
            )}
            {deleted && (
              <section
                className="space-y-4 rounded-xl border border-destructive p-4"
                ref={editorRef}
                aria-label="Excluir fase"
              >
                <h3 className="font-semibold">Excluir {deleted.name}</h3>
                <p className="text-sm">
                  {
                    state.applications.filter((a) => a.stage === deleted.id)
                      .length
                  }{" "}
                  cards e referências serão transferidos. Se a fase exerce
                  função de entrada, contratação ou recusa, a fase de destino
                  herdará essa função. Automações serão redirecionadas sem
                  execução retroativa.
                </p>
                <Pick
                  label="Transferir cards para"
                  value={destination}
                  onChange={setDestination}
                  options={[
                    { id: "", name: "Escolha outra fase" },
                    ...state.central!.stages.filter(
                      (s) =>
                        s.id !== deleted.id &&
                        (!["entry", "hired", "declined", "bank"].includes(
                          deleted.kind,
                        ) ||
                          ["normal", "qualified", deleted.kind].includes(
                            s.kind,
                          )),
                    ),
                  ]}
                />
                <Check
                  label="Confirmo a transferência e a exclusão da fase"
                  checked={confirmed}
                  onChange={setConfirmed}
                />
                <Button
                  disabled={!confirmed || !destination}
                  onClick={() => {
                    if (
                      act((s) =>
                        deleteSelectionPhase(
                          s,
                          scope,
                          deleted.id,
                          destination,
                          confirmed,
                        ),
                      )
                    )
                      setDeleting("");
                  }}
                >
                  Transferir e excluir fase
                </Button>
              </section>
            )}
          </>
        )}
        {tab === "Aparência dos cards" && (
          <>
            <TextField
              label="Cor padrão dos cards"
              type="color"
              value={config.cardColor}
              onChange={(cardColor) => setConfig({ ...config, cardColor })}
            />
            <p className="text-sm">
              A cor individual pode ser alterada ao editar o candidato.
            </p>
            {[
              ["city", "Localização e vínculo"],
              ["area", "Setor"],
              ["experience", "Experiência"],
              ["job", "Vaga"],
              ["tags", "Etiquetas"],
              ["attachments", "Anexos"],
              ["stageTime", "Tempo na fase"],
              ["totalTime", "Tempo no processo"],
              ["alerts", "Alertas"],
              ...config.profileFields
                .filter((f) => !f.mapping)
                .map((f) => ["profile:" + f.id, f.label]),
            ].map(([id, label]) => (
              <Check
                key={id}
                label={label}
                checked={cards.includes(id)}
                onChange={(yes) =>
                  setCards(yes ? [...cards, id] : cards.filter((k) => k !== id))
                }
              />
            ))}
            <Button
              onClick={() =>
                act((s) => saveSelectionConfig(s, scope, config, cards))
              }
            >
              Salvar aparência
            </Button>
          </>
        )}
        {tab === "Formulário de currículos" && (
          <>
            <p className="text-sm">
              Somente novos envios utilizam a nova versão. Respostas e
              formulários anteriores permanecem preservados.
            </p>
            <FormEditor
              initial={form}
              save={(f) => act((s) => saveForm(s, scope, f))}
            />
          </>
        )}
        {tab === "Campos da ficha" && (
          <>
            <p className="text-sm">
              Personalize os dados de cadastro. Mantenha nome e e-mail
              obrigatórios. Remover uma definição não apaga valores anteriores.
              Anexos permanecem na aba Currículo e evidências.
            </p>
            <FieldBuilder
              mappingOptions={[
                { id: "", name: "Resposta adicional" },
                ...selectionMappings.map((id) => ({
                  id,
                  name: defaultSelectionConfig().profileFields.find(
                    (f) => f.mapping === id,
                  )!.label,
                })),
              ]}
              fields={config.profileFields}
              change={(profileFields) =>
                setConfig({ ...config, profileFields })
              }
              stageFields
            />
            <Button
              onClick={() =>
                act((s) => saveSelectionConfig(s, scope, config, cards))
              }
            >
              Salvar campos da ficha
            </Button>
          </>
        )}
      </div>
    </SideSheet>
  );
}
