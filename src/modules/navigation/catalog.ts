/** Initial modules inherit the existing management boundary; no new grants. */
export const upcomingModules = {
  "onboarding-offboarding": {
    label: "Onboarding e Offboarding",
    group: "Pessoas",
    icon: "journey",
    description:
      "Um espaço para acompanhar a chegada e o encerramento de cada trajetória na organização.",
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
    group: "Desempenho e Desenvolvimento",
    icon: "performance",
    description:
      "Conversas e perspectivas para acompanhar o desempenho e orientar o desenvolvimento.",
  },
  "metas-dos-lideres": {
    label: "Metas dos Líderes",
    group: "Desempenho e Desenvolvimento",
    icon: "goals",
    description:
      "Clareza de objetivos para conectar a atuação das lideranças aos resultados da organização.",
  },
  "youcon-academy": {
    label: "YouCon Academy",
    group: "Desempenho e Desenvolvimento",
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
  "compliance-e-politicas": {
    label: "Compliance e Políticas",
    group: "Políticas",
    icon: "policies",
    description:
      "Referências e orientações para uma atuação responsável, ética e transparente.",
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
  return (
    moduleEntries.find(([id]) => pathname === `/${id}`)?.[1].label ?? "Início"
  );
}
