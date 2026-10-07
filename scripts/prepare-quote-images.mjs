import sharp from "sharp";
import { join } from "node:path";

// Optimisation des créations originales ; les PNG source restent conservés.
const sourceRoot = join(process.env.USERPROFILE, ".codex/generated_images/01a112dc-25e2-7bd2-be18-1a34355ab176");
const files = [
  ["exec-7cc0b2b9-1671-4fdf-8dba-d290e4c2f388.png", "shooting-photo"],
  ["exec-e552a98d-2fa9-4e37-a912-3529bae1360f.png", "creation-site-web"],
  ["exec-a8ebfdc0-2c0f-4952-a5a8-a44e197bc749.png", "logiciels-informatiques"],
  ["exec-33c67ff7-bb1c-47d7-8abc-28eb2286d555.png", "iptv"],
];
for (const [source, name] of files) {
  const info = await sharp(join(sourceRoot, source)).resize(1200, 750, { fit: "cover" }).webp({ quality: 88 }).toFile(`public/services/paysage/${name}.webp`);
  console.log(`${name}.webp : ${info.width} × ${info.height}, ${info.size} octets`);
}
