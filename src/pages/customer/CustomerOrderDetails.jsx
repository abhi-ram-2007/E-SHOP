import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Clock,
  MapPin,
  Package,
  Truck,
  XCircle,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { supabase } from "../../lib/supabase";

const STATUS_STEPS = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
];

export default function CustomerOrderDetails() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadOrder();
  }, [id]);

  async function loadOrder() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in.");
      }

      // ----------------------------------------------------------
      // LOAD ORDER
      // ----------------------------------------------------------

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
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (orderError) {
        throw orderError;
      }

      // ----------------------------------------------------------
      // LOAD ORDER ITEMS
      // ----------------------------------------------------------

      const {
        data: itemData,
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
          quantity,
          created_at
        `)
        .eq("order_id", id)
        .order("created_at", {
          ascending: true,
        });

      if (itemError) {
        throw itemError;
      }

      setOrder(orderData);
      setItems(itemData || []);
    } catch (err) {
      console.error(
        "Customer order details error:",
        err
      );

      setError(
        err.message ||
          "Unable to load order details."
      );
    } finally {
      setLoading(false);
    }
  }

  // ------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------

  function formatDate(date) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  }

  function formatTime(date) {
    if (!date) return "";

    return new Date(date).toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  function getStatusIndex(status) {
    const index = STATUS_STEPS.findIndex(
      (step) =>
        step.toLowerCase() ===
        status?.toLowerCase()
    );

    return index === -1 ? 0 : index;
  }

  function getStatusIcon(status) {
    switch (status?.toLowerCase()) {
      case "delivered":
        return Check;

      case "shipped":
        return Truck;

      case "processing":
        return Package;

      case "confirmed":
        return Check;

      default:
        return Clock;
    }
  }

  // ------------------------------------------------------------
  // LOADING
  // ------------------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f6f2]">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center md:px-8">
          <p className="text-sm text-black/40">
            Loading order details...
          </p>
        </div>
      </main>
    );
  }

  // ------------------------------------------------------------
  // ERROR
  // ------------------------------------------------------------

  if (error || !order) {
    return (
      <main className="min-h-screen bg-[#f7f6f2]">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-8">

          <div className="border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error || "Order not found."}
          </div>

          <Link
            to="/customer/orders"
            className="mt-6 inline-flex items-center gap-2 bg-black px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white"
          >
            <ArrowLeft size={14} />
            Back to Orders
          </Link>

        </div>
      </main>
    );
  }

  const currentStatusIndex =
    getStatusIndex(order.status);

  const isCancelled =
    order.status?.toLowerCase() ===
      "cancelled" ||
    order.status?.toLowerCase() ===
      "canceled";

  // ------------------------------------------------------------
  // PAGE
  // ------------------------------------------------------------

  return (
    <main className="min-h-screen bg-[#f7f6f2]">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">

        {/* HEADER */}

        <div className="border-b border-black/15 pb-8">

          <Link
            to="/customer/orders"
            className="mb-5 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.13em] text-black/45 transition hover:text-black"
          >
            <ArrowLeft size={13} />
            My Orders
          </Link>

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-black/40">
                E-SHOP Customer
              </p>

              <h1 className="mt-3 text-4xl font-semibold tracking-[-.05em] md:text-6xl">
                Order Details
              </h1>

              <p className="mt-3 break-all font-mono text-xs text-black/45">
                Order ID: {order.id}
              </p>
            </div>

            <div className="text-left md:text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
                Placed On
              </p>

              <p className="mt-2 text-sm font-medium">
                {formatDate(order.created_at)}
              </p>

              <p className="mt-1 text-xs text-black/45">
                {formatTime(order.created_at)}
              </p>
            </div>

          </div>
        </div>

        {/* STATUS */}

        <section className="mt-8 border border-black/10 bg-white p-6 md:p-8">

          <div className="flex items-start justify-between gap-5">

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
                Order Status
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                {order.status || "Pending"}
              </h2>
            </div>

            {isCancelled ? (
              <XCircle
                size={28}
                className="text-red-500"
              />
            ) : (
              <Truck
                size={28}
                className="text-black/50"
              />
            )}

          </div>

          {isCancelled ? (
            <div className="mt-7 border border-red-200 bg-red-50 p-5">

              <div className="flex items-center gap-3">
                <XCircle
                  size={20}
                  className="text-red-600"
                />

                <div>
                  <p className="font-semibold text-red-700">
                    Order Cancelled
                  </p>

                  <p className="mt-1 text-sm text-red-600/80">
                    This order has been cancelled.
                  </p>
                </div>
              </div>

            </div>
          ) : (
            <div className="mt-10">

              <div className="hidden md:flex">

                {STATUS_STEPS.map(
                  (step, index) => {
                    const completed =
                      index <=
                      currentStatusIndex;

                    const Icon =
                      getStatusIcon(step);

                    return (
                      <div
                        key={step}
                        className="flex flex-1 items-start"
                      >

                        <div className="flex flex-1 flex-col items-center">

                          <div
                            className={`grid h-11 w-11 place-items-center rounded-full border ${
                              completed
                                ? "border-black bg-black text-white"
                                : "border-black/15 bg-white text-black/30"
                            }`}
                          >
                            <Icon size={17} />
                          </div>

                          <p
                            className={`mt-3 text-center text-[10px] font-semibold uppercase tracking-wider ${
                              completed
                                ? "text-black"
                                : "text-black/30"
                            }`}
                          >
                            {step}
                          </p>

                        </div>

                        {index <
                          STATUS_STEPS.length -
                            1 && (
                          <div
                            className={`mt-5 h-px flex-1 ${
                              index <
                              currentStatusIndex
                                ? "bg-black"
                                : "bg-black/10"
                            }`}
                          />
                        )}

                      </div>
                    );
                  }
                )}

              </div>

              {/* MOBILE TIMELINE */}

              <div className="space-y-5 md:hidden">

                {STATUS_STEPS.map(
                  (step, index) => {
                    const completed =
                      index <=
                      currentStatusIndex;

                    const Icon =
                      getStatusIcon(step);

                    return (
                      <div
                        key={step}
                        className="flex items-center gap-4"
                      >

                        <div
                          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border ${
                            completed
                              ? "border-black bg-black text-white"
                              : "border-black/15 bg-white text-black/30"
                          }`}
                        >
                          <Icon size={16} />
                        </div>

                        <div>
                          <p
                            className={`text-xs font-semibold uppercase tracking-wider ${
                              completed
                                ? "text-black"
                                : "text-black/30"
                            }`}
                          >
                            {step}
                          </p>

                          {index ===
                            currentStatusIndex && (
                            <p className="mt-1 text-xs text-black/45">
                              Current order status
                            </p>
                          )}
                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            </div>
          )}

        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">

          {/* LEFT */}

          <div className="space-y-8">

            {/* PRODUCTS */}

            <section className="border border-black/10 bg-white p-6 md:p-8">

              <div className="flex items-center gap-3">

                <Package
                  size={20}
                  className="text-black/45"
                />

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
                    Order Items
                  </p>

                  <h2 className="mt-1 text-xl font-semibold">
                    Products
                  </h2>
                </div>

              </div>

              <div className="mt-7 divide-y divide-black/10">

                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-5 py-5 first:pt-0 last:pb-0"
                  >

                    <div className="min-w-0">

                      <p className="text-sm font-semibold">
                        {item.product_name}
                      </p>

                      <p className="mt-2 text-xs text-black/45">
                        ₹
                        {Number(
                          item.product_price || 0
                        ).toFixed(2)}
                        {" × "}
                        {item.quantity}
                      </p>

                    </div>

                    <p className="shrink-0 text-sm font-semibold">
                      ₹
                      {(
                        Number(
                          item.product_price || 0
                        ) *
                        Number(item.quantity || 0)
                      ).toFixed(2)}
                    </p>

                  </div>
                ))}

              </div>

            </section>

            {/* DELIVERY */}

            <section className="border border-black/10 bg-white p-6 md:p-8">

              <div className="flex items-start gap-3">

                <MapPin
                  size={20}
                  className="mt-0.5 shrink-0 text-black/45"
                />

                <div>

                  <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
                    Delivery Address
                  </p>

                  <h2 className="mt-2 text-lg font-semibold">
                    Shipping Information
                  </h2>

                  <p className="mt-4 text-sm leading-6">
                    {order.shipping_full_name}
                    <br />
                    {order.shipping_address}
                    <br />
                    {order.shipping_city},{" "}
                    {order.shipping_state}{" "}
                    {order.shipping_pincode}
                    <br />
                    {order.shipping_country}
                  </p>

                  <p className="mt-4 text-xs text-black/45">
                    Phone:{" "}
                    {order.shipping_phone}
                  </p>

                </div>

              </div>

            </section>

          </div>

          {/* RIGHT */}

          <aside className="h-fit border border-black/10 bg-white p-6 md:p-7 lg:sticky lg:top-6">

            <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
              Payment & Total
            </p>

            <div className="mt-6 space-y-3 text-sm">

              <div className="flex justify-between text-black/50">
                <span>Subtotal</span>

                <span>
                  ₹
                  {Number(
                    order.subtotal || 0
                  ).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-black/50">
                <span>Shipping</span>

                <span>
                  ₹
                  {Number(
                    order.shipping_fee || 0
                  ).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-black/50">
                <span>Discount</span>

                <span>
                  -₹
                  {Number(
                    order.discount || 0
                  ).toFixed(2)}
                </span>
              </div>

              <div className="mt-5 flex justify-between border-t border-black/10 pt-5">

                <span className="font-semibold">
                  Total
                </span>

                <span className="text-xl font-semibold">
                  ₹
                  {Number(
                    order.total_amount || 0
                  ).toFixed(2)}
                </span>

              </div>

            </div>

            <div className="mt-6 border border-black/10 bg-[#f7f6f2] p-4">

              <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
                Payment Method
              </p>

              <p className="mt-2 text-sm font-semibold uppercase">
                {order.payment_method || "N/A"}
              </p>

            </div>

            <Link
              to="/customer/orders"
              className="mt-6 flex w-full items-center justify-center gap-2 border border-black/20 px-5 py-3 text-xs font-semibold uppercase tracking-wider transition hover:border-black hover:bg-black hover:text-white"
            >
              <ArrowLeft size={14} />
              Back to Orders
            </Link>

          </aside>

        </div>

      </div>
    </main>
  );
}