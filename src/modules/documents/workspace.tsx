"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  FileText,
  Plus,
  Search,
  LayoutGrid,
  List,
  Copy,
  Archive,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/fields";
import { Badge } from "@/components/ui/badge";
import { useDocuments } from "./store";
import { Body } from "./body";
import { DocumentEditor } from "./editor";
import {
  type Library,
  type Content,
  libraryNames,
  statuses,
  audiences,
  snapshot,
  contentBlocks,
} from "./model";
const blank: Content = {
  title: "",
  category: "Institucional",
  audience: ["CLT", "Estágio", "PJ"],
  tags: [],
  status: "Rascunho",
  blocks: [{ id: "initial", type: "text", text: "" }],
  attachments: [],
  requireRead: false,
};
export function DocumentWorkspace({
  library,
  id,
}: {
  library: Library;
  id?: string;
}) {
  const store = useDocuments();
  const router = useRouter();
  const [view, setView] = useState<"table" | "cards">("table");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [audience, setAudience] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState(id === "novo");
  const [tab, setTab] = useState<"content" | "versions">("content");
  const [historical, setHistorical] = useState<number | null>(null);
  const docs = store.docs.filter((d) => d.library === library);
  const doc = docs.find((d) => d.id === id);
  const rows = docs.filter(
    (d) =>
      d.title
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR")) &&
      (!category || d.category === category) &&
      (!audience || d.audience.includes(audience)) &&
      (!status || d.status === status),
  );
  const back = (
    <Link
      className="mb-5 inline-flex items-center gap-2 text-xs text-muted-foreground"
      href={`/${library}`}
    >
      <ArrowLeft size={14} />
      Voltar à biblioteca
    </Link>
  );
  if (editing) {
    if (!store.manager)
      return <p>Somente RH e Diretoria podem gerenciar documentos.</p>;
    return (
      <div>
        {back}
        <h1 className="page-title mb-6">
          {doc ? "Editar documento" : "Novo documento"}
        </h1>
        <DocumentEditor
          key={doc?.id ?? "new"}
          initial={
            doc
              ? {
                  ...snapshot(doc),
                  status: doc.status === "Ativa" ? "Rascunho" : doc.status,
                }
              : blank
          }
          onCancel={() => {
            setEditing(false);
            if (!doc) router.push(`/${library}`);
          }}
          onSave={(data) => {
            const target = doc?.id ?? crypto.randomUUID();
            if (store.save(target, library, data)) {
              setEditing(false);
              router.push(`/${library}/${target}`);
            }
          }}
        />
      </div>
    );
  }
  if (id) {
    if (!doc)
      return (
        <div>
          {back}
          <h1 className="page-title">Documento indisponível</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            O documento não está nesta biblioteca ou foi descartado ao
            recarregar a demonstração.
          </p>
        </div>
      );
    const version =
      historical === null
        ? undefined
        : doc.versions.find((v) => v.number === historical);
    const content = version?.content ?? doc;
    return (
      <div>
        {back}
        <header className="mb-6 flex flex-wrap justify-between gap-4">
          <div>
            <p className="section-kicker mb-3">
              {libraryNames[library]} / {doc.category}
            </p>
            <h1 className="page-title">{content.title}</h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>{content.status}</Badge>
              {content.audience.map((a) => (
                <Badge key={a}>{a}</Badge>
              ))}
              {content.tags.filter(Boolean).map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </div>
          </div>
          {store.manager && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setHistorical(null);
                  setEditing(true);
                }}
              >
                Editar documento
              </Button>
              <Button
                variant="outline"
                aria-label="Duplicar documento"
                onClick={() => store.duplicate(doc.id)}
              >
                <Copy />
              </Button>
              <Button
                variant="outline"
                aria-label="Arquivar documento"
                disabled={doc.status === "Arquivada"}
                onClick={() => {
                  if (
                    window.confirm("Arquivar este documento na demonstração?")
                  )
                    store.archive(doc.id);
                }}
              >
                <Archive />
              </Button>
            </div>
          )}
        </header>
        {store.manager &&
          doc.published &&
          doc.status !== "Ativa" &&
          doc.status !== "Arquivada" && (
            <p className="mb-5 rounded-lg bg-accent p-4 text-sm">
              Existe uma versão publicada anterior. As alterações atuais ainda
              não estão publicadas.
            </p>
          )}
        {store.manager && (
          <nav
            aria-label="Seções do documento"
            className="mb-6 flex gap-3 border-b pb-3"
          >
            <Button
              size="sm"
              variant={tab === "content" ? "secondary" : "ghost"}
              onClick={() => setTab("content")}
            >
              Documento
            </Button>
            <Button
              size="sm"
              variant={tab === "versions" ? "secondary" : "ghost"}
              onClick={() => setTab("versions")}
            >
              Histórico de versões ({doc.versions.length})
            </Button>
          </nav>
        )}
        {tab === "versions" && store.manager ? (
          <section className="space-y-4">
            {[...doc.versions].reverse().map((v) => (
              <div
                key={v.number}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5"
              >
                <div>
                  <h2 className="font-semibold">
                    Versão {v.number} · {v.content.status}
                  </h2>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {v.author} · {new Date(v.at).toLocaleString("pt-BR")}
                  </p>
                  <p className="mt-2 text-sm">
                    Alterações: {v.changes.join(", ")}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setHistorical(v.number);
                    setTab("content");
                  }}
                >
                  Visualizar versão {v.number}
                </Button>
              </div>
            ))}
          </section>
        ) : (
          <>
            <article className="mx-auto max-w-4xl rounded-xl border bg-card p-6 md:p-10">
              {version && (
                <div className="mb-6 flex flex-wrap items-center gap-3 bg-accent p-3 text-sm">
                  Visualizando versão {version.number}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setHistorical(null)}
                  >
                    Voltar à atual
                  </Button>
                </div>
              )}
              <Body blocks={contentBlocks(content)} />
            </article>
            {content.requireRead && content.status === "Ativa" && !version && (
              <div className="mx-auto mt-5 flex max-w-4xl flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5">
                <div>
                  <h2 className="section-title">Confirmação de leitura</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Confirmação demonstrativa, sem registro oficial.
                  </p>
                </div>
                <Button
                  disabled={!!doc.readVersion}
                  onClick={() => store.confirm(doc.id)}
                >
                  <CheckCircle2 />
                  {doc.readVersion ? "Leitura confirmada" : "Confirmar leitura"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-kicker mb-3">
            Políticas / Central de documentos
          </p>
          <h1 className="page-title">{libraryNames[library]}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Conhecimento organizado. Orientações sempre por perto.
          </p>
        </div>
        {store.manager && (
          <Button asChild>
            <Link href={`/${library}/novo`}>
              <Plus />
              Criar documento
            </Link>
          </Button>
        )}
      </header>
      <div className="grid gap-4 border-y py-5 sm:grid-cols-3">
        {[
          [docs.length, "documentos na biblioteca"],
          [docs.filter((d) => d.status === "Ativa").length, "ativos"],
          [
            docs.filter((d) => d.requireRead).length,
            "com confirmação de leitura",
          ],
        ].map(([n, l]) => (
          <div key={l}>
            <span className="text-3xl font-semibold tracking-tight">{n}</span>
            <p className="mt-1 text-xs text-muted-foreground">
              {l} · demonstração
            </p>
          </div>
        ))}
      </div>
      <section className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-4">
        <label className="text-xs">
          Pesquisar documento
          <div className="relative">
            <Search size={14} className="absolute left-3 top-4" />
            <Input
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar pelo título…"
            />
          </div>
        </label>
        <label className="text-xs">
          Categoria
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Todas as categorias</option>
            {Array.from(new Set(docs.map((d) => d.category))).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </label>
        <label className="text-xs">
          Público
          <Select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
          >
            <option value="">Todos os públicos</option>
            {audiences.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </Select>
        </label>
        <label className="text-xs">
          Status
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos os status</option>
            {(store.manager ? statuses : ["Ativa"]).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </label>
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-xs text-muted-foreground">
          {rows.length} documentos encontrados
        </p>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setAudience("");
              setCategory("");
              setStatus("");
            }}
          >
            Limpar filtros
          </Button>
          <Button
            aria-label="Visualizar em tabela"
            aria-pressed={view === "table"}
            size="sm"
            variant={view === "table" ? "secondary" : "ghost"}
            onClick={() => setView("table")}
          >
            <List />
            Tabela
          </Button>
          <Button
            aria-label="Visualizar em cards"
            aria-pressed={view === "cards"}
            size="sm"
            variant={view === "cards" ? "secondary" : "ghost"}
            onClick={() => setView("cards")}
          >
            <LayoutGrid />
            Cards
          </Button>
        </div>
      </div>
      {!rows.length ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <FileText className="mx-auto mb-4 text-muted-foreground" />
          <h2 className="section-title">Nenhum documento encontrado</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ajuste os filtros ou crie um documento, se tiver permissão.
          </p>
        </div>
      ) : view === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((d) => (
            <Link
              key={d.id}
              href={`/${library}/${d.id}`}
              className="rounded-xl border bg-card p-5 transition-colors hover:border-primary"
            >
              <FileText className="mb-6 text-primary" />
              <Badge>{d.status}</Badge>
              <h2 className="mt-3 text-lg font-semibold">{d.title}</h2>
              <p className="mt-3 text-xs text-muted-foreground">
                {d.category} · {d.audience.join(" / ")}
              </p>
              <p className="mt-3 text-xs">
                {d.tags.filter(Boolean).join(" · ")}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div
          className="overflow-x-auto rounded-xl border bg-card"
          role="region"
          aria-label="Tabela de documentos"
          tabIndex={0}
        >
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Biblioteca {libraryNames[library]}
            </caption>
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr>
                {[
                  "Documento",
                  "Categoria",
                  "Público",
                  "Status",
                  "Versão",
                  ...(store.manager ? ["Ações"] : []),
                ].map((t) => (
                  <th key={t} scope="col" className="p-4">
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className="border-t hover:bg-background">
                  <td className="min-w-56 p-4">
                    <Link
                      className="font-semibold hover:text-primary"
                      href={`/${library}/${d.id}`}
                    >
                      {d.title}
                    </Link>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {d.tags.filter(Boolean).join(" · ")}
                    </p>
                  </td>
                  <td className="p-4 text-xs">{d.category}</td>
                  <td className="p-4 text-xs">{d.audience.join(" / ")}</td>
                  <td className="whitespace-nowrap p-4">
                    <Badge>{d.status}</Badge>
                  </td>
                  <td className="p-4 text-xs">v{d.versions.length || 1}</td>
                  {store.manager && (
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Duplicar ${d.title}`}
                          onClick={() => store.duplicate(d.id)}
                        >
                          <Copy />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Arquivar ${d.title}`}
                          disabled={d.status === "Arquivada"}
                          onClick={() => {
                            if (
                              window.confirm(
                                "Arquivar este documento na demonstração?",
                              )
                            )
                              store.archive(d.id);
                          }}
                        >
                          <Archive />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
