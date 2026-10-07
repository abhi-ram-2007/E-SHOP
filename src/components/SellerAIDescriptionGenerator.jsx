import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function SellerAIDescriptionGenerator({
  productName,
  brand,
  category,
  onGenerated,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateDescription() {
    setError("");

    if (!productName?.trim()) {
      setError("Enter a product name first.");
      return;
    }

    if (!category?.trim()) {
      setError("Select a category first.");
      return;
    }

    try {
      setLoading(true);

      const { data, error: functionError } =
        await supabase.functions.invoke("ai-product-description", {
          body: {
            productName: productName.trim(),
            brand: brand?.trim() || "",
            category: category.trim(),
          },
        });

      if (functionError) {
        throw functionError;
      }

      if (!data?.result) {
        throw new Error("AI did not return a valid product description.");
      }

      onGenerated(data.result);
    } catch (err) {
      console.error("AI product description error:", err);

      setError(
        err?.message ||
          "Unable to generate product description. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-5 border border-black/10 bg-[#eeede9] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={15} />

            <p className="text-xs font-semibold uppercase tracking-[.12em]">
              AI Product Writer
            </p>
          </div>

          <p className="mt-2 max-w-xl text-xs leading-6 text-black/55">
            Generate a professional product title, description, features and
            tags using AI. You can edit everything before saving.
          </p>
        </div>

        <button
          type="button"
          onClick={generateDescription}
          disabled={loading}
          className="inline-flex shrink-0 items-center gap-2 bg-black px-4 py-3 text-[10px] font-semibold uppercase tracking-[.1em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={14} />
              Generate with AI
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}