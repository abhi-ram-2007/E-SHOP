import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Package,
  Pencil,
  RefreshCw,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";

import { supabase } from "../../lib/supabase";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  /*
   * ------------------------------------------------------------
   * LOAD PRODUCTS
   * ------------------------------------------------------------
   */

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const { data, error: productsError } = await supabase
        .from("products")
        .select(`
          id,
          name,
          brand,
          price,
          discount_percentage,
          stock,
          rating,
          review_count,
          created_at,
          categories (
            name
          ),
          product_images (
            id,
            image_url
          )
        `)
        .order("created_at", { ascending: false });

      if (productsError) {
        throw productsError;
      }

      setProducts(data || []);
    } catch (err) {
      console.error("Admin products error:", err);
      setError(
        err.message || "Unable to load products."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  /*
   * ------------------------------------------------------------
   * DELETE PRODUCT
   * ------------------------------------------------------------
   */

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(product.id);
      setError("");

      /*
       * Delete product image records first.
       */
      const { error: imageDeleteError } = await supabase
        .from("product_images")
        .delete()
        .eq("product_id", product.id);

      if (imageDeleteError) {
        throw imageDeleteError;
      }

      /*
       * Delete product.
       */
      const { error: productDeleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

      if (productDeleteError) {
        throw productDeleteError;
      }

      /*
       * Remove product from local state.
       */
      setProducts((currentProducts) =>
        currentProducts.filter(
          (item) => item.id !== product.id
        )
      );
    } catch (err) {
      console.error("Delete product error:", err);

      setError(
        err.message ||
          "Unable to delete product. The product may be connected to an existing order."
      );
    } finally {
      setDeletingId(null);
    }
  }

  /*
   * ------------------------------------------------------------
   * SEARCH
   * ------------------------------------------------------------
   */

  const filteredProducts = products.filter((product) => {
    const searchText = search.toLowerCase().trim();

    if (!searchText) {
      return true;
    }

    return (
      product.name
        ?.toLowerCase()
        .includes(searchText) ||
      product.brand
        ?.toLowerCase()
        .includes(searchText) ||
      product.categories?.name
        ?.toLowerCase()
        .includes(searchText)
    );
  });

  /*
   * ------------------------------------------------------------
   * FINAL PRICE
   * ------------------------------------------------------------
   */

  function getFinalPrice(product) {
    const price = Number(product.price || 0);

    const discount = Number(
      product.discount_percentage || 0
    );

    return price - (price * discount) / 100;
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
            Loading products...
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
              Products
            </h1>

            <p className="mt-3 text-sm text-black/50">
              View and manage products listed on E-SHOP.
            </p>
          </div>

          <button
            type="button"
            onClick={loadProducts}
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

        {/* SEARCH */}
        <div className="mt-10 flex items-center border border-black/15 bg-white">
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
            placeholder="Search products, brands or categories..."
            className="w-full bg-transparent px-4 py-4 text-sm outline-none"
          />
        </div>

        {/* SUMMARY */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">

          <p className="text-sm text-black/50">
            Showing{" "}
            <span className="font-semibold text-black">
              {filteredProducts.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-black">
              {products.length}
            </span>{" "}
            products
          </p>

          <div className="flex items-center gap-2 text-xs text-black/40">
            <Package size={14} />
            Product Management
          </div>
        </div>

        {/* PRODUCTS */}
        <section className="mt-6">

          {filteredProducts.length === 0 ? (
            <div className="border border-black/10 bg-white px-6 py-16 text-center">

              <Package
                size={32}
                className="mx-auto text-black/20"
              />

              <h2 className="mt-4 text-xl font-semibold">
                No products found
              </h2>

              <p className="mt-2 text-sm text-black/40">
                Try a different search term.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto border border-black/10 bg-white">

              <table className="w-full min-w-[950px] border-collapse">

                <thead>
                  <tr className="border-b border-black/10 text-left">

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-black/40">
                      Product
                    </th>

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-black/40">
                      Category
                    </th>

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-black/40">
                      Price
                    </th>

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-black/40">
                      Stock
                    </th>

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-black/40">
                      Rating
                    </th>

                    <th className="px-5 py-4 text-right text-[10px] font-semibold uppercase tracking-wider text-black/40">
                      Actions
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {filteredProducts.map((product) => {
                    const image =
                      product.product_images?.[0]?.image_url;

                    const finalPrice =
                      getFinalPrice(product);

                    return (
                      <tr
                        key={product.id}
                        className="border-b border-black/10 last:border-b-0"
                      >

                        {/* PRODUCT */}
                        <td className="px-5 py-5">

                          <div className="flex items-center gap-4">

                            <div className="h-16 w-16 shrink-0 overflow-hidden bg-[#eeede9]">

                              {image ? (
                                <img
                                  src={image}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="grid h-full place-items-center">
                                  <Package
                                    size={20}
                                    className="text-black/20"
                                  />
                                </div>
                              )}

                            </div>

                            <div>
                              <p className="font-semibold">
                                {product.name}
                              </p>

                              {product.brand && (
                                <p className="mt-1 text-xs text-black/40">
                                  {product.brand}
                                </p>
                              )}
                            </div>

                          </div>

                        </td>

                        {/* CATEGORY */}
                        <td className="px-5 py-5 text-sm text-black/60">
                          {product.categories?.name || "—"}
                        </td>

                        {/* PRICE */}
                        <td className="px-5 py-5">

                          <p className="text-sm font-semibold">
                            ₹{finalPrice.toFixed(2)}
                          </p>

                          {Number(
                            product.discount_percentage
                          ) > 0 && (
                            <p className="mt-1 text-xs text-black/35 line-through">
                              ₹
                              {Number(
                                product.price
                              ).toFixed(2)}
                            </p>
                          )}

                        </td>

                        {/* STOCK */}
                        <td className="px-5 py-5">

                          <span
                            className={
                              Number(product.stock) <= 0
                                ? "text-sm font-semibold text-red-600"
                                : Number(product.stock) <= 5
                                  ? "text-sm font-semibold text-orange-600"
                                  : "text-sm text-black/60"
                            }
                          >
                            {product.stock}
                          </span>

                        </td>

                        {/* RATING */}
                        <td className="px-5 py-5">

                          <div className="flex items-center gap-2">

                            <Star
                              size={15}
                              fill="currentColor"
                            />

                            <span className="text-sm font-semibold">
                              {Number(
                                product.rating || 0
                              ).toFixed(1)}
                            </span>

                            <span className="text-xs text-black/35">
                              ({product.review_count || 0})
                            </span>

                          </div>

                        </td>

                        {/* ACTIONS */}
                        <td className="px-5 py-5">

                          <div className="flex justify-end gap-2">

                            {/* VIEW */}
                            <Link
                              to={`/products/${product.id}`}
                              className="grid h-9 w-9 place-items-center border border-black/15 transition hover:bg-black hover:text-white"
                              title="View product"
                            >
                              <ExternalLink size={14} />
                            </Link>

                            {/* EDIT */}
                            <Link
                              to={`/admin/products/edit/${product.id}`}
                              className="grid h-9 w-9 place-items-center border border-black/15 transition hover:bg-black hover:text-white"
                              title="Edit product"
                            >
                              <Pencil size={14} />
                            </Link>

                            {/* DELETE */}
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(product)
                              }
                              disabled={
                                deletingId === product.id
                              }
                              className="grid h-9 w-9 place-items-center border border-black/15 transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                              title="Delete product"
                            >
                              <Trash2 size={14} />
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  })}

                </tbody>
              </table>

            </div>
          )}

        </section>

      </div>
    </main>
  );
}