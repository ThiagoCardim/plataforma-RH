import { careerScope } from "@/modules/career/access";
import { admin } from "@/modules/career/model";
import { demoCareer } from "@/modules/career/fixtures";
import { demoPdi } from "@/modules/pdi/fixtures";
import { demoPerformance } from "@/modules/performance/fixtures";
import { demoOnboarding } from "@/modules/onboarding/fixtures";
import type { Scope as OnboardingScope } from "@/modules/onboarding/model";
import { demoAcademy } from "@/modules/academy/fixtures";
import { AcademyWorkspace } from "@/modules/academy/workspace";
import type { AcademyDestination } from "@/modules/academy/links";
export const metadata = { title: "YouCon Academy" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ content?: string }>;
}) {
  const scope = await careerScope(),
    params = await searchParams;
  const targets: AcademyDestination[] = [];
  if (admin(scope) || scope.leader) {
    const mode: OnboardingScope["mode"] = admin(scope) ? "rh" : "leader";
    const on = demoOnboarding({
      mode,
      user: scope.user,
      name: scope.name,
      key: `onboarding-v1:${scope.org}:${scope.user}:${mode}`,
    });
    targets.push(
      ...on.processes
        .filter((p) => !p.archived)
        .map((p) => ({
          id: p.id,
          name: `${p.name} · Onboarding`,
          kind: "onboarding" as const,
          contract: p.contract,
        })),
    );
    const pdi = demoPdi(scope);
    targets.push(
      ...pdi.plans.map((p) => ({
        id: p.id,
        name: `${pdi.people.find((x) => x.id === p.person)?.name} · ${p.cycle.name}`,
        kind: "pdi" as const,
        contract: pdi.people.find((x) => x.id === p.person)?.contract,
      })),
    );
    if (admin(scope)) {
      const career = demoCareer(scope);
      targets.push(
        ...career.roles
          .filter((r) => r.published)
          .map((r) => ({
            id: r.id,
            name: `${r.title} · ${career.sectors.find((s) => s.id === r.sector)?.name}`,
            kind: "career" as const,
          })),
      );
    }
    if (admin(scope) || scope.contract !== "PJ") {
      const perf = demoPerformance(scope);
      targets.push(
        ...perf.evaluations.map((e) => ({
          id: e.id,
          name: `${perf.people.find((p) => p.id === e.person)?.name} · ${e.template.name} · ${e.cycle.name}`,
          kind: "performance" as const,
          contract: perf.people.find((p) => p.id === e.person)?.contract,
        })),
      );
    }
  }
  return (
    <AcademyWorkspace
      key={scope.key}
      scope={scope}
      initial={demoAcademy(scope)}
      targets={targets}
      initialContent={
        typeof params.content === "string" ? params.content : undefined
      }
    />
  );
}
