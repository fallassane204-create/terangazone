import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL("/reinitialiser-mot-de-passe", request.url));
    } catch { /* Lien invalide : proposer une nouvelle demande. */ }
  }
  return NextResponse.redirect(new URL("/mot-de-passe-oublie?lien=invalide", request.url));
}
