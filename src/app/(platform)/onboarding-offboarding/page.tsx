import { upcomingModules } from "@/modules/navigation/catalog";
import { renderUpcomingPage } from "@/modules/navigation/upcoming-page";
export const metadata = {
  title: upcomingModules["onboarding-offboarding"].label,
};
export default async function Page() {
  return renderUpcomingPage("onboarding-offboarding");
}
