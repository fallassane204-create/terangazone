export function renewalDate(expiration: string | null, duration: string | null, now = new Date()) {
  const months = duration === "1 an" ? 12 : duration === "1 mois" ? 1 : 0;
  if (!months) throw new Error("Ce service ne possède pas de durée renouvelable.");
  const current = expiration ? new Date(expiration + "T12:00:00Z") : now;
  if (Number.isNaN(current.getTime())) throw new Error("Date d’expiration invalide.");
  const base = new Date(Math.max(current.getTime(), now.getTime()));
  const day = base.getUTCDate();
  base.setUTCDate(1);
  base.setUTCMonth(base.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate();
  base.setUTCDate(Math.min(day, lastDay));
  return base.toISOString().slice(0, 10);
}
