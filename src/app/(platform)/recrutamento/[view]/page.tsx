import { notFound } from "next/navigation";
import { recruitmentScope } from "@/modules/recruitment/access";
import { demoRecruitment } from "@/modules/recruitment/fixtures";
import { RecruitmentWorkspace } from "@/modules/recruitment/workspace";
import { views, type View } from "@/modules/recruitment/model";
export const metadata = { title: "Recrutamento e Seleção" };
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ view: string }>;
  searchParams: Promise<{
    vaga?: string;
    acesso?: string;
    assessment?: string;
    token?: string;
  }>;
}) {
  const p = await params;
  if (!views.some(([v]) => v === p.view)) notFound();
  const scope = await recruitmentScope(p.view as View),
    q = await searchParams;
  return (
    <RecruitmentWorkspace
      key={
        scope.key +
        ":" +
        p.view +
        ":" +
        (q.assessment ?? "") +
        ":" +
        (q.token ?? "") +
        ":" +
        (q.vaga ?? "") +
        ":" +
        (q.acesso ?? "")
      }
      scope={scope}
      initial={demoRecruitment(scope)}
      view={p.view as View}
      exclusive={typeof q.vaga === "string" ? q.vaga : undefined}
      token={typeof q.acesso === "string" ? q.acesso : undefined}
      assessment={typeof q.assessment === "string" ? q.assessment : undefined}
      assessmentToken={typeof q.token === "string" ? q.token : undefined}
    />
  );
}
