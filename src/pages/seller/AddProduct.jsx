import { useEffect, useState } from "react";
import { ArrowLeft, ImagePlus, Loader2, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { supabase } from "../../lib/supabase";
import { getCategories } from "../../services/productService";
import SellerAIDescriptionGenerator from "../../components/SellerAIDescriptionGenerator";

export default function AddProduct() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    brand: "",
    category_id: "",
    price: "",
    discount_percentage: "0",
    stock: "",
  });

  const [images, setImages] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load categories.");
      } finally {
        setLoadingCategories(false);
      }
    }

    loadCategories();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleAIResult(result) {
    setForm((previous) => ({
      ...previous,
      name: result?.title || previous.name,
      description: result?.description || previous.description,
    }));
  }

  function handleImageChange(event) {
    const selectedFiles = Array.from(event.target.files || []);

    if (!selectedFiles.length) return;

    const validFiles = selectedFiles.filter((file) => {
      if (!file.type.startsWith("image/")) {
        return false;
      }

      if (file.size > 10 * 1024 * 1024) {
        return false;
      }

      return true;
    });

    const newImages = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((previous) => [...previous, ...newImages]);

    event.target.value = "";
  }

  function removeImage(index) {
    setImages((previous) => {
      const imageToRemove = previous[index];

      if (imageToRemove?.preview) {
        URL.revokeObjectURL(imageToRemove.preview);
      }

      return previous.filter((_, imageIndex) => imageIndex !== index);
    });
  }

  async function uploadImage(file, productId) {
    const fileExtension =
      file.name.split(".").pop()?.toLowerCase() || "jpg";

    const fileName = `${crypto.randomUUID()}.${fileExtension}`;

    const filePath = `${productId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (!form.category_id) {
      setError("Please select a category.");
      return;
    }

    if (!form.price || Number(form.price) <= 0) {
      setError("Please enter a valid price.");
      return;
    }

    if (form.stock === "" || Number(form.stock) < 0) {
      setError("Please enter valid stock.");
      return;
    }

    if (
      Number(form.discount_percentage) < 0 ||
      Number(form.discount_percentage) > 100
    ) {
      setError("Discount must be between 0 and 100.");
      return;
    }

    try {
      setSaving(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("You must be logged in to add a product.");
      }

      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          seller_id: user.id,
          category_id: form.category_id,
          name: form.name.trim(),
          description: form.description.trim(),
          brand: form.brand.trim(),
          price: Number(form.price),
          discount_percentage: Number(form.discount_percentage),
          stock: Number(form.stock),
          is_active: true,
        })
        .select()
        .single();

      if (productError) {
        throw productError;
      }

      for (const image of images) {
        const imageUrl = await uploadImage(image.file, product.id);

        const { error: imageDatabaseError } = await supabase
          .from("product_images")
          .insert({
            product_id: product.id,
            image_url: imageUrl,
          });

        if (imageDatabaseError) {
          throw imageDatabaseError;
        }
      }

      setSuccess("Product added successfully!");

      images.forEach((image) => {
        if (image.preview) {
          URL.revokeObjectURL(image.preview);
        }
      });

      setForm({
        name: "",
        description: "",
        brand: "",
        category_id: "",
        price: "",
        discount_percentage: "0",
        stock: "",
      });

      setImages([]);

      setTimeout(() => {
        navigate("/seller");
      }, 1200);
    } catch (err) {
      console.error("Add product error:", err);

      setError(
        err?.message ||
          "Something went wrong while adding the product."
      );
    } finally {
      setSaving(false);
    }
  }

  const selectedCategory =
    categories.find(
      (category) => category.id === form.category_id
    )?.name || "";

  return (
    <main className="min-h-screen bg-[#f7f6f2]">
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-14">
        <Link
          to="/seller"
          className="mb-8 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.12em] text-black/50 hover:text-black"
        >
          <ArrowLeft size={14} />
          Seller Dashboard
        </Link>

        <div className="border-b border-black/15 pb-8">
          <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-black/40">
            Seller
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-.05em] md:text-6xl">
            Add Product
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-black/55">
            Add a product to E-SHOP. The product will automatically be linked
            to your logged-in seller account.
          </p>
        </div>

        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-10">
          {/* Product Details */}
          <section className="border-t border-black/15 pt-8">
            <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-black/40">
              01 — Product details
            </p>

            <div className="mt-7 grid gap-6 md:grid-cols-2">
              {/* Name */}
              <div className="md:col-span-2">
                <label className="text-xs font-semibold">
                  Product Name *
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Example: Minimal Wireless Headphones"
                  className="mt-2 w-full border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-black"
                />
              </div>

              {/* Brand */}
              <div>
                <label className="text-xs font-semibold">
                  Brand
                </label>

                <input
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  placeholder="Example: E-SHOP Audio"
                  className="mt-2 w-full border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-black"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-semibold">
                  Category *
                </label>

                <select
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  disabled={loadingCategories}
                  className="mt-2 w-full border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-black"
                >
                  <option value="">
                    {loadingCategories
                      ? "Loading categories..."
                      : "Select category"}
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

              {/* AI Generator */}
              <div className="md:col-span-2">
                <SellerAIDescriptionGenerator
                  productName={form.name}
                  brand={form.brand}
                  category={selectedCategory}
                  onGenerated={handleAIResult}
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="text-xs font-semibold">
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Describe the product..."
                  className="mt-2 w-full resize-none border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-black"
                />
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="mt-12 border-t border-black/15 pt-8">
            <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-black/40">
              02 — Pricing & stock
            </p>

            <div className="mt-7 grid gap-6 sm:grid-cols-3">
              <div>
                <label className="text-xs font-semibold">
                  Price (₹) *
                </label>

                <input
                  type="number"
                  name="price"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="2999"
                  className="mt-2 w-full border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-xs font-semibold">
                  Discount (%)
                </label>

                <input
                  type="number"
                  name="discount_percentage"
                  min="0"
                  max="100"
                  step="1"
                  value={form.discount_percentage}
                  onChange={handleChange}
                  placeholder="10"
                  className="mt-2 w-full border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-xs font-semibold">
                  Stock *
                </label>

                <input
                  type="number"
                  name="stock"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={handleChange}
                  placeholder="25"
                  className="mt-2 w-full border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-black"
                />
              </div>
            </div>
          </section>

          {/* Images */}
          <section className="mt-12 border-t border-black/15 pt-8">
            <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-black/40">
              03 — Product images
            </p>

            <p className="mt-2 text-sm text-black/50">
              Select one or more images from your computer.
            </p>

            <label className="mt-6 flex min-h-40 cursor-pointer flex-col items-center justify-center border border-dashed border-black/25 bg-white px-6 text-center transition hover:border-black">
              <ImagePlus size={28} strokeWidth={1.3} />

              <span className="mt-4 text-sm font-medium">
                Choose images from computer
              </span>

              <span className="mt-1 text-xs text-black/40">
                JPG, PNG, WEBP — maximum 10 MB each
              </span>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
            </label>

            {images.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {images.map((image, index) => (
                  <div
                    key={`${image.file.name}-${index}`}
                    className="group relative aspect-square overflow-hidden bg-[#eeede9]"
                  >
                    <img
                      src={image.preview}
                      alt={`Product preview ${index + 1}`}
                      className="h-full w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute right-2 top-2 grid h-8 w-8 place-items-center bg-black text-white opacity-90"
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <X size={15} />
                    </button>

                    {index === 0 && (
                      <span className="absolute bottom-2 left-2 bg-white px-2 py-1 text-[9px] font-bold uppercase tracking-wider">
                        Main image
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Submit */}
          <section className="mt-12 border-t border-black/15 pt-8">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-w-48 items-center justify-center gap-2 bg-black px-7 py-4 text-xs font-semibold uppercase tracking-[.12em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                  Adding Product...
                </>
              ) : (
                "Add Product"
              )}
            </button>
          </section>
        </form>
      </div>
    </main>
  );
}