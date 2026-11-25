import "server-only";
import { redirect } from "next/navigation";
import { careerScope } from "../career/access";
import { type View, allowedView } from "./model";
export async function recruitmentScope(view: View) {
  const scope = await careerScope();
  if (!allowedView(scope, view)) redirect("/acesso-negado");
  return scope;
}
