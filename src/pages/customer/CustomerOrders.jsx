import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Package,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";

import { supabase } from "../../lib/supabase";

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in.");
      }

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
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (orderError) {
        throw orderError;
      }

      if (!orderData || orderData.length === 0) {
        setOrders([]);
        return;
      }

      const orderIds = orderData.map(
        (order) => order.id
      );

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
        .in("order_id", orderIds)
        .order("created_at", {
          ascending: true,
        });

      if (itemsError) {
        throw itemsError;
      }

      const combinedOrders =
        orderData.map((order) => ({
          ...order,
          items: (orderItems || []).filter(
            (item) =>
              item.order_id === order.id
          ),
        }));

      setOrders(combinedOrders);
    } catch (err) {
      console.error(
        "Customer orders error:",
        err
      );

      setError(
        err.message ||
          "Unable to load your orders."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  function formatDate(date) {
    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  function formatTime(date) {
    return new Date(date).toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  function getStatusClass(status) {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "border-green-200 bg-green-50 text-green-700";

      case "cancelled":
      case "canceled":
        return "border-red-200 bg-red-50 text-red-700";

      case "shipped":
        return "border-blue-200 bg-blue-50 text-blue-700";

      case "processing":
        return "border-yellow-200 bg-yellow-50 text-yellow-700";

      case "confirmed":
        return "border-purple-200 bg-purple-50 text-purple-700";

      default:
        return "border-black/10 bg-black/[.03] text-black/60";
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f6f2]">

      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">

        {/* HEADER */}

        <div className="border-b border-black/15 pb-8">

          <Link
            to="/customer"
            className="mb-5 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.13em] text-black/45 transition hover:text-black"
          >
            <ArrowLeft size={13} />
            Customer Dashboard
          </Link>

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

            <div>

              <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-black/40">
                E-SHOP Customer
              </p>

              <h1 className="mt-3 text-4xl font-semibold tracking-[-.05em] md:text-6xl">
                My Orders
              </h1>

              <p className="mt-3 text-sm text-black/50">
                Track and view your orders.
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
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* LOADING */}

        {loading && (
          <div className="py-20 text-center text-sm text-black/40">
            Loading your orders...
          </div>
        )}

        {/* EMPTY */}

        {!loading &&
          !error &&
          orders.length === 0 && (
            <div className="mt-10 border border-black/10 bg-white p-12 text-center">

              <div className="mx-auto grid h-14 w-14 place-items-center border border-black/10 bg-[#f7f6f2]">
                <Package
                  size={22}
                  className="text-black/40"
                />
              </div>

              <h2 className="mt-5 text-2xl font-semibold">
                No orders yet
              </h2>

              <p className="mt-2 text-sm text-black/45">
                Orders you place will appear here.
              </p>

              <Link
                to="/shop"
                className="mt-6 inline-flex bg-black px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white"
              >
                Start Shopping
              </Link>

            </div>
          )}

        {/* ORDERS */}

        {!loading &&
          orders.length > 0 && (
            <div className="mt-10 space-y-6">

              <p className="text-sm text-black/50">
                {orders.length}{" "}
                {orders.length === 1
                  ? "order"
                  : "orders"}
              </p>

              {orders.map((order) => (

                <div
                  key={order.id}
                  className="overflow-hidden border border-black/10 bg-white"
                >

                  {/* ORDER HEADER */}

                  <div className="border-b border-black/10 p-5 md:p-6">

                    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

                      <div>

                        <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
                          Order ID
                        </p>

                        <p className="mt-1 break-all font-mono text-sm font-semibold">
                          {order.id}
                        </p>

                        <p className="mt-2 text-xs text-black/45">
                          {formatDate(
                            order.created_at
                          )}
                          {" · "}
                          {formatTime(
                            order.created_at
                          )}
                        </p>

                      </div>

                      <span
                        className={`w-fit border px-4 py-2 text-[10px] font-semibold uppercase tracking-wider ${getStatusClass(
                          order.status
                        )}`}
                      >
                        {order.status ||
                          "Pending"}
                      </span>

                    </div>

                  </div>

                  {/* PRODUCTS */}

                  <div className="p-5 md:p-6">

                    <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
                      Ordered Products
                    </p>

                    <div className="mt-5 space-y-4">

                      {order.items.map(
                        (item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-4 border-b border-black/5 pb-4 last:border-0 last:pb-0"
                          >

                            <div>

                              <p className="text-sm font-semibold">
                                {
                                  item.product_name
                                }
                              </p>

                              <p className="mt-1 text-xs text-black/45">
                                ₹
                                {Number(
                                  item.product_price
                                ).toFixed(
                                  2
                                )}
                                {" × "}
                                {item.quantity}
                              </p>

                            </div>

                            <p className="shrink-0 text-sm font-semibold">
                              ₹
                              {(
                                Number(
                                  item.product_price
                                ) *
                                Number(
                                  item.quantity
                                )
                              ).toFixed(
                                2
                              )}
                            </p>

                          </div>
                        )
                      )}

                    </div>

                  </div>

                  {/* BOTTOM INFORMATION */}

                  <div className="grid border-t border-black/10 lg:grid-cols-2">

                    {/* DELIVERY */}

                    <div className="p-5 md:p-6 lg:border-r lg:border-black/10">

                      <div className="flex gap-3">

                        <MapPin
                          size={17}
                          className="mt-0.5 shrink-0 text-black/40"
                        />

                        <div>

                          <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
                            Delivery Address
                          </p>

                          <p className="mt-2 text-sm leading-6">

                            {
                              order.shipping_full_name
                            }

                            <br />

                            {
                              order.shipping_address
                            }

                            <br />

                            {
                              order.shipping_city
                            }
                            ,{" "}
                            {
                              order.shipping_state
                            }{" "}
                            {
                              order.shipping_pincode
                            }

                            <br />

                            {
                              order.shipping_country
                            }

                          </p>

                          <p className="mt-3 text-xs text-black/45">
                            Phone:{" "}
                            {
                              order.shipping_phone
                            }
                          </p>

                        </div>

                      </div>

                    </div>

                    {/* SUMMARY */}

                    <div className="border-t border-black/10 p-5 md:p-6 lg:border-t-0">

                      <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
                        Order Summary
                      </p>

                      <div className="mt-4 space-y-2 text-sm">

                        <div className="flex justify-between text-black/50">
                          <span>
                            Subtotal
                          </span>

                          <span>
                            ₹
                            {Number(
                              order.subtotal ||
                                0
                            ).toFixed(
                              2
                            )}
                          </span>
                        </div>

                        <div className="flex justify-between text-black/50">
                          <span>
                            Shipping
                          </span>

                          <span>
                            ₹
                            {Number(
                              order.shipping_fee ||
                                0
                            ).toFixed(
                              2
                            )}
                          </span>
                        </div>

                        <div className="flex justify-between text-black/50">
                          <span>
                            Discount
                          </span>

                          <span>
                            -₹
                            {Number(
                              order.discount ||
                                0
                            ).toFixed(
                              2
                            )}
                          </span>
                        </div>

                        <div className="mt-4 flex justify-between border-t border-black/10 pt-4">

                          <span className="font-semibold">
                            Total
                          </span>

                          <span className="text-lg font-semibold">
                            ₹
                            {Number(
                              order.total_amount ||
                                0
                            ).toFixed(
                              2
                            )}
                          </span>

                        </div>

                      </div>

                      <p className="mt-4 text-xs text-black/40">
                        Payment:{" "}
                        {order.payment_method ||
                          "N/A"}
                      </p>

                    </div>

                  </div>

                  {/* VIEW DETAILS */}

                  <div className="border-t border-black/10 p-5 md:p-6">

                    <Link
                      to={`/customer/orders/${order.id}`}
                      className="inline-flex items-center gap-2 bg-black px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-black/80"
                    >
                      View Order Details
                      <ArrowRight size={14} />
                    </Link>

                  </div>

                </div>

              ))}

            </div>
          )}

      </div>

    </main>
  );
}