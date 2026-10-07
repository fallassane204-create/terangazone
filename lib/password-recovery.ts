export function recoveryRedirect(origin: string): string {
  const url = new URL(origin);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))) {
    throw new Error("Adresse du site invalide.");
  }
  return new URL("/auth/callback", url.origin).href;
}
