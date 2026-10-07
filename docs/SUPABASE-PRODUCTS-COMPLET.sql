-- EXÉCUTION MANUELLE UNIQUEMENT. ChatGPT : normal 7500, promotion active 6500 FCFA. Storage 004 reste séparé et attend votre accord.
-- FICHIER : 001_catalogue.sql
-- VERSION FINALE : products, admins et orders (22 colonnes) existent déjà.
-- MANUEL uniquement. Aucune table historique recréée, aucune donnée supprimée.
-- orders_pkey et orders_order_number_key ne sont ni modifiées ni recréées.
begin;
do $$ begin
  if to_regclass('public.products') is null or to_regclass('public.orders') is null
     or to_regclass('public.admins') is null then
    raise exception 'products, orders et admins doivent déjà exister.';
  end if;
  if exists (
    select 1 from unnest(array['id','order_number','customer_name','customer_phone','payment_phone',
      'service_name','service_price','duration','payment_method','payment_reference','status','access_message',
      'created_at','account_email','account_password','profile_name','expiration_date','internal_notes',
      'delivered_at','paid_at','renewed_at','renewal_count']) required(column_name)
    where not exists(select 1 from information_schema.columns c where c.table_schema='public'
      and c.table_name='orders' and c.column_name=required.column_name)
  ) then raise exception 'Schéma orders incompatible avec la RPC : fournir ses colonnes avant activation.'; end if;
end $$;
create schema if not exists terangazone_private;
revoke all on schema terangazone_private from public, anon, authenticated;
-- admins.id identifie sa ligne ; admins.email désigne le compte Auth.
-- Aucune contrainte ni colonne ajoutée à admins.
create or replace function public.tz_is_catalogue_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admins a join auth.users u
    on lower(btrim(a.email))=lower(btrim(u.email)) where u.id=(select auth.uid()));
$$;
-- Empêche une inscription admin depuis les rôles navigateur, y compris
-- lorsqu'une ancienne policy permissive subsiste. Les lignes sont conservées.
alter table public.admins enable row level security;
revoke all on public.admins from public, anon, authenticated;
drop policy if exists tz_admins_browser_boundary on public.admins;
create policy tz_admins_browser_boundary on public.admins as restrictive for all
  to anon, authenticated using (false) with check (false);
revoke all on function public.tz_is_catalogue_admin() from public;
grant execute on function public.tz_is_catalogue_admin() to anon, authenticated;

create or replace function terangazone_private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$ begin new.updated_at = clock_timestamp(); return new; end $$;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  is_active boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
-- products.category reste text : une catégorie correspond à un seul nom.
create unique index if not exists tz_categories_name_idx on public.categories(name);
-- Colonnes d'origine conservées : price reste integer NOT NULL.
alter table public.products add column if not exists old_price integer;
alter table public.products add column if not exists promotion_enabled boolean not null default false;
alter table public.products add column if not exists is_featured boolean not null default false;
alter table public.products add column if not exists sort_order integer not null default 0;
alter table public.products add column if not exists slug text;
alter table public.products add column if not exists promo_starts_at timestamptz;
alter table public.products add column if not exists promo_ends_at timestamptz;
alter table public.products add column if not exists updated_at timestamptz not null default now();
alter table public.products add column if not exists quote_only boolean not null default false;
-- Préserve les fonctions déjà demandées : champs de commande, produit physique,
-- stock manuel, variante, instructions, texte de bouton et archivage.
alter table public.products add column if not exists details jsonb not null default '{}';
create unique index if not exists tz_products_slug_idx on public.products(slug) where slug is not null;
-- Aucune gratuité. Le 0 technique n'est accepté que pour un devis non commandable.
do $$ begin
  if not exists(select 1 from pg_constraint where conrelid='public.products'::regclass and conname='tz_products_positive_price') then
    alter table public.products add constraint tz_products_positive_price check (
      price>0 or (quote_only and not coalesce((details->>'whatsapp_enabled')::boolean,true))
    ) not valid;
  end if;
end $$;
do $$ begin
  if not exists(select 1 from pg_constraint where conrelid='public.products'::regclass and conname='tz_products_category_fk') then
    alter table public.products add constraint tz_products_category_fk
      foreign key(category) references public.categories(name) on update cascade not valid;
  end if;
