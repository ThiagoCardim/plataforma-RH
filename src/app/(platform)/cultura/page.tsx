import { careerScope } from "@/modules/career/access";
import { demoCulture } from "@/modules/culture/fixtures";
import { CultureWorkspace } from "@/modules/culture/workspace";
import { culturalRecognitions } from "@/modules/culture/model";
import { demoPerformance } from "@/modules/performance/fixtures";
export const metadata = { title: "Cultura YouCon" };
export default async function Page() {
  const scope = await careerScope();
  return (
    <CultureWorkspace
      key={scope.key}
      scope={scope}
      initial={demoCulture(scope)}
      initialRecognitions={culturalRecognitions(demoPerformance(scope), scope)}
    />
  );
}
