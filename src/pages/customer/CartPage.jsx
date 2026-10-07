import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";

import { supabase } from "../../lib/supabase";

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  async function loadCart() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Please login to view your cart.");
      }

      const { data, error: cartError } = await supabase
        .from("cart_items")
        .select(`
          id,
          user_id,
          product_id,
          quantity,
          created_at,
          products (
            id,
            name,
            brand,
            price,
            discount_percentage,
            stock,
            is_active,
            product_images (
              id,
              image_url
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (cartError) {
        throw cartError;
      }

      setCartItems(data || []);
    } catch (err) {
      console.error("Cart error:", err);
      setError(err.message || "Unable to load your cart.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCart();
  }, []);

  function getFinalPrice(product) {
    const price = Number(product?.price || 0);
    const discount = Number(product?.discount_percentage || 0);

    return price - (price * discount) / 100;
  }

  function getItemTotal(item) {
    return getFinalPrice(item.products) * Number(item.quantity);
  }

  function getSubtotal() {
    return cartItems.reduce(
      (total, item) => total + getItemTotal(item),
      0
    );
  }

  function getShippingFee() {
    const subtotal = getSubtotal();

    if (subtotal === 0) {
      return 0;
    }

    return subtotal >= 999 ? 0 : 99;
  }

  function getTotal() {
    return getSubtotal() + getShippingFee();
  }

  async function updateQuantity(item, newQuantity) {
    if (newQuantity < 1) return;

    const stock = Number(item.products?.stock || 0);

    if (newQuantity > stock) {
      setError(`Only ${stock} item(s) are available in stock.`);
      return;
    }

    try {
      setUpdating(true);
      setError("");

      const { error: updateError } = await supabase
        .from("cart_items")
        .update({
          quantity: newQuantity,
        })
        .eq("id", item.id);

      if (updateError) {
        throw updateError;
      }

      setCartItems((previous) =>
        previous.map((cartItem) =>
          cartItem.id === item.id
            ? {
                ...cartItem,
                quantity: newQuantity,
              }
            : cartItem
        )
      );
    } catch (err) {
      console.error("Update cart error:", err);
      setError(err.message || "Unable to update quantity.");
    } finally {
      setUpdating(false);
    }
  }

  async function removeItem(itemId) {
    try {
      setUpdating(true);
      setError("");

      const { error: deleteError } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId);

      if (deleteError) {
        throw deleteError;
      }

      setCartItems((previous) =>
        previous.filter((item) => item.id !== itemId)
      );
    } catch (err) {
      console.error("Remove cart item error:", err);
      setError(err.message || "Unable to remove item.");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f6f2]">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center md:px-8">
          <p className="text-sm text-black/40">
            Loading your cart...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f6f2]">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">

        {/* Header */}
        <div className="border-b border-black/15 pb-8">

          <Link
            to="/shop"
            className="mb-5 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.13em] text-black/45 transition hover:text-black"
          >
            <ArrowLeft size={13} />
            Continue Shopping
          </Link>

          <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-black/40">
            E-SHOP
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-.05em] md:text-6xl">
            Your Cart
          </h1>

          <p className="mt-3 text-sm text-black/50">
            Review your items before checkout.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Empty Cart */}
        {!error && cartItems.length === 0 && (
          <div className="mt-10 border border-black/10 bg-white p-12 text-center">

            <h2 className="text-2xl font-semibold">
              Your cart is empty
            </h2>

            <p className="mt-2 text-sm text-black/45">
              Add some products to your cart and they will appear here.
            </p>

            <Link
              to="/shop"
              className="mt-6 inline-flex items-center gap-2 bg-black px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-black/80"
            >
              Start Shopping
              <ArrowRight size={14} />
            </Link>

          </div>
        )}

        {/* Cart */}
        {cartItems.length > 0 && (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">

            {/* Items */}
            <div className="space-y-4">

              {cartItems.map((item) => {
                const product = item.products;

                const image =
                  product?.product_images?.[0]?.image_url;

                const finalPrice = getFinalPrice(product);

                return (
                  <div
                    key={item.id}
                    className="border border-black/10 bg-white p-5 md:p-6"
                  >
                    <div className="flex gap-5">

                      {/* Image */}
                      <Link
                        to={`/products/${product?.id}`}
                        className="h-28 w-24 shrink-0 overflow-hidden bg-[#eeede9] md:h-36 md:w-32"
                      >
                        {image ? (
                          <img
                            src={image}
                            alt={product?.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[9px] uppercase tracking-wider text-black/30">
                            No image
                          </div>
                        )}
                      </Link>

                      {/* Details */}
                      <div className="min-w-0 flex-1">

                        <div className="flex justify-between gap-4">

                          <div>
                            <Link
                              to={`/products/${product?.id}`}
                              className="font-semibold transition hover:underline"
                            >
                              {product?.name}
                            </Link>

                            {product?.brand && (
                              <p className="mt-1 text-xs text-black/45">
                                {product.brand}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            disabled={updating}
                            className="shrink-0 text-black/35 transition hover:text-red-600 disabled:opacity-40"
                            title="Remove item"
                          >
                            <Trash2 size={17} />
                          </button>

                        </div>

                        {/* Price */}
                        <div className="mt-4 flex items-center gap-2">

                          <span className="font-semibold">
                            ₹{finalPrice.toFixed(2)}
                          </span>

                          {Number(product?.discount_percentage) > 0 && (
                            <span className="text-xs text-black/35 line-through">
                              ₹{Number(product.price).toFixed(2)}
                            </span>
                          )}

                        </div>

                        {/* Quantity */}
                        <div className="mt-5 flex items-center justify-between">

                          <div className="flex items-center border border-black/15">

                            <button
                              type="button"
                              disabled={
                                updating || item.quantity <= 1
                              }
                              onClick={() =>
                                updateQuantity(
                                  item,
                                  item.quantity - 1
                                )
                              }
                              className="grid h-9 w-9 place-items-center transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <Minus size={14} />
                            </button>

                            <span className="grid h-9 w-10 place-items-center border-x border-black/15 text-sm">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              disabled={
                                updating ||
                                item.quantity >=
                                  Number(product?.stock || 0)
                              }
                              onClick={() =>
                                updateQuantity(
                                  item,
                                  item.quantity + 1
                                )
                              }
                              className="grid h-9 w-9 place-items-center transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <Plus size={14} />
                            </button>

                          </div>

                          <p className="font-semibold">
                            ₹{getItemTotal(item).toFixed(2)}
                          </p>

                        </div>

                        {/* Stock */}
                        <p className="mt-3 text-[10px] uppercase tracking-wider text-black/35">
                          {Number(product?.stock || 0) > 0
                            ? `${product.stock} available`
                            : "Out of stock"}
                        </p>

                      </div>
                    </div>
                  </div>
                );
              })}

            </div>

            {/* Summary */}
            <aside className="h-fit border border-black/10 bg-white p-6 md:p-7 lg:sticky lg:top-6">

              <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
                Order Summary
              </p>

              <div className="mt-6 space-y-4">

                <div className="flex justify-between text-sm">
                  <span className="text-black/50">
                    Subtotal
                  </span>

                  <span>
                    ₹{getSubtotal().toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-black/50">
                    Shipping
                  </span>

                  <span>
                    {getShippingFee() === 0
                      ? "FREE"
                      : `₹${getShippingFee().toFixed(2)}`}
                  </span>
                </div>

                {getSubtotal() > 0 && getSubtotal() < 999 && (
                  <p className="border border-black/10 bg-[#f7f6f2] p-3 text-xs leading-5 text-black/50">
                    Add ₹
                    {(999 - getSubtotal()).toFixed(2)} more
                    to get free shipping.
                  </p>
                )}

                <div className="border-t border-black/10 pt-5">
                  <div className="flex justify-between">

                    <span className="font-semibold">
                      Total
                    </span>

                    <span className="text-xl font-semibold">
                      ₹{getTotal().toFixed(2)}
                    </span>

                  </div>
                </div>

              </div>

              <Link
                to="/checkout"
                className="mt-6 flex w-full items-center justify-center gap-2 bg-black px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-black/80"
              >
                Proceed to Checkout
                <ArrowRight size={15} />
              </Link>

              <Link
                to="/shop"
                className="mt-3 flex w-full items-center justify-center border border-black/15 px-6 py-4 text-xs font-semibold uppercase tracking-wider transition hover:border-black"
              >
                Continue Shopping
              </Link>

            </aside>

          </div>
        )}

      </div>
    </main>
  );
}