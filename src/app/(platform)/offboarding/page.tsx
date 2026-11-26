import { careerScope } from "@/modules/career/access";
import { demoWorkflow } from "@/modules/recruitment/workflow-fixtures";
import { redirect } from "next/navigation";
import { requirePermission } from "@/modules/access/server";
import { type Scope } from "@/modules/onboarding/model";
import { OnboardingWorkspace } from "@/modules/onboarding/workspace";
import { demoOffboarding } from "@/modules/offboarding/fixtures";
export const metadata = { title: "Offboarding" };
export default async function Page() {
  const access = await requirePermission("home.view");
  const rh =
    access.permissions.includes("people.management.view") &&
    access.roles.some((r) => r === "hr" || r === "director");
  if (!rh && !access.roles.includes("leadership")) redirect("/acesso-negado");
  const mode: Scope["mode"] = rh ? "rh" : "leader";
  const scope: Scope = {
    journey: "offboarding",
    mode,
    user: access.user.id,
    name: access.displayName,
    key: `offboarding-v1:${access.organization.id}:${access.user.id}:${mode}`,
  };
  const recruitmentScope = await careerScope();
  return (
    <OnboardingWorkspace
      key={scope.key}
      scope={scope}
      initial={demoOffboarding(scope)}
      academyScope={recruitmentScope}
      initialRecruitment={
        recruitmentScope.rh ? demoWorkflow(recruitmentScope) : undefined
      }
    />
  );
}
