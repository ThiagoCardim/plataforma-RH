import { upcomingModules } from "@/modules/navigation/catalog";
import { renderUpcomingPage } from "@/modules/navigation/upcoming-page";
export const metadata = {
  title: upcomingModules["programa-de-indicacao-de-vagas"].label,
};
export default async function Page() {
  return renderUpcomingPage("programa-de-indicacao-de-vagas");
}
