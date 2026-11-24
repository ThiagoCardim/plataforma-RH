/** Initial modules inherit the existing management boundary; no new grants. */
export const upcomingModules = {
  "onboarding-offboarding": {
    label: "Onboarding",
    group: "Pessoas",
    icon: "journey",
    description:
      "Um espaço para acompanhar a chegada e o encerramento de cada trajetória na organização.",
  },
  offboarding: {
    label: "Offboarding",
    group: "Pessoas",
    icon: "journey",
    description:
      "Encerramentos organizados e transferência de conhecimento, em demonstração local.",
  },
  "plano-de-carreira": {
    label: "Plano de Carreira",
    group: "Pessoas",
    icon: "career",
    description:
      "Caminhos de crescimento e evolução profissional, com clareza sobre os próximos passos.",
  },
  "home-office": {
    label: "Home Office",
    group: "Pessoas",
    icon: "remote",
    description:
      "Um espaço para organizar as diretrizes e acompanhar o trabalho remoto.",
  },
  "avaliacao-de-desempenho": {
    label: "Avaliação de Desempenho",
    group: "Desempenho",
    icon: "performance",
    description:
      "Conversas e perspectivas para acompanhar o desempenho e orientar o desenvolvimento.",
  },
  pdi: {
    label: "PDI",
    group: "Desempenho",
    icon: "career",
    description:
      "Planos de desenvolvimento individual com objetivos, ações e acompanhamento.",
  },
  "metas-dos-lideres": {
    label: "Metas dos Líderes",
    group: "Desempenho",
    icon: "goals",
    description:
      "Clareza de objetivos para conectar a atuação das lideranças aos resultados da organização.",
  },
  "youcon-academy": {
    label: "YouCon Academy",
    group: "Desempenho",
    icon: "academy",
    description:
      "Aprendizado e conhecimento para construir novas possibilidades.",
  },
  cultura: {
    label: "Cultura",
    group: "Políticas",
    icon: "culture",
    description:
      "Os valores e as atitudes que conectam as pessoas e dão forma à nossa cultura.",
  },
  "politicas-compliance": {
    label: "Políticas e Compliance",
    group: "Políticas",
    icon: "policies",
    description:
      "Políticas internas, integridade e orientações em uma única central.",
  },
  "programa-de-indicacao-de-vagas": {
    label: "Programa de Indicação de Vagas",
    group: "Políticas",
    icon: "referrals",
    description:
      "Um espaço para conectar talentos e futuras oportunidades na YouCon.",
  },
} as const;
export type UpcomingModuleId = keyof typeof upcomingModules;
export const moduleEntries = Object.entries(upcomingModules) as [
  UpcomingModuleId,
  (typeof upcomingModules)[UpcomingModuleId],
][];
export function isNavigationActive(pathname: string, href: string) {
  return (
    pathname === href ||
    (href === "/politicas-compliance" && pathname.startsWith(href + "/")) ||
    (href === "/gente-gestao" && pathname.startsWith("/gente-gestao/pessoas"))
  );
}
export function routeLabel(pathname: string) {
  if (pathname === "/gente-gestao/dashboard") return "Dashboard Gerencial";
  if (pathname === "/gente-gestao" || pathname === "/gente-gestao/pessoas")
    return "Colaboradores";
  if (pathname.startsWith("/gente-gestao/pessoas/")) {
    if (pathname.endsWith("/nova")) return "Cadastrar pessoa";
    if (pathname.endsWith("/editar")) return "Editar pessoa";
    return "Ficha da pessoa";
  }
  if (pathname.startsWith("/politicas-compliance/"))
    return pathname.endsWith("/novo")
      ? "Novo documento"
      : "Políticas e Compliance · Documento";
  return (
    moduleEntries.find(([id]) => pathname === `/${id}`)?.[1].label ?? "Início"
  );
}
