"use client";
import { Award, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type LearningArtifact } from "./model";
import { hours } from "./components";
const escape = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
export function Certificate({ artifact: a }: { artifact: LearningArtifact }) {
  function download() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="850"><rect width="1200" height="850" fill="#faf9f6"/><rect x="30" y="30" width="1140" height="790" rx="20" fill="none" stroke="${a.template.color}" stroke-width="6"/><g font-family="Arial,sans-serif" text-anchor="middle" fill="#242220"><text x="600" y="130" font-size="24" fill="${a.template.color}">${escape(a.template.title)}</text><text x="600" y="230" font-size="42">${escape(a.mode)}</text><text x="600" y="330" font-size="34">${escape(a.student)}</text><text x="600" y="410" font-size="23">${escape(a.title)}</text><text x="600" y="470" font-size="20">Carga horária declarada: ${escape(hours(a.minutes))}</text><text x="600" y="570" font-size="18">${escape(a.template.signature)}</text><text x="600" y="650" font-size="16">Emitido localmente em ${escape(new Date(a.issuedAt).toLocaleDateString("pt-BR"))}</text><text x="600" y="730" font-size="20" fill="#c84b05">DEMONSTRATIVO — SEM VALIDADE OFICIAL</text></g></svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "youcon-academy-documento-demonstrativo.svg";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="space-y-5">
      <div
        className="academy-certificate relative overflow-hidden rounded-2xl border-4 bg-[#fcfaf5] p-7 text-center sm:p-12"
        style={{ borderColor: a.template.color }}
      >
        <div
          className="absolute right-0 top-0 size-40 rounded-bl-full opacity-10"
          style={{ background: a.template.color }}
        />
        <p
          className="text-sm font-semibold uppercase tracking-[.2em]"
          style={{ color: a.template.color }}
        >
          {a.template.title}
        </p>
        <Award
          className="mx-auto my-6"
          size={56}
          strokeWidth={1.2}
          style={{ color: a.template.color }}
        />
        <h3 className="text-3xl font-semibold">{a.mode}</h3>
        <p className="mt-4 text-sm text-muted-foreground">
          {a.template.subtitle}
        </p>
        <p className="mt-8 text-2xl font-semibold">{a.student}</p>
        <p className="mt-4 text-sm text-muted-foreground">
          concluiu o conteúdo demonstrativo
        </p>
        <p className="mt-3 text-xl font-medium">{a.title}</p>
        <p className="mt-5 text-sm">
          Carga horária de catálogo: {hours(a.minutes)}
        </p>
        <p className="mt-7 border-t pt-5 text-sm">{a.template.signature}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          {new Date(a.issuedAt).toLocaleDateString("pt-BR")} · {a.badge}
        </p>
        <p className="mt-7 text-sm leading-6 text-muted-foreground">
          {a.template.footer}
        </p>
        <p
          className="mt-4 text-sm font-bold uppercase tracking-wider"
          style={{ color: a.template.color }}
        >
          Demonstração local · sem validade oficial
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={download}>
          <Download size={16} />
          Baixar demonstração visual
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer size={16} />
          Imprimir demonstração
        </Button>
      </div>
      <p className="text-xs leading-6 text-muted-foreground">
        Não possui assinatura digital, validação externa ou emissão oficial.
        Conquistas da Academy são independentes do Hall, de salários e
        promoções.
      </p>
    </div>
  );
}
