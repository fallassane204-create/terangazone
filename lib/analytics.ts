// Les statistiques portent sur les pages publiques, sans paramètres de commande.
export function publicAnalyticsEvent<T extends { url: string }>(event: T): T | null {
  try {
    const url = new URL(event.url);
    if (/^\/(admin(?:\/|$)|connexion-admin(?:\/|$)|auth(?:\/|$)|reset-password(?:\/|$)|mot-de-passe-oublie(?:\/|$)|reinitialiser-mot-de-passe(?:\/|$)|api(?:\/|$))/.test(url.pathname)) return null;
    return { ...event, url: `${url.origin}${url.pathname}` };
  } catch { return null; }
}
