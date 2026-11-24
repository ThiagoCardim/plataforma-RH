import "server-only";
import {
  type State,
  type Scope,
  type Person,
  type Report,
  type Payload,
  type Period,
  day,
  shift,
  weekday,
  key,
  occurrence,
  project,
} from "./model";
export const initialRules = `Home Office na YouCon

1. Modalidades e escalas
Remoto permanente possui acordo com vigência e fica dispensado de relatório diário. Híbrido fixo segue os dias da semana cadastrados e exige relatório em cada ocorrência. Home office eventual depende de autorização registrada. Trocas alteram apenas a data escolhida.

2. Combinados e confirmações
O combinado pode acontecer fora da plataforma. RH ou liderança devem registrá-lo para que apareça na escala. Uma data sinalizada pelo profissional permanece pendente até a confirmação; apenas dias autorizados exigem relatório.

3. Relatório objetivo
Registre por período a atividade ou projeto, o que realizou e o resultado. Informe impedimentos e pendências quando existirem. Referências de entregas são opcionais. Não é necessário produzir textos extensos; dê contexto suficiente para a liderança conferir.

4. Prazo
Salve rascunhos no decorrer do dia e envie na própria data até 23h59, no horário de Brasília. O envio original é bloqueado no dia seguinte. Uma justificativa posterior não apaga o atraso.

5. Revisão
A liderança confere primeiro e o RH valida em seguida. Os revisores podem pedir esclarecimentos. Complementações ficam separadas do original, com autor e data. Ninguém valida o próprio relatório.

6. Escopo do acompanhamento
Relatório acompanha compromissos e resultados: não comprova jornada nem substitui o sistema de ponto. Não calcula horas, não altera folha e não utiliza monitoramento de tela, localização ou teclado.

Demonstração: dados e registros ficam apenas neste navegador. O horário local é demonstrativo; a garantia definitiva de prazo dependerá de validação futura no servidor.`;
export function demoHomeOffice(scope: Scope, now = new Date()): State {
  const today = day(now),
    at = now.toISOString();
  const people: Person[] = [
    "Marina Demo",
    "Ana Remota",
    "Bruno Projetos",
    "Clara Estágio",
    "Diego Operações",
    "Elisa Design",
    "Felipe Engenharia",
    "Gustavo Novo",
  ].map((name, i) => ({
    id: `home-person-${i}`,
    user: i === 0 ? scope.user : `fictional-home-user-${i}`,
    org: scope.org,
    name,
    sector: [
      "Arquitetura",
      "Engenharia",
      "Arquitetura",
      "Operações",
      "Operações",
      "Arquitetura",
      "Engenharia",
      "Operações",
    ][i],
    contract: i === 3 ? "Estágio" : i === 7 ? "PJ" : "CLT",
    leader:
      i === 0
        ? "fictional-other-leader"
        : i !== 6 && scope.mode === "leader"
          ? scope.user
          : i === 6
            ? "fictional-other-team"
            : "fictional-team-leader",
    leaderName:
      i !== 6 && i > 0 && scope.mode === "leader"
        ? scope.name
        : i === 6
          ? "Outra liderança fictícia"
          : "Liderança demonstrativa",
  }));
  let s: State = {
    version: 1,
    org: scope.org,
    people,
    rules: [
      {
        id: "home-rules-1",
        number: 1,
        at: shift(today, -40) + "T12:00:00Z",
        by: "RH demonstrativo",
        text: initialRules,
      },
      {
        id: "home-rules-2",
        number: 2,
        at: shift(today, -5) + "T12:00:00Z",
        by: "RH demonstrativo",
        text:
          initialRules +
          "\n\nAtualização demonstrativa: informe o projeto de referência sempre que ele existir.",
      },
    ],
    agreements: [],
    exceptions: [],
    reports: [],
    events: [],
  };
  s.agreements = people
    .filter((_, i) => i !== 3 && i !== 7)
    .map((p) => ({
      id: `agreement-${p.id}`,
      person: p.id,
      mode: p.id === "home-person-1" ? "Remoto permanente" : "Híbrido fixo",
      start: shift(today, -35),
      end: shift(today, 65),
      weekdays:
        p.id === "home-person-1"
          ? [1, 2, 3, 4, 5]
          : [weekday(today), (weekday(today) + 1) % 7],
      period: "Dia completo",
      rule: "home-rules-1",
      by: "fictional-rh",
      authorName: "RH demonstrativo",
      at: shift(today, -35) + "T12:00:00Z",
    }));
  function event(
    person: string,
    date: string,
    period: Period,
    status: "Autorizado" | "Pendente" | "Cancelado" = "Autorizado",
    source:
      "Combinado" | "Sinalização" | "Troca" | "Cancelamento" = "Combinado",
  ) {
    const e = {
      id: crypto.randomUUID(),
      person,
      date,
      period,
      status,
      source,
      reason:
        source === "Sinalização"
          ? "Solicitação fictícia por necessidade pontual."
          : "Combinado demonstrativo registrado, sem envio de mensagem real.",
      rule: "home-rules-1",
      by: "fictional-employee",
      at: shift(date, -3) + "T12:00:00Z",
      approvedBy: status === "Autorizado" ? "fictional-rh" : undefined,
      approvedName: status === "Autorizado" ? "RH demonstrativo" : undefined,
      approvedAt:
        status === "Autorizado" ? shift(date, -2) + "T12:00:00Z" : undefined,
    };
    s.exceptions.push(e);
    return e;
  }
  event("home-person-3", today, "Tarde");
  event("home-person-3", shift(today, 3), "Manhã", "Pendente", "Sinalização");
  event(
    "home-person-2",
    shift(today, 1),
    "Dia completo",
    "Cancelado",
    "Cancelamento",
  );
  event(
    "home-person-2",
    shift(today, 2),
    "Dia completo",
    "Autorizado",
    "Troca",
  );
  const payload = (period: Period): Payload => ({
    activities: (period === "Dia completo"
      ? (["Manhã", "Tarde"] as const)
      : [period]
    ).map((p) => ({
      id: crypto.randomUUID(),
      period: p,
      project:
        p === "Manhã"
          ? "Projeto demonstrativo Aurora"
          : "Revisão demonstrativa de entregas",
      work:
        p === "Manhã"
          ? "Revisei o material do projeto e consolidei os apontamentos da equipe."
          : "Atualizei a documentação e conferi os itens combinados com a liderança.",
      result:
        p === "Manhã"
          ? "Versão de revisão organizada para conferência."
          : "Itens conferidos e documentação organizada para a próxima etapa.",
      reference: "",
    })),
    hasBlocker: false,
    blocker: "",
  });
  function report(
    person: string,
    date: string,
    kind: "draft" | "leader" | "rh" | "clarify" | "answered" | "validated",
  ) {
    const o = occurrence(s, person, date)!;
    const p = people.find((p) => p.id === person)!;
    const r: Report = {
      id: key(person, date),
      occurrence: structuredClone(o),
      draft: payload(o.period),
      review:
        kind === "rh" ? "rh" : kind === "validated" ? "validated" : "leader",
      notes: [],
    };
    if (kind !== "draft")
      r.original = {
        payload: structuredClone(r.draft),
        at: date + "T20:30:00-03:00",
        by: p.user,
        name: p.name,
      };
    if (kind === "rh" || kind === "validated")
      r.notes.push({
        id: crypto.randomUUID(),
        at: shift(date, 1) + "T12:00:00Z",
        by: p.leader,
        name: "Liderança demonstrativa",
        text: "Entregas demonstrativas conferidas.",
        kind: "Validação liderança",
      });
    if (kind === "clarify" || kind === "answered") {
      r.clarification = "leader";
      r.notes.push({
        id: crypto.randomUUID(),
        at: shift(date, 1) + "T12:00:00Z",
        by: p.leader,
        name: "Liderança demonstrativa",
        text: "Informe qual etapa do material foi concluída.",
        kind: "Esclarecimento solicitado",
      });
      if (kind === "answered") {
        r.clarification = undefined;
        r.notes.push({
          id: crypto.randomUUID(),
          at: shift(date, 1) + "T14:00:00Z",
          by: p.user,
          name: p.name,
          text: "A revisão demonstrativa da etapa inicial foi concluída; a consolidação fica para a próxima etapa.",
          kind: "Complementação",
        });
      }
    }
    if (kind === "validated")
      r.notes.push({
        id: crypto.randomUUID(),
        at: shift(date, 1) + "T15:00:00Z",
        by: "fictional-rh",
        name: "RH demonstrativo",
        text: "Relatório demonstrativo validado.",
        kind: "Validação RH",
      });
    s.reports.push(r);
  }
  report(people[0].id, today, "draft");
  for (const [i, offset, kind] of [
    [2, -1, "leader"],
    [3, -2, "rh"],
    [5, -4, "answered"],
    [6, -5, "validated"],
    [0, -6, "clarify"],
  ] as const) {
    event(people[i].id, shift(today, offset), "Dia completo");
    report(people[i].id, shift(today, offset), kind);
  }
  event(people[4].id, shift(today, -3), "Manhã");
  event(people[0].id, shift(today, -7), "Tarde");
  s.events = [
    {
      id: "home-seed-1",
      at,
      by: "fictional-rh",
      name: "RH demonstrativo",
      person: "home-person-2",
      text: `Troca demonstrativa de ${shift(today, 1)} para ${shift(today, 2)}, preservando as próximas semanas.`,
    },
    {
      id: "home-seed-2",
      at,
      by: "fictional-rh",
      name: "RH demonstrativo",
      text: "Biblioteca de regras atualizada para v2; os acordos anteriores preservam v1.",
    },
  ];
  s = project(s, scope);
  return s;
}
