"use client";
import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Trophy, Sparkles, Maximize2, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Award, type Member } from "./model";
const subscribe = (fn: () => void) => {
  const m = window.matchMedia("(prefers-reduced-motion: reduce)");
  m.addEventListener("change", fn);
  return () => m.removeEventListener("change", fn);
};
export function Portrait({
  photo,
  name,
  className = "",
}: {
  photo: string;
  name: string;
  className?: string;
}) {
  const match = photo.match(/^\/demo\/hall\/portraits\.png#([0-5])$/);
  if (match) {
    const index = Number(match[1]);
    return (
      <div
        role="img"
        aria-label={`Retrato fictício de ${name}, gerado por IA`}
        className={`bg-cover ${className}`}
        style={{
          backgroundImage: "url(/demo/hall/portraits.png)",
          backgroundSize: "auto 200%",
          backgroundPosition: `${className.includes("aspect-square") ? (index % 3) * 50 : [4.545, 50, 95.455][index % 3]}% ${index < 3 ? 0 : 100}%`,
        }}
      />
    );
  }
  // User-selected images are browser-local and never uploaded.
  return (
    <Image
      unoptimized
      width={600}
      height={750}
      alt={`Retrato demonstrativo de ${name}`}
      src={photo || "/demo/hall/portrait-0.svg"}
      className={`object-cover ${className}`}
    />
  );
}
export function Ceremony({
  awards,
  people,
  preview,
  close,
}: {
  awards: Award[];
  people: Member[];
  preview: boolean;
  close: () => void;
}) {
  const [index, setIndex] = useState(-1),
    [suspense, setSuspense] = useState(false);
  const root = useRef<HTMLDivElement>(null),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    first = useRef<HTMLButtonElement>(null);
  const reduced = useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
  const list = [...awards].sort(
    (a, b) => a.order - b.order || a.id.localeCompare(b.id),
  );
  const award = list[index],
    person = people.find((p) => p.id === award?.person),
    end = index >= list.length;
  useEffect(() => {
    const dialog = root.current;
    const previous = document.activeElement as HTMLElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const elements = root.current?.querySelectorAll<HTMLButtonElement>(
          "button:not(:disabled)",
        );
        if (!elements?.length) return;
        const first = elements[0],
          last = elements[elements.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      if (timer.current) clearTimeout(timer.current);
      if (document.fullscreenElement === dialog)
        void document.exitFullscreen().catch(() => {});
      previous?.focus();
    };
  }, [close]);
  function next() {
    if (suspense || end) return;
    if (reduced) {
      setIndex((i) => i + 1);
      return;
    }
    setSuspense(true);
    timer.current = setTimeout(() => {
      setIndex((i) => i + 1);
      setSuspense(false);
    }, 900);
  }
  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label="Cerimônia do Hall de Destaques"
      className="hall-ceremony fixed inset-0 z-[100] flex min-h-0 flex-col overflow-y-auto bg-[#11100e] text-[#f9efdb]"
    >
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-amber-100/10 p-4 sm:px-8">
        <div>
          <p className="text-sm font-semibold tracking-wider">
            YOUCON PEOPLE / MONTHLY
          </p>
          <p className="mt-1 text-xs text-amber-100/70">
            {preview
              ? "Pré-visualização privada · nada será publicado"
              : "Reconhecimentos já publicados"}{" "}
            · {Math.min(Math.max(index + 1, 0), list.length)} de {list.length}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            aria-label="Tela cheia da cerimônia"
            onClick={() => {
              void root.current?.requestFullscreen?.().catch(() => {});
            }}
          >
            <Maximize2 size={16} />
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              if (timer.current) clearTimeout(timer.current);
              setSuspense(false);
              setIndex(-1);
            }}
          >
            <RotateCcw size={16} />
            Reiniciar
          </Button>
          <Button
            ref={first}
            variant="secondary"
            aria-label="Fechar cerimônia"
            onClick={close}
          >
            <X size={18} />
          </Button>
        </div>
      </header>
      <main className="relative flex min-h-[65vh] flex-1 flex-col items-center justify-center px-5 py-8 sm:px-10">
        <div className="hall-aura pointer-events-none absolute inset-0" />
        {suspense ? (
          <div className="relative py-20 text-center">
            <div className="hall-suspense mx-auto flex size-32 items-center justify-center rounded-full border border-amber-300/50">
              <Sparkles size={44} className="text-amber-200" />
            </div>
            <p className="mt-9 text-sm uppercase tracking-[.3em] text-amber-200">
              Uma conquista merece ser celebrada
            </p>
            <h2 className="mt-5 text-3xl font-semibold sm:text-5xl">
              O próximo destaque é…
            </h2>
          </div>
        ) : award && person ? (
          <div
            key={award.id}
            className="hall-reveal relative grid w-full max-w-6xl items-center gap-8 md:grid-cols-[.8fr_1.2fr]"
          >
            <div className="relative mx-auto w-full max-w-sm">
              <div className="hall-portrait-glow absolute -inset-3 rounded-[2rem]" />
              <Portrait
                photo={award.photo}
                name={person.name}
                className="relative aspect-[4/5] w-full rounded-3xl border border-amber-200/40"
              />
              <span className="absolute -bottom-5 left-1/2 flex size-20 -translate-x-1/2 items-center justify-center rounded-full border border-amber-200 bg-gradient-to-br from-amber-100 via-amber-400 to-amber-700 text-stone-950 shadow-xl">
                <Trophy size={36} />
              </span>
            </div>
            <div className="relative pt-5 text-center md:text-left">
              <p className="text-sm font-medium uppercase tracking-[.25em] text-amber-200">
                {award.category.name}
              </p>
              <h2 className="mt-5 text-4xl font-semibold leading-tight sm:text-6xl">
                {person.name}
              </h2>
              <p className="mt-5 text-xl leading-relaxed text-amber-100/90">
                “{award.phrase}”
              </p>
              <p className="mt-6 text-base leading-8 text-stone-300">
                {award.message}
              </p>
              <p className="mt-7 inline-flex rounded-full border border-amber-200/25 bg-amber-200/10 px-4 py-2 text-sm text-amber-100">
                {award.category.badge} · {award.month}
              </p>
            </div>
            <div
              className="pointer-events-none absolute inset-0 overflow-hidden"
              aria-hidden="true"
            >
              {Array.from({ length: 34 }, (_, i) => (
                <span
                  key={i}
                  className="hall-confetti absolute top-0 h-3 w-1.5 rounded-sm"
                  style={{
                    left: `${(i * 17) % 100}%`,
                    background: i % 2 ? "#f4cc75" : "#e87726",
                    animationDelay: `${(i % 8) * 0.12}s`,
                    transform: `rotate(${i * 27}deg)`,
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="relative max-w-3xl py-16 text-center">
            <Trophy size={72} className="mx-auto text-amber-200" />
            <p className="mt-8 text-sm uppercase tracking-[.3em] text-amber-200">
              Hall de Destaques
            </p>
            <h2 className="mt-6 text-4xl font-semibold leading-tight sm:text-6xl">
              {end
                ? "Uma equipe. Muitas conquistas."
                : "O extraordinário acontece nas nossas entregas."}
            </h2>
            <p className="mt-6 text-base leading-8 text-stone-300">
              {end
                ? "Obrigado por construir os resultados que merecem ser celebrados."
                : `Vamos celebrar ${list.length} reconhecimentos, com atenção a cada história.`}
            </p>
          </div>
        )}
      </main>
      <footer className="relative z-10 flex flex-wrap items-center justify-center gap-4 border-t border-amber-100/10 p-5">
        <p className="text-sm text-stone-400" aria-live="polite">
          {suspense
            ? "Preparando revelação…"
            : award
              ? `${award.category.name}: ${person?.name}`
              : end
                ? "Apresentação concluída"
                : "Pronto para começar"}
        </p>
        <Button
          className="border border-amber-200 bg-gradient-to-r from-amber-200 to-amber-400 px-7 text-stone-950 hover:from-amber-100 hover:to-amber-300"
          disabled={suspense || end || !list.length}
          onClick={next}
        >
          {index < 0
            ? "Revelar primeiro destaque"
            : index + 1 < list.length
              ? "Revelar próximo destaque"
              : "Encerrar apresentação"}
        </Button>
        <p className="w-full text-center text-xs text-stone-400">
          Dados e retratos fictícios. Respeita a preferência de movimento
          reduzido. Esta apresentação não divulga nem publica resultados.
        </p>
      </footer>
    </div>
  );
}
