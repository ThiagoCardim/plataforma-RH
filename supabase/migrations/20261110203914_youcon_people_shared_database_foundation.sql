-- REVIEW REQUIRED. Prepared only; not applied to the shared project.
-- Replacement for the original, unapplied empty-database foundation.
-- Owns only the two new namespaces. Does not modify public/private/auth/storage,
-- existing data, Auth triggers/settings, API configuration or migration history.
begin;
set local lock_timeout = '3s';
set local statement_timeout = '30s';

-- Never reuse a namespace owned by another application, or silently merge schemas.
do $$
begin
 if exists(select 1 from pg_catalog.pg_namespace where nspname in ('youcon_people','youcon_people_private')) then
  raise exception 'YouCon People namespace already exists; stop and review before applying.' using errcode = '42P06';
 end if;
end;
$$;
create schema youcon_people;
create schema youcon_people_private;
revoke all on schema youcon_people from public,anon,authenticated,service_role;
revoke all on schema youcon_people_private from public,anon,authenticated,service_role;
grant usage on schema youcon_people to authenticated,service_role;
grant usage on schema youcon_people_private to authenticated;

-- Auth identity is stored as UUID without FK to shared auth.users: no new trigger
-- or lock/dependency on an existing table. A trusted operator verifies identities
-- before provisioning. Memberships reference only our own profile table.
create table youcon_people.organizations (
 id uuid primary key default gen_random_uuid(),
 name text not null check (char_length(name) between 1 and 160),
 slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 created_at timestamptz not null default now()
);
create table youcon_people.profiles (
 user_id uuid primary key,
 display_name text check (char_length(display_name) between 1 and 160),
 created_at timestamptz not null default now()
);
create table youcon_people.memberships (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references youcon_people.organizations(id) on delete restrict,
 user_id uuid not null references youcon_people.profiles(user_id) on delete restrict,
 contract_type text not null check (contract_type in ('clt','intern','pj')),
 active boolean not null default true,
 created_at timestamptz not null default now(),
 unique (organization_id,user_id),
 unique (id,user_id)
);
create index memberships_user_active_idx on youcon_people.memberships(user_id,active,organization_id);
create table youcon_people.roles (code text primary key check (code in ('professional','leadership','hr','director')), label text not null);
create table youcon_people.permissions (code text primary key, description text not null);
create table youcon_people.role_permissions (
 role_code text not null references youcon_people.roles(code),
 permission_code text not null references youcon_people.permissions(code),
 primary key (role_code,permission_code),
 constraint managerial_permissions_only_hr_director check (
  permission_code not in ('people.management.view','people.dashboard.view') or role_code in ('hr','director')
 )
);
create index role_permissions_permission_idx on youcon_people.role_permissions(permission_code);
create table youcon_people.membership_roles (
 membership_id uuid not null,
 user_id uuid not null,
 role_code text not null references youcon_people.roles(code),
 primary key (membership_id,role_code),
 foreign key (membership_id,user_id) references youcon_people.memberships(id,user_id) on delete cascade
);
create index membership_roles_user_idx on youcon_people.membership_roles(user_id,membership_id);
create index membership_roles_role_idx on youcon_people.membership_roles(role_code);

insert into youcon_people.roles values ('professional','Profissional'),('leadership','Liderança'),('hr','RH'),('director','Diretoria');
insert into youcon_people.permissions values ('home.view','Acessar a Home'),('people.management.view','Acessar a Base de Gente & Gestão'),('people.dashboard.view','Acessar dashboards gerenciais');
insert into youcon_people.role_permissions values
 ('professional','home.view'),('leadership','home.view'),('hr','home.view'),('director','home.view'),
 ('hr','people.management.view'),('director','people.management.view'),('hr','people.dashboard.view'),('director','people.dashboard.view');

alter table youcon_people.organizations enable row level security;
alter table youcon_people.profiles enable row level security;
alter table youcon_people.memberships enable row level security;
alter table youcon_people.roles enable row level security;
alter table youcon_people.permissions enable row level security;
alter table youcon_people.role_permissions enable row level security;
alter table youcon_people.membership_roles enable row level security;

