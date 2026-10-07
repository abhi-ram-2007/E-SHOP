import { useState } from "react";
import { Bot, Loader2, Sparkles } from "lucide-react";

import { supabase } from "../lib/supabase";

export default function AIReviewSummary({
  product,
  reviews = [],
}) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateSummary() {
    if (!reviews || reviews.length === 0) {
      setError("There are no reviews to summarize yet.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const reviewData = reviews
        .filter(
          (review) =>
            review.review_text &&
            review.review_text.trim()
        )
        .map((review) => ({
          rating: Number(review.rating || 0),
          review:
            review.review_text.trim(),
        }))
        .slice(0, 100);

      if (reviewData.length === 0) {
        setError(
          "There are no written reviews to summarize yet."
        );
        return;
      }

      const { data, error: functionError } =
        await supabase.functions.invoke(
          "ai-review-summary",
          {
            body: {
              product: {
                id: product?.id,
                name: product?.name,
              },
              reviews: reviewData,
            },
          }
        );

      if (functionError) {
        console.error(
          "AI review summary error:",
          functionError
        );

        throw functionError;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.summary) {
        throw new Error(
          "AI returned an empty review summary."
        );
      }

      setSummary(data.summary);
    } catch (err) {
      console.error(
        "Review summary error:",
        err
      );

      setError(
        err.message ||
          "Unable to generate the AI review summary."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-10 border border-black/10 bg-white p-7">
      {/* Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={16} />

            <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-black/45">
              AI Review Summary
            </p>
          </div>

          <h3 className="mt-3 text-2xl font-semibold tracking-[-.03em]">
            What customers are saying
          </h3>

          <p className="mt-2 text-sm text-black/45">
            Get a quick summary of customer feedback.
          </p>
        </div>

        {!summary && (
          <button
            type="button"
            onClick={generateSummary}
            disabled={
              loading || reviews.length === 0
            }
            className="inline-flex items-center justify-center gap-2 bg-black px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2
                  size={15}
                  className="animate-spin"
                />
                Analyzing...
              </>
            ) : (
              <>
                <Bot size={15} />
                Summarize Reviews
              </>
            )}
          </button>
        )}
      </div>

      {/* No reviews */}
      {reviews.length === 0 && (
        <div className="mt-7 border-t border-black/10 pt-6">
          <p className="text-sm text-black/45">
            No customer reviews are available yet.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="mt-7 border-t border-black/10 pt-7">
          {/* Overview */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
              Overall
            </p>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-black/65">
              {summary.overview}
            </p>
          </div>

          {/* Likes / concerns */}
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {/* Likes */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
                What customers like
              </p>

              {summary.likes?.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {summary.likes.map(
                    (item, index) => (
                      <li
                        key={index}
                        className="flex gap-3 text-sm text-black/65"
                      >
                        <span className="font-semibold">
                          +
                        </span>

                        <span>{item}</span>
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-black/40">
                  No clear positive themes found.
                </p>
              )}
            </div>

            {/* Concerns */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
                Common concerns
              </p>

              {summary.concerns?.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {summary.concerns.map(
                    (item, index) => (
                      <li
                        key={index}
                        className="flex gap-3 text-sm text-black/65"
                      >
                        <span className="font-semibold">
                          −
                        </span>

                        <span>{item}</span>
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-black/40">
                  No major concerns were identified.
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 border-t border-black/10 pt-5">
            <p className="text-[10px] uppercase tracking-wider text-black/35">
              AI-generated summary based on{" "}
              {reviews.length} customer review
              {reviews.length !== 1 ? "s" : ""}.
            </p>
          </div>

          {/* Generate again */}
          <button
            type="button"
            onClick={generateSummary}
            disabled={loading}
            className="mt-5 text-xs font-semibold uppercase tracking-wider text-black/45 transition hover:text-black disabled:opacity-40"
          >
            Generate again
          </button>
        </div>
      )}
    </section>
  );
}