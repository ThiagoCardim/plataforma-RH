export type Library = "compliance" | "politicas-internas";
export const statuses = [
  "Rascunho",
  "Em revisão",
  "Em implantação",
  "Ativa",
  "Arquivada",
] as const;
export type Status = (typeof statuses)[number];
export type Block = {
  id: string;
  type: "title" | "text" | "list" | "table" | "image" | "link";
  text: string;
  url?: string;
};
export type Attachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
};
export type Content = {
  title: string;
  category: string;
  audience: string[];
  tags: string[];
  status: Status;
  blocks: Block[];
  attachments: Attachment[];
  requireRead: boolean;
};
export type Version = {
  number: number;
  at: string;
  author: string;
  changes: string[];
  content: Content;
};
export type Document = Content & {
  id: string;
  library: Library;
  versions: Version[];
  published?: Content;
  readVersion?: number;
};
export const libraryNames: Record<Library, string> = {
  compliance: "Compliance",
  "politicas-internas": "Políticas Internas",
};
export const audiences = ["CLT", "Estágio", "PJ"];
export function readable(doc: Document, audience: string) {
  return (
    doc.status !== "Arquivada" &&
    !!doc.published &&
    doc.published.audience.includes(audience)
  );
}
export function readerProjection(doc: Document): Document {
  return {
    ...doc.published!,
    id: doc.id,
    library: doc.library,
    versions: [],
    published: doc.published,
  };
}
export function differences(before: Content, after: Content) {
  return (Object.keys(after) as (keyof Content)[]).filter(
    (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]),
  );
}
export function safeLink(url: string) {
  try {
    const parsed = new URL(url);
    return ["https:", "http:"].includes(parsed.protocol) ? url : undefined;
  } catch {
    return undefined;
  }
}
export function snapshot(doc: Content): Content {
  return structuredClone({
    title: doc.title,
    category: doc.category,
    audience: doc.audience,
    tags: doc.tags,
    status: doc.status,
    blocks: doc.blocks,
    attachments: doc.attachments,
    requireRead: doc.requireRead,
  });
}
