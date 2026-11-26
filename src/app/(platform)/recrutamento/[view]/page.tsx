import { notFound, redirect } from "next/navigation";
import { recruitmentWorkflowScope } from "@/modules/recruitment/access";
import { demoResumeDatabase } from "@/modules/recruitment/resume-fixtures";
import { OperationalWorkspace } from "@/modules/recruitment/operational-workspace";
import {
  workflowViews,
  type WorkflowView,
} from "@/modules/recruitment/workflow-types";
import { selectionDemoActor } from "@/modules/recruitment/selection-model";
export const metadata = { title: "Recrutamento e Seleção" };
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ view: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { view } = await params,
    q = await searchParams;
  const legacy: Record<string, WorkflowView> = {
    "visao-geral": "processo-seletivo",
    match: "processo-seletivo",
    modelos: "configuracoes",
    carreiras: "configuracoes",
  };
  if (legacy[view]) {
    const query = new URLSearchParams(
      Object.entries(q).filter(
        (r): r is [string, string] => typeof r[1] === "string",
      ),
    );
    redirect(
      `/recrutamento/${legacy[view]}${query.size ? "?" + query.toString() : ""}`,
    );
  }
  if (!workflowViews.some(([v]) => v === view)) notFound();
  const authenticatedScope = await recruitmentWorkflowScope(
    view as WorkflowView,
  );
  const selectionDemo = view === "processo-seletivo" && q.demonstracao === "rh";
  const scope = selectionDemo
    ? selectionDemoActor(authenticatedScope)
    : authenticatedScope;
  return (
    <OperationalWorkspace
      key={scope.key + view + q.assessment}
      scope={scope}
      authenticatedScope={authenticatedScope}
      selectionDemo={selectionDemo}
      initial={demoResumeDatabase(scope)}
      view={view as WorkflowView}
      assessment={q.assessment}
      assessmentToken={q.token}
    />
  );
}
