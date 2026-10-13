export const permissionCodes = [
  "home.view",
  "people.management.view",
  "people.dashboard.view",
] as const;
export type Permission = (typeof permissionCodes)[number];
export type AccessRole = "professional" | "leadership" | "hr" | "director";
export const roleLabels: Record<AccessRole, string> = {
  professional: "Profissional",
  leadership: "Liderança",
  hr: "RH",
  director: "Diretoria",
};
export const contractLabels = {
  clt: "Profissional CLT",
  intern: "Estagiário",
  pj: "Prestador PJ",
};
export function hasPermission(
  permissions: readonly string[],
  permission: Permission,
) {
  return permissions.includes(permission);
}
export function isAccessRole(value: string): value is AccessRole {
  return Object.hasOwn(roleLabels, value);
}
export const futureModules = [
  {
    name: "Comunicação interna",
    description: "Informações que aproximam a nossa equipe.",
    icon: "communication",
  },
  {
    name: "Desenvolvimento",
    description: "Espaço para construir sua trajetória.",
    icon: "development",
  },
  {
    name: "YouCon Academy",
    description: "Aprendizado para ir mais longe.",
    icon: "academy",
  },
  {
    name: "Cultura e reconhecimento",
    description: "O que nos conecta e nos inspira.",
    icon: "culture",
  },
] as const;
