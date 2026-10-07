import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  getProducts,
  getFinalPrice,
} from "../services/productService.js";


/* =========================================================
   Product Card
========================================================= */

function ProductCard({ product }) {
  const image = product.product_images?.[0]?.image_url;

  const finalPrice = getFinalPrice(
    product.price,
    product.discount_percentage
  );

  return (
    <Link
      to={`/products/${product.id}`}
      className="group block"
    >
      {/* Product Image */}
      <div className="aspect-[4/5] overflow-hidden bg-[#eeede9]">
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[11px] uppercase tracking-[.15em] text-black/30">
            No image
          </div>
        )}
      </div>


      {/* Product Information */}
      <div className="pt-4">

        <div className="flex items-start justify-between gap-4">

          <div>
            <p className="text-[15px] font-medium">
              {product.name}
            </p>

            <p className="mt-1 text-[11px] text-black/45">
              {product.brand}
            </p>
          </div>

          <ArrowUpRight
            size={15}
            className="shrink-0 text-black/35 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
          />

        </div>


        {/* Price */}
        <div className="mt-3 flex items-center gap-2">

          <span className="text-[14px] font-semibold">
            ₹{finalPrice.toFixed(2)}
          </span>

          {Number(product.discount_percentage) > 0 && (
            <span className="text-[11px] text-black/35 line-through">
              ₹{Number(product.price).toFixed(2)}
            </span>
          )}

        </div>


        {/* Discount */}
        {Number(product.discount_percentage) > 0 && (
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider">
            {product.discount_percentage}% OFF
          </p>
        )}


        {/* Stock */}
        {product.stock <= 0 && (
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-red-600">
            Out of stock
          </p>
        )}

        {product.stock > 0 && product.stock <= 5 && (
          <p className="mt-2 text-[10px] text-black/40">
            Only {product.stock} left
          </p>
        )}

      </div>
    </Link>
  );
}


/* =========================================================
   Home Page
========================================================= */

