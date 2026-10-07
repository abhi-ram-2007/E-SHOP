import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Heart,
  Pencil,
  ShoppingBag,
  Star,
  Trash2,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  getFinalPrice,
  getProductById,
} from "../services/productService.js";

import { supabase } from "../lib/supabase";
import AIProductRecommendations from "../components/AIProductRecommendations";
import AIReviewSummary from "../components/AIReviewSummary";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Product
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Cart / Wishlist
  const [addingToCart, setAddingToCart] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const [canReview, setCanReview] = useState(false);
  const [reviewOrderId, setReviewOrderId] = useState(null);

  const [myReview, setMyReview] = useState(null);
  const [editingReview, setEditingReview] = useState(false);

  const [submittingReview, setSubmittingReview] = useState(false);

  /*
   * ------------------------------------------------------------
   * LOAD PRODUCT
   * ------------------------------------------------------------
   */

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        setError("");

        const data = await getProductById(id);

        setProduct(data);
      } catch (err) {
        console.error("Product loading error:", err);
        setError("Product could not be found.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadProduct();
    }
  }, [id]);

  /*
   * ------------------------------------------------------------
   * CHECK WISHLIST
   * ------------------------------------------------------------
   */

  useEffect(() => {
    async function checkWishlist() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setIsWishlisted(false);
          return;
        }

        const { data, error: wishlistError } = await supabase
          .from("wishlist_items")
          .select("id")
          .eq("user_id", user.id)
          .eq("product_id", id)
          .maybeSingle();

        if (wishlistError) {
          console.error("Wishlist check error:", wishlistError);
          return;
        }

        setIsWishlisted(Boolean(data));
      } catch (err) {
        console.error("Wishlist check error:", err);
      }
    }

    if (id) {
      checkWishlist();
    }
  }, [id]);

  /*
   * ------------------------------------------------------------
   * LOAD REVIEWS
   * ------------------------------------------------------------
   */

  async function loadReviews() {
    try {
      setReviewsLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      /*
       * Get all reviews for this product.
       */
      const { data: reviewData, error: reviewError } = await supabase
        .from("reviews")
        .select(
          "id, product_id, user_id, order_id, rating, review_text, created_at, updated_at"
        )
        .eq("product_id", id)
        .order("created_at", { ascending: false });

      if (reviewError) {
        throw reviewError;
      }

      const allReviews = reviewData || [];

      setReviews(allReviews);

      /*
       * If user is not logged in,
       * they cannot write a review.
       */
      if (!user) {
        setMyReview(null);
        setCanReview(false);
        setReviewOrderId(null);
        return;
      }

      /*
       * Find user's existing review.
       */
      const existingReview =
        allReviews.find((review) => review.user_id === user.id) || null;

      setMyReview(existingReview);

      /*
       * Find customer's orders.
       */
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (ordersError) {
        throw ordersError;
      }

      if (!orders || orders.length === 0) {
        setCanReview(false);
        setReviewOrderId(null);
        return;
      }

      const orderIds = orders.map((order) => order.id);

      /*
       * Find an order containing this product.
       */
      const { data: matchingItems, error: itemsError } = await supabase
        .from("order_items")
        .select("order_id")
        .eq("product_id", id)
        .in("order_id", orderIds)
        .limit(1);

      if (itemsError) {
        throw itemsError;
      }

      if (matchingItems && matchingItems.length > 0) {
        setCanReview(true);
        setReviewOrderId(matchingItems[0].order_id);
      } else {
        setCanReview(false);
        setReviewOrderId(null);
      }
    } catch (err) {
      console.error("Reviews loading error:", err);
    } finally {
      setReviewsLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      loadReviews();
    }
  }, [id]);

  /*
   * ------------------------------------------------------------
   * ADD TO CART
   * ------------------------------------------------------------
   */

  async function handleAddToCart() {
    try {
      setAddingToCart(true);
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
        const newQuantity = Number(existingItem.quantity) + 1;

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
      console.error("Add to cart error:", err);
      setError(err.message || "Unable to add product to cart.");
    } finally {
      setAddingToCart(false);
    }
  }

  /*
   * ------------------------------------------------------------
   * WISHLIST
   * ------------------------------------------------------------
   */

  async function handleWishlist() {
    try {
      setWishlistLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      if (isWishlisted) {
        const { error: deleteError } = await supabase
          .from("wishlist_items")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", product.id);

        if (deleteError) {
          throw deleteError;
        }

        setIsWishlisted(false);
      } else {
        const { error: insertError } = await supabase
          .from("wishlist_items")
          .insert({
            user_id: user.id,
            product_id: product.id,
          });

        if (insertError) {
          throw insertError;
        }

        setIsWishlisted(true);
      }
    } catch (err) {
      console.error("Wishlist error:", err);
      setError(err.message || "Unable to update wishlist.");
    } finally {
      setWishlistLoading(false);
    }
  }

  /*
   * ------------------------------------------------------------
   * SUBMIT / UPDATE REVIEW
   * ------------------------------------------------------------
   */

  async function handleSubmitReview(event) {
    event.preventDefault();

    try {
      setSubmittingReview(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      if (!canReview) {
        setError("You can review this product only after purchasing it.");
        return;
      }

      if (reviewRating < 1 || reviewRating > 5) {
        setError("Please select a rating between 1 and 5.");
        return;
      }

      if (!reviewText.trim()) {
        setError("Please write a review.");
        return;
      }

      /*
       * UPDATE existing review
       */
      if (editingReview && myReview) {
        const { error: updateError } = await supabase
          .from("reviews")
          .update({
            rating: Number(reviewRating),
            review_text: reviewText.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", myReview.id)
          .eq("user_id", user.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        /*
         * CREATE new review
         */
        const { error: insertError } = await supabase
          .from("reviews")
          .insert({
            product_id: product.id,
            user_id: user.id,
            order_id: reviewOrderId,
            rating: Number(reviewRating),
            review_text: reviewText.trim(),
          });

        if (insertError) {
          if (insertError.code === "23505") {
            setError("You have already reviewed this product.");
            return;
          }

          throw insertError;
        }
      }

      /*
       * Reload reviews.
       */
      await loadReviews();

      /*
       * Reload product because database trigger
       * updates rating and review_count.
       */
      const updatedProduct = await getProductById(id);
      setProduct(updatedProduct);

      /*
       * Reset form.
       */
      setReviewRating(5);
      setReviewText("");
      setEditingReview(false);
    } catch (err) {
      console.error("Review submission error:", err);
      setError(err.message || "Unable to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  }

  /*
   * ------------------------------------------------------------
   * EDIT REVIEW
   * ------------------------------------------------------------
   */

  function handleEditReview() {
    if (!myReview) return;

    setReviewRating(Number(myReview.rating));
    setReviewText(myReview.review_text || "");
    setEditingReview(true);

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  }

  /*
   * ------------------------------------------------------------
   * DELETE REVIEW
   * ------------------------------------------------------------
   */

  async function handleDeleteReview() {
    if (!myReview) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete your review?"
    );

    if (!confirmed) return;

    try {
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      const { error: deleteError } = await supabase
        .from("reviews")
        .delete()
        .eq("id", myReview.id)
        .eq("user_id", user.id);

      if (deleteError) {
        throw deleteError;
      }

      setMyReview(null);
      setEditingReview(false);
      setReviewRating(5);
      setReviewText("");

      await loadReviews();

      /*
       * Database trigger automatically updates
       * rating and review_count.
       */
      const updatedProduct = await getProductById(id);
      setProduct(updatedProduct);
    } catch (err) {
      console.error("Delete review error:", err);
      setError(err.message || "Unable to delete review.");
    }
  }

  /*
   * ------------------------------------------------------------
   * CANCEL EDIT
   * ------------------------------------------------------------
   */

  function handleCancelEdit() {
    setEditingReview(false);
    setReviewRating(5);
    setReviewText("");
  }

  /*
   * ------------------------------------------------------------
   * STAR COMPONENT
   * ------------------------------------------------------------
   */

  function Stars({ rating = 0, interactive = false }) {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : undefined}
            disabled={!interactive}
            onClick={() => {
              if (interactive) {
                setReviewRating(star);
              }
            }}
            className={
              interactive
                ? "transition hover:scale-110"
                : "cursor-default"
            }
            aria-label={interactive ? `Rate ${star} stars` : undefined}
          >
            <Star
              size={interactive ? 25 : 16}
              fill={star <= Number(rating) ? "currentColor" : "none"}
              className={
                star <= Number(rating)
                  ? "text-black"
                  : "text-black/20"
              }
            />
          </button>
        ))}
      </div>
    );
  }

  /*
   * ------------------------------------------------------------
   * LOADING
   * ------------------------------------------------------------
   */

  if (loading) {
    return (
      <main className="page-shell py-24 text-center">
        Loading product...
      </main>
    );
  }

  /*
   * ------------------------------------------------------------
   * PRODUCT NOT FOUND
   * ------------------------------------------------------------
   */

  if (error && !product) {
    return (
      <main className="page-shell py-24 text-center">
        <h1 className="text-2xl font-semibold">
          Product not found
        </h1>

        <Link
          to="/shop"
          className="mt-6 inline-block border-b border-black pb-1 text-sm"
        >
          Back to shop
        </Link>
      </main>
    );
  }

  if (!product) {
    return null;
  }

  const finalPrice = getFinalPrice(
    product.price,
    product.discount_percentage
  );

  const images = product.product_images || [];

  /*
   * ------------------------------------------------------------
   * PAGE
   * ------------------------------------------------------------
   */

  return (
    <main className="page-shell py-10 md:py-16">

      {/* Back */}
      <Link
        to="/shop"
        className="mb-10 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-black/50 transition hover:text-black"
      >
        <ArrowLeft size={14} />
        Back to shop
      </Link>

      {/* Error */}
      {error && (
        <div className="mb-8 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ====================================================== */}
      {/* PRODUCT */}
      {/* ====================================================== */}

      <div className="grid gap-10 lg:grid-cols-2">

        {/* Images */}
        <div className="grid grid-cols-2 gap-3">
          {images.length > 0 ? (
            images.map((image) => (
              <div
                key={image.id}
                className="aspect-[4/5] overflow-hidden bg-[#eeede9]"
              >
                <img
                  src={image.image_url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ))
          ) : (
            <div className="col-span-2 flex aspect-square items-center justify-center bg-[#eeede9] text-sm text-black/30">
              No product images
            </div>
          )}
        </div>

        {/* Details */}
        <div className="lg:sticky lg:top-10 lg:self-start">

          {/* Category */}
          <p className="text-[11px] uppercase tracking-[.15em] text-black/40">
            {product.categories?.name}
          </p>

          {/* Name */}
          <h1 className="mt-4 text-4xl font-semibold tracking-[-.05em] md:text-6xl">
            {product.name}
          </h1>

          {/* Brand */}
          {product.brand && (
            <p className="mt-3 text-sm text-black/45">
              {product.brand}
            </p>
          )}

          {/* Rating */}
          <div className="mt-5 flex items-center gap-3">
            <Stars rating={Number(product.rating || 0)} />

            <span className="text-sm font-semibold">
              {Number(product.rating || 0).toFixed(1)}
            </span>

            <span className="text-sm text-black/40">
              ({Number(product.review_count || 0)} reviews)
            </span>
          </div>

          {/* Price */}
          <div className="mt-8 flex flex-wrap items-center gap-3">

            <span className="text-2xl font-semibold">
              ₹{finalPrice.toFixed(2)}
            </span>

            {Number(product.discount_percentage) > 0 && (
              <>
                <span className="text-sm text-black/35 line-through">
                  ₹{Number(product.price).toFixed(2)}
                </span>

                <span className="text-xs font-semibold text-green-600">
                  {product.discount_percentage}% OFF
                </span>
              </>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="mt-8 max-w-xl text-[15px] leading-7 text-black/60">
              {product.description}
            </p>
          )}

          {/* Stock */}
          <div className="mt-8 border-y border-black/10 py-5">
            {Number(product.stock) > 0 ? (
              <p className="text-sm">
                <span className="font-semibold">
                  In stock
                </span>{" "}
                · {product.stock} available
              </p>
            ) : (
              <p className="text-sm font-semibold text-red-600">
                Out of stock
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-3">

            {/* Cart */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={
                Number(product.stock) <= 0 ||
                addingToCart
              }
              className="flex flex-1 items-center justify-center gap-2 bg-black px-6 py-4 text-sm font-semibold text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ShoppingBag size={17} />

              {addingToCart
                ? "Adding..."
                : "Add to Cart"}
            </button>

            {/* Wishlist */}
            <button
              type="button"
              onClick={handleWishlist}
              disabled={wishlistLoading}
              className={`grid h-14 w-14 place-items-center border transition ${
                isWishlisted
                  ? "border-black bg-black text-white"
                  : "border-black/15 hover:bg-black/5"
              } disabled:cursor-not-allowed disabled:opacity-50`}
              aria-label={
                isWishlisted
                  ? "Remove from wishlist"
                  : "Add to wishlist"
              }
            >
              <Heart
                size={18}
                fill={
                  isWishlisted
                    ? "currentColor"
                    : "none"
                }
              />
            </button>
          </div>

          <p className="mt-4 text-[10px] uppercase tracking-wider text-black/35">
            Free shipping on orders above ₹999
          </p>
        </div>
      </div>

      {/* ====================================================== */}
      {/* REVIEWS */}
      {/* ====================================================== */}

      <section className="mt-20 border-t border-black/10 pt-12">

        {/* Header */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-black/40">
            Customer Reviews
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-[-.04em] md:text-4xl">
            Reviews & Ratings
          </h2>
        </div>

        {/* Rating Summary */}
        <div className="mt-8 border border-black/10 bg-white p-7">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

            <div>
              <p className="text-5xl font-semibold">
                {Number(product.rating || 0).toFixed(1)}
              </p>

              <div className="mt-2">
                <Stars
                  rating={Number(product.rating || 0)}
                />
              </div>
            </div>

            <div className="sm:border-l sm:border-black/10 sm:pl-6">
              <p className="text-sm text-black/50">
                Based on{" "}
                <span className="font-semibold text-black">
                  {Number(product.review_count || 0)}
                </span>{" "}
                customer reviews
              </p>
            </div>

          </div>
        </div>

        {/* ================================================== */}
        {/* WRITE / EDIT REVIEW */}
        {/* ================================================== */}

        <div className="mt-10">

          {editingReview || (!myReview && canReview) ? (
            <form
              onSubmit={handleSubmitReview}
              className="border border-black/10 bg-white p-7"
            >

              <div className="flex items-center justify-between">

                <h3 className="text-xl font-semibold">
                  {editingReview
                    ? "Edit Your Review"
                    : "Write a Review"}
                </h3>

                {editingReview && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="text-xs font-semibold uppercase tracking-wider text-black/50 hover:text-black"
                  >
                    Cancel
                  </button>
                )}

              </div>

              {/* Rating */}
              <div className="mt-7">

                <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
                  Your Rating
                </p>

                <div className="mt-3">
                  <Stars
                    rating={reviewRating}
                    interactive
                  />
                </div>

              </div>

              {/* Review text */}
              <div className="mt-7">

                <label
                  htmlFor="reviewText"
                  className="text-xs font-semibold uppercase tracking-wider text-black/40"
                >
                  Your Review
                </label>

                <textarea
                  id="reviewText"
                  value={reviewText}
                  onChange={(event) =>
                    setReviewText(event.target.value)
                  }
                  rows={5}
                  placeholder="Share your experience with this product..."
                  className="mt-3 w-full resize-none border border-black/15 bg-[#f7f6f2] p-4 text-sm outline-none transition focus:border-black"
                />

              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submittingReview}
                className="mt-5 w-full bg-black px-6 py-4 text-sm font-semibold text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submittingReview
                  ? "Saving..."
                  : editingReview
                    ? "Update Review"
                    : "Submit Review"}
              </button>

            </form>
          ) : myReview ? (

            /* ================================================= */
            /* MY REVIEW */
            /* ================================================= */

            <div className="border border-black/10 bg-white p-7">

              <div className="flex flex-col justify-between gap-5 sm:flex-row">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
                    Your Review
                  </p>

                  <div className="mt-3">
                    <Stars
                      rating={myReview.rating}
                    />
                  </div>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-black/60">
                    {myReview.review_text}
                  </p>

                </div>

                <div className="flex gap-2">

                  <button
                    type="button"
                    onClick={handleEditReview}
                    className="grid h-10 w-10 place-items-center border border-black/15 transition hover:bg-black hover:text-white"
                    title="Edit review"
                  >
                    <Pencil size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteReview}
                    className="grid h-10 w-10 place-items-center border border-black/15 transition hover:bg-black hover:text-white"
                    title="Delete review"
                  >
                    <Trash2 size={15} />
                  </button>

                </div>

              </div>

            </div>

          ) : (

            /* ================================================= */
            /* NOT ELIGIBLE */
            /* ================================================= */

            <div className="border border-black/10 bg-white p-7">

              <h3 className="text-xl font-semibold">
                Have you purchased this product?
              </h3>

              <p className="mt-3 text-sm leading-6 text-black/50">
                Only customers who purchased this product
                can leave a review.
              </p>

              <Link
                to="/shop"
                className="mt-6 inline-block bg-black px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-black/80"
              >
                Continue Shopping
              </Link>

            </div>
          )}

        </div>

        {/* ================================================== */}
        {/* ALL REVIEWS */}
        {/* ================================================== */}

        <div className="mt-16">

          <div className="flex items-end justify-between border-b border-black/10 pb-5">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
                Customer Feedback
              </p>

              <h3 className="mt-2 text-2xl font-semibold">
                All Reviews
              </h3>
            </div>

            <span className="text-sm text-black/40">
              {reviews.length} total
            </span>

          </div>

          {reviewsLoading ? (

            <div className="py-10 text-sm text-black/40">
              Loading reviews...
            </div>

          ) : reviews.length === 0 ? (

            <div className="py-12 text-center">

              <Star
                size={30}
                className="mx-auto text-black/20"
              />

              <p className="mt-4 text-sm text-black/40">
                No reviews yet.
              </p>

              <p className="mt-1 text-xs text-black/30">
                Be the first customer to review this product.
              </p>

            </div>

          ) : (

            <div className="divide-y divide-black/10">

              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="py-7"
                >

                  <div className="flex flex-col justify-between gap-3 sm:flex-row">

                    <div>

                      <Stars
                        rating={review.rating}
                      />

                      <p className="mt-3 text-sm font-semibold">
                        Verified Customer
                      </p>

                    </div>

                    <p className="text-xs text-black/35">
                      {new Date(
                        review.created_at
                      ).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>

                  </div>

                  {review.review_text && (
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-black/60">
                      {review.review_text}
                    </p>
                  )}

                </article>
              ))}

            </div>
          )}

        </div>
      </section>
      <AIProductRecommendations product={product} />
      <AIReviewSummary
        product={product}
        reviews={reviews}
      />
    </main>
  );
}