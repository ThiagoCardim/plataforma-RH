import { type Scope, type Contract, admin, assert, uid } from "../career/model";
import { type Block, type Attachment } from "../documents/model";
import { type PerformanceState } from "../performance/model";
export const layouts = [
  "Apresentação",
  "Pilares",
  "Fundadores",
  "Valores",
  "Limites",
  "Rituais",
  "Metas",
  "Jornada",
  "Timeline",
  "Galeria",
  "Histórias",
  "Hall",
] as const;
export type Item = {
  id: string;
  title: string;
  subtitle: string;
  blocks: Block[];
  image?: Attachment;
  date: string;
  group: string;
  target?: number;
  current?: number;
};
export type Section = {
  id: string;
  layout: (typeof layouts)[number];
  title: string;
  eyebrow: string;
  summary: string;
  theme: "Clara" | "Escura" | "Laranja";
  visible: boolean;
  contracts: Contract[];
  partnerRelevant: boolean;
  items: Item[];
  blocks: Block[];
};
export type Chapter = { id: string; title: string; blocks: Block[] };
export type Manual = {
  title: string;
  ready: boolean;
  pdf?: Attachment;
  chapters: Chapter[];
  version: number;
};
export type CultureContent = {
  hero: { kicker: string; title: string; subtitle: string; image?: Attachment };
  sections: Section[];
  manual: Manual;
};
export type Version = {
  id: string;
  number: number;
  at: string;
  by: string;
  note: string;
  content: CultureContent;
};
export type CultureState = {
  version: 1;
  org: string;
  draft?: CultureContent;
  versions: Version[];
  events: { id: string; at: string; by: string; text: string }[];
};
export type Receipt = {
  id: string;
  org: string;
  user: string;
  contract: Contract;
  manualVersion: number;
  manualId: string;
  title: string;
  at: string;
  source: "Cultura" | "Onboarding";
};
export const latest = (s: CultureState) => s.versions.at(-1);
export const employeeOnly = (s: Section) =>
  ["Valores", "Limites", "Rituais", "Hall"].includes(s.layout);
export function sectionAllows(s: Section, c: Scope) {
  return (
    s.visible &&
    s.contracts.includes(c.contract) &&
    (c.contract !== "PJ" || (s.partnerRelevant && !employeeOnly(s)))
  );
}
const guard = (s: CultureState, c: Scope, manage = false) => {
  assert(s.org === c.org, "Organização não autorizada.");
  if (manage) assert(admin(c), "Gestão exclusiva de RH e Diretoria.");
};
export function projection(s: CultureState, c: Scope): CultureState {
  guard(s, c);
  if (admin(c)) return s;
  const v = latest(s);
  return {
    version: 1,
    org: c.org,
    versions: v
      ? [
          {
            ...v,
            content: {
              ...v.content,
              sections: v.content.sections.filter((x) => sectionAllows(x, c)),
              manual:
                c.contract === "PJ"
                  ? {
                      title: "Manual de Cultura",
                      ready: false,
                      version: 0,
                      chapters: [],
                    }
                  : v.content.manual,
            },
          },
        ]
      : [],
    events: [],
  };
}
const local = (url: string) =>
  url.startsWith("blob:") || url.startsWith("/demo/culture/");
function attachment(f: Attachment, kind?: "image" | "pdf") {
  assert(
    local(f.url) && f.size >= 0 && f.size <= 25 * 1024 * 1024,
    "Arquivo local inválido ou acima de 25 MB.",
  );
  if (kind === "image")
    assert(
      /^image\/(png|jpeg|webp|gif)$/.test(f.type),
      "Use imagem PNG, JPEG, WebP ou GIF.",
    );
  if (kind === "pdf")
    assert(
      f.type === "application/pdf" && /\.pdf$/i.test(f.name),
      "Use um PDF válido.",
    );
}
function blocks(rows: Block[], publish = false) {
  assert(
    new Set(rows.map((x) => x.id)).size === rows.length,
    "Blocos duplicados.",
  );
  for (const b of rows) {
    if (b.file) attachment(b.file, b.type === "image" ? "image" : undefined);
    if (b.captions) {
      attachment(b.captions);
      assert(b.captions.type === "text/vtt", "Legenda deve ser VTT.");
    }
    if (b.url) {
      if (b.type === "image") assert(local(b.url), "Use imagem local.");
      else {
        let u: URL;
        try {
          u = new URL(b.url);
        } catch {
          throw new Error("Link inválido.");
        }
        assert(
          ["http:", "https:"].includes(u.protocol) &&
            !u.username &&
            !u.password,
          "Link inválido ou com credenciais.",
        );
      }
    }
    if (publish) {
      if (b.type === "file" || b.type === "video")
        assert(b.file, "Adicione o arquivo dos blocos antes de publicar.");
      if (b.type === "image")
        assert(b.url, "Adicione a imagem antes de publicar.");
      if (b.type === "link")
        assert(b.url && b.text.trim(), "Configure o link antes de publicar.");
      if (!["file", "image", "video"].includes(b.type))
        assert(b.text.trim(), "Preencha os blocos antes de publicar.");
    }
    if (b.type === "video" && b.file)
      assert(
        /^video\/(mp4|webm)$/.test(b.file.type),
        "Vídeo deve ser MP4 ou WebM.",
      );
  }
}
function validate(d: CultureContent, publishing = false) {
  assert(
    d.hero.title.trim() && d.hero.kicker.trim(),
    "Preencha o banner institucional.",
  );
  if (d.hero.image) attachment(d.hero.image, "image");
  assert(
    new Set(d.sections.map((x) => x.id)).size === d.sections.length,
    "Seções duplicadas.",
  );
  for (const s of d.sections) {
    assert(
      layouts.includes(s.layout) && s.title.trim() && s.contracts.length,
      "Configure título, apresentação e público da seção.",
    );
    assert(
      !employeeOnly(s) || !s.contracts.includes("PJ"),
      "Valores, compromissos, rituais e Destaque Cultural não são destinados a PJ.",
    );
    assert(
      !s.contracts.includes("PJ") || s.partnerRelevant,
      "Confirme a pertinência à parceria para conteúdo PJ.",
    );
    assert(
      new Set(s.items.map((x) => x.id)).size === s.items.length,
      "Cards duplicados.",
    );
    blocks(s.blocks, publishing && s.visible);
    for (const i of s.items) {
      assert(i.title.trim(), "Informe o título de cada card.");
      if (i.image) attachment(i.image, "image");
      for (const n of [i.target, i.current])
        assert(
          n === undefined || (Number.isSafeInteger(n) && n >= 0),
          "Indicadores devem ser inteiros não negativos.",
        );
      assert(
        i.current === undefined ||
          i.target === undefined ||
          i.current <= i.target,
        "Avanço não pode superar a meta.",
      );
      blocks(i.blocks, publishing && s.visible);
    }
  }
  assert(d.manual.title.trim(), "Informe o título do manual.");
  if (d.manual.pdf) attachment(d.manual.pdf, "pdf");
  assert(
    new Set(d.manual.chapters.map((x) => x.id)).size ===
      d.manual.chapters.length,
    "Capítulos duplicados.",
  );
  for (const ch of d.manual.chapters) {
    assert(ch.title.trim(), "Informe o nome dos capítulos.");
    blocks(ch.blocks, publishing && d.manual.ready);
  }
  if (publishing && d.manual.ready)
    assert(
      d.manual.pdf || d.manual.chapters.some((ch) => ch.blocks.length),
      "Adicione o manual PDF ou capítulos antes de disponibilizar.",
    );
}
export function saveDraft(s: CultureState, c: Scope, d: CultureContent) {
  guard(s, c, true);
  validate(d);
  return {
    ...s,
    draft: structuredClone(d),
    events: [
      ...s.events,
      {
        id: uid(),
        at: new Date().toISOString(),
        by: c.name,
        text: "Rascunho cultural salvo localmente.",
      },
    ],
  };
}
// Object URLs change on reload; immutable file IDs identify actual replacements.
const fingerprint = (v: unknown): string =>
  JSON.stringify(v, (key, value) =>
    key === "version" ||
    (key === "url" && typeof value === "string" && value.startsWith("blob:"))
      ? undefined
      : value,
  );
export function publish(s: CultureState, c: Scope, note: string): CultureState {
  guard(s, c, true);
  assert(s.draft && note.trim(), "Salve um rascunho e descreva a publicação.");
  validate(s.draft, true);
  const before = latest(s),
    d = structuredClone(s.draft),
    changed =
      !before || fingerprint(before.content.manual) !== fingerprint(d.manual);
  d.manual.version = (before?.content.manual.version ?? 0) + (changed ? 1 : 0);
  const v: Version = {
    id: uid(),
    number: (before?.number ?? 0) + 1,
    content: d,
    by: c.name,
    at: new Date().toISOString(),
    note,
  };
  return {
    ...s,
    draft: undefined,
    versions: [...s.versions, v],
    events: [
      ...s.events,
      {
        id: uid(),
        at: v.at,
        by: c.name,
        text: `Publicação local v${v.number}: ${note}`,
      },
    ],
  };
}
export function restoreVersion(s: CultureState, c: Scope, id: string) {
  guard(s, c, true);
  const v = s.versions.find((v) => v.id === id);
  assert(v, "Versão indisponível.");
  return saveDraft(s, c, v.content);
}
export function confirmReading(
  s: CultureState,
  c: Scope,
  rows: Receipt[],
  source: Receipt["source"],
  expectedManualId: string,
) {
  guard(s, c);
  const v = latest(s);
  assert(
    c.contract !== "PJ",
    "PJ não registra ciência de compromissos culturais.",
  );
  assert(v?.content.manual.ready, "Manual aprovado ainda não disponível.");
  const m = v.content.manual,
    id = `culture-manual:${m.version}`;
  assert(
    id === expectedManualId,
    "O manual mudou. Reabra a versão atual antes de confirmar.",
  );
  const visible = rows.filter((r) => r.org === c.org && r.user === c.user);
  if (visible.some((r) => r.manualId === id)) return visible;
  return [
    ...visible,
    {
      id: uid(),
      org: c.org,
      user: c.user,
      contract: c.contract,
      manualVersion: m.version,
      manualId: id,
      title: m.title,
      at: new Date().toISOString(),
      source,
    },
  ];
}
export type CulturalRecognition = {
  id: string;
  name: string;
  message: string;
  month: string;
};
export function culturalRecognitions(
  s: PerformanceState,
  c: Scope,
): CulturalRecognition[] {
  assert(s.org === c.org, "Organização não autorizada.");
  if (c.contract === "PJ") return [];
  return s.awards
    .filter(
      (a) =>
        a.status === "Publicado" &&
        a.category.kind === "Comportamental" &&
        a.category.contracts.every((x) => x !== "PJ"),
    )
    .flatMap((a) => {
      const p = s.people.find((p) => p.id === a.person);
      return p && p.contract !== "PJ"
        ? [{ id: a.id, name: p.name, message: a.message, month: a.month }]
        : [];
    });
}
