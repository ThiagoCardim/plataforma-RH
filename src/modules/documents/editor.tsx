/* eslint-disable @next/next/no-img-element -- In-memory blob previews cannot use the image optimizer. */
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, Textarea } from "@/components/ui/fields";
import {
  type Content,
  type Block,
  statuses,
  audiences,
  contentBlocks,
} from "./model";
import { FileCard } from "./file-card";
import { Body } from "./body";
import { useDocuments } from "./store";
export function DocumentEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: Content;
  onSave: (data: Content) => void;
  onCancel: () => void;
}) {
  const [data, setData] = useState<Content>(() => ({
    ...structuredClone(initial),
    blocks: structuredClone(contentBlocks(initial)),
    attachments: [],
  }));
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const { track } = useDocuments();
  const update = (patch: Partial<Content>) =>
    setData((old) => ({ ...old, ...patch }));
  function block(id: string, patch: Partial<Block>) {
    update({
      blocks: data.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    });
  }
  function files(list: FileList | null, id: string, image = false) {
    const file = list?.[0];
    if (!file) return;
    if (
      file.size > 10 * 1024 * 1024 ||
      (image && !/\.(png|jpe?g|webp|gif)$/i.test(file.name))
    ) {
      setError(
        image ? "Use imagens de até 10 MB." : "Use arquivos de até 10 MB.",
      );
      return;
    }
    setError("");
    const previewable = /^(application\/pdf|image\/(png|jpeg|webp|gif))$/.test(
      file.type,
    );
    const url = URL.createObjectURL(
      new Blob([file], {
        type: previewable ? file.type : "application/octet-stream",
      }),
    );
    track(url);
    block(
      id,
      image
        ? { url, text: file.name }
        : {
            file: {
              id: crypto.randomUUID(),
              name: file.name,
              size: file.size,
              type: file.type,
              url,
            },
          },
    );
  }
  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!data.title.trim() || !data.audience.length) {
          setError("Informe título e pelo menos um público.");
          return;
        }
        onSave(data);
      }}
    >
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-4 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <div className="grid gap-5 rounded-xl border bg-card p-5 sm:grid-cols-2">
        <label className="text-xs font-semibold sm:col-span-2">
          Título
          <Input
            value={data.title}
            required
            maxLength={160}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="Nome do documento"
          />
        </label>
        <label className="text-xs font-semibold">
          Categoria
          <Input
            required
            value={data.category}
            maxLength={80}
            onChange={(e) => update({ category: e.target.value })}
          />
        </label>
        <label className="text-xs font-semibold">
          Status
          <Select
            aria-label="Status"
            value={data.status}
            onChange={(e) =>
              update({ status: e.target.value as Content["status"] })
            }
          >
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </label>
        <fieldset>
          <legend className="mb-2 text-xs font-semibold">
            Público destinado
          </legend>
          <div className="flex flex-wrap gap-4">
            {audiences.map((a) => (
              <label key={a} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={data.audience.includes(a)}
                  onChange={(e) =>
                    update({
                      audience: e.target.checked
                        ? [...data.audience, a]
                        : data.audience.filter((v) => v !== a),
                    })
                  }
                />
                {a}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="text-xs font-semibold">
          Etiquetas (separadas por vírgula)
          <Input
            value={data.tags.join(", ")}
            maxLength={200}
            onChange={(e) =>
              update({ tags: e.target.value.split(",").map((t) => t.trim()) })
            }
            placeholder="CLT, Estágio, PJ, Segurança…"
          />
        </label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={data.requireRead}
            onChange={(e) => update({ requireRead: e.target.checked })}
          />
          Exigir confirmação de leitura
        </label>
      </div>
      <section className="rounded-xl border bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="section-title">Conteúdo do documento</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreview(!preview)}
          >
            {preview ? "Voltar ao editor" : "Pré-visualizar conteúdo"}
          </Button>
        </div>
        {preview && (
          <div className="mb-5 rounded-xl border p-6">
            <Body blocks={data.blocks} />
          </div>
        )}
        <p className="mb-4 text-xs text-muted-foreground">
          Organize blocos de conteúdo. Em tabelas, separe colunas por | e linhas
          com Enter.
        </p>
        <div className="mb-5 flex flex-wrap gap-2">
          {(
            [
              ["title", "Título"],
              ["text", "Texto"],
              ["list", "Lista"],
              ["table", "Tabela"],
              ["image", "Imagem"],
              ["link", "Link"],
              ["file", "Arquivo"],
            ] as const
          ).map(([type, label]) => (
            <Button
              key={type}
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                update({
                  blocks: [
                    ...data.blocks,
                    { id: crypto.randomUUID(), type, text: "" },
                  ],
                })
              }
            >
              + {label}
            </Button>
          ))}
        </div>
        <div className="space-y-4">
          {data.blocks.map((b, i) => (
            <div key={b.id} className="rounded-lg border bg-background p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium">
                  Bloco {i + 1} ·{" "}
                  {
                    (
                      {
                        title: "Título",
                        text: "Texto",
                        list: "Lista",
                        table: "Tabela",
                        image: "Imagem",
                        link: "Link",
                        file: "Arquivo",
                      } as const
                    )[b.type]
                  }
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    disabled={!i}
                    aria-label={`Subir bloco ${i + 1}`}
                    onClick={() => {
                      const blocks = [...data.blocks];
                      [blocks[i - 1], blocks[i]] = [blocks[i], blocks[i - 1]];
                      update({ blocks });
                    }}
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={i === data.blocks.length - 1}
                    aria-label={`Descer bloco ${i + 1}`}
                    onClick={() => {
                      const blocks = [...data.blocks];
                      [blocks[i], blocks[i + 1]] = [blocks[i + 1], blocks[i]];
                      update({ blocks });
                    }}
                  >
                    ↓
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`Remover bloco ${i + 1}`}
                    onClick={() =>
                      update({
                        blocks: data.blocks.filter((x) => x.id !== b.id),
                      })
                    }
                  >
                    Remover
                  </Button>
                </div>
              </div>
              {b.type !== "file" && (
                <label className="text-xs">
                  {b.type === "image" ? "Descrição da imagem" : "Conteúdo"}
                  <Textarea
                    aria-label={
                      b.type === "image" ? "Descrição da imagem" : "Conteúdo"
                    }
                    value={b.text}
                    maxLength={20000}
                    className={
                      b.type === "title" ? "text-xl font-semibold" : ""
                    }
                    onChange={(e) => block(b.id, { text: e.target.value })}
                  />
                </label>
              )}
              {b.type === "file" && (
                <div className="space-y-3">
                  {b.file && <FileCard file={b.file} />}
                  <label className="block text-xs">
                    {b.file ? "Substituir arquivo" : "Selecionar arquivo"} · até
                    10 MB
                    <input
                      type="file"
                      aria-label={
                        b.file ? "Substituir arquivo" : "Selecionar arquivo"
                      }
                      className="mt-2 block w-full text-xs"
                      onChange={(e) => {
                        files(e.target.files, b.id);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {b.file && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => block(b.id, { file: undefined })}
                    >
                      Remover arquivo
                    </Button>
                  )}
                </div>
              )}
              {b.type === "link" && (
                <label className="mt-3 block text-xs">
                  Endereço do link
                  <Input
                    type="url"
                    value={b.url ?? ""}
                    onChange={(e) => block(b.id, { url: e.target.value })}
                    placeholder="https://…"
                  />
                </label>
              )}
              {b.type === "image" && (
                <>
                  <label className="mt-3 block text-xs">
                    Selecionar imagem
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={(e) => {
                        files(e.target.files, b.id, true);
                        e.target.value = "";
                      }}
                      className="mt-2 block w-full text-xs"
                    />
                  </label>
                  {b.url && (
                    <img
                      src={b.url}
                      alt={b.text}
                      className="mt-3 max-h-48 rounded-lg"
                    />
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </section>
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (window.confirm("Descartar este preenchimento?")) onCancel();
          }}
        >
          Cancelar
        </Button>
        <Button type="submit">
          {data.status === "Ativa" ? "Simular publicação" : "Salvar simulação"}
        </Button>
      </div>
    </form>
  );
}
