import { requirePermission } from "@/modules/access/server";
import { type Scope } from "@/modules/home-office/model";
import { demoHomeOffice } from "@/modules/home-office/fixtures";
import { HomeOfficeWorkspace } from "@/modules/home-office/workspace";
export const metadata = { title: "Home Office" };
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
    user: access.user.id,
    name: access.displayName,
    org: access.organization.id,
    mode,
    key: `home-office-v1:${access.organization.id}:${access.user.id}:${mode}`,
  };
  return (
    <HomeOfficeWorkspace
      key={scope.key}
      scope={scope}
      initial={demoHomeOffice(scope)}
    />
  );
}
