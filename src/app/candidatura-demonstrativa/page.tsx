import { recruitmentWorkflowScope } from "@/modules/recruitment/access";
import { demoResumeDatabase } from "@/modules/recruitment/resume-fixtures";
import { ResumeUpdatePage } from "@/modules/recruitment/resume-update-page";
import { IntakePage } from "@/modules/recruitment/intake-page";
export const metadata = {
  title: "Cadastro demonstrativo · YouCon People",
  robots: { index: false, follow: false },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    admissao?: string;
    token?: string;
    atualizar?: string;
  }>;
}) {
  const scope = await recruitmentWorkflowScope("configuracoes"),
    q = await searchParams;
  if (q.atualizar)
    return (
      <ResumeUpdatePage
        key={scope.key + q.atualizar + q.token}
        initial={demoResumeDatabase(scope)}
        scope={scope}
        request={q.atualizar}
        token={q.token ?? ""}
      />
    );
  return (
    <IntakePage
      key={scope.key + q.admissao}
      initial={demoResumeDatabase(scope)}
      scope={scope}
      admission={q.admissao}
      token={q.token}
    />
  );
}
