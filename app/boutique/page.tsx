"use client";

import { useMemo, useState } from "react";

const products = [
  {
    name: "Netflix",
    category: "Streaming",
    icon: "N",
    color: "from-red-600 to-red-950",
    description:
      "Profitez de vos films et séries préférés. Chaque profil est sécurisé.",
    badge: "Populaire",
    price: "5 000 FCFA",
    duration: "/ mois",
  },
  {
    name: "Prime Video",
    category: "Streaming",
    icon: "P",
    color: "from-cyan-500 to-blue-900",
    description: "Films, séries et programmes exclusifs.",
    badge: "Disponible",
    price: "3 500 FCFA",
    duration: "/ mois",
  },
  {
    name: "Disney+",
    category: "Streaming",
    icon: "D+",
    color: "from-blue-500 to-indigo-950",
    description: "Disney, Marvel, Pixar, Star Wars et bien plus.",
    badge: "Disponible",
    price: "11 000 FCFA",
    duration: "/ mois",
  },
  {
    name: "ChatGPT",
    category: "Intelligence artificielle",
    icon: "AI",
    color: "from-emerald-500 to-teal-950",
    description:
      "Un assistant intelligent pour le travail, les études et vos projets.",
    badge: "Très demandé",
    price: "6 500 FCFA",
    duration: "/ mois",
  },
  {
    name: "Canva Pro",
    category: "Création",
    icon: "C",
    color: "from-cyan-500 to-purple-800",
    description:
      "Créez facilement des affiches, vidéos et visuels professionnels.",
    badge: "Offre annuelle",
    price: "15 000 FCFA",
    duration: "/ an",
  },
  {
    name: "Spotify Premium",
    category: "Musique",
    icon: "S",
    color: "from-green-500 to-green-950",
    description: "Écoutez votre musique préférée sans interruption.",
    badge: "Musique",
    price: "3 500 FCFA",
    duration: "/ mois",
  },
  {
    name: "Logiciels informatiques",
    category: "Logiciels",
    icon: "PC",
    color: "from-slate-500 to-blue-950",
    description:
      "Windows, Microsoft Office, antivirus et autres logiciels informatiques.",
    badge: "Sur demande",
    price: "Sur demande",
    duration: "",
  },
  {
    name: "Monétisation TikTok",
    category: "Réseaux sociaux",
    icon: "TT",
    color: "from-pink-500 via-black to-cyan-500",
    description:
      "Accompagnement pour la création et la configuration d’un compte TikTok éligible.",
    badge: "Accompagnement",
    price: "15 000 FCFA",
    duration: "",
  },
];

const categories = [
  "Tous",
  "Streaming",
  "Intelligence artificielle",
  "Création",
  "Musique",
  "Logiciels",
  "Réseaux sociaux",
];

export default function BoutiquePage() {
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "Tous" || product.category === selectedCategory;

      const term = search.trim().toLowerCase();

      const matchesSearch =
        term.length === 0 ||
        product.name.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term);

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, search]);

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <a href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-xl font-black">
              TZ
            </span>

            <div>
              <p className="text-xl font-black">
                Teranga<span className="text-blue-400">Zone</span>
              </p>
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
                Boutique numérique
              </p>
            </div>
          </a>

          <div className="flex items-center gap-3">
            <a
              href="/commande"
              className="hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 text-sm font-bold sm:block"
            >
              Commander
            </a>

            <a
              href="/"
              className="rounded-xl border border-white/15 px-5 py-3 text-sm font-bold transition hover:bg-white/10"
            >
              Accueil
            </a>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/10 py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-blue-600/20 blur-[110px]" />
          <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-purple-600/20 blur-[110px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-400">
            Boutique TerangaZone
          </p>

          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
            Choisissez votre service numérique
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">
            Consultez nos tarifs, choisissez votre service puis remplissez le
            formulaire de commande avant d’envoyer votre preuve de paiement.
          </p>

          <div className="mt-10 max-w-2xl">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher Netflix, ChatGPT, Canva..."
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white outline-none placeholder:text-slate-500 focus:border-blue-400/50"
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  selectedCategory === category
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <p className="mb-8 text-sm text-slate-400">
          {filteredProducts.length} service
          {filteredProducts.length > 1 ? "s" : ""} affiché
          {filteredProducts.length > 1 ? "s" : ""}
        </p>

        {filteredProducts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <article
                key={product.name}
                className="group relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.045] p-6 transition duration-300 hover:-translate-y-2 hover:border-blue-400/30 hover:bg-white/[0.07]"
              >
                <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-blue-500/10 blur-3xl" />

                <div className="relative flex items-start justify-between gap-4">
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${product.color} text-xl font-black shadow-xl`}
                  >
                    {product.icon}
                  </div>

                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                    {product.badge}
                  </span>
                </div>

                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {product.category}
                </p>

                <h2 className="mt-2 text-2xl font-black">{product.name}</h2>

                <p className="mt-3 min-h-14 text-sm leading-6 text-slate-400">
                  {product.description}
                </p>

                <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Tarif
                  </p>

                  <div className="mt-2 flex items-end gap-2">
                    <p className="text-2xl font-black text-blue-300">
                      {product.price}
                    </p>

                    {product.duration && (
                      <p className="pb-1 text-sm text-slate-400">
                        {product.duration}
                      </p>
                    )}
                  </div>
                </div>

                <a
                  href={`/commande?service=${encodeURIComponent(product.name)}`}
                  className="mt-6 flex items-center justify-between rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-4 font-bold shadow-lg shadow-blue-600/10 transition hover:scale-[1.02]"
                >
                  Commander
                  <span>→</span>
                </a>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[30px] border border-white/10 bg-white/5 p-12 text-center">
            <p className="text-4xl">🔎</p>
            <h2 className="mt-5 text-2xl font-black">Aucun service trouvé</h2>
            <p className="mt-3 text-slate-400">
              Essayez une autre recherche ou sélectionnez « Tous ».
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
