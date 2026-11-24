import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { demoDocuments } from "@/modules/documents/fixtures";
import {
  readable,
  readerProjection,
  safeLink,
  differences,
  snapshot,
  contentBlocks,
} from "@/modules/documents/model";
describe("Document authorization projections", () => {
  for (const audience of ["CLT", "Estágio", "PJ"])
    it(`only published documents reach ${audience}`, () => {
      const docs = demoDocuments(false, audience);
      expect(docs.length).toBeGreaterThan(0);
      expect(
        docs.every(
          (d) =>
            readable(d, audience) &&
            d.status === "Ativa" &&
            d.versions.length === 0,
        ),
      ).toBe(true);
    });
  it("unifies libraries without losing documents or management states", () => {
    const docs = demoDocuments(true, "CLT");
    expect(new Set(docs.map((d) => d.library)).size).toBe(1);
    expect(docs).toHaveLength(12);
    expect(new Set(docs.map((d) => d.id)).size).toBe(12);
    expect(new Set(docs.map((d) => d.status)).size).toBe(5);
  });
  it("does not expose draft changes over a published version", () => {
    const d = demoDocuments(true, "CLT")[0];
    d.title = "Unpublished change";
    d.status = "Rascunho";
    expect(readerProjection(d).title).not.toBe("Unpublished change");
    d.status = "Arquivada";
    expect(readable(d, "CLT")).toBe(false);
  });
  it("preserves legacy attachments as ordered blocks without mutating history", () => {
    const doc = demoDocuments(true, "CLT")[0];
    doc.attachments = [
      {
        id: "legacy",
        name: "teste.docx",
        size: 50,
        type: "application/octet-stream",
        url: "blob:demo",
      },
    ];
    const blocks = contentBlocks(doc);
    expect(blocks.at(-1)?.file?.name).toBe("teste.docx");
    expect(doc.blocks.some((b) => b.type === "file")).toBe(false);
    expect(contentBlocks({ ...doc, blocks, attachments: [] })).toEqual(blocks);
  });
  it("blocks script and data URLs", () => {
    expect(safeLink("javascript:alert(1)")).toBeUndefined();
    expect(safeLink("data:text/html,test")).toBeUndefined();
    expect(safeLink("https://example.org")).toBeTruthy();
  });
  it("identifies changes without mutating earlier snapshots", () => {
    const d = demoDocuments(true, "CLT")[0];
    const before = snapshot(d);
    const after = { ...snapshot(d), title: "Revision" };
    expect(differences(before, after)).toEqual(["title"]);
    expect(before.title).toBe(d.title);
  });
});