-- No user writes or self-provisioning. Bootstrap is performed by a trusted operator.
revoke all on youcon_people.organizations,youcon_people.profiles,youcon_people.memberships,youcon_people.roles,youcon_people.permissions,youcon_people.role_permissions,youcon_people.membership_roles from public,anon,authenticated,service_role;
grant select on youcon_people.organizations,youcon_people.profiles,youcon_people.memberships,youcon_people.roles,youcon_people.permissions,youcon_people.role_permissions,youcon_people.membership_roles to authenticated;
grant all on youcon_people.organizations,youcon_people.profiles,youcon_people.memberships,youcon_people.roles,youcon_people.permissions,youcon_people.role_permissions,youcon_people.membership_roles to service_role;

create policy memberships_own_read on youcon_people.memberships for select to authenticated using (user_id=(select auth.uid()) and active);
create policy profiles_own_read on youcon_people.profiles for select to authenticated using (user_id=(select auth.uid()));
create policy organizations_active_member_read on youcon_people.organizations for select to authenticated using (
 exists(select 1 from youcon_people.memberships m where m.organization_id=organizations.id and m.user_id=(select auth.uid()) and m.active)
);
create policy membership_roles_own_active_read on youcon_people.membership_roles for select to authenticated using (
 user_id=(select auth.uid()) and exists(select 1 from youcon_people.memberships m where m.id=membership_roles.membership_id and m.active)
);
create policy roles_catalog_read on youcon_people.roles for select to authenticated using (exists(select 1 from youcon_people.memberships m where m.user_id=(select auth.uid()) and m.active));
create policy permissions_catalog_read on youcon_people.permissions for select to authenticated using (exists(select 1 from youcon_people.memberships m where m.user_id=(select auth.uid()) and m.active));
create policy role_permissions_catalog_read on youcon_people.role_permissions for select to authenticated using (exists(select 1 from youcon_people.memberships m where m.user_id=(select auth.uid()) and m.active));

-- Invoker semantics preserve the RLS on every lookup. Never trust user_metadata.
create function youcon_people_private.has_permission(target_organization uuid,required_permission text)
returns boolean language sql stable security invoker set search_path='' as $$
 select (select auth.uid()) is not null and exists (
  select 1 from youcon_people.memberships m
  join youcon_people.membership_roles mr on mr.membership_id=m.id and mr.user_id=m.user_id
  join youcon_people.role_permissions rp on rp.role_code=mr.role_code
  where m.user_id=(select auth.uid()) and m.organization_id=target_organization and m.active
   and rp.permission_code=required_permission
 );
$$;
revoke all on function youcon_people_private.has_permission(uuid,text) from public,anon,authenticated,service_role;
grant execute on function youcon_people_private.has_permission(uuid,text) to authenticated;
comment on function youcon_people_private.has_permission(uuid,text) is 'Use in future organization-scoped RLS; SECURITY INVOKER, no authorization from editable JWT metadata.';
-- A shared owner may have global defaults for additional application roles.
-- Fail closed if any unexpected grant survived on OUR objects; never change
-- another application's defaults or guess which inherited grants are safe.
do $$
begin
 if exists (
  select 1 from (
   select n.nspowner as owner_id,a.grantee
   from pg_catalog.pg_namespace n
   cross join lateral pg_catalog.aclexplode(n.nspacl) a
   where n.nspname in ('youcon_people','youcon_people_private')
   union all
   select c.relowner,a.grantee
   from pg_catalog.pg_class c
   join pg_catalog.pg_namespace n on n.oid=c.relnamespace
   cross join lateral pg_catalog.aclexplode(c.relacl) a
   where n.nspname='youcon_people'
   union all
   select p.proowner,a.grantee
   from pg_catalog.pg_proc p
   join pg_catalog.pg_namespace n on n.oid=p.pronamespace
   cross join lateral pg_catalog.aclexplode(p.proacl) a
   where n.nspname='youcon_people_private'
  ) grants
  where grants.grantee <> grants.owner_id
   and grants.grantee not in ('authenticated'::regrole::oid,'service_role'::regrole::oid)
 ) then
  raise exception 'Unexpected inherited grants on People objects; stop and review without changing shared defaults.' using errcode='42501';
 end if;
end;
$$;
commit;
