import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Package,
  ShoppingBag,
  Heart,
  User,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

export default function CustomerDashboard() {
  const { profile, signOut } = useAuth();

  return (
    <main className="min-h-screen bg-[#f7f6f2]">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">

        {/* Header */}
        <div className="flex flex-col justify-between gap-6 border-b border-black/15 pb-8 sm:flex-row sm:items-end">

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-black/40">
              E-SHOP Customer
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-.05em] md:text-6xl">
              Welcome, {profile?.full_name || "Customer"}
            </h1>

            <p className="mt-3 text-sm text-black/50">
              Manage your orders and shopping activity.
            </p>
          </div>

          <button
            onClick={signOut}
            className="w-fit border border-black/20 px-5 py-3 text-xs font-semibold uppercase tracking-wider transition hover:bg-black hover:text-white"
          >
            Logout
          </button>

        </div>

        {/* Dashboard Cards */}
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">

          {/* My Orders */}
          <Link
            to="/customer/orders"
            className="group border border-black/15 bg-white p-7 transition hover:border-black"
          >
            <div className="flex items-start justify-between">

              <div>
                <p className="text-xs uppercase tracking-wider text-black/40">
                  Orders
                </p>

                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  My Orders
                </h2>

                <p className="mt-2 text-sm leading-6 text-black/50">
                  View your orders and track their delivery status.
                </p>
              </div>

              <ArrowUpRight
                size={20}
                className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
              />

            </div>
          </Link>

          {/* Wishlist */}
          <Link
            to="/customer/wishlist"
            className="group border border-black/15 bg-white p-7 transition hover:border-black"
          >
            <div className="flex items-start justify-between">

              <div>
                <p className="text-xs uppercase tracking-wider text-black/40">
                  Saved
                </p>

                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  Wishlist
                </h2>

                <p className="mt-2 text-sm leading-6 text-black/50">
                  View products you have saved for later.
                </p>
              </div>

              <Heart
                size={20}
                className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
              />

            </div>
          </Link>

          {/* Continue Shopping */}
          <Link
            to="/shop"
            className="group border border-black/15 bg-white p-7 transition hover:border-black"
          >
            <div className="flex items-start justify-between">

              <div>
                <p className="text-xs uppercase tracking-wider text-black/40">
                  Shopping
                </p>

                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  Continue Shopping
                </h2>

                <p className="mt-2 text-sm leading-6 text-black/50">
                  Discover products across all E-SHOP categories.
                </p>
              </div>

              <ShoppingBag
                size={20}
                className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
              />

            </div>
          </Link>

          {/* My Profile */}
          <Link
            to="/customer/profile"
            className="group border border-black/15 bg-white p-7 transition hover:border-black"
          >
            <div className="flex items-start justify-between">

              <div>
                <p className="text-xs uppercase tracking-wider text-black/40">
                  Account
                </p>

                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  My Profile
                </h2>

                <p className="mt-2 text-sm leading-6 text-black/50">
                  Manage your profile, password, and account details.
                </p>
              </div>

              <User
                size={20}
                className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
              />

            </div>
          </Link>

        </div>

      </div>
    </main>
  );
}