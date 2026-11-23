import "server-only";
import { requirePermission } from "@/modules/access/server";
export async function documentsAccess() {
  const access = await requirePermission("home.view");
  return {
    manager:
      access.permissions.includes("people.management.view") &&
      access.roles.some((r) => r === "hr" || r === "director"),
    audience: ({ clt: "CLT", intern: "Estágio", pj: "PJ" } as const)[
      access.membership.contract_type
    ],
    key: `${access.user.id}:${access.organization.id}`,
    author: access.displayName,
  };
}
