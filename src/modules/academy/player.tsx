"use client";
import { useState } from "react";
import { CheckCircle2, Play, FileCheck2, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileCard } from "@/modules/documents/file-card";
import {
  type AcademyState,
  type Enrollment,
  type Block,
  allLessons,
  progress,
  safeUrl,
  activeLicense,
  visibleCourse,
} from "./model";
import { type Scope } from "../career/model";
import { BlockView, AreaField, Upload, hours } from "./components";
import type { Attachment } from "../documents/model";
export function LearningPlayer({
  enrollment: e,
  state,
  scope,
  complete,
  quiz,
  proof,
}: {
  enrollment: Enrollment;
  state: AcademyState;
  scope: Scope;
  complete: (lesson: string) => void;
  quiz: (lesson: string, answers: Record<string, number>) => void;
  proof: (text: string, file?: Attachment) => void;
}) {
  const lessons = allLessons(e.snapshot),
    [selected, setSelected] = useState(
      e.completedLessons.length < lessons.length
        ? (lessons.find((l) => !e.completedLessons.includes(l.id))?.id ??
            lessons[0]?.id)
        : lessons[0]?.id,
    ),
    [answers, setAnswers] = useState<Record<string, number>>({}),
    [text, setText] = useState(e.proof?.text ?? ""),
    [file, setFile] = useState<Attachment | undefined>(e.proof?.file);
  const lesson = lessons.find((l) => l.id === selected) ?? lessons[0],
    attempt = [...e.attempts].reverse().find((a) => a.lesson === lesson?.id),
    external = e.snapshot.kind === "Curso externo",
    practical = e.snapshot.kind === "Atividade prática",
    live = e.snapshot.kind === "Treinamento ao vivo",
    readable = state.courses.some(
      (c) => c.id === e.course && visibleCourse(state, scope, c),
    );
  return (
    <div className="space-y-5">
      <header className="rounded-2xl bg-gradient-to-br from-stone-950 via-stone-900 to-orange-950 p-6 text-white">
        <p className="text-xs uppercase tracking-[.2em] text-orange-200">
          Meu aprendizado · versão {e.version}
        </p>
        <h3 className="mt-4 text-2xl font-semibold">{e.snapshot.title}</h3>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-stone-300">
          <span>{e.state}</span>
          <span>{hours(e.snapshot.minutes)} de carga horária declarada</span>
          <span>{progress(e)}% concluído</span>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-orange-400"
            style={{ width: `${progress(e)}%` }}
          />
        </div>
      </header>
      {!readable ? (
        <p className="rounded-xl bg-accent p-4 text-sm">
          Conteúdo arquivado ou não autorizado atualmente. Seu histórico e suas
          conquistas permanecem disponíveis.
        </p>
      ) : external ? (
        <section className="space-y-4 rounded-2xl border p-5">
          <Badge>Curso externo · validação da gestão</Badge>
          <h4 className="text-lg font-semibold">
            {e.snapshot.external?.platform}
          </h4>
          <p className="text-sm text-muted-foreground">
            Fornecedor: {e.snapshot.external?.vendor}
          </p>
          <p className="whitespace-pre-wrap text-sm leading-7">
            {e.snapshot.external?.instructions}
          </p>
          {safeUrl(e.snapshot.external?.url ?? "") &&
          activeLicense(state, e.course, e.person) ? (
            <a
              href={e.snapshot.external!.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              Abrir plataforma externa demonstrativa
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">
              Abertura indisponível: licença não atribuída ou fora da vigência.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Sem credenciais na Academy e sem integração com a plataforma
            externa. Retorne para enviar certificado ou evidência.
          </p>
        </section>
      ) : (
        <div className="grid gap-5 md:grid-cols-[220px_1fr]">
          <aside className="space-y-4 rounded-xl border bg-muted/25 p-4">
            {e.snapshot.modules.map((m) => (
              <div key={m.id}>
                <h4 className="mb-3 text-sm font-semibold">{m.name}</h4>
                <div className="space-y-2">
                  {m.lessons.map((l) => (
                    <button
                      key={l.id}
                      aria-pressed={l.id === lesson?.id}
                      onClick={() => setSelected(l.id)}
                      className={`flex w-full items-start gap-2 rounded-lg border p-3 text-left text-sm ${l.id === lesson?.id ? "border-orange-300 bg-orange-50" : "bg-card"}`}
                    >
                      {e.completedLessons.includes(l.id) ? (
                        <CheckCircle2
                          size={16}
                          className="shrink-0 text-emerald-700"
                        />
                      ) : (
                        <Play size={15} className="shrink-0 text-primary" />
                      )}
                      {l.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </aside>
          <article className="min-w-0 space-y-5">
            <h4 className="text-xl font-semibold">{lesson?.name}</h4>
            {lesson?.blocks.map((b: Block) =>
              b.kind === "Questionário" ? (
                <fieldset
                  key={b.id}
                  className="space-y-3 rounded-xl border bg-card p-5"
                >
                  <legend className="px-2 text-sm font-semibold">
                    Questionário demonstrativo
                  </legend>
                  <p className="text-sm font-medium leading-6">{b.text}</p>
                  {b.question?.options.map((v, i) => (
                    <label
                      key={i}
                      className="flex items-start gap-2 rounded-lg border p-3 text-sm"
                    >
                      <input
                        type="radio"
                        name={b.id}
                        value={i}
                        checked={answers[b.id] === i}
                        onChange={() => setAnswers({ ...answers, [b.id]: i })}
                        className="mt-1"
                        disabled={e.state === "Concluído"}
                      />
                      {v}
                    </label>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    {b.question?.requireCorrect
                      ? "A resposta correta é necessária para concluir a aula."
                      : "Exercício de aprendizagem, sem nota de corte."}{" "}
                    Correção local demonstrativa; não é prova segura de
                    conhecimento.
                  </p>
                </fieldset>
              ) : (
                <BlockView key={b.id} block={b} />
              ),
            )}
            {lesson?.blocks.some((b) => b.kind === "Questionário") &&
              e.state !== "Concluído" && (
                <Button
                  variant="outline"
                  onClick={() => quiz(lesson.id, answers)}
                >
                  Verificar respostas da aula
                </Button>
              )}
            {attempt && (
              <p role="status" className="rounded-xl bg-violet-50 p-4 text-sm">
                Última tentativa: {attempt.correct}/{attempt.total} respostas
                corretas.{" "}
                {attempt.passed
                  ? "Critérios desta aula atendidos."
                  : "Revise as respostas e tente novamente."}
              </p>
            )}
            {!live && e.state !== "Concluído" && lesson && (
              <Button
                onClick={() => complete(lesson.id)}
                disabled={
                  e.completedLessons.includes(lesson.id) ||
                  e.state === "Aguardando RH"
                }
              >
                Concluir esta aula
              </Button>
            )}
            {live && (
              <p className="rounded-xl bg-accent p-4 text-sm leading-6">
                A participação deste encontro é registrada pela gestão na
                Agenda. Concluir materiais não confirma presença nem emite
                documento oficial.
              </p>
            )}
          </article>
        </div>
      )}
      {(external || practical) && readable && e.state !== "Concluído" && (
        <section className="space-y-4 rounded-2xl border border-orange-200 bg-accent/30 p-5">
          <h4 className="flex items-center gap-2 font-semibold">
            <FileCheck2 size={20} />
            Evidência de conclusão
          </h4>
          <AreaField
            label="Relato da evidência de aprendizagem"
            value={text}
            onChange={setText}
          />
          <Upload
            label="Certificado ou evidência local"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
            onFile={setFile}
          />
          {file && (
            <div>
              <FileCard file={file} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFile(undefined)}
              >
                Remover evidência selecionada
              </Button>
            </div>
          )}
          <Button
            disabled={e.state === "Aguardando RH"}
            onClick={() => proof(text, file)}
          >
            Enviar conclusão para validação
          </Button>
          <p className="text-xs text-muted-foreground">
            A conclusão depende de revisão da gestão. Arquivos ficam somente no
            navegador, sem envio remoto.
          </p>
        </section>
      )}
      {e.review && (
        <section className="rounded-xl border bg-card p-4">
          <h4 className="text-sm font-semibold">Parecer de conclusão</h4>
          <p className="mt-3 text-sm leading-6">{e.review.comment}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {e.review.by} · {new Date(e.review.at).toLocaleString("pt-BR")}
          </p>
        </section>
      )}
      {e.state === "Concluído" && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
          <Medal size={28} />
          <div>
            <p className="font-semibold">
              Aprendizagem concluída na demonstração
            </p>
            <p className="mt-2 text-sm leading-6">
              {e.snapshot.awardMode === "Nenhum documento"
                ? "Este conteúdo foi configurado sem emissão de documento."
                : "Consulte o documento demonstrativo em Minhas Conquistas."}{" "}
              Sem pontos no Hall ou progressão automática de carreira.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
