import { upcomingModules } from "@/modules/navigation/catalog";
import { renderUpcomingPage } from "@/modules/navigation/upcoming-page";
export const metadata = { title: upcomingModules["home-office"].label };
export default async function Page() {
  return renderUpcomingPage("home-office");
}
