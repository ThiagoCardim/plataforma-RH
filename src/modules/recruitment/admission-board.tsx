"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TextField,
  AreaField,
  Pick,
  Check,
  Upload,
} from "../academy/components";
import { Events, Empty } from "../performance/components";
import { FileCard } from "../documents/file-card";
import { type Contract } from "../career/model";
import { type Admission } from "./workflow-types";
import {
  moveAdmission,
  saveAdmission,
  finalizeAdmission,
} from "./workflow-model";
import { CandidateForm, StageField } from "./forms";
import { submitAdmissionInfo } from "./workflow-model";
import { type WorkflowProps, choices, SideSheet } from "./workflow-ui";
export function AdmissionBoard(props: WorkflowProps) {
  const { state, scope, act } = props,
    [contract, setContract] = useState<Contract>("CLT"),
    [id, setId] = useState<string>();
  const x = state.admissions!.find((a) => a.id === id);
  const rows = state.admissions!.filter((a) => a.contract === contract),
    stages = [...state.central!.admissionStages[contract]];
  for (const a of rows)
    for (const st of a.stages)
      if (!stages.some((x) => x.id === st.id) && a.stage === st.id)
        stages.push(st);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Pick
          label="Fluxo de admissão"
          value={contract}
          options={choices(["CLT", "Estágio", "PJ"])}
          onChange={(v) => setContract(v as Contract)}
        />
        <p className="max-w-xl text-xs text-muted-foreground">
          Contratados significa aprovação para contratar. Somente a confirmação
          do RH prepara vínculo local, Base Central e Onboarding.{" "}
          {contract === "CLT"
            ? "CLT: acompanhamento da Flash, sem API ou coleta documental interna."
            : "Documentos e formulários fictícios guardados apenas neste navegador."}
        </p>
      </div>
      <div
        className="ats-board"
        role="region"
        aria-label={`Kanban de admissão ${contract}`}
        tabIndex={0}
      >
        {stages.map((st) => (
          <section
            key={st.id}
            className="ats-column"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain");
              act((s) => moveAdmission(s, scope, id, st.id));
            }}
          >
            <header
              className="ats-column-head"
              style={{ borderTopColor: st.color }}
            >
              <h2>{st.name}</h2>
              <Badge>{rows.filter((a) => a.stage === st.id).length}</Badge>
            </header>
            <div className="space-y-3 p-2">
              {rows
                .filter((a) => a.stage === st.id)
                .map((a) => (
                  <article
                    className="ats-card"
                    key={a.id}
                    draggable={a.state === "Aberta"}
                    onDragStart={(e) =>
                      e.dataTransfer.setData("text/plain", a.id)
                    }
                  >
                    <button
                      className="w-full text-left"
                      onClick={() => setId(a.id)}
                    >
                      <strong>
                        {
                          state.candidates.find((p) => p.id === a.candidate)
                            ?.name
                        }
                      </strong>
                      <p className="mt-2 text-xs">
                        {a.contract} · {a.state}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Responsável: {a.owner} · prazo {a.due}
                      </p>
                      <p className="mt-2 text-xs text-primary">
                        {a.state === "Confirmada"
                          ? "Formalização confirmada"
                          : a.contract === "CLT"
                            ? "Acompanhamento Flash"
                            : `${a.rules.filter((r) => r.required && !a.files[r.id]).length} documentos pendentes`}
                      </p>
                    </button>
                  </article>
                ))}
            </div>
          </section>
        ))}
      </div>
      {!rows.length && (
        <Empty>
          Mova um candidato para Contratados no Processo Seletivo para abrir uma
          admissão.
        </Empty>
      )}
      {x && (
        <SideSheet
          title="Admissão Digital · ficha de formalização"
          close={() => setId(undefined)}
        >
          <AdmissionPanel
            key={x.id + ":" + x.events.length}
            {...props}
            initial={x}
          />
        </SideSheet>
      )}
    </div>
  );
}
export function AdmissionPanel({
  state,
  scope,
  act,
  initial: x,
}: { initial: Admission } & WorkflowProps) {
  const [draft, setDraft] = useState<Admission>(() => structuredClone(x)),
    [confirmed, setConfirmed] = useState(false),
    [authorized, setAuthorized] = useState(["name"]),
    [showForm, setShowForm] = useState(false),
    [copied, setCopied] = useState(false);
  const p = state.candidates.find((p) => p.id === x.candidate)!;
  const patch = (value: Partial<Admission>) => setDraft({ ...draft, ...value });
  return (
    <div className="space-y-5">
      <h3 className="text-2xl font-semibold">{p.name}</h3>
      <Badge>
        {x.contract} · {x.state}
      </Badge>
      <p className="text-xs text-muted-foreground">
        Um cadastro e uma admissão por ciclo. Data e horário são demonstrativos.
        Nenhuma contratação, assinatura, documento ou acesso real é alterado.
      </p>
      {x.state === "Aberta" ? (
        <>
          <Pick
            label="Etapa da admissão"
            value={x.stage}
            options={x.stages}
            onChange={(st) => act((s) => moveAdmission(s, scope, x.id, st))}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Responsável pela admissão"
              value={draft.owner}
              onChange={(owner) => patch({ owner })}
            />
            <TextField
              label="Prazo de admissão"
              type="date"
              value={draft.due}
              onChange={(due) => patch({ due })}
            />
            <TextField
              label="Início contratual confirmado"
              type="date"
              value={draft.start}
              onChange={(start) => patch({ start })}
            />
            <TextField
              label="Valor bruto contratual (R$)"
              type="number"
              value={String(draft.amount / 100)}
              onChange={(v) => patch({ amount: Math.round(Number(v) * 100) })}
            />
          </div>
          <AreaField
            label="Observações e pendências da admissão"
            value={draft.notes}
            onChange={(notes) => patch({ notes })}
          />
          {x.contract === "CLT" ? (
            <div className="space-y-3 rounded-xl border p-4">
              <h4 className="font-semibold">Acompanhamento externo · Flash</h4>
              <TextField
                label="Referência do processo na Flash"
                value={draft.externalRef}
                onChange={(externalRef) => patch({ externalRef })}
              />
              <Check
                label="RH conferiu a confirmação externa da admissão CLT"
                checked={draft.externalConfirmed}
                onChange={(externalConfirmed) => patch({ externalConfirmed })}
              />
              <p className="text-xs text-muted-foreground">
                Sem conexão à API da Flash. Anote datas e pendências no
                acompanhamento.
              </p>
            </div>
          ) : (
            <>
              <TextField
                label="Data da assinatura confirmada"
                type="date"
                value={draft.signedOn}
                onChange={(signedOn) => patch({ signedOn })}
              />
              <h4 className="font-semibold">Documentação {x.contract}</h4>
              {x.rules.map((r) => (
                <div key={r.id} className="space-y-3 rounded-xl border p-4">
                  <strong className="text-sm">
                    {r.name} {r.required ? "· obrigatório" : ""}
                  </strong>
                  <p className="text-xs">{r.instructions}</p>
                  <Upload
                    label={`Anexar ${r.name}`}
                    onFile={(f) =>
                      patch({ files: { ...draft.files, [r.id]: f } })
                    }
                  />
                  {draft.files[r.id] && (
                    <>
                      <FileCard file={draft.files[r.id]} />
                      <Button
                        variant="ghost"
                        onClick={() => {
                          const files = { ...draft.files };
                          delete files[r.id];
                          patch({ files });
                        }}
                      >
                        Remover {r.name}
                      </Button>
                    </>
                  )}
                </div>
              ))}
              <Button variant="outline" onClick={() => setShowForm(!showForm)}>
                Preencher formulário individual demonstrativo
              </Button>
              <Button
                variant="ghost"
                onClick={async () => {
                  await navigator.clipboard.writeText(
                    `${location.origin}/candidatura-demonstrativa?admissao=${encodeURIComponent(x.id)}&token=${encodeURIComponent(x.token)}`,
                  );
                  setCopied(true);
                }}
              >
                {copied
                  ? "Link protegido copiado"
                  : "Copiar link individual protegido"}
              </Button>
              {showForm && (
                <CandidateForm
                  key={x.form.id}
                  form={x.form}
                  submit={(answers, files, consent) => {
                    if (!consent) return;
                    act((s) =>
                      submitAdmissionInfo(
                        s,
                        scope,
                        x.id,
                        x.token,
                        answers,
                        files,
                      ),
                    );
                  }}
                />
              )}
              <p className="text-xs">
                Informações salvas:{" "}
                {Object.entries(x.answers)
                  .map(
                    ([key, value]) =>
                      `${x.form.fields.find((f) => f.id === key)?.label ?? key}: ${value}`,
                  )
                  .join(" · ") || "Nenhuma informação coletada."}
              </p>
            </>
          )}
          {x.stages.map((st) => (
            <details key={st.id} className="rounded-xl border p-3">
              <summary className="text-sm font-medium">
                {st.name} · campos e atividades
              </summary>
              <div className="mt-3 space-y-3">
                {st.fields.map((f) => (
                  <StageField
                    key={f.id}
                    field={f}
                    value={draft.fields[`${st.id}:${f.id}`] ?? ""}
                    change={(v) =>
                      patch({
                        fields: { ...draft.fields, [`${st.id}:${f.id}`]: v },
                      })
                    }
                  />
                ))}
                {st.tasks.map((t) => (
                  <Check
                    key={t.id}
                    label={t.title + (t.required ? " *" : "")}
                    checked={!!draft.checks[`${st.id}:${t.id}`]}
                    onChange={(yes) =>
                      patch({
                        checks: { ...draft.checks, [`${st.id}:${t.id}`]: yes },
                      })
                    }
                  />
                ))}
              </div>
            </details>
          ))}
          <Button onClick={() => act((s) => saveAdmission(s, scope, draft))}>
            Salvar acompanhamento da admissão
          </Button>
          <section className="space-y-3 rounded-xl border border-orange-200 bg-orange-50/40 p-4">
            <h4 className="font-semibold">Confirmação exclusiva do RH</h4>
            <p className="text-xs leading-6">
              Salve o acompanhamento antes de confirmar. Exige
              documentos/formulário e assinatura para Estágio/PJ; referência e
              confirmação da Flash para CLT. Campos e atividades obrigatórios,
              posição, orçamento e vínculo único são conferidos. Apenas dados
              autorizados serão preparados para a Base Central e o Onboarding.
            </p>
            {["name", "email", "phone", "city"].map((key) => (
              <Check
                key={key}
                label={`Autorizar reutilização: ${key}`}
                checked={authorized.includes(key)}
                onChange={(yes) =>
                  setAuthorized(
                    yes
                      ? [...authorized, key]
                      : authorized.filter((f) => f !== key),
                  )
                }
              />
            ))}
            <Check
              label="Confirmo a formalização fictícia revisada pelo RH"
              checked={confirmed}
              onChange={setConfirmed}
            />
            <Button
              disabled={!confirmed}
              onClick={() =>
                act((s) =>
                  finalizeAdmission(s, scope, x.id, confirmed, authorized),
                )
              }
            >
              Confirmar formalização local
            </Button>
          </section>
        </>
      ) : (
        <p className="text-sm">
          {x.state === "Confirmada"
            ? "Contratação confirmada; dados autorizados e vínculo local preparados."
            : "Admissão cancelada; histórico preservado."}
        </p>
      )}
      {x.state === "Confirmada" && (
        <Link className="text-primary underline" href="/onboarding-offboarding">
          Revisar e iniciar Onboarding
        </Link>
      )}
      <Events events={x.events} />
    </div>
  );
}
