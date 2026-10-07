// Assets temporaires originaux. products.image reste prioritaire.
export const temporaryServiceImages: Record<string, string> = {
  netflix: "/services/netflix.webp", "prime-video": "/services/prime-video.webp",
  "disney-plus": "/services/disney-plus.webp", chatgpt: "/services/chatgpt.webp",
  "canva-pro": "/services/canva-pro.webp", "spotify-premium": "/services/spotify-premium.webp",
  "capcut-pro": "/services/capcut-pro.webp", "monetisation-tiktok": "/services/monetisation-tiktok.webp",
  "logiciels-informatiques": "/services/logiciels-informatiques.webp",
  "shooting-photo": "/services/paysage/shooting-photo.webp",
  "creation-de-site-web": "/services/paysage/creation-site-web.webp",
  "vente-de-logiciels-informatiques": "/services/paysage/logiciels-informatiques.webp",
};
export function temporaryImageFor(name: string) {
  const slug = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/disney\+/, "disney-plus").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return /^iptv(?:-|$)/.test(slug) ? "/services/paysage/iptv.webp" : temporaryServiceImages[slug] ?? "/services/fallback.webp";
}
