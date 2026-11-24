import { documentsAccess } from "@/modules/documents/access";
import { DocumentWorkspace } from "@/modules/documents/workspace";
import { redirect } from "next/navigation";
export default async function Page() {
  const access = await documentsAccess();
  if (!access.manager) redirect("/acesso-negado");
  return <DocumentWorkspace library="politicas-compliance" id="novo" />;
}
