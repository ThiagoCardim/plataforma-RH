"use client";
import Image from "next/image";
import {
  BookOpen,
  Layers,
  Play,
  Compass,
  Sparkles,
  Link2,
  ArrowUp,
  ArrowDown,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, Textarea } from "@/components/ui/fields";
import { Badge } from "@/components/ui/badge";
import { FileCard } from "@/modules/documents/file-card";
import { type Attachment } from "@/modules/documents/model";
import {
  type CourseData,
  type Cover as CoverType,
  type Block,
  localUrl,
  safeUrl,
} from "./model";
export const sectors = [
  { id: "architecture", name: "Arquitetura" },
  { id: "engineering", name: "Engenharia" },
  { id: "approval", name: "Aprovação" },
  { id: "interiors", name: "Interiores" },
  { id: "revenue", name: "Revenue" },
  { id: "operations", name: "Operações" },
];
export const sectorName = (id: string) =>
  sectors.find((s) => s.id === id)?.name ?? id;
export const jobName = (id: string) =>
  (
    ({
      base1: "Assistente",
      base2: "Analista",
      tech1: "Especialista",
      tech2: "Referência técnica",
      lead1: "Coordenação",
      lead2: "Gestão",
    }) as Record<string, string>
  )[id.split("-").at(-1) ?? ""] ?? "Função cadastrada";
export const hours = (minutes: number) =>
  `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(minutes / 60)} h`;
export const dt = (date: string) =>
  new Date(date + "T12:00:00Z").toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "short",
  });
