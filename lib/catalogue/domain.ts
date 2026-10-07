import type { Category, CustomerOrder, OrderField, Service, ShopSettings } from "./types.ts";

export function formatPrice(price: number | null) {
  return price === null ? "Sur devis" : `${price.toLocaleString("fr-FR")} FCFA`;
}
export function effectivePrice(service: Service, now: Date | string = new Date()): number | null {
  const time = new Date(now).getTime();
  const active = service.promotion_enabled && service.old_price !== null &&
    (!service.promotion_start || time >= Date.parse(service.promotion_start)) &&
    (!service.promotion_end || time < Date.parse(service.promotion_end));
  return service.old_price !== null && !active ? service.old_price : service.price;
}
export function promotionActive(service: Service, now: Date | string = new Date()) {
  return service.promotion_enabled && service.old_price !== null && service.price !== null &&
    effectivePrice(service, now) === service.price && service.old_price > service.price;
}
export function publicServices(services: Service[], categories: Category[]) {
  const activeCategories = new Set(categories.filter((c) => c.is_active).map((c) => c.id));
  return services.filter((s) => s.is_active && !s.archived_at && activeCategories.has(s.category_id) && (s.price === null || s.price > 0))
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "fr"));
}
export function validPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return /^[+0-9 ().-]+$/.test(value.trim()) && digits.length >= 9 && digits.length <= 15;
}
export function whatsappNumber(value: string) {
  const trimmed = value.trim();
  let digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 9) digits = `221${digits}`;
  if (!/^[1-9]\d{9,14}$/.test(digits)) throw new Error("Numéro WhatsApp invalide, avec indicatif international requis.");
  return digits;
}
export function whatsappLink(number: string, text: string) {
  return `https://wa.me/${whatsappNumber(number)}?text=${encodeURIComponent(text)}`;
}
export function safeImageUrl(value: string | null) {
  if (!value) return true;
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return true;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
}
function text(value: unknown, label: string, max = 2000, required = false) {
  if (typeof value !== "string" || value.length > max || (required && !value.trim())) throw new Error(`${label} invalide.`);
  return value.trim();
}
function bool(value: unknown) {
  if (typeof value !== "boolean") throw new Error("Valeur oui/non invalide.");
  return value;
}
function integer(value: unknown, label: string, nullable = false): number | null {
  if (nullable && (value === null || value === "")) return null;
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0 || value > 1000000000) throw new Error(`${label} doit être un entier positif ou nul.`);
  return value;
}
function date(value: unknown) {
  if (!value) return null;
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) throw new Error("Date invalide.");
  return new Date(value).toISOString();
}
export function validateCategory(input: Partial<Category>) {
  const name = text(input.name, "Nom", 100, true);
  const slug = text(input.slug, "Identifiant", 100, true);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Identifiant : lettres minuscules, chiffres et tirets uniquement.");
  return { name, slug, is_active: bool(input.is_active), sort_order: integer(input.sort_order, "Ordre") as number };
}
export function validateService(input: Partial<Service>) {
  const name = text(input.name, "Nom", 120, true);
  const slug = text(input.slug, "Identifiant", 120, true);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Identifiant invalide.");
  const category_id = text(input.category_id, "Catégorie", 36, true);
  if (!/^[0-9a-f-]{36}$/i.test(category_id)) throw new Error("Catégorie invalide.");
  const price = integer(input.price, "Prix", true);
  if (price === 0) throw new Error("Le prix doit être supérieur à 0 FCFA. Aucune offre gratuite.");
  if (price === null && input.whatsapp_enabled) throw new Error("Un service sur devis ne peut pas être commandé directement.");
  const old_price = integer(input.old_price, "Prix normal", true);
  if (old_price !== null && (price === null || old_price <= price)) throw new Error("Le prix normal doit dépasser le prix promotionnel.");
  const promotion_enabled = bool(input.promotion_enabled);
  if (promotion_enabled && old_price === null) throw new Error("Renseignez un prix normal pour activer la promotion.");
  const promotion_start = date(input.promotion_start);
  const promotion_end = date(input.promotion_end);
  if (promotion_start && promotion_end && promotion_start >= promotion_end) throw new Error("La fin de promotion doit suivre son début.");
  const image_url = input.image_url ? text(input.image_url, "Image", 2000) : null;
  if (!safeImageUrl(image_url)) throw new Error("Image : chemin local ou URL HTTPS requis.");
  const kind = input.kind;
  if (kind !== "digital" && kind !== "subscription" && kind !== "physical") throw new Error("Type de produit invalide.");
  const stock = integer(input.stock, "Stock", true);
  const rawFields = input.order_fields;
  if (!Array.isArray(rawFields) || rawFields.length > 8) throw new Error("Maximum 8 informations supplémentaires.");
  const keys = new Set<string>();
  const order_fields: OrderField[] = rawFields.map((f) => {
    const key = text(f.key, "Clé du champ", 40, true);
    if (!/^[a-z][a-z0-9_]*$/.test(key) || ["__proto__", "prototype", "constructor"].includes(key) || keys.has(key)) throw new Error("Clé de champ invalide ou dupliquée.");
    keys.add(key);
    if (!["text", "email", "tel"].includes(f.type)) throw new Error("Type de champ invalide.");
    return { key, label: text(f.label, "Libellé", 120, true), type: f.type, required: bool(f.required), placeholder: text(f.placeholder, "Exemple", 120) };
  });
  return {
    name, slug, category_id, price, old_price, promotion_enabled, promotion_start, promotion_end, image_url,
    description: text(input.description, "Description", 10000), short_description: text(input.short_description, "Résumé", 300),
    billing_period: text(input.billing_period, "Durée", 100, true), icon: text(input.icon, "Icône", 8),
    is_active: bool(input.is_active), is_featured: bool(input.is_featured), whatsapp_enabled: bool(input.whatsapp_enabled),
    sort_order: integer(input.sort_order, "Ordre") as number,
    button_text: text(input.button_text, "Texte du bouton", 80, true), order_instructions: text(input.order_instructions, "Instructions", 2000),
    order_fields, kind, stock, unit: text(input.unit, "Unité", 60), variant_label: text(input.variant_label, "Variante", 100),
    delivery_info: text(input.delivery_info, "Livraison", 2000),
  };
}
export function validateSettings(input: Partial<ShopSettings>) {
  const whatsapp_number = whatsappNumber(text(input.whatsapp_number, "WhatsApp", 30, true));
  const email = text(input.email, "E-mail", 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("E-mail invalide.");
  const logo_url = input.logo_url ? text(input.logo_url, "Logo", 2000) : null;
  if (!safeImageUrl(logo_url)) throw new Error("Logo : chemin local ou URL HTTPS requis.");
  if (!Array.isArray(input.social_links) || input.social_links.length > 8) throw new Error("Liens sociaux invalides.");
  const social_links = input.social_links.map((link) => {
    const label = text(link.label, "Réseau", 60, true);
    const url = text(link.url, "Lien", 2000, true);
    if (!url.startsWith("https://") || !safeImageUrl(url)) throw new Error("Lien social HTTPS requis.");
    return { label, url };
  });
  const wave_number = text(input.wave_number, "Numéro Wave", 30, true);
  const orange_money_number = text(input.orange_money_number, "Numéro Orange Money", 30, true);
  if (!validPhone(wave_number) || !validPhone(orange_money_number)) throw new Error("Numéro de paiement invalide.");
  return { name: text(input.name, "Nom boutique", 100, true), whatsapp_number, email, logo_url,
    welcome_text: text(input.welcome_text, "Bienvenue", 1000, true), wave_number, orange_money_number,
    wave_name: text(input.wave_name, "Titulaire Wave", 120, true), orange_money_name: text(input.orange_money_name, "Titulaire Orange Money", 120, true),
    delivery_info: text(input.delivery_info, "Livraison", 2000), social_links };
}
export function validateCustomerOrder(order: CustomerOrder, service: Service, paymentRequired = true) {
  if (order.expected_price === null || order.expected_price <= 0) throw new Error("Une commande doit avoir un prix supérieur à 0 FCFA.");
  text(order.customer_name, "Votre nom", 120, true);
  if (!validPhone(order.customer_phone)) throw new Error("Votre téléphone est invalide.");
  if (!Number.isInteger(order.quantity) || order.quantity < 1 || order.quantity > 99 || (service.kind !== "physical" && order.quantity !== 1)) throw new Error("Quantité invalide.");
  if (service.kind === "physical" && service.stock !== null && order.quantity > service.stock) throw new Error("Stock insuffisant.");
  if (!["Wave", "Orange Money"].includes(order.payment_method)) throw new Error("Moyen de paiement invalide.");
  if (paymentRequired && order.expected_price !== null && order.expected_price > 0 && !validPhone(order.payment_phone)) throw new Error("Le numéro utilisé pour payer est invalide.");
  if (order.expected_price !== null && order.expected_price * order.quantity > 1000000000) throw new Error("Le montant total dépasse la limite de commande.");
  text(order.notes, "Précisions", 2000); text(order.payment_reference, "Référence", 150);
  if (!order.fields || typeof order.fields !== "object" || Array.isArray(order.fields)) throw new Error("Informations invalides.");
  const allowed = new Set(service.order_fields.map((field) => field.key));
  if (Object.keys(order.fields).some((key) => !allowed.has(key))) throw new Error("Informations de commande périmées. Rechargez la page.");
  for (const field of service.order_fields) {
    const value = text(order.fields[field.key] ?? "", field.label, 500, field.required);
    if (value && field.type === "tel" && !validPhone(value)) throw new Error(`${field.label} invalide.`);
    if (value && field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error(`${field.label} invalide.`);
  }
}
export function assertFreshPrice(service: Service, settings: ShopSettings, order: CustomerOrder, now: Date | string = new Date()) {
  if (effectivePrice(service, now) !== order.expected_price || service.updated_at !== order.service_updated_at || settings.updated_at !== order.settings_updated_at) {
    throw new Error("L’offre ou les coordonnées de paiement ont changé. Rechargez la page avant de payer ou commander.");
  }
}
export function orderMessage(service: Service, settings: ShopSettings, order: CustomerOrder, orderNumber?: string, indicative = false) {
  const total = order.expected_price === null ? null : order.expected_price * order.quantity;
  return [
    `Bonjour ${settings.name}, ${indicative || total === null ? "je souhaite confirmer une offre." : "j’ai effectué un paiement."}`,
    "", `Service : ${service.name}`, `Prix unitaire${indicative ? " indicatif" : ""} : ${formatPrice(order.expected_price)}`,
    `Quantité : ${order.quantity}${service.unit ? ` ${service.unit}` : ""}`, `Total${indicative ? " à confirmer" : ""} : ${formatPrice(total)}`,
    `Durée : ${service.billing_period}`, service.variant_label ? `Variante : ${service.variant_label}` : "",
    `Nom : ${order.customer_name.trim()}`, `Téléphone : ${order.customer_phone.trim()}`,
    ...(total !== null && total > 0 && !indicative ? [`Moyen de paiement : ${order.payment_method}`,
      `Numéro destinataire : ${order.payment_method === "Wave" ? settings.wave_number : settings.orange_money_number}`,
      `Titulaire : ${order.payment_method === "Wave" ? settings.wave_name : settings.orange_money_name}`,
      `Numéro utilisé pour payer : ${order.payment_phone}`, `Référence : ${order.payment_reference.trim() || "Non renseignée"}`] : []),
    ...service.order_fields.map((field) => `${field.label} : ${order.fields[field.key]?.trim() || "Non renseigné"}`),
    `Précisions : ${order.notes.trim() || "Aucune"}`, service.kind === "physical" ? `Livraison : ${service.delivery_info || settings.delivery_info || "À convenir"}` : "",
    orderNumber ? `Numéro de commande : ${orderNumber}` : "",
    !indicative && total !== null && total > 0 ? "Je vais joindre la preuve de paiement dans WhatsApp." : "Merci de confirmer la disponibilité.",
  ].filter(Boolean).join("\n");
}
