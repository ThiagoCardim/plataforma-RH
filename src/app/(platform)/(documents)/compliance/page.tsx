import { documentsAccess } from "@/modules/documents/access";
import { DocumentWorkspace } from "@/modules/documents/workspace";
export const metadata = { title: "Compliance" };
export default async function Page() {
  await documentsAccess();
  return <DocumentWorkspace library="compliance" />;
}
