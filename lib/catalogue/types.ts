export type Category = {
  id: string; name: string; slug: string; is_active: boolean; sort_order: number;
  updated_at: string | null;
};
export type OrderField = { key: string; label: string; type: "text" | "email" | "tel"; required: boolean; placeholder: string };
export type Service = {
  id: string; name: string; slug: string; category_id: string;
  description: string; short_description: string; price: number | null;
  old_price: number | null; promotion_enabled: boolean;
  promotion_start: string | null; promotion_end: string | null;
  billing_period: string; image_url: string | null; icon: string;
  is_active: boolean; is_featured: boolean; sort_order: number;
  whatsapp_enabled: boolean; button_text: string; order_instructions: string;
  order_fields: OrderField[]; kind: "digital" | "subscription" | "physical";
  stock: number | null; unit: string; variant_label: string; delivery_info: string;
  archived_at: string | null; created_at: string | null; updated_at: string | null;
};
export type ShopSettings = {
  id: number; name: string; whatsapp_number: string; email: string;
  logo_url: string | null; welcome_text: string;
  wave_number: string; wave_name: string; orange_money_number: string; orange_money_name: string;
  delivery_info: string; social_links: { label: string; url: string }[];
  updated_at: string | null;
};
export type Catalogue = {
  services: Service[]; categories: Category[]; settings: ShopSettings;
  source: "supabase" | "initial" | "unavailable"; issue: string | null; now: string; revision: string | null;
};
export type CustomerOrder = {
  service_id: string; expected_price: number | null; service_updated_at: string | null;
  settings_updated_at: string | null; customer_name: string; customer_phone: string;
  payment_method: "Wave" | "Orange Money"; payment_phone: string;
  payment_reference: string; notes: string; quantity: number; fields: Record<string, string>;
  request_id: string;
};
export type MutationResult = { ok: boolean; message: string };
