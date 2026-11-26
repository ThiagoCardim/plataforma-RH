"use client";
import { useState, useEffect } from "react";
import { Star, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TextField,
  AreaField,
  Pick,
  Check,
  Upload,
} from "../academy/components";
import { FileCard } from "../documents/file-card";
import { type ResumeProfile, availabilityStates } from "./resume-types";
import { type Candidate } from "./model";
import { type WorkflowProps, choices } from "./workflow-ui";
import { freshness, toggleTalent, revokeUpdateRequest } from "./resume-model";
export function TalentStar({
  scope,
  act,
  candidate: p,
}: WorkflowProps & { candidate: Candidate }) {
  return (
    <button
      type="button"
      aria-label={`${p.talent ? "Desmarcar" : "Marcar"} talento ${p.name}`}
      aria-pressed={!!p.talent}
      title={
        p.talent
          ? "Talento selecionado pelo RH"
          : "Marcar talento para futuras oportunidades"
      }
      onClick={() => act((s) => toggleTalent(s, scope, p.id))}
      className="rounded-md p-1.5 text-amber-600 hover:bg-amber-50 focus-visible:outline-2"
    >
      <Star size={17} fill={p.talent ? "currentColor" : "none"} />
    </button>
  );
}
export function Freshness({
  state,
  candidate: p,
}: Pick<WorkflowProps, "state"> & { candidate: Candidate }) {
  const f = freshness(p, state.resumeConfig!);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] ${["bg-emerald-50 text-emerald-800", "bg-blue-50 text-blue-800", "bg-amber-50 text-amber-800", "bg-rose-50 text-rose-800"][f.level]}`}
    >
      <Clock3 size={10} />
      {f.label}
    </span>
  );
}
export const profileLabels: Record<keyof ResumeProfile, string> = {
  name: "Nome completo",
  email: "E-mail",
  phone: "Telefone / WhatsApp",
  city: "Cidade",
  sector: "Área de interesse",
  education: "Formação",
  experience: "Experiência declarada",
  skills: "Competências",
  software: "Softwares",
  availability: "Disponibilidade / prazo",
  summary: "Resumo profissional",
  contracts: "Modalidades de interesse",
  availabilityStatus: "Situação profissional atual",
  cv: "Currículo",
  portfolio: "Portfólio",
};
export function ResumeProfileForm({
  initial,
  save,
}: {
  initial: ResumeProfile;
  save: (p: ResumeProfile, consent: boolean) => void;
}) {
  const [p, set] = useState<ResumeProfile>(() => structuredClone(initial)),
    [consent, setConsent] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        save(p, consent);
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            "name",
            "email",
            "phone",
            "city",
            "sector",
            "education",
            "experience",
            "skills",
            "software",
            "availability",
          ] as const
        ).map((key) => (
          <TextField
            key={key}
            label={profileLabels[key]}
            type={key === "email" ? "email" : "text"}
            required={["name", "email"].includes(key)}
            value={p[key]}
            onChange={(v) => set({ ...p, [key]: v })}
          />
        ))}
      </div>
      <AreaField
        label="Resumo profissional"
        value={p.summary}
        onChange={(summary) => set({ ...p, summary })}
      />
      <Pick
        label="Situação profissional atual"
        value={p.availabilityStatus}
        options={choices(availabilityStates)}
        onChange={(v) =>
          set({
            ...p,
            availabilityStatus: v as ResumeProfile["availabilityStatus"],
          })
        }
      />
      <fieldset className="flex flex-wrap gap-4">
        <legend className="mb-2 text-sm">Modalidades de interesse</legend>
        {(["CLT", "Estágio", "PJ"] as const).map((contract) => (
          <Check
            key={contract}
            label={contract}
            checked={p.contracts.includes(contract)}
            onChange={(yes) =>
              set({
                ...p,
                contracts: yes
                  ? [...p.contracts, contract]
                  : p.contracts.filter((v) => v !== contract),
              })
            }
          />
        ))}
      </fieldset>
      {(["cv", "portfolio"] as const).map((key) => (
        <section key={key} className="space-y-3 rounded-xl border p-4">
          <Upload
            label={`Novo ${profileLabels[key].toLowerCase()} demonstrativo`}
            accept={key === "cv" ? ".pdf,.doc,.docx" : undefined}
            onFile={(file) => set({ ...p, [key]: file })}
          />
          {p[key] && (
            <>
              <FileCard file={p[key]!} />
              <Button
                type="button"
                variant="ghost"
                onClick={() => set({ ...p, [key]: undefined })}
              >
                Remover {profileLabels[key].toLowerCase()}
              </Button>
            </>
          )}
        </section>
      ))}
      <Check
        label="Confirmo os dados fictícios e a finalidade desta atualização demonstrativa"
        checked={consent}
        onChange={setConsent}
      />
      <Button type="submit" disabled={!consent}>
        Salvar atualização do currículo
      </Button>
    </form>
  );
}
export function UpdateLinks({
  state,
  scope,
  act,
  ids,
}: WorkflowProps & { ids: string[] }) {
  const [feedback, setFeedback] = useState("");
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const requests = state.resumeRequests!.filter((r) =>
    ids.includes(r.candidate),
  );
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setFeedback("Copiado. Nenhuma mensagem foi enviada.");
    } catch {
      setFeedback(
        "Cópia automática indisponível. Selecione o texto do link/mensagem abaixo.",
      );
    }
  }
  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-accent p-3 text-xs leading-6">
        Links temporários demonstrativos, sem criar conta do candidato ou
        acessar dados internos. Nesta etapa, a simulação exige a sessão RH
        existente e usa apenas este navegador/conta. Não é um formulário público
        real, nem um bypass de login. Sem integração ou envio ao WhatsApp.
      </p>
      {feedback && (
        <p role="status" className="text-xs text-primary">
          {feedback}
        </p>
      )}
      {requests.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum convite neste recorte.
        </p>
      )}
      {requests.map((r) => {
        const p = state.candidates.find((p) => p.id === r.candidate);
        const expired = clock >= Date.parse(r.expires),
          status = r.state === "Aberta" && expired ? "Expirada" : r.state;
        const link =
          typeof location !== "undefined"
            ? `${location.origin}/candidatura-demonstrativa?atualizar=${encodeURIComponent(r.id)}&token=${encodeURIComponent(r.token)}`
            : "";
        const message = r.message
          .replaceAll("{nome}", p?.name ?? "Candidato")
          .replaceAll("{link}", link)
          .replaceAll(
            "{validade}",
            new Date(r.expires).toLocaleString("pt-BR", {
              timeZone: "America/Sao_Paulo",
            }),
          );
        return (
          <article key={r.id} className="space-y-3 rounded-xl border p-4">
            <div className="flex items-center justify-between gap-2">
              <strong className="text-sm">{p?.name}</strong>
              <Badge>{status}</Badge>
            </div>
            <p className="text-xs">
              Válido até{" "}
              {new Date(r.expires).toLocaleString("pt-BR", {
                timeZone: "America/Sao_Paulo",
              })}{" "}
              · revisão {r.revision}
            </p>
            {r.state === "Aberta" && !expired && (
              <>
                <input
                  aria-label={`Link de atualização ${p?.name}`}
                  readOnly
                  value={link}
                  className="w-full rounded-lg border p-2 text-xs"
                />
                <p className="whitespace-pre-wrap break-all text-xs leading-6">
                  {message}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => copy(link)}>
                    Copiar link individual
                  </Button>
                  <Button variant="outline" onClick={() => copy(message)}>
                    Copiar mensagem para WhatsApp
                  </Button>
                  <a
                    className="px-3 py-2 text-sm text-primary underline"
                    href={link}
                    target="_blank"
                  >
                    Abrir simulação protegida
                  </a>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      act((s) => revokeUpdateRequest(s, scope, r.id))
                    }
                  >
                    Revogar convite
                  </Button>
                </div>
              </>
            )}
          </article>
        );
      })}
    </div>
  );
}
