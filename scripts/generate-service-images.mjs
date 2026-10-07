// Illustrations originales TerangaZone, sans téléchargement ni assets tiers.
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
const offers = [
  ['netflix','Netflix','CINÉMA & SÉRIES','#ff4a68','screen'],
  ['prime-video','Prime Video','CINÉMA & SÉRIES','#57c8ff','play'],
  ['disney-plus','Disney+','DES HISTOIRES À PARTAGER','#a6b4ff','stars'],
  ['chatgpt','ChatGPT','UN COUP D’AVANCE','#6ee7ca','spark'],
  ['canva-pro','Canva Pro','DONNEZ VIE À VOS IDÉES','#aa94ff','design'],
  ['spotify-premium','Spotify Premium','VOTRE UNIVERS MUSICAL','#75efaa','music'],
  ['capcut-pro','CapCut Pro','CRÉEZ. MONTEZ. PARTAGEZ.','#83deff','edit'],
  ['monetisation-tiktok','Monétisation TikTok','CRÉATEURS & AMBITIONS','#fc93d6','growth'],
  ['logiciels-informatiques','Logiciels informatiques','DES OUTILS POUR AVANCER','#8db8ff','software'],
  ['fallback','TerangaZone','VOTRE UNIVERS NUMÉRIQUE','#ab9dff','spark'],
];
const esc = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;');
const paths = {
  screen: '<rect x="-100" y="-66" width="200" height="126" rx="20"/><path d="M-44 90H44M0 60V90"/><path d="M-15-32L37-3L-15 28Z" fill="currentColor" stroke="none"/>',
  play: '<path d="M-48-76L88 0L-48 76Z" fill="currentColor" stroke="none"/><path d="M-105 87Q0 134 105 87" stroke-width="9"/>',
  stars: '<path d="M0-96L19-25L88 0L19 25L0 96L-19 25L-88 0L-19-25Z"/><path d="M-108-78Q0-158 108-78"/><path d="M104 35L111 55L130 62L111 69L104 89L97 69L78 62L97 55Z" fill="currentColor" stroke="none"/>',
  spark: '<path d="M0-100L24-24L100 0L24 24L0 100L-24 24L-100 0L-24-24Z"/><circle cx="0" cy="0" r="23"/><path d="M93-97V-57M73-77H113"/>',
  design: '<rect x="-92" y="-82" width="128" height="150" rx="20" transform="rotate(-12)"/><rect x="-25" y="-52" width="130" height="150" rx="20" fill="#152347"/><path d="M1 55L66-29L91-10L27 74L-2 86Z" fill="currentColor" stroke="none"/>',
  music: '<path d="M-100 18V-6A100 100 0 0 1 100-6V18"/><rect x="-109" y="-5" width="43" height="88" rx="17"/><rect x="66" y="-5" width="43" height="88" rx="17"/><path d="M-28-22V48M0-44V70M28-22V48"/>',
  edit: '<rect x="-112" y="-82" width="224" height="164" rx="22"/><path d="M-112-39H112M-62-82V-39M-8-82V-39M46-82V-39"/><path d="M-24-12L44 24L-24 60Z" fill="currentColor" stroke="none"/>',
  growth: '<path d="M-82 89V26M-30 89V-13M22 89V-50" stroke-width="24"/><path d="M-95-16L-37-70L8-47L92-113M45-113H92V-66" stroke-width="10"/><circle cx="76" cy="48" r="39"/><path d="M76 27V69M62 37Q76 23 90 37Q104 51 76 51Q48 51 62 65Q76 79 90 65" stroke-width="5"/>',
  software: '<rect x="-114" y="-86" width="228" height="172" rx="22"/><path d="M-114-42H114"/><circle cx="-86" cy="-64" r="4"/><circle cx="-68" cy="-64" r="4"/><circle cx="-50" cy="-64" r="4"/><path d="M-48-8L-76 22L-48 52M48-8L76 22L48 52M15-15L-15 59"/>',
};
await mkdir('public/services/source',{recursive:true});
const tiles=[];
for(const [slug,name,tag,color,icon] of offers){
  const nameSize=name.length>20?48:name.length>14?56:68;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="750" viewBox="0 0 1200 750">
  <defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#0c1737"/><stop offset=".55" stop-color="#11132f"/><stop offset="1" stop-color="#242058"/></linearGradient>
  <radialGradient id="glow"><stop stop-color="${color}" stop-opacity=".23"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>
  <linearGradient id="tile" x2="1" y2="1"><stop stop-color="#27365d"/><stop offset="1" stop-color="#101a39"/></linearGradient></defs>
  <rect width="1200" height="750" fill="url(#bg)"/><ellipse cx="855" cy="276" rx="450" ry="390" fill="url(#glow)"/>
  <g fill="none" stroke="#aeb8ff" stroke-opacity=".08"><path d="M-50 610Q520 240 1260 390"/><path d="M-30 643Q520 270 1260 423"/><path d="M-10 676Q520 300 1260 456"/><circle cx="1020" cy="96" r="240"/><circle cx="1020" cy="96" r="290"/></g>
  <rect x="42" y="42" width="1116" height="666" rx="38" fill="none" stroke="#c1cbff" stroke-opacity=".12"/>
  <g font-family="Arial,sans-serif"><rect x="78" y="76" width="44" height="44" rx="12" fill="#8172f3"/><text x="100" y="105" text-anchor="middle" font-size="20" font-weight="700" fill="white">TZ</text>
  <text x="139" y="106" font-size="22" font-weight="700" letter-spacing="3" fill="#cad4ef">TERANGAZONE</text>
  <g transform="translate(914 300) rotate(-7)"><rect x="-160" y="-160" width="320" height="320" rx="68" fill="#060d20" opacity=".25" transform="translate(0 20)"/><rect x="-160" y="-160" width="320" height="320" rx="68" fill="url(#tile)" stroke="${color}" stroke-opacity=".35" stroke-width="2"/>
  <g color="${color}" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">${paths[icon]}</g></g>
  <rect x="80" y="270" width="58" height="5" rx="2.5" fill="${color}"/>
  <text x="80" y="332" font-size="20" font-weight="700" letter-spacing="2" fill="${color}">${esc(tag)}</text>
  <text x="80" y="426" font-size="${nameSize}" font-weight="700" letter-spacing="-2" fill="#f3f6ff">${esc(name)}</text>
  <text x="80" y="481" font-size="25" fill="#a9b6d6">Services numériques, simplement.</text>
  <path d="M80 605H1120" stroke="#aeb8ff" stroke-opacity=".13"/>
  <circle cx="90" cy="650" r="5" fill="${color}"/><text x="109" y="657" font-size="19" letter-spacing="2" fill="#899abf">SÉLECTION TERANGAZONE</text><text x="1118" y="657" text-anchor="end" font-size="24" fill="${color}">↗</text>
  </g></svg>`;
  await writeFile(`public/services/source/${slug}.svg`,svg);
  await sharp(Buffer.from(svg)).webp({quality:88}).toFile(`public/services/${slug}.webp`);
  tiles.push({input:await sharp(Buffer.from(svg)).resize(480,300).png().toBuffer(),left:(tiles.length%3)*496+16,top:Math.floor(tiles.length/3)*316+16});
}
await mkdir('docs/images',{recursive:true});
await sharp({create:{width:1504,height:964,channels:3,background:'#070c1c'}}).composite(tiles.slice(0,9)).png().toFile('docs/images/services-preview.png');
console.log('9 illustrations + fallback WebP créés localement, format 1200 × 750.');
