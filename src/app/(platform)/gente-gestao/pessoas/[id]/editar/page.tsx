import { requirePermission } from "@/modules/access/server";
import { PersonForm } from "@/modules/people/components/person-form";
export const metadata = { title: "Editar pessoa" };
export default async function EditPersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("people.management.view");
  const { id } = await params;
  return <PersonForm key={id} personId={id} />;
}
