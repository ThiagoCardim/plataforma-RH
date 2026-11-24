/* eslint-disable @next/next/no-img-element -- Local blob images remain inside the demo. */
"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { X, Plus, GripVertical, FileText, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, Textarea } from "@/components/ui/fields";
import { FileCard } from "@/modules/documents/file-card";
import { safeLink } from "@/modules/documents/model";
import { kinds, type Stage, type ContentBlock } from "./model";
export function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={close}
      className="m-auto max-h-[92dvh] w-[min(960px,96vw)] overflow-y-auto rounded-2xl border bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/40"
    >
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-card px-6 py-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Fechar painel"
          onClick={close}
        >
          <X />
        </Button>
      </header>
      <div className="p-5 md:p-7">{children}</div>
    </dialog>
  );
}
export function Meter({
  value,
  color = "bg-primary",
}: {
  value: number;
  color?: string;
}) {
  return (
    <div
      className="h-1.5 overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progresso"
    >
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
export function StageContents({
  stage,
  editable,
  onChange,
}: {
  stage: Stage;
  editable: boolean;
  onChange: (s: Stage) => void;
}) {
  return (
    <div className="space-y-4">
      {stage.blocks.map((b) => (
        <section key={b.id} className="rounded-xl border bg-card p-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {b.kind}
          </p>
          {b.kind === "Checklist" ? (
            b.text
              .split("\n")
              .filter(Boolean)
              .map((line, i) => (
                <label key={i} className="mb-2 flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    disabled={!editable}
                    checked={stage.checked.includes(`${b.id}-${i}`)}
                    onChange={(e) =>
                      onChange({
                        ...stage,
                        checked: e.target.checked
                          ? [...stage.checked, `${b.id}-${i}`]
                          : stage.checked.filter((id) => id !== `${b.id}-${i}`),
                      })
                    }
                  />
                  {line}
                </label>
              ))
          ) : b.kind === "Formulário" ? (
            b.text
              .split("\n")
              .filter(Boolean)
              .map((question, i) => (
                <label className="mb-3 block text-sm" key={i}>
                  {question}
                  <Input
                    disabled={!editable}
                    value={stage.answers[`${b.id}-${i}`] ?? ""}
                    placeholder="Sua resposta demonstrativa"
                    onChange={(e) =>
                      onChange({
                        ...stage,
                        answers: {
                          ...stage.answers,
                          [`${b.id}-${i}`]: e.target.value,
                        },
                      })
                    }
                  />
                </label>
              ))
          ) : b.kind === "Reunião" ? (
            <div className="space-y-3">
              <p className="flex items-center gap-2 font-medium">
                <CalendarDays size={16} />
                {b.text}
              </p>
              <label className="block text-xs">
                Data e horário combinados
                <Input
                  type="datetime-local"
                  disabled={!editable}
                  value={stage.answers[b.id] ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...stage,
                      answers: { ...stage.answers, [b.id]: e.target.value },
                    })
                  }
                />
              </label>
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-6">{b.text}</p>
          )}
          {b.url?.startsWith("blob:") && b.kind === "Imagem" && (
            <img
              src={b.url}
              alt={b.text || b.fileName || "Imagem demonstrativa"}
              className="mt-3 max-h-72 max-w-full rounded-lg"
            />
          )}
          {b.url?.startsWith("blob:") &&
            b.kind === "Vídeo" &&
            /^(video\/mp4|video\/webm)$/.test(b.mime ?? "") && (
              <video
                src={b.url}
                controls
                className="mt-3 max-h-72 w-full"
                aria-label={b.text || "Vídeo demonstrativo"}
              />
            )}
          {b.url?.startsWith("blob:") && (
            <div className="mt-3">
              <FileCard
                file={{
                  id: b.id,
                  url: b.url,
                  name: b.fileName ?? "Arquivo",
                  type: b.mime ?? "",
                  size: b.size ?? 0,
                }}
              />
            </div>
          )}
          {safeLink(b.url ?? "") && (
            <a
              className="mt-2 inline-block text-sm text-primary underline"
              href={safeLink(b.url ?? "")}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir {b.kind.toLowerCase()}
            </a>
          )}
        </section>
      ))}
    </div>
  );
}
export function StageEditor({
  initial,
  offboarding = false,
  operationalOnly = false,
  administrativeOnly = false,
  save,
  cancel,
}: {
  initial: Stage;
  offboarding?: boolean;
  operationalOnly?: boolean;
  administrativeOnly?: boolean;
  save: (s: Stage) => void;
  cancel: () => void;
}) {
  const [stage, set] = useState(() => structuredClone(initial));
  const [error, setError] = useState("");
  const block = (id: string, patch: Partial<ContentBlock>) =>
    set((s) => ({
      ...s,
      blocks: s.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  const move = (i: number, delta: number) =>
    set((s) => {
      const blocks = [...s.blocks];
      [blocks[i], blocks[i + delta]] = [blocks[i + delta], blocks[i]];
      return { ...s, blocks };
    });
  function file(b: ContentBlock, f?: File) {
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      setError("Use um arquivo fictício de até 10 MB.");
      return;
    }
    if (b.kind === "Imagem" && !/^(image\/(png|jpeg|webp|gif))$/.test(f.type)) {
      setError("Selecione PNG, JPEG, WebP ou GIF.");
      return;
    }
    if (b.kind === "Vídeo" && !/^(video\/(mp4|webm))$/.test(f.type)) {
      setError("Selecione MP4 ou WebM.");
      return;
    }
    setError("");
    const safe =
      /^(application\/pdf|image\/(png|jpeg|webp|gif)|video\/(mp4|webm))$/.test(
        f.type,
      );
    block(b.id, {
      url: URL.createObjectURL(
        new Blob([f], { type: safe ? f.type : "application/octet-stream" }),
      ),
      fileName: f.name,
      mime: f.type,
      size: f.size,
    });
  }
  return (
    <div className="space-y-5">
      <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-3">
        <label className="text-xs sm:col-span-3">
          Nome da etapa
          <Input
            aria-label="Nome da etapa"
            value={stage.name}
            onChange={(e) => set({ ...stage, name: e.target.value })}
          />
        </label>
        <label className="text-xs">
          Responsável
          <Select
            aria-label="Responsável"
            value={stage.owner}
            onChange={(e) =>
              set({ ...stage, owner: e.target.value as Stage["owner"] })
            }
          >
            {(administrativeOnly
              ? ["RH"]
              : operationalOnly
                ? ["Liderança"]
                : offboarding
                  ? ["RH", "Liderança"]
                  : ["RH", "Liderança", "Profissional"]
            ).map((v) => (
              <option key={v}>{v}</option>
            ))}
          </Select>
        </label>
        <label className="text-xs">
          Prazo após início (dias)
          <Input
            aria-label="Prazo da etapa"
            type="number"
            min={0}
            max={730}
            value={stage.days}
            onChange={(e) => set({ ...stage, days: Number(e.target.value) })}
          />
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            disabled={offboarding}
            checked={!offboarding && stage.public}
            onChange={(e) => set({ ...stage, public: e.target.checked })}
          />
          {offboarding
            ? "Conteúdo interno demonstrativo"
            : "Autorizar profissional a acessar"}
        </label>
      </div>
      <section className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 font-semibold">Atividades e requisitos</h3>
        {stage.tasks.map((t, i) => (
          <div key={t.id} className="mb-3 flex flex-wrap items-center gap-2">
            <Input
              className="min-w-40 flex-1"
              aria-label={`Atividade ${i + 1}`}
              value={t.title}
              onChange={(e) =>
                set({
                  ...stage,
                  tasks: stage.tasks.map((x) =>
                    x.id === t.id ? { ...x, title: e.target.value } : x,
                  ),
                })
              }
            />
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={t.required}
                onChange={(e) =>
                  set({
                    ...stage,
                    tasks: stage.tasks.map((x) =>
                      x.id === t.id ? { ...x, required: e.target.checked } : x,
                    ),
                  })
                }
              />
              Obrigatória
            </label>
            <Button
              size="sm"
              variant="ghost"
              aria-label={`Remover atividade ${i + 1}`}
              onClick={() =>
                set({
                  ...stage,
                  tasks: stage.tasks.filter((x) => x.id !== t.id),
                })
              }
            >
              Remover
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            set({
              ...stage,
              tasks: [
                ...stage.tasks,
                {
                  id: crypto.randomUUID(),
                  title: "Nova atividade",
                  required: true,
                  done: false,
                },
              ],
            })
          }
        >
          <Plus />
          Atividade
        </Button>
      </section>
      <section className="space-y-3">
        <h3 className="font-semibold">Conteúdo livre da etapa</h3>
        <div className="flex flex-wrap gap-2">
          {kinds.map((kind) => (
            <Button
              size="sm"
              variant="outline"
              key={kind}
              onClick={() =>
                set({
                  ...stage,
                  blocks: [
                    ...stage.blocks,
                    { id: crypto.randomUUID(), kind, text: "" },
                  ],
                })
              }
            >
              + {kind}
            </Button>
          ))}
        </div>
        {stage.blocks.map((b, i) => (
          <div className="space-y-3 rounded-xl border bg-card p-4" key={b.id}>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-xs font-semibold">
                <GripVertical size={14} />
                {b.kind}
              </span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Subir conteúdo ${i + 1}`}
                  disabled={!i}
                  onClick={() => move(i, -1)}
                >
                  ↑
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Descer conteúdo ${i + 1}`}
                  disabled={i === stage.blocks.length - 1}
                  onClick={() => move(i, 1)}
                >
                  ↓
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    set({
                      ...stage,
                      blocks: stage.blocks.filter((x) => x.id !== b.id),
                    })
                  }
                >
                  Remover
                </Button>
              </div>
            </div>
            <label className="block text-xs">
              {b.kind === "Checklist"
                ? "Um item por linha"
                : b.kind === "Formulário"
                  ? "Uma pergunta por linha"
                  : "Conteúdo / descrição"}
              <Textarea
                aria-label={`Conteúdo ${i + 1}`}
                value={b.text}
                onChange={(e) => block(b.id, { text: e.target.value })}
              />
            </label>
            {["Vídeo", "Apresentação", "Link", "Reunião"].includes(b.kind) && (
              <label className="block text-xs">
                Link (opcional)
                <Input
                  aria-label={`Link do conteúdo ${i + 1}`}
                  value={b.url?.startsWith("blob:") ? "" : (b.url ?? "")}
                  onChange={(e) => block(b.id, { url: e.target.value })}
                  placeholder="https://…"
                />
              </label>
            )}
            {["Imagem", "Arquivo", "Vídeo", "Apresentação"].includes(
              b.kind,
            ) && (
              <div className="rounded-lg border border-dashed p-3">
                <label className="block text-xs">
                  {b.fileName ? "Substituir arquivo" : "Selecionar arquivo"} ·
                  até 10 MB
                  <input
                    className="mt-2 block w-full text-xs"
                    type="file"
                    aria-label={`Arquivo do conteúdo ${i + 1}`}
                    onChange={(e) => {
                      file(b, e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
                {b.fileName && (
                  <div className="mt-3">
                    <p className="text-sm">
                      <FileText className="inline" size={14} /> {b.fileName}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        block(b.id, {
                          url: undefined,
                          fileName: undefined,
                          mime: undefined,
                          size: undefined,
                        })
                      }
                    >
                      Remover arquivo
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </section>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <footer className="flex justify-end gap-2">
        <Button variant="outline" onClick={cancel}>
          Cancelar edição
        </Button>
        <Button
          onClick={() => {
            if (
              !stage.name.trim() ||
              !Number.isFinite(stage.days) ||
              stage.days < 0 ||
              stage.days > 730 ||
              stage.tasks.some((t) => !t.title.trim())
            ) {
              setError(
                "Informe o nome, atividades e um prazo válido entre 0 e 730 dias.",
              );
              return;
            }
            save({
              ...stage,
              owner: administrativeOnly
                ? "RH"
                : operationalOnly
                  ? "Liderança"
                  : stage.owner,
              public: offboarding ? false : stage.public,
            });
          }}
        >
          Salvar etapa
        </Button>
      </footer>
    </div>
  );
}
