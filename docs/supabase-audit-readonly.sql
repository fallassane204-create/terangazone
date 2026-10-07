-- Diagnostic uniquement : aucune instruction de modification.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies where schemaname = 'public' and tablename = 'orders';
select relname, relrowsecurity, relforcerowsecurity
from pg_class join pg_namespace on pg_namespace.oid = pg_class.relnamespace
where nspname = 'public' and relname = 'orders';
select column_name, data_type, is_nullable, column_default
from information_schema.columns where table_schema = 'public' and table_name = 'orders'
order by ordinal_position;
