import { redirect } from "next/navigation";
import { careerScope } from "@/modules/career/access";
import { admin } from "@/modules/career/model";
import { demoPerformance } from "@/modules/performance/fixtures";
import { LeaderGoalsWorkspace } from "@/modules/performance/leader-goals";
export const metadata = { title: "Metas dos Líderes" };
export default async function Page() {
  const scope = await careerScope();
  if (!admin(scope) && (!scope.leader || scope.contract === "PJ"))
    redirect("/acesso-negado");
  return (
    <LeaderGoalsWorkspace
      key={scope.key}
      scope={scope}
      initial={demoPerformance(scope)}
    />
  );
}
