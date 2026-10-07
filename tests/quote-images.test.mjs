import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { temporaryImageFor } from "../lib/catalogue/images.ts";

test("new quote and IPTV images are valid landscape WebP assets below the upload limit", async () => {
  for (const name of ["shooting-photo", "creation-site-web", "logiciels-informatiques", "iptv"]) {
    const bytes = await readFile(new URL(`../public/services/paysage/${name}.webp`, import.meta.url));
    const info = await sharp(bytes).metadata();
    assert.equal(info.format, "webp"); assert.equal(info.width, 1200); assert.equal(info.height, 750);
    assert.ok(bytes.length < 5 * 1024 * 1024);
  }
});

test("fallback selects matching artwork for the three quote services and all IPTV durations", () => {
  for (const [name, file] of [["Shooting photo", "shooting-photo"], ["Création de site web", "creation-site-web"], ["Vente de logiciels informatiques", "logiciels-informatiques"], ...["1 mois", "2 mois", "3 mois", "6 mois", "1 an"].map((period) => [`IPTV — ${period}`, "iptv"])]) {
    assert.equal(temporaryImageFor(name), `/services/paysage/${file}.webp`);
  }
});
