import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Save,
} from "lucide-react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import { supabase } from "../../lib/supabase";

export default function AdminEditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    name: "",
    brand: "",
    category_id: "",
    description: "",
    price: "",
    discount_percentage: "",
    stock: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
   * ------------------------------------------------------------
   * LOAD PRODUCT + CATEGORIES
   * ------------------------------------------------------------
   */

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        /*
         * Load product
         */
        const {
          data: productData,
          error: productError,
        } = await supabase
          .from("products")
          .select(`
            id,
            name,
            brand,
            category_id,
            description,
            price,
            discount_percentage,
            stock
          `)
          .eq("id", id)
          .single();

        if (productError) {
          throw productError;
        }

        /*
         * Load categories
         */
        const {
          data: categoryData,
          error: categoryError,
        } = await supabase
          .from("categories")
          .select("id, name, slug")
          .order("name");

        if (categoryError) {
          throw categoryError;
        }

        setProduct(productData);
        setCategories(categoryData || []);

        setForm({
          name: productData.name || "",
          brand: productData.brand || "",
          category_id: productData.category_id || "",
          description: productData.description || "",
          price: productData.price ?? "",
          discount_percentage:
            productData.discount_percentage ?? "",
          stock: productData.stock ?? "",
        });
      } catch (err) {
        console.error("Admin edit product error:", err);
        setError(
          err.message || "Unable to load product."
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadData();
    }
  }, [id]);

  /*
   * ------------------------------------------------------------
   * HANDLE INPUT
   * ------------------------------------------------------------
   */

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setSuccess("");
    setError("");
  }

  /*
   * ------------------------------------------------------------
   * SAVE PRODUCT
   * ------------------------------------------------------------
   */

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      /*
       * Basic validation
       */
      if (!form.name.trim()) {
        setError("Product name is required.");
        return;
      }

      if (!form.category_id) {
        setError("Please select a category.");
        return;
      }

      const price = Number(form.price);
      const discount = Number(
        form.discount_percentage || 0
      );
      const stock = Number(form.stock);

      if (!Number.isFinite(price) || price <= 0) {
        setError("Please enter a valid price.");
        return;
      }

      if (
        !Number.isFinite(discount) ||
        discount < 0 ||
        discount > 100
      ) {
        setError(
          "Discount must be between 0 and 100."
        );
        return;
      }

      if (!Number.isInteger(stock) || stock < 0) {
        setError(
          "Stock must be a whole number greater than or equal to 0."
        );
        return;
      }

      /*
       * Update product
       */
      const { error: updateError } = await supabase
        .from("products")
        .update({
          name: form.name.trim(),
          brand: form.brand.trim() || null,
          category_id: form.category_id,
          description:
            form.description.trim() || null,
          price,
          discount_percentage: discount,
          stock,
        })
        .eq("id", id);

      if (updateError) {
        throw updateError;
      }

      setSuccess(
        "Product updated successfully."
      );

      /*
       * Update local state.
       */
      setProduct((current) => ({
        ...current,
        name: form.name.trim(),
        brand: form.brand.trim() || null,
        category_id: form.category_id,
        description:
          form.description.trim() || null,
        price,
        discount_percentage: discount,
        stock,
      }));

      /*
       * Scroll to top so the success message is visible.
       */
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error("Update product error:", err);
      setError(
        err.message || "Unable to update product."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ------------------------------------------------------------
   * LOADING
   * ------------------------------------------------------------
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f6f2]">
        <div className="mx-auto max-w-4xl px-4 py-16 md:px-8">
          <p className="text-sm text-black/40">
            Loading product...
          </p>
        </div>
      </main>
    );
  }

  /*
   * ------------------------------------------------------------
   * PRODUCT NOT FOUND
   * ------------------------------------------------------------
   */

  if (!product) {
    return (
      <main className="min-h-screen bg-[#f7f6f2]">
        <div className="mx-auto max-w-4xl px-4 py-16 md:px-8">

          <h1 className="text-3xl font-semibold">
            Product not found
          </h1>

          <Link
            to="/admin/products"
            className="mt-6 inline-flex items-center gap-2 border border-black/20 px-5 py-3 text-xs font-semibold uppercase tracking-wider"
          >
            <ArrowLeft size={14} />
            Back to Products
          </Link>

        </div>
      </main>
    );
  }

  /*
   * ------------------------------------------------------------
   * PAGE
   * ------------------------------------------------------------
   */

  return (
    <main className="min-h-screen bg-[#f7f6f2]">
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-8 md:py-14">

        {/* HEADER */}
        <div className="border-b border-black/15 pb-8">

          <Link
            to="/admin/products"
            className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-black/40 transition hover:text-black"
          >
            <ArrowLeft size={14} />
            Back to Products
          </Link>

          <p className="mt-8 text-[10px] font-semibold uppercase tracking-[.15em] text-black/40">
            E-SHOP Administration
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-.05em] md:text-6xl">
            Edit Product
          </h1>

          <p className="mt-3 text-sm text-black/50">
            Update product information and inventory.
          </p>
        </div>

        {/* SUCCESS */}
        {success && (
          <div className="mt-8 border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="mt-8 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="mt-10 border border-black/10 bg-white p-6 md:p-8"
        >

          {/* PRODUCT NAME */}
          <div>
            <label
              htmlFor="name"
              className="text-xs font-semibold uppercase tracking-wider text-black/40"
            >
              Product Name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter product name"
              className="mt-3 w-full border border-black/15 bg-[#f7f6f2] px-4 py-3 text-sm outline-none transition focus:border-black"
            />
          </div>

          {/* BRAND */}
          <div className="mt-7">
            <label
              htmlFor="brand"
              className="text-xs font-semibold uppercase tracking-wider text-black/40"
            >
              Brand
            </label>

            <input
              id="brand"
              name="brand"
              type="text"
              value={form.brand}
              onChange={handleChange}
              placeholder="Enter brand"
              className="mt-3 w-full border border-black/15 bg-[#f7f6f2] px-4 py-3 text-sm outline-none transition focus:border-black"
            />
          </div>

          {/* CATEGORY */}
          <div className="mt-7">
            <label
              htmlFor="category_id"
              className="text-xs font-semibold uppercase tracking-wider text-black/40"
            >
              Category
            </label>

            <select
              id="category_id"
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              className="mt-3 w-full border border-black/15 bg-[#f7f6f2] px-4 py-3 text-sm outline-none transition focus:border-black"
            >
              <option value="">
                Select category
              </option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* DESCRIPTION */}
          <div className="mt-7">
            <label
              htmlFor="description"
              className="text-xs font-semibold uppercase tracking-wider text-black/40"
            >
              Description
            </label>

            <textarea
              id="description"
              name="description"
              rows={6}
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the product..."
              className="mt-3 w-full resize-none border border-black/15 bg-[#f7f6f2] px-4 py-3 text-sm outline-none transition focus:border-black"
            />
          </div>

          {/* PRICE + DISCOUNT */}
          <div className="mt-7 grid gap-7 md:grid-cols-2">

            <div>
              <label
                htmlFor="price"
                className="text-xs font-semibold uppercase tracking-wider text-black/40"
              >
                Price (₹)
              </label>

              <input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                placeholder="0.00"
                className="mt-3 w-full border border-black/15 bg-[#f7f6f2] px-4 py-3 text-sm outline-none transition focus:border-black"
              />
            </div>

            <div>
              <label
                htmlFor="discount_percentage"
                className="text-xs font-semibold uppercase tracking-wider text-black/40"
              >
                Discount (%)
              </label>

              <input
                id="discount_percentage"
                name="discount_percentage"
                type="number"
                min="0"
                max="100"
                step="1"
                value={form.discount_percentage}
                onChange={handleChange}
                placeholder="0"
                className="mt-3 w-full border border-black/15 bg-[#f7f6f2] px-4 py-3 text-sm outline-none transition focus:border-black"
              />
            </div>

          </div>

          {/* STOCK */}
          <div className="mt-7">

            <label
              htmlFor="stock"
              className="text-xs font-semibold uppercase tracking-wider text-black/40"
            >
              Stock
            </label>

            <input
              id="stock"
              name="stock"
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={handleChange}
              placeholder="0"
              className="mt-3 w-full border border-black/15 bg-[#f7f6f2] px-4 py-3 text-sm outline-none transition focus:border-black"
            />

          </div>

          {/* ACTIONS */}
          <div className="mt-10 flex flex-col gap-3 border-t border-black/10 pt-7 sm:flex-row">

            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 bg-black px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={15} />

              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>

            <Link
              to="/admin/products"
              className="flex items-center justify-center border border-black/20 px-6 py-4 text-xs font-semibold uppercase tracking-wider transition hover:bg-black hover:text-white"
            >
              Cancel
            </Link>

          </div>

        </form>

      </div>
    </main>
  );
}