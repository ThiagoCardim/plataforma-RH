"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TextField, AreaField, Pick } from "../academy/components";
import { FileCard } from "../documents/file-card";
import { type WorkflowProps, choices } from "./workflow-ui";
import { availabilityStates, type AvailabilityStatus } from "./resume-types";
import {
  recordContact,
  closeReminder,
  createUpdateRequests,
  archiveProcesses,
  purgeExpiredRevisions,
} from "./resume-model";
import { startResumeProcess } from "./resume-operations";
import { stageOf } from "./workflow-model";
import { Freshness, TalentStar, UpdateLinks } from "./resume-components";
export function ResumeDetails({
  state,
  scope,
  act,
  id,
}: WorkflowProps & { id: string }) {
  const p = state.candidates.find((p) => p.id === id)!,
    [note, setNote] = useState(""),
    [availability, setAvailability] = useState<AvailabilityStatus>(
      p.availabilityStatus ?? "Disponibilidade desconhecida",
    ),
    [returnOn, setReturnOn] = useState(""),
    [links, setLinks] = useState(false);
  return (
    <section className="space-y-4 rounded-xl border bg-card p-4">
      <header className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">Currículo e relacionamento</h3>
        <div className="flex items-center gap-2">
          <Freshness state={state} candidate={p} />
          <TalentStar state={state} scope={scope} act={act} candidate={p} />
        </div>
      </header>
      <div className="grid gap-3 text-xs sm:grid-cols-3">
        <p>
          Primeiro cadastro
          <br />
          <strong>{p.created}</strong>
        </p>
        <p>
          Última atualização do currículo
          <br />
          <strong>{p.resumeUpdated ?? p.created}</strong>
        </p>
        <p>
          Último contato
          <br />
          <strong>
            {p.lastContact
              ? new Date(p.lastContact).toLocaleString("pt-BR", {
                  timeZone: "America/Sao_Paulo",
                })
              : "Não registrado"}
          </strong>
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        {p.availabilityStatus} · disponibilidade informada:{" "}
        {p.availability || "Não informada"}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => {
            if (act((s) => createUpdateRequests(s, scope, [id])))
              setLinks(true);
          }}
        >
          Solicitar atualização cadastral
        </Button>
        <Button variant="ghost" onClick={() => setLinks(!links)}>
          Consultar convites
        </Button>
      </div>
      {links && (
        <UpdateLinks state={state} scope={scope} act={act} ids={[id]} />
      )}
      <details className="rounded-lg border p-3">
        <summary className="cursor-pointer text-sm font-medium">
          Contatos e lembretes de retorno
        </summary>
        <div className="mt-4 space-y-3">
          <Pick
            label="Disponibilidade profissional atual"
            value={availability}
            options={choices(availabilityStates)}
            onChange={(v) => setAvailability(v as AvailabilityStatus)}
          />
          <AreaField
            label="Observação do contato"
            value={note}
            onChange={setNote}
          />
          <TextField
            label="Lembrete de retorno"
            type="date"
            value={returnOn}
            onChange={setReturnOn}
          />
          <Button
            onClick={() => {
              if (
                act((s) =>
                  recordContact(s, scope, id, note, availability, returnOn),
                )
              )
                setNote("");
            }}
          >
            Registrar contato
          </Button>
          {state
            .resumeContacts!.filter((x) => x.candidate === id)
            .map((x) => (
              <article
                key={x.id}
                className="space-y-2 rounded-lg bg-muted p-3 text-xs"
              >
                <p>
                  {new Date(x.at).toLocaleString("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                  })}{" "}
                  · {x.by}
                </p>
                <p>{x.note}</p>
                <p>
                  {x.availability} · retorno {x.returnOn || "Não agendado"}{" "}
                  {x.done ? "· concluído" : ""}
                </p>
                {x.returnOn && !x.done && (
                  <Button
                    variant="ghost"
                    onClick={() => act((s) => closeReminder(s, scope, x.id))}
                  >
                    Concluir lembrete
                  </Button>
                )}
              </article>
            ))}
        </div>
      </details>
      <details className="rounded-lg border p-3">
        <summary className="cursor-pointer text-sm font-medium">
          Versões cadastrais e currículos anteriores
        </summary>
        <div className="mt-3 space-y-3">
          <p className="text-xs text-muted-foreground">
            Versões preservadas até o prazo de retenção aplicável. Anexos
            somente locais; nenhuma extração automática do conteúdo.
          </p>
          {state
            .resumeHistory!.filter((h) => h.candidate === id)
            .toReversed()
            .map((h) => (
              <article
                key={h.id}
                className="space-y-3 rounded-lg bg-muted/50 p-3 text-xs"
              >
                <strong>
                  Versão {h.version} ·{" "}
                  {new Date(h.at).toLocaleString("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                  })}
                </strong>
                <p>
                  {h.by} · {h.reason} · currículo{" "}
                  {h.resumeUpdated ?? "Data anterior preservada"} · retenção{" "}
                  {h.until}
                </p>
                {h.purged ? (
                  <p>Conteúdo eliminado após o prazo de retenção.</p>
                ) : (
                  <>
                    <p>
                      {h.profile.name} · {h.profile.city} · {h.profile.skills}
                    </p>
                    {h.receivedForm && (
                      <details className="rounded-lg border p-3">
                        <summary className="cursor-pointer">
                          Respostas do formulário recebido · v
                          {h.receivedForm.form.version}
                        </summary>
                        {Object.entries(h.receivedForm.answers).map(
                          ([key, value]) => (
                            <p key={key} className="mt-2">
                              {h.receivedForm!.form.fields.find(
                                (f) => f.id === key,
                              )?.label ?? key}
                              : {value}
                            </p>
                          ),
                        )}
                        {Object.values(h.receivedForm.files).map((file) => (
                          <FileCard key={file.id} file={file} />
                        ))}
                      </details>
                    )}
                    {h.profile.cv && <FileCard file={h.profile.cv} />}
                    {h.profile.portfolio && (
                      <FileCard file={h.profile.portfolio} />
                    )}
                  </>
                )}
              </article>
            ))}
          <Button
            variant="ghost"
            onClick={() => {
              if (
                confirm(
                  "Eliminar somente o conteúdo das versões com retenção vencida, preservando os metadados históricos?",
                )
              )
                act((s) => purgeExpiredRevisions(s, scope));
            }}
          >
            Eliminar versões com retenção vencida
          </Button>
        </div>
      </details>
      <details className="rounded-lg border p-3">
        <summary className="cursor-pointer text-sm font-medium">
          Processos seletivos e arquivamento
        </summary>
        <div className="mt-3 space-y-3">
          {state.applications
            .filter((a) => a.candidate === id)
            .map((a) => (
              <article
                key={a.id}
                className="space-y-2 rounded-lg border p-3 text-xs"
              >
                <p>
                  <strong>{a.jobTitle}</strong> · {a.contract} · {a.created}
                </p>
                <p>
                  {stageOf(state, a.stage)?.name ??
                    a.stages.find((st) => st.id === a.stage)?.name ??
                    "Etapa histórica"}{" "}
                  · {a.status}
                </p>
                <div className="flex flex-wrap gap-2">
                  {a.historical && <Badge>Ciclo anterior preservado</Badge>}
                  {a.archived && <Badge>Arquivado</Badge>}
                  {!a.archived && a.status !== "Ativa" && (
                    <Button
                      variant="ghost"
                      onClick={() =>
                        act((s) =>
                          archiveProcesses(
                            s,
                            scope,
                            [a.id],
                            "Arquivamento manual pelo RH na ficha.",
                          ),
                        )
                      }
                    >
                      Arquivar processo
                    </Button>
                  )}
                  {(a.archived ||
                    a.status === "Encerrada" ||
                    a.status === "Contratada") && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        act((s) =>
                          startResumeProcess(
                            s,
                            scope,
                            id,
                            "Nova oportunidade revisada na ficha do currículo.",
                          ),
                        )
                      }
                    >
                      Reativar para nova oportunidade
                    </Button>
                  )}
                </div>
              </article>
            ))}
        </div>
      </details>
    </section>
  );
}
