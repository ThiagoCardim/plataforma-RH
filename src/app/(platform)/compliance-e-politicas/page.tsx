import { upcomingModules } from "@/modules/navigation/catalog";
import { renderUpcomingPage } from "@/modules/navigation/upcoming-page";
export const metadata = {
  title: upcomingModules["compliance-e-politicas"].label,
};
export default async function Page() {
  return renderUpcomingPage("compliance-e-politicas");
}
