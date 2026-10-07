import { test } from "node:test";
import assert from "node:assert/strict";
import initial from "../lib/catalogue/initial.json" with { type: "json" };
import { productToService, serviceToProduct } from "../lib/catalogue/products.ts";
import { orderMessage, effectivePrice } from "../lib/catalogue/domain.ts";

test("products columns roundtrip preserves the eight offers and quote semantics", () => {
  for (const service of initial.services) {
    const category = initial.categories.find((c) => c.id === service.category_id).name;
    const row = { ...serviceToProduct(service, category), id: service.id,
      created_at: null, updated_at: "2026-10-07T00:00:00Z" };
    const restored = productToService(row, initial.categories);
    assert.equal(typeof row.price, "number");
    assert.equal(restored.price, service.price);
    assert.equal(restored.name, service.name);
    assert.equal(restored.category_id, service.category_id);
    assert.equal(restored.billing_period, service.billing_period);
  }
});
test("WhatsApp uses the current name and promotional price loaded from products", () => {
  const original = initial.services.find((s) => s.name === "ChatGPT");
  const row = { ...serviceToProduct(original, "Intelligence artificielle"),
    id: original.id, name: "Offre renommée dans products", price: 4500,
    old_price: 6500, promotion_enabled: true, updated_at: "2026-10-07T00:00:00Z" };
  const service = productToService(row, initial.categories);
  const order = { expected_price: effectivePrice(service), quantity: 1,
    customer_name: "Test", customer_phone: "770000000", payment_method: "Wave",
    payment_phone: "770000000", payment_reference: "TEST", notes: "", fields: {} };
  const message = orderMessage(service, initial.settings, order);
  assert.match(message, /Offre renommée dans products/);
  assert.match(message.replace(/[\s\u202f\u00a0]/g,""), /4500FCFA/);
  assert.doesNotMatch(message, /6500/);
});
