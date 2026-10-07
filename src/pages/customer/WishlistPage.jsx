import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Heart,
  ShoppingBag,
  Trash2,
  ArrowUpRight,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { supabase } from "../../lib/supabase";
import { getFinalPrice } from "../../services/productService.js";

export default function WishlistPage() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);

  async function loadWishlist() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      const { data, error: wishlistError } = await supabase
        .from("wishlist_items")
        .select(`
          id,
          product_id,
          created_at,
          products (
            id,
            name,
            description,
            brand,
            price,
            discount_percentage,
            stock,
            is_active,
            categories (
              id,
              name,
              slug
            ),
            product_images (
              id,
              image_url
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (wishlistError) {
        throw wishlistError;
      }

      setProducts(data || []);
    } catch (err) {
      console.error("Wishlist error:", err);
      setError(
        err.message || "Unable to load your wishlist."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWishlist();
  }, []);

  async function removeFromWishlist(wishlistId, productId) {
    try {
      setRemovingId(productId);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      const { error: deleteError } = await supabase
        .from("wishlist_items")
        .delete()
        .eq("id", wishlistId)
        .eq("user_id", user.id);

      if (deleteError) {
        throw deleteError;
      }

      setProducts((previous) =>
        previous.filter(
          (item) => item.id !== wishlistId
        )
      );
    } catch (err) {
      console.error("Remove wishlist error:", err);
      setError(
        err.message || "Unable to remove from wishlist."
      );
    } finally {
      setRemovingId(null);
    }
  }

  async function addToCart(product) {
    try {
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      if (!product || Number(product.stock) <= 0) {
        setError("This product is currently out of stock.");
        return;
      }

      const { data: existingItem, error: existingError } =
        await supabase
          .from("cart_items")
          .select("id, quantity")
          .eq("user_id", user.id)
          .eq("product_id", product.id)
          .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existingItem) {
        const newQuantity =
          Number(existingItem.quantity) + 1;

        if (newQuantity > Number(product.stock)) {
          setError(
            `You can only add up to ${product.stock} item(s) because of available stock.`
          );
          return;
        }

        const { error: updateError } = await supabase
          .from("cart_items")
          .update({
            quantity: newQuantity,
          })
          .eq("id", existingItem.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        const { error: insertError } = await supabase
          .from("cart_items")
          .insert({
            user_id: user.id,
            product_id: product.id,
            quantity: 1,
          });

        if (insertError) {
          throw insertError;
        }
      }

      navigate("/cart");
    } catch (err) {
      console.error("Wishlist add to cart error:", err);
      setError(
        err.message || "Unable to add product to cart."
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f6f2]">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">

        {/* Header */}
        <div className="border-b border-black/15 pb-8">

          <Link
            to="/customer"
            className="mb-5 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.13em] text-black/45 transition hover:text-black"
          >
            <ArrowLeft size={13} />
            Customer Dashboard
          </Link>

          <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-black/40">
            E-SHOP Customer
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-.05em] md:text-6xl">
            Wishlist
          </h1>

          <p className="mt-3 text-sm text-black/50">
            Products you want to keep an eye on.
          </p>
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
            Loading your wishlist...
          </div>
        )}

        {/* Empty */}
        {!loading && !error && products.length === 0 && (
          <div className="mt-10 border border-black/10 bg-white p-12 text-center">

            <div className="mx-auto grid h-14 w-14 place-items-center border border-black/10 bg-[#f7f6f2]">
              <Heart size={22} className="text-black/40" />
            </div>

            <h2 className="mt-5 text-2xl font-semibold">
              Your wishlist is empty
            </h2>

            <p className="mt-2 text-sm text-black/45">
              Save products you love and find them here later.
            </p>

            <Link
              to="/shop"
              className="mt-6 inline-flex items-center gap-2 bg-black px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white"
            >
              Explore Products
              <ArrowUpRight size={14} />
            </Link>

          </div>
        )}

        {/* Products */}
        {!loading && products.length > 0 && (
          <div className="mt-10">

            <p className="mb-5 text-sm text-black/50">
              {products.length}{" "}
              {products.length === 1
                ? "saved product"
                : "saved products"}
            </p>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

              {products.map((item) => {
                const product = item.products;

                if (!product) return null;

                const image =
                  product.product_images?.[0]?.image_url;

                const finalPrice = getFinalPrice(
                  product.price,
                  product.discount_percentage
                );

                const outOfStock =
                  Number(product.stock) <= 0 ||
                  !product.is_active;

                return (
                  <article
                    key={item.id}
                    className="overflow-hidden border border-black/10 bg-white"
                  >

                    {/* Image */}
                    <Link
                      to={`/products/${product.id}`}
                      className="group block"
                    >
                      <div className="relative aspect-[4/5] overflow-hidden bg-[#eeede9]">

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

                        {product.discount_percentage > 0 && (
                          <span className="absolute left-3 top-3 bg-black px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-white">
                            {product.discount_percentage}% Off
                          </span>
                        )}

                      </div>
                    </Link>

                    {/* Details */}
                    <div className="p-5">

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-wider text-black/40">
                            {product.categories?.name}
                          </p>

                          <Link
                            to={`/products/${product.id}`}
                            className="mt-2 block"
                          >
                            <h2 className="font-semibold transition hover:underline">
                              {product.name}
                            </h2>
                          </Link>

                          {product.brand && (
                            <p className="mt-1 text-xs text-black/45">
                              {product.brand}
                            </p>
                          )}
                        </div>

                        <Heart
                          size={16}
                          fill="currentColor"
                          className="shrink-0"
                        />

                      </div>

                      {/* Price */}
                      <div className="mt-4 flex items-center gap-2">

                        <span className="font-semibold">
                          ₹{finalPrice.toFixed(2)}
                        </span>

                        {Number(
                          product.discount_percentage
                        ) > 0 && (
                          <span className="text-xs text-black/35 line-through">
                            ₹
                            {Number(
                              product.price
                            ).toFixed(2)}
                          </span>
                        )}

                      </div>

                      {/* Stock */}
                      <p
                        className={`mt-2 text-xs ${
                          outOfStock
                            ? "text-red-600"
                            : "text-black/45"
                        }`}
                      >
                        {outOfStock
                          ? "Currently unavailable"
                          : `${product.stock} available`}
                      </p>

                      {/* Actions */}
                      <div className="mt-5 flex gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            addToCart(product)
                          }
                          disabled={outOfStock}
                          className="flex flex-1 items-center justify-center gap-2 bg-black px-3 py-3 text-[10px] font-semibold uppercase tracking-wider text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ShoppingBag size={13} />
                          Add to Cart
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            removeFromWishlist(
                              item.id,
                              product.id
                            )
                          }
                          disabled={
                            removingId === product.id
                          }
                          className="grid h-11 w-11 shrink-0 place-items-center border border-red-200 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          aria-label={`Remove ${product.name} from wishlist`}
                          title="Remove from wishlist"
                        >
                          <Trash2 size={14} />
                        </button>

                      </div>
                    </div>
                  </article>
                );
              })}

            </div>
          </div>
        )}

      </div>
    </main>
  );
}