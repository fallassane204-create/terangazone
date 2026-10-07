"use server";

import { getCatalogue } from "@/lib/catalogue/server";
import { assertFreshPrice, orderMessage, validateCustomerOrder, whatsappLink } from "@/lib/catalogue/domain";
import { createClient } from "@/lib/supabase/server";
import type { CustomerOrder } from "@/lib/catalogue/types";

export async function submitOrder(order: CustomerOrder): Promise<{ ok: boolean; message: string; whatsapp_url?: string; recorded?: boolean }> {
  try {
    const catalogue = await getCatalogue();
    const service = catalogue.services.find((item) => item.id === order.service_id);
    if (!service || !service.whatsapp_enabled || (service.kind === "physical" && service.stock === 0)) throw new Error("Ce service n’est plus disponible à la commande.");
    assertFreshPrice(service, catalogue.settings, order, catalogue.now);
    validateCustomerOrder(order, service, catalogue.source === "supabase");
    if (catalogue.source === "initial" || order.expected_price === null) {
      return { ok: true, recorded: false, message: "Demande à confirmer sur WhatsApp. Aucun paiement demandé et aucune commande enregistrée.",
        whatsapp_url: whatsappLink(catalogue.settings.whatsapp_number, orderMessage(service, catalogue.settings, order, undefined, catalogue.source === "initial")) };
    }
    const db = await createClient();
    const { data, error } = await db.rpc("tz_place_order", {
      p_product_id: service.id, p_expected_price: order.expected_price, p_product_updated_at: order.service_updated_at,
      p_settings_updated_at: order.settings_updated_at, p_customer_name: order.customer_name.trim(), p_customer_phone: order.customer_phone.trim(),
      p_payment_method: order.payment_method, p_payment_phone: order.payment_phone.trim(), p_payment_reference: order.payment_reference.trim(),
      p_notes: order.notes.trim(), p_quantity: order.quantity, p_fields: order.fields, p_request_id: order.request_id,
    });
    if (error) {
      if (error.message.includes("OFFER_CHANGED")) throw new Error("L’offre ou les coordonnées de paiement ont changé. Actualisez avant de poursuivre. Si vous avez déjà payé, contactez la boutique sans payer une seconde fois.");
      if (error.message.includes("SERVICE_UNAVAILABLE") || error.message.includes("INVALID_QUANTITY")) throw new Error("Ce service ou cette quantité n’est plus disponible.");
      if (error.message.includes("INVALID_FIELDS")) throw new Error("Vérifiez les informations demandées par le service, puis rechargez la page.");
      return { ok: false, recorded: false, message: "L’enregistrement est indisponible. Contactez la boutique sur WhatsApp avec les informations ci-dessous ; votre commande n’est pas encore enregistrée.",
        whatsapp_url: whatsappLink(catalogue.settings.whatsapp_number, orderMessage(service, catalogue.settings, order)) };
    }
    if (!data || data.unit_price !== order.expected_price || data.total !== order.expected_price * order.quantity || typeof data.order_number !== "string") throw new Error("Réponse de commande invalide. Contactez la boutique avant de réessayer.");
    return { ok: true, recorded: true, message: `Commande ${data.order_number} enregistrée. ${order.expected_price > 0 ? "Envoyez la preuve sur WhatsApp." : "Continuez sur WhatsApp pour recevoir votre offre."}`,
      whatsapp_url: whatsappLink(catalogue.settings.whatsapp_number, orderMessage(service, catalogue.settings, order, data.order_number)) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Impossible de préparer la commande. Réessayez." };
  }
}
