import { redirect } from "next/navigation";
import { careerScope } from "@/modules/career/access";
import { admin } from "@/modules/career/model";
import { demoCareer } from "@/modules/career/fixtures";
import { demoPdi } from "@/modules/pdi/fixtures";
import { demoPerformance } from "@/modules/performance/fixtures";
import { EvaluationWorkspace } from "@/modules/performance/evaluation";
export const metadata = { title: "Metas dos Líderes" };
export default async function Page() {
  const scope = await careerScope();
  if (!admin(scope)) redirect("/acesso-negado");
  const p = demoPdi(scope);
  return (
    <EvaluationWorkspace
      key={scope.key}
      goals
      scope={scope}
      initial={demoPerformance(scope)}
      bridgeTargets={{
        plans: p.plans.map((x) => ({
          id: x.id,
          person: x.person,
          name: `${p.people.find((v) => v.id === x.person)?.name} · ${x.cycle.name}`,
        })),
        cycles: demoCareer(scope)
          .finance!.cycles.filter((c) => c.status === "Aberto")
          .map((c) => ({ id: c.id, name: c.name })),
      }}
    />
  );
}
