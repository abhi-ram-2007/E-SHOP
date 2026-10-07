import { useEffect, useState } from "react";

import {
  MessageCircle,
  Send,
  X,
  Bot,
  Loader2,
  ExternalLink,
} from "lucide-react";

import { Link } from "react-router-dom";

import { supabase } from "../lib/supabase";

export default function AIShoppingAssistant() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! 👋 I'm your E-SHOP shopping assistant. What are you looking for?",
      products: [],
    },
  ]);

  // ============================================================
  // SEND MESSAGE
  // ============================================================

  const sendMessage = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || loading) {
      return;
    }

    // ----------------------------------------------------------
    // ADD USER MESSAGE
    // ----------------------------------------------------------

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: trimmedMessage,
        products: [],
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      // ========================================================
      // 1. FETCH PRODUCTS
      // ========================================================

      const {
        data: products,
        error: productsError,
      } = await supabase
        .from("products")
        .select(`
          id,
          name,
          description,
          price,
          product_images (
            image_url
          )
        `)
        .limit(100);

      if (productsError) {
        console.error(
          "========== PRODUCTS ERROR =========="
        );

        console.error(
          "Products error:",
          productsError
        );

        console.error(
          "Message:",
          productsError.message
        );

        console.error(
          "Details:",
          productsError.details
        );

        console.error(
          "Hint:",
          productsError.hint
        );

        console.error(
          "===================================="
        );

        throw productsError;
      }

      // ========================================================
      // 2. PREPARE PRODUCT DATA FOR AI
      // ========================================================

      const productContext = (products || []).map(
        (product) => ({
          id: product.id,
          name: product.name,
          description: product.description || "",
          price: product.price,
        })
      );

      console.log(
        "E-SHOP products loaded:",
        productContext.length
      );

      console.log(
        "Products sent to AI:",
        productContext
      );

      // ========================================================
      // 3. CALL SUPABASE EDGE FUNCTION
      // ========================================================

      console.log(
        "Calling Edge Function: hyper-handler"
      );

      const {
        data,
        error,
      } = await supabase.functions.invoke(
        "hyper-handler",
        {
          body: {
            message: trimmedMessage,
            products: productContext,
          },
        }
      );

      // ========================================================
      // 4. EDGE FUNCTION ERROR
      // ========================================================

      if (error) {
        console.error(
          "========== EDGE FUNCTION ERROR =========="
        );

        console.error(
          "Error object:",
          error
        );

        console.error(
          "Error name:",
          error?.name
        );

        console.error(
          "Error message:",
          error?.message
        );

        console.error(
          "Error context:",
          error?.context
        );

        // Try to inspect actual response
        if (error?.context) {
          try {
            const response = error.context;

            console.error(
              "HTTP status:",
              response.status
            );

            console.error(
              "HTTP status text:",
              response.statusText
            );

            const responseText =
              await response.text();

            console.error(
              "Edge Function response:",
              responseText
            );

            try {
              const responseJson =
                JSON.parse(responseText);

              console.error(
                "Edge Function JSON:",
                responseJson
              );
            } catch {
              console.error(
                "Response was not JSON"
              );
            }
          } catch (readError) {
            console.error(
              "Could not read Edge Function response:",
              readError
            );
          }
        }

        console.error(
          "=========================================="
        );

        throw error;
      }

      // ========================================================
      // 5. EDGE FUNCTION RETURNED ERROR
      // ========================================================

      if (data?.error) {
        console.error(
          "Edge Function returned an error:",
          data.error
        );

        throw new Error(data.error);
      }

      // ========================================================
      // 6. GET AI ANSWER
      // ========================================================

      const answer =
        data?.answer ||
        "I couldn't find a suitable answer.";

      const recommendedProductIds =
        Array.isArray(
          data?.recommendedProductIds
        )
          ? data.recommendedProductIds
          : [];

      console.log(
        "AI answer:",
        answer
      );

      console.log(
        "Recommended product IDs:",
        recommendedProductIds
      );

      // ========================================================
      // 7. FIND REAL PRODUCTS
      // ========================================================

      const recommendedProducts =
        (products || []).filter((product) =>
          recommendedProductIds.includes(
            product.id
          )
        );

      console.log(
        "Recommended products:",
        recommendedProducts
      );

      // ========================================================
      // 8. ADD AI RESPONSE
      // ========================================================

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: answer,
          products: recommendedProducts,
        },
      ]);
    } catch (error) {
      // ========================================================
      // FINAL ERROR
      // ========================================================

      console.error(
        "========== AI ASSISTANT ERROR =========="
      );

      console.error(
        "Error:",
        error
      );

      console.error(
        "Error name:",
        error?.name
      );

      console.error(
        "Error message:",
        error?.message
      );

      console.error(
        "========================================"
      );

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            "Sorry, I'm having trouble connecting right now. Please try again.",
          products: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // ENTER KEY
  // ============================================================

  const handleKeyDown = (e) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ============================================================
  // AUTO FOCUS
  // ============================================================

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        document
          .getElementById(
            "ai-shopping-input"
          )
          ?.focus();
      }, 100);

      return () =>
        clearTimeout(timer);
    }
  }, [open]);

  // ============================================================
  // UI
  // ============================================================

  return (
    <>
      {/* ======================================================
          FLOATING AI BUTTON
      ====================================================== */}

      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-xl transition hover:scale-105"
          aria-label="Open AI Shopping Assistant"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* ======================================================
          AI CHAT WINDOW
      ====================================================== */}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[600px] w-[380px] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">

          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="flex items-center justify-between bg-black px-5 py-4 text-white">
            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black">
                <Bot size={20} />
              </div>

              <div>
                <h3 className="font-semibold">
                  E-SHOP AI
                </h3>

                <p className="text-xs text-white/60">
                  Shopping Assistant
                </p>
              </div>

            </div>

            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-2 transition hover:bg-white/10"
              aria-label="Close AI assistant"
            >
              <X size={20} />
            </button>
          </div>

          {/* ==================================================
              MESSAGES
          ================================================== */}

          <div className="flex-1 space-y-4 overflow-y-auto bg-[#f7f6f2] p-4">

            {messages.map(
              (item, index) => (
                <div
                  key={index}
                  className={`flex ${
                    item.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >

                  <div className="max-w-[88%]">

                    {/* ========================================
                        MESSAGE
                    ======================================== */}

                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                        item.role === "user"
                          ? "rounded-br-md bg-black text-white"
                          : "rounded-bl-md bg-white text-black shadow-sm"
                      }`}
                    >
                      {item.text}
                    </div>

                    {/* ========================================
                        PRODUCT CARDS
                    ======================================== */}

                    {item.role === "assistant" &&
                      item.products?.length > 0 && (
                        <div className="mt-3 space-y-3">

                          {item.products.map(
                            (product) => {
                              const image =
                                product
                                  .product_images?.[0]
                                  ?.image_url;

                              return (
                                <div
                                  key={product.id}
                                  className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm"
                                >

                                  {/* PRODUCT IMAGE */}

                                  <Link
                                    to={`/products/${product.id}`}
                                    onClick={() =>
                                      setOpen(false)
                                    }
                                    className="group block"
                                  >
                                    <div className="aspect-[4/3] overflow-hidden bg-[#eeede9]">

                                      {image ? (
                                        <img
                                          src={image}
                                          alt={
                                            product.name
                                          }
                                          loading="lazy"
                                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                      ) : (
                                        <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-wider text-black/30">
                                          No image
                                        </div>
                                      )}

                                    </div>
                                  </Link>

                                  {/* PRODUCT DETAILS */}

                                  <div className="p-4">

                                    <Link
                                      to={`/products/${product.id}`}
                                      onClick={() =>
                                        setOpen(false)
                                      }
                                      className="block"
                                    >
                                      <h4 className="text-sm font-semibold text-black transition hover:opacity-60">
                                        {product.name}
                                      </h4>
                                    </Link>

                                    <p className="mt-1 text-sm font-medium text-black/60">
                                      ₹
                                      {Number(
                                        product.price
                                      ).toLocaleString(
                                        "en-IN"
                                      )}
                                    </p>

                                    {product.description && (
                                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-black/45">
                                        {
                                          product.description
                                        }
                                      </p>
                                    )}

                                    <Link
                                      to={`/products/${product.id}`}
                                      onClick={() =>
                                        setOpen(false)
                                      }
                                      className="mt-3 flex w-full items-center justify-center gap-2 bg-black px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-black/80"
                                    >
                                      View Product
                                      <ExternalLink
                                        size={13}
                                      />
                                    </Link>

                                  </div>
                                </div>
                              );
                            }
                          )}

                        </div>
                      )}

                  </div>

                </div>
              )
            )}

            {/* ==================================================
                LOADING
            ================================================== */}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm shadow-sm">

                  <Loader2
                    size={16}
                    className="animate-spin"
                  />

                  Thinking...

                </div>
              </div>
            )}

          </div>

          {/* ==================================================
              INPUT
          ================================================== */}

          <div className="border-t bg-white p-3">

            <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-[#f7f6f2] px-3 py-2">

              <input
                id="ai-shopping-input"
                type="text"
                value={message}
                onChange={(e) =>
                  setMessage(
                    e.target.value
                  )
                }
                onKeyDown={handleKeyDown}
                placeholder="Ask about products..."
                disabled={loading}
                className="flex-1 bg-transparent text-sm outline-none"
              />

              <button
                onClick={sendMessage}
                disabled={
                  !message.trim() ||
                  loading
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Send message"
              >

                {loading ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Send size={17} />
                )}

              </button>

            </div>

          </div>

        </div>
      )}
    </>
  );
}