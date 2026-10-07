-- Lecture seule, facultatif : aucune contrainte nécessaire pour 003.
select column_name,data_type,is_nullable,column_default
from information_schema.columns where table_schema='public' and table_name='admins'
order by ordinal_position;
select conname,contype,pg_get_constraintdef(oid) as definition
from pg_constraint where conrelid='public.admins'::regclass;
select indexname,indexdef from pg_indexes where schemaname='public' and tablename='admins';
select count(*) as matching_rows from public.admins
where lower(btrim(email))=lower('fallassane204@gmail.com');
