begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.organizations (
 id uuid primary key default gen_random_uuid(),
 name text not null check (char_length(name) between 1 and 160),
 slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 created_at timestamptz not null default now()
);
create table public.profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text check (char_length(display_name) between 1 and 160),
 created_at timestamptz not null default now()
);
create table public.memberships (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete restrict,
 user_id uuid not null references auth.users(id) on delete cascade,
 contract_type text not null check (contract_type in ('clt','intern','pj')),
 active boolean not null default true,
 created_at timestamptz not null default now(),
 unique (organization_id,user_id),
 unique (id,user_id)
);
create index memberships_user_active_idx on public.memberships(user_id,active,organization_id);
create table public.roles (code text primary key check (code in ('professional','leadership','hr','director')), label text not null);
create table public.permissions (code text primary key, description text not null);
create table public.role_permissions (
 role_code text not null references public.roles(code),
 permission_code text not null references public.permissions(code),
 primary key (role_code,permission_code),
 constraint managerial_permissions_only_hr_director check (
  permission_code not in ('people.management.view','people.dashboard.view') or role_code in ('hr','director')
 )
);
create index role_permissions_permission_idx on public.role_permissions(permission_code);
create table public.membership_roles (
 membership_id uuid not null,
 user_id uuid not null,
 role_code text not null references public.roles(code),
 primary key (membership_id,role_code),
 foreign key (membership_id,user_id) references public.memberships(id,user_id) on delete cascade
);
create index membership_roles_user_idx on public.membership_roles(user_id,membership_id);
create index membership_roles_role_idx on public.membership_roles(role_code);

insert into public.roles values ('professional','Profissional'),('leadership','Liderança'),('hr','RH'),('director','Diretoria');
insert into public.permissions values ('home.view','Acessar a Home'),('people.management.view','Acessar a Base de Gente & Gestão'),('people.dashboard.view','Acessar dashboards gerenciais');
insert into public.role_permissions values
 ('professional','home.view'),('leadership','home.view'),('hr','home.view'),('director','home.view'),
 ('hr','people.management.view'),('director','people.management.view'),('hr','people.dashboard.view'),('director','people.dashboard.view');

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.membership_roles enable row level security;

-- No user writes or self-provisioning. Bootstrap is performed by a trusted operator.
revoke all on public.organizations,public.profiles,public.memberships,public.roles,public.permissions,public.role_permissions,public.membership_roles from anon,authenticated;
grant select on public.organizations,public.profiles,public.memberships,public.roles,public.permissions,public.role_permissions,public.membership_roles to authenticated;
grant all on public.organizations,public.profiles,public.memberships,public.roles,public.permissions,public.role_permissions,public.membership_roles to service_role;

create policy memberships_own_read on public.memberships for select to authenticated using (user_id=(select auth.uid()));
create policy profiles_own_read on public.profiles for select to authenticated using (user_id=(select auth.uid()));
create policy organizations_active_member_read on public.organizations for select to authenticated using (
 exists(select 1 from public.memberships m where m.organization_id=organizations.id and m.user_id=(select auth.uid()) and m.active)
);
create policy membership_roles_own_active_read on public.membership_roles for select to authenticated using (
 user_id=(select auth.uid()) and exists(select 1 from public.memberships m where m.id=membership_roles.membership_id and m.active)
);
create policy roles_catalog_read on public.roles for select to authenticated using ((select auth.uid()) is not null);
create policy permissions_catalog_read on public.permissions for select to authenticated using ((select auth.uid()) is not null);
create policy role_permissions_catalog_read on public.role_permissions for select to authenticated using ((select auth.uid()) is not null);

-- Invoker semantics preserve the RLS on every lookup. Never trust user_metadata.
create function private.has_permission(target_organization uuid,required_permission text)
returns boolean language sql stable security invoker set search_path='' as $$
 select (select auth.uid()) is not null and exists (
  select 1 from public.memberships m
  join public.membership_roles mr on mr.membership_id=m.id and mr.user_id=m.user_id
  join public.role_permissions rp on rp.role_code=mr.role_code
  where m.user_id=(select auth.uid()) and m.organization_id=target_organization and m.active
   and rp.permission_code=required_permission
 );
$$;
revoke all on function private.has_permission(uuid,text) from public,anon;
grant execute on function private.has_permission(uuid,text) to authenticated;
comment on function private.has_permission(uuid,text) is 'Use in future organization-scoped RLS; SECURITY INVOKER, no authorization from editable JWT metadata.';
commit;
