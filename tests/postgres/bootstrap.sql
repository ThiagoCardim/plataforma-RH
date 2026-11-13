-- SOMENTE fixture local. Não é parte dos lotes de implantação.
create role anon;
create role authenticated;
create role service_role bypassrls;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;
create schema private;
create table public.legacy_sentinel(id int primary key,note text);
insert into public.legacy_sentinel values(1,'synthetic existing app');
create table auth.users(id uuid primary key);
create function private.legacy_trigger() returns trigger language plpgsql as $$begin return new;end$$;
create trigger legacy_auth after insert on auth.users for each row execute function private.legacy_trigger();
