import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import sharp from "sharp";
import manifest from "../app/manifest.ts";
import { publicAnalyticsEvent } from "../lib/analytics.ts";

test("application uses TerangaZone identity and correctly sized local icons", async () => {
  const app = manifest();
  assert.equal(app.name, "TerangaZone"); assert.equal(app.display, "standalone");
  for (const icon of app.icons) {
    const image = await sharp(await readFile(new URL(`../public${icon.src}`, import.meta.url))).metadata();
    assert.equal(`${image.width}x${image.height}`, icon.sizes);
  }
  const apple = await sharp(await readFile(new URL("../public/icons/terangazone-apple-180.png", import.meta.url))).metadata();
  assert.equal(apple.width, 180); assert.equal(apple.height, 180);
});

test("visit tracking strips query data and excludes private account pages", () => {
  assert.deepEqual(publicAnalyticsEvent({ url: "https://terangazone.vercel.app/commande?email=private#secret", type: "pageview" }), { url: "https://terangazone.vercel.app/commande", type: "pageview" });
  for (const path of ["/admin", "/admin/visites", "/auth/callback", "/connexion-admin", "/reset-password", "/reinitialiser-mot-de-passe", "/mot-de-passe-oublie", "/api/orders"]) assert.equal(publicAnalyticsEvent({ url: `https://example.test${path}` }), null);
  assert.equal(publicAnalyticsEvent({ url: "invalid" }), null);
});

test("service worker never stores catalogues or intercepts private requests and payments", async () => {
  const listeners = {};
  const requests = [];
  vm.runInNewContext(await readFile(new URL("../public/sw.js", import.meta.url), "utf8"), {
    self: { location: { origin: "https://example.test" }, addEventListener: (event, handler) => { listeners[event] = handler; } },
    URL, Response, fetch: async (request) => { requests.push(request); throw new Error("offline"); },
  });
  for (const [path, method, mode] of [["/admin", "GET", "navigate"], ["/api/orders", "GET", "navigate"], ["/commande", "POST", "navigate"], ["/boutique", "GET", "cors"], ["https://other.test/", "GET", "navigate"]]) {
    let intercepted = false;
    listeners.fetch({ request: { url: path.startsWith("https") ? path : `https://example.test${path}`, method, mode }, respondWith: () => { intercepted = true; } });
    assert.equal(intercepted, false);
  }
  let response;
  listeners.fetch({ request: { url: "https://example.test/boutique", method: "GET", mode: "navigate" }, respondWith: (result) => { response = result; } });
  const offline = await response;
  assert.equal(requests.length, 1); assert.equal(offline.status, 503);
  assert.equal(offline.headers.get("cache-control"), "no-store");
  assert.match(await offline.text(), /Reconnectez-vous/);
});
