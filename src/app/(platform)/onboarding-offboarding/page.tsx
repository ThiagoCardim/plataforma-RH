import { demoCulture } from "@/modules/culture/fixtures";
import { careerScope } from "@/modules/career/access";
import { requirePermission } from "@/modules/access/server";
import { demoOnboarding } from "@/modules/onboarding/fixtures";
import { type Scope } from "@/modules/onboarding/model";
import { OnboardingWorkspace } from "@/modules/onboarding/workspace";
export const metadata = { title: "Onboarding" };
export default async function Page() {
  const access = await requirePermission("home.view");
  const mode: Scope["mode"] =
    access.permissions.includes("people.management.view") &&
    access.roles.some((r) => r === "hr" || r === "director")
      ? "rh"
      : access.roles.includes("leadership")
        ? "leader"
        : "professional";
  const scope: Scope = {
    mode,
    user: access.user.id,
    name: access.displayName,
    key: `onboarding-v1:${access.organization.id}:${access.user.id}:${mode}`,
  };
  const academyScope = await careerScope();
  return (
    <OnboardingWorkspace
      academyScope={academyScope}
      initialCulture={demoCulture(academyScope)}
      key={scope.key}
      scope={scope}
      initial={demoOnboarding(scope)}
    />
  );
}
