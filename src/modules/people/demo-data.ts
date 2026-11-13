import { type Person, type ContractType, departments, units } from "./model";
/** Invented identities. Never load these into a remote database. */
export function createDemoPeople(organizationId: string): Person[] {
  const names = [
    "Marina Exemplo",
    "Rafael Modelo",
    "Clara Ilustração",
    "Lucas Projeto",
    "Beatriz Ensaio",
    "André Cenário",
    "Helena Traço",
    "Pedro Esboço",
    "Sofia Planta",
    "Tiago Estudo",
    "Laura Maquete",
    "Bruno Protótipo",
    "Alice Conceito",
    "Caio Perspectiva",
  ];
  return names.map((name, i) => {
    const type: ContractType = (["clt", "pj", "intern"] as const)[i % 3];
    const ended = i === 5 || i === 11;
    const engagement = {
      id: `demo-${i + 1}-v2`,
      type,
      start: i === 2 ? "2026-08-03" : "2026-03-02",
      ...(ended ? { end: "2026-10-30" } : {}),
      position:
        type === "pj"
          ? "Consultoria de projetos"
          : type === "intern"
            ? "Estágio em projetos"
            : i === 0
              ? "Arquiteta de projetos"
              : "Analista de projetos",
      department: departments[i % departments.length],
      unit: units[i % units.length],
      leader: i % 2 ? "Marina Exemplo" : "Rafael Modelo",
      detail:
        type === "pj"
          ? "Ateliê Modelo · Escopo: compatibilização de projetos"
          : type === "intern"
            ? "Instituto Exemplo · Arquitetura e Urbanismo"
            : "Contrato por prazo indeterminado",
    };
    // A previous contract and re-entry illustrate continuity without simultaneous links.
    const previous = {
      ...engagement,
      id: `demo-${i + 1}-v1`,
      start: "2024-02-05",
      end: "2025-12-19",
    };
    return {
      id: `demo-${i + 1}`,
      organizationId,
      code: `YC-D${String(i + 1).padStart(3, "0")}`,
      name,
      displayName: name.split(" ")[0],
      email: `pessoa${i + 1}@exemplo.invalid`,
      phone: "",
      access: ended ? "revoked" : i % 3 === 0 ? "enabled" : "none",
      engagements: i === 0 ? [previous, engagement] : [engagement],
      history: [
        ...(i === 0
          ? [
              {
                id: "m-1",
                date: "2024-02-05",
                title: "Início do vínculo",
                description: "CLT · Arquitetura",
                origin: "fixture" as const,
              },
              {
                id: "m-2",
                date: "2025-12-19",
                title: "Encerramento",
                description: "Vínculo anterior preservado no histórico.",
                origin: "fixture" as const,
              },
            ]
          : []),
        {
          id: `h-${i}-1`,
          date: engagement.start,
          title: i === 0 ? "Reingresso" : "Início do vínculo",
          description: `${engagement.position} · ${engagement.department}`,
          origin: "fixture" as const,
        },
        ...(i === 0
          ? [
              {
                id: "m-3",
                date: "2026-05-04",
                title: "Alteração de setor",
                description: "Operações → Arquitetura",
                origin: "fixture" as const,
              },
              {
                id: "m-4",
                date: "2026-07-01",
                title: "Alteração de cargo",
                description: "Assistente → Arquiteta de projetos",
                origin: "fixture" as const,
              },
              {
                id: "m-5",
                date: "2026-09-01",
                title: "Alteração de liderança",
                description: "Helena Traço → Rafael Modelo",
                origin: "fixture" as const,
              },
            ]
          : []),
        ...(ended
          ? [
              {
                id: `h-${i}-2`,
                date: "2026-10-30",
                title: "Encerramento",
                description:
                  "Acesso People representado como bloqueado. Nenhuma revogação real.",
                origin: "fixture" as const,
              },
            ]
          : []),
      ],
    };
  });
}