end $$;
-- NOT VALID préserve d'éventuelles anciennes lignes atypiques et contrôle les nouvelles écritures.
do $$ begin
  if not exists(select 1 from pg_constraint where conrelid='public.products'::regclass and conname='tz_products_values') then
    alter table public.products add constraint tz_products_values check (
      price between 0 and 1000000000 and sort_order>=0
      and (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
      and (old_price is null or (not quote_only and old_price>price and old_price<=1000000000))
      and (not promotion_enabled or old_price is not null)
      and (promo_starts_at is null or promo_ends_at is null or promo_ends_at>promo_starts_at)
      and jsonb_typeof(details)='object'
      and coalesce(details->>'kind','digital') in ('digital','subscription','physical')
      and (details->>'stock' is null or (details->>'stock')::integer>=0)
      and jsonb_typeof(coalesce(details->'order_fields','[]'))='array'
      and jsonb_array_length(coalesce(details->'order_fields','[]'))<=8
    ) not valid;
  end if;
end $$;
-- Adaptation privée pour la RPC, sans table ni copie de catalogue.
create or replace view terangazone_private.product_order_data as
select p.id,p.name,p.description,p.price,p.old_price,p.promotion_enabled,
  p.promo_starts_at as promotion_start,p.promo_ends_at as promotion_end,
  p.duration as billing_period,p.active as is_active,p.updated_at,p.quote_only,
  (select id from public.categories where name=p.category order by id limit 1) as category_id,
  nullif(p.details->>'archived_at','')::timestamptz as archived_at,
  coalesce((p.details->>'whatsapp_enabled')::boolean,true) as whatsapp_enabled,
  coalesce(p.details->>'kind','digital') as kind,(p.details->>'stock')::integer as stock,
  coalesce(p.details->'order_fields','[]') as order_fields
from public.products p;
create table if not exists public.shop_settings (
  id integer primary key default 1 check (id = 1),
  name text not null, whatsapp_number text not null check (whatsapp_number ~ '^[1-9][0-9]{9,14}$'),
  email text not null default '', logo_url text, welcome_text text not null,
  wave_number text not null, wave_name text not null,
  orange_money_number text not null, orange_money_name text not null,
  delivery_info text not null default '', social_links jsonb not null default '[]'
    check (jsonb_typeof(social_links) = 'array' and jsonb_array_length(social_links) <= 8),
  updated_at timestamptz not null default now()
);
create index if not exists products_public_order_idx on public.products(sort_order) where active;
create index if not exists products_category_idx on public.products(category);
create index if not exists categories_public_order_idx on public.categories(sort_order) where is_active;
drop trigger if exists categories_updated_at on public.categories;
create trigger categories_updated_at before update on public.categories for each row execute function terangazone_private.touch_updated_at();
drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products for each row execute function terangazone_private.touch_updated_at();
drop trigger if exists settings_updated_at on public.shop_settings;
create trigger settings_updated_at before update on public.shop_settings for each row execute function terangazone_private.touch_updated_at();

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.shop_settings enable row level security;
revoke all on public.categories, public.products, public.shop_settings from public, anon, authenticated;
grant select on public.categories, public.products, public.shop_settings to anon, authenticated;
grant insert, update on public.categories, public.products to authenticated;
grant update on public.shop_settings to authenticated;
drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories for select to anon, authenticated using (is_active or (select public.tz_is_catalogue_admin()));
drop policy if exists categories_admin_insert on public.categories;
create policy categories_admin_insert on public.categories for insert to authenticated with check ((select public.tz_is_catalogue_admin()));
drop policy if exists categories_admin_update on public.categories;
create policy categories_admin_update on public.categories for update to authenticated using ((select public.tz_is_catalogue_admin())) with check ((select public.tz_is_catalogue_admin()));
drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products for select to anon, authenticated using (
  (active is true and details->>'archived_at' is null and exists (select 1 from public.categories c where c.name = category and c.is_active))
  or (select public.tz_is_catalogue_admin())
);
drop policy if exists products_admin_insert on public.products;
create policy products_admin_insert on public.products for insert to authenticated with check ((select public.tz_is_catalogue_admin()));
drop policy if exists products_admin_update on public.products;
create policy products_admin_update on public.products for update to authenticated using ((select public.tz_is_catalogue_admin())) with check ((select public.tz_is_catalogue_admin()));
drop policy if exists settings_public_read on public.shop_settings;
create policy settings_public_read on public.shop_settings for select to anon, authenticated using (true);
drop policy if exists settings_admin_update on public.shop_settings;
create policy settings_admin_update on public.shop_settings for update to authenticated using ((select public.tz_is_catalogue_admin())) with check ((select public.tz_is_catalogue_admin()));

drop policy if exists tz_products_read_boundary on public.products;
create policy tz_products_read_boundary on public.products as restrictive for select to anon, authenticated
  using ((active is true and details->>'archived_at' is null and exists
    (select 1 from public.categories c where c.name=category and c.is_active)) or public.tz_is_catalogue_admin());
drop policy if exists tz_products_insert_boundary on public.products;
create policy tz_products_insert_boundary on public.products as restrictive for insert to authenticated with check (public.tz_is_catalogue_admin());
drop policy if exists tz_products_update_boundary on public.products;
create policy tz_products_update_boundary on public.products as restrictive for update to authenticated using (public.tz_is_catalogue_admin()) with check (public.tz_is_catalogue_admin());
drop policy if exists tz_products_delete_boundary on public.products;
create policy tz_products_delete_boundary on public.products as restrictive for delete to authenticated using (false);
-- Signal léger pour actualiser les onglets publics sans recharger le catalogue
-- complet à chaque sondage. Aucun nom, prix ou détail inactif n'est exposé.
create or replace function public.tz_catalogue_revision() returns text
language sql stable security definer set search_path = '' as $$
  select greatest((select max(updated_at) from public.products),
    (select max(updated_at) from public.categories), (select max(updated_at) from public.shop_settings))::text;
$$;
revoke all on function public.tz_catalogue_revision() from public;
grant execute on function public.tz_catalogue_revision() to anon, authenticated;

-- Ajouts uniquement. Les 22 colonnes, CHECK, NOT NULL, PK et UNIQUE
-- historiques restent intactes ; aucun UPDATE de service_price historique.
alter table public.orders add column if not exists product_id uuid references public.products(id);
alter table public.orders add column if not exists quantity integer not null default 1 check (quantity between 1 and 99);
alter table public.orders add column if not exists unit_price integer;
alter table public.orders add column if not exists customer_notes text;
alter table public.orders add column if not exists order_fields jsonb not null default '{}';
alter table public.orders add column if not exists catalogue_snapshot jsonb;
alter table public.orders add column if not exists request_id uuid;
create unique index if not exists orders_request_id_idx on public.orders(request_id) where request_id is not null;
create index if not exists orders_product_id_idx on public.orders(product_id);

-- Reproduit la règle de promotion TypeScript, à l'instant de la transaction.
create or replace function public.tz_effective_price(s terangazone_private.product_order_data) returns integer
language sql stable set search_path = '' as $$
  select case when s.quote_only then null when s.old_price is not null and not (
    s.promotion_enabled and (s.promotion_start is null or now() >= s.promotion_start)
      and (s.promotion_end is null or now() < s.promotion_end)
  ) then s.old_price else s.price end;
$$;
revoke all on function public.tz_effective_price(terangazone_private.product_order_data) from public;
grant execute on function public.tz_effective_price(terangazone_private.product_order_data) to anon, authenticated;

-- Unique point d'insertion publique : prix/statut/coordonnées recalculés et
-- contrôlés en base, sans clé service_role. L'appelant ne choisit pas son total.
create or replace function public.tz_place_order(
  p_product_id uuid, p_expected_price integer, p_product_updated_at timestamptz,
  p_settings_updated_at timestamptz, p_customer_name text, p_customer_phone text,
  p_payment_method text, p_payment_phone text, p_payment_reference text,
  p_notes text, p_quantity integer, p_fields jsonb, p_request_id uuid
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare s terangazone_private.product_order_data; shop public.shop_settings; current_price integer; number text;
  field jsonb; previous public.orders; value text;
begin
  perform 1 from public.products where id = p_product_id for share;
  select * into s from terangazone_private.product_order_data where id = p_product_id;
  if not found or s.is_active is distinct from true or s.archived_at is not null or not s.whatsapp_enabled
     or (s.category_id is not null and not exists (select 1 from public.categories where id = s.category_id and is_active)) then
    raise exception 'SERVICE_UNAVAILABLE';
  end if;
  perform 1 from public.categories where id = s.category_id and is_active for share;
  if s.category_id is not null and not found then raise exception 'SERVICE_UNAVAILABLE'; end if;
  select * into shop from public.shop_settings where id = 1 for share;
  if not found then raise exception 'SETTINGS_UNAVAILABLE'; end if;
  current_price := public.tz_effective_price(s);
  if current_price is distinct from p_expected_price or s.updated_at is distinct from p_product_updated_at
     or shop.updated_at is distinct from p_settings_updated_at then raise exception 'OFFER_CHANGED'; end if;
  if current_price is null then raise exception 'QUOTE_ONLY'; end if;
  if current_price<=0 then raise exception 'INVALID_PRICE'; end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > 99 or (s.kind <> 'physical' and p_quantity <> 1)
     or (s.kind = 'physical' and s.stock is not null and s.stock < p_quantity)
     or current_price::bigint * p_quantity > 1000000000 then raise exception 'INVALID_QUANTITY'; end if;
  if char_length(btrim(coalesce(p_customer_name,''))) not between 1 and 120
     or coalesce(p_customer_phone,'') !~ '^[+0-9 ().-]+$'
     or char_length(regexp_replace(coalesce(p_customer_phone,''),'[^0-9]','','g')) not between 9 and 15
     or (current_price > 0 and (coalesce(p_payment_phone,'') !~ '^[+0-9 ().-]+$'
       or char_length(regexp_replace(coalesce(p_payment_phone,''),'[^0-9]','','g')) not between 9 and 15))
     or p_payment_method is null or p_payment_method not in ('Wave','Orange Money')
     or char_length(coalesce(p_notes,'')) > 2000 or char_length(coalesce(p_payment_reference,'')) > 150
     or p_request_id is null or p_fields is null or jsonb_typeof(p_fields) <> 'object' then
    raise exception 'INVALID_ORDER';
  end if;
  if exists (select 1 from jsonb_object_keys(p_fields) k where not exists
    (select 1 from jsonb_array_elements(s.order_fields) f where f->>'key' = k)) then raise exception 'INVALID_FIELDS'; end if;
  for field in select * from jsonb_array_elements(s.order_fields) loop
    value := btrim(coalesce(p_fields->>(field->>'key'),''));
    if char_length(value) > 500 or (coalesce((field->>'required')::boolean,false) and value = '')
      or (value <> '' and field->>'type' = 'email' and value !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
      or (value <> '' and field->>'type' = 'tel' and char_length(regexp_replace(value,'[^0-9]','','g')) not between 9 and 15)
    then raise exception 'INVALID_FIELDS'; end if;
  end loop;
  -- Sérialise les doubles clics/reprises portant la même clé aléatoire.
  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));
  select * into previous from public.orders where request_id = p_request_id;
  if found then
    if previous.product_id is distinct from p_product_id or previous.customer_name is distinct from btrim(p_customer_name)
       or previous.customer_phone is distinct from btrim(p_customer_phone) or previous.quantity is distinct from p_quantity
       or previous.payment_method is distinct from p_payment_method or previous.payment_phone is distinct from btrim(p_payment_phone)
       or previous.customer_notes is distinct from btrim(coalesce(p_notes,'')) or previous.order_fields is distinct from p_fields
       or previous.payment_reference is distinct from nullif(btrim(coalesce(p_payment_reference,'')),'') then raise exception 'REQUEST_CONFLICT'; end if;
    return jsonb_build_object('order_number',previous.order_number,'unit_price',previous.unit_price,'total',previous.service_price);
  end if;
  number := 'TZ-' || upper(replace(gen_random_uuid()::text,'-',''));
  insert into public.orders(order_number, customer_name, customer_phone, payment_phone,
    service_name, service_price, duration, payment_method, payment_reference, status, access_message,
    product_id, quantity, unit_price, customer_notes, order_fields, catalogue_snapshot, request_id)
  values(number,btrim(p_customer_name),btrim(p_customer_phone),btrim(p_payment_phone),s.name,
    current_price::bigint * p_quantity,s.billing_period,p_payment_method,nullif(btrim(coalesce(p_payment_reference,'')),''),
    'En attente','',s.id,p_quantity,current_price,btrim(coalesce(p_notes,'')),p_fields,
    jsonb_build_object('service',to_jsonb(s),'settings',to_jsonb(shop)),p_request_id);
  return jsonb_build_object('order_number',number,'unit_price',current_price,'total',current_price::bigint * p_quantity);
end $$;
revoke all on function public.tz_place_order(uuid,integer,timestamptz,timestamptz,text,text,text,text,text,text,integer,jsonb,uuid) from public;
grant execute on function public.tz_place_order(uuid,integer,timestamptz,timestamptz,text,text,text,text,text,text,integer,jsonb,uuid) to anon, authenticated;

-- Verrouille les accès directs à orders sans supprimer les policies existantes.
-- Les policies restrictives s'ajoutent aux permissives et empêchent une ancienne
-- policy trop large d'exposer les accès des clients ou d'accepter un faux prix.
alter table public.orders enable row level security;
-- PUBLIC représente tous les rôles : révoquer aussi les droits hérités et
-- TRUNCATE, qui ne relève pas des contrôles RLS.
revoke all on public.orders from public, anon, authenticated;
-- Les anciens droits par colonne survivent à une révocation sur la table.
-- Les retirer explicitement, y compris sur account_email/account_password.
do $$
declare columns_list text;
begin
  select string_agg(quote_ident(attname),', ' order by attnum) into columns_list
  from pg_catalog.pg_attribute where attrelid='public.orders'::regclass
    and attnum>0 and not attisdropped;
  execute format('revoke select (%1$s), insert (%1$s), update (%1$s), references (%1$s) on public.orders from public, anon, authenticated',columns_list);
end $$;
grant select, insert, update, delete on public.orders to authenticated;
drop policy if exists tz_orders_admin_allow on public.orders;
create policy tz_orders_admin_allow on public.orders for all to authenticated
  using ((select public.tz_is_catalogue_admin())) with check ((select public.tz_is_catalogue_admin()));
drop policy if exists tz_orders_admin_boundary on public.orders;
create policy tz_orders_admin_boundary on public.orders as restrictive for all to authenticated
  using ((select public.tz_is_catalogue_admin())) with check ((select public.tz_is_catalogue_admin()));
drop policy if exists tz_orders_anon_boundary on public.orders;
create policy tz_orders_anon_boundary on public.orders as restrictive for all to anon
  using (false) with check (false);
-- La FK textuelle ON UPDATE CASCADE conserve l'association lors d'un renommage.
commit;

-- FICHIER : 002_initial_catalogue.sql
-- Tarifs corrigés selon la demande du propriétaire. Aucune exécution automatique.
-- CapCut Pro : durée non précisée par le propriétaire, aucun abonnement mensuel supposé.
-- GÉNÉRÉ depuis lib/catalogue/initial.json. Ne pas modifier les prix ici.
-- Après 001, exécution manuelle. Ne remplace jamais les données déjà présentes.
begin;
lock table public.products in share row exclusive mode;
insert into public.categories (id, name, slug, is_active, sort_order) select '10000000-0000-4000-8000-000000000001', 'Streaming', 'streaming', true, 0 on conflict do nothing;
insert into public.categories (id, name, slug, is_active, sort_order) select '10000000-0000-4000-8000-000000000002', 'Intelligence artificielle', 'intelligence-artificielle', true, 1 on conflict do nothing;
insert into public.categories (id, name, slug, is_active, sort_order) select '10000000-0000-4000-8000-000000000003', 'Création', 'creation', true, 2 on conflict do nothing;
insert into public.categories (id, name, slug, is_active, sort_order) select '10000000-0000-4000-8000-000000000004', 'Musique', 'musique', true, 3 on conflict do nothing;
insert into public.categories (id, name, slug, is_active, sort_order) select '10000000-0000-4000-8000-000000000005', 'Logiciels', 'logiciels', true, 4 on conflict do nothing;
insert into public.categories (id, name, slug, is_active, sort_order) select '10000000-0000-4000-8000-000000000006', 'Réseaux sociaux', 'reseaux-sociaux', true, 5 on conflict do nothing;
insert into public.products (id, name, description, category, price, duration, image, active, slug, old_price, promotion_enabled, promo_starts_at, promo_ends_at, is_featured, sort_order, quote_only, details) select '10000000-0000-4000-8000-000000000100', 'Netflix', 'Profitez de vos films et séries préférés. Chaque profil est sécurisé.', 'Streaming', 5000, '1 mois', '/services/netflix.webp', true, 'netflix', NULL, false, NULL, NULL, true, 0, false, '{"short_description":"Profitez de vos films et séries préférés. Chaque profil est sécurisé.","icon":"N","whatsapp_enabled":true,"button_text":"Commander","order_instructions":"","order_fields":[],"kind":"subscription","stock":null,"unit":"","variant_label":"","delivery_info":"","archived_at":null}' where not exists (select 1 from public.products where id='10000000-0000-4000-8000-000000000100' or slug='netflix' or lower(btrim(name))=lower('Netflix')) on conflict do nothing;
insert into public.products (id, name, description, category, price, duration, image, active, slug, old_price, promotion_enabled, promo_starts_at, promo_ends_at, is_featured, sort_order, quote_only, details) select '10000000-0000-4000-8000-000000000101', 'Prime Video', 'Films, séries et programmes exclusifs.', 'Streaming', 5000, '1 mois', '/services/prime-video.webp', true, 'prime-video', NULL, false, NULL, NULL, true, 1, false, '{"short_description":"Films, séries et programmes exclusifs.","icon":"P","whatsapp_enabled":true,"button_text":"Commander","order_instructions":"","order_fields":[],"kind":"subscription","stock":null,"unit":"","variant_label":"","delivery_info":"","archived_at":null}' where not exists (select 1 from public.products where id='10000000-0000-4000-8000-000000000101' or slug='prime-video' or lower(btrim(name))=lower('Prime Video')) on conflict do nothing;
insert into public.products (id, name, description, category, price, duration, image, active, slug, old_price, promotion_enabled, promo_starts_at, promo_ends_at, is_featured, sort_order, quote_only, details) select '10000000-0000-4000-8000-000000000102', 'Disney+', 'Disney, Marvel, Pixar, Star Wars et bien plus.', 'Streaming', 11000, '1 mois', '/services/disney-plus.webp', true, 'disney-plus', NULL, false, NULL, NULL, true, 2, false, '{"short_description":"Disney, Marvel, Pixar, Star Wars et bien plus.","icon":"D+","whatsapp_enabled":true,"button_text":"Commander","order_instructions":"","order_fields":[],"kind":"subscription","stock":null,"unit":"","variant_label":"","delivery_info":"","archived_at":null}' where not exists (select 1 from public.products where id='10000000-0000-4000-8000-000000000102' or slug='disney-plus' or lower(btrim(name))=lower('Disney+')) on conflict do nothing;
insert into public.products (id, name, description, category, price, duration, image, active, slug, old_price, promotion_enabled, promo_starts_at, promo_ends_at, is_featured, sort_order, quote_only, details) select '10000000-0000-4000-8000-000000000103', 'ChatGPT', 'Un assistant intelligent pour le travail, les études et vos projets.', 'Intelligence artificielle', 6500, '1 mois', '/services/chatgpt.webp', true, 'chatgpt', 7500, true, NULL, NULL, true, 3, false, '{"short_description":"Un assistant intelligent pour le travail, les études et vos projets.","icon":"AI","whatsapp_enabled":true,"button_text":"Commander","order_instructions":"","order_fields":[],"kind":"subscription","stock":null,"unit":"","variant_label":"","delivery_info":"","archived_at":null}' where not exists (select 1 from public.products where id='10000000-0000-4000-8000-000000000103' or slug='chatgpt' or lower(btrim(name))=lower('ChatGPT')) on conflict do nothing;
insert into public.products (id, name, description, category, price, duration, image, active, slug, old_price, promotion_enabled, promo_starts_at, promo_ends_at, is_featured, sort_order, quote_only, details) select '10000000-0000-4000-8000-000000000104', 'Canva Pro', 'Créez facilement des affiches, vidéos et visuels professionnels.', 'Création', 15000, '1 an', '/services/canva-pro.webp', true, 'canva-pro', NULL, false, NULL, NULL, false, 4, false, '{"short_description":"Créez facilement des affiches, vidéos et visuels professionnels.","icon":"C","whatsapp_enabled":true,"button_text":"Commander","order_instructions":"","order_fields":[],"kind":"subscription","stock":null,"unit":"","variant_label":"","delivery_info":"","archived_at":null}' where not exists (select 1 from public.products where id='10000000-0000-4000-8000-000000000104' or slug='canva-pro' or lower(btrim(name))=lower('Canva Pro')) on conflict do nothing;
insert into public.products (id, name, description, category, price, duration, image, active, slug, old_price, promotion_enabled, promo_starts_at, promo_ends_at, is_featured, sort_order, quote_only, details) select '10000000-0000-4000-8000-000000000105', 'Spotify Premium', 'Écoutez votre musique préférée sans interruption.', 'Musique', 3500, '1 mois', '/services/spotify-premium.webp', true, 'spotify-premium', NULL, false, NULL, NULL, false, 5, false, '{"short_description":"Écoutez votre musique préférée sans interruption.","icon":"S","whatsapp_enabled":true,"button_text":"Commander","order_instructions":"","order_fields":[],"kind":"subscription","stock":null,"unit":"","variant_label":"","delivery_info":"","archived_at":null}' where not exists (select 1 from public.products where id='10000000-0000-4000-8000-000000000105' or slug='spotify-premium' or lower(btrim(name))=lower('Spotify Premium')) on conflict do nothing;
insert into public.products (id, name, description, category, price, duration, image, active, slug, old_price, promotion_enabled, promo_starts_at, promo_ends_at, is_featured, sort_order, quote_only, details) select '10000000-0000-4000-8000-000000000108', 'CapCut Pro', 'Montage vidéo et création de contenus.', 'Création', 6500, 'Durée non précisée', '/services/capcut-pro.webp', true, 'capcut-pro', NULL, false, NULL, NULL, false, 6, false, '{"short_description":"Montage vidéo et création de contenus.","icon":"CC","whatsapp_enabled":true,"button_text":"Commander","order_instructions":"","order_fields":[],"kind":"subscription","stock":null,"unit":"","variant_label":"","delivery_info":"","archived_at":null}' where not exists (select 1 from public.products where id='10000000-0000-4000-8000-000000000108' or slug='capcut-pro' or lower(btrim(name))=lower('CapCut Pro')) on conflict do nothing;
insert into public.products (id, name, description, category, price, duration, image, active, slug, old_price, promotion_enabled, promo_starts_at, promo_ends_at, is_featured, sort_order, quote_only, details) select '10000000-0000-4000-8000-000000000107', 'Monétisation TikTok', 'Accompagnement pour la création et la configuration d’un compte TikTok éligible.', 'Réseaux sociaux', 15000, 'Service ponctuel', '/services/monetisation-tiktok.webp', true, 'monetisation-tiktok', NULL, false, NULL, NULL, false, 7, false, '{"short_description":"Accompagnement pour la création et la configuration d’un compte TikTok éligible.","icon":"TT","whatsapp_enabled":true,"button_text":"Commander","order_instructions":"","order_fields":[],"kind":"digital","stock":null,"unit":"","variant_label":"","delivery_info":"","archived_at":null}' where not exists (select 1 from public.products where id='10000000-0000-4000-8000-000000000107' or slug='monetisation-tiktok' or lower(btrim(name))=lower('Monétisation TikTok')) on conflict do nothing;
insert into public.shop_settings (id, name, whatsapp_number, email, logo_url, welcome_text, wave_number, wave_name, orange_money_number, orange_money_name, delivery_info, social_links) select 1, 'TerangaZone', '221781108729', '', NULL, 'Tout votre univers numérique au même endroit.', '76 993 83 04', 'TerangaZone', '78 110 87 29', 'TerangaZone', 'Traitement après confirmation du paiement. Les accès et instructions sont transmis sur WhatsApp.', '[]' on conflict do nothing;
commit;

-- FICHIER : 003_register_admin.sql
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
