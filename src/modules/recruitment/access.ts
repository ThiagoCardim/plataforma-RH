import "server-only";
import { redirect } from "next/navigation";
import { careerScope } from "../career/access";
import { type View, allowedView } from "./model";
export async function recruitmentScope(view: View) {
  const scope = await careerScope();
  if (!allowedView(scope, view)) redirect("/acesso-negado");
  return scope;
}

import { type WorkflowView } from "./workflow-types";
import { workflowAllowed } from "./workflow-model";
export async function recruitmentWorkflowScope(view: WorkflowView) {
  const scope = await careerScope();
  if (!workflowAllowed(scope, view)) redirect("/acesso-negado");
  return scope;
}
