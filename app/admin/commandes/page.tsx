"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type OrderStatus =
  | "En attente"
  | "Payée"
  | "Livrée"
  | "Expirée"
  | "Annulée";

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  payment_phone: string | null;
  service_name: string;
  service_price: number;
  duration: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  status: OrderStatus;
  access_message: string | null;
  account_email: string | null;
  account_password: string | null;
  profile_name: string | null;
  expiration_date: string | null;
  internal_notes: string | null;
  delivered_at: string | null;
  paid_at: string | null;
  renewed_at: string | null;
  renewal_count: number | null;
  created_at: string;
};

const STATUS_OPTIONS: OrderStatus[] = [
  "En attente",
  "Payée",
  "Livrée",
  "Expirée",
  "Annulée",
];

function formatPrice(value: number) {
  return `${Number(value || 0).toLocaleString("fr-FR")} FCFA`;
}

function formatDate(value: string | null) {
  if (!value) return "Non renseignée";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatSimpleDate(value: string | null) {
  if (!value) return "Non renseignée";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function statusClass(status: OrderStatus) {
  if (status === "Payée") return "border-blue-400/20 bg-blue-400/10 text-blue-200";
  if (status === "Livrée") return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  if (status === "Expirée") return "border-orange-400/20 bg-orange-400/10 text-orange-200";
  if (status === "Annulée") return "border-red-400/20 bg-red-400/10 text-red-200";
  return "border-amber-400/20 bg-amber-400/10 text-amber-200";
}

function getDaysRemaining(expirationDate: string | null) {
  if (!expirationDate) return null;
  const expiration = new Date(`${expirationDate}T23:59:59`);
  if (Number.isNaN(expiration.getTime())) return null;
  return Math.ceil((expiration.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function normalizeSenegalPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00221")) return digits.slice(2);
  if (digits.startsWith("221")) return digits;
  return `221${digits}`;
}

export default function AdminCommandesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);


  async function copyToClipboard(value: string | null, fieldKey: string) {
    if (!value?.trim()) {
      setErrorMessage("Aucune information à copier.");
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(fieldKey);
      setMessage("Information copiée.");
      setErrorMessage("");

      window.setTimeout(() => {
        setCopiedField((current) => (current === fieldKey ? null : current));
      }, 1800);
    } catch (error) {
      console.error(error);
      setErrorMessage("Impossible de copier automatiquement.");
    }
  }

  function getExpirationProgress(expirationDate: string | null) {
    const daysRemaining = getDaysRemaining(expirationDate);

    if (daysRemaining === null) {
      return {
        percentage: 0,
        label: "Date d’expiration non renseignée",
        barClass: "bg-slate-500",
      };
    }

    if (daysRemaining < 0) {
      return {
        percentage: 100,
        label: `Expiré depuis ${Math.abs(daysRemaining)} jour${
          Math.abs(daysRemaining) > 1 ? "s" : ""
        }`,
        barClass: "bg-red-500",
      };
    }

    const assumedDuration = 30;
    const elapsed = Math.max(0, assumedDuration - daysRemaining);
    const percentage = Math.min(
      100,
      Math.max(4, Math.round((elapsed / assumedDuration) * 100))
    );

    return {
      percentage,
      label: `${daysRemaining} jour${
        daysRemaining > 1 ? "s" : ""
      } restant${daysRemaining > 1 ? "s" : ""}`,
      barClass:
        daysRemaining <= 3
          ? "bg-red-500"
          : daysRemaining <= 7
          ? "bg-orange-500"
          : "bg-emerald-500",
    };
  }

  async function loadOrders() {
    setLoading(true);
    setErrorMessage("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error(error);
        setErrorMessage("Impossible de charger les commandes depuis Supabase.");
        return;
      }
      setOrders((data ?? []) as Order[]);
    } catch (error) {
      console.error(error);
      setErrorMessage("Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return orders.filter((order) => {
      const daysRemaining = getDaysRemaining(order.expiration_date);
      const matchesStatus =
        statusFilter === "Tous" ||
        order.status === statusFilter ||
        (statusFilter === "Expire bientôt" &&
          daysRemaining !== null &&
          daysRemaining >= 0 &&
          daysRemaining <= 7);
      const searchableText = [
        order.order_number,
        order.customer_name,
        order.customer_phone,
        order.payment_phone ?? "",
        order.service_name,
        order.payment_method ?? "",
        order.payment_reference ?? "",
        order.account_email ?? "",
        order.profile_name ?? "",
      ].join(" ").toLowerCase();
      return matchesStatus && (normalizedSearch.length === 0 || searchableText.includes(normalizedSearch));
    });
  }, [orders, search, statusFilter]);

  const stats = useMemo(() => {
    const confirmed = orders.filter(
      (order) => order.status === "Payée" || order.status === "Livrée"
    );

    const expiringSoon = orders.filter((order) => {
      const days = getDaysRemaining(order.expiration_date);
      return days !== null && days >= 0 && days <= 7;
    }).length;

    const expired = orders.filter((order) => {
      const days = getDaysRemaining(order.expiration_date);
      return order.status === "Expirée" || (days !== null && days < 0);
    }).length;

    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    const monthKey = now.toISOString().slice(0, 7);

    const revenueToday = confirmed
      .filter((order) => {
        const referenceDate = order.paid_at || order.created_at;
        return referenceDate?.slice(0, 10) === todayKey;
      })
      .reduce(
        (total, order) => total + Number(order.service_price || 0),
        0
      );

    const revenueMonth = confirmed
      .filter((order) => {
        const referenceDate = order.paid_at || order.created_at;
        return referenceDate?.slice(0, 7) === monthKey;
      })
      .reduce(
        (total, order) => total + Number(order.service_price || 0),
        0
      );

    return {
      total: orders.length,
      pending: orders.filter((order) => order.status === "En attente").length,
      confirmed: confirmed.length,
      expiringSoon,
      expired,
      revenue: confirmed.reduce(
        (total, order) => total + Number(order.service_price || 0),
        0
      ),
      revenueToday,
      revenueMonth,
    };
  }, [orders]);

  function updateLocalOrder(id: string, values: Partial<Order>) {
    setOrders((currentOrders) => currentOrders.map((order) => order.id === id ? { ...order, ...values } : order));
  }

  async function saveOrder(order: Order) {
    setSavingId(order.id);
    setMessage("");
    setErrorMessage("");
    try {
      const supabase = createClient();
      const deliveredAt = order.status === "Livrée" ? order.delivered_at || new Date().toISOString() : order.delivered_at;
      const { error } = await supabase.from("orders").update({
        status: order.status,
        access_message: order.access_message ?? "",
        account_email: order.account_email?.trim() || null,
        account_password: order.account_password || null,
        profile_name: order.profile_name?.trim() || null,
        expiration_date: order.expiration_date || null,
        internal_notes: order.internal_notes?.trim() || null,
        delivered_at: deliveredAt,
      }).eq("id", order.id);
      if (error) {
        console.error(error);
        setErrorMessage("La modification n’a pas pu être enregistrée dans Supabase.");
        return;
      }
      updateLocalOrder(order.id, { delivered_at: deliveredAt });
      setMessage(`Commande ${order.order_number} mise à jour.`);
    } catch (error) {
      console.error(error);
      setErrorMessage("Une erreur inattendue est survenue.");
    } finally {
      setSavingId(null);
    }
  }


  async function confirmPayment(order: Order) {
    setSavingId(order.id);
    setMessage("");
    setErrorMessage("");

    try {
      const supabase = createClient();
      const paidAt = order.paid_at || new Date().toISOString();

      const { error } = await supabase
        .from("orders")
        .update({
          status: "Payée",
          paid_at: paidAt,
        })
        .eq("id", order.id);

      if (error) {
        console.error(error);
        setErrorMessage("Le paiement n’a pas pu être confirmé.");
        return;
      }

      updateLocalOrder(order.id, {
        status: "Payée",
        paid_at: paidAt,
      });

      setMessage(`Paiement de ${order.order_number} confirmé.`);
    } catch (error) {
      console.error(error);
      setErrorMessage("Une erreur inattendue est survenue.");
    } finally {
      setSavingId(null);
    }
  }

  async function markAsDelivered(order: Order) {
    if (!order.account_email?.trim() && !order.access_message?.trim()) {
      setErrorMessage(
        `Ajoutez d’abord les accès de la commande ${order.order_number}.`
      );
      return;
    }

    setSavingId(order.id);
    setMessage("");
    setErrorMessage("");

    try {
      const supabase = createClient();
      const deliveredAt = order.delivered_at || new Date().toISOString();

      const { error } = await supabase
        .from("orders")
        .update({
          status: "Livrée",
          delivered_at: deliveredAt,
          account_email: order.account_email?.trim() || null,
          account_password: order.account_password || null,
          profile_name: order.profile_name?.trim() || null,
          expiration_date: order.expiration_date || null,
          access_message: order.access_message ?? "",
          internal_notes: order.internal_notes?.trim() || null,
        })
        .eq("id", order.id);

      if (error) {
        console.error(error);
        setErrorMessage("La commande n’a pas pu être marquée comme livrée.");
        return;
      }

      updateLocalOrder(order.id, {
        status: "Livrée",
        delivered_at: deliveredAt,
      });

      setMessage(`Commande ${order.order_number} marquée comme livrée.`);
    } catch (error) {
      console.error(error);
      setErrorMessage("Une erreur inattendue est survenue.");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteOrder(order: Order) {
    if (!window.confirm(`Supprimer définitivement la commande ${order.order_number} ?`)) return;
    setDeletingId(order.id);
    setMessage("");
    setErrorMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.from("orders").delete().eq("id", order.id);
      if (error) {
        console.error(error);
        setErrorMessage("La commande n’a pas pu être supprimée de Supabase.");
        return;
      }
      setOrders((currentOrders) => currentOrders.filter((currentOrder) => currentOrder.id !== order.id));
      setMessage(`Commande ${order.order_number} supprimée.`);
    } catch (error) {
      console.error(error);
      setErrorMessage("Une erreur inattendue est survenue.");
    } finally {
      setDeletingId(null);
    }
  }

  function sendAccessOnWhatsApp(order: Order) {
    if (!order.account_email?.trim() && !order.access_message?.trim()) {
      setErrorMessage(`Ajoutez d’abord les accès de la commande ${order.order_number}.`);
      return;
    }
    if (!order.customer_phone?.trim()) {
      setErrorMessage(`Le numéro WhatsApp du client est absent pour ${order.order_number}.`);
      return;
    }
    const text = [
      `Bonjour ${order.customer_name},`,
      "",
      `Votre commande ${order.order_number} pour ${order.service_name} est prête.`,
      "",
      order.account_email?.trim() ? `📧 Identifiant : ${order.account_email.trim()}` : "",
      order.account_password ? `🔑 Mot de passe : ${order.account_password}` : "",
      order.profile_name?.trim() ? `👤 Profil : ${order.profile_name.trim()}` : "",
      order.expiration_date ? `📅 Expiration : ${formatSimpleDate(order.expiration_date)}` : "",
      order.access_message?.trim() ? `📝 Instructions : ${order.access_message.trim()}` : "",
      "",
      "Merci pour votre confiance.",
      "TerangaZone",
    ].filter(Boolean).join("\n");
    window.open(`https://wa.me/${normalizeSenegalPhone(order.customer_phone)}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  async function renewOrder(order: Order) {
    const currentExpiration = order.expiration_date
      ? new Date(`${order.expiration_date}T12:00:00`)
      : new Date();

    if (Number.isNaN(currentExpiration.getTime())) {
      setErrorMessage("La date d’expiration actuelle est invalide.");
      return;
    }

    const today = new Date();
    const baseDate =
      currentExpiration.getTime() > today.getTime()
        ? currentExpiration
        : today;

    baseDate.setMonth(baseDate.getMonth() + 1);

    const nextExpiration = baseDate.toISOString().slice(0, 10);
    const renewedAt = new Date().toISOString();
    const renewalCount = Number(order.renewal_count || 0) + 1;

    setSavingId(order.id);
    setMessage("");
    setErrorMessage("");

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("orders")
        .update({
          expiration_date: nextExpiration,
          status: "Livrée",
          renewed_at: renewedAt,
          renewal_count: renewalCount,
        })
        .eq("id", order.id);

      if (error) {
        console.error(error);
        setErrorMessage("Le renouvellement n’a pas pu être enregistré.");
        return;
      }

      updateLocalOrder(order.id, {
        expiration_date: nextExpiration,
        status: "Livrée",
        renewed_at: renewedAt,
        renewal_count: renewalCount,
      });

      setMessage(
        `${order.order_number} renouvelée jusqu’au ${formatSimpleDate(
          nextExpiration
        )}.`
      );
    } catch (error) {
      console.error(error);
      setErrorMessage("Une erreur inattendue est survenue.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 px-5 py-8 md:flex-row md:items-center lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-400">Administration</p>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">Gestion des commandes</h1>
            <p className="mt-3 text-slate-400">Vérifiez les paiements, ajoutez les accès et suivez les dates d’expiration.</p>
          </div>
          <button type="button" onClick={() => void loadOrders()} className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-bold transition hover:bg-white/10">Actualiser</button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[24px] border border-white/10 bg-white/[0.045] p-5"><p className="text-sm text-slate-400">Commandes</p><p className="mt-2 text-3xl font-black">{stats.total}</p></article>
          <article className="rounded-[24px] border border-amber-400/20 bg-amber-400/[0.05] p-5"><p className="text-sm text-slate-400">En attente</p><p className="mt-2 text-3xl font-black">{stats.pending}</p></article>
          <article className="rounded-[24px] border border-emerald-400/20 bg-emerald-400/[0.05] p-5"><p className="text-sm text-slate-400">Payées / livrées</p><p className="mt-2 text-3xl font-black">{stats.confirmed}</p></article>
          <article className="rounded-[24px] border border-orange-400/20 bg-orange-400/[0.05] p-5"><p className="text-sm text-slate-400">Expire sous 7 jours</p><p className="mt-2 text-3xl font-black">{stats.expiringSoon}</p></article>
          <article className="rounded-[24px] border border-red-400/20 bg-red-400/[0.05] p-5"><p className="text-sm text-slate-400">Expirées</p><p className="mt-2 text-3xl font-black">{stats.expired}</p></article>
          <article className="rounded-[24px] border border-cyan-400/20 bg-cyan-400/[0.05] p-5"><p className="text-sm text-slate-400">Revenus aujourd’hui</p><p className="mt-2 text-xl font-black text-cyan-300">{formatPrice(stats.revenueToday)}</p></article>
          <article className="rounded-[24px] border border-purple-400/20 bg-purple-400/[0.05] p-5"><p className="text-sm text-slate-400">Revenus du mois</p><p className="mt-2 text-xl font-black text-purple-300">{formatPrice(stats.revenueMonth)}</p></article>
          <article className="rounded-[24px] border border-blue-400/20 bg-blue-400/[0.05] p-5"><p className="text-sm text-slate-400">Chiffre d’affaires total</p><p className="mt-2 text-xl font-black text-blue-300">{formatPrice(stats.revenue)}</p></article>
        </div>

        <div className="mt-8 grid gap-4 rounded-[26px] border border-white/10 bg-white/[0.04] p-4 md:grid-cols-[1fr_220px]">
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Client, service, téléphone, identifiant ou numéro..." className="w-full rounded-2xl border border-white/10 bg-[#090e1d] px-5 py-4 text-white outline-none placeholder:text-slate-600 focus:border-blue-400/50" />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-[#090e1d] px-5 py-4 text-white outline-none"><option value="Tous">Tous les statuts</option><option value="Expire bientôt">Expire bientôt</option>{STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}</select>
        </div>

        {message && <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">{message}</div>}
        {errorMessage && <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">{errorMessage}</div>}

        {loading ? (
          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-12 text-center text-slate-400">Chargement des commandes Supabase...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="mt-8 rounded-[28px] border border-dashed border-white/15 p-12 text-center"><p className="text-4xl">📭</p><p className="mt-4 text-xl font-black">Aucune commande trouvée</p><p className="mt-2 text-sm text-slate-500">Modifiez la recherche ou le filtre.</p></div>
        ) : (
          <div className="mt-8 space-y-5">
            {filteredOrders.map((order) => {
              const daysRemaining = getDaysRemaining(order.expiration_date);
              return (
                <article key={order.id} className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 sm:p-6">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-black">{order.order_number}</h2>
                        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(order.status)}`}>{order.status}</span>
                        {daysRemaining !== null && <span className={`rounded-full border px-3 py-1 text-xs font-bold ${daysRemaining < 0 ? "border-red-400/20 bg-red-400/10 text-red-200" : daysRemaining <= 7 ? "border-orange-400/20 bg-orange-400/10 text-orange-200" : "border-slate-400/20 bg-white/5 text-slate-300"}`}>{daysRemaining < 0 ? `Expiré depuis ${Math.abs(daysRemaining)} jour${Math.abs(daysRemaining) > 1 ? "s" : ""}` : `${daysRemaining} jour${daysRemaining > 1 ? "s" : ""} restant${daysRemaining > 1 ? "s" : ""}`}</span>}
                      </div>
                      <p className="mt-2 text-sm text-slate-500">{formatDate(order.created_at)}</p>
                    </div>
                    <p className="text-2xl font-black text-blue-300">{formatPrice(order.service_price)}</p>
                  </div>

                  <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    <div><p className="text-xs uppercase tracking-[0.2em] text-slate-600">Client</p><p className="mt-2 font-bold">{order.customer_name}</p><p className="mt-1 text-sm text-blue-300">{order.customer_phone}</p></div>
                    <div><p className="text-xs uppercase tracking-[0.2em] text-slate-600">Service</p><p className="mt-2 font-bold">{order.service_name}</p><p className="mt-1 text-sm text-slate-400">{order.duration || "Non renseignée"}</p></div>
                    <div><p className="text-xs uppercase tracking-[0.2em] text-slate-600">Paiement</p><p className="mt-2 font-bold">{order.payment_method || "Non renseigné"}</p><p className="mt-1 text-sm text-slate-400">Depuis : {order.payment_phone || "Non renseigné"}</p></div>
                    <div><p className="text-xs uppercase tracking-[0.2em] text-slate-600">Référence</p><p className="mt-2 font-bold">{order.payment_reference || "Non renseignée"}</p></div>
                  </div>

                  <div className="mt-6 rounded-[24px] border border-blue-400/15 bg-blue-400/[0.04] p-4 sm:p-5">
                    <h3 className="text-lg font-black text-blue-200">Accès du client</h3>
                    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <label>
                        <span className="mb-2 block text-sm font-bold text-slate-300">
                          Identifiant ou email
                        </span>
                        <div className="relative">
                          <input
                            type="text"
                            value={order.account_email ?? ""}
                            onChange={(event) =>
                              updateLocalOrder(order.id, {
                                account_email: event.target.value,
                              })
                            }
                            placeholder="exemple@gmail.com"
                            className="w-full rounded-2xl border border-white/10 bg-[#090e1d] px-4 py-4 pr-24 text-white outline-none placeholder:text-slate-600 focus:border-blue-400/50"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              void copyToClipboard(
                                order.account_email,
                                `${order.id}-email`
                              )
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10"
                          >
                            {copiedField === `${order.id}-email`
                              ? "Copié"
                              : "Copier"}
                          </button>
                        </div>
                      </label>

                      <label>
                        <span className="mb-2 block text-sm font-bold text-slate-300">
                          Mot de passe
                        </span>
                        <div className="relative">
                          <input
                            type={
                              visiblePasswords[order.id]
                                ? "text"
                                : "password"
                            }
                            value={order.account_password ?? ""}
                            onChange={(event) =>
                              updateLocalOrder(order.id, {
                                account_password: event.target.value,
                              })
                            }
                            placeholder="Mot de passe"
                            className="w-full rounded-2xl border border-white/10 bg-[#090e1d] px-4 py-4 pr-36 text-white outline-none placeholder:text-slate-600 focus:border-blue-400/50"
                          />
                          <div className="absolute right-3 top-1/2 flex -translate-y-1/2 gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setVisiblePasswords((current) => ({
                                  ...current,
                                  [order.id]: !current[order.id],
                                }))
                              }
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10"
                            >
                              {visiblePasswords[order.id]
                                ? "Masquer"
                                : "Voir"}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void copyToClipboard(
                                  order.account_password,
                                  `${order.id}-password`
                                )
                              }
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10"
                            >
                              {copiedField === `${order.id}-password`
                                ? "Copié"
                                : "Copier"}
                            </button>
                          </div>
                        </div>
                      </label>

                      <label><span className="mb-2 block text-sm font-bold text-slate-300">Nom du profil</span><input type="text" value={order.profile_name ?? ""} onChange={(event) => updateLocalOrder(order.id, { profile_name: event.target.value })} placeholder="Exemple : Assane" className="w-full rounded-2xl border border-white/10 bg-[#090e1d] px-4 py-4 text-white outline-none placeholder:text-slate-600 focus:border-blue-400/50" /></label>
                      <label><span className="mb-2 block text-sm font-bold text-slate-300">Date d’expiration</span><input type="date" value={order.expiration_date ?? ""} onChange={(event) => updateLocalOrder(order.id, { expiration_date: event.target.value })} className="w-full rounded-2xl border border-white/10 bg-[#090e1d] px-4 py-4 text-white outline-none focus:border-blue-400/50" /></label>
                    </div>
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <label><span className="mb-2 block text-sm font-bold text-slate-300">Instructions envoyées au client</span><textarea value={order.access_message ?? ""} onChange={(event) => updateLocalOrder(order.id, { access_message: event.target.value })} rows={4} placeholder="Code PIN, lien, consignes ou autres informations..." className="w-full resize-none rounded-2xl border border-white/10 bg-[#090e1d] px-4 py-4 text-white outline-none placeholder:text-slate-600 focus:border-blue-400/50" /></label>
                      <label><span className="mb-2 block text-sm font-bold text-slate-300">Notes internes</span><textarea value={order.internal_notes ?? ""} onChange={(event) => updateLocalOrder(order.id, { internal_notes: event.target.value })} rows={4} placeholder="Information visible uniquement par l’administrateur..." className="w-full resize-none rounded-2xl border border-white/10 bg-[#090e1d] px-4 py-4 text-white outline-none placeholder:text-slate-600 focus:border-blue-400/50" /></label>
                    </div>
                  </div>

                  {(() => {
                    const progress = getExpirationProgress(
                      order.expiration_date
                    );

                    return (
                      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm font-bold text-slate-300">
                            Suivi de l’abonnement
                          </p>
                          <p className="text-xs font-bold text-slate-400">
                            {progress.label}
                          </p>
                        </div>
                        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/5">
                          <div
                            className={`h-full rounded-full transition-all ${progress.barClass}`}
                            style={{
                              width: `${progress.percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  <div className="mt-6 grid gap-4 lg:grid-cols-[220px_1fr]">
                    <label><span className="mb-2 block text-sm font-bold text-slate-300">Statut</span><select value={order.status} onChange={(event) => updateLocalOrder(order.id, { status: event.target.value as OrderStatus })} className="w-full rounded-2xl border border-white/10 bg-[#090e1d] px-4 py-4 text-white outline-none">{STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-sm text-slate-400">Livraison enregistrée</p><p className="mt-2 font-bold">{formatDate(order.delivered_at)}</p>
                      <p className="mt-3 text-sm text-slate-400">Paiement confirmé</p>
                      <p className="mt-1 font-bold">{formatDate(order.paid_at)}</p>
                      <p className="mt-3 text-sm text-slate-400">
                        Renouvellements : {Number(order.renewal_count || 0)}
                      </p></div>
                  </div>

                  <div className="mt-5 rounded-[22px] border border-white/10 bg-black/20 p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <button
                        type="button"
                        onClick={() => void confirmPayment(order)}
                        disabled={savingId === order.id}
                        className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-black text-white transition hover:bg-blue-400 disabled:opacity-60"
                      >
                        ✓ Confirmer
                      </button>

                      <button
                        type="button"
                        onClick={() => void markAsDelivered(order)}
                        disabled={savingId === order.id}
                        className="rounded-xl bg-purple-500 px-4 py-2.5 text-sm font-black text-white transition hover:bg-purple-400 disabled:opacity-60"
                      >
                        📦 Livrer
                      </button>

                      <button
                        type="button"
                        onClick={() => sendAccessOnWhatsApp(order)}
                        className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-400"
                      >
                        💬 WhatsApp
                      </button>

                      <button
                        type="button"
                        onClick={() => void renewOrder(order)}
                        disabled={savingId === order.id}
                        className="rounded-xl border border-blue-400/25 bg-blue-400/10 px-4 py-2.5 text-sm font-black text-blue-200 transition hover:bg-blue-400/15 disabled:opacity-60"
                      >
                        ↻ Renouveler
                      </button>

                      <button
                        type="button"
                        onClick={() => void saveOrder(order)}
                        disabled={savingId === order.id}
                        className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-sm font-black text-white disabled:opacity-60"
                      >
                        {savingId === order.id
                          ? "Enregistrement..."
                          : "💾 Enregistrer"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateLocalOrder(order.id, {
                            status: "Expirée",
                          })
                        }
                        className="rounded-xl border border-orange-400/25 bg-orange-400/10 px-4 py-2.5 text-sm font-black text-orange-200 transition hover:bg-orange-400/15"
                      >
                        ⏱ Expirée
                      </button>

                      <button
                        type="button"
                        onClick={() => void deleteOrder(order)}
                        disabled={deletingId === order.id}
                        className="rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-2.5 text-sm font-black text-red-200 transition hover:bg-red-400/15 disabled:opacity-60"
                      >
                        {deletingId === order.id
                          ? "Suppression..."
                          : "🗑 Supprimer"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
