-- Optional catalog-only inspection for operator review. No application rows read.
-- This file is not a migration and has not been run by the adaptation task.
begin read only;
select nspname as occupied_namespace
from pg_catalog.pg_namespace
where nspname in ('youcon_people','youcon_people_private');

-- Inspect inherited defaults without changing them. New objects explicitly revoke
-- inherited PUBLIC/anon/authenticated/service_role grants before granting read-only.
select pg_catalog.pg_get_userbyid(d.defaclrole) as owner,
       n.nspname as schema_name,d.defaclobjtype,d.defaclacl
from pg_catalog.pg_default_acl d
left join pg_catalog.pg_namespace n on n.oid=d.defaclnamespace;

-- Existing Auth automation must be reviewed before any account provisioning.
select t.tgname as trigger_name,n.nspname as function_schema,p.proname as function_name
from pg_catalog.pg_trigger t
join pg_catalog.pg_class c on c.oid=t.tgrelid
join pg_catalog.pg_namespace a on a.oid=c.relnamespace
join pg_catalog.pg_proc p on p.oid=t.tgfoid
join pg_catalog.pg_namespace n on n.oid=p.pronamespace
where a.nspname='auth' and c.relname='users' and not t.tgisinternal;
commit;
