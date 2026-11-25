import { careerScope } from "@/modules/career/access";
import { demoPerformance } from "@/modules/performance/fixtures";
import { hallProjection } from "@/modules/performance/model";
import { HallWorkspace } from "@/modules/performance/hall";
export const metadata = { title: "Hall de Destaques" };
export default async function Page() {
  const scope = await careerScope();
  return (
    <HallWorkspace
      key={scope.key}
      scope={scope}
      initial={hallProjection(demoPerformance(scope), scope)}
    />
  );
}
