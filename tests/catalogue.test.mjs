import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { effectivePrice, promotionActive, publicServices, validateService, validateSettings, validateCustomerOrder, assertFreshPrice, orderMessage, whatsappLink, safeImageUrl } from "../lib/catalogue/domain.ts";
const initial = JSON.parse(await readFile(new URL("../lib/catalogue/initial.json", import.meta.url), "utf8"));
const service = initial.services.find((s) => s.name === "ChatGPT");
const settings = initial.settings;
const now = "2026-10-06T12:00:00Z";
const order = { service_id: service.id, expected_price: service.price, service_updated_at: null, settings_updated_at: null, customer_name: "Client de test", customer_phone: "+221 77 000 00 00", payment_method: "Wave", payment_phone: "770000000", payment_reference: "REF-é&+", notes: "é & + ?", quantity: 1, fields: {}, request_id: "a4c57bc1-1ef1-4a02-96f3-bc8df0e999ab" };
test("initial prices match the eight requested paid offers without IPTV, Poutoulou or free offers", () => {
  assert.deepEqual(Object.fromEntries(initial.services.map((s) => [s.name, s.price])), { Netflix: 5000, "Prime Video": 5000, "Disney+": 11000, ChatGPT: 6500, "Canva Pro": 15000, "Spotify Premium": 3500, "CapCut Pro": 6500, "Monétisation TikTok": 15000 });
  initial.services.forEach((s) => assert.doesNotThrow(() => validateService(s)));
});
test("initial ChatGPT promotion uses 6500 while preserving the 7500 normal price",()=>{
  assert.equal(service.old_price,7500);assert.equal(service.price,6500);
  assert.equal(service.promotion_enabled,true);
  assert.equal(service.promotion_start,null);assert.equal(service.promotion_end,null);
  assert.equal(promotionActive(service,now),true);assert.equal(effectivePrice(service,now),6500);
  assert.equal(effectivePrice({...service,promotion_enabled:false},now),7500);
  const message=orderMessage(service,settings,order,'TZ-PROMO');
  assert.match(message,/6\u202f500 FCFA/);assert.doesNotMatch(message,/7\u202f500 FCFA/);
});
test("promotion is effective at start and ends exclusively", () => {
  const s = { ...service, price: 4500, old_price: 6500, promotion_enabled: true, promotion_start: "2026-10-06T12:00:00Z", promotion_end: "2026-10-07T12:00:00Z" };
  assert.equal(effectivePrice(s, "2026-10-06T11:59:59Z"), 6500);
  assert.equal(effectivePrice(s, now), 4500); assert.equal(promotionActive(s, now), true);
  assert.equal(effectivePrice(s, s.promotion_end), 6500);
  assert.equal(effectivePrice({ ...s, promotion_enabled: false }, now), 6500);
});
test("disabled, archived and inactive category services are never public", () => {
  assert.equal(publicServices([{ ...service, is_active: false }], initial.categories).length, 0);
  assert.equal(publicServices([{ ...service, archived_at: now }], initial.categories).length, 0);
  assert.equal(publicServices([service], initial.categories.map((c) => ({ ...c, is_active: false }))).length, 0);
});
test("current unit price is shared by display, order and WhatsApp", () => {
  assert.equal(effectivePrice(service, now), order.expected_price);
  assert.doesNotThrow(() => assertFreshPrice(service, settings, order, now));
  const message = orderMessage(service, settings, order, "TZ-TEST");
  assert.match(message, /ChatGPT/); assert.match(message, /6\u202f500 FCFA/); assert.match(message, /TZ-TEST/);
  assert.match(message, /Wave/); assert.match(message, /76 993 83 04/); assert.match(message, /é & \+ \?/);
  const url = new URL(whatsappLink(settings.whatsapp_number, message));
  assert.equal(url.searchParams.get("text"), message); assert.equal(url.pathname, "/221781108729");
});
test("stale price or payment coordinates require a refresh", () => {
  assert.throws(() => assertFreshPrice({ ...service, price: 4500 }, settings, order, now), /changé/);
  assert.throws(() => assertFreshPrice(service, { ...settings, updated_at: now }, order, now), /changé/);
  assert.throws(() => assertFreshPrice({ ...service, updated_at: now }, settings, order, now), /changé/);
});
test("invalid prices and promotions are rejected", () => {
  for (const price of [0, -1, 3.5, NaN, 1000000001]) assert.throws(() => validateService({ ...service, price }));
  assert.throws(() => validateService({ ...service, old_price: 5000 }));
  assert.throws(() => validateService({ ...service, old_price: null, promotion_enabled: true }));
  assert.throws(() => validateService({ ...service, promotion_start: "2026-10-07", promotion_end: "2026-10-06" }));
});
test("physical quantity and required order fields are validated", () => {
  const s = { ...service, kind: "physical", stock: 3, unit: "sachets", order_fields: [{ key: "adresse", label: "Adresse", type: "text", required: true, placeholder: "" }] };
  assert.throws(() => validateCustomerOrder({ ...order, quantity: 4 }, s), /Stock/);
  assert.throws(() => validateCustomerOrder(order, s), /Adresse/);
  const physicalOrder = { ...order, quantity: 2, fields: { adresse: "Adresse de test" } };
  assert.doesNotThrow(() => validateCustomerOrder(physicalOrder, s));
  assert.match(orderMessage(s, settings, physicalOrder), /13\u202f000 FCFA/);
  assert.match(orderMessage(s, settings, physicalOrder), /Adresse : Adresse de test/);
  assert.throws(() => validateCustomerOrder({ ...order, fields: { unknown: "test" } }, service), /périmées/);
});
test("phone text entry allows international numbers and spaces", () => {
  assert.doesNotThrow(() => validateCustomerOrder(order, service));
  assert.throws(() => validateCustomerOrder({ ...order, customer_phone: "abc" }, service));
  assert.throws(() => validateCustomerOrder({ ...order, customer_name: "   " }, service));
  assert.throws(() => validateCustomerOrder({ ...order, quantity: 2 }, service));
});
test("image and social link validation rejects unsafe schemes", () => {
  assert.equal(safeImageUrl("javascript:alert(1)"), false); assert.equal(safeImageUrl("//example.com/a"), false);
  assert.equal(safeImageUrl("https://example.com/a.png"), true); assert.equal(safeImageUrl("/image.png"), true);
  assert.throws(() => validateSettings({ ...settings, social_links: [{ label: "Test", url: "javascript:alert(1)" }] }));
  assert.throws(() => validateSettings({ ...settings, whatsapp_number: "abc" }));
});
test("duplicate order-field keys are rejected", () => {
  const field = { key: "address", label: "Adresse", type: "text", required: true, placeholder: "" };
  assert.throws(() => validateService({ ...service, order_fields: [field, field] }));
});
