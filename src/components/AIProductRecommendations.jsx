import { useEffect, useState } from "react";
import { ArrowUpRight, Bot, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { supabase } from "../lib/supabase";

export default function AIProductRecommendations({ product }) {
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!product?.id) return;

    let cancelled = false;

    async function loadRecommendations() {
      try {
        setLoading(true);
        setError("");

        /*
         * Get products from the real Supabase catalog.
         *
         * Gemini will only choose from these products.
         */
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
            discount_percentage,
            stock,
            category_id,
            product_images (
              image_url
            )
          `)
          .neq("id", product.id)
          .gt("stock", 0)
          .limit(50);

        if (productsError) {
          throw productsError;
        }

        if (!products || products.length === 0) {
          if (!cancelled) {
            setRecommendedProducts([]);
            setLoading(false);
          }
          return;
        }

        const productContext = products.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description || "",
          price: Number(item.price || 0),
          category_id: item.category_id,
        }));

        /*
         * Ask our Supabase Edge Function to let Gemini
         * choose the most relevant products.
         */
        const { data, error: functionError } =
          await supabase.functions.invoke(
            "ai-product-recommendations",
            {
              body: {
                currentProduct: {
                  id: product.id,
                  name: product.name,
                  description: product.description || "",
                  price: Number(product.price || 0),
                  category_id: product.category_id,
                },
                products: productContext,
              },
            }
          );

        if (functionError) {
          console.error(
            "AI recommendation function error:",
            functionError
          );
          throw functionError;
        }

        if (data?.error) {
          console.error(
            "AI recommendation API error:",
            data.error
          );
          throw new Error(data.error);
        }

        const recommendedIds =
          Array.isArray(data?.recommendedProductIds)
            ? data.recommendedProductIds
            : [];

        /*
         * IMPORTANT:
         *
         * Gemini only returns IDs.
         *
         * React maps those IDs back to the REAL
         * Supabase products.
         */
        const recommendations = recommendedIds
          .map((recommendedId) =>
            products.find(
              (item) => item.id === recommendedId
            )
          )
          .filter(Boolean)
          .slice(0, 4);

        if (!cancelled) {
          setRecommendedProducts(recommendations);
        }
      } catch (err) {
        console.error(
          "AI recommendations error:",
          err
        );

        if (!cancelled) {
          setError(
            "Unable to load recommendations right now."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRecommendations();

    return () => {
      cancelled = true;
    };
  }, [product]);

  /*
   * Don't show anything if there are no recommendations.
   */
  if (!loading && recommendedProducts.length === 0) {
    return null;
  }

  return (
    <section className="mt-20 border-t border-black/10 pt-12">
      {/* Header */}
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <Bot size={17} />

            <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-black/50">
              AI Recommendations
            </p>
          </div>

          <h2 className="mt-3 text-3xl font-semibold tracking-[-.04em] md:text-4xl">
            You May Also Like
          </h2>

          <p className="mt-2 text-sm text-black/45">
            Handpicked by E-SHOP AI based on this product.
          </p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-8 flex items-center gap-3 border border-black/10 bg-white p-7">
          <Loader2
            size={18}
            className="animate-spin"
          />

          <p className="text-sm text-black/50">
            Finding products for you...
          </p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="mt-8 border border-black/10 bg-white p-7">
          <p className="text-sm text-black/45">
            {error}
          </p>
        </div>
      )}

      {/* Products */}
      {!loading &&
        recommendedProducts.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {recommendedProducts.map((item) => {
              const image =
                item.product_images?.[0]?.image_url;

              const price = Number(
                item.price || 0
              );

              const discount =
                Number(
                  item.discount_percentage || 0
                );

              const finalPrice =
                discount > 0
                  ? price -
                    (price * discount) / 100
                  : price;

              return (
                <Link
                  key={item.id}
                  to={`/products/${item.id}`}
                  className="group"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#eeede9]">
                    {image ? (
                      <img
                        src={image}
                        alt={item.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-wider text-black/30">
                        No Image
                      </div>
                    )}

                    {/* Open icon */}
                    <div className="absolute right-3 top-3 grid h-9 w-9 place-items-center bg-white opacity-0 transition group-hover:opacity-100">
                      <ArrowUpRight size={15} />
                    </div>
                  </div>

                  {/* Product information */}
                  <div className="pt-4">
                    <h3 className="line-clamp-2 text-sm font-semibold">
                      {item.name}
                    </h3>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">
                        ₹{finalPrice.toFixed(2)}
                      </span>

                      {discount > 0 && (
                        <span className="text-xs text-black/35 line-through">
                          ₹{price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
    </section>
  );
}