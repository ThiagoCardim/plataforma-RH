"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TextField, Pick, Check } from "../academy/components";
import { uid } from "../career/model";
import { type WorkflowProps } from "./workflow-ui";
import {
  type Spreadsheet,
  importFields,
  parseSpreadsheet,
  previewImport,
  commitDemoImport,
} from "./resume-import";
import { profileLabels } from "./resume-components";
const sample =
  "Nome;Email;Telefone;Cidade;Area;Competencias;Softwares\nRui Importação Demo;rui-import@exemplo.invalid;(00) 92222-2222;São Paulo;Engenharia;BIM;Revit\nNina Currículo Demo;nina-cv@exemplo.invalid;(00) 91111-1111;Curitiba;Arquitetura;Projetos;Revit\n";
export function ResumeImportPanel({ state, scope, act }: WorkflowProps) {
  const [table, setTable] = useState<Spreadsheet>(),
    [mapping, setMapping] = useState<Record<string, string>>({}),
    [source, setSource] = useState(
      "Pipefy · processo seletivo 1 (demonstração)",
    ),
    [file, setFile] = useState(""),
    [error, setError] = useState(""),
    [prepared, setPrepared] = useState(false),
    [selected, setSelected] = useState<number[]>([]),
    [confirmed, setConfirmed] = useState(false),
    [session, setSession] = useState(uid),
    [report, setReport] = useState("");
  let preview: ReturnType<typeof previewImport> = [];
  if (prepared && table) {
    try {
      preview = previewImport(state, table, mapping, source);
    } catch {}
  }
  async function load(upload: File) {
    try {
      if (!/\.(csv|tsv)$/i.test(upload.name) || upload.size > 1048576)
        throw Error(
          "Use CSV ou TSV UTF-8 de até 1 MB. Exporte arquivos XLSX como CSV antes da demonstração.",
        );
      const value = parseSpreadsheet(await upload.text());
      const aliases: Record<string, string> = {
        nome: "name",
        email: "email",
        telefone: "phone",
        cidade: "city",
        area: "sector",
        competencias: "skills",
        softwares: "software",
        experiencia: "experience",
        formacao: "education",
        disponibilidade: "availability",
        vinculo: "contracts",
        observacoes: "summary",
      };
      setTable(value);
      setMapping(
        Object.fromEntries(
          value.headers.map((h, i) => [
            String(i),
            aliases[
              h
                .normalize("NFD")
                .replace(/[\u0300-\u036f\s-]/g, "")
                .toLowerCase()
            ] ?? "",
          ]),
        ),
      );
      setFile(upload.name);
      setPrepared(false);
      setReport("");
      setConfirmed(false);
      setSession(uid());
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const r = state.importReports!.find((r) => r.id === report);
  return (
    <div className="space-y-5">
      <p className="rounded-xl bg-accent p-4 text-sm leading-6">
        Simulação da futura migração dos dois processos do Pipefy. Use somente
        planilhas fictícias. Nenhuma conexão, importação real ou chamada externa
        será realizada. CSV/TSV são lidos apenas neste navegador; o relatório e
        os exemplos revisados ficam no armazenamento local.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => {
            const url = URL.createObjectURL(
              new Blob(["\ufeff" + sample], { type: "text/csv;charset=utf-8" }),
            );
            const a = document.createElement("a");
            a.href = url;
            a.download = "curriculos-ficticios-pipefy.csv";
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}
        >
          Baixar planilha fictícia
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const value = parseSpreadsheet(sample);
            setTable(value);
            setMapping({
              "0": "name",
              "1": "email",
              "2": "phone",
              "3": "city",
              "4": "sector",
              "5": "skills",
              "6": "software",
            });
            setFile("exemplo-local.csv");
            setPrepared(false);
            setSession(uid());
            setReport("");
            setError("");
            setConfirmed(false);
          }}
        >
          Carregar exemplo fictício
        </Button>
      </div>
      <Pick
        label="Processo de origem demonstrativo"
        value={source}
        onChange={(v) => {
          setSource(v);
          setPrepared(false);
        }}
        options={[1, 2].map((i) => ({
          id: `Pipefy · processo seletivo ${i} (demonstração)`,
          name: `Pipefy · processo seletivo ${i} (demonstração)`,
        }))}
      />
      <TextField
        label="Identificação da origem"
        value={source}
        onChange={(v) => {
          setSource(v);
          setPrepared(false);
        }}
      />
      <label className="block text-sm">
        Planilha demonstrativa CSV ou TSV
        <input
          className="mt-2 block w-full rounded-lg border p-3 text-xs"
          type="file"
          accept=".csv,.tsv,text/csv,text/tab-separated-values"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void load(file);
          }}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {table && (
        <>
          <h3 className="font-semibold">
            Correspondência de campos · {table.rows.length} linhas
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {table.headers.map((h, i) => (
              <Pick
                key={i}
                label={`Coluna ${h}`}
                value={mapping[String(i)] ?? ""}
                onChange={(v) => {
                  setMapping({ ...mapping, [i]: v });
                  setPrepared(false);
                }}
                options={[
                  { id: "", name: "Não importar" },
                  ...importFields.map((id) => ({
                    id,
                    name: profileLabels[id],
                  })),
                ]}
              />
            ))}
          </div>
          <Button
            variant="outline"
            onClick={() => {
              try {
                const rows = previewImport(state, table, mapping, source);
                setPrepared(true);
                setSelected(rows.filter((r) => !r.error).map((r) => r.row));
                setError("");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Pré-visualizar e identificar duplicidades
          </Button>
        </>
      )}
      {prepared && preview.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3">Importar</th>
                  <th>Linha / nome</th>
                  <th>E-mail / origem</th>
                  <th>Revisão</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((r) => (
                  <tr key={r.row} className="border-t">
                    <td className="p-3">
                      <Check
                        label={`Importar linha ${r.row}`}
                        checked={selected.includes(r.row)}
                        onChange={(yes) =>
                          setSelected(
                            yes
                              ? [...selected, r.row]
                              : selected.filter((x) => x !== r.row),
                          )
                        }
                      />
                    </td>
                    <td className="pr-3">
                      {r.row}. {r.candidate.name}
                    </td>
                    <td className="pr-3">
                      {r.candidate.email}
                      <br />
                      {source}
                    </td>
                    <td className="p-3">
                      {r.error || r.matches.length
                        ? r.error ||
                          `Possível duplicidade (${r.matches.length}); ficará pendente do RH`
                        : "Novo cadastro demonstrativo"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Check
            label="Revisei as linhas e confirmo que são exclusivamente dados fictícios"
            checked={confirmed}
            onChange={setConfirmed}
          />
          <Button
            disabled={!confirmed || !selected.length || !!r}
            onClick={() => {
              const next = act((s) =>
                commitDemoImport(
                  s,
                  scope,
                  table!,
                  mapping,
                  source,
                  file,
                  selected,
                  confirmed,
                  session,
                ),
              );
              if (next) setReport(session);
            }}
          >
            Simular importação local revisada
          </Button>
        </>
      )}
      {r && (
        <section className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/30 p-4">
          <h3 className="font-semibold">
            Relatório da importação demonstrativa
          </h3>
          <p className="text-sm">
            {r.created} cadastros · {r.reviews} revisões de duplicidade ·{" "}
            {r.skipped} linhas ignoradas
          </p>
          <p className="text-xs">
            {r.source} · {r.file} · {r.by}
          </p>
          {r.rows.map((row) => (
            <p key={row.row} className="text-xs">
              Linha {row.row}: {row.state}
            </p>
          ))}
          <p className="text-xs">
            Registros novos ficam no Banco de Currículos, sem iniciar processos
            automaticamente. Nenhuma unificação foi executada.
          </p>
        </section>
      )}
      <details className="rounded-xl border p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Relatórios anteriores ({state.importReports!.length})
        </summary>
        {state.importReports!.map((r) => (
          <p key={r.id} className="mt-3 text-xs">
            {new Date(r.at).toLocaleString("pt-BR", {
              timeZone: "America/Sao_Paulo",
            })}{" "}
            · {r.source} · {r.created} novos / {r.reviews} revisões /{" "}
            {r.skipped} ignorados
          </p>
        ))}
      </details>
    </div>
  );
}
