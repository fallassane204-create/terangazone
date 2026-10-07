/* Aucun tarif, commande, compte ou écran administrateur n’est mis en cache. */
self.addEventListener("install", (event) => { event.waitUntil(self.skipWaiting()); });
self.addEventListener("activate", (event) => { event.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || request.mode !== "navigate" || url.origin !== self.location.origin) return;
  if (/^\/(admin(?:\/|$)|api(?:\/|$)|auth(?:\/|$)|connexion-admin(?:\/|$)|reset-password(?:\/|$)|mot-de-passe-oublie(?:\/|$)|reinitialiser-mot-de-passe(?:\/|$))/.test(url.pathname)) return;
  event.respondWith(fetch(request).catch(() => new Response(
    '<!doctype html><html lang="fr"><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"><title>TerangaZone — Connexion nécessaire</title><body style="margin:0;background:#050816;color:white;font:18px system-ui;text-align:center;padding:15vh 24px"><div style="display:inline-grid;place-items:center;width:80px;height:80px;border-radius:24px;background:linear-gradient(135deg,#2563eb,#9333ea);font-weight:900;font-size:32px">TZ</div><h1>TerangaZone</h1><p>Vous êtes hors connexion.</p><p>Reconnectez-vous pour consulter les prix actuels et commander.</p><a href="/" style="color:#93c5fd">Réessayer</a></body></html>',
    { status: 503, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }
  )));
});
