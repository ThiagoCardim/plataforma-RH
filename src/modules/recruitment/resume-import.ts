import { type Candidate, type State, guard, ev } from "./model";
import { type Scope, assert, uid, dateNow } from "../career/model";
import { registerResume, resumeDuplicates } from "./resume-model";
export const importFields = [
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
  "contracts",
  "summary",
] as const;
export type ImportField = (typeof importFields)[number];
export type Spreadsheet = { headers: string[]; rows: string[][] };
export function parseSpreadsheet(text: string): Spreadsheet {
  assert(text.length <= 1048576, "Use uma planilha demonstrativa de até 1 MB.");
  const clean = text.replace(/^\uFEFF/, "");
  const first = clean.split(/\r?\n/)[0],
    delimiter = first.includes("\t") ? "\t" : first.includes(";") ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quote = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (ch === '"') {
      if (quote && clean[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (!quote && cell.length === 0) quote = true;
      else if (quote) quote = false;
      else cell += ch;
    } else if (!quote && ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (!quote && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && clean[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  assert(!quote, "Aspas não encerradas na planilha.");
  row.push(cell);
  if (row.some((x) => x.trim())) rows.push(row);
  const headers = rows.shift()?.map((x) => x.trim()) ?? [];
  assert(
    headers.length >= 2 &&
      headers.every(Boolean) &&
      new Set(headers).size === headers.length,
    "Cabeçalhos distintos e pelo menos duas colunas são obrigatórios.",
  );
  assert(
    rows.length > 0 && rows.length <= 200,
    "Use de 1 a 200 linhas fictícias.",
  );
  assert(
    rows.every((r) => r.length <= headers.length),
    "Linha contém mais colunas que o cabeçalho.",
  );
  return {
    headers,
    rows: rows.map((r) => headers.map((_, i) => r[i]?.trim() ?? "")),
  };
}
export function importCandidate(
  s: State,
  row: string[],
  mapping: Record<string, string>,
  source: string,
): Candidate {
  const get = (field: ImportField) =>
    row[
      Number(Object.keys(mapping).find((key) => mapping[key] === field) ?? -1)
    ] ?? "";
  const contracts = get("contracts")
    .split(/[,|/]/)
    .map((v) => v.trim())
    .filter((v): v is Candidate["contracts"][number] =>
      ["CLT", "Estágio", "PJ"].includes(v),
    );
  return {
    id: uid(),
    name: get("name"),
    email: get("email"),
    phone: get("phone"),
    city: get("city"),
    sector: get("sector"),
    education: get("education"),
    experience: get("experience"),
    skills: get("skills"),
    software: get("software"),
    availability: get("availability"),
    summary: get("summary"),
    contracts: contracts.length ? contracts : ["CLT", "Estágio", "PJ"],
    source,
    referral: "",
    tags: [],
    claims: [],
    expected: 0,
    created: dateNow(),
    retentionUntil: new Date(
      Date.parse(dateNow() + "T12:00:00Z") + s.privacy.days * 86400000,
    )
      .toISOString()
      .slice(0, 10),
    consent: `Importação demonstrativa revisada pelo RH · finalidade v${s.privacy.version}`,
  };
}
export function previewImport(
  s: State,
  table: Spreadsheet,
  mapping: Record<string, string>,
  source: string,
) {
  assert(source.trim(), "Identifique a origem fictícia.");
  const mapped = Object.values(mapping).filter(Boolean);
  assert(
    mapped.includes("name") &&
      mapped.includes("email") &&
      new Set(mapped).size === mapped.length,
    "Mapeie nome/e-mail e use cada campo uma única vez.",
  );
  return table.rows.map((row, i) => {
    const p = importCandidate(s, row, mapping, source),
      prior = table.rows
        .slice(0, i)
        .map((r) => importCandidate(s, r, mapping, source));
    const matches = resumeDuplicates(
      { ...s, candidates: [...s.candidates, ...prior] },
      p,
    ).filter((p) => !p.mergedInto);
    return {
      row: i + 2,
      candidate: p,
      matches,
      error:
        !p.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)
          ? "Nome/e-mail inválidos"
          : "",
    };
  });
}
export function commitDemoImport(
  s: State,
  c: Scope,
  table: Spreadsheet,
  mapping: Record<string, string>,
  source: string,
  file: string,
  selected: number[],
  confirmed: boolean,
  sessionId: string,
): State {
  guard(s, c, "hr");
  assert(
    confirmed && sessionId && selected.length,
    "Revise as linhas e confirme o uso exclusivo de dados fictícios.",
  );
  if (s.importReports?.some((r) => r.id === sessionId)) return s;
  const preview = previewImport(s, table, mapping, source);
  assert(
    selected.every((row) => preview.some((r) => r.row === row)),
    "Seleção de linhas inválida.",
  );
  assert(
    preview.every((r) => !selected.includes(r.row) || !r.error),
    "Corrija ou desmarque linhas inválidas.",
  );
  let next = s;
  const report = {
    id: sessionId,
    at: new Date().toISOString(),
    by: c.name,
    source,
    file,
    total: preview.length,
    created: 0,
    reviews: 0,
    skipped: 0,
    rows: [] as {
      row: number;
      state: string;
      candidate?: string;
      review?: string;
    }[],
  };
  for (const row of preview) {
    if (!selected.includes(row.row)) {
      report.skipped++;
      report.rows.push({ row: row.row, state: "Ignorada pelo RH" });
      continue;
    }
    const before = next.duplicateReviews?.length ?? 0;
    next = registerResume(next, c, row.candidate, false);
    if ((next.duplicateReviews?.length ?? 0) > before) {
      report.reviews++;
      report.rows.push({
        row: row.row,
        state: "Aguardando revisão de duplicidade",
        review: next.duplicateReviews![0].id,
      });
    } else {
      report.created++;
      report.rows.push({
        row: row.row,
        state: "Cadastro fictício criado no Banco, sem processo automático",
        candidate: row.candidate.id,
      });
    }
  }
  return {
    ...next,
    importReports: [report, ...next.importReports!],
    events: [
      ...next.events,
      ev(
        c,
        `Importação local demonstrativa: ${report.created} cadastros, ${report.reviews} revisões, ${report.skipped} linhas ignoradas. Sem conexão ao Pipefy.`,
      ),
    ],
  };
}
