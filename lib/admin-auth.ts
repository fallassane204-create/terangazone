import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (error || !user || !email || user.email?.trim().toLowerCase() !== email) {
    throw new Error("Accès administrateur refusé.");
  }
  return supabase;
}
