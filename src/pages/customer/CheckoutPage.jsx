import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  MapPin,
  Plus,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { supabase } from "../../lib/supabase";

export default function CheckoutPage() {
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [savedAddresses, setSavedAddresses] = useState([]);

  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [error, setError] = useState("");
  const [addressMessage, setAddressMessage] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  // ------------------------------------------------------------
  // LOAD CHECKOUT
  // ------------------------------------------------------------

  async function loadCheckout() {
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

      // ----------------------------------------------------------
      // LOAD CART
      // ----------------------------------------------------------

      const {
        data,
        error: cartError,
      } = await supabase
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
            seller_id,
            product_images (
              id,
              image_url
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (cartError) {
        throw cartError;
      }

      if (!data || data.length === 0) {
        navigate("/cart");
        return;
      }

      const invalidItem = data.find(
        (item) =>
          !item.products ||
          !item.products.is_active ||
          Number(item.products.stock) <
            Number(item.quantity)
      );

      if (invalidItem) {
        setError(
          `${
            invalidItem.products?.name ||
            "A product"
          } is no longer available in the requested quantity. Please return to your cart.`
        );
      }

      setCartItems(data);

      // ----------------------------------------------------------
      // LOAD SAVED ADDRESSES
      // ----------------------------------------------------------

      const {
        data: addressData,
        error: addressError,
      } = await supabase
        .from("addresses")
        .select(`
          id,
          user_id,
          full_name,
          phone,
          address_line,
          city,
          state,
          pincode,
          country,
          is_default,
          created_at
        `)
        .eq("user_id", user.id)
        .order("is_default", {
          ascending: false,
        })
        .order("created_at", {
          ascending: false,
        });

      if (addressError) {
        throw addressError;
      }

      const addresses = addressData || [];

      setSavedAddresses(addresses);

      // ----------------------------------------------------------
      // AUTOMATICALLY SELECT DEFAULT ADDRESS
      // ----------------------------------------------------------

      const defaultAddress = addresses.find(
        (address) => address.is_default
      );

      if (defaultAddress) {
        selectSavedAddress(defaultAddress);
      }
    } catch (err) {
      console.error(
        "Checkout loading error:",
        err
      );

      setError(
        err.message ||
          "Unable to load checkout."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCheckout();
  }, []);

  // ------------------------------------------------------------
  // SELECT SAVED ADDRESS
  // ------------------------------------------------------------

  function selectSavedAddress(address) {
    setSelectedAddressId(address.id);

    setForm({
      fullName: address.full_name || "",
      phone: address.phone || "",
      address: address.address_line || "",
      city: address.city || "",
      state: address.state || "",
      pincode: address.pincode || "",
      country: address.country || "India",
    });

    setAddressMessage("");
    setError("");
  }

  // ------------------------------------------------------------
  // USE NEW ADDRESS
  // ------------------------------------------------------------

  function useNewAddress() {
    setSelectedAddressId(null);

    setForm({
      fullName: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
    });

    setAddressMessage(
      "Enter a new delivery address."
    );

    setError("");
  }

  // ------------------------------------------------------------
  // FORM CHANGE
  // ------------------------------------------------------------

  function handleChange(event) {
    const { name, value } = event.target;

    setSelectedAddressId(null);
    setAddressMessage("");

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  // ------------------------------------------------------------
  // PRICE HELPERS
  // ------------------------------------------------------------

  function getFinalPrice(product) {
    const price = Number(product?.price || 0);
    const discount = Number(
      product?.discount_percentage || 0
    );

    return (
      price -
      (price * discount) / 100
    );
  }

  function getItemTotal(item) {
    return (
      getFinalPrice(item.products) *
      Number(item.quantity)
    );
  }

  function getSubtotal() {
    return cartItems.reduce(
      (total, item) =>
        total + getItemTotal(item),
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
    return (
      getSubtotal() +
      getShippingFee()
    );
  }

  // ------------------------------------------------------------
  // VALIDATE ADDRESS
  // ------------------------------------------------------------

  function validateForm() {
    if (!form.fullName.trim()) {
      return "Please enter your full name.";
    }

    if (!form.phone.trim()) {
      return "Please enter your phone number.";
    }

    if (!/^[0-9]{10}$/.test(form.phone.trim())) {
      return "Please enter a valid 10-digit phone number.";
    }

    if (!form.address.trim()) {
      return "Please enter your delivery address.";
    }

    if (!form.city.trim()) {
      return "Please enter your city.";
    }

    if (!form.state.trim()) {
      return "Please enter your state.";
    }

    if (!/^[0-9]{6}$/.test(form.pincode.trim())) {
      return "Please enter a valid 6-digit pincode.";
    }

    if (!form.country.trim()) {
      return "Please enter your country.";
    }

    return null;
  }

  // ------------------------------------------------------------
  // PLACE ORDER
  // ------------------------------------------------------------

  async function placeOrder() {
    try {
      setError("");

      const validationError =
        validateForm();

      if (validationError) {
        setError(validationError);
        return;
      }

      setPlacingOrder(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      // ----------------------------------------------------------
      // FETCH CART AGAIN BEFORE ORDER
      // ----------------------------------------------------------

      const {
        data: latestCart,
        error: cartError,
      } = await supabase
        .from("cart_items")
        .select(`
          id,
          user_id,
          product_id,
          quantity,
          products (
            id,
            name,
            price,
            discount_percentage,
            stock,
            is_active,
            seller_id
          )
        `)
        .eq("user_id", user.id);

      if (cartError) {
        throw cartError;
      }

      if (
        !latestCart ||
        latestCart.length === 0
      ) {
        setError("Your cart is empty.");
        return;
      }

      // ----------------------------------------------------------
      // CHECK STOCK AGAIN
      // ----------------------------------------------------------

      const unavailableItem =
        latestCart.find(
          (item) =>
            !item.products ||
            !item.products.is_active ||
            Number(item.products.stock) <
              Number(item.quantity)
        );

      if (unavailableItem) {
        setError(
          `${
            unavailableItem.products?.name ||
            "A product"
          } is unavailable or does not have enough stock.`
        );

        return;
      }

      // ----------------------------------------------------------
      // CALCULATE TOTALS
      // ----------------------------------------------------------

      const subtotal =
        latestCart.reduce(
          (total, item) => {
            const price = Number(
              item.products.price || 0
            );

            const discountPercentage =
              Number(
                item.products
                  .discount_percentage || 0
              );

            const finalPrice =
              price -
              (price *
                discountPercentage) /
                100;

            return (
              total +
              finalPrice *
                Number(item.quantity)
            );
          },
          0
        );

      const shippingFee =
        subtotal >= 999 ? 0 : 99;

      const discount = 0;

      const totalAmount =
        subtotal +
        shippingFee -
        discount;

      // ----------------------------------------------------------
      // CREATE ORDER
      // ----------------------------------------------------------

      const {
        data: order,
        error: orderError,
      } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          status: "Pending",
          payment_method: "cod",

          subtotal,
          shipping_fee: shippingFee,
          discount,
          total_amount: totalAmount,

          shipping_full_name:
            form.fullName.trim(),

          shipping_phone:
            form.phone.trim(),

          shipping_address:
            form.address.trim(),

          shipping_city:
            form.city.trim(),

          shipping_state:
            form.state.trim(),

          shipping_pincode:
            form.pincode.trim(),

          shipping_country:
            form.country.trim(),
        })
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      // ----------------------------------------------------------
      // CREATE ORDER ITEMS
      // ----------------------------------------------------------

      const orderItems =
        latestCart.map((item) => {
          const product = item.products;

          const price = Number(
            product.price || 0
          );

          const discountPercentage =
            Number(
              product.discount_percentage ||
                0
            );

          const finalPrice =
            price -
            (price *
              discountPercentage) /
              100;

          return {
            order_id: order.id,
            product_id: product.id,
            seller_id: product.seller_id,
            product_name: product.name,
            product_price: finalPrice,
            quantity: Number(
              item.quantity
            ),
          };
        });

      const {
        error: orderItemsError,
      } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (orderItemsError) {
        throw orderItemsError;
      }

      // ----------------------------------------------------------
      // REDUCE STOCK SECURELY
      // ----------------------------------------------------------

      const {
        error: stockError,
      } = await supabase.rpc(
        "reduce_order_stock",
        {
          p_order_id: order.id,
        }
      );

      if (stockError) {
        throw stockError;
      }

      // ----------------------------------------------------------
      // CLEAR CART
      // ----------------------------------------------------------

      const {
        error: clearCartError,
      } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);

      if (clearCartError) {
        throw clearCartError;
      }

      // ----------------------------------------------------------
      // ORDER SUCCESS
      // ----------------------------------------------------------

      navigate(
        `/order-success/${order.id}`
      );
    } catch (err) {
      console.error(
        "Place order error:",
        err
      );

      setError(
        err.message ||
          "Unable to place your order."
      );
    } finally {
      setPlacingOrder(false);
    }
  }

  // ------------------------------------------------------------
  // LOADING
  // ------------------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f6f2]">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center md:px-8">
          <p className="text-sm text-black/40">
            Loading checkout...
          </p>
        </div>
      </main>
    );
  }

  // ------------------------------------------------------------
  // PAGE
  // ------------------------------------------------------------

  return (
    <main className="min-h-screen bg-[#f7f6f2]">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">

        {/* HEADER */}

        <div className="border-b border-black/15 pb-8">

          <Link
            to="/cart"
            className="mb-5 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.13em] text-black/45 transition hover:text-black"
          >
            <ArrowLeft size={13} />
            Back to cart
          </Link>

          <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-black/40">
            E-SHOP
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-.05em] md:text-6xl">
            Checkout
          </h1>

          <p className="mt-3 text-sm text-black/50">
            Select your delivery address and place your order.
          </p>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">

          {/* LEFT */}

          <div className="space-y-6">

            {/* SAVED ADDRESSES */}

            <section className="border border-black/10 bg-white p-6 md:p-8">

              <div className="flex items-start justify-between gap-4">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
                    Saved Addresses
                  </p>

                  <h2 className="mt-2 text-xl font-semibold">
                    Where should we deliver?
                  </h2>

                  <p className="mt-2 text-sm text-black/45">
                    Choose a saved address or enter a new one.
                  </p>
                </div>

                <MapPin
                  size={21}
                  className="shrink-0 text-black/40"
                />

              </div>

              {savedAddresses.length > 0 && (
                <div className="mt-6 space-y-3">

                  {savedAddresses.map(
                    (address) => {
                      const selected =
                        selectedAddressId ===
                        address.id;

                      return (
                        <button
                          key={address.id}
                          type="button"
                          onClick={() =>
                            selectSavedAddress(
                              address
                            )
                          }
                          className={`w-full border p-4 text-left transition ${
                            selected
                              ? "border-black bg-[#f7f6f2]"
                              : "border-black/10 hover:border-black/40"
                          }`}
                        >
                          <div className="flex items-start gap-4">

                            <div
                              className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                                selected
                                  ? "border-black"
                                  : "border-black/25"
                              }`}
                            >
                              {selected && (
                                <div className="h-2.5 w-2.5 rounded-full bg-black" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">

                              <div className="flex flex-wrap items-center gap-2">

                                <p className="font-semibold">
                                  {address.full_name}
                                </p>

                                {address.is_default && (
                                  <span className="border border-black/15 bg-white px-2 py-1 text-[9px] font-semibold uppercase tracking-wider">
                                    Default
                                  </span>
                                )}

                              </div>

                              <p className="mt-1 text-sm text-black/50">
                                {address.phone}
                              </p>

                              <p className="mt-3 text-sm leading-6 text-black/60">
                                {address.address_line}
                                <br />
                                {address.city},{" "}
                                {address.state} -{" "}
                                {address.pincode}
                                <br />
                                {address.country}
                              </p>

                            </div>
                          </div>
                        </button>
                      );
                    }
                  )}

                </div>
              )}

              {/* NEW ADDRESS BUTTON */}

              <button
                type="button"
                onClick={useNewAddress}
                className={`mt-5 flex w-full items-center justify-center gap-2 border px-4 py-3 text-xs font-semibold uppercase tracking-wider transition ${
                  selectedAddressId === null
                    ? "border-black bg-black text-white"
                    : "border-black/20 hover:border-black hover:bg-black hover:text-white"
                }`}
              >
                <Plus size={14} />

                {savedAddresses.length > 0
                  ? "Use a New Address"
                  : "Enter Delivery Address"}
              </button>

              {addressMessage && (
                <p className="mt-3 text-xs text-black/45">
                  {addressMessage}
                </p>
              )}

            </section>

            {/* CUSTOMER INFORMATION */}

            <section className="border border-black/10 bg-white p-6 md:p-8">

              <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
                Customer Information
              </p>

              <div className="mt-6 grid gap-5">

                {/* FULL NAME */}

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    readOnly={
                      selectedAddressId !== null
                    }
                    placeholder="Your full name"
                    autoComplete="name"
                    className={`mt-2 w-full border px-4 py-3 text-sm outline-none transition ${
                      selectedAddressId !== null
                        ? "cursor-not-allowed border-black/10 bg-black/[0.03] text-black/50"
                        : "border-black/15 focus:border-black"
                    }`}
                  />
                </div>

                {/* PHONE */}

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider">
                    Phone Number
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    readOnly={
                      selectedAddressId !== null
                    }
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    inputMode="numeric"
                    autoComplete="tel"
                    className={`mt-2 w-full border px-4 py-3 text-sm outline-none transition ${
                      selectedAddressId !== null
                        ? "cursor-not-allowed border-black/10 bg-black/[0.03] text-black/50"
                        : "border-black/15 focus:border-black"
                    }`}
                  />
                </div>

              </div>

            </section>

            {/* DELIVERY ADDRESS */}

            {selectedAddressId === null && (
              <section className="border border-black/10 bg-white p-6 md:p-8">

                <div className="flex items-start justify-between gap-4">

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
                      Delivery Address
                    </p>

                    <p className="mt-2 text-sm text-black/45">
                      Enter the address where you want your order delivered.
                    </p>
                  </div>

                  <MapPin
                    size={20}
                    className="shrink-0 text-black/40"
                  />

                </div>

                <div className="mt-6 space-y-5">

                  {/* ADDRESS */}

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider">
                      Address
                    </label>

                    <textarea
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      rows={4}
                      placeholder="House number, street, area"
                      autoComplete="street-address"
                      className="mt-2 w-full resize-none border border-black/15 px-4 py-3 text-sm outline-none transition focus:border-black"
                    />
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">

                    {/* CITY */}

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider">
                        City
                      </label>

                      <input
                        type="text"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        placeholder="City"
                        autoComplete="address-level2"
                        className="mt-2 w-full border border-black/15 px-4 py-3 text-sm outline-none transition focus:border-black"
                      />
                    </div>

                    {/* STATE */}

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider">
                        State
                      </label>

                      <input
                        type="text"
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                        placeholder="State"
                        autoComplete="address-level1"
                        className="mt-2 w-full border border-black/15 px-4 py-3 text-sm outline-none transition focus:border-black"
                      />
                    </div>

                    {/* PINCODE */}

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider">
                        Pincode
                      </label>

                      <input
                        type="text"
                        name="pincode"
                        value={form.pincode}
                        onChange={handleChange}
                        placeholder="6-digit pincode"
                        maxLength={6}
                        inputMode="numeric"
                        autoComplete="postal-code"
                        className="mt-2 w-full border border-black/15 px-4 py-3 text-sm outline-none transition focus:border-black"
                      />
                    </div>

                    {/* COUNTRY */}

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider">
                        Country
                      </label>

                      <input
                        type="text"
                        name="country"
                        value={form.country}
                        onChange={handleChange}
                        placeholder="Country"
                        autoComplete="country-name"
                        className="mt-2 w-full border border-black/15 px-4 py-3 text-sm outline-none transition focus:border-black"
                      />
                    </div>

                  </div>
                </div>

              </section>
            )}

            {/* PAYMENT */}

            <section className="border border-black/10 bg-white p-6 md:p-8">

              <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
                Payment Method
              </p>

              <div className="mt-6 border border-black bg-[#f7f6f2] p-5">

                <div className="flex items-center gap-4">

                  <div className="grid h-11 w-11 place-items-center bg-black text-white">
                    <CreditCard size={19} />
                  </div>

                  <div>
                    <p className="font-semibold">
                      Cash on Delivery
                    </p>

                    <p className="mt-1 text-xs text-black/45">
                      Pay when your order is delivered.
                    </p>
                  </div>

                  <div className="ml-auto grid h-5 w-5 place-items-center rounded-full bg-black text-white">
                    <Check size={12} />
                  </div>

                </div>

              </div>

            </section>

          </div>

          {/* RIGHT SIDE */}

          <aside className="h-fit border border-black/10 bg-white p-6 md:p-7 lg:sticky lg:top-6">

            <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
              Order Summary
            </p>

            {/* ITEMS */}

            <div className="mt-6 space-y-4">

              {cartItems.map((item) => {
                const image =
                  item.products
                    ?.product_images?.[0]
                    ?.image_url;

                return (
                  <div
                    key={item.id}
                    className="flex gap-3"
                  >

                    <div className="h-16 w-14 shrink-0 overflow-hidden bg-[#eeede9]">

                      {image ? (
                        <img
                          src={image}
                          alt={
                            item.products?.name
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[8px] uppercase tracking-wider text-black/30">
                          No image
                        </div>
                      )}

                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-sm font-semibold">
                        {item.products?.name}
                      </p>

                      <p className="mt-1 text-xs text-black/45">
                        Qty: {item.quantity}
                      </p>

                    </div>

                    <p className="shrink-0 text-sm font-semibold">
                      ₹
                      {getItemTotal(item).toFixed(
                        2
                      )}
                    </p>

                  </div>
                );
              })}

            </div>

            {/* TOTALS */}

            <div className="mt-6 space-y-3 border-t border-black/10 pt-6">

              <div className="flex justify-between text-sm">

                <span className="text-black/50">
                  Subtotal
                </span>

                <span>
                  ₹
                  {getSubtotal().toFixed(
                    2
                  )}
                </span>

              </div>

              <div className="flex justify-between text-sm">

                <span className="text-black/50">
                  Shipping
                </span>

                <span>
                  {getShippingFee() ===
                  0
                    ? "FREE"
                    : `₹${getShippingFee().toFixed(
                        2
                      )}`}
                </span>

              </div>

              <div className="flex justify-between border-t border-black/10 pt-5">

                <span className="font-semibold">
                  Total
                </span>

                <span className="text-xl font-semibold">
                  ₹
                  {getTotal().toFixed(
                    2
                  )}
                </span>

              </div>

            </div>

            {/* PLACE ORDER */}

            <button
              type="button"
              onClick={placeOrder}
              disabled={
                placingOrder ||
                Boolean(error)
              }
              className="mt-6 flex w-full items-center justify-center gap-2 bg-black px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {placingOrder
                ? "Placing Order..."
                : "Place Order"}

              {!placingOrder && (
                <ArrowRight size={15} />
              )}
            </button>

            <p className="mt-4 text-center text-[10px] leading-5 text-black/35">
              By placing this order, you agree to complete
              payment upon delivery.
            </p>

          </aside>

        </div>
      </div>
    </main>
  );
}