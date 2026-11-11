import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/env";
import { hasPermission, isAccessRole, type Permission } from "./policy";
export const getAccess = cache(async () => {
  if (!getSupabaseConfig()) redirect("/login");
  const client = await createClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) redirect("/login");
  const { data: memberships, error: membershipError } = await client
    .from("memberships")
    .select("*")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("created_at");
  if (membershipError)
    throw new Error("Não foi possível consultar seus acessos.");
  if (!memberships?.length) redirect("/acesso-negado");
  const orgCookie = (await cookies()).get("youcon-organization")?.value;
  const membership =
    memberships.find((m) => m.organization_id === orgCookie) ?? memberships[0];
  const [
    { data: organization, error: orgError },
    { data: profile, error: profileError },
    { data: assignments, error: rolesError },
  ] = await Promise.all([
    client
      .from("organizations")
      .select("*")
      .eq("id", membership.organization_id)
      .single(),
    client
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle(),
    client
      .from("membership_roles")
      .select("role_code")
      .eq("membership_id", membership.id),
  ]);
  if (orgError || profileError || rolesError)
    throw new Error("Não foi possível carregar seu contexto de acesso.");
  const roles = (assignments ?? [])
    .map((a) => a.role_code)
    .filter(isAccessRole);
  const { data: grants, error: permissionsError } = roles.length
    ? await client
        .from("role_permissions")
        .select("permission_code")
        .in("role_code", roles)
    : { data: [], error: null };
  if (permissionsError)
    throw new Error("Não foi possível consultar suas permissões.");
  const permissions = Array.from(
    new Set((grants ?? []).map((g) => g.permission_code)),
  );
  return {
    user,
    membership,
    memberships,
    organization,
    displayName: profile?.display_name || "Profissional",
    roles,
    permissions,
  };
});
export async function requirePermission(permission: Permission) {
  const access = await getAccess();
  if (!hasPermission(access.permissions, permission))
    redirect("/acesso-negado");
  return access;
}
