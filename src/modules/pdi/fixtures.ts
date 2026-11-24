import "server-only";
import { type Scope, uid, dateNow } from "../career/model";
import { peopleFor } from "../career/fixtures";
import {
  type PdiState,
  type Pdi,
  type PlanContent,
  pdiProjection,
} from "./model";
export function demoPdi(ctx: Scope): PdiState {
  const today = dateNow(),
    at = new Date().toISOString();
  const people = peopleFor(ctx).filter((p) => p.contract !== "PJ");
  const cycle = {
    id: "pdi-cycle-1",
    name: "Desenvolvimento contínuo · Demonstração",
    start: today.slice(0, 4) + "-01-01",
    end: today.slice(0, 4) + "-12-31",
    status: "Ativo" as const,
  };
  const plans: Pdi[] = people.slice(0, 4).map((person, i) => {
    const content: PlanContent = {
      title: "Autonomia e colaboração nas entregas",
      objective:
        "Ampliar a clareza de comunicação e a qualidade das revisões no contexto de atuação.",
      actions: [
        {
          id: uid(),
          title: "Organizar uma revisão acompanhada e registrar aprendizados",
          due: cycle.end,
          done: false,
          evidence: [],
        },
        {
          id: uid(),
          title: "Compartilhar uma prática útil com a equipe",
          due: cycle.end,
          done: i === 0,
          evidence: [],
        },
      ],
    };
    const approved = i === 0 || i === 1;
    return {
      id: `pdi-demo-${person.id}`,
      person: person.id,
      leader: person.leader,
      cycle: structuredClone(cycle),
      status: approved ? "Aprovado" : i === 2 ? "Em aprovação" : "Rascunho",
      draft: structuredClone(content),
      published: approved ? structuredClone(content) : undefined,
      versions: approved
        ? [
            {
              number: 1,
              at,
              by: "RH demonstrativo",
              content: structuredClone(content),
            },
          ]
        : [],
      feedbacks: approved
        ? [
            {
              id: uid(),
              at,
              by: "Liderança demonstrativa",
              text: "Vamos acompanhar os aprendizados e ajustar as ações durante as conversas de desenvolvimento.",
            },
          ]
        : [],
      history: [
        {
          id: uid(),
          at,
          by: "Liderança demonstrativa",
          text: "Plano fictício criado para desenvolvimento; sem solicitação ou indicação de promoção.",
        },
      ],
    };
  });
  return pdiProjection(
    {
      version: 1,
      org: ctx.org,
      people,
      cycles: [
        cycle,
        {
          ...cycle,
          id: "pdi-cycle-2",
          name: "Laboratório de desenvolvimento · Ciclo configurável",
        },
      ],
      plans,
    },
    ctx,
  );
}
