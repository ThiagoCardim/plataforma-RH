/* eslint-disable @next/next/no-img-element -- Local blob images. */
import { type Block, safeLink } from "./model";
export function Body({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-5 leading-7">
      {blocks.map((b) =>
        b.type === "title" ? (
          <h2 key={b.id} className="mt-8 text-xl font-semibold tracking-tight">
            {b.text}
          </h2>
        ) : b.type === "list" ? (
          <ul key={b.id} className="list-disc space-y-2 pl-6">
            {b.text
              .split("\n")
              .filter(Boolean)
              .map((t, i) => (
                <li key={i}>{t}</li>
              ))}
          </ul>
        ) : b.type === "table" ? (
          <div key={b.id} className="overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Tabela do documento</caption>
              <tbody>
                {b.text.split("\n").map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    {row.split("|").map((v, j) =>
                      i === 0 ? (
                        <th key={j} className="bg-muted p-3">
                          {v}
                        </th>
                      ) : (
                        <td key={j} className="p-3">
                          {v}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : b.type === "link" ? (
          <p key={b.id}>
            {safeLink(b.url ?? "") ? (
              <a
                className="text-primary underline"
                href={safeLink(b.url ?? "")}
                target="_blank"
                rel="noopener noreferrer"
              >
                {b.text || b.url}
              </a>
            ) : (
              <span>{b.text} · Link indisponível</span>
            )}
          </p>
        ) : b.type === "image" ? (
          <figure key={b.id}>
            {b.url?.startsWith("blob:") ? (
              <img
                className="max-h-96 max-w-full rounded-xl"
                src={b.url}
                alt={b.text}
              />
            ) : (
              <p className="text-muted-foreground">
                Adicione uma imagem no editor.
              </p>
            )}
            <figcaption className="text-xs text-muted-foreground">
              {b.text}
            </figcaption>
          </figure>
        ) : (
          <p key={b.id} className="whitespace-pre-wrap">
            {b.text}
          </p>
        ),
      )}
    </div>
  );
}
