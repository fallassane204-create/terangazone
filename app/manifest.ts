import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "TerangaZone",
    short_name: "TerangaZone",
    description: "Vos services numériques et produits TerangaZone.",
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#050816",
    theme_color: "#050816",
    icons: [
      { src: "/icons/terangazone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/terangazone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/terangazone-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
