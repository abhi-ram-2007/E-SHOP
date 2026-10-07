import { Link } from "react-router-dom";
import { ArrowUpRight, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function SellerDashboard() {
  const { profile, signOut } = useAuth();

  return (
    <main className="min-h-screen bg-[#f7f6f2]">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">

        {/* Header */}
        <div className="flex flex-col justify-between gap-6 border-b border-black/15 pb-8 sm:flex-row sm:items-end">

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-black/40">
              E-SHOP Seller
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-.05em] md:text-6xl">
              Welcome, {profile?.full_name || "Seller"}
            </h1>

            <p className="mt-3 text-sm text-black/50">
              Manage your products and sales.
            </p>
          </div>


          {/* Header Actions */}
          <div className="flex flex-wrap items-center gap-3">

            {/* My Profile */}
            <Link
              to="/seller/profile"
              className="inline-flex items-center gap-2 border border-black/20 px-5 py-3 text-xs font-semibold uppercase tracking-wider transition hover:bg-black hover:text-white"
            >
              <User size={15} />

              My Profile
            </Link>


            {/* Logout */}
            <button
              onClick={signOut}
              className="border border-black/20 px-5 py-3 text-xs font-semibold uppercase tracking-wider transition hover:bg-black hover:text-white"
            >
              Logout
            </button>

          </div>

        </div>


        {/* Dashboard Cards */}
        <div className="mt-10 grid gap-5 md:grid-cols-3">


          {/* Add Product */}
          <Link
            to="/seller/products/new"
            className="group border border-black/15 bg-white p-7 transition hover:border-black"
          >

            <div className="flex items-start justify-between">

              <div>

                <p className="text-xs uppercase tracking-wider text-black/40">
                  Products
                </p>

                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  Add Product
                </h2>

                <p className="mt-2 text-sm leading-6 text-black/50">
                  Add a new product with images, pricing and stock.
                </p>

              </div>

              <ArrowUpRight
                size={20}
                className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
              />

            </div>

          </Link>


          {/* My Products */}
          <Link
            to="/seller/products"
            className="group border border-black/15 bg-white p-7 transition hover:border-black"
          >

            <div className="flex items-start justify-between">

              <div>

                <p className="text-xs uppercase tracking-wider text-black/40">
                  Products
                </p>

                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  My Products
                </h2>

                <p className="mt-2 text-sm leading-6 text-black/50">
                  View and manage the products you have added.
                </p>

              </div>

              <ArrowUpRight
                size={20}
                className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
              />

            </div>

          </Link>


          {/* My Orders */}
          <Link
            to="/seller/orders"
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
                  Manage orders received for your products.
                </p>

              </div>

              <ArrowUpRight
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