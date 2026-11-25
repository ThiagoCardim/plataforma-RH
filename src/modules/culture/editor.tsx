"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "../onboarding/components";
import { DocumentEditor } from "../documents/editor";
import { type Content, type Block } from "../documents/model";
import {
  TextField,
  AreaField,
  Pick,
  Check,
  Upload,
  Reorder as SharedReorder,
  move,
} from "../academy/components";
import { type Scope, type Contract, uid } from "../career/model";
import {
  type CultureContent,
  type CultureState,
  type Section,
  type Item,
  type Chapter,
  layouts,
  latest,
  employeeOnly,
  saveDraft,
  publish,
} from "./model";
export function CultureEditor({
  state,
  scope,
  act,
  preview,
}: {
  state: CultureState;
  scope: Scope;
  act: (fn: (s: CultureState) => CultureState, message?: string) => boolean;
  preview: (d: CultureContent) => void;
}) {
  const [d, set] = useState<CultureContent>(() =>
      structuredClone(state.draft ?? latest(state)!.content),
    ),
    [section, setSection] = useState(d.sections[0]?.id ?? ""),
    [note, setNote] = useState(""),
    [blockTarget, setBlockTarget] = useState<{
      title: string;
      blocks: Block[];
      save: (b: Block[]) => void;
    } | null>(null),
    [error, setError] = useState("");
  const s = d.sections.find((x) => x.id === section);
  const patch = (p: Partial<CultureContent>) => set({ ...d, ...p });
  const patchSection = (id: string, p: Partial<Section>) =>
    patch({
      sections: d.sections.map((s) => (s.id === id ? { ...s, ...p } : s)),
    });
  const patchItem = (id: string, p: Partial<Item>) =>
    s &&
    patchSection(s.id, {
      items: s.items.map((i) => (i.id === id ? { ...i, ...p } : i)),
    });
  const patchManual = (p: Partial<CultureContent["manual"]>) =>
    patch({ manual: { ...d.manual, ...p } });
  const patchChapter = (id: string, p: Partial<Chapter>) =>
    patchManual({
      chapters: d.manual.chapters.map((ch) =>
        ch.id === id ? { ...ch, ...p } : ch,
      ),
    });
  const editBlocks = (
    title: string,
    blocks: Block[],
    save: (b: Block[]) => void,
  ) => setBlockTarget({ title, blocks, save });
  async function example() {
    try {
      const r = await fetch("/demo/culture/manual-demo.pdf");
      if (!r.ok) throw new Error("Arquivo demonstrativo indisponível.");
      const blob = await r.blob();
      patchManual({
        title: "Manual de teste · não é o manual oficial",
        ready: false,
        pdf: {
          id: uid(),
          name: "manual-demonstrativo.pdf",
          size: blob.size,
          type: "application/pdf",
          url: URL.createObjectURL(blob),
        },
        chapters: [
          {
            id: uid(),
            title: "Sobre esta demonstração",
            blocks: [
              {
                id: uid(),
                type: "text",
                text: "Este material é fictício e serve apenas para testar a leitura, a troca de versões e o registro de ciência. Não contém orientações institucionais oficiais da YouCon.",
              },
            ],
          },
          {
            id: uid(),
            title: "Como testar a leitura",
            blocks: [
              {
                id: uid(),
                type: "list",
                text: "Abra os capítulos e o PDF.\nRegistre a ciência apenas para testar.\nConfira o mesmo registro no próprio Onboarding.",
              },
            ],
          },
        ],
      });
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Curadoria da Cultura</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Edite a apresentação. Salvar e publicar são ações independentes.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => preview(d)}>
              Prévia editorial
            </Button>
            <Button
              onClick={() =>
                act(
                  (x) => saveDraft(x, scope, d),
                  "Rascunho cultural salvo neste navegador.",
                )
              }
            >
              Salvar rascunho
            </Button>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            <TextField
              label="Resumo da publicação"
              value={note}
              onChange={setNote}
            />
          </div>
          <Button
            onClick={() =>
              act(
                (x) => publish(saveDraft(x, scope, d), scope, note),
                "Nova versão cultural publicada localmente.",
              )
            }
          >
            Publicar Cultura
          </Button>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <details className="rounded-2xl border bg-card p-5" open>
        <summary className="cursor-pointer font-semibold">
          Banner institucional
        </summary>
        <div className="mt-5 space-y-4">
          <TextField
            label="Chamada do banner"
            value={d.hero.kicker}
            onChange={(kicker) => patch({ hero: { ...d.hero, kicker } })}
          />
          <AreaField
            label="Título do banner"
            value={d.hero.title}
            onChange={(title) => patch({ hero: { ...d.hero, title } })}
          />
          <AreaField
            label="Apresentação do banner"
            value={d.hero.subtitle}
            onChange={(subtitle) => patch({ hero: { ...d.hero, subtitle } })}
          />
          <Upload
            label="Fotografia do banner"
            accept="image/png,image/jpeg,image/webp,image/gif"
            limit={4}
            onFile={(image) => patch({ hero: { ...d.hero, image } })}
          />
          {d.hero.image && (
            <Button
              variant="ghost"
              onClick={() => patch({ hero: { ...d.hero, image: undefined } })}
            >
              Remover fotografia do banner
            </Button>
          )}
        </div>
      </details>
      <div className="grid gap-5 lg:grid-cols-[270px_1fr]">
        <aside className="space-y-3 rounded-2xl border bg-card p-4">
          <h3 className="font-semibold">Seções da página</h3>
          <p className="text-xs leading-6 text-muted-foreground">
            A ordem abaixo define a página publicada. Ocultar preserva os
            conteúdos.
          </p>
          {d.sections.map((x, index) => (
            <div
              key={x.id}
              className={`rounded-xl border p-3 ${section === x.id ? "border-orange-300 bg-orange-50/40" : ""}`}
            >
              <button
                onClick={() => setSection(x.id)}
                className="w-full text-left text-sm font-medium"
              >
                {x.title}
                <span className="mt-1 block text-xs font-normal text-muted-foreground">
                  {x.layout} · {x.visible ? "Visível" : "Oculta"}
                </span>
              </button>
              <Reorder
                index={index}
                total={d.sections.length}
                name={`seção ${index + 1}`}
                change={(n) => patch({ sections: move(d.sections, index, n) })}
                remove={() => {
                  if (
                    confirm(
                      "Remover esta seção do rascunho? As versões publicadas serão preservadas.",
                    )
                  )
                    patch({
                      sections: d.sections.filter((s) => s.id !== x.id),
                    });
                }}
              />
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() => {
              const id = uid(),
                x: Section = {
                  id,
                  layout: "Apresentação",
                  title: "Nova seção",
                  eyebrow: "CULTURA",
                  summary: "",
                  visible: true,
                  theme: "Clara",
                  contracts: ["CLT", "Estágio"],
                  partnerRelevant: false,
                  items: [],
                  blocks: [],
                };
              patch({ sections: [...d.sections, x] });
              setSection(id);
            }}
          >
            Adicionar seção
          </Button>
        </aside>
        <div className="min-w-0 space-y-5">
          {s ? (
            <section className="space-y-5 rounded-2xl border bg-card p-5">
              <h3 className="text-xl font-semibold">Personalizar seção</h3>
              <TextField
                label="Título da seção"
                value={s.title}
                onChange={(title) => patchSection(s.id, { title })}
              />
              <TextField
                label="Chamada da seção"
                value={s.eyebrow}
                onChange={(eyebrow) => patchSection(s.id, { eyebrow })}
              />
              <AreaField
                label="Descrição da seção"
                value={s.summary}
                onChange={(summary) => patchSection(s.id, { summary })}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Pick
                  label="Apresentação da seção"
                  value={s.layout}
                  options={layouts.map((v) => ({ id: v, name: v }))}
                  onChange={(v) => {
                    const layout = v as Section["layout"];
                    patchSection(s.id, {
                      layout,
                      ...(employeeOnly({ ...s, layout })
                        ? {
                            contracts: s.contracts.filter((v) => v !== "PJ"),
                            partnerRelevant: false,
                          }
                        : {}),
                    });
                  }}
                />
                <Pick
                  label="Tema da seção"
                  value={s.theme}
                  options={["Clara", "Escura", "Laranja"].map((v) => ({
                    id: v,
                    name: v,
                  }))}
                  onChange={(v) =>
                    patchSection(s.id, { theme: v as Section["theme"] })
                  }
                />
              </div>
              <Check
                label="Exibir seção na página publicada"
                checked={s.visible}
                onChange={(visible) => patchSection(s.id, { visible })}
              />
              <fieldset className="space-y-3 rounded-xl border p-4">
                <legend className="px-2 text-sm font-medium">
                  Visibilidade por vínculo
                </legend>
                {(["CLT", "Estágio", "PJ"] as Contract[]).map((c) => (
                  <Check
                    key={c}
                    label={`Seção para ${c}`}
                    checked={s.contracts.includes(c)}
                    disabled={c === "PJ" && employeeOnly(s)}
                    onChange={(checked) =>
                      patchSection(s.id, {
                        contracts: checked
                          ? [...s.contracts, c]
                          : s.contracts.filter((v) => v !== c),
                      })
                    }
                  />
                ))}
                <Check
                  label="Conteúdo pertinente à parceria PJ"
                  checked={s.partnerRelevant}
                  disabled={employeeOnly(s)}
                  onChange={(partnerRelevant) =>
                    patchSection(s.id, { partnerRelevant })
                  }
                />
                <p className="text-xs leading-6 text-muted-foreground">
                  Valores, compromissos, rituais e Destaque Cultural são
                  exclusivos de empregados e estágio. Conteúdo para PJ exige
                  pertinência explícita à parceria.
                </p>
              </fieldset>
              <Button
                variant="outline"
                onClick={() =>
                  editBlocks(`Conteúdo: ${s.title}`, s.blocks, (blocks) =>
                    patchSection(s.id, { blocks }),
                  )
                }
              >
                Editar blocos da seção
              </Button>
              <div className="space-y-4">
                <h4 className="font-semibold">Cards, cartas e marcos</h4>
                {s.items.map((i, n) => (
                  <details key={i.id} className="rounded-xl border p-4">
                    <summary className="cursor-pointer font-medium">
                      {i.title}
                    </summary>
                    <div className="mt-5 space-y-4">
                      <Reorder
                        index={n}
                        total={s.items.length}
                        name={`card ${n + 1}`}
                        change={(at) =>
                          patchSection(s.id, { items: move(s.items, n, at) })
                        }
                        remove={() =>
                          patchSection(s.id, {
                            items: s.items.filter((x) => x.id !== i.id),
                          })
                        }
                      />
                      <TextField
                        label={`Título do card ${n + 1}`}
                        value={i.title}
                        onChange={(title) => patchItem(i.id, { title })}
                      />
                      <AreaField
                        label={`Descrição do card ${n + 1}`}
                        value={i.subtitle}
                        onChange={(subtitle) => patchItem(i.id, { subtitle })}
                      />
                      {s.layout === "Valores" && (
                        <TextField
                          label={`Grupo do valor ${n + 1}`}
                          value={i.group}
                          onChange={(group) => patchItem(i.id, { group })}
                        />
                      )}
                      <TextField
                        label={`Data ou marco do card ${n + 1}`}
                        value={i.date}
                        onChange={(date) => patchItem(i.id, { date })}
                      />
                      {["Metas", "Jornada"].includes(s.layout) && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <TextField
                            label={`Meta do card ${n + 1}`}
                            type="number"
                            min="0"
                            step="1"
                            value={i.target ?? ""}
                            onChange={(v) =>
                              patchItem(i.id, {
                                target: v === "" ? undefined : Number(v),
                              })
                            }
                          />
                          <TextField
                            label={`Avanço confirmado do card ${n + 1}`}
                            type="number"
                            min="0"
                            step="1"
                            value={i.current ?? ""}
                            onChange={(v) =>
                              patchItem(i.id, {
                                current: v === "" ? undefined : Number(v),
                              })
                            }
                          />
                        </div>
                      )}
                      <Upload
                        label={`Fotografia real do card ${n + 1}`}
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        limit={4}
                        onFile={(image) => patchItem(i.id, { image })}
                      />
                      {i.image && (
                        <Button
                          variant="ghost"
                          onClick={() => patchItem(i.id, { image: undefined })}
                        >
                          Remover fotografia do card {n + 1}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() =>
                          editBlocks(
                            `Conteúdo: ${i.title}`,
                            i.blocks,
                            (blocks) => patchItem(i.id, { blocks }),
                          )
                        }
                      >
                        Editar blocos do card {n + 1}
                      </Button>
                    </div>
                  </details>
                ))}
                <Button
                  variant="outline"
                  onClick={() =>
                    patchSection(s.id, {
                      items: [
                        ...s.items,
                        {
                          id: uid(),
                          title: "Novo card",
                          subtitle: "",
                          group:
                            s.layout === "Valores"
                              ? "Como vivemos na prática"
                              : "",
                          date: "",
                          blocks: [],
                        },
                      ],
                    })
                  }
                >
                  Adicionar card ou marco
                </Button>
              </div>
            </section>
          ) : (
            <p className="rounded-xl border p-5 text-sm">
              Selecione ou adicione uma seção.
            </p>
          )}
        </div>
      </div>
      <section className="space-y-5 rounded-2xl border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">Manual de Cultura</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Substituir o PDF ou o conteúdo cria outra versão do manual na
              próxima publicação. Publicar mudanças visuais não exige nova
              ciência.
            </p>
          </div>
          <Button variant="outline" onClick={example}>
            Carregar manual fictício de teste
          </Button>
        </div>
        <TextField
          label="Título do Manual de Cultura"
          value={d.manual.title}
          onChange={(title) => patchManual({ title })}
        />
        <Upload
          label="PDF do Manual de Cultura"
          accept="application/pdf,.pdf"
          onFile={async (pdf) => {
            const h = await fetch(pdf.url)
              .then((r) => r.blob())
              .then((b) => b.slice(0, 5).text());
            if (h !== "%PDF-") {
              setError("O arquivo não possui cabeçalho PDF válido.");
              return;
            }
            setError("");
            patchManual({ pdf });
          }}
        />
        {d.manual.pdf && (
          <div className="rounded-xl bg-muted p-4">
            <p className="text-sm">
              {d.manual.pdf.name} · {(d.manual.pdf.size / 1024).toFixed(1)} KB
            </p>
            <Button
              variant="ghost"
              onClick={() => patchManual({ pdf: undefined })}
            >
              Remover PDF do rascunho
            </Button>
          </div>
        )}
        <Check
          label="Conteúdo do manual conferido e disponível para leitura"
          checked={d.manual.ready}
          onChange={(ready) => patchManual({ ready })}
        />
        <p className="text-xs leading-6 text-muted-foreground">
          O arquivo de teste é explicitamente fictício. Não substitui o Manual
          de Cultura oficial. A ciência é destinada apenas a CLT e Estágio.
        </p>
        {d.manual.chapters.map((ch, n) => (
          <div key={ch.id} className="space-y-3 rounded-xl border p-4">
            <Reorder
              index={n}
              total={d.manual.chapters.length}
              name={`capítulo ${n + 1}`}
              change={(at) =>
                patchManual({ chapters: move(d.manual.chapters, n, at) })
              }
              remove={() =>
                patchManual({
                  chapters: d.manual.chapters.filter((x) => x.id !== ch.id),
                })
              }
            />
            <TextField
              label={`Nome do capítulo ${n + 1}`}
              value={ch.title}
              onChange={(title) => patchChapter(ch.id, { title })}
            />
            <Button
              variant="outline"
              onClick={() =>
                editBlocks(`Capítulo: ${ch.title}`, ch.blocks, (blocks) =>
                  patchChapter(ch.id, { blocks }),
                )
              }
            >
              Editar capítulo {n + 1}
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          onClick={() =>
            patchManual({
              chapters: [
                ...d.manual.chapters,
                { id: uid(), title: "Novo capítulo", blocks: [] },
              ],
            })
          }
        >
          Adicionar capítulo
        </Button>
      </section>
      {blockTarget && (
        <Modal title={blockTarget.title} close={() => setBlockTarget(null)}>
          <DocumentEditor
            blocksOnly
            allowVideo
            initial={
              {
                title: blockTarget.title,
                category: "Cultura",
                audience: ["CLT", "Estágio"],
                tags: [],
                status: "Rascunho",
                blocks: blockTarget.blocks,
                attachments: [],
                requireRead: false,
              } satisfies Content
            }
            onSave={(c) => {
              blockTarget.save(c.blocks);
              setBlockTarget(null);
            }}
            onCancel={() => setBlockTarget(null)}
          />
          <p className="mt-4 text-xs text-muted-foreground">
            Os blocos serão aplicados ao editor. Salve o rascunho ou publique
            para manter as alterações após recarregar.
          </p>
        </Modal>
      )}
    </div>
  );
}

function Reorder({
  index,
  total,
  name,
  change,
  remove,
}: {
  index: number;
  total: number;
  name: string;
  change: (at: number) => void;
  remove: () => void;
}) {
  return (
    <SharedReorder
      name={name}
      first={index === 0}
      last={index === total - 1}
      up={() => change(-1)}
      down={() => change(1)}
      remove={remove}
    />
  );
}
