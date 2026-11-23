import { documentsAccess } from "@/modules/documents/access";
import { demoDocuments } from "@/modules/documents/fixtures";
import { DocumentsProvider } from "@/modules/documents/store";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await documentsAccess();
  return (
    <DocumentsProvider
      key={access.key}
      initial={demoDocuments(access.manager, access.audience)}
      manager={access.manager}
      author={access.author}
    >
      {children}
    </DocumentsProvider>
  );
}