export default function HomePage() {

  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  /* =======================================================
     Load Products
  ======================================================= */

  useEffect(() => {

    async function loadProducts() {

      try {

        setLoading(true);

        setError("");


        const data = await getProducts({
          categorySlug: null,
          search: null,
        });


        setProducts(data);

      } catch (err) {

        console.error(
          "Failed to load products:",
          err
        );

        setError(
          "Unable to load products. Please try again."
        );

      } finally {

        setLoading(false);

      }

    }


    loadProducts();

  }, []);


  return (

    <main>


      {/* =====================================================
          HERO SECTION
      ===================================================== */}

      <section
        className="page-shell pb-12 pt-7 md:pb-[76px] md:pt-10"
        data-testid="section-home-hero"
      >

        <div className="mb-5 flex items-center justify-between">

          <span className="eyebrow text-black/50">
            The everyday edit · No. 01
          </span>

          <span className="hidden items-center gap-2 text-[10px] uppercase tracking-[.12em] text-black/45 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-black" />
            A little less, a little better
          </span>

        </div>


        <div className="relative min-h-[520px] overflow-hidden bg-[#deddd9] md:min-h-[610px]">

          <img
            src="/editorial-hero.jpg"
            alt="A quiet, light-filled architectural space"
            className="hero-image absolute inset-0 h-full w-full object-cover object-[64%_center] md:object-center"
            data-testid="img-editorial-hero"
          />


          <div className="absolute inset-0 bg-gradient-to-r from-[#f5f4f0]/85 via-[#f5f4f0]/45 to-transparent md:from-[#f5f4f0]/90 md:via-[#f5f4f0]/35" />


          <div className="relative flex min-h-[520px] max-w-[640px] flex-col items-start justify-center px-6 py-14 md:min-h-[610px] md:px-[8.5%]">

            <p className="eyebrow reveal mb-6 text-black/60">
              Less browsing. Better finding.
            </p>


            <h1
              className="hero-title reveal delay-1 text-[clamp(3.5rem,9.5vw,8.8rem)] font-semibold"
              data-testid="heading-home-hero"
            >
              Good things,
              <br />
              chosen well.
            </h1>


            <p className="reveal delay-2 mt-6 max-w-[340px] text-[14px] leading-[1.7] text-black/70 md:text-[15px]">
              A thoughtful mix of things to wear, use and make home.
              Find something that feels like you.
            </p>


            <Link
              to="/shop"
              className="reveal delay-3 mt-8 inline-flex items-center gap-5 bg-[#171717] px-5 py-[15px] text-[11px] font-semibold uppercase tracking-[.12em] text-[#f7f6f2] transition-colors hover:bg-black/75"
              data-testid="link-hero-shop"
            >
              Explore the shop
              <ArrowUpRight size={15} />
            </Link>


            <div className="absolute bottom-6 left-6 flex items-center gap-2 text-[9px] uppercase tracking-[.16em] text-black/55 md:left-[8.5%]">
              <ArrowDown size={13} />
              Take a look around
            </div>

          </div>


          <div className="absolute bottom-5 right-5 hidden border border-black/20 px-3 py-2 text-[9px] uppercase tracking-[.14em] text-black/65 md:block">
            Independent by nature · Open to everyone
          </div>

        </div>

      </section>


      {/* =====================================================
          PRODUCTS SECTION
          REPLACES THE OLD CATEGORY SECTION
      ===================================================== */}

      <section
        className="border-y border-black/10 bg-[#f1f0ec] py-[62px] md:py-[88px]"
        data-testid="section-products"
      >

        <div className="page-shell">


          {/* Products Header */}

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">

            <div>

              <p className="eyebrow text-black/45">
                A place for the things you love
              </p>

              <h2 className="mt-4 max-w-[700px] text-[38px] font-semibold leading-[1.02] tracking-[-.065em] md:text-[66px]">
                Good things,
                <br className="hidden sm:block" />
                chosen for you.
              </h2>

            </div>


            <div className="max-w-[260px] pb-1">

              <p className="text-[13px] leading-[1.7] text-black/60">
                Explore our latest products across every category.
                Find something useful, beautiful and worth keeping.
              </p>

              <Link
                to="/shop"
                className="mt-5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.12em]"
              >
                View all products
                <ArrowUpRight size={14} />
              </Link>

            </div>

          </div>


          {/* Loading */}

          {loading && (

            <div className="mt-14 py-20 text-center">

              <p className="text-[12px] uppercase tracking-[.15em] text-black/40">
                Loading products...
              </p>

            </div>

          )}


          {/* Error */}

          {!loading && error && (

            <div className="mt-14 border border-red-200 bg-red-50 p-5 text-sm text-red-600">
              {error}
            </div>

          )}


          {/* Products */}

          {!loading &&
            !error &&
            products.length > 0 && (

              <div className="mt-12 md:mt-14">


                {/* Product Count */}

                <div className="mb-6 flex items-end justify-between">

                  <p className="eyebrow text-black/45">
                    Products
                  </p>

                  <p className="text-[11px] text-black/40">
                    {products.length}{" "}
                    {products.length === 1
                      ? "item"
                      : "items"}
                  </p>

                </div>


                {/* Product Grid */}

                <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                  {products.map((product) => (

                    <ProductCard
                      key={product.id}
                      product={product}
                    />

                  ))}

                </div>

              </div>

            )}


          {/* No Products */}

          {!loading &&
            !error &&
            products.length === 0 && (

              <div className="mt-14 border-y border-black/10 py-20 text-center">

                <p className="text-xl font-medium">
                  No products found
                </p>

                <p className="mt-2 text-sm text-black/45">
                  Products will appear here once they are added.
                </p>

                <Link
                  to="/shop"
                  className="mt-6 inline-flex items-center gap-2 border-b border-black pb-1 text-[11px] font-semibold uppercase tracking-wider"
                >
                  Explore the shop
                  <ArrowUpRight size={14} />
                </Link>

              </div>

            )}

        </div>

      </section>


      {/* =====================================================
          BRAND NOTE SECTION
      ===================================================== */}

      <section
        className="page-shell grid gap-8 py-[66px] md:grid-cols-[.7fr_1.3fr] md:gap-16 md:py-[108px]"
        data-testid="section-brand-note"
      >

        <div>

          <span className="eyebrow text-black/45">
            A note on finding
          </span>

          <div className="mt-8 flex items-center gap-3 text-[10px] uppercase tracking-[.14em] text-black/45">
            <span className="h-px w-9 bg-black/35" />
            E-SHOP / 001
          </div>

        </div>


        <div>

          <h2 className="max-w-[760px] text-[32px] font-medium leading-[1.13] tracking-[-.06em] md:text-[54px]">
            Shopping shouldn’t feel like searching for a needle in a very large haystack.
          </h2>


          <div className="mt-8 flex flex-col justify-between gap-5 border-t border-black/15 pt-5 sm:flex-row sm:items-center">

            <p className="max-w-[390px] text-[13px] leading-[1.8] text-black/55">
              So we’re making a place that feels clear, welcoming and easy to explore.
              A good first step is a good place to start.
            </p>


            <Link
              to="/shop"
              className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[.12em] transition-all hover:gap-5"
              data-testid="link-brand-explore"
            >
              Find your way in
              <ArrowRight size={15} />
            </Link>

          </div>

        </div>

      </section>


      {/* =====================================================
          BOTTOM SHOP SECTION
      ===================================================== */}

      <section className="page-shell pb-16 md:pb-24">

        <div className="flex items-center justify-between border-t border-black/15 pt-5">

          <span className="eyebrow text-black/45">
            A little curiosity goes a long way
          </span>

          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-[11px] font-semibold"
            data-testid="link-bottom-shop"
          >
            Keep exploring
            <ArrowUpRight size={14} />
          </Link>

        </div>

      </section>

    </main>
  );
}