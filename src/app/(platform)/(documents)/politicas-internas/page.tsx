import { documentsAccess } from "@/modules/documents/access";
import { DocumentWorkspace } from "@/modules/documents/workspace";
export const metadata = { title: "Políticas Internas" };
export default async function Page() {
  await documentsAccess();
  return <DocumentWorkspace library="politicas-internas" />;
}
