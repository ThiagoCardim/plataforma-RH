import { redirect } from "next/navigation";
import { careerScope } from "@/modules/career/access";
import { admin } from "@/modules/career/model";
import { demoPdi } from "@/modules/pdi/fixtures";
import { PdiWorkspace } from "@/modules/pdi/workspace";
export const metadata = { title: "PDI" };
export default async function Page() {
  const scope = await careerScope();
  if (!admin(scope) && !scope.leader && scope.contract === "PJ")
    redirect("/acesso-negado");
  return (
    <PdiWorkspace key={scope.key} scope={scope} initial={demoPdi(scope)} />
  );
}
