import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";

export const migrationFiles = readdirSync("supabase/migrations")
  .filter((file) => file.endsWith(".sql"))
  .sort();
export const foundationSql = migrationFiles
  .map((file) => readFileSync(`supabase/migrations/${file}`, "utf8"))
  .join("\n");

// Synthetic legacy application. No production schema definitions or data copied.
export async function createSharedFixture() {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
    $$;
    grant usage on schema public,auth to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;
    create schema private;
    grant usage on schema private to public;
    create function private.has_permission(uuid,text) returns boolean
      language sql as $$select true$$;
    create table public.profiles(legacy_id uuid primary key, legacy_note text);
    insert into public.profiles values('90000000-0000-4000-8000-000000000001','legacy sentinel');
    grant select,insert on public.profiles to authenticated;
    alter table public.profiles enable row level security;
    create policy legacy_profiles_read on public.profiles for select to authenticated using (true);
    create function private.link_profile_on_auth_user() returns trigger language plpgsql as $$
      begin
        insert into public.profiles values(new.id,'existing automation');
        return new;
      end;
    $$;
    create trigger legacy_auth_profile after insert on auth.users
      for each row execute function private.link_profile_on_auth_user();
    -- Shared projects may have permissive global defaults. The migration must
    -- override them ONLY on new People objects, never change the global defaults.
    alter default privileges grant all on tables to public,anon,authenticated,service_role;
    alter default privileges grant all on functions to anon,authenticated,service_role;
    alter default privileges grant all on schemas to anon,authenticated,service_role;
  `);
  for (const name of [
    "organizations",
    "memberships",
    "roles",
    "permissions",
    "role_permissions",
    "membership_roles",
  ]) {
    await db.exec(`create table public.${name}(legacy_note text);
      insert into public.${name} values('legacy ${name}');`);
  }
  return db;
}

export async function legacySnapshot(db: PGlite) {
  return (
    await db.query(`select jsonb_build_object(
    'schemas',(select jsonb_agg(to_jsonb(n) order by n.nspname) from pg_namespace n where n.nspname in ('public','private','auth')),
    'relations',(select jsonb_agg(jsonb_build_array(c.oid,n.nspname,c.relname,c.relacl,c.relrowsecurity) order by c.oid) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private','auth')),
    'columns',(select jsonb_agg(to_jsonb(a) order by a.attrelid,a.attnum) from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private','auth')),
    'policies',(select jsonb_agg(to_jsonb(p) order by p.policyname) from pg_policies p where p.schemaname in ('public','private','auth')),
    'functions',(select jsonb_agg(jsonb_build_array(p.oid,p.proacl,pg_get_functiondef(p.oid)) order by p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private','auth')),
    'triggers',(select jsonb_agg(jsonb_build_array(t.oid,pg_get_triggerdef(t.oid)) order by t.oid) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private','auth')),
    'defaults',(select jsonb_agg(to_jsonb(d) order by d.oid) from pg_default_acl d),
    'profiles',(select jsonb_agg(to_jsonb(p) order by p.legacy_id) from public.profiles p),
    'memberships',(select jsonb_agg(to_jsonb(m)) from public.memberships m),
    'auth_users',(select jsonb_agg(to_jsonb(u) order by u.id) from auth.users u)
  ) as snapshot`)
  ).rows[0];
}