const icons = {
  book: BookOpen,
  layers: Layers,
  play: Play,
  compass: Compass,
  sparkles: Sparkles,
};
const themes = {
  orange: "from-orange-600 via-orange-800 to-stone-950",
  ink: "from-stone-700 via-stone-900 to-black",
  sand: "from-[#b08054] via-[#77583e] to-stone-950",
  blue: "from-slate-500 via-slate-700 to-stone-950",
  green: "from-emerald-700 via-emerald-950 to-stone-950",
};
export function Cover({
  cover,
  title,
  large = false,
}: {
  cover: CoverType;
  title: string;
  large?: boolean;
}) {
  const Icon = icons[cover.icon] ?? BookOpen;
  return (
    <div
      className={`relative isolate overflow-hidden bg-gradient-to-br ${themes[cover.theme] ?? themes.orange} ${large ? "min-h-72 rounded-3xl" : "aspect-[16/9] rounded-xl"}`}
    >
      {cover.image && localUrl(cover.image) ? (
        <Image
          unoptimized
          src={cover.image}
          width={1200}
          height={675}
          alt={`Capa de ${title}`}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <>
          <div className="absolute -right-8 -top-12 size-64 rounded-full border-[35px] border-white/5" />
          <div
            className="absolute bottom-0 left-0 h-40 w-full opacity-10"
            style={{
              backgroundImage:
                "repeating-linear-gradient(125deg,transparent,transparent 18px,#fff 19px,transparent 20px)",
            }}
          />
          <Icon
            className="absolute right-7 top-1/2 -translate-y-1/2 text-white/65"
            size={large ? 110 : 68}
            strokeWidth={1}
          />
        </>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute left-5 top-4 flex items-center gap-2 text-xs font-semibold tracking-[.15em] text-white/90">
        <BookOpen size={14} />
        YOUCON ACADEMY
      </div>
      <p
        className={`absolute bottom-5 left-5 right-20 font-semibold leading-tight text-white ${large ? "text-3xl" : "text-lg"}`}
      >
        {title}
      </p>
    </div>
  );
}
export function TextField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  min,
  step,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  min?: string;
  step?: string;
}) {
  return (
    <label className="block text-sm">
      {label}
      <Input
        aria-label={label}
        type={type}
        value={value}
        min={min}
        step={step}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
export function AreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-sm">
      {label}
      <Textarea
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
export function Pick({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; name: string }[];
}) {
  return (
    <label className="block text-sm">
      {label}
      <Select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name}
          </option>
        ))}
      </Select>
    </label>
  );
}
export function Check({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-start gap-2 text-sm leading-6">
      <input
        aria-label={label}
        type="checkbox"
        className="mt-1"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
export function Upload({
  label,
  accept,
  onFile,
  limit = 10,
}: {
  label: string;
  accept?: string;
  onFile: (f: Attachment) => void;
  limit?: number;
}) {
  return (
    <label className="block text-sm">
      {label}
      <Input
        aria-label={label}
        type="file"
        accept={accept}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (
            accept &&
            !accept.split(",").some((rule) => {
              const kind = rule.trim();
              return kind.startsWith(".")
                ? f.name.toLowerCase().endsWith(kind.toLowerCase())
                : kind.endsWith("/*")
                  ? f.type.startsWith(kind.slice(0, -1))
                  : f.type === kind;
            })
          ) {
            e.target.setCustomValidity("Formato incompatível com este bloco.");
            e.target.reportValidity();
            return;
          }
          if (f.size > limit * 1024 * 1024) {
            e.target.setCustomValidity(`Limite demonstrativo de ${limit} MB.`);
            e.target.reportValidity();
            return;
          }
          e.target.setCustomValidity("");
          const safe =
            /^(image\/(png|jpeg|webp|gif)|video\/(webm|mp4)|application\/pdf)$/.test(
              f.type,
            );
          onFile({
            id: crypto.randomUUID(),
            name: f.name,
            size: f.size,
            type: f.type,
            url: URL.createObjectURL(
              new Blob([f], {
                type: safe ? f.type : "application/octet-stream",
              }),
            ),
          });
          e.target.value = "";
        }}
      />
    </label>
  );
}
export function BlockView({ block }: { block: Block }) {
  const url = block.file?.url ?? block.url ?? "";
  if (block.kind === "Vídeo")
    return (
      <section className="space-y-3">
        <div className="overflow-hidden rounded-2xl bg-black">
          {localUrl(url) ? (
            <video
              className="aspect-video w-full"
              controls
              preload="metadata"
              src={url}
              aria-label="Vídeo da aula"
            >
              {url === "/demo/academy/intro.webm" && (
                <track
                  kind="captions"
                  src="/demo/academy/intro.vtt"
                  srcLang="pt-BR"
                  label="Português · demonstração"
                />
              )}
            </video>
          ) : safeUrl(url) ? (
            <a
              className="flex min-h-48 items-center justify-center gap-3 text-sm font-medium text-orange-200 underline"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Play />
              Abrir vídeo externo autorizado
            </a>
          ) : (
            <p className="p-8 text-sm text-stone-300">
              Adicione vídeo local ou link válido no editor.
            </p>
          )}
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{block.text}</p>
      </section>
    );
  if (block.kind === "Imagem")
    return (
      <figure>
        {localUrl(url) ? (
          <Image
            unoptimized
            src={url}
            width={1000}
            height={650}
            alt={block.text || "Imagem de aprendizagem"}
            className="max-h-96 w-auto max-w-full rounded-2xl object-contain"
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Imagem demonstrativa ainda não adicionada.
          </p>
        )}
        <figcaption className="mt-2 text-sm text-muted-foreground">
          {block.text}
        </figcaption>
      </figure>
    );
  if (["Arquivo", "Apresentação"].includes(block.kind))
    return (
      <div className="space-y-2">
        {block.file ? (
          <FileCard file={block.file} />
        ) : safeUrl(url) ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary underline"
          >
            {block.text || "Abrir material"}
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">
            Inclua um material no editor.
          </p>
        )}
        <p className="text-sm text-muted-foreground">{block.text}</p>
      </div>
    );
  if (block.kind === "Link")
    return safeUrl(url) ? (
      <a
        className="flex items-center gap-2 rounded-xl border bg-card p-4 text-sm text-primary underline"
        target="_blank"
        rel="noopener noreferrer"
        href={url}
      >
        <Link2 size={18} />
        {block.text || url}
      </a>
    ) : (
      <p className="text-sm text-muted-foreground">Link não configurado.</p>
    );
  return <p className="whitespace-pre-wrap text-sm leading-8">{block.text}</p>;
}
export function Reorder({
  name,
  up,
  down,
  remove,
  first,
  last,
}: {
  name: string;
  up: () => void;
  down: () => void;
  remove: () => void;
  first: boolean;
  last: boolean;
}) {
  return (
    <div className="flex gap-1">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={first}
        aria-label={`Subir ${name}`}
        onClick={up}
      >
        <ArrowUp size={15} />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={last}
        aria-label={`Descer ${name}`}
        onClick={down}
      >
        <ArrowDown size={15} />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        aria-label={`Remover ${name}`}
        onClick={remove}
      >
        <Trash2 size={15} />
      </Button>
    </div>
  );
}
export function CourseCard({
  data,
  onOpen,
  progressValue,
  extra,
}: {
  data: CourseData;
  onOpen: () => void;
  progressValue?: number;
  extra?: string;
}) {
  return (
    <button
      onClick={onOpen}
      className="group min-w-0 rounded-2xl border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-orange-500 motion-reduce:transform-none"
    >
      <Cover cover={data.cover} title={data.title} />
      <div className="p-2 pt-4">
        <div className="flex flex-wrap gap-2">
          <Badge>{data.kind}</Badge>
          <span className="text-xs text-muted-foreground">
            {hours(data.minutes)}
          </span>
        </div>
        <h3 className="mt-3 text-lg font-semibold leading-snug">
          {data.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
          {data.description}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          {data.instructor} · {data.difficulty}
        </p>
        {progressValue !== undefined && (
          <div className="mt-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-orange-500"
                style={{ width: `${progressValue}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {progressValue}% concluído
            </p>
          </div>
        )}
        {extra && <p className="mt-3 text-xs text-primary">{extra}</p>}
      </div>
    </button>
  );
}
export const move = <T,>(list: T[], index: number, by: number) => {
  const items = [...list];
  if (index + by < 0 || index + by >= items.length) return items;
  [items[index], items[index + by]] = [items[index + by], items[index]];
  return items;
};
