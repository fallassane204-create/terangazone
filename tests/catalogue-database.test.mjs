import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createTestDatabase, asRole, ADMIN_ID, USER_ID, orderArgs, placeOrder, serviceRow } from "./support/local-database.mjs";
import { effectivePrice } from "../lib/catalogue/domain.ts";
import { managedServiceImagePath, replaceServiceImage } from "../lib/catalogue/image-replacement.ts";
import { prepareServiceImage } from "../lib/catalogue/image-upload.ts";
import sharp from "sharp";
import { serviceToProduct } from "../lib/catalogue/products.ts";
let db;
before(async () => { db = await createTestDatabase(); });
after(async () => { if (db) await db.close(); });
test("migration creates the catalogue and preserves historical orders", async () => {
  assert.equal((await db.query("select count(*)::int as n from products")).rows[0].n, 8);
  assert.equal((await db.query("select service_price from orders where order_number='TZ-HISTORICAL'")).rows[0].service_price, 6500);
});

test("generated SQL and initial.json agree for every initial product field",async()=>{
  const initial=JSON.parse(await readFile(new URL('../lib/catalogue/initial.json',import.meta.url),'utf8'));
  for(const service of initial.services){
    const expected=serviceToProduct(service,initial.categories.find(category=>category.id===service.category_id).name);
    const actual=(await db.query('select * from products where id=$1',[service.id])).rows[0];
    assert.ok(actual,service.name);
    for(const [field,value] of Object.entries(expected)){
      if(!['created_at','updated_at','archived_at'].includes(field)) assert.deepEqual(actual[field],value,`${service.name}.${field}`);
    }
    const image=await readFile(new URL(`../public${actual.image}`,import.meta.url));
    assert.equal((await sharp(image).metadata()).format,'webp',actual.image);
  }
  const capcut=await serviceRow(db,'CapCut Pro');
  assert.equal(capcut.category,'Création');assert.equal(capcut.active,true);
  assert.equal(capcut.details.whatsapp_enabled,true);assert.equal(capcut.promotion_enabled,false);
  assert.equal(capcut.old_price,null);assert.equal(capcut.promo_starts_at,null);assert.equal(capcut.promo_ends_at,null);
});
test("migrations can be repeated without duplicating products or tables", async () => {
  const sql = await readSql();
  await db.exec(sql);
  await db.exec(await readFile(new URL("../supabase/migrations/002_initial_catalogue.sql", import.meta.url), "utf8"));
  assert.equal((await db.query("select count(*)::int as n from products")).rows[0].n,8);
  assert.equal((await db.query("select to_regclass('public.services') as table_name")).rows[0].table_name,null);
});
test("seed never overwrites a changed offer or a pre-existing product", async () => {
  await db.query("update products set price=7200 where name='ChatGPT'");
  await db.query("insert into products(id,name,price,category) values('30000000-0000-4000-8000-000000000001','Produit préexistant',1234,'Streaming')");
  const seed = await readFile(new URL("../supabase/migrations/002_initial_catalogue.sql", import.meta.url), "utf8");
  await db.exec(await readSql());
  await db.exec(seed);
  assert.equal((await serviceRow(db)).price,7200);
  assert.equal((await db.query("select price from products where name='Produit préexistant'")).rows[0].price,1234);
  await db.query("update products set price=6500 where name='ChatGPT'");
  // Fixture owner only; migrations themselves never delete products.
  await db.query("delete from products where name='Produit préexistant'");
});
test("browser accounts cannot grant themselves admin rights", async () => {
  await assert.rejects(() => asRole(db,"authenticated",USER_ID,(tx) => tx.query("insert into admins(email) values('client@example.test')")),/permission denied/);
  assert.equal(await asRole(db,"authenticated",USER_ID,async(tx)=>(await tx.query("select tz_is_catalogue_admin() as allowed")).rows[0].allowed),false);
});
test("registration is idempotent and category rename keeps product association", async () => {
  const registration = (await readFile(new URL("../supabase/migrations/003_register_admin.sql",import.meta.url),"utf8")).replace("fallassane204@gmail.com","admin@example.test");
  await db.exec(registration);
  assert.equal((await db.query("select count(*)::int as n from admins")).rows[0].n,1);
  await asRole(db,"authenticated",ADMIN_ID,(tx)=>tx.query("update categories set name='IA renommée' where name='Intelligence artificielle'"));
  assert.equal((await serviceRow(db)).category,"IA renommée");
  assert.equal((await asRole(db,"anon",null,(tx)=>serviceRow(tx))).price,6500);
  await asRole(db,"authenticated",ADMIN_ID,(tx)=>tx.query("update categories set name='Intelligence artificielle' where name='IA renommée'"));
});
async function readSql() { return readFile(new URL("../supabase/migrations/001_catalogue.sql", import.meta.url), "utf8"); }
test("orders original constraints and all 22 historical column values are preserved",async()=>{
  const before=(await db.query("select * from migration_baseline order by conname")).rows;
  const after=(await db.query("select oid,conname,pg_get_constraintdef(oid) as definition from pg_constraint where conrelid='public.orders'::regclass and conname in (select conname from migration_baseline) order by conname")).rows;
  assert.deepEqual(after,before);
  assert.ok(before.some((c)=>c.conname==='orders_pkey'));
  assert.ok(before.some((c)=>c.conname==='orders_order_number_key'));
  const original=(await db.query("select row from historical_baseline")).rows[0].row;
  assert.equal(Object.keys(original).length,22);
  const current=(await db.query("select to_jsonb(o) as row from orders o where order_number='TZ-HISTORICAL'")).rows[0].row;
  for(const [column,value] of Object.entries(original)) assert.deepEqual(current[column],value,column);
});
test("only admin can read sensitive order columns; public receipt never returns credentials",async()=>{
  await assert.rejects(()=>asRole(db,'anon',null,(tx)=>tx.query('select account_email,account_password from orders')),/permission denied/);
  assert.deepEqual((await asRole(db,'authenticated',USER_ID,(tx)=>tx.query('select account_email,account_password from orders'))).rows,[]);
  const visible=await asRole(db,'authenticated',ADMIN_ID,(tx)=>tx.query("select account_email,account_password from orders where order_number='TZ-HISTORICAL'"));
  assert.equal(visible.rows[0].account_password,'TEST_ONLY');
  assert.equal(visible.rows[0].account_email,'client-history@example.test');
  const args=await orderArgs(db);
  const receipt=await asRole(db,'anon',null,(tx)=>placeOrder(tx,args));
  assert.deepEqual(Object.keys(receipt).sort(),['order_number','total','unit_price']);
});
test("inherited PUBLIC privileges cannot allow truncation of orders",async()=>{
  await assert.rejects(()=>asRole(db,'anon',null,(tx)=>tx.query('truncate orders')),/permission denied/);
  await assert.rejects(()=>asRole(db,'authenticated',USER_ID,(tx)=>tx.query('truncate orders')),/permission denied/);
});
test("anonymous visitor reads the active catalogue but cannot read orders", async () => {
  const count = await asRole(db, "anon", null, async (tx) => (await tx.query("select count(*)::int as n from products")).rows[0].n);
  assert.equal(count, 8);
  await assert.rejects(() => asRole(db, "anon", null, (tx) => tx.query("select account_password from orders")), /permission denied/);
});
test("ordinary authenticated user cannot modify prices or read private orders", async () => {
  const changed = await asRole(db, "authenticated", USER_ID, (tx) => tx.query("update products set price=1 where name='ChatGPT' returning id"));
  assert.equal(changed.rows.length, 0);
  assert.equal((await serviceRow(db)).price, 6500);
  const orders = await asRole(db, "authenticated", USER_ID, (tx) => tx.query("select * from orders"));
  assert.equal(orders.rows.length, 0);
  await assert.rejects(() => asRole(db, "authenticated", USER_ID, (tx) => tx.query("insert into categories(name,slug) values('Interdit','interdit')")), /row-level security/);
});
test("admin changes a price and public reads the new value immediately", async () => {
  await asRole(db, "authenticated", ADMIN_ID, (tx) => tx.query("update products set price=4500 where name='ChatGPT'"));
  const row = await asRole(db, "anon", null, (tx) => serviceRow(tx));
  assert.equal(row.price, 4500);
  await asRole(db, "authenticated", ADMIN_ID, (tx) => tx.query("update products set price=6500 where name='ChatGPT'"));
});
test("disabled service and disabled category disappear from public reads", async () => {
  await asRole(db, "authenticated", ADMIN_ID, (tx) => tx.query("update products set active=false where name='ChatGPT'"));
  assert.equal(await asRole(db, "anon", null, async (tx) => (await tx.query("select * from products where name='ChatGPT'")).rows.length), 0);
  await asRole(db, "authenticated", ADMIN_ID, (tx) => tx.query("update products set active=true where name='ChatGPT'"));
  const service = await serviceRow(db);
  await asRole(db, "authenticated", ADMIN_ID, (tx) => tx.query("update categories set is_active=false where id=$1", [service.category_id]));
  assert.equal(await asRole(db, "anon", null, async (tx) => (await tx.query("select * from products where name='ChatGPT'")).rows.length), 0);
  await asRole(db, "authenticated", ADMIN_ID, (tx) => tx.query("update categories set is_active=true where id=$1", [service.category_id]));
});
test("RPC records the current price, notes and immutable service snapshot", async () => {
  const args = await orderArgs(db);
  const receipt = await asRole(db, "anon", null, (tx) => placeOrder(tx, args));
  assert.equal(receipt.unit_price, 6500); assert.equal(receipt.total, 6500);
  const order = (await db.query("select * from orders where order_number=$1", [receipt.order_number])).rows[0];
  assert.equal(order.customer_notes, "Note de test"); assert.equal(order.catalogue_snapshot.service.name, "ChatGPT");
  await asRole(db, "authenticated", ADMIN_ID, (tx) => tx.query("update products set price=4500 where name='ChatGPT'"));
  assert.equal((await db.query("select service_price from orders where order_number=$1", [receipt.order_number])).rows[0].service_price, 6500);
  await asRole(db, "authenticated", ADMIN_ID, (tx) => tx.query("update products set price=6500 where name='ChatGPT'"));
});
test("forged or stale price cannot create an order", async () => {
  const args = await orderArgs(db, { p_expected_price: 1 });
  await assert.rejects(() => asRole(db, "anon", null, (tx) => placeOrder(tx, args)), /OFFER_CHANGED/);
  const stale = await orderArgs(db);
  await asRole(db, "authenticated", ADMIN_ID, (tx) => tx.query("update products set description=description || ' ' where name='ChatGPT'"));
  await assert.rejects(() => asRole(db, "anon", null, (tx) => placeOrder(tx, stale)), /OFFER_CHANGED/);
});
test("double submission records a single order", async () => {
  const args = await orderArgs(db);
  const a = await asRole(db, "anon", null, (tx) => placeOrder(tx, args));
  const b = await asRole(db, "anon", null, (tx) => placeOrder(tx, args));
  assert.equal(a.order_number, b.order_number);
  assert.equal((await db.query("select count(*)::int as n from orders where request_id=$1", [args.p_request_id])).rows[0].n, 1);
});
test("direct malicious inserts are denied even with an old permissive policy", async () => {
  const sql = "insert into orders(order_number,customer_name,customer_phone,service_name,service_price,status) values('TZ-ATTACK','Test','770000000','ChatGPT',1,'Livrée')";
  await assert.rejects(() => asRole(db, "anon", null, (tx) => tx.query(sql)), /permission denied/);
  await assert.rejects(() => asRole(db, "authenticated", USER_ID, (tx) => tx.query(sql)), /row-level security/);
});
test("SQL and UI promotion calculations agree, including expiry", async () => {
  for (const end of ["now() + interval '1 day'", "now() - interval '1 day'"]) {
    await asRole(db, "authenticated", ADMIN_ID, (tx) => tx.query(`update products set price=4500,old_price=7500,promotion_enabled=true,promo_ends_at=${end} where name='ChatGPT'`));
    const row = await serviceRow(db);
    const sql = (await db.query("select tz_effective_price(s) as price, now() as time from terangazone_private.product_order_data s where name='ChatGPT'")).rows[0];
    assert.equal(effectivePrice({ ...row, promotion_start: row.promotion_start?.toISOString(), promotion_end: row.promotion_end?.toISOString() }, sql.time), sql.price);
  }
  await asRole(db, "authenticated", ADMIN_ID, (tx) => tx.query("update products set price=6500,old_price=7500,promotion_enabled=true,promo_ends_at=null where name='ChatGPT'"));
});
test("admin can archive without deleting historical orders", async () => {
  await asRole(db, "authenticated", ADMIN_ID, (tx) => tx.query("update products set details=jsonb_set(details,'{archived_at}',to_jsonb(now()::text)),active=false where name='ChatGPT'"));
  assert.equal(await asRole(db, "anon", null, async (tx) => (await tx.query("select * from products where name='ChatGPT'")).rows.length), 0);
  assert.equal((await db.query("select count(*)::int as n from orders where order_number='TZ-HISTORICAL'")).rows[0].n, 1);
  await asRole(db, "authenticated", ADMIN_ID, (tx) => tx.query("update products set details=details-'archived_at',active=true where name='ChatGPT'"));
});
test("non-admin cannot alter shop payment coordinates", async () => {
  const result = await asRole(db, "authenticated", USER_ID, (tx) => tx.query("update shop_settings set whatsapp_number='221770000000' returning id"));
  assert.equal(result.rows.length, 0);
  assert.equal((await db.query("select whatsapp_number from shop_settings")).rows[0].whatsapp_number, "221781108729");
});
test("payment-coordinate changes reject a pending checkout", async () => {
  const args = await orderArgs(db);
  await asRole(db, "authenticated", ADMIN_ID, (tx) => tx.query("update shop_settings set wave_name=wave_name || ' test' where id=1"));
  await assert.rejects(() => asRole(db, "anon", null, (tx) => placeOrder(tx, args)), /OFFER_CHANGED/);
  await asRole(db, "authenticated", ADMIN_ID, (tx) => tx.query("update shop_settings set wave_name='TerangaZone' where id=1"));
});
test("disabled services are also rejected by the public order RPC", async () => {
  const args = await orderArgs(db);
  await asRole(db, "authenticated", ADMIN_ID, (tx) => tx.query("update products set active=false where name='ChatGPT'"));
  await assert.rejects(() => asRole(db, "anon", null, (tx) => placeOrder(tx, args)), /SERVICE_UNAVAILABLE/);
  await asRole(db, "authenticated", ADMIN_ID, (tx) => tx.query("update products set active=true where name='ChatGPT'"));
});
test("physical orders require extra fields, respect stock and preserve total", async () => {
  const category = (await serviceRow(db)).category_id;
  const inserted = await asRole(db, "authenticated", ADMIN_ID, (tx) => tx.query("insert into products(name,slug,category,price,details) values('Produit de test','produit-de-test',(select name from categories where id=$1),3000,jsonb_build_object('kind','physical','stock',3,'unit','sachet','order_fields',$2::jsonb)) returning *", [category, JSON.stringify([{ key: "address", label: "Adresse", type: "text", required: true, placeholder: "" }])]));
  const service = inserted.rows[0];
  const args = await orderArgs(db, { p_product_id: service.id, p_expected_price: 3000, p_product_updated_at: service.updated_at.toISOString(), p_quantity: 2 });
  await assert.rejects(() => asRole(db, "anon", null, (tx) => placeOrder(tx, args)), /INVALID_FIELDS/);
  await assert.rejects(() => asRole(db, "anon", null, (tx) => placeOrder(tx, { ...args, p_quantity: 4, p_fields: { address: "Adresse de test" } })), /INVALID_QUANTITY/);
  const result = await asRole(db, "anon", null, (tx) => placeOrder(tx, { ...args, p_fields: { address: "Adresse de test" } }));
  assert.equal(result.total, 6000); assert.equal(result.unit_price, 3000);
});
test("zero-price commandable offers are refused by PostgreSQL", async () => {
  await assert.rejects(()=>asRole(db,"authenticated",ADMIN_ID,(tx)=>tx.query("update products set price=0 where name='ChatGPT'")),/tz_products_positive_price/);
  assert.equal((await serviceRow(db)).price,6500);
});
test("Storage writes are admin-only even with a legacy permissive policy",async()=>{
  const name='services/30000000-0000-4000-8000-000000000001.webp';
  const insert=(tx)=>tx.query("insert into storage.objects(bucket_id,name) values('service-images',$1)",[name]);
  await assert.rejects(()=>asRole(db,'anon',null,insert),/row-level security/);
  await assert.rejects(()=>asRole(db,'authenticated',USER_ID,insert),/row-level security/);
  await asRole(db,'authenticated',ADMIN_ID,insert);
  assert.equal((await asRole(db,'authenticated',USER_ID,(tx)=>tx.query("select * from storage.objects where bucket_id='service-images'"))).rows.length,0);
  await assert.rejects(()=>asRole(db,'authenticated',ADMIN_ID,(tx)=>tx.query("insert into storage.objects(bucket_id,name) values('service-images','services/evil.svg')")),/row-level security/);
  for(const extension of ['jpg','jpeg','png']) {
    await assert.rejects(()=>asRole(db,'authenticated',ADMIN_ID,tx=>tx.query("insert into storage.objects(bucket_id,name) values('service-images',$1)",[name.replace('.webp',`.${extension}`)])),/row-level security/);
  }
  assert.equal((await asRole(db,'authenticated',USER_ID,(tx)=>tx.query("delete from storage.objects where name=$1 returning name",[name]))).rows.length,0);
  await asRole(db,'authenticated',ADMIN_ID,(tx)=>tx.query("delete from storage.objects where name=$1",[name]));
});

