import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Pencil,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";

import { supabase } from "../../lib/supabase";

export default function MyProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in.");
      }

      const { data, error: productsError } = await supabase
        .from("products")
        .select(`
          id,
          name,
          brand,
          price,
          discount_percentage,
          stock,
          is_active,
          created_at,
          categories (
            id,
            name,
            slug
          ),
          product_images (
            id,
            image_url
          )
        `)
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (productsError) {
        throw productsError;
      }

      setProducts(data || []);
    } catch (err) {
      console.error("My products error:", err);
      setError(err.message || "Unable to load your products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function deleteProduct(productId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    try {
      setError("");

      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) {
        throw error;
      }

      setProducts((previous) =>
        previous.filter((product) => product.id !== productId)
      );
    } catch (err) {
      console.error("Delete product error:", err);
      setError(err.message || "Unable to delete product.");
    }
  }

  function getFinalPrice(price, discount) {
    return (
      Number(price) -
      (Number(price) * Number(discount || 0)) / 100
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f6f2]">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">

        {/* Header */}
        <div className="flex flex-col justify-between gap-6 border-b border-black/15 pb-8 sm:flex-row sm:items-end">

          <div>
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

            <h1 className="mt-3 text-4xl font-semibold tracking-[-.05em] md:text-6xl">
              My Products
            </h1>

            <p className="mt-3 text-sm text-black/50">
              Products added by your seller account.
            </p>
          </div>

          <Link
            to="/seller/products/new"
            className="inline-flex w-fit items-center gap-2 bg-black px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-black/80"
          >
            Add Product
            <ArrowUpRight size={14} />
          </Link>

        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="py-20 text-center text-sm text-black/40">
            Loading your products...
          </div>
        )}

        {/* Empty */}
        {!loading && !error && products.length === 0 && (
          <div className="mt-10 border border-black/10 bg-white p-12 text-center">

            <h2 className="text-2xl font-semibold">
              No products yet
            </h2>

            <p className="mt-2 text-sm text-black/45">
              Products you add will appear here.
            </p>

            <Link
              to="/seller/products/new"
              className="mt-6 inline-flex items-center gap-2 bg-black px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-black/80"
            >
              Add your first product
              <ArrowUpRight size={14} />
            </Link>

          </div>
        )}

        {/* Products */}
        {!loading && products.length > 0 && (
          <div className="mt-10">

            {/* Product Count */}
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm text-black/50">
                {products.length}{" "}
                {products.length === 1 ? "product" : "products"}
              </p>
            </div>

            {/* Product Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

              {products.map((product) => {
                const image =
                  product.product_images?.[0]?.image_url;

                const finalPrice = getFinalPrice(
                  product.price,
                  product.discount_percentage
                );

                return (
                  <div
                    key={product.id}
                    className="overflow-hidden border border-black/10 bg-white transition hover:border-black/25"
                  >

                    {/* Product Image */}
                    <Link
                      to={`/products/${product.id}`}
                      className="group block"
                    >
                      <div className="aspect-[4/5] overflow-hidden bg-[#eeede9]">

                        {image ? (
                          <img
                            src={image}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-wider text-black/30">
                            No image
                          </div>
                        )}

                      </div>
                    </Link>

                    {/* Product Details */}
                    <div className="p-5">

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">

                          <h2 className="truncate font-semibold">
                            {product.name}
                          </h2>

                          {product.brand && (
                            <p className="mt-1 text-xs text-black/45">
                              {product.brand}
                            </p>
                          )}

                          <p className="mt-2 text-xs text-black/45">
                            {product.categories?.name || "Uncategorized"}
                          </p>

                        </div>

                        {/* Status */}
                        <span
                          className={`shrink-0 text-[9px] font-semibold uppercase tracking-wider ${
                            product.is_active
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {product.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>

                      </div>

                      {/* Price */}
                      <div className="mt-4 flex items-center gap-2">

                        <span className="font-semibold">
                          ₹{finalPrice.toFixed(2)}
                        </span>

                        {Number(product.discount_percentage) > 0 && (
                          <>
                            <span className="text-xs text-black/35 line-through">
                              ₹{Number(product.price).toFixed(2)}
                            </span>

                            <span className="text-[9px] font-semibold text-green-600">
                              {product.discount_percentage}% OFF
                            </span>
                          </>
                        )}

                      </div>

                      {/* Stock */}
                      <p
                        className={`mt-2 text-xs ${
                          Number(product.stock) === 0
                            ? "font-semibold text-red-600"
                            : "text-black/45"
                        }`}
                      >
                        {Number(product.stock) === 0
                          ? "Out of stock"
                          : `Stock: ${product.stock}`}
                      </p>

                      {/* Actions */}
                      <div className="mt-5 flex gap-2">

                        {/* View */}
                        <Link
                          to={`/products/${product.id}`}
                          className="flex flex-1 items-center justify-center gap-2 border border-black/15 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider transition hover:border-black"
                        >
                          View
                          <ArrowUpRight size={13} />
                        </Link>

                        {/* Edit */}
                        <Link
                          to={`/seller/products/${product.id}/edit`}
                          className="grid h-9 w-9 place-items-center border border-black/15 text-black transition hover:bg-black hover:text-white"
                          aria-label={`Edit ${product.name}`}
                          title="Edit product"
                        >
                          <Pencil size={14} />
                        </Link>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() =>
                            deleteProduct(product.id)
                          }
                          className="grid h-9 w-9 place-items-center border border-red-200 text-red-600 transition hover:bg-red-50"
                          aria-label={`Delete ${product.name}`}
                          title="Delete product"
                        >
                          <Trash2 size={14} />
                        </button>

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>
          </div>
        )}

      </div>
    </main>
  );
}   