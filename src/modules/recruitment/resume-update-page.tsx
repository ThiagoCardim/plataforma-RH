"use client";
import { useState } from "react";
import { type State } from "./model";
import { type Scope } from "../career/model";
import { useRecruitment } from "./store";
import { updateProjection, applyResumeUpdate } from "./resume-model";
import { ResumeProfileForm } from "./resume-components";
import { Notice } from "../performance/components";
import "./recruitment.css";
export function ResumeUpdatePage({
  initial,
  scope,
  request,
  token,
}: {
  initial: State;
  scope: Scope;
  request: string;
  token: string;
}) {
  const local = useRecruitment(initial, scope),
    [sent, setSent] = useState(false);
  let dto: ReturnType<typeof updateProjection> | undefined,
    error = "";
  if (local.ready && !sent) {
    try {
      dto = updateProjection(local.state, scope, request, token);
    } catch (e) {
      error = (e as Error).message;
    }
  }
  return (
    <main className="ats-shell mx-auto min-h-screen max-w-2xl space-y-5 px-4 py-10">
      <header className="flex items-center justify-between border-b pb-5">
        <strong className="text-lg">
          YOUCON <span className="text-primary">PEOPLE</span>
        </strong>
        <span className="text-xs text-muted-foreground">
          Atualização demonstrativa
        </span>
      </header>
      <h1 className="text-2xl font-semibold">Atualize seu currículo</h1>
      <p className="rounded-xl bg-accent p-4 text-xs leading-6">
        Prévia da experiência do candidato, sem criar conta ou acessar
        informações internas do RH. Esta demonstração permanece protegida pela
        sessão RH existente; não há coleta pública real. Use dados e documentos
        fictícios. O link é local, temporário, revogável e de uso único;
        validação definitiva de segurança e expiração exigirá servidor.
      </p>
      <Notice error={local.error || error} notice={local.notice} />
      {!local.ready ? (
        <p role="status">Validando convite demonstrativo…</p>
      ) : sent ? (
        <section className="rounded-xl border border-emerald-200 p-6">
          <h2 className="font-semibold">
            Currículo atualizado no mesmo cadastro
          </h2>
          <p className="mt-3 text-sm">
            As versões anteriores e os históricos foram preservados conforme a
            retenção. Nenhum novo processo foi iniciado. Este convite foi
            utilizado e não pode ser reenviado.
          </p>
        </section>
      ) : dto ? (
        <>
          <p className="text-xs text-muted-foreground">
            Válido até{" "}
            {new Date(dto.expires).toLocaleString("pt-BR", {
              timeZone: "America/Sao_Paulo",
            })}
          </p>
          <ResumeProfileForm
            initial={dto.profile}
            save={(data, consent) => {
              if (
                local.act((s) =>
                  applyResumeUpdate(s, scope, request, token, data, consent),
                )
              )
                setSent(true);
            }}
          />
        </>
      ) : null}
      <footer className="text-xs text-muted-foreground">
        Dados apenas neste navegador e conta, sem sincronização ou envio de
        mensagens.
      </footer>
    </main>
  );
}
