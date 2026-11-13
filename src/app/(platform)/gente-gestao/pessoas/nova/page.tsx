import { requirePermission } from "@/modules/access/server";
import { PersonForm } from "@/modules/people/components/person-form";
export const metadata = { title: "Cadastrar pessoa" };
export default async function NewPersonPage() {
  await requirePermission("people.management.view");
  return <PersonForm />;
}
