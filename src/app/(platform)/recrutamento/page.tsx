import { redirect } from "next/navigation";
import { recruitmentScope } from "@/modules/recruitment/access";
export default async function Page() {
  await recruitmentScope("visao-geral");
  redirect("/recrutamento/processo-seletivo");
}
