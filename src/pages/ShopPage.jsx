import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Search,
} from "lucide-react";
import {
  Link,
  useParams,
  useSearchParams,
} from "react-router-dom";

import {
  categories,
  categoryDetails,
} from "../data/categories.js";

import {
  getProducts,
  getFinalPrice,
} from "../services/productService.js";


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


export default function ShopPage() {

  const { category } = useParams();

  const [searchParams] = useSearchParams();

  const searchTerm = searchParams.get("search");


  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  const detail = category
    ? categoryDetails[category]
    : null;


  const title =
    detail?.title ||
    (searchTerm ? "Search" : "Explore");


  useEffect(() => {

    async function loadProducts() {

      try {

        setLoading(true);

        setError("");


        const data = await getProducts({

          categorySlug: category || null,

          search: searchTerm || null,

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

  }, [category, searchTerm]);


  return (

    <main
      className="min-h-[65vh]"
      data-testid="page-shop"
    >

      <section className="page-shell pb-16 pt-9 md:pb-24 md:pt-14">


        {/* Back to Home */}

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.13em] text-black/50 transition-colors hover:text-black"
          data-testid="link-back-home"
        >

          <ArrowLeft size={13} />

          E-SHOP

        </Link>


        {/* Page Header */}

        <div className="mt-11 border-b border-black/15 pb-8 md:mt-16 md:pb-12">

          <p className="eyebrow text-black/45">

            {category
              ? "A place to begin"
              : searchTerm
              ? "Looking for something?"
              : "Find your corner"}

          </p>


          <h1
            className="mt-4 text-[clamp(3.3rem,10vw,8.8rem)] font-semibold leading-[.88] tracking-[-.085em]"
            data-testid="heading-shop-title"
          >

            {title}

          </h1>


          <p
            className="mt-6 max-w-[480px] text-[14px] leading-[1.75] text-black/60 md:text-[15px]"
            data-testid="text-shop-intro"
          >

            {searchTerm ? (
              <>
                Showing products matching{" "}

                <span className="font-medium text-black">
                  "{searchTerm}"
                </span>
              </>
            ) : (
              detail?.intro ||
              "Good things to wear, use and live with. Take a look around."
            )}

          </p>

        </div>


        {/* Search Information */}

        {searchTerm && (

          <div
            className="mt-8 flex items-center gap-3 bg-[#eeede9] p-4 text-[12px] leading-[1.6] text-black/60"
            data-testid="status-search-shell"
          >

            <Search size={15} />

            Search results for "{searchTerm}"

          </div>

        )}


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

            <div className="mt-14">

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
                Try another category or search term.
              </p>

              <Link
                to="/shop"
                className="mt-6 inline-flex items-center gap-2 border-b border-black pb-1 text-[11px] font-semibold uppercase tracking-wider"
              >

                View all products

                <ArrowUpRight size={14} />

              </Link>

            </div>

          )}


        {/* Categories */}

        <div className="mt-20">

          <p className="eyebrow mb-5 text-black/45">
            Explore categories
          </p>


          <div className="grid border-t border-black/15 sm:grid-cols-2 sm:gap-x-8">

            {categories.map((item, index) => (

              <Link
                key={item.slug}
                to={`/shop/${item.slug}`}
                className="group flex min-h-[83px] items-center justify-between gap-3 border-b border-black/15 py-5"
                data-testid={`shop-category-${item.slug}`}
              >

                <div className="flex items-center gap-5">

                  <span className="text-[10px] text-black/35">

                    {String(index + 1).padStart(2, "0")}

                  </span>


                  <div>

                    <p className="text-[18px] tracking-[-.035em] md:text-[21px]">

                      {item.name}

                    </p>

                    <p className="mt-1 text-[11px] text-black/45">

                      {item.note}

                    </p>

                  </div>

                </div>


                <ArrowUpRight
                  size={16}
                  className="text-black/40 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
                />

              </Link>

            ))}

          </div>

        </div>

      </section>

    </main>

  );
}