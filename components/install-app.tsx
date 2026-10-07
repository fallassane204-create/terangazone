"use client";

import { useEffect, useRef, useState } from "react";

type InstallEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallApp() {
  const prompt = useRef<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [guide, setGuide] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)");
    const update = () => setInstalled(standalone.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    update();
    const ready = (event: Event) => { event.preventDefault(); prompt.current = event as InstallEvent; };
    const done = () => { prompt.current = null; setInstalled(true); setGuide(false); };
    window.addEventListener("beforeinstallprompt", ready);
    window.addEventListener("appinstalled", done);
    standalone.addEventListener("change", update);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
        // Le site et le guide d’installation restent utilisables sans service worker.
      });
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", ready);
      window.removeEventListener("appinstalled", done);
      standalone.removeEventListener("change", update);
    };
  }, []);

  async function install() {
    const event = prompt.current;
    if (!event) { setGuide(!guide); return; }
    setBusy(true);
    try {
      await event.prompt();
      await event.userChoice;
      prompt.current = null;
    } catch {
      setGuide(true);
      setMessage("Utilisez le menu de votre navigateur pour installer TerangaZone.");
    } finally { setBusy(false); }
  }

  if (installed) return null;
  return <div className="border-b border-blue-400/15 bg-blue-500/5">
    <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-300">TerangaZone sur votre téléphone ou ordinateur</p>
        <button type="button" onClick={() => void install()} disabled={busy} aria-expanded={guide} aria-controls="installation-terangazone" className="rounded-xl border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-200 disabled:opacity-50">{busy ? "Installation…" : "Installer TerangaZone"}</button>
      </div>
      {guide && <section id="installation-terangazone" aria-label="Installer TerangaZone" className="mt-4 rounded-2xl border border-white/10 bg-[#0c1122] p-4 text-sm leading-6 text-slate-300">
        <h2 className="font-bold text-white">Gardez TerangaZone à portée de main</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li><strong>Android :</strong> ouvrez ce site dans Chrome, puis menu ⋮ → Installer l’application ou Ajouter à l’écran d’accueil.</li>
          <li><strong>iPhone / iPad :</strong> ouvrez ce site dans Safari, puis Partager → Sur l’écran d’accueil → Ajouter.</li>
          <li><strong>Ordinateur :</strong> ouvrez ce site dans Edge ou Chrome, puis l’icône d’installation dans la barre d’adresse, ou le menu → Installer TerangaZone.</li>
        </ul>
        <p className="mt-3">L’application utilise le logo TerangaZone. Une connexion Internet est nécessaire pour consulter les tarifs et commander.</p>
        {message && <p role="status" className="mt-2">{message}</p>}
        <button type="button" onClick={() => setGuide(false)} className="mt-3 rounded-lg border border-white/15 px-3 py-2 font-bold">Fermer le guide</button>
      </section>}
    </div>
  </div>;
}
