import { requirePermission } from "@/modules/access/server";
import { DemoProvider } from "@/modules/people/components/demo-provider";
export default async function PeopleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await requirePermission("people.management.view");
  return (
    <DemoProvider
      key={`${access.user.id}:${access.organization.id}`}
      organizationId={access.organization.id}
      canEdit={access.roles.some(
        (role) => role === "hr" || role === "director",
      )}
    >
      {children}
    </DemoProvider>
  );
}
