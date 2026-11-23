import { FileText } from "lucide-react";
import type { Attachment } from "./model";
export function FileCard({ file }: { file: Attachment }) {
  const local = file.url.startsWith("blob:");
  const previewable = /^(application\/pdf|image\/(png|jpeg|webp|gif))$/.test(
    file.type,
  );
  const format = file.name.includes(".")
    ? file.name.split(".").pop()?.toUpperCase()
    : file.type || "Arquivo";
  return (
    <div className="rounded-xl border bg-card p-4">
      <FileText size={20} className="mb-2 text-primary" />
      <p className="break-all font-medium">{file.name}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {format} ·{" "}
        {file.size < 1024
          ? `${file.size} B`
          : `${(file.size / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} KB`}{" "}
        · arquivo local
      </p>
      {local && (
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-primary underline">
          {previewable && (
            <a href={file.url} target="_blank" rel="noopener noreferrer">
              Visualizar arquivo
            </a>
          )}
          <a href={file.url} download={file.name}>
            Baixar arquivo
          </a>
        </div>
      )}
    </div>
  );
}
