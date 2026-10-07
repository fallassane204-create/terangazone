"use server";
import { requireAdmin } from "@/lib/admin-auth";
export async function checkAdminAccess(): Promise<boolean> {
  try { await requireAdmin(); return true; } catch { return false; }
}
