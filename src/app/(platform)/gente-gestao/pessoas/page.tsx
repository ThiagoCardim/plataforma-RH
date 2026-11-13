import { requirePermission } from "@/modules/access/server";
import { PeopleList } from "@/modules/people/components/people-list";
export const metadata = { title: "Base Central de Pessoas" };
export default async function PeoplePage() {
  await requirePermission("people.management.view");
  return <PeopleList />;
}
