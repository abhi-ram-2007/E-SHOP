import { useEffect, useState } from "react";

import {
  ArrowLeft,
  CheckCircle2,
  Package,
  RefreshCw,
  Search,
  ShieldOff,
  Store,
} from "lucide-react";

import { Link } from "react-router-dom";

import { supabase } from "../../lib/supabase";

export default function AdminSellers() {
  const [sellers, setSellers] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // LOAD SELLERS
  // ============================================================

  async function loadSellers() {
    try {
      setLoading(true);
      setError("");

      const {
        data: sellerData,
        error: sellerError,
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
        .eq("role", "seller")
        .order("created_at", {
          ascending: false,
        });

      if (sellerError) {
        throw sellerError;
      }

      const sellersList = sellerData || [];

      const sellerIds = sellersList.map(
        (seller) => seller.id
      );

      let products = [];
      let orderItems = [];

      if (sellerIds.length > 0) {
        // ======================================================
        // SELLER PRODUCTS
        // ======================================================

        const {
          data,
          error: productsError,
        } = await supabase
          .from("products")
          .select(`
            id,
            seller_id
          `)
          .in("seller_id", sellerIds);

        if (productsError) {
          throw productsError;
        }

        products = data || [];

        // ======================================================
        // SELLER ORDER ITEMS
        // ======================================================

        const {
          data: orderItemData,
          error: orderItemsError,
        } = await supabase
          .from("order_items")
          .select(`
            id,
            seller_id,
            product_price,
            quantity
          `)
          .in("seller_id", sellerIds);

        if (orderItemsError) {
          throw orderItemsError;
        }

        orderItems = orderItemData || [];
      }

      // ========================================================
      // CALCULATE SELLER STATISTICS
      // ========================================================

      const sellersWithStats =
        sellersList.map((seller) => {
          const sellerProducts =
            products.filter(
              (product) =>
                product.seller_id === seller.id
            );

          const sellerOrderItems =
            orderItems.filter(
              (item) =>
                item.seller_id === seller.id
            );

          const orderCount =
            sellerOrderItems.length;

          const totalSales =
            sellerOrderItems.reduce(
              (total, item) =>
                total +
                Number(
                  item.product_price || 0
                ) *
                  Number(item.quantity || 0),
              0
            );

          return {
            ...seller,
            productCount:
              sellerProducts.length,
            orderCount,
            totalSales,
          };
        });

      setSellers(sellersWithStats);
    } catch (err) {
      console.error(
        "Admin sellers error:",
        err
      );

      setError(
        err.message ||
          "Unable to load sellers."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSellers();
  }, []);

  // ============================================================
  // BLOCK / UNBLOCK SELLER
  // ============================================================

  async function handleToggleBlock(seller) {
    const newStatus =
      seller.status === "blocked"
        ? "active"
        : "blocked";

    const actionText =
      newStatus === "blocked"
        ? "block"
        : "unblock";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} ${seller.full_name || "this seller"}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(seller.id);
      setError("");
      setSuccess("");

      const {
        error: rpcError,
      } = await supabase.rpc(
        "admin_set_account_status",
        {
          target_user_id: seller.id,
          new_status: newStatus,
        }
      );

      if (rpcError) {
        throw rpcError;
      }

      setSellers((current) =>
        current.map((item) =>
          item.id === seller.id
            ? {
                ...item,
                status: newStatus,
              }
            : item
        )
      );

      setSuccess(
        `${seller.full_name || "Seller"} has been ${newStatus === "blocked" ? "blocked" : "unblocked"}.`
      );
    } catch (err) {
      console.error(
        "Seller status update error:",
        err
      );

      setError(
        err.message ||
          "Unable to update seller status."
      );
    } finally {
      setActionLoading(null);
    }
  }

  // ============================================================
  // SEARCH
  // ============================================================

  const filteredSellers =
    sellers.filter((seller) => {
      const searchText =
        search.toLowerCase().trim();

      if (!searchText) {
        return true;
      }

      return (
        seller.full_name
          ?.toLowerCase()
          .includes(searchText) ||
        seller.email
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
            Loading sellers...
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
              Sellers
            </h1>

            <p className="mt-3 text-sm text-black/50">
              Manage seller accounts and monitor
              their store activity.
            </p>
          </div>

          <button
            type="button"
            onClick={loadSellers}
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

        <div className="mt-10 grid gap-4 sm:grid-cols-3">

          <div className="border border-black/10 bg-white p-6">
            <div className="flex items-start justify-between">

              <div>
                <p className="text-xs uppercase tracking-wider text-black/40">
                  Total Sellers
                </p>

                <p className="mt-3 text-4xl font-semibold">
                  {sellers.length}
                </p>
              </div>

              <Store
                size={20}
                className="text-black/35"
              />
            </div>
          </div>

          <div className="border border-black/10 bg-white p-6">
            <div className="flex items-start justify-between">

              <div>
                <p className="text-xs uppercase tracking-wider text-black/40">
                  Total Products
                </p>

                <p className="mt-3 text-4xl font-semibold">
                  {sellers.reduce(
                    (total, seller) =>
                      total +
                      seller.productCount,
                    0
                  )}
                </p>
              </div>

              <Package
                size={20}
                className="text-black/35"
              />
            </div>
          </div>

          <div className="border border-black/10 bg-white p-6">
            <div className="flex items-start justify-between">

              <div>
                <p className="text-xs uppercase tracking-wider text-black/40">
                  Total Sales
                </p>

                <p className="mt-3 text-3xl font-semibold">
                  ₹
                  {sellers
                    .reduce(
                      (total, seller) =>
                        total +
                        seller.totalSales,
                      0
                    )
                    .toFixed(2)}
                </p>
              </div>

              <span className="text-xl text-black/30">
                ₹
              </span>
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
            placeholder="Search sellers by name or email..."
            className="w-full bg-transparent px-4 py-4 text-sm outline-none"
          />

        </div>

        {/* COUNT */}

        <div className="mt-6">
          <p className="text-sm text-black/50">
            Showing{" "}
            <span className="font-semibold text-black">
              {filteredSellers.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-black">
              {sellers.length}
            </span>{" "}
            sellers
          </p>
        </div>

        {/* SELLERS */}

        <section className="mt-6">

          {filteredSellers.length === 0 ? (
            <div className="border border-black/10 bg-white px-6 py-16 text-center">

              <Store
                size={34}
                className="mx-auto text-black/20"
              />

              <h2 className="mt-4 text-xl font-semibold">
                No sellers found
              </h2>

              <p className="mt-2 text-sm text-black/40">
                Try a different search term.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto border border-black/10 bg-white">

              <table className="w-full min-w-[1250px] border-collapse">

                <thead>
                  <tr className="border-b border-black/10 text-left">

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-black/40">
                      Seller
                    </th>

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-black/40">
                      Email
                    </th>

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-black/40">
                      Products
                    </th>

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-black/40">
                      Order Items
                    </th>

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-black/40">
                      Total Sales
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

                  {filteredSellers.map(
                    (seller) => (
                      <tr
                        key={seller.id}
                        className="border-b border-black/10 last:border-b-0"
                      >

                        {/* SELLER */}

                        <td className="px-5 py-5">
                          <div className="flex items-center gap-3">

                            <div className="grid h-10 w-10 shrink-0 place-items-center bg-black text-xs font-semibold text-white">
                              {(
                                seller.full_name ||
                                "S"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <p className="font-semibold">
                                {seller.full_name ||
                                  "Seller"}
                              </p>

                              <p className="mt-1 text-[10px] text-black/30">
                                ID:{" "}
                                {seller.id.slice(
                                  0,
                                  8
                                )}
                              </p>
                            </div>

                          </div>
                        </td>

                        {/* EMAIL */}

                        <td className="px-5 py-5 text-sm text-black/60">
                          {seller.email || "—"}
                        </td>

                        {/* PRODUCTS */}

                        <td className="px-5 py-5">
                          <span className="text-sm font-semibold">
                            {seller.productCount}
                          </span>
                        </td>

                        {/* ORDERS */}

                        <td className="px-5 py-5">
                          <span className="text-sm font-semibold">
                            {seller.orderCount}
                          </span>
                        </td>

                        {/* SALES */}

                        <td className="px-5 py-5">
                          <span className="text-sm font-semibold">
                            ₹
                            {seller.totalSales.toFixed(
                              2
                            )}
                          </span>
                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-5">

                          {seller.status ===
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
                            seller.created_at
                          )}
                        </td>

                        {/* ACTION */}

                        <td className="px-5 py-5">

                          <button
                            type="button"
                            disabled={
                              actionLoading ===
                              seller.id
                            }
                            onClick={() =>
                              handleToggleBlock(
                                seller
                              )
                            }
                            className={`inline-flex min-w-[105px] items-center justify-center gap-2 border px-4 py-2 text-[10px] font-semibold uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              seller.status ===
                              "blocked"
                                ? "border-black/20 hover:bg-black hover:text-white"
                                : "border-red-200 text-red-600 hover:bg-red-600 hover:text-white"
                            }`}
                          >

                            {actionLoading ===
                            seller.id ? (
                              <>
                                <RefreshCw
                                  size={12}
                                  className="animate-spin"
                                />
                                Updating
                              </>
                            ) : seller.status ===
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