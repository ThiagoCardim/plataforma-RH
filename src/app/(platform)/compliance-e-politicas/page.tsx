import { redirect } from "next/navigation";
import { requirePermission } from "@/modules/access/server";
export default async function Page() {
  await requirePermission("people.management.view");
  redirect("/compliance");
}
