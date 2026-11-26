import { recruitmentWorkflowScope } from "@/modules/recruitment/access";
import { demoWorkflow } from "@/modules/recruitment/workflow-fixtures";
import { IntakePage } from "@/modules/recruitment/intake-page";
export const metadata = {
  title: "Cadastro demonstrativo · YouCon People",
  robots: { index: false, follow: false },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ admissao?: string; token?: string }>;
}) {
  const scope = await recruitmentWorkflowScope("configuracoes"),
    q = await searchParams;
  return (
    <IntakePage
      key={scope.key + q.admissao}
      initial={demoWorkflow(scope)}
      scope={scope}
      admission={q.admissao}
      token={q.token}
    />
  );
}
