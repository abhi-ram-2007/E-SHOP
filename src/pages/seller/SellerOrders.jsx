import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Package,
  MapPin,
  Phone,
  CreditCard,
  Save,
  RefreshCw,
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

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [statusDrafts, setStatusDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in.");
      }

      // Get order items belonging to this seller.
      const {
        data: orderItems,
        error: itemsError,
      } = await supabase
        .from("order_items")
        .select(`
          id,
          order_id,
          product_id,
          seller_id,
          product_name,
          product_price,
          quantity,
          created_at
        `)
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (itemsError) {
        throw itemsError;
      }

      if (!orderItems || orderItems.length === 0) {
        setOrders([]);
        setStatusDrafts({});
        return;
      }

      // Get unique order IDs.
      const orderIds = [
        ...new Set(orderItems.map((item) => item.order_id)),
      ];

      // Get the corresponding orders.
      const {
        data: orderData,
        error: ordersError,
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
        .in("id", orderIds)
        .order("created_at", { ascending: false });

      if (ordersError) {
        throw ordersError;
      }

      // Combine each order with the products sold by this seller.
      const combinedOrders = (orderData || []).map((order) => ({
        ...order,
        items: orderItems.filter(
          (item) => item.order_id === order.id
        ),
      }));

      setOrders(combinedOrders);

      // Prepare status dropdown values.
      const drafts = {};

      combinedOrders.forEach((order) => {
        drafts[order.id] = order.status || "Pending";
      });

      setStatusDrafts(drafts);
    } catch (err) {
      console.error("Seller orders error:", err);
      setError(err.message || "Unable to load seller orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  function handleStatusChange(orderId, value) {
    setStatusDrafts((previous) => ({
      ...previous,
      [orderId]: value,
    }));
  }

  async function updateOrderStatus(orderId) {
    const newStatus = statusDrafts[orderId];

    if (!newStatus) {
      return;
    }

    try {
      setUpdatingOrderId(orderId);
      setError("");
      setSuccess("");

      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) {
        throw updateError;
      }

      setOrders((previous) =>
        previous.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus,
                updated_at: new Date().toISOString(),
              }
            : order
        )
      );

      setSuccess("Order status updated successfully.");

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Update order status error:", err);
      setError(
        err.message || "Unable to update order status."
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(date) {
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusClass(status) {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "bg-green-50 text-green-700 border-green-200";

      case "cancelled":
      case "canceled":
        return "bg-red-50 text-red-700 border-red-200";

      case "shipped":
        return "bg-blue-50 text-blue-700 border-blue-200";

      case "processing":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";

      case "confirmed":
        return "bg-purple-50 text-purple-700 border-purple-200";

      default:
        return "bg-black/[.03] text-black/60 border-black/10";
    }
  }

  function getSellerSubtotal(items) {
    return items.reduce(
      (total, item) =>
        total +
        Number(item.product_price) * Number(item.quantity),
      0
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f6f2]">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">

        {/* Header */}
        <div className="border-b border-black/15 pb-8">
          <Link
            to="/seller"
            className="mb-5 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.13em] text-black/45 transition hover:text-black"
          >
            <ArrowLeft size={13} />
            Seller Dashboard
          </Link>

          <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-black/40">
            Seller
          </p>

          <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="text-4xl font-semibold tracking-[-.05em] md:text-6xl">
                My Orders
              </h1>

              <p className="mt-3 text-sm text-black/50">
                Orders containing products sold by your account.
              </p>
            </div>

            <button
              type="button"
              onClick={loadOrders}
              disabled={loading}
              className="inline-flex w-fit items-center gap-2 border border-black/15 bg-white px-5 py-3 text-xs font-semibold uppercase tracking-wider transition hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mt-6 border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="py-20 text-center text-sm text-black/40">
            Loading your orders...
          </div>
        )}

        {/* Empty */}
        {!loading && !error && orders.length === 0 && (
          <div className="mt-10 border border-black/10 bg-white p-12 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center border border-black/10 bg-[#f7f6f2]">
              <Package size={22} className="text-black/40" />
            </div>

            <h2 className="mt-5 text-2xl font-semibold">
              No orders yet
            </h2>

            <p className="mt-2 text-sm text-black/45">
              Orders containing your products will appear here.
            </p>
          </div>
        )}

        {/* Orders */}
        {!loading && orders.length > 0 && (
          <div className="mt-10 space-y-6">

            <p className="text-sm text-black/50">
              {orders.length}{" "}
              {orders.length === 1 ? "order" : "orders"}
            </p>

            {orders.map((order) => {
              const sellerSubtotal = getSellerSubtotal(
                order.items
              );

              const selectedStatus =
                statusDrafts[order.id] ||
                order.status ||
                "Pending";

              return (
                <div
                  key={order.id}
                  className="overflow-hidden border border-black/10 bg-white"
                >

                  {/* Order Header */}
                  <div className="border-b border-black/10 p-5 md:p-6">
                    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">

                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
                          Order ID
                        </p>

                        <p className="mt-1 break-all font-mono text-sm font-semibold">
                          {order.id}
                        </p>

                        <div className="mt-3 flex items-center gap-3 text-xs text-black/45">
                          <span>
                            {formatDate(order.created_at)}
                          </span>

                          <span>·</span>

                          <span>
                            {formatTime(order.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

                        <span
                          className={`w-fit border px-3 py-2 text-[9px] font-semibold uppercase tracking-wider ${getStatusClass(
                            order.status
                          )}`}
                        >
                          {order.status || "Pending"}
                        </span>

                        <div className="flex gap-2">
                          <select
                            value={selectedStatus}
                            onChange={(event) =>
                              handleStatusChange(
                                order.id,
                                event.target.value
                              )
                            }
                            className="border border-black/15 bg-white px-3 py-2 text-xs outline-none focus:border-black"
                          >
                            {ORDER_STATUSES.map((status) => (
                              <option
                                key={status}
                                value={status}
                              >
                                {status}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() =>
                              updateOrderStatus(order.id)
                            }
                            disabled={
                              updatingOrderId === order.id ||
                              selectedStatus === order.status
                            }
                            className="inline-flex items-center gap-2 bg-black px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Save size={13} />

                            {updatingOrderId === order.id
                              ? "Saving..."
                              : "Update"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Content */}
                  <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr]">

                    {/* Products */}
                    <div className="border-b border-black/10 p-5 md:p-6 lg:border-b-0 lg:border-r">

                      <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
                        Your Products
                      </p>

                      <div className="mt-5 space-y-4">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-4 border-b border-black/5 pb-4 last:border-0 last:pb-0"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">
                                {item.product_name}
                              </p>

                              <p className="mt-1 text-xs text-black/45">
                                ₹
                                {Number(
                                  item.product_price
                                ).toFixed(2)}{" "}
                                × {item.quantity}
                              </p>
                            </div>

                            <p className="shrink-0 text-sm font-semibold">
                              ₹
                              {(
                                Number(item.product_price) *
                                Number(item.quantity)
                              ).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Seller Total */}
                      <div className="mt-6 flex items-center justify-between border-t border-black/10 pt-5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-black/50">
                          Your Total
                        </span>

                        <span className="text-lg font-semibold">
                          ₹{sellerSubtotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Customer / Shipping */}
                    <div className="p-5 md:p-6">

                      <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
                        Customer & Shipping
                      </p>

                      <div className="mt-5 space-y-5">

                        {/* Customer */}
                        <div>
                          <p className="text-xs text-black/40">
                            Customer
                          </p>

                          <p className="mt-1 text-sm font-semibold">
                            {order.shipping_full_name || "N/A"}
                          </p>
                        </div>

                        {/* Phone */}
                        <div className="flex gap-3">
                          <Phone
                            size={16}
                            className="mt-0.5 shrink-0 text-black/40"
                          />

                          <div>
                            <p className="text-xs text-black/40">
                              Phone
                            </p>

                            <p className="mt-1 text-sm">
                              {order.shipping_phone || "N/A"}
                            </p>
                          </div>
                        </div>

                        {/* Address */}
                        <div className="flex gap-3">
                          <MapPin
                            size={16}
                            className="mt-0.5 shrink-0 text-black/40"
                          />

                          <div>
                            <p className="text-xs text-black/40">
                              Shipping Address
                            </p>

                            <p className="mt-1 text-sm leading-6">
                              {order.shipping_address || "N/A"}
                              <br />

                              {order.shipping_city &&
                                `${order.shipping_city}, `}

                              {order.shipping_state &&
                                `${order.shipping_state} `}

                              {order.shipping_pincode}
                              <br />

                              {order.shipping_country}
                            </p>
                          </div>
                        </div>

                        {/* Payment */}
                        <div className="flex gap-3">
                          <CreditCard
                            size={16}
                            className="mt-0.5 shrink-0 text-black/40"
                          />

                          <div>
                            <p className="text-xs text-black/40">
                              Payment Method
                            </p>

                            <p className="mt-1 text-sm font-semibold uppercase">
                              {order.payment_method || "N/A"}
                            </p>
                          </div>
                        </div>

                        {/* Order Total */}
                        <div className="border-t border-black/10 pt-5">

                          <div className="flex justify-between text-xs text-black/45">
                            <span>Order Subtotal</span>

                            <span>
                              ₹
                              {Number(
                                order.subtotal || 0
                              ).toFixed(2)}
                            </span>
                          </div>

                          <div className="mt-2 flex justify-between text-xs text-black/45">
                            <span>Shipping</span>

                            <span>
                              ₹
                              {Number(
                                order.shipping_fee || 0
                              ).toFixed(2)}
                            </span>
                          </div>

                          <div className="mt-2 flex justify-between text-xs text-black/45">
                            <span>Discount</span>

                            <span>
                              -₹
                              {Number(
                                order.discount || 0
                              ).toFixed(2)}
                            </span>
                          </div>

                          <div className="mt-4 flex justify-between border-t border-black/10 pt-4">
                            <span className="font-semibold">
                              Order Total
                            </span>

                            <span className="text-lg font-semibold">
                              ₹
                              {Number(
                                order.total_amount || 0
                              ).toFixed(2)}
                            </span>
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}