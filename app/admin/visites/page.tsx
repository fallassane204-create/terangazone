export default function VisitsPage() {
  return <main className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
    <h1 className="text-3xl font-black">Visites du site</h1>
    <p className="mt-3 text-slate-400">Consultez les visiteurs, les pages vues et la fréquentation par jour dans le tableau de statistiques de votre projet TerangaZone.</p>
    <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-xl font-bold">Votre audience</h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">Choisissez la période souhaitée : les visiteurs et les pages vues sont deux mesures différentes. Les nouvelles visites sont ajoutées progressivement ; les pages de l’administration sont exclues du suivi à partir de cette mise à jour.</p>
      <a href="https://vercel.com/fallassane204-2952s-projects/terangazone/analytics" target="_blank" rel="noopener noreferrer" className="mt-6 inline-block rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 font-bold">Voir le nombre de visites ↗</a>
      <p className="mt-3 text-xs text-slate-400">Le tableau s’ouvre dans un nouvel onglet et demande votre connexion au compte d’hébergement du site. Aucun compteur n’est affiché aux clients.</p>
    </section>
  </main>;
}