test("image migration retains the public 5 MiB bucket and leaves other buckets unchanged",async()=>{
  const bucket=(await db.query("select * from storage.buckets where id='service-images'")).rows[0];
  assert.equal(bucket.public,true);assert.equal(Number(bucket.file_size_limit),5242880);
  assert.deepEqual(bucket.allowed_mime_types,['image/jpeg','image/png','image/webp']);
  await db.query("insert into storage.buckets(id,name,public) values('other-bucket','other-bucket',false)");
  await asRole(db,'authenticated',USER_ID,async tx=>{
    await tx.query("insert into storage.objects(bucket_id,name) values('other-bucket','unchanged.png')");
    const changed=await tx.query("update storage.objects set name='still-unchanged.png' where bucket_id='other-bucket' returning name");
    assert.equal(changed.rows.length,1);
    const deleted=await tx.query("delete from storage.objects where bucket_id='other-bucket' returning name");
    assert.equal(deleted.rows.length,1);
  });
  assert.equal((await db.query("select public from storage.buckets where id='other-bucket'")).rows[0].public,false);
});

test("converted PNG replacement updates the real local products row before deleting its old Storage object",async()=>{
  const bucket='https://example.supabase.co/storage/v1/object/public/service-images/';
  const oldPath='services/40000000-0000-4000-8000-000000000001.webp';
  const newPath='services/40000000-0000-4000-8000-000000000002.webp';
  const row=await serviceRow(db);
  const source=await sharp({create:{width:96,height:60,channels:3,background:'#643cff'}}).png().toBuffer();
  const bytes=await prepareServiceImage(new File([source],'replacement.png',{type:'image/png'}));
  await asRole(db,'authenticated',ADMIN_ID,async(tx)=>{
    await tx.query("insert into storage.objects(bucket_id,name) values('service-images',$1)",[oldPath]);
    await tx.query("update products set image=$1 where id=$2",[bucket+oldPath,row.id]);
  });
  const result=await replaceServiceImage({previousImage:bucket+oldPath,newImage:bucket+newPath,newPath,
    resolveOldPath:url=>managedServiceImagePath(url,bucket),
    upload:async()=>{
      assert.equal((await sharp(bytes).metadata()).format,'webp');
      await asRole(db,'authenticated',ADMIN_ID,tx=>tx.query("insert into storage.objects(bucket_id,name) values('service-images',$1)",[newPath]));
    },
    save:async(url)=>{
      await asRole(db,'authenticated',ADMIN_ID,tx=>tx.query("update products set image=$1 where id=$2",[url,row.id]));
      return {ok:true,message:'saved'};
    },
    isReferenced:async(url)=>(await asRole(db,'authenticated',ADMIN_ID,tx=>tx.query("select id from products where image=$1",[url]))).rows.length>0,
    remove:async(path)=>{
      assert.equal((await serviceRow(db)).image,bucket+newPath);
      assert.equal(path,oldPath);
      await asRole(db,'authenticated',ADMIN_ID,tx=>tx.query("delete from storage.objects where bucket_id='service-images' and name=$1",[path]));
    },
  });
  assert.equal(result.ok,true);
  assert.equal((await serviceRow(db)).image,bucket+newPath);
  assert.equal((await db.query("select name from storage.objects where name=$1",[oldPath])).rows.length,0);
  assert.equal((await db.query("select name from storage.objects where name=$1",[newPath])).rows.length,1);
  await db.query("update products set image=$1 where id=$2",[row.image,row.id]);
});
