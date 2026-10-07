"use server";
import { requireAdmin as adminClient } from "@/lib/admin-auth";
export async function listOrders() {
  const supabase = await adminClient();
  return supabase.from("orders").select("*").order("created_at", { ascending: false });
}
export async function updateOrder(id: string, values: Record<string, unknown>) {
  const supabase = await adminClient();
  const allowed = ["status", "access_message", "account_email", "account_password", "profile_name", "expiration_date", "internal_notes", "delivered_at", "paid_at", "renewed_at", "renewal_count"];
  if (!id || Object.keys(values).some((key) => !allowed.includes(key))) throw new Error("Modification invalide.");
  const { data, error } = await supabase.from("orders").update(values).eq("id", id).select("id").maybeSingle();
  return { error: error ? { message: error.message } : !data ? { message: "Commande introuvable ou modification refusée." } : null };
}
export async function removeOrder(id: string) {
  const supabase = await adminClient();
  const { data, error } = await supabase.from("orders").delete().eq("id", id).select("id").maybeSingle();
  return { error: error ? { message: error.message } : !data ? { message: "Commande introuvable ou suppression refusée." } : null };
}
