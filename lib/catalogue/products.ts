import type { Category, Service } from "./types.ts";

// products conserve ses colonnes historiques. Les options avancées de la
// boutique sont regroupées dans un seul objet, sans second catalogue.
export type ProductRow = {
  id: string; name: string; description: string | null; category: string | null;
  price: number; duration: string | null; image: string | null; active: boolean | null;
  created_at: string | null; updated_at: string; slug: string | null;
  old_price: number | null; promotion_enabled: boolean; promo_starts_at: string | null;
  promo_ends_at: string | null; is_featured: boolean; sort_order: number;
  quote_only: boolean; details: Partial<Service>;
};
export function productToService(row: ProductRow, categories: Category[]): Service {
  const d = row.details ?? {};
  return {
    id: row.id, name: row.name, description: row.description ?? "", slug: row.slug ?? row.id,
    category_id: categories.find((c) => c.name === row.category)?.id ?? "",
    price: row.quote_only ? null : row.price, old_price: row.old_price,
    promotion_enabled: row.promotion_enabled, promotion_start: row.promo_starts_at,
    promotion_end: row.promo_ends_at, billing_period: row.duration ?? "Service",
    image_url: row.image, is_active: row.active === true, is_featured: row.is_featured,
    sort_order: row.sort_order, created_at: row.created_at, updated_at: row.updated_at,
    short_description: d.short_description ?? (row.description ?? "").slice(0, 300),
    icon: d.icon ?? "TZ", whatsapp_enabled: d.whatsapp_enabled ?? true,
    button_text: d.button_text ?? "Commander", order_instructions: d.order_instructions ?? "",
    order_fields: d.order_fields ?? [], kind: d.kind ?? "digital", stock: d.stock ?? null,
    unit: d.unit ?? "", variant_label: d.variant_label ?? "", delivery_info: d.delivery_info ?? "",
    archived_at: d.archived_at ?? null,
  };
}
export function serviceToProduct(s: Partial<Service>, category: string) {
  return {
    name: s.name, description: s.description, category, price: s.price ?? 0,
    duration: s.billing_period, image: s.image_url, active: s.is_active, slug: s.slug,
    old_price: s.old_price, promotion_enabled: s.promotion_enabled,
    promo_starts_at: s.promotion_start, promo_ends_at: s.promotion_end,
    is_featured: s.is_featured, sort_order: s.sort_order, quote_only: s.price === null,
    details: { short_description: s.short_description, icon: s.icon,
      whatsapp_enabled: s.whatsapp_enabled, button_text: s.button_text,
      order_instructions: s.order_instructions, order_fields: s.order_fields,
      kind: s.kind, stock: s.stock, unit: s.unit, variant_label: s.variant_label,
      delivery_info: s.delivery_info, archived_at: s.archived_at ?? null },
  };
}
