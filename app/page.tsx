const WHATSAPP_NUMBER = "221781108729";

const services = [
  {
    name: "Netflix",
    category: "Streaming",
    icon: "N",
    color: "from-red-600 to-red-950",
    description: "Profitez de vos films et séries préférés.",
  },
  {
    name: "Prime Video",
    category: "Streaming",
    icon: "P",
    color: "from-cyan-500 to-blue-900",
    description: "Films, séries et programmes exclusifs.",
  },
  {
    name: "ChatGPT",
    category: "Intelligence artificielle",
    icon: "AI",
    color: "from-emerald-500 to-teal-950",
    description: "Un assistant intelligent pour vos projets.",
  },
  {
    name: "Disney+",
    category: "Streaming",
    icon: "D+",
    color: "from-blue-500 to-indigo-950",
    description: "Disney, Marvel, Pixar et Star Wars.",
  },
];

function whatsappLink() {
  const message =
    "Bonjour TerangaZone, je souhaite connaître vos offres et passer une commande.";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute right-[-120px] top-40 h-96 w-96 rounded-full bg-purple-600/20 blur-[130px]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/85 backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <a href="#accueil" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-xl font-black shadow-lg shadow-blue-500/20">
              TZ
            </span>

            <div>
              <p className="text-xl font-black tracking-tight">
                Teranga<span className="text-blue-400">Zone</span>
              </p>
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
                Services numériques
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 lg:flex">
            <a className="transition hover:text-white" href="#accueil">
              Accueil
            </a>
            <a className="transition hover:text-white" href="/boutique">
              Boutique
            </a>
            <a className="transition hover:text-white" href="#avantages">
              Pourquoi nous
            </a>
            <a className="transition hover:text-white" href="#contact">
              Contact
            </a>
          </nav>

          <a
            href="/boutique"
            className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 text-sm font-bold shadow-lg shadow-blue-600/20 transition hover:scale-[1.03]"
          >
            Voir la boutique
          </a>
        </div>
      </header>

      <section
        id="accueil"
        className="relative mx-auto grid min-h-[720px] max-w-7xl items-center gap-16 px-5 py-20 lg:grid-cols-2 lg:px-8"
      >
        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-sm text-blue-200">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Votre boutique numérique de confiance
          </div>

          <h1 className="max-w-3xl text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Tout votre univers
            <span className="block bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
              numérique
            </span>
            au même endroit.
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">
            Netflix, Prime Video, ChatGPT, Disney+, Canva Pro, Spotify Premium,
            logiciels informatiques et accompagnement TikTok.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <a
              href="/boutique"
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-7 py-4 font-bold shadow-xl shadow-blue-600/20 transition hover:-translate-y-1"
            >
              Ouvrir la boutique
              <span>→</span>
            </a>

            <a
              href={whatsappLink()}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-7 py-4 font-bold text-white backdrop-blur transition hover:border-emerald-400/50 hover:bg-emerald-400/10"
            >
              <span>💬</span>
              Commander sur WhatsApp
            </a>
          </div>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-white/10 pt-7">
            <div>
              <p className="text-2xl font-black">1 an+</p>
              <p className="mt-1 text-xs text-slate-400">D’expérience</p>
            </div>
            <div>
              <p className="text-2xl font-black">24/7</p>
              <p className="mt-1 text-xs text-slate-400">Commandes en ligne</p>
            </div>
            <div>
              <p className="text-2xl font-black">Mobile</p>
              <p className="mt-1 text-xs text-slate-400">Simple et rapide</p>
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg">
          <div className="absolute inset-0 rotate-6 rounded-[40px] bg-gradient-to-br from-blue-600/30 to-purple-600/30 blur-2xl" />

          <div className="relative rounded-[36px] border border-white/15 bg-white/[0.07] p-5 shadow-2xl backdrop-blur-2xl sm:p-7">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Offres populaires</p>
                <h2 className="mt-1 text-2xl font-black">TerangaZone</h2>
              </div>
              <div className="rounded-2xl bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300">
                Disponible
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {services.map((service) => (
                <div
                  key={service.name}
                  className="rounded-3xl border border-white/10 bg-black/20 p-4 transition hover:-translate-y-1 hover:border-white/20"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${service.color} font-black shadow-lg`}
                  >
                    {service.icon}
                  </div>
                  <p className="mt-4 font-bold">{service.name}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {service.category}
                  </p>
                </div>
              ))}
            </div>

            <a
              href="/boutique"
              className="mt-5 flex items-center justify-between rounded-3xl border border-blue-400/20 bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-5 font-bold text-blue-200 transition hover:bg-white/10"
            >
              Voir toutes les offres
              <span>→</span>
            </a>
          </div>
        </div>
      </section>

      <section
        id="avantages"
        className="relative border-y border-white/10 bg-white/[0.02] py-24"
      >
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-400">
              Pourquoi TerangaZone ?
            </p>
            <h2 className="mt-4 text-4xl font-black sm:text-5xl">
              Une expérience simple et professionnelle
            </h2>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["⚡", "Service rapide", "Traitement rapide après confirmation."],
              ["💬", "Assistance WhatsApp", "Une assistance directe pour vos commandes."],
              ["🛡️", "Service fiable", "Plus d’un an d’expérience avec nos clients."],
              ["📱", "Compatible mobile", "Commandez depuis votre téléphone."],
            ].map(([icon, title, text]) => (
              <article
                key={title}
                className="rounded-[26px] border border-white/10 bg-black/20 p-6"
              >
                <span className="text-3xl">{icon}</span>
                <h3 className="mt-5 text-lg font-black">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="relative py-24">
        <div className="mx-auto max-w-5xl px-5 lg:px-8">
          <div className="overflow-hidden rounded-[36px] border border-blue-400/20 bg-gradient-to-br from-blue-600/25 via-purple-600/20 to-cyan-500/10 p-8 text-center shadow-2xl shadow-blue-900/20 sm:p-14">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-200">
              Une question ?
            </p>
            <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
              Consultez la boutique ou contactez-nous directement.
            </h2>

            <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
              <a
                href="/boutique"
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 font-black"
              >
                Accéder à la boutique
              </a>

              <a
                href={whatsappLink()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-3 rounded-2xl bg-emerald-500 px-8 py-4 font-black transition hover:bg-emerald-400"
              >
                <span>💬</span>
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black/20">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div>
            <p className="text-xl font-black">
              Teranga<span className="text-blue-400">Zone</span>
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Votre univers de services numériques.
            </p>
          </div>

          <div className="flex flex-wrap gap-5 text-sm text-slate-400">
            <a href="/" className="transition hover:text-white">
              Accueil
            </a>
            <a href="/boutique" className="transition hover:text-white">
              Boutique
            </a>
            <a href="#contact" className="transition hover:text-white">
              Contact
            </a>
          </div>

          <p className="text-sm text-slate-500">© 2026 TerangaZone</p>
        </div>
      </footer>
    </main>
  );
}
