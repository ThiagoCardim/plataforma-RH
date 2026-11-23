import { redirect } from "next/navigation";
import { requirePermission } from "@/modules/access/server";
export const metadata = { title: "Colaboradores" };
export default async function Management() {
  await requirePermission("people.management.view");
  redirect("/gente-gestao/pessoas");
}
