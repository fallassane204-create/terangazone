-- MANUEL après 001 et 002. Utilise public.admins existante.
-- Colonnes confirmées : id UUID généré, email text NOT NULL, created_at.
-- Aucune contrainte UNIQUE requise ni ajoutée.
begin;
lock table public.admins in share row exclusive mode;
do $$
declare selected_email text;
begin
  select email into strict selected_email from auth.users
    where lower(btrim(email))=lower('fallassane204@gmail.com');
  insert into public.admins(email)
    select selected_email where not exists(select 1 from public.admins
      where lower(btrim(email))=lower(btrim(selected_email)));
exception
  when no_data_found then raise exception 'Compte absent de Supabase Auth : créer le compte avant 003.';
  when too_many_rows then raise exception 'Plusieurs comptes Auth correspondent : vérifier avant inscription.';
end $$;
commit;
