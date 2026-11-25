"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  ArrowRight,
  Building2,
  Flame,
  Mountain,
  Plus,
  Quote,
  Sparkles,
  Target,
  Heart,
  ImagePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Body } from "../documents/body";
import { Modal } from "../onboarding/components";
import { type Scope } from "../career/model";
import {
  type CultureContent,
  type Item,
  type CulturalRecognition,
  sectionAllows,
} from "./model";
export function Count({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null),
    [number, setNumber] = useState(value);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / 1000, 1);
        setNumber(Math.round(value * (1 - (1 - p) ** 3)));
        if (p < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    if (ref.current) observer.observe(ref.current);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);
  return (
    <span ref={ref} aria-label={value.toLocaleString("pt-BR")}>
      <span aria-hidden="true">{number.toLocaleString("pt-BR")}</span>
    </span>
  );
}
function Photo({ item, large = false }: { item: Item; large?: boolean }) {
  return item.image ? (
    <Image
      unoptimized
      width={1200}
      height={800}
      src={item.image.url}
      alt={item.subtitle || item.title}
      className={`w-full object-cover ${large ? "aspect-[4/5]" : "aspect-[16/10]"}`}
    />
  ) : (
    <div
      className={`culture-photo-placeholder flex flex-col items-center justify-center gap-4 p-7 text-center ${large ? "aspect-[4/5]" : "aspect-[16/10]"}`}
    >
      <ImagePlus size={32} strokeWidth={1} />
      <span className="text-xs uppercase tracking-[.18em]">
        Fotografia real a inserir
      </span>
    </div>
  );
}
export function CultureLanding({
  content,
  scope,
  editorial = false,
  recognitions = [],
  manual,
}: {
  content: CultureContent;
  scope: Scope;
  editorial?: boolean;
  recognitions?: CulturalRecognition[];
  manual: () => void;
}) {
  const [expanded, setExpanded] = useState<Item | null>(null);
  const sections = content.sections.filter((s) =>
    editorial ? s.visible : sectionAllows(s, scope),
  );
  return (
    <div className="culture-landing min-w-0 space-y-5">
      <section className="culture-hero relative isolate overflow-hidden rounded-[28px] bg-[#171716] text-white">
        {content.hero.image && (
          <Image
            unoptimized
            fill
            src={content.hero.image.url}
            alt=""
            className="-z-20 object-cover opacity-30"
          />
        )}
        <div aria-hidden="true" className="culture-orbit" />
        <div className="relative z-10 px-7 pb-10 pt-10 sm:px-12 sm:pb-12 sm:pt-14">
          <p className="text-xs font-semibold uppercase tracking-[.24em] text-orange-200">
            {content.hero.kicker}
          </p>
          <h2 className="mt-10 max-w-4xl text-[clamp(2.3rem,4.3vw,4.5rem)] font-semibold leading-[1.06] tracking-[-.055em]">
            {content.hero.title}
          </h2>
          <p className="mt-7 max-w-xl text-base leading-8 text-stone-300">
            {content.hero.subtitle}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="#culture-sections"
              className="inline-flex items-center gap-3 rounded-full bg-primary px-6 py-4 text-sm font-semibold text-white"
            >
              Explore nossa essência <ArrowDown size={16} />
            </a>
            {scope.contract !== "PJ" && (
              <Button
                variant="ghost"
                className="rounded-full text-white hover:bg-white/10 hover:text-white"
                onClick={manual}
              >
                Abrir o manual <ArrowUpRight size={16} />
              </Button>
            )}
          </div>
          <div className="mt-14 flex items-center gap-4 border-t border-white/15 pt-5 text-xs uppercase tracking-[.16em] text-stone-300">
            <span className="size-2 rounded-full bg-orange-500" />
            Arquitetura · Engenharia · Pessoas
          </div>
        </div>
      </section>
      {scope.contract === "PJ" && (
        <p className="rounded-xl border bg-card p-4 text-sm leading-6">
          Visão institucional para parceiros. Conteúdos culturais de empregados,
          rituais e ciência de compromissos não fazem parte desta experiência.
        </p>
      )}
      <nav
        aria-label="Seções da cultura"
        className="sticky top-0 z-10 flex gap-2 overflow-x-auto rounded-2xl border bg-background/95 p-3 backdrop-blur"
      >
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#culture-${s.id}`}
            className="shrink-0 rounded-full px-4 py-2 text-xs font-medium hover:bg-orange-50 hover:text-primary"
          >
            {s.layout}
          </a>
        ))}
      </nav>
      <div id="culture-sections" className="space-y-5">
        {sections.map((s, index) => (
          <section
            key={s.id}
            id={`culture-${s.id}`}
            className={`culture-section scroll-mt-24 overflow-hidden rounded-[28px] px-6 py-9 sm:p-10 ${s.theme === "Escura" ? "bg-[#191918] text-white" : s.theme === "Laranja" ? "bg-[#f2e4d7] text-[#24211d]" : "border bg-card text-foreground"}`}
          >
            <div className="mb-8 flex items-start justify-between gap-5">
              <div className="max-w-2xl">
                <p
                  className={`text-[10px] font-semibold uppercase tracking-[.23em] ${s.theme === "Escura" ? "text-orange-200" : "text-primary"}`}
                >
                  {s.eyebrow}
                </p>
                <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-.035em] sm:text-4xl">
                  {s.title}
                </h2>
                <p
                  className={`mt-4 text-sm leading-7 ${s.theme === "Escura" ? "text-stone-300" : "text-muted-foreground"}`}
                >
                  {s.summary}
                </p>
              </div>
              <span
                aria-hidden="true"
                className="hidden font-mono text-xs opacity-40 sm:block"
              >
                {String(index + 1).padStart(2, "0")} / YOUCON
              </span>
            </div>
            {s.blocks.length > 0 && (
              <div className="mb-7">
                <Body blocks={s.blocks} />
              </div>
            )}
            {s.layout === "Valores" ? (
              <div className="space-y-7">
                {[...new Set(s.items.map((i) => i.group || "Valores"))].map(
                  (group) => (
                    <div key={group}>
                      <h3 className="mb-4 text-xs font-semibold uppercase tracking-[.15em] text-muted-foreground">
                        {group}
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        {s.items
                          .filter((i) => (i.group || "Valores") === group)
                          .map((i, n) => (
                            <details
                              key={i.id}
                              className="culture-value group rounded-2xl border bg-background p-5 open:border-orange-300 open:bg-orange-50/40"
                            >
                              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                                <span className="flex items-center gap-4">
                                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-primary">
                                    {n % 2 ? (
                                      <Sparkles size={19} />
                                    ) : (
                                      <Flame size={19} />
                                    )}
                                  </span>
                                  <span className="text-lg font-semibold tracking-tight">
                                    {i.title}
                                  </span>
                                </span>
                                <Plus
                                  size={17}
                                  className="shrink-0 transition-transform group-open:rotate-45"
                                />
                              </summary>
                              <p className="mb-4 mt-5 text-sm leading-7 text-muted-foreground">
                                {i.subtitle}
                              </p>
                              <Body blocks={i.blocks} />
                              {!i.blocks.length && (
                                <p className="border-t pt-4 text-xs text-muted-foreground">
                                  Aguardando a explicação e os exemplos do
                                  Manual de Cultura.
                                </p>
                              )}
                            </details>
                          ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            ) : s.layout === "Fundadores" ? (
              <div className="grid gap-6 md:grid-cols-2">
                {s.items.map((i) => (
                  <button
                    key={i.id}
                    onClick={() => setExpanded(i)}
                    className="culture-lift overflow-hidden rounded-2xl border bg-background text-left"
                  >
                    <Photo item={i} />
                    <div className="p-6">
                      <Quote size={24} className="text-primary" />
                      <h3 className="mt-4 text-xl font-semibold">{i.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {i.subtitle}
                      </p>
                      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                        Abrir carta <ArrowUpRight size={16} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : s.layout === "Jornada" ? (
              <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
                {s.items.map((i) => (
                  <article
                    key={i.id}
                    className="rounded-2xl border border-white/15 bg-white/5 p-7"
                  >
                    <div className="flex items-center gap-3 text-orange-200">
                      <Building2 size={23} />
                      <span className="text-xs uppercase tracking-wider">
                        Objetivo institucional
                      </span>
                    </div>
                    <p className="mt-8 text-7xl font-semibold tracking-[-.06em]">
                      {i.target !== undefined ? (
                        <Count value={i.target} />
                      ) : (
                        "—"
                      )}
                    </p>
                    <h3 className="mt-5 text-lg font-medium">{i.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-stone-300">
                      {i.subtitle}
                    </p>
                    {i.current !== undefined && i.target ? (
                      <>
                        <div
                          role="progressbar"
                          aria-label={`Avanço de ${i.title}`}
                          aria-valuemin={0}
                          aria-valuemax={i.target}
                          aria-valuenow={i.current}
                          className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"
                        >
                          <div
                            className="h-full bg-orange-400"
                            style={{
                              width: `${(i.current / i.target) * 100}%`,
                            }}
                          />
                        </div>
                        <p className="mt-3 text-xs text-stone-300">
                          {i.current.toLocaleString("pt-BR")} registradas pela
                          gestão · sem projeção financeira
                        </p>
                      </>
                    ) : (
                      <p className="mt-6 text-xs text-stone-300">
                        Avanço atual a informar. Não representa resultado
                        realizado.
                      </p>
                    )}
                    <div className="mt-5">
                      <Body blocks={i.blocks} />
                    </div>
                  </article>
                ))}
                <div
                  className="culture-blueprint flex min-h-64 items-center justify-center rounded-2xl border border-white/15"
                  aria-hidden="true"
                >
                  <Building2 size={130} strokeWidth={0.6} />
                </div>
              </div>
            ) : s.layout === "Timeline" ? (
              <div className="relative space-y-5 border-l border-orange-300 pl-6">
                {s.items.length ? (
                  s.items.map((i) => (
                    <article
                      key={i.id}
                      className="relative rounded-xl border bg-background p-5"
                    >
                      <span className="absolute -left-[30px] top-6 size-3 rounded-full bg-orange-500" />
                      <p className="text-xs font-semibold text-primary">
                        {i.date || "Data a informar"}
                      </p>
                      <h3 className="mt-3 text-lg font-semibold">{i.title}</h3>
                      <p className="mb-4 mt-2 text-sm text-muted-foreground">
                        {i.subtitle}
                      </p>
                      <Body blocks={i.blocks} />
                    </article>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed p-7">
                    <p className="font-medium">
                      Cada capítulo merece uma história verdadeira.
                    </p>
                    <p className="mt-3 text-sm text-muted-foreground">
                      A linha do tempo está pronta para receber os marcos
                      confirmados da YouCon.
                    </p>
                  </div>
                )}
              </div>
            ) : s.layout === "Hall" ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  {recognitions.map((r) => (
                    <article
                      key={r.id}
                      className="rounded-2xl border border-white/15 bg-white/5 p-6"
                    >
                      <Heart className="text-orange-300" />
                      <p className="mt-4 text-xs uppercase tracking-wider text-orange-200">
                        Publicado no Hall · {r.month}
                      </p>
                      <h3 className="mt-3 text-xl font-semibold">{r.name}</h3>
                      <p className="mt-3 text-sm leading-7 text-stone-300">
                        {r.message}
                      </p>
                    </article>
                  ))}
                </div>
                {!recognitions.length && (
                  <p className="mb-5 text-sm text-stone-300">
                    Os destaques culturais publicados neste navegador aparecerão
                    aqui.
                  </p>
                )}
                <Link
                  href="/hall-de-destaques"
                  className="mt-5 inline-flex items-center gap-2 text-sm text-orange-200 underline"
                >
                  Visitar o Hall de Destaques <ArrowUpRight size={16} />
                </Link>
              </>
            ) : (
              <div
                className={`grid gap-4 ${s.layout === "Galeria" ? "sm:grid-cols-2" : "md:grid-cols-3"}`}
              >
                {s.items.map((i, n) => (
                  <article
                    key={i.id}
                    className={`culture-lift overflow-hidden rounded-2xl border ${s.theme === "Escura" ? "border-white/15 bg-white/5" : "bg-background/80"}`}
                  >
                    {(i.image || s.layout === "Galeria") && <Photo item={i} />}
                    <div className="p-6">
                      {s.layout === "Metas" ? (
                        <div className="mb-7 flex size-12 items-center justify-center rounded-xl bg-orange-100 text-primary">
                          {n === 0 ? (
                            <Mountain />
                          ) : n === 1 ? (
                            <Flame />
                          ) : (
                            <Target />
                          )}
                        </div>
                      ) : s.layout === "Pilares" ? (
                        <p className="mb-7 font-mono text-xs opacity-50">
                          0{n + 1} / DIREÇÃO
                        </p>
                      ) : null}
                      <h3 className="text-xl font-semibold">{i.title}</h3>
                      <p
                        className={`mb-4 mt-3 text-sm leading-7 ${s.theme === "Escura" ? "text-stone-300" : "text-muted-foreground"}`}
                      >
                        {i.subtitle}
                      </p>
                      {i.target !== undefined && (
                        <p className="mb-4 text-3xl font-semibold">
                          <Count value={i.target} />
                          <span className="ml-2 text-xs font-normal">
                            meta configurada
                          </span>
                        </p>
                      )}
                      <Body blocks={i.blocks} />
                      {s.layout === "Histórias" && (
                        <button
                          className="mt-4 inline-flex items-center gap-2 text-sm underline"
                          onClick={() => setExpanded(i)}
                        >
                          Ler história <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  </article>
                ))}
                {!s.items.length && !s.blocks.length && (
                  <div className="rounded-2xl border border-dashed p-6 md:col-span-3">
                    <p className="text-sm leading-7 opacity-70">
                      Espaço preparado para o conteúdo institucional aprovado.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
        ))}
      </div>
      <footer className="rounded-2xl border bg-card p-7 text-center">
        <p className="text-xs uppercase tracking-[.2em] text-primary">
          YouCon · Cultura viva
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Conteúdo institucional sob curadoria do RH. Fotografias e histórias
          reais serão inseridas com autorização.
        </p>
      </footer>
      {expanded && (
        <Modal title={expanded.title} close={() => setExpanded(null)}>
          <div className="space-y-6">
            {expanded.image && <Photo item={expanded} />}
            <p className="text-sm leading-7 text-muted-foreground">
              {expanded.subtitle}
            </p>
            {expanded.blocks.length ? (
              <Body blocks={expanded.blocks} />
            ) : (
              <p className="rounded-xl bg-accent p-5 text-sm leading-7">
                Conteúdo oficial ainda não disponibilizado. Este espaço está
                pronto para receber a carta ou história autorizada.
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
