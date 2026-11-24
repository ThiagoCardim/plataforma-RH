import { redirect } from "next/navigation";
import { careerScope } from "@/modules/career/access";
import { admin } from "@/modules/career/model";
import { demoCareer } from "@/modules/career/fixtures";
import { CareerWorkspace } from "@/modules/career/workspace";
export const metadata = { title: "Plano de Carreira" };
export default async function Page() {
  const scope = await careerScope();
  if (!admin(scope) && scope.contract === "PJ") redirect("/acesso-negado");
  return (
    <CareerWorkspace
      key={scope.key}
      scope={scope}
      initial={demoCareer(scope)}
    />
  );
}
