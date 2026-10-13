"use server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/env";
export type LoginState = { error: string | null };
const credentials = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(256),
});
export async function login(
  _previous: LoginState,
  form: FormData,
): Promise<LoginState> {
  if (!getSupabaseConfig())
    return {
      error:
        "O acesso está aguardando configuração. Entre em contato com o RH.",
    };
  const input = credentials.safeParse({
    email: form.get("email"),
    password: form.get("password"),
  });
  if (!input.success) return { error: "Confira o e-mail e informe sua senha." };
  try {
    const client = await createClient();
    const { error } = await client.auth.signInWithPassword(input.data);
    if (error)
      return {
        error:
          "Não foi possível entrar. Confira suas credenciais ou procure o RH.",
      };
  } catch {
    return {
      error:
        "O serviço de acesso está indisponível. Tente novamente mais tarde.",
    };
  }
  redirect("/home");
}
export async function logout() {
  if (getSupabaseConfig()) {
    const client = await createClient();
    const { error } = await client.auth.signOut();
    if (error)
      throw new Error("Não foi possível encerrar a sessão. Tente novamente.");
  }
  (await cookies()).delete("youcon-organization");
  redirect("/login");
}
export async function switchOrganization(form: FormData) {
  const id = z.uuid().safeParse(form.get("organization_id"));
  if (!id.success) redirect("/acesso-negado");
  const client = await createClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) redirect("/login");
  const { data: member, error: queryError } = await client
    .from("memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("organization_id", id.data)
    .eq("active", true)
    .maybeSingle();
  if (queryError) throw new Error("Não foi possível alterar a organização.");
  if (!member) redirect("/acesso-negado");
  (await cookies()).set("youcon-organization", id.data, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  redirect("/home");
}
