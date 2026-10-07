import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";

// Le monogramme TZ et le dégradé du logo déjà affiché dans l’en-tête du site.
const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><defs><linearGradient id="tz" x2="1" y2="1"><stop stop-color="#2563eb"/><stop offset="1" stop-color="#9333ea"/></linearGradient></defs><rect width="512" height="512" fill="url(#tz)"/><text x="256" y="328" text-anchor="middle" font-family="Arial, sans-serif" font-size="208" font-weight="900" fill="white">TZ</text></svg>`);
await mkdir("public/icons", { recursive: true });
for (const [name, size] of [["terangazone-192", 192], ["terangazone-512", 512], ["terangazone-maskable-512", 512], ["terangazone-apple-180", 180]]) {
  await sharp(svg).resize(size, size).png().toFile(`public/icons/${name}.png`);
}
const png = await sharp(svg).resize(256, 256).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12);
header.writeUInt32LE(png.length, 14); header.writeUInt32LE(22, 18);
await writeFile("app/favicon.ico", Buffer.concat([header, png]));
console.log("Logo TZ : icônes application, iOS et favicon générées.");
