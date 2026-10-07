// Base éphémère de test : ne charge jamais .env.local et n'utilise aucun réseau.
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
export const ADMIN_ID = "20000000-0000-4000-8000-000000000001";
export const USER_ID = "20000000-0000-4000-8000-000000000002";
export async function createTestDatabase() {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema storage;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,unique(bucket_id,name));
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated;
    grant select,insert,update,delete on storage.objects to anon,authenticated;
    create policy legacy_storage_open on storage.objects for all to anon,authenticated using(true) with check(true);
    create schema auth;
    create table auth.users(id uuid primary key, email text);
    insert into auth.users values ('${ADMIN_ID}', 'admin@example.test'), ('${USER_ID}', 'client@example.test');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    grant usage on schema auth, public to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    create table public.admins(id uuid not null default gen_random_uuid(), email text not null, created_at timestamptz default now());
    alter table public.admins enable row level security;
    create table public.products (
      id uuid primary key default gen_random_uuid(), name text not null, description text,
      category text, price integer not null, duration text, image text,
      active boolean default true, created_at timestamptz default now()
    );
    alter table public.products enable row level security;
    grant all on public.products, public.admins to anon, authenticated;
    create policy legacy_products_open on public.products for all to anon, authenticated using(true) with check(true);
    create policy legacy_admins_open on public.admins for all to anon, authenticated using(true) with check(true);
    create table public.orders (
      id uuid constraint orders_pkey primary key default gen_random_uuid(),
      order_number text constraint orders_order_number_key unique not null,
      customer_name text not null, customer_phone text not null, payment_phone text,
      service_name text not null, service_price integer not null, duration text,
      payment_method text, payment_reference text, status text not null, access_message text,
      account_email text, account_password text, profile_name text, expiration_date date,
      internal_notes text, delivered_at timestamptz, paid_at timestamptz,
      renewed_at timestamptz, renewal_count integer default 0,
      created_at timestamptz not null default now()
    );
    alter table public.orders enable row level security;
    grant all on public.orders to anon, authenticated;
    -- Permissions anciennes volontairement excessives : la migration doit
    -- aussi révoquer les droits hérités et les droits accordés par colonne.
    grant select(account_email,account_password) on public.orders to public, anon, authenticated;
    grant truncate on public.orders to public;
    create policy legacy_open on public.orders for all to anon, authenticated using (true) with check (true);
    insert into public.orders(order_number,customer_name,customer_phone,service_name,service_price,status,account_email,account_password)
      values('TZ-HISTORICAL','Ancien client de test','770000000','ChatGPT',6500,'Livrée','client-history@example.test','TEST_ONLY');
    create table migration_baseline as
      select c.oid,c.conname,pg_get_constraintdef(c.oid) as definition
      from pg_constraint c where c.conrelid='public.orders'::regclass;
    create table historical_baseline as select to_jsonb(o) as row from public.orders o;
  `);
  for (const name of ["001_catalogue.sql", "002_initial_catalogue.sql", "003_register_admin.sql", "004_service_images_storage.sql"]) {
    let sql = await readFile(new URL(`../../supabase/migrations/${name}`, import.meta.url), "utf8");
    sql = sql.replace("fallassane204@gmail.com", "admin@example.test");
    await db.exec(sql);
  }
  return db;
}
export async function asRole(db, role, userId, fn) {
  if (!["anon", "authenticated"].includes(role)) throw new Error("Rôle de test invalide.");
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${role}`);
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [userId ?? ""]);
    return fn(tx);
  });
}
export async function serviceRow(db, name = "ChatGPT") { return (await db.query("select p.*, c.id as category_id, p.promo_starts_at as promotion_start, p.promo_ends_at as promotion_end from public.products p left join public.categories c on c.name=p.category where p.name=$1", [name])).rows[0]; }
export async function orderArgs(db, overrides = {}) {
  const service = await serviceRow(db);
  const settings = (await db.query("select * from public.shop_settings where id=1")).rows[0];
  return { p_product_id: service.id, p_expected_price: service.price,
    p_product_updated_at: service.updated_at.toISOString(), p_settings_updated_at: settings.updated_at.toISOString(),
    p_customer_name: "Client de test", p_customer_phone: "770000000", p_payment_method: "Wave", p_payment_phone: "770000000",
    p_payment_reference: "REF-TEST", p_notes: "Note de test", p_quantity: 1, p_fields: {}, p_request_id: crypto.randomUUID(), ...overrides };
}
export async function placeOrder(tx, args) {
  const entries = Object.entries(args);
  return (await tx.query(`select public.tz_place_order(${entries.map(([key], i) => `${key} => $${i + 1}`).join(",")}) as receipt`, entries.map(([, value]) => typeof value === "object" ? JSON.stringify(value) : value))).rows[0].receipt;
}
