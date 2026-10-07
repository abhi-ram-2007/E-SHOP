import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Package,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";
import { Link } from "react-router-dom";

import { supabase } from "../../lib/supabase";

const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  /*
   * ------------------------------------------------------------
   * LOAD ORDERS
   * ------------------------------------------------------------
   */

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      /*
       * Load orders.
       */
      const {
        data: orderData,
        error: orderError,
      } = await supabase
        .from("orders")
        .select(`
          id,
          user_id,
          status,
          payment_method,
          subtotal,
          shipping_fee,
          discount,
          total_amount,
          shipping_full_name,
          shipping_phone,
          shipping_address,
          shipping_city,
          shipping_state,
          shipping_pincode,
          shipping_country,
          created_at,
          updated_at
        `)
        .order("created_at", {
          ascending: false,
        });

      if (orderError) {
        throw orderError;
      }

      /*
       * Load order items.
       */
      const orderIds = (orderData || []).map(
        (order) => order.id
      );

      let itemData = [];

      if (orderIds.length > 0) {
        const {
          data,
          error: itemError,
        } = await supabase
          .from("order_items")
          .select(`
            id,
            order_id,
            product_id,
            seller_id,
            product_name,
            product_price,
            quantity
          `)
          .in("order_id", orderIds);

        if (itemError) {
          throw itemError;
        }

        itemData = data || [];
      }

      /*
       * Attach order items to each order.
       */
      const combinedOrders = (orderData || []).map(
        (order) => ({
          ...order,
          items: itemData.filter(
            (item) => item.order_id === order.id
          ),
        })
      );

      setOrders(combinedOrders);
    } catch (err) {
      console.error("Admin orders error:", err);

      setError(
        err.message || "Unable to load orders."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  /*
   * ------------------------------------------------------------
   * UPDATE ORDER STATUS
   * ------------------------------------------------------------
   */

  async function handleStatusChange(
    orderId,
    newStatus
  ) {
    try {
      setUpdatingId(orderId);
      setError("");

      const {
        error: updateError,
      } = await supabase
        .from("orders")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) {
        throw updateError;
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus,
              }
            : order
        )
      );
    } catch (err) {
      console.error(
        "Update order status error:",
        err
      );

      setError(
        err.message ||
          "Unable to update order status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  /*
   * ------------------------------------------------------------
   * TOGGLE ORDER DETAILS
   * ------------------------------------------------------------
   */

  function toggleOrder(orderId) {
    setExpandedOrder((current) =>
      current === orderId ? null : orderId
    );
  }

  /*
   * ------------------------------------------------------------
   * STATUS STYLE
   * ------------------------------------------------------------
   */

  function getStatusClass(status) {
    switch (status) {
      case "Delivered":
        return "border-green-200 bg-green-50 text-green-700";

      case "Cancelled":
        return "border-red-200 bg-red-50 text-red-700";

      case "Shipped":
        return "border-blue-200 bg-blue-50 text-blue-700";

      case "Processing":
        return "border-purple-200 bg-purple-50 text-purple-700";

      case "Confirmed":
        return "border-indigo-200 bg-indigo-50 text-indigo-700";

      case "Pending":
      default:
        return "border-orange-200 bg-orange-50 text-orange-700";
    }
  }

  /*
   * ------------------------------------------------------------
   * FORMAT DATE
   * ------------------------------------------------------------
   */

  function formatDate(date) {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /*
   * ------------------------------------------------------------
   * LOADING
   * ------------------------------------------------------------
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f6f2]">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <p className="text-sm text-black/40">
            Loading orders...
          </p>
        </div>
      </main>
    );
  }

  /*
   * ------------------------------------------------------------
   * PAGE
   * ------------------------------------------------------------
   */

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
              Orders
            </h1>

            <p className="mt-3 text-sm text-black/50">
              View customer orders and manage order status.
            </p>
          </div>

          <button
            type="button"
            onClick={loadOrders}
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

        {/* SUMMARY */}
        <div className="mt-10 flex items-center gap-2 text-sm text-black/50">
          <ShoppingCart size={16} />

          <span>
            Total Orders:
          </span>

          <strong className="text-black">
            {orders.length}
          </strong>
        </div>

        {/* EMPTY */}
        {orders.length === 0 ? (
          <div className="mt-6 border border-black/10 bg-white px-6 py-16 text-center">

            <Package
              size={34}
              className="mx-auto text-black/20"
            />

            <h2 className="mt-4 text-xl font-semibold">
              No orders found
            </h2>

            <p className="mt-2 text-sm text-black/40">
              Customer orders will appear here.
            </p>

          </div>
        ) : (
          <section className="mt-6 space-y-4">

            {orders.map((order) => {
              const isExpanded =
                expandedOrder === order.id;

              return (
                <div
                  key={order.id}
                  className="border border-black/10 bg-white"
                >

                  {/* ORDER HEADER */}
                  <div className="p-5 md:p-6">

                    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">

                      {/* Order information */}
                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-3">

                          <h2 className="font-semibold">
                            Order #
                            {order.id.slice(0, 8).toUpperCase()}
                          </h2>

                          <span
                            className={`border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${getStatusClass(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>

                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-black/40">

                          <span>
                            {formatDate(
                              order.created_at
                            )}
                          </span>

                          <span>
                            {order.payment_method?.toUpperCase() ||
                              "—"}
                          </span>

                          <span>
                            {order.items.length}{" "}
                            {order.items.length === 1
                              ? "item"
                              : "items"}
                          </span>

                        </div>

                      </div>

                      {/* Total */}
                      <div className="flex items-center justify-between gap-6 lg:justify-end">

                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-black/40">
                            Total
                          </p>

                          <p className="mt-1 text-xl font-semibold">
                            ₹
                            {Number(
                              order.total_amount || 0
                            ).toFixed(2)}
                          </p>
                        </div>

                        {/* Status */}
                        <div>
                          <label
                            htmlFor={`status-${order.id}`}
                            className="sr-only"
                          >
                            Order status
                          </label>

                          <select
                            id={`status-${order.id}`}
                            value={order.status}
                            disabled={
                              updatingId === order.id
                            }
                            onChange={(event) =>
                              handleStatusChange(
                                order.id,
                                event.target.value
                              )
                            }
                            className="border border-black/15 bg-white px-3 py-2 text-xs outline-none transition focus:border-black disabled:opacity-50"
                          >
                            {ORDER_STATUSES.map(
                              (status) => (
                                <option
                                  key={status}
                                  value={status}
                                >
                                  {status}
                                </option>
                              )
                            )}
                          </select>
                        </div>

                        {/* Expand */}
                        <button
                          type="button"
                          onClick={() =>
                            toggleOrder(order.id)
                          }
                          className="grid h-10 w-10 place-items-center border border-black/15 transition hover:bg-black hover:text-white"
                          title={
                            isExpanded
                              ? "Hide details"
                              : "View details"
                          }
                        >
                          {isExpanded ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </button>

                      </div>
                    </div>
                  </div>

                  {/* DETAILS */}
                  {isExpanded && (
                    <div className="border-t border-black/10">

                      <div className="grid gap-0 lg:grid-cols-2">

                        {/* CUSTOMER */}
                        <div className="border-b border-black/10 p-6 lg:border-b-0 lg:border-r">

                          <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
                            Customer & Shipping
                          </p>

                          <div className="mt-5 space-y-3 text-sm">

                            <div>
                              <p className="text-xs text-black/40">
                                Name
                              </p>

                              <p className="mt-1 font-medium">
                                {order.shipping_full_name ||
                                  "—"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-black/40">
                                Phone
                              </p>

                              <p className="mt-1">
                                {order.shipping_phone ||
                                  "—"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-black/40">
                                Address
                              </p>

                              <p className="mt-1 leading-6">
                                {order.shipping_address ||
                                  "—"}
                                <br />

                                {[
                                  order.shipping_city,
                                  order.shipping_state,
                                  order.shipping_pincode,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}

                                {order.shipping_country && (
                                  <>
                                    <br />
                                    {
                                      order.shipping_country
                                    }
                                  </>
                                )}
                              </p>
                            </div>

                          </div>
                        </div>

                        {/* ORDER SUMMARY */}
                        <div className="p-6">

                          <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
                            Order Summary
                          </p>

                          <div className="mt-5 space-y-3 text-sm">

                            <div className="flex justify-between gap-4">
                              <span className="text-black/50">
                                Subtotal
                              </span>

                              <span>
                                ₹
                                {Number(
                                  order.subtotal || 0
                                ).toFixed(2)}
                              </span>
                            </div>

                            <div className="flex justify-between gap-4">
                              <span className="text-black/50">
                                Shipping
                              </span>

                              <span>
                                ₹
                                {Number(
                                  order.shipping_fee || 0
                                ).toFixed(2)}
                              </span>
                            </div>

                            <div className="flex justify-between gap-4">
                              <span className="text-black/50">
                                Discount
                              </span>

                              <span>
                                -₹
                                {Number(
                                  order.discount || 0
                                ).toFixed(2)}
                              </span>
                            </div>

                            <div className="border-t border-black/10 pt-3">
                              <div className="flex justify-between gap-4 font-semibold">
                                <span>
                                  Total
                                </span>

                                <span>
                                  ₹
                                  {Number(
                                    order.total_amount ||
                                      0
                                  ).toFixed(2)}
                                </span>
                              </div>
                            </div>

                          </div>
                        </div>

                      </div>

                      {/* ITEMS */}
                      <div className="border-t border-black/10 p-6">

                        <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
                          Products
                        </p>

                        <div className="mt-5 overflow-x-auto">

                          <table className="w-full min-w-[650px]">

                            <thead>
                              <tr className="border-b border-black/10 text-left">

                                <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-black/40">
                                  Product
                                </th>

                                <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-black/40">
                                  Price
                                </th>

                                <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-black/40">
                                  Quantity
                                </th>

                                <th className="pb-3 text-right text-[10px] font-semibold uppercase tracking-wider text-black/40">
                                  Total
                                </th>

                              </tr>
                            </thead>

                            <tbody>

                              {order.items.map(
                                (item) => (
                                  <tr
                                    key={item.id}
                                    className="border-b border-black/10 last:border-b-0"
                                  >

                                    <td className="py-4">
                                      <p className="font-medium">
                                        {
                                          item.product_name
                                        }
                                      </p>

                                      {item.product_id && (
                                        <p className="mt-1 text-[10px] text-black/30">
                                          Product ID:{" "}
                                          {item.product_id.slice(
                                            0,
                                            8
                                          )}
                                        </p>
                                      )}
                                    </td>

                                    <td className="py-4 text-sm text-black/60">
                                      ₹
                                      {Number(
                                        item.product_price ||
                                          0
                                      ).toFixed(2)}
                                    </td>

                                    <td className="py-4 text-sm text-black/60">
                                      {item.quantity}
                                    </td>

                                    <td className="py-4 text-right text-sm font-semibold">
                                      ₹
                                      {(
                                        Number(
                                          item.product_price ||
                                            0
                                        ) *
                                        Number(
                                          item.quantity || 0
                                        )
                                      ).toFixed(2)}
                                    </td>

                                  </tr>
                                )
                              )}

                            </tbody>

                          </table>

                        </div>
                      </div>

                    </div>
                  )}

                </div>
              );
            })}

          </section>
        )}

      </div>
    </main>
  );
}