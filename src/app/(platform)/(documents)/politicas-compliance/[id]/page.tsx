import { documentsAccess } from "@/modules/documents/access";
import { DocumentWorkspace } from "@/modules/documents/workspace";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await documentsAccess();
  const { id } = await params;
  return <DocumentWorkspace library="politicas-compliance" id={id} />;
}
