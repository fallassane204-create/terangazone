"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type OrderStatus = "En attente" | "Payée" | "Livrée" | "Annulée";

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
  created_at: string;
};

const STATUS_OPTIONS: OrderStatus[] = [
  "En attente",
  "Payée",
  "Livrée",
  "Annulée",
];

function formatPrice(value: number) {
  return `${Number(value || 0).toLocaleString("fr-FR")} FCFA`;
}

function formatDate(value: string) {
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

function statusClass(status: OrderStatus) {
  if (status === "Payée") {
    return "border-blue-400/20 bg-blue-400/10 text-blue-200";
  }
  if (status === "Livrée") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  }
  if (status === "Annulée") {
    return "border-red-400/20 bg-red-400/10 text-red-200";
  }
  return "border-amber-400/20 bg-amber-400/10 text-amber-200";
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
      const matchesStatus =
        statusFilter === "Tous" || order.status === statusFilter;

      const searchableText = [
        order.order_number,
        order.customer_name,
        order.customer_phone,
        order.payment_phone ?? "",
        order.service_name,
        order.payment_method ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        searchableText.includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  const stats = useMemo(() => {
    const confirmed = orders.filter(
      (order) => order.status === "Payée" || order.status === "Livrée"
    );

    return {
      total: orders.length,
      pending: orders.filter((order) => order.status === "En attente").length,
      confirmed: confirmed.length,
      revenue: confirmed.reduce(
        (total, order) => total + Number(order.service_price || 0),
        0
      ),
    };
  }, [orders]);

  function updateLocalOrder(
    id: string,
    values: Partial<Pick<Order, "status" | "access_message">>
  ) {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === id ? { ...order, ...values } : order
      )
    );
  }

  async function saveOrder(order: Order) {
    setSavingId(order.id);
    setMessage("");
    setErrorMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("orders")
        .update({
          status: order.status,
          access_message: order.access_message ?? "",
        })
        .eq("id", order.id);

      if (error) {
        console.error(error);
        setErrorMessage(
          "La modification n’a pas pu être enregistrée dans Supabase."
        );
        return;
      }

      setMessage(`Commande ${order.order_number} mise à jour.`);
    } catch (error) {
      console.error(error);
      setErrorMessage("Une erreur inattendue est survenue.");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteOrder(order: Order) {
    const confirmed = window.confirm(
      `Supprimer définitivement la commande ${order.order_number} ?`
    );
    if (!confirmed) return;

    setDeletingId(order.id);
    setMessage("");
    setErrorMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", order.id);

      if (error) {
        console.error(error);
        setErrorMessage("La commande n’a pas pu être supprimée de Supabase.");
        return;
      }

      setOrders((currentOrders) =>
        currentOrders.filter((currentOrder) => currentOrder.id !== order.id)
      );
      setMessage(`Commande ${order.order_number} supprimée.`);
    } catch (error) {
      console.error(error);
      setErrorMessage("Une erreur inattendue est survenue.");
    } finally {
      setDeletingId(null);
    }
  }

  function sendAccessOnWhatsApp(order: Order) {
    if (!order.access_message?.trim()) {
      setErrorMessage(
        `Ajoutez d’abord les accès de la commande ${order.order_number}.`
      );
      return;
    }

    const customerPhone = order.customer_phone.replace(/\D/g, "");
    const internationalPhone = customerPhone.startsWith("221")
      ? customerPhone
      : `221${customerPhone}`;

    const text = [
      `Bonjour ${order.customer_name},`,
      "",
      `Votre commande ${order.order_number} pour ${order.service_name} est prête.`,
      "",
      "Vos accès :",
      order.access_message.trim(),
      "",
      "Merci pour votre confiance.",
      "TerangaZone",
    ].join("\n");

    window.open(
      `https://wa.me/${internationalPhone}?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 px-5 py-8 md:flex-row md:items-center lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-400">
              Administration
            </p>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">
              Gestion des commandes
            </h1>
            <p className="mt-3 text-slate-400">
              Vérifiez les paiements, ajoutez les accès et livrez les commandes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadOrders()}
            className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-bold transition hover:bg-white/10"
          >
            Actualiser
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[24px] border border-white/10 bg-white/[0.045] p-5">
            <p className="text-sm text-slate-400">Commandes</p>
            <p className="mt-2 text-3xl font-black">{stats.total}</p>
          </article>
          <article className="rounded-[24px] border border-amber-400/20 bg-amber-400/[0.05] p-5">
            <p className="text-sm text-slate-400">En attente</p>
            <p className="mt-2 text-3xl font-black">{stats.pending}</p>
          </article>
          <article className="rounded-[24px] border border-emerald-400/20 bg-emerald-400/[0.05] p-5">
            <p className="text-sm text-slate-400">Payées / livrées</p>
            <p className="mt-2 text-3xl font-black">{stats.confirmed}</p>
          </article>
          <article className="rounded-[24px] border border-blue-400/20 bg-blue-400/[0.05] p-5">
            <p className="text-sm text-slate-400">Chiffre d’affaires</p>
            <p className="mt-2 text-2xl font-black text-blue-300">
              {formatPrice(stats.revenue)}
            </p>
          </article>
        </div>

        <div className="mt-8 grid gap-4 rounded-[26px] border border-white/10 bg-white/[0.04] p-4 md:grid-cols-[1fr_220px]">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un client, service, téléphone ou numéro..."
            className="w-full rounded-2xl border border-white/10 bg-[#090e1d] px-5 py-4 text-white outline-none placeholder:text-slate-600 focus:border-blue-400/50"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-2xl border border-white/10 bg-[#090e1d] px-5 py-4 text-white outline-none"
          >
            <option value="Tous">Tous les statuts</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {message && (
          <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-12 text-center text-slate-400">
            Chargement des commandes Supabase...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="mt-8 rounded-[28px] border border-dashed border-white/15 p-12 text-center">
            <p className="text-4xl">📭</p>
            <p className="mt-4 text-xl font-black">Aucune commande trouvée</p>
            <p className="mt-2 text-sm text-slate-500">
              Modifiez la recherche ou le filtre.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {filteredOrders.map((order) => (
              <article
                key={order.id}
                className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 sm:p-6"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-black">{order.order_number}</h2>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <p className="text-2xl font-black text-blue-300">
                    {formatPrice(order.service_price)}
                  </p>
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-600">Client</p>
                    <p className="mt-2 font-bold">{order.customer_name}</p>
                    <p className="mt-1 text-sm text-blue-300">{order.customer_phone}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-600">Service</p>
                    <p className="mt-2 font-bold">{order.service_name}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {order.duration || "Non renseignée"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-600">Paiement</p>
                    <p className="mt-2 font-bold">{order.payment_method || "Non renseigné"}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Depuis : {order.payment_phone || "Non renseigné"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-600">Référence</p>
                    <p className="mt-2 font-bold">
                      {order.payment_reference || "Non renseignée"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[220px_1fr]">
                  <label>
                    <span className="mb-2 block text-sm font-bold text-slate-300">Statut</span>
                    <select
                      value={order.status}
                      onChange={(event) =>
                        updateLocalOrder(order.id, {
                          status: event.target.value as OrderStatus,
                        })
                      }
                      className="w-full rounded-2xl border border-white/10 bg-[#090e1d] px-4 py-4 text-white outline-none"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span className="mb-2 block text-sm font-bold text-slate-300">
                      Accès à envoyer au client
                    </span>
                    <textarea
                      value={order.access_message ?? ""}
                      onChange={(event) =>
                        updateLocalOrder(order.id, {
                          access_message: event.target.value,
                        })
                      }
                      rows={4}
                      placeholder="Identifiants, lien, profil ou instructions..."
                      className="w-full resize-none rounded-2xl border border-white/10 bg-[#090e1d] px-4 py-4 text-white outline-none placeholder:text-slate-600 focus:border-blue-400/50"
                    />
                  </label>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={() => void saveOrder(order)}
                    disabled={savingId === order.id}
                    className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 font-black text-white disabled:opacity-60"
                  >
                    {savingId === order.id
                      ? "Enregistrement..."
                      : "Enregistrer les modifications"}
                  </button>

                  <button
                    type="button"
                    onClick={() => sendAccessOnWhatsApp(order)}
                    className="rounded-2xl bg-emerald-500 px-5 py-3 font-black text-white transition hover:bg-emerald-400"
                  >
                    Envoyer les accès sur WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={() => void deleteOrder(order)}
                    disabled={deletingId === order.id}
                    className="rounded-2xl border border-red-400/25 bg-red-400/10 px-5 py-3 font-black text-red-200 transition hover:bg-red-400/15 disabled:opacity-60"
                  >
                    {deletingId === order.id ? "Suppression..." : "Supprimer"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
