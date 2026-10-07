import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  IndianRupee,
  Package,
  RefreshCw,
  ShoppingCart,
  Star,
  Store,
  Tags,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();

  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    customers: 0,
    sellers: 0,
    reviews: 0,
    revenue: 0,
  });

  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * =========================================================
   * LOAD ANALYTICS
   * =========================================================
   */

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError("");

      /*
       * PRODUCTS
       */
      const {
        data: productData,
        count: productCount,
        error: productError,
      } = await supabase
        .from("products")
        .select(
          `
            id,
            name,
            price,
            stock,
            rating,
            review_count,
            is_active,
            created_at
          `,
          {
            count: "exact",
          }
        )
        .order("created_at", {
          ascending: false,
        });

      if (productError) throw productError;

      /*
       * ORDERS
       */
      const {
        data: orderData,
        count: orderCount,
        error: orderError,
      } = await supabase
        .from("orders")
        .select(
          `
            id,
            user_id,
            status,
            total_amount,
            created_at
          `,
          {
            count: "exact",
          }
        )
        .order("created_at", {
          ascending: false,
        });

      if (orderError) throw orderError;

      /*
       * ORDER ITEMS
       */
      const {
        data: orderItemData,
        error: orderItemError,
      } = await supabase
        .from("order_items")
        .select(
          `
            id,
            order_id,
            product_id,
            product_name,
            product_price,
            quantity,
            seller_id,
            created_at
          `
        );

      if (orderItemError) throw orderItemError;

      /*
       * CUSTOMERS
       */
      const {
        count: customerCount,
        error: customerError,
      } = await supabase
        .from("profiles")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("role", "customer");

      if (customerError) throw customerError;

      /*
       * SELLERS
       */
      const {
        count: sellerCount,
        error: sellerError,
      } = await supabase
        .from("profiles")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("role", "seller");

      if (sellerError) throw sellerError;

      /*
       * REVIEWS
       */
      const {
        count: reviewCount,
        error: reviewError,
      } = await supabase
        .from("reviews")
        .select("*", {
          count: "exact",
          head: true,
        });

      if (reviewError) throw reviewError;

      /*
       * =========================================================
       * CONFIRMED ORDERS
       * =========================================================
       */

      const confirmedOrders = (orderData || []).filter(
        (order) =>
          String(order.status).toLowerCase() === "confirmed"
      );

      /*
       * Revenue = only Confirmed orders
       */
      const confirmedRevenue = confirmedOrders.reduce(
        (total, order) =>
          total + Number(order.total_amount || 0),
        0
      );

      /*
       * =========================================================
       * SAVE STATE
       * =========================================================
       */

      setStats({
        products: productCount || 0,
        orders: orderCount || 0,
        customers: customerCount || 0,
        sellers: sellerCount || 0,
        reviews: reviewCount || 0,
        revenue: confirmedRevenue,
      });

      setProducts(productData || []);
      setOrders(orderData || []);

      /*
       * Only confirmed order items are used for
       * best-selling product analytics.
       */

      const confirmedOrderIds = new Set(
        confirmedOrders.map((order) => order.id)
      );

      const confirmedOrderItems = (orderItemData || []).filter(
        (item) => confirmedOrderIds.has(item.order_id)
      );

      setOrderItems(confirmedOrderItems);
    } catch (err) {
      console.error("Admin analytics error:", err);

      setError(
        err?.message ||
          "Unable to load admin analytics."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  /*
   * =========================================================
   * FORMATTERS
   * =========================================================
   */

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  }

  function formatDate(date) {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(parsed);
  }

  /*
   * =========================================================
   * ORDER STATUS ANALYTICS
   * =========================================================
   */

  const orderStatusData = useMemo(() => {
    const map = {};

    orders.forEach((order) => {
      const status = order.status || "Unknown";

      map[status] = (map[status] || 0) + 1;
    });

    return Object.entries(map)
      .map(([status, count]) => ({
        status,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [orders]);

  const totalStatusOrders = orders.length || 1;

  /*
   * =========================================================
   * TOP SELLING PRODUCTS
   * =========================================================
   */

  const topProducts = useMemo(() => {
    const map = {};

    orderItems.forEach((item) => {
      const productKey =
        item.product_id || item.product_name;

      if (!map[productKey]) {
        map[productKey] = {
          id: item.product_id,
          name: item.product_name,
          quantity: 0,
          revenue: 0,
        };
      }

      map[productKey].quantity += Number(
        item.quantity || 0
      );

      map[productKey].revenue +=
        Number(item.product_price || 0) *
        Number(item.quantity || 0);
    });

    return Object.values(map)
      .sort((a, b) => {
        if (b.quantity !== a.quantity) {
          return b.quantity - a.quantity;
        }

        return b.revenue - a.revenue;
      })
      .slice(0, 5);
  }, [orderItems]);

  /*
   * =========================================================
   * LOW STOCK
   * =========================================================
   */

  const lowStockProducts = useMemo(() => {
    return products
      .filter(
        (product) =>
          Number(product.stock || 0) <= 5 &&
          product.is_active !== false
      )
      .sort(
        (a, b) =>
          Number(a.stock || 0) -
          Number(b.stock || 0)
      )
      .slice(0, 6);
  }, [products]);

  /*
   * =========================================================
   * REVENUE BY DAY
   * =========================================================
   */

  const revenueByDay = useMemo(() => {
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();

      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);

      days.push({
        date,
        label: new Intl.DateTimeFormat("en-IN", {
          weekday: "short",
        }).format(date),
        revenue: 0,
        orders: 0,
      });
    }

    orders.forEach((order) => {
      if (
        String(order.status).toLowerCase() !==
        "confirmed"
      ) {
        return;
      }

      if (!order.created_at) {
        return;
      }

      const orderDate = new Date(order.created_at);

      if (Number.isNaN(orderDate.getTime())) {
        return;
      }

      const matchingDay = days.find((day) => {
        return (
          day.date.getFullYear() ===
            orderDate.getFullYear() &&
          day.date.getMonth() ===
            orderDate.getMonth() &&
          day.date.getDate() ===
            orderDate.getDate()
        );
      });

      if (matchingDay) {
        matchingDay.revenue += Number(
          order.total_amount || 0
        );

        matchingDay.orders += 1;
      }
    });

    return days;
  }, [orders]);

  const maxRevenue = Math.max(
    ...revenueByDay.map((day) => day.revenue),
    1
  );

  /*
   * =========================================================
   * RECENT ORDERS
   * =========================================================
   */

  const recentOrders = orders.slice(0, 5);

  /*
   * =========================================================
   * STAT CARDS
   * =========================================================
   */

  const statCards = [
    {
      label: "Revenue",
      value: formatCurrency(stats.revenue),
      icon: IndianRupee,
    },
    {
      label: "Orders",
      value: stats.orders,
      icon: ShoppingCart,
    },
    {
      label: "Products",
      value: stats.products,
      icon: Package,
    },
    {
      label: "Customers",
      value: stats.customers,
      icon: Users,
    },
    {
      label: "Sellers",
      value: stats.sellers,
      icon: Store,
    },
    {
      label: "Reviews",
      value: stats.reviews,
      icon: Star,
    },
  ];

  /*
   * =========================================================
   * MANAGEMENT CARDS
   * =========================================================
   */

  const managementCards = [
    {
      title: "Products",
      description:
        "View, edit and manage products listed on E-SHOP.",
      icon: Package,
      path: "/admin/products",
    },
    {
      title: "Categories",
      description:
        "Manage product categories and organization.",
      icon: Tags,
      path: "/admin/categories",
    },
    {
      title: "Orders",
      description:
        "View customer orders and manage order status.",
      icon: ShoppingCart,
      path: "/admin/orders",
    },
    {
      title: "Customers",
      description:
        "View and manage registered customers.",
      icon: Users,
      path: "/admin/customers",
    },
    {
      title: "Sellers",
      description:
        "View sellers and their marketplace activity.",
      icon: Store,
      path: "/admin/sellers",
    },
    {
      title: "Reviews",
      description:
        "Review customer feedback and manage reviews.",
      icon: Star,
      path: "/admin/reviews",
    },
  ];

  /*
   * =========================================================
   * STATUS ICON
   * =========================================================
   */

  function getStatusIcon(status) {
    const normalized = String(status).toLowerCase();

    if (normalized === "confirmed") {
      return <CheckCircle2 size={15} />;
    }

    if (normalized === "pending") {
      return <Clock3 size={15} />;
    }

    return <ShoppingCart size={15} />;
  }

  /*
   * =========================================================
   * STATUS CLASS
   * =========================================================
   */

  function getStatusClass(status) {
    const normalized = String(status).toLowerCase();

    if (normalized === "confirmed") {
      return "bg-green-50 text-green-700 border-green-200";
    }

    if (normalized === "pending") {
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    }

    return "bg-black/5 text-black/60 border-black/10";
  }

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <main className="min-h-screen bg-[#f7f6f2]">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">

        {/* HEADER */}

        <div className="flex flex-col justify-between gap-6 border-b border-black/15 pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-black/40">
              E-SHOP Administration
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-.05em] md:text-6xl">
              Welcome, {profile?.full_name || "Admin"}
            </h1>

            <p className="mt-3 text-sm text-black/50">
              Monitor your marketplace performance from one
              place.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadAnalytics}
              disabled={loading}
              className="inline-flex items-center gap-2 border border-black/20 px-5 py-3 text-xs font-semibold uppercase tracking-wider transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={
                  loading ? "animate-spin" : ""
                }
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={signOut}
              className="w-fit border border-black/20 px-5 py-3 text-xs font-semibold uppercase tracking-wider transition hover:bg-black hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mt-6 flex items-center justify-between gap-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={loadAnalytics}
              className="text-xs font-semibold uppercase tracking-wider underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* KPI */}

        <section className="mt-10">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
              Overview
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Marketplace Analytics
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {statCards.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="border border-black/15 bg-white p-6 text-black"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-black/40">
                        {stat.label}
                      </p>

                      <p className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                        {loading ? "—" : stat.value}
                      </p>
                    </div>

                    <Icon
                      size={20}
                      className="text-black/40"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* REVENUE CHART */}

        <section className="mt-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
                Performance
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Revenue — Last 7 Days
              </h2>
            </div>

            <TrendingUp
              size={22}
              className="text-black/40"
            />
          </div>

          <div className="border border-black/15 bg-white p-6 md:p-8">
            {loading ? (
              <div className="flex h-64 items-center justify-center text-sm text-black/40">
                Loading revenue data...
              </div>
            ) : (
              <div className="flex h-64 items-end gap-3 md:gap-6">
                {revenueByDay.map((day) => {
                  const height =
                    day.revenue > 0
                      ? Math.max(
                          (day.revenue / maxRevenue) * 100,
                          8
                        )
                      : 3;

                  return (
                    <div
                      key={day.date.toISOString()}
                      className="flex h-full flex-1 flex-col justify-end"
                    >
                      <div className="mb-2 text-center text-[10px] font-medium text-black/50">
                        {day.revenue > 0
                          ? formatCurrency(day.revenue)
                          : "₹0"}
                      </div>

                      <div className="flex h-44 items-end">
                        <div
                          className="w-full bg-black transition-all"
                          style={{
                            height: `${height}%`,
                          }}
                          title={`${formatCurrency(
                            day.revenue
                          )} — ${day.orders} order${
                            day.orders === 1
                              ? ""
                              : "s"
                          }`}
                        />
                      </div>

                      <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-wider text-black/40">
                        {day.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ORDER STATUS + BEST SELLERS */}

        <section className="mt-12 grid gap-5 lg:grid-cols-2">

          {/* ORDER STATUS */}

          <div className="border border-black/15 bg-white p-6 md:p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
                  Orders
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Order Status
                </h2>
              </div>

              <ShoppingCart
                size={20}
                className="text-black/40"
              />
            </div>

            <div className="mt-8 space-y-5">
              {orderStatusData.length === 0 ? (
                <p className="text-sm text-black/40">
                  No orders available.
                </p>
              ) : (
                orderStatusData.map((item) => {
                  const percentage =
                    (item.count / totalStatusOrders) *
                    100;

                  return (
                    <div key={item.status}>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(item.status)}

                          <span className="font-medium">
                            {item.status}
                          </span>
                        </div>

                        <span className="text-black/50">
                          {item.count}
                        </span>
                      </div>

                      <div className="mt-2 h-2 bg-black/5">
                        <div
                          className="h-full bg-black transition-all"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>

                      <p className="mt-1 text-[10px] text-black/35">
                        {Math.round(percentage)}% of orders
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* BEST SELLERS */}

          <div className="border border-black/15 bg-white p-6 md:p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
                  Products
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Best Sellers
                </h2>
              </div>

              <BarChart3
                size={20}
                className="text-black/40"
              />
            </div>

            <div className="mt-8">
              {topProducts.length === 0 ? (
                <p className="text-sm text-black/40">
                  No confirmed sales data available.
                </p>
              ) : (
                <div className="space-y-5">
                  {topProducts.map((product, index) => (
                    <div
                      key={
                        product.id || product.name
                      }
                      className="flex items-center gap-4"
                    >
                      <div className="grid h-9 w-9 shrink-0 place-items-center border border-black/10 text-xs font-semibold">
                        {index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {product.name}
                        </p>

                        <p className="mt-1 text-xs text-black/40">
                          {product.quantity} unit
                          {product.quantity === 1
                            ? ""
                            : "s"}{" "}
                          sold
                        </p>
                      </div>

                      <p className="text-sm font-semibold">
                        {formatCurrency(product.revenue)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* LOW STOCK + RECENT ORDERS */}

        <section className="mt-12 grid gap-5 lg:grid-cols-2">

          {/* LOW STOCK */}

          <div className="border border-black/15 bg-white p-6 md:p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
                  Inventory
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Low Stock
                </h2>
              </div>

              <AlertTriangle
                size={20}
                className="text-black/40"
              />
            </div>

            <div className="mt-8">
              {lowStockProducts.length === 0 ? (
                <div className="border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                  All active products have healthy
                  stock levels.
                </div>
              ) : (
                <div className="space-y-4">
                  {lowStockProducts.map((product) => {
                    const stock = Number(
                      product.stock || 0
                    );

                    return (
                      <div
                        key={product.id}
                        className="flex items-center justify-between gap-4 border-b border-black/10 pb-4 last:border-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {product.name}
                          </p>

                          <p className="mt-1 text-xs text-black/40">
                            {formatCurrency(product.price)}
                          </p>
                        </div>

                        <span
                          className={
                            stock === 0
                              ? "shrink-0 border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-red-700"
                              : "shrink-0 border border-yellow-200 bg-yellow-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-yellow-700"
                          }
                        >
                          {stock === 0
                            ? "Out of stock"
                            : `${stock} left`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RECENT ORDERS */}

          <div className="border border-black/15 bg-white p-6 md:p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
                  Activity
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Recent Orders
                </h2>
              </div>

              <Link
                to="/admin/orders"
                className="text-[10px] font-semibold uppercase tracking-wider text-black/50 hover:text-black"
              >
                View all
              </Link>
            </div>

            <div className="mt-8">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-black/40">
                  No orders available.
                </p>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between gap-4 border-b border-black/10 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold">
                          #{order.id.slice(0, 8)}
                        </p>

                        <p className="mt-1 text-[11px] text-black/40">
                          {formatDate(order.created_at)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatCurrency(
                            order.total_amount
                          )}
                        </p>

                        <span
                          className={`mt-1 inline-flex items-center gap-1 border px-2 py-1 text-[9px] font-semibold uppercase tracking-wider ${getStatusClass(
                            order.status
                          )}`}
                        >
                          {getStatusIcon(order.status)}
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* MANAGEMENT */}

        <section className="mt-14">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
              Management
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Manage E-SHOP
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {managementCards.map((card) => {
              const Icon = card.icon;

              return (
                <Link
                  key={card.title}
                  to={card.path}
                  className="group border border-black/15 bg-white p-7 transition hover:border-black"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <Icon
                        size={22}
                        className="mb-6"
                      />

                      <h3 className="text-2xl font-semibold tracking-tight">
                        {card.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-black/50">
                        {card.description}
                      </p>
                    </div>

                    <ArrowUpRight
                      size={20}
                      className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}