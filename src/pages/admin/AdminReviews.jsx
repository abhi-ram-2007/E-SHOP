import { useEffect, useState } from "react";
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";

import { supabase } from "../../lib/supabase";

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReviews() {
    try {
      setLoading(true);
      setError("");

      const {
        data,
        error: reviewsError,
      } = await supabase
        .from("reviews")
        .select(`
          id,
          product_id,
          user_id,
          order_id,
          rating,
          review_text,
          created_at,
          updated_at
        `)
        .order("created_at", {
          ascending: false,
        });

      if (reviewsError) {
        throw reviewsError;
      }

      const reviewData = data || [];

      /*
       * Load customer profiles.
       */
      const userIds = [
        ...new Set(
          reviewData
            .map((review) => review.user_id)
            .filter(Boolean)
        ),
      ];

      let profiles = [];

      if (userIds.length > 0) {
        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            email
          `)
          .in("id", userIds);

        if (profileError) {
          throw profileError;
        }

        profiles = profileData || [];
      }

      /*
       * Load products.
       */
      const productIds = [
        ...new Set(
          reviewData
            .map((review) => review.product_id)
            .filter(Boolean)
        ),
      ];

      let products = [];

      if (productIds.length > 0) {
        const {
          data: productData,
          error: productError,
        } = await supabase
          .from("products")
          .select(`
            id,
            name
          `)
          .in("id", productIds);

        if (productError) {
          throw productError;
        }

        products = productData || [];
      }

      /*
       * Combine everything.
       */
      const combinedReviews = reviewData.map(
        (review) => {
          const customer = profiles.find(
            (profile) =>
              profile.id === review.user_id
          );

          const product = products.find(
            (item) =>
              item.id === review.product_id
          );

          return {
            ...review,
            customerName:
              customer?.full_name ||
              "Customer",
            customerEmail:
              customer?.email || "",
            productName:
              product?.name ||
              "Product unavailable",
          };
        }
      );

      setReviews(combinedReviews);
    } catch (err) {
      console.error(
        "Admin reviews error:",
        err
      );

      setError(
        err.message ||
          "Unable to load reviews."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, []);

  /*
   * Delete review.
   */
  async function handleDelete(review) {
    const confirmed = window.confirm(
      `Delete the review from ${review.customerName}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const {
        error: deleteError,
      } = await supabase
        .from("reviews")
        .delete()
        .eq("id", review.id);

      if (deleteError) {
        throw deleteError;
      }

      setReviews((current) =>
        current.filter(
          (item) => item.id !== review.id
        )
      );
    } catch (err) {
      console.error(
        "Delete review error:",
        err
      );

      setError(
        err.message ||
          "Unable to delete review."
      );
    }
  }

  /*
   * Filtering.
   */
  const filteredReviews = reviews.filter(
    (review) => {
      const searchText =
        search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        review.customerName
          ?.toLowerCase()
          .includes(searchText) ||
        review.customerEmail
          ?.toLowerCase()
          .includes(searchText) ||
        review.productName
          ?.toLowerCase()
          .includes(searchText) ||
        review.review_text
          ?.toLowerCase()
          .includes(searchText);

      const matchesRating =
        ratingFilter === "all" ||
        String(review.rating) ===
          ratingFilter;

      return (
        matchesSearch &&
        matchesRating
      );
    }
  );

  /*
   * Average rating.
   */
  const averageRating =
    reviews.length > 0
      ? reviews.reduce(
          (total, review) =>
            total + Number(review.rating || 0),
          0
        ) / reviews.length
      : 0;

  function formatDate(date) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  function renderStars(rating) {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            fill={
              star <= rating
                ? "currentColor"
                : "none"
            }
            className={
              star <= rating
                ? "text-black"
                : "text-black/20"
            }
          />
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f6f2]">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <p className="text-sm text-black/40">
            Loading reviews...
          </p>
        </div>
      </main>
    );
  }

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
              Reviews
            </h1>

            <p className="mt-3 text-sm text-black/50">
              Monitor customer feedback and
              manage product reviews.
            </p>
          </div>

          <button
            type="button"
            onClick={loadReviews}
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

        {/* SUMMARY */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">

          <div className="border border-black/10 bg-white p-6">
            <p className="text-xs uppercase tracking-wider text-black/40">
              Total Reviews
            </p>

            <p className="mt-3 text-4xl font-semibold">
              {reviews.length}
            </p>
          </div>

          <div className="border border-black/10 bg-white p-6">
            <p className="text-xs uppercase tracking-wider text-black/40">
              Average Rating
            </p>

            <div className="mt-3 flex items-center gap-3">

              <span className="text-4xl font-semibold">
                {averageRating.toFixed(1)}
              </span>

              <div>
                {renderStars(
                  Math.round(
                    averageRating
                  )
                )}

                <p className="mt-1 text-xs text-black/40">
                  out of 5
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* FILTERS */}
        <div className="mt-8 flex flex-col gap-3 md:flex-row">

          <div className="flex flex-1 items-center border border-black/15 bg-white">

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
              placeholder="Search customer, product or review..."
              className="w-full bg-transparent px-4 py-4 text-sm outline-none"
            />

          </div>

          <select
            value={ratingFilter}
            onChange={(event) =>
              setRatingFilter(
                event.target.value
              )
            }
            className="border border-black/15 bg-white px-5 py-4 text-sm outline-none"
          >
            <option value="all">
              All Ratings
            </option>
            <option value="5">
              5 Stars
            </option>
            <option value="4">
              4 Stars
            </option>
            <option value="3">
              3 Stars
            </option>
            <option value="2">
              2 Stars
            </option>
            <option value="1">
              1 Star
            </option>
          </select>

        </div>

        {/* COUNT */}
        <div className="mt-6">
          <p className="text-sm text-black/50">
            Showing{" "}
            <span className="font-semibold text-black">
              {filteredReviews.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-black">
              {reviews.length}
            </span>{" "}
            reviews
          </p>
        </div>

        {/* REVIEWS */}
        <section className="mt-6">

          {filteredReviews.length === 0 ? (
            <div className="border border-black/10 bg-white px-6 py-16 text-center">

              <Star
                size={34}
                className="mx-auto text-black/20"
              />

              <h2 className="mt-4 text-xl font-semibold">
                No reviews found
              </h2>

              <p className="mt-2 text-sm text-black/40">
                Try changing your search or
                rating filter.
              </p>

            </div>
          ) : (
            <div className="space-y-4">

              {filteredReviews.map(
                (review) => (
                  <article
                    key={review.id}
                    className="border border-black/10 bg-white p-6"
                  >

                    <div className="flex flex-col justify-between gap-5 md:flex-row">

                      {/* REVIEW INFO */}
                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-3">

                          <div className="grid h-10 w-10 shrink-0 place-items-center bg-black text-xs font-semibold text-white">
                            {(
                              review.customerName ||
                              "C"
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <p className="font-semibold">
                              {review.customerName}
                            </p>

                            <p className="text-xs text-black/40">
                              {review.customerEmail}
                            </p>
                          </div>

                        </div>

                        <div className="mt-5">

                          <Link
                            to={`/products/${review.product_id}`}
                            className="text-sm font-semibold underline underline-offset-4 hover:no-underline"
                          >
                            {review.productName}
                          </Link>

                          <div className="mt-2 flex items-center gap-3">
                            {renderStars(
                              Number(
                                review.rating
                              )
                            )}

                            <span className="text-xs text-black/40">
                              {review.rating}/5
                            </span>
                          </div>

                        </div>

                        {review.review_text && (
                          <p className="mt-5 max-w-3xl text-sm leading-7 text-black/65">
                            {review.review_text}
                          </p>
                        )}

                        <p className="mt-5 text-[10px] uppercase tracking-wider text-black/30">
                          Reviewed{" "}
                          {formatDate(
                            review.created_at
                          )}
                        </p>

                      </div>

                      {/* DELETE */}
                      <div className="shrink-0">

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              review
                            )
                          }
                          className="flex items-center gap-2 border border-red-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-red-600 transition hover:bg-red-600 hover:text-white"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>

                      </div>

                    </div>

                  </article>
                )
              )}

            </div>
          )}

        </section>

      </div>
    </main>
  );
}