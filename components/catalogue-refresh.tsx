"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export function CatalogueRefresh({ revision, nextPromotionChange }: { revision: string | null; nextPromotionChange: string | null }) {
  const router = useRouter();
  useEffect(() => {
    if (!revision) return;
    const controller = new AbortController(); let pending = false;
    async function check() {
      if (pending || document.visibilityState !== "visible") return;
      pending = true;
      try {
        const response = await fetch("/api/catalogue/revision", { cache: "no-store", signal: controller.signal });
        if (response.ok && (await response.json()).revision !== revision) router.refresh();
      } catch { /* Les formulaires valident toujours le tarif serveur lors de la soumission. */ }
      finally { pending = false; }
    }
    const interval = setInterval(() => void check(), 30000);
    // Une promotion peut débuter/expirer sans écriture ni nouvelle révision SQL.
    const promotionTimer = nextPromotionChange ? setTimeout(() => router.refresh(), Math.min(2147483647, Math.max(0, Date.parse(nextPromotionChange) - Date.now()) + 100)) : null;
    window.addEventListener("focus", check);
    return () => { clearInterval(interval); if (promotionTimer !== null) clearTimeout(promotionTimer); controller.abort(); window.removeEventListener("focus", check); };
  }, [revision, nextPromotionChange, router]);
  return null;
}
