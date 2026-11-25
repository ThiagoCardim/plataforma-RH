"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { type Scope, type Contract, admin, assert, uid } from "../career/model";
import { useLocalDemo, loadLocalDemo } from "../local-demo/use-local-demo";
import { type AcademyState, projection, visibleCourse } from "./model";
import { Pick, AreaField } from "./components";
import type {
  State as OnboardingState,
  Scope as OnboardingScope,
} from "../onboarding/model";
import { project as onboardingProjection } from "../onboarding/model";
import { type PdiState, pdiProjection } from "../pdi/model";
import {
  type CareerState,
  projection as careerProjection,
} from "../career/model";
import {
  type PerformanceState,
  projection as performanceProjection,
} from "../performance/model";
export type AcademyDestination = {
  id: string;
  name: string;
  kind: "onboarding" | "pdi" | "career" | "performance";
  contract?: Contract;
};
export type AcademyLink = {
  id: string;
  org: string;
  course: string;
  kind: AcademyDestination["kind"];
  target: string;
  note: string;
  by: string;
  at: string;
};
export function useAcademyLinks(scope: Scope) {
  return useLocalDemo<AcademyLink[]>(
    `academy-links-v1:${scope.key}`,
    [],
    (rows) => rows.filter((r) => r.org === scope.org),
  );
}
export function createAcademyLink(
  s: AcademyState,
  c: Scope,
  course: string,
  destination: AcademyDestination,
  note: string,
): AcademyLink {
  assert(
    s.org === c.org && (admin(c) || c.leader),
    "Referência fora do escopo.",
  );
  assert(
    admin(c) || destination.kind !== "career",
    "Somente gestão vincula recursos à estrutura de carreira.",
  );
  assert(
    admin(c) || c.contract !== "PJ" || destination.kind !== "performance",
    "Avaliações internas não estão disponíveis a PJ.",
  );
  const x = s.courses.find((x) => x.id === course);
  assert(
    x?.published && x.state !== "Arquivado",
    "Vincule conteúdo publicado e disponível.",
  );
  assert(
    !destination.contract ||
      (x.published.audience.contracts.includes(destination.contract) &&
        (destination.contract !== "PJ" ||
          x.published.audience.serviceRelevant)),
    "Conteúdo incompatível com o vínculo do destino.",
  );
  assert(
    note.trim() && destination.id,
    "Informe destino e contexto de aprendizagem.",
  );
  return {
    id: uid(),
    org: c.org,
    course,
    kind: destination.kind,
    target: destination.id,
    note,
    by: c.name,
    at: new Date().toISOString(),
  };
}
export function AcademyReferences({
  scope,
  kind,
  target,
}: {
  scope: Scope;
  kind: AcademyDestination["kind"];
  target: string;
}) {
  const refs = useAcademyLinks(scope),
    [catalog, setCatalog] = useState<AcademyState | null>(null);
  useEffect(() => {
    let alive = true;
    loadLocalDemo<AcademyState>(`academy-v1:${scope.key}`)
      .then((s) => {
        if (alive && s) setCatalog(projection(s, scope));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [scope]);
  const rows = refs.value.filter((r) => r.kind === kind && r.target === target);
  return (
    <section className="mt-5 rounded-xl border border-orange-200 bg-orange-50/40 p-4">
      <h4 className="text-sm font-semibold">Recursos da YouCon Academy</h4>
      {refs.error && <p className="mt-2 text-sm text-rose-800">{refs.error}</p>}
      {rows.length ? (
        rows.map((r) => {
          const x = catalog?.courses.find((c) => c.id === r.course),
            readable =
              x &&
              catalog &&
              (admin(scope) || visibleCourse(catalog, scope, x));
          return (
            <article key={r.id} className="mt-3 rounded-xl border bg-card p-4">
              <p className="text-sm font-semibold">
                {readable
                  ? x.published?.title
                  : "Conteúdo indisponível neste perfil ou navegador"}
              </p>
              <p className="mt-2 text-sm leading-6">{r.note}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {r.by} · {new Date(r.at).toLocaleDateString("pt-BR")} ·
                referência ao catálogo, sem conclusão ou progressão automática
              </p>
              {readable && (
                <Link
                  href={`/youcon-academy?content=${encodeURIComponent(r.course)}`}
                  className="mt-3 inline-block text-sm text-primary underline"
                >
                  Abrir conteúdo na Academy
                </Link>
              )}
            </article>
          );
        })
      ) : (
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Os conteúdos podem ser vinculados pela gestão, sem duplicar aulas ou
          alterar avaliações, ações ou cargos.
        </p>
      )}
      <Link
        href="/youcon-academy"
        className="mt-3 inline-block text-sm font-medium text-primary underline"
      >
        Explorar YouCon Academy
      </Link>
    </section>
  );
}
export function AcademyLinkEditor({
  scope,
  state,
  course,
  initial,
  add,
}: {
  scope: Scope;
  state: AcademyState;
  course: string;
  initial: AcademyDestination[];
  add: (link: AcademyLink) => void;
}) {
  const [targets, setTargets] = useState(initial),
    [kind, setKind] = useState<AcademyDestination["kind"]>("pdi"),
    [target, setTarget] = useState(""),
    [note, setNote] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    const mode = admin(scope) ? "rh" : scope.leader ? "leader" : "professional";
    const onScope: OnboardingScope = {
      mode,
      user: scope.user,
      name: scope.name,
      key: `onboarding-v1:${scope.org}:${scope.user}:${mode}`,
    };
    Promise.all([
      loadLocalDemo<OnboardingState>(onScope.key),
      loadLocalDemo<PdiState>(`pdi-v1:${scope.key}`),
      admin(scope)
        ? loadLocalDemo<CareerState>(`career-v1:admin:${scope.key}`)
        : Promise.resolve(undefined),
      admin(scope) || scope.contract !== "PJ"
        ? loadLocalDemo<PerformanceState>(`performance-hall-v1:${scope.key}`)
        : Promise.resolve(undefined),
    ])
      .then(([on, pdi, career, perf]) => {
        if (!alive) return;
        const rows: AcademyDestination[] = [];
        const push = (
          kind: AcademyDestination["kind"],
          fallback: boolean,
          list: AcademyDestination[],
        ) =>
          rows.push(
            ...(fallback ? initial.filter((t) => t.kind === kind) : list),
          );
        push(
          "onboarding",
          !on,
          on
            ? onboardingProjection(on, onScope)
                .processes.filter((p) => !p.archived)
                .map((p) => ({
                  id: p.id,
                  name: `${p.name} · Onboarding`,
                  kind: "onboarding",
                  contract: p.contract,
                }))
            : [],
        );
        push(
          "pdi",
          !pdi,
          pdi
            ? pdiProjection(pdi, scope).plans.map((p) => ({
                id: p.id,
                name: `${pdi.people.find((x) => x.id === p.person)?.name} · ${p.cycle.name}`,
                kind: "pdi",
                contract: pdi.people.find((x) => x.id === p.person)?.contract,
              }))
            : [],
        );
        push(
          "career",
          !career,
          career
            ? careerProjection(career, scope)
                .roles.filter((r) => r.published)
                .map((r) => ({
                  id: r.id,
                  name: `${r.title} · ${career.sectors.find((s) => s.id === r.sector)?.name}`,
                  kind: "career",
                }))
            : [],
        );
        push(
          "performance",
          !perf,
          perf
            ? performanceProjection(perf, scope).evaluations.map((e) => ({
                id: e.id,
                name: `${perf.people.find((p) => p.id === e.person)?.name} · ${e.template.name} · ${e.cycle.name}`,
                kind: "performance",
                contract: perf.people.find((p) => p.id === e.person)?.contract,
              }))
            : [],
        );
        setTargets(rows);
      })
      .catch(() =>
        setError("Não foi possível carregar os destinos deste navegador."),
      );
    return () => {
      alive = false;
    };
  }, [scope, initial]);
  const modules = [
    { id: "onboarding", name: "Onboarding" },
    { id: "pdi", name: "PDI" },
    ...(admin(scope)
      ? [{ id: "career", name: "Plano de Carreira · cargo" }]
      : []),
    ...(admin(scope) || scope.contract !== "PJ"
      ? [{ id: "performance", name: "Avaliação de Desempenho" }]
      : []),
  ];
  return (
    <div className="space-y-4">
      <p className="rounded-xl bg-accent p-4 text-sm leading-6">
        O destino recebe uma referência ao conteúdo publicado. Nenhuma aula é
        duplicada. Não conclui etapas, não altera avaliações, não concede
        promoção e não atribui licença externa.
      </p>
      {error && (
        <p role="alert" className="text-sm text-rose-800">
          {error}
        </p>
      )}
      <Pick
        label="Módulo de destino Academy"
        value={kind}
        onChange={(v) => {
          setKind(v as typeof kind);
          setTarget("");
        }}
        options={modules}
      />
      <Pick
        label="Registro de destino Academy"
        value={target}
        onChange={setTarget}
        options={[
          { id: "", name: "Selecione" },
          ...targets.filter((t) => t.kind === kind),
        ]}
      />
      <AreaField
        label="Contexto da referência de aprendizagem"
        value={note}
        onChange={setNote}
      />
      <Button
        onClick={() => {
          try {
            const t = targets.find((t) => t.kind === kind && t.id === target);
            assert(t, "Destino inválido.");
            add(createAcademyLink(state, scope, course, t, note));
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        Vincular conteúdo da Academy
      </Button>
    </div>
  );
}
