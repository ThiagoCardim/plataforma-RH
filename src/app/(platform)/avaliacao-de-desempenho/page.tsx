import { upcomingModules } from "@/modules/navigation/catalog";
import { renderUpcomingPage } from "@/modules/navigation/upcoming-page";
export const metadata = {
  title: upcomingModules["avaliacao-de-desempenho"].label,
};
export default async function Page() {
  return renderUpcomingPage("avaliacao-de-desempenho");
}
