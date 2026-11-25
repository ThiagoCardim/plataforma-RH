"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileCard } from "@/modules/documents/file-card";
import {
  type AcademyState,
  type CourseData,
  type Block,
  type Module,
  defaultCertificate,
  kinds,
  documents,
} from "./model";
import { type Contract, uid } from "../career/model";
import {
  TextField,
  AreaField,
  Pick,
  Check,
  Upload,
  Cover,
  Reorder,
  move,
  sectors,
} from "./components";
const options = (s: readonly string[]) => s.map((v) => ({ id: v, name: v }));
export function newCourse(): CourseData {
  return {
    title: "",
    description: "",
    kind: "Treinamento gravado",
    category: "technical",
    instructor: "Instrutoria demonstrativa",
    difficulty: "Fundamentos",
    minutes: 60,
    tags: [],
    cover: { theme: "orange", icon: "book" },
    audience: {
      contracts: ["CLT", "Estágio"],
      sectors: [],
      people: [],
      serviceRelevant: false,
    },
    modules: [
      {
        id: uid(),
        name: "Comece por aqui",
        lessons: [
          {
            id: uid(),
            name: "Primeira aula",
            blocks: [
              {
                id: uid(),
                kind: "Texto",
                text: "Conheça o contexto e os objetivos desta aprendizagem.",
              },
            ],
          },
        ],
      },
    ],
    awardMode: "Certificado de conclusão",
    certificate: { ...defaultCertificate },
    featured: false,
  };
}
export function CourseEditor({
  state,
  initial,
  save,
}: {
  state: AcademyState;
  initial?: CourseData;
  save: (d: CourseData) => void;
}) {
  const [d, set] = useState(() => structuredClone(initial ?? newCourse())),
    [tab, setTab] = useState("Informações");
  const [tagsText, setTagsText] = useState(d.tags.join(", "));
  const patch = (p: Partial<CourseData>) => set({ ...d, ...p });
  const patchModule = (id: string, p: Partial<Module>) =>
    patch({
      modules: d.modules.map((m) => (m.id === id ? { ...m, ...p } : m)),
    });
  function lesson(
    mid: string,
    lid: string,
    p: Partial<Module["lessons"][number]>,
  ) {
    const m = d.modules.find((m) => m.id === mid)!;
    patchModule(mid, {
      lessons: m.lessons.map((l) => (l.id === lid ? { ...l, ...p } : l)),
    });
  }
  function block(mid: string, lid: string, bid: string, p: Partial<Block>) {
    const l = d.modules
      .find((m) => m.id === mid)!
      .lessons.find((l) => l.id === lid)!;
    lesson(mid, lid, {
      blocks: l.blocks.map((b) => (b.id === bid ? { ...b, ...p } : b)),
    });
  }
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        save({
          ...d,
          tags: tagsText
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        });
      }}
    >
      <p className="rounded-xl bg-accent p-4 text-sm leading-6">
        Editor local. Publicar é uma ação separada da gestão. Versões já
        utilizadas preservam o histórico de aprendizagem. Não inclua senhas ou
        dados reais.
      </p>
      <div className="flex gap-2 overflow-x-auto">
        {["Informações", "Aulas e blocos", "Documento de aprendizagem"].map(
          (t) => (
            <Button
              type="button"
              key={t}
              variant={t === tab ? "secondary" : "ghost"}
              onClick={() => setTab(t)}
            >
              {t}
            </Button>
          ),
        )}
      </div>
      {tab === "Informações" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Título do conteúdo"
              value={d.title}
              onChange={(title) => patch({ title })}
              required
            />
            <Pick
              label="Tipo do conteúdo"
              value={d.kind}
              onChange={(v) =>
                patch({
                  kind: v as CourseData["kind"],
                  external:
                    v === "Curso externo"
                      ? (d.external ?? {
                          platform: "",
                          vendor: "",
                          url: "",
                          instructions: "",
                        })
                      : undefined,
                  live:
                    v === "Treinamento ao vivo"
                      ? (d.live ?? {
                          date: "",
                          time: "14:00",
                          duration: 60,
                          format: "Online",
                          location: "",
                        })
                      : undefined,
                })
              }
              options={options(kinds)}
            />
            <Pick
              label="Categoria do conteúdo"
              value={d.category}
              onChange={(category) => patch({ category })}
              options={state.categories
                .filter((c) => c.active || c.id === d.category)
                .map((c) => ({ id: c.id, name: c.name }))}
            />
            <TextField
              label="Instrutor responsável"
              value={d.instructor}
              onChange={(instructor) => patch({ instructor })}
              required
            />
            <Pick
              label="Nível de dificuldade"
              value={d.difficulty}
              onChange={(v) =>
                patch({ difficulty: v as CourseData["difficulty"] })
              }
              options={options(["Fundamentos", "Intermediário", "Avançado"])}
            />
            <TextField
              label="Carga horária (minutos)"
              type="number"
              min="1"
              step="1"
              value={d.minutes}
              onChange={(v) => patch({ minutes: Number(v) })}
            />
            <TextField
              label="Tags (separadas por vírgula)"
              value={tagsText}
              onChange={setTagsText}
            />
            <Check
              label="Destacar no início da Academy"
              checked={d.featured}
              onChange={(featured) => patch({ featured })}
            />
          </div>
          <AreaField
            label="Descrição do conteúdo"
            value={d.description}
            onChange={(description) => patch({ description })}
          />
          <fieldset className="space-y-3 rounded-xl border p-4">
            <legend className="px-2 text-sm font-semibold">
              Público autorizado
            </legend>
            <div className="flex flex-wrap gap-5">
              {(["CLT", "Estágio", "PJ"] as Contract[]).map((v) => (
                <Check
                  key={v}
                  label={v}
                  checked={d.audience.contracts.includes(v)}
                  onChange={(checked) =>
                    patch({
                      audience: {
                        ...d.audience,
                        contracts: checked
                          ? [...d.audience.contracts, v]
                          : d.audience.contracts.filter((c) => c !== v),
                      },
                    })
                  }
                />
              ))}
            </div>
            <Check
              label="Conteúdo pertinente à prestação de serviços PJ"
              checked={d.audience.serviceRelevant}
              onChange={(serviceRelevant) =>
                patch({ audience: { ...d.audience, serviceRelevant } })
              }
            />
            <p className="text-xs text-muted-foreground">
              Sem setores selecionados: todos os setores elegíveis. Sem pessoas
              selecionadas: todo o público configurado. Licenças externas são
              atribuídas separadamente pela gestão.
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {sectors.map((v) => (
                <Check
                  key={v.id}
                  label={`Setor: ${v.name}`}
                  checked={d.audience.sectors.includes(v.id)}
                  onChange={(checked) =>
                    patch({
                      audience: {
                        ...d.audience,
                        sectors: checked
                          ? [...d.audience.sectors, v.id]
                          : d.audience.sectors.filter((x) => x !== v.id),
                      },
                    })
                  }
                />
              ))}
            </div>
            <details>
              <summary className="cursor-pointer text-sm font-medium">
                Restringir a profissionais específicos
              </summary>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {state.people.map((p) => (
                  <Check
                    key={p.id}
                    label={`Autorizar ${p.name}`}
                    checked={d.audience.people.includes(p.id)}
                    onChange={(checked) =>
                      patch({
                        audience: {
                          ...d.audience,
                          people: checked
                            ? [...d.audience.people, p.id]
                            : d.audience.people.filter((x) => x !== p.id),
                        },
                      })
                    }
                  />
                ))}
              </div>
            </details>
          </fieldset>
          <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
            <Cover cover={d.cover} title={d.title || "Seu próximo conteúdo"} />
            <div className="space-y-3">
              <Pick
                label="Tema da capa"
                value={d.cover.theme}
                onChange={(v) =>
                  patch({
                    cover: {
                      ...d.cover,
                      theme: v as CourseData["cover"]["theme"],
                    },
                  })
                }
                options={[
                  { id: "orange", name: "Laranja YouCon" },
                  { id: "ink", name: "Preto e neutros" },
                  { id: "sand", name: "Areia e arquitetura" },
                  { id: "blue", name: "Azul técnico" },
                  { id: "green", name: "Verde profundo" },
                ]}
              />
              <Pick
                label="Ícone da capa"
                value={d.cover.icon}
                onChange={(v) =>
                  patch({
                    cover: {
                      ...d.cover,
                      icon: v as CourseData["cover"]["icon"],
                    },
                  })
                }
                options={[
                  { id: "book", name: "Conhecimento" },
                  { id: "layers", name: "Camadas" },
                  { id: "play", name: "Vídeo" },
                  { id: "compass", name: "Exploração" },
                  { id: "sparkles", name: "Inspiração" },
                ]}
              />
              <Upload
                label="Capa demonstrativa local"
                accept="image/png,image/jpeg,image/webp"
                limit={4}
                onFile={(f) => patch({ cover: { ...d.cover, image: f.url } })}
              />
              {d.cover.image && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    patch({ cover: { ...d.cover, image: undefined } })
                  }
                >
                  Usar capa com gradiente
                </Button>
              )}
            </div>
          </div>
          {d.external && (
            <section className="space-y-4 rounded-xl border bg-violet-50/30 p-4">
              <h3 className="font-semibold">
                Acesso externo · sem credenciais
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Plataforma externa"
                  value={d.external.platform}
                  onChange={(v) =>
                    patch({ external: { ...d.external!, platform: v } })
                  }
                />
                <TextField
                  label="Fornecedor"
                  value={d.external.vendor}
                  onChange={(v) =>
                    patch({ external: { ...d.external!, vendor: v } })
                  }
                />
              </div>
              <TextField
                label="Link externo sem credenciais"
                value={d.external.url}
                onChange={(url) => patch({ external: { ...d.external!, url } })}
              />
              <AreaField
                label="Orientações de acesso (não inclua senhas)"
                value={d.external.instructions}
                onChange={(instructions) =>
                  patch({ external: { ...d.external!, instructions } })
                }
              />
              <p className="text-xs text-muted-foreground">
                Investimento, vigência e licenças são configurados no painel
                gerencial e não fazem parte do conteúdo público.
              </p>
            </section>
          )}
          {d.live && (
            <section className="space-y-4 rounded-xl border p-4">
              <h3 className="font-semibold">
                Treinamento ao vivo · America/Sao_Paulo
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Data do treinamento"
                  type="date"
                  value={d.live.date}
                  onChange={(date) => patch({ live: { ...d.live!, date } })}
                />
                <TextField
                  label="Horário de Brasília"
                  type="time"
                  value={d.live.time}
                  onChange={(time) => patch({ live: { ...d.live!, time } })}
                />
                <TextField
                  label="Duração da sessão (minutos)"
                  type="number"
                  min="1"
                  value={d.live.duration}
                  onChange={(v) =>
                    patch({ live: { ...d.live!, duration: Number(v) } })
                  }
                />
                <Pick
                  label="Formato do encontro"
                  value={d.live.format}
                  onChange={(v) =>
                    patch({
                      live: {
                        ...d.live!,
                        format: v as "Online" | "Presencial",
                      },
                    })
                  }
                  options={options(["Online", "Presencial"])}
                />
              </div>
              <TextField
                label="Local ou link da reunião"
                value={d.live.location}
                onChange={(location) =>
                  patch({ live: { ...d.live!, location } })
                }
              />
            </section>
          )}
        </>
      )}
      {tab === "Aulas e blocos" && (
        <>
          <p className="text-sm leading-6 text-muted-foreground">
            Intercale conteúdos e reordene módulos, aulas e blocos.
            Questionários são demonstrativos, com correção local e tentativas
            registradas.
          </p>
          {d.modules.map((m, mi) => (
            <section
              key={m.id}
              className="space-y-4 rounded-2xl border bg-muted/25 p-4"
            >
              <div className="flex items-center justify-between">
                <Badge>Módulo {mi + 1}</Badge>
                <Reorder
                  name={`módulo ${mi + 1}`}
                  first={mi === 0}
                  last={mi === d.modules.length - 1}
                  up={() => patch({ modules: move(d.modules, mi, -1) })}
                  down={() => patch({ modules: move(d.modules, mi, 1) })}
                  remove={() =>
                    patch({ modules: d.modules.filter((x) => x.id !== m.id) })
                  }
                />
              </div>
              <TextField
                label={`Nome do módulo ${mi + 1}`}
                value={m.name}
                onChange={(name) => patchModule(m.id, { name })}
              />
              {m.lessons.map((l, li) => (
                <article
                  key={l.id}
                  className="space-y-4 rounded-xl border bg-card p-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Aula {li + 1}</h4>
                    <Reorder
                      name={`aula ${mi + 1}.${li + 1}`}
                      first={li === 0}
                      last={li === m.lessons.length - 1}
                      up={() =>
                        patchModule(m.id, { lessons: move(m.lessons, li, -1) })
                      }
                      down={() =>
                        patchModule(m.id, { lessons: move(m.lessons, li, 1) })
                      }
                      remove={() =>
                        patchModule(m.id, {
                          lessons: m.lessons.filter((x) => x.id !== l.id),
                        })
                      }
                    />
                  </div>
                  <TextField
                    label={`Nome da aula ${mi + 1}.${li + 1}`}
                    value={l.name}
                    onChange={(name) => lesson(m.id, l.id, { name })}
                  />
                  {l.blocks.map((b, bi) => (
                    <div key={b.id} className="space-y-3 rounded-xl border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge>
                          {b.kind} · bloco {bi + 1}
                        </Badge>
                        <Reorder
                          name={`bloco ${mi + 1}.${li + 1}.${bi + 1}`}
                          first={bi === 0}
                          last={bi === l.blocks.length - 1}
                          up={() =>
                            lesson(m.id, l.id, {
                              blocks: move(l.blocks, bi, -1),
                            })
                          }
                          down={() =>
                            lesson(m.id, l.id, {
                              blocks: move(l.blocks, bi, 1),
                            })
                          }
                          remove={() =>
                            lesson(m.id, l.id, {
                              blocks: l.blocks.filter((x) => x.id !== b.id),
                            })
                          }
                        />
                      </div>
                      <AreaField
                        label={`Conteúdo ${mi + 1}.${li + 1}.${bi + 1}`}
                        value={b.text}
                        onChange={(text) => block(m.id, l.id, b.id, { text })}
                      />
                      {["Vídeo", "Imagem", "Apresentação", "Arquivo"].includes(
                        b.kind,
                      ) && (
                        <>
                          <Upload
                            label={`Arquivo do bloco ${mi + 1}.${li + 1}.${bi + 1}`}
                            accept={
                              b.kind === "Imagem"
                                ? "image/png,image/jpeg,image/webp"
                                : b.kind === "Vídeo"
                                  ? "video/mp4,video/webm"
                                  : undefined
                            }
                            limit={b.kind === "Vídeo" ? 25 : 10}
                            onFile={(file) =>
                              block(m.id, l.id, b.id, { file, url: undefined })
                            }
                          />
                          {b.file && (
                            <div>
                              <FileCard file={b.file} />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  block(m.id, l.id, b.id, { file: undefined })
                                }
                              >
                                Remover arquivo do bloco
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                      {["Vídeo", "Apresentação", "Link"].includes(b.kind) && (
                        <TextField
                          label={`Link do bloco ${mi + 1}.${li + 1}.${bi + 1}`}
                          value={b.url ?? ""}
                          onChange={(url) => block(m.id, l.id, b.id, { url })}
                        />
                      )}{" "}
                      {b.kind === "Questionário" && b.question && (
                        <>
                          <AreaField
                            label={`Alternativas ${mi + 1}.${li + 1}.${bi + 1} (uma por linha)`}
                            value={b.question.options.join("\n")}
                            onChange={(v) =>
                              block(m.id, l.id, b.id, {
                                question: {
                                  ...b.question!,
                                  options: v.split("\n"),
                                },
                              })
                            }
                          />
                          <Pick
                            label={`Resposta correta ${mi + 1}.${li + 1}.${bi + 1}`}
                            value={String(b.question.correct)}
                            onChange={(v) =>
                              block(m.id, l.id, b.id, {
                                question: {
                                  ...b.question!,
                                  correct: Number(v),
                                },
                              })
                            }
                            options={b.question.options.map((v, i) => ({
                              id: String(i),
                              name: v || `Alternativa ${i + 1}`,
                            }))}
                          />
                          <Check
                            label={`Exigir resposta correta no bloco ${mi + 1}.${li + 1}.${bi + 1}`}
                            checked={b.question.requireCorrect}
                            onChange={(requireCorrect) =>
                              block(m.id, l.id, b.id, {
                                question: { ...b.question!, requireCorrect },
                              })
                            }
                          />
                        </>
                      )}
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        "Texto",
                        "Vídeo",
                        "Imagem",
                        "Apresentação",
                        "Arquivo",
                        "Link",
                        "Questionário",
                      ] as Block["kind"][]
                    ).map((kind) => (
                      <Button
                        type="button"
                        key={kind}
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          lesson(m.id, l.id, {
                            blocks: [
                              ...l.blocks,
                              {
                                id: uid(),
                                kind,
                                text:
                                  kind === "Questionário"
                                    ? "Pergunta demonstrativa"
                                    : "",
                                question:
                                  kind === "Questionário"
                                    ? {
                                        options: [
                                          "Alternativa A",
                                          "Alternativa B",
                                        ],
                                        correct: 0,
                                        requireCorrect: false,
                                      }
                                    : undefined,
                              },
                            ],
                          })
                        }
                      >
                        + {kind}
                      </Button>
                    ))}
                  </div>
                </article>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  patchModule(m.id, {
                    lessons: [
                      ...m.lessons,
                      {
                        id: uid(),
                        name: "Nova aula",
                        blocks: [
                          {
                            id: uid(),
                            kind: "Texto",
                            text: "Conteúdo demonstrativo.",
                          },
                        ],
                      },
                    ],
                  })
                }
              >
                Adicionar aula ao módulo {mi + 1}
              </Button>
            </section>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              patch({
                modules: [
                  ...d.modules,
                  {
                    id: uid(),
                    name: "Novo módulo",
                    lessons: [
                      {
                        id: uid(),
                        name: "Nova aula",
                        blocks: [
                          {
                            id: uid(),
                            kind: "Texto",
                            text: "Conteúdo demonstrativo.",
                          },
                        ],
                      },
                    ],
                  },
                ],
              })
            }
          >
            Adicionar módulo
          </Button>
        </>
      )}
      {tab === "Documento de aprendizagem" && (
        <section className="space-y-4 rounded-2xl border p-5">
          <Pick
            label="Documento ao concluir"
            value={d.awardMode}
            onChange={(v) => patch({ awardMode: v as CourseData["awardMode"] })}
            options={options(documents)}
          />
          <p className="text-sm leading-6 text-muted-foreground">
            Emissão exclusivamente demonstrativa. Cursos externos e atividades
            práticas aguardam validação da gestão. Não gera pontos no Hall,
            elegibilidade ou promoção.
          </p>
          <TextField
            label="Título do modelo visual"
            value={d.certificate.title}
            onChange={(title) =>
              patch({ certificate: { ...d.certificate, title } })
            }
          />
          <TextField
            label="Subtítulo do documento"
            value={d.certificate.subtitle}
            onChange={(subtitle) =>
              patch({ certificate: { ...d.certificate, subtitle } })
            }
          />
          <TextField
            label="Assinatura demonstrativa"
            value={d.certificate.signature}
            onChange={(signature) =>
              patch({ certificate: { ...d.certificate, signature } })
            }
          />
          <AreaField
            label="Rodapé do documento"
            value={d.certificate.footer}
            onChange={(footer) =>
              patch({ certificate: { ...d.certificate, footer } })
            }
          />
          <TextField
            label="Cor do modelo"
            type="color"
            value={d.certificate.color}
            onChange={(color) =>
              patch({ certificate: { ...d.certificate, color } })
            }
          />
        </section>
      )}
      <footer className="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t bg-card/95 py-4">
        <Button type="submit">Salvar rascunho do conteúdo</Button>
      </footer>
    </form>
  );
}
