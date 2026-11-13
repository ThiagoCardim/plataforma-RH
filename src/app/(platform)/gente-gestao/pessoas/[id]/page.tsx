import { requirePermission } from "@/modules/access/server";
import { PersonDetail } from "@/modules/people/components/person-detail";
export const metadata = { title: "Ficha da pessoa" };
export default async function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("people.management.view");
  const { id } = await params;
  return <PersonDetail key={id} personId={id} />;
}
