"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import {
  type Document,
  type Content,
  type Library,
  snapshot,
  differences,
} from "./model";
import { useLocalDemo } from "@/modules/local-demo/use-local-demo";
import { readable, readerProjection } from "./model";
type Store = {
  docs: Document[];
  manager: boolean;
  author: string;
  notice: string;
  save: (id: string, library: Library, data: Content) => boolean;
  duplicate: (id: string) => void;
  archive: (id: string) => void;
  confirm: (id: string) => void;
  track: (url: string) => void;
};
const Context = createContext<Store | null>(null);
export function DocumentsProvider({
  initial,
  persistenceKey,
  audience,
  manager,
  author,
  children,
}: {
  initial: Document[];
  persistenceKey: string;
  audience: string;
  manager: boolean;
  author: string;
  children: ReactNode;
}) {
  const {
    value: docs,
    setValue: setDocs,
    ready,
    error,
  } = useLocalDemo(persistenceKey, initial, (docs) =>
    manager
      ? docs
      : docs.filter((d) => readable(d, audience)).map(readerProjection),
  );
  const [notice, setNotice] = useState("");
  const urls = useRef<string[]>([]);
  useEffect(
    () => () => {
      urls.current.forEach((u) => URL.revokeObjectURL(u));
    },
    [],
  );
  function save(id: string, library: Library, data: Content) {
    if (!manager || !data.title.trim() || !data.audience.length) return false;
    setDocs((current) => {
      const old = current.find((d) => d.id === id && d.library === library);
      const content = snapshot(data);
      const changes = old ? differences(snapshot(old), content) : ["Criação"];
      if (old && !changes.length) return current;
      const version = {
        number: (old?.versions.length ?? 0) + 1,
        at: new Date().toISOString(),
        author,
        changes,
        content,
      };
      const next: Document = {
        ...content,
        id,
        library,
        versions: [...(old?.versions ?? []), version],
        published:
          content.status === "Ativa"
            ? snapshot(content)
            : content.status === "Arquivada"
              ? undefined
              : old?.published,
      };
      return old
        ? current.map((d) => (d.id === id ? next : d))
        : [next, ...current];
    });
    setNotice("Simulação salva neste navegador. Nenhuma gravação remota.");
    return true;
  }
  function duplicate(id: string) {
    if (!manager) return;
    const old = docs.find((d) => d.id === id);
    if (!old) return;
    save(crypto.randomUUID(), old.library, {
      ...snapshot(old),
      title: `${old.title} · cópia`,
      status: "Rascunho",
    });
  }
  function archive(id: string) {
    const old = docs.find((d) => d.id === id);
    if (old && manager)
      save(id, old.library, { ...snapshot(old), status: "Arquivada" });
  }
  function confirm(id: string) {
    setDocs((current) =>
      current.map((d) =>
        d.id === id ? { ...d, readVersion: d.versions.length || 1 } : d,
      ),
    );
    setNotice("Leitura confirmada somente nesta demonstração.");
  }
  if (!ready) return <p role="status">Carregando demonstração local…</p>;
  return (
    <Context
      value={{
        docs,
        manager,
        author,
        notice,
        save,
        duplicate,
        archive,
        confirm,
        track: (u) => urls.current.push(u),
      }}
    >
      <div className="mb-6 rounded-xl border border-orange-200 bg-accent p-4 text-xs leading-5 text-accent-foreground">
        <strong>Demonstração local · documentos fictícios</strong>
        <p>
          Alterações, arquivos e confirmações ficam apenas neste navegador. Não
          há sincronização entre contas ou dispositivos. Use apenas dados
          fictícios.
        </p>
      </div>
      <button
        className="mb-4 text-xs text-muted-foreground underline"
        onClick={() => {
          if (
            window.confirm(
              "Restaurar os documentos fictícios e descartar alterações locais?",
            )
          ) {
            setDocs(initial);
            setNotice("Documentos demonstrativos restaurados.");
          }
        }}
      >
        Restaurar demonstração de documentos
      </button>
      {error && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {error}
        </p>
      )}
      <p role="status" className="mb-4 text-xs text-emerald-800">
        {notice}
      </p>
      {children}
    </Context>
  );
}
export function useDocuments() {
  const store = useContext(Context);
  if (!store) throw new Error("Biblioteca indisponível");
  return store;
}
