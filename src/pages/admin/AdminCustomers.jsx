import { useEffect, useState } from "react";

import {
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Search,
  ShoppingBag,
  ShieldOff,
  Users,
} from "lucide-react";

import { Link } from "react-router-dom";

import { supabase } from "../../lib/supabase";

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // LOAD CUSTOMERS
  // ============================================================

  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");

      const {
        data: customerData,
        error: customerError,
      } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          role,
          status,
          created_at
        `)
        .eq("role", "customer")
        .order("created_at", {
          ascending: false,
        });

      if (customerError) {
        throw customerError;
      }

      const customersList = customerData || [];

      const customerIds = customersList.map(
        (customer) => customer.id
      );

      let orderData = [];

      if (customerIds.length > 0) {
        const {
          data,
          error: orderError,
        } = await supabase
          .from("orders")
          .select("id, user_id, total_amount")
          .in("user_id", customerIds);

        if (orderError) {
          throw orderError;
        }

        orderData = data || [];
      }

      const customersWithStats =
        customersList.map((customer) => {
          const customerOrders =
            orderData.filter(
              (order) =>
                order.user_id === customer.id
            );

          const totalSpent =
            customerOrders.reduce(
              (total, order) =>
                total +
                Number(order.total_amount || 0),
              0
            );

          return {
            ...customer,
            orderCount: customerOrders.length,
            totalSpent,
          };
        });

      setCustomers(customersWithStats);
    } catch (err) {
      console.error(
        "Admin customers error:",
        err
      );

      setError(
        err.message ||
          "Unable to load customers."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  // ============================================================
  // BLOCK / UNBLOCK
  // ============================================================

  async function handleToggleBlock(customer) {
    const newStatus =
      customer.status === "blocked"
        ? "active"
        : "blocked";

    const actionText =
      newStatus === "blocked"
        ? "block"
        : "unblock";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} ${customer.full_name || "this customer"}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(customer.id);
      setError("");
      setSuccess("");

      const {
        error: rpcError,
      } = await supabase.rpc(
        "admin_set_account_status",
        {
          target_user_id: customer.id,
          new_status: newStatus,
        }
      );

      if (rpcError) {
        throw rpcError;
      }

      setCustomers((current) =>
        current.map((item) =>
          item.id === customer.id
            ? {
                ...item,
                status: newStatus,
              }
            : item
        )
      );

      setSuccess(
        `${customer.full_name || "Customer"} has been ${newStatus === "blocked" ? "blocked" : "unblocked"}.`
      );
    } catch (err) {
      console.error(
        "Customer status update error:",
        err
      );

      setError(
        err.message ||
          "Unable to update customer status."
      );
    } finally {
      setActionLoading(null);
    }
  }

  // ============================================================
  // SEARCH
  // ============================================================

  const filteredCustomers =
    customers.filter((customer) => {
      const searchText =
        search.toLowerCase().trim();

      if (!searchText) {
        return true;
      }

      return (
        customer.full_name
          ?.toLowerCase()
          .includes(searchText) ||
        customer.email
          ?.toLowerCase()
          .includes(searchText)
      );
    });

  // ============================================================
  // DATE FORMAT
  // ============================================================

  function formatDate(date) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f6f2]">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <p className="text-sm text-black/40">
            Loading customers...
          </p>
        </div>
      </main>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <main className="min-h-screen bg-[#f7f6f2]">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">

        {/* HEADER */}

        <div className="flex flex-col justify-between gap-6 border-b border-black/15 pb-8 sm:flex-row sm:items-end">

          <div>
            <Link
              to="/admin"
              className="mb-6 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-black/40 transition hover:text-black"
            >
              <ArrowLeft size={14} />
              Admin Dashboard
            </Link>

            <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-black/40">
              E-SHOP Administration
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-.05em] md:text-6xl">
              Customers
            </h1>

            <p className="mt-3 text-sm text-black/50">
              View and manage registered
              customer accounts.
            </p>
          </div>

          <button
            type="button"
            onClick={loadCustomers}
            className="flex w-fit items-center gap-2 border border-black/20 px-5 py-3 text-xs font-semibold uppercase tracking-wider transition hover:bg-black hover:text-white"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mt-8 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="mt-8 border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* SUMMARY */}

        <div className="mt-10 grid gap-4 sm:grid-cols-2">

          <div className="border border-black/10 bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-black/40">
                  Total Customers
                </p>

                <p className="mt-3 text-4xl font-semibold">
                  {customers.length}
                </p>
              </div>

              <Users
                size={20}
                className="text-black/35"
              />
            </div>
          </div>

          <div className="border border-black/10 bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-black/40">
                  Total Customer Orders
                </p>

                <p className="mt-3 text-4xl font-semibold">
                  {customers.reduce(
                    (total, customer) =>
                      total +
                      customer.orderCount,
                    0
                  )}
                </p>
              </div>

              <ShoppingBag
                size={20}
                className="text-black/35"
              />
            </div>
          </div>
        </div>

        {/* SEARCH */}

        <div className="mt-8 flex items-center border border-black/15 bg-white">
          <Search
            size={18}
            className="ml-4 text-black/35"
          />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search customers by name or email..."
            className="w-full bg-transparent px-4 py-4 text-sm outline-none"
          />
        </div>

        {/* COUNT */}

        <div className="mt-6">
          <p className="text-sm text-black/50">
            Showing{" "}
            <span className="font-semibold text-black">
              {filteredCustomers.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-black">
              {customers.length}
            </span>{" "}
            customers
          </p>
        </div>

        {/* CUSTOMERS */}

        <section className="mt-6">
          {filteredCustomers.length === 0 ? (
            <div className="border border-black/10 bg-white px-6 py-16 text-center">

              <Users
                size={34}
                className="mx-auto text-black/20"
              />

              <h2 className="mt-4 text-xl font-semibold">
                No customers found
              </h2>

              <p className="mt-2 text-sm text-black/40">
                Try a different search term.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto border border-black/10 bg-white">

              <table className="w-full min-w-[1150px] border-collapse">

                <thead>
                  <tr className="border-b border-black/10 text-left">

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-black/40">
                      Customer
                    </th>

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-black/40">
                      Email
                    </th>

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-black/40">
                      Orders
                    </th>

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-black/40">
                      Total Spent
                    </th>

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-black/40">
                      Status
                    </th>

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-black/40">
                      Joined
                    </th>

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-black/40">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody>
                  {filteredCustomers.map(
                    (customer) => (
                      <tr
                        key={customer.id}
                        className="border-b border-black/10 last:border-b-0"
                      >

                        {/* CUSTOMER */}

                        <td className="px-5 py-5">
                          <div className="flex items-center gap-3">

                            <div className="grid h-10 w-10 shrink-0 place-items-center bg-black text-xs font-semibold text-white">
                              {(
                                customer.full_name ||
                                "C"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <p className="font-semibold">
                                {customer.full_name ||
                                  "Customer"}
                              </p>

                              <p className="mt-1 text-[10px] text-black/30">
                                ID:{" "}
                                {customer.id.slice(
                                  0,
                                  8
                                )}
                              </p>
                            </div>

                          </div>
                        </td>

                        {/* EMAIL */}

                        <td className="px-5 py-5 text-sm text-black/60">
                          {customer.email || "—"}
                        </td>

                        {/* ORDERS */}

                        <td className="px-5 py-5">
                          <span className="text-sm font-semibold">
                            {customer.orderCount}
                          </span>
                        </td>

                        {/* TOTAL SPENT */}

                        <td className="px-5 py-5">
                          <span className="text-sm font-semibold">
                            ₹
                            {customer.totalSpent.toFixed(
                              2
                            )}
                          </span>
                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-5">
                          {customer.status ===
                          "blocked" ? (
                            <span className="inline-flex items-center gap-2 border border-red-200 bg-red-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-red-700">
                              <ShieldOff size={12} />
                              Blocked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 border border-green-200 bg-green-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-green-700">
                              <CheckCircle2 size={12} />
                              Active
                            </span>
                          )}
                        </td>

                        {/* JOINED */}

                        <td className="px-5 py-5 text-sm text-black/50">
                          {formatDate(
                            customer.created_at
                          )}
                        </td>

                        {/* ACTION */}

                        <td className="px-5 py-5">

                          <button
                            type="button"
                            disabled={
                              actionLoading ===
                              customer.id
                            }
                            onClick={() =>
                              handleToggleBlock(
                                customer
                              )
                            }
                            className={`inline-flex min-w-[105px] items-center justify-center gap-2 border px-4 py-2 text-[10px] font-semibold uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              customer.status ===
                              "blocked"
                                ? "border-black/20 hover:bg-black hover:text-white"
                                : "border-red-200 text-red-600 hover:bg-red-600 hover:text-white"
                            }`}
                          >
                            {actionLoading ===
                            customer.id ? (
                              <>
                                <RefreshCw
                                  size={12}
                                  className="animate-spin"
                                />
                                Updating
                              </>
                            ) : customer.status ===
                              "blocked" ? (
                              <>
                                <CheckCircle2 size={12} />
                                Unblock
                              </>
                            ) : (
                              <>
                                <ShieldOff size={12} />
                                Block
                              </>
                            )}
                          </button>

                        </td>

                      </tr>
                    )
                  )}
                </tbody>

              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}