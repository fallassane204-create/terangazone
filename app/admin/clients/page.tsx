"use client";

import Link from "next/link";
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
  service_name: string;
  service_price: number;
  duration: string | null;
  status: OrderStatus;
  account_email: string | null;
  account_password: string | null;
  profile_name: string | null;
  expiration_date: string | null;
  access_message: string | null;
  paid_at: string | null;
  delivered_at: string | null;
  renewed_at: string | null;
  renewal_count: number | null;
  created_at: string;
};

type ClientGroup = {
  key: string;
  name: string;
  phone: string;
  orders: Order[];
  totalSpent: number;
  totalOrders: number;
  activeSubscriptions: number;
  expiringSoon: number;
  expired: number;
  renewals: number;
  lastOrderAt: string;
};

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function normalizeSenegalPhone(phone: string) {
  const digits = normalizePhone(phone);

  if (digits.startsWith("00221")) {
    return digits.slice(2);
  }

  if (digits.startsWith("221")) {
    return digits;
  }

  return `221${digits}`;
}

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
  }).format(date);
}

function getDaysRemaining(expirationDate: string | null) {
  if (!expirationDate) return null;

  const expiration = new Date(`${expirationDate}T23:59:59`);
  if (Number.isNaN(expiration.getTime())) return null;

  const now = new Date();

  return Math.ceil(
    (expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function subscriptionClass(order: Order) {
  const days = getDaysRemaining(order.expiration_date);

  if (order.status === "Annulée") {
    return "border-slate-400/20 bg-slate-400/5 text-slate-300";
  }

  if (order.status === "Expirée" || (days !== null && days < 0)) {
    return "border-red-400/20 bg-red-400/10 text-red-200";
  }

  if (days !== null && days <= 7) {
    return "border-orange-400/20 bg-orange-400/10 text-orange-200";
  }

  if (order.status === "Livrée" || order.status === "Payée") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  }

  return "border-amber-400/20 bg-amber-400/10 text-amber-200";
}

export default function AdminClientsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClientKey, setSelectedClientKey] = useState<string | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState("");

  async function loadClients() {
    setLoading(true);
    setErrorMessage("");

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, order_number, customer_name, customer_phone, service_name, service_price, duration, status, account_email, account_password, profile_name, expiration_date, access_message, paid_at, delivered_at, renewed_at, renewal_count, created_at"
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setErrorMessage(
          "Impossible de charger les clients depuis Supabase."
        );
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
    void loadClients();
  }, []);

  const clients = useMemo<ClientGroup[]>(() => {
    const groups = new Map<string, Order[]>();

    orders.forEach((order) => {
      const normalizedPhone = normalizePhone(order.customer_phone);
      const key = normalizedPhone || order.customer_name.toLowerCase();

      const current = groups.get(key) ?? [];
      current.push(order);
      groups.set(key, current);
    });

    return Array.from(groups.entries())
      .map(([key, clientOrders]) => {
        const sortedOrders = [...clientOrders].sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );

        const firstOrder = sortedOrders[0];

        const activeSubscriptions = sortedOrders.filter((order) => {
          const days = getDaysRemaining(order.expiration_date);

          return (
            (order.status === "Livrée" || order.status === "Payée") &&
            (days === null || days >= 0)
          );
        }).length;

        const expiringSoon = sortedOrders.filter((order) => {
          const days = getDaysRemaining(order.expiration_date);

          return days !== null && days >= 0 && days <= 7;
        }).length;

        const expired = sortedOrders.filter((order) => {
          const days = getDaysRemaining(order.expiration_date);

          return order.status === "Expirée" || (days !== null && days < 0);
        }).length;

        const paidOrders = sortedOrders.filter(
          (order) =>
            order.status === "Payée" || order.status === "Livrée"
        );

        return {
          key,
          name: firstOrder.customer_name,
          phone: firstOrder.customer_phone,
          orders: sortedOrders,
          totalSpent: paidOrders.reduce(
            (total, order) => total + Number(order.service_price || 0),
            0
          ),
          totalOrders: sortedOrders.length,
          activeSubscriptions,
          expiringSoon,
          expired,
          renewals: sortedOrders.reduce(
            (total, order) => total + Number(order.renewal_count || 0),
            0
          ),
          lastOrderAt: firstOrder.created_at,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.lastOrderAt).getTime() -
          new Date(a.lastOrderAt).getTime()
      );
  }, [orders]);

  const filteredClients = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return clients;

    return clients.filter((client) => {
      const searchableText = [
        client.name,
        client.phone,
        ...client.orders.map((order) => order.service_name),
        ...client.orders.map((order) => order.account_email ?? ""),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [clients, search]);

  const stats = useMemo(() => {
    return {
      clients: clients.length,
      active: clients.reduce(
        (total, client) => total + client.activeSubscriptions,
        0
      ),
      expiringSoon: clients.reduce(
        (total, client) => total + client.expiringSoon,
        0
      ),
      expired: clients.reduce(
        (total, client) => total + client.expired,
        0
      ),
      totalRevenue: clients.reduce(
        (total, client) => total + client.totalSpent,
        0
      ),
    };
  }, [clients]);

  const selectedClient =
    clients.find((client) => client.key === selectedClientKey) ?? null;

  function sendClientSummary(client: ClientGroup) {
    const activeOrders = client.orders.filter((order) => {
      const days = getDaysRemaining(order.expiration_date);

      return (
        (order.status === "Livrée" || order.status === "Payée") &&
        (days === null || days >= 0)
      );
    });

    if (activeOrders.length === 0) {
      setErrorMessage(
        `Aucun abonnement actif trouvé pour ${client.name}.`
      );
      return;
    }

    const subscriptions = activeOrders.flatMap((order) => [
      `📺 ${order.service_name}`,
      order.account_email
        ? `📧 Identifiant : ${order.account_email}`
        : "",
      order.account_password
        ? `🔑 Mot de passe : ${order.account_password}`
        : "",
      order.profile_name
        ? `👤 Profil : ${order.profile_name}`
        : "",
      order.expiration_date
        ? `📅 Expiration : ${formatDate(order.expiration_date)}`
        : "",
      order.access_message
        ? `📝 Instructions : ${order.access_message}`
        : "",
      "",
    ]);

    const text = [
      `Bonjour ${client.name},`,
      "",
      "Voici le résumé de vos abonnements TerangaZone :",
      "",
      ...subscriptions,
      "Merci pour votre confiance.",
      "TerangaZone",
    ]
      .filter((line) => line !== "")
      .join("\n");

    const phone = normalizeSenegalPhone(client.phone);

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(text)}`,
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
              Gestion des clients
            </h1>

            <p className="mt-3 text-slate-400">
              Retrouvez chaque client, ses commandes, ses accès et ses
              abonnements.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void loadClients()}
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-bold transition hover:bg-white/10"
            >
              Actualiser
            </button>

            <Link
              href="/admin/commandes"
              className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 text-center font-black text-white"
            >
              Voir les commandes
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <article className="rounded-[24px] border border-white/10 bg-white/[0.045] p-5">
            <p className="text-sm text-slate-400">Clients</p>
            <p className="mt-2 text-3xl font-black">{stats.clients}</p>
          </article>

          <article className="rounded-[24px] border border-emerald-400/20 bg-emerald-400/[0.05] p-5">
            <p className="text-sm text-slate-400">Abonnements actifs</p>
            <p className="mt-2 text-3xl font-black">{stats.active}</p>
          </article>

          <article className="rounded-[24px] border border-orange-400/20 bg-orange-400/[0.05] p-5">
            <p className="text-sm text-slate-400">Expire sous 7 jours</p>
            <p className="mt-2 text-3xl font-black">{stats.expiringSoon}</p>
          </article>

          <article className="rounded-[24px] border border-red-400/20 bg-red-400/[0.05] p-5">
            <p className="text-sm text-slate-400">Expirés</p>
            <p className="mt-2 text-3xl font-black">{stats.expired}</p>
          </article>

          <article className="rounded-[24px] border border-blue-400/20 bg-blue-400/[0.05] p-5">
            <p className="text-sm text-slate-400">Chiffre d’affaires</p>
            <p className="mt-2 text-xl font-black text-blue-300">
              {formatPrice(stats.totalRevenue)}
            </p>
          </article>
        </div>

        <div className="mt-8 rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un client, téléphone, service ou identifiant..."
            className="w-full rounded-2xl border border-white/10 bg-[#090e1d] px-5 py-4 text-white outline-none placeholder:text-slate-600 focus:border-blue-400/50"
          />
        </div>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-12 text-center text-slate-400">
            Chargement des clients...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="mt-8 rounded-[28px] border border-dashed border-white/15 p-12 text-center">
            <p className="text-4xl">👥</p>
            <p className="mt-4 text-xl font-black">
              Aucun client trouvé
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {filteredClients.map((client) => (
              <article
                key={client.key}
                className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 sm:p-6"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <h2 className="text-2xl font-black">
                      {client.name}
                    </h2>

                    <p className="mt-2 text-blue-300">
                      {client.phone}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      Dernière commande : {formatDate(client.lastOrderAt)}
                    </p>
                  </div>

                  <p className="text-xl font-black text-blue-300">
                    {formatPrice(client.totalSpent)}
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <p className="text-xs text-slate-500">Commandes</p>
                    <p className="mt-1 text-xl font-black">
                      {client.totalOrders}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.04] p-3">
                    <p className="text-xs text-slate-500">Actifs</p>
                    <p className="mt-1 text-xl font-black">
                      {client.activeSubscriptions}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-orange-400/15 bg-orange-400/[0.04] p-3">
                    <p className="text-xs text-slate-500">Bientôt</p>
                    <p className="mt-1 text-xl font-black">
                      {client.expiringSoon}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-purple-400/15 bg-purple-400/[0.04] p-3">
                    <p className="text-xs text-slate-500">Renouvellements</p>
                    <p className="mt-1 text-xl font-black">
                      {client.renewals}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {client.orders.slice(0, 3).map((order) => {
                    const days = getDaysRemaining(order.expiration_date);

                    return (
                      <div
                        key={order.id}
                        className={`rounded-2xl border p-4 ${subscriptionClass(
                          order
                        )}`}
                      >
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                          <div>
                            <p className="font-black">
                              {order.service_name}
                            </p>

                            <p className="mt-1 text-xs opacity-80">
                              {order.order_number}
                            </p>
                          </div>

                          <div className="text-left sm:text-right">
                            <p className="text-sm font-bold">
                              {order.status}
                            </p>

                            <p className="mt-1 text-xs opacity-80">
                              {order.expiration_date
                                ? `Expire le ${formatDate(
                                    order.expiration_date
                                  )}`
                                : "Expiration non renseignée"}
                            </p>

                            {days !== null && (
                              <p className="mt-1 text-xs font-bold">
                                {days < 0
                                  ? `Expiré depuis ${Math.abs(days)} jour${
                                      Math.abs(days) > 1 ? "s" : ""
                                    }`
                                  : `${days} jour${
                                      days > 1 ? "s" : ""
                                    } restant${
                                      days > 1 ? "s" : ""
                                    }`}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={() => setSelectedClientKey(client.key)}
                    className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 font-black text-white"
                  >
                    Voir la fiche complète
                  </button>

                  <button
                    type="button"
                    onClick={() => sendClientSummary(client)}
                    className="rounded-2xl bg-emerald-500 px-5 py-3 font-black text-white transition hover:bg-emerald-400"
                  >
                    Envoyer le résumé WhatsApp
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedClient && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
          <div className="mx-auto my-6 max-w-4xl rounded-[30px] border border-white/10 bg-[#090e1d] p-5 shadow-2xl sm:p-7">
            <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-400">
                  Fiche client
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  {selectedClient.name}
                </h2>

                <p className="mt-2 text-blue-300">
                  {selectedClient.phone}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedClientKey(null)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-bold"
              >
                Fermer
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-slate-500">Commandes</p>
                <p className="mt-2 text-2xl font-black">
                  {selectedClient.totalOrders}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.04] p-4">
                <p className="text-sm text-slate-500">Abonnements actifs</p>
                <p className="mt-2 text-2xl font-black">
                  {selectedClient.activeSubscriptions}
                </p>
              </div>

              <div className="rounded-2xl border border-purple-400/15 bg-purple-400/[0.04] p-4">
                <p className="text-sm text-slate-500">Renouvellements</p>
                <p className="mt-2 text-2xl font-black">
                  {selectedClient.renewals}
                </p>
              </div>

              <div className="rounded-2xl border border-blue-400/15 bg-blue-400/[0.04] p-4">
                <p className="text-sm text-slate-500">Total dépensé</p>
                <p className="mt-2 text-xl font-black text-blue-300">
                  {formatPrice(selectedClient.totalSpent)}
                </p>
              </div>
            </div>

            <div className="mt-7 space-y-4">
              {selectedClient.orders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <h3 className="text-xl font-black">
                        {order.service_name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {order.order_number} · {formatDate(order.created_at)}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${subscriptionClass(
                        order
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-600">
                        Identifiant
                      </p>
                      <p className="mt-2 font-bold">
                        {order.account_email || "Non renseigné"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-600">
                        Profil
                      </p>
                      <p className="mt-2 font-bold">
                        {order.profile_name || "Non renseigné"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-600">
                        Expiration
                      </p>
                      <p className="mt-2 font-bold">
                        {formatDate(order.expiration_date)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-600">
                        Montant
                      </p>
                      <p className="mt-2 font-bold text-blue-300">
                        {formatPrice(order.service_price)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => sendClientSummary(selectedClient)}
                className="rounded-2xl bg-emerald-500 px-5 py-3 font-black text-white"
              >
                Envoyer tous les accès sur WhatsApp
              </button>

              <Link
                href="/admin/commandes"
                className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-center font-black"
              >
                Gérer ses commandes
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
