import "server-only";
import { requirePermission } from "@/modules/access/server";
import type { Scope } from "./model";
export async function careerScope(): Promise<Scope> {
  const a = await requirePermission("home.view");
  const management = a.permissions.includes("people.management.view");
  return {
    user: a.user.id,
    name: a.displayName,
    org: a.organization.id,
    rh: management && a.roles.includes("hr"),
    director: management && a.roles.includes("director"),
    leader: a.roles.includes("leadership"),
    contract: ({ clt: "CLT", intern: "Estágio", pj: "PJ" } as const)[
      a.membership.contract_type
    ],
    key: `${a.organization.id}:${a.user.id}:${[...a.roles].sort().join(",")}:${a.membership.contract_type}`,
  };
}
