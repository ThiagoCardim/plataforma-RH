import { upcomingModules } from "@/modules/navigation/catalog";
import { renderUpcomingPage } from "@/modules/navigation/upcoming-page";
export const metadata = { title: upcomingModules["plano-de-carreira"].label };
export default async function Page() {
  return renderUpcomingPage("plano-de-carreira");
}
