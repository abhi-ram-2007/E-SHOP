import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { getCategories } from "../../services/productService";
import { useAuth } from "../../context/AuthContext";

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    brand: "",
    category_id: "",
    price: "",
    discount_percentage: "",
    stock: "",
    is_active: true,
  });

  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    loadProduct();
    loadCategories();
  }, [id]);

  async function loadCategories() {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load categories.");
    }
  }

  async function loadProduct() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in.");
        return;
      }

      const { data, error: productError } = await supabase
        .from("products")
        .select(`
          id,
          seller_id,
          name,
          description,
          brand,
          category_id,
          price,
          discount_percentage,
          stock,
          is_active,
          product_images (
            id,
            image_url
          )
        `)
        .eq("id", id)
        .eq("seller_id", user.id)
        .single();

      if (productError) {
        console.error(productError);
        setError("Product not found or you do not have permission to edit it.");
        return;
      }

      setForm({
        name: data.name || "",
        description: data.description || "",
        brand: data.brand || "",
        category_id: data.category_id || "",
        price: data.price ?? "",
        discount_percentage: data.discount_percentage ?? "",
        stock: data.stock ?? "",
        is_active: data.is_active ?? true,
      });

      setExistingImages(data.product_images || []);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while loading the product.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleImageChange(event) {
    const files = Array.from(event.target.files || []);

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        return false;
      }

      if (file.size > 10 * 1024 * 1024) {
        return false;
      }

      return true;
    });

    setNewImages(validFiles);

    const previewUrls = validFiles.map((file) => URL.createObjectURL(file));
    setPreviews(previewUrls);
  }

  function removeNewImage(index) {
    setNewImages((current) => current.filter((_, i) => i !== index));

    setPreviews((current) => {
      const updated = [...current];

      URL.revokeObjectURL(updated[index]);

      updated.splice(index, 1);

      return updated;
    });
  }

  async function deleteExistingImage(image) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this image?"
    );

    if (!confirmed) return;

    try {
      setError("");

      const imageUrl = image.image_url;

      const marker = "/product-images/";

      const markerIndex = imageUrl.indexOf(marker);

      if (markerIndex !== -1) {
        const storagePath = imageUrl.substring(
          markerIndex + marker.length
        );

        await supabase.storage
          .from("product-images")
          .remove([storagePath]);
      }

      const { error: deleteError } = await supabase
        .from("product_images")
        .delete()
        .eq("id", image.id);

      if (deleteError) {
        throw deleteError;
      }

      setExistingImages((current) =>
        current.filter((item) => item.id !== image.id)
      );
    } catch (err) {
      console.error(err);
      setError("Unable to delete the image.");
    }
  }

  async function uploadNewImages(productId) {
    const uploadedImages = [];

    for (const file of newImages) {
      const extension =
        file.name.split(".").pop()?.toLowerCase() || "jpg";

      const fileName = `${crypto.randomUUID()}.${extension}`;
      const filePath = `${productId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      uploadedImages.push({
        product_id: productId,
        image_url: publicUrl,
      });
    }

    if (uploadedImages.length > 0) {
      const { error: insertError } = await supabase
        .from("product_images")
        .insert(uploadedImages);

      if (insertError) {
        throw insertError;
      }
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in.");
        return;
      }

      if (!form.name.trim()) {
        setError("Product name is required.");
        return;
      }

      if (!form.category_id) {
        setError("Please select a category.");
        return;
      }

      if (Number(form.price) < 0) {
        setError("Price cannot be negative.");
        return;
      }

      if (Number(form.discount_percentage) < 0 || Number(form.discount_percentage) > 100) {
        setError("Discount must be between 0 and 100.");
        return;
      }

      if (Number(form.stock) < 0) {
        setError("Stock cannot be negative.");
        return;
      }

      const { error: updateError } = await supabase
        .from("products")
        .update({
          name: form.name.trim(),
          description: form.description.trim(),
          brand: form.brand.trim(),
          category_id: form.category_id,
          price: Number(form.price),
          discount_percentage: Number(form.discount_percentage || 0),
          stock: Number(form.stock),
          is_active: form.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("seller_id", user.id);

      if (updateError) {
        throw updateError;
      }

      if (newImages.length > 0) {
        await uploadNewImages(id);
      }

      setSuccess("Product updated successfully.");

      setTimeout(() => {
        navigate("/seller/products");
      }, 1000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to update product.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f6f2]">
        <div className="mx-auto max-w-5xl px-4 py-16 md:px-8">
          <p className="text-sm text-black/50">
            Loading product...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f6f2]">
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-14">

        {/* Header */}
        <div className="border-b border-black/15 pb-8">
          <Link
            to="/seller/products"
            className="mb-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-black/50 transition hover:text-black"
          >
            <ArrowLeft size={16} />
            Back to My Products
          </Link>

          <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-black/40">
            E-SHOP Seller
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-.05em] md:text-5xl">
            Edit Product
          </h1>

          <p className="mt-3 text-sm text-black/50">
            Update your product information, pricing, stock and images.
          </p>
        </div>

        {/* Messages */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-10 space-y-8">

          {/* Basic Information */}
          <section className="border border-black/15 bg-white p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
              Basic Information
            </p>

            <div className="mt-6 grid gap-6 md:grid-cols-2">

              <div className="md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wider">
                  Product Name
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  className="mt-2 w-full border border-black/15 px-4 py-3 text-sm outline-none transition focus:border-black"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider">
                  Brand
                </label>

                <input
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  placeholder="Brand name"
                  className="mt-2 w-full border border-black/15 px-4 py-3 text-sm outline-none transition focus:border-black"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider">
                  Category
                </label>

                <select
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  className="mt-2 w-full border border-black/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
                >
                  <option value="">Select category</option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wider">
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Describe your product"
                  className="mt-2 w-full resize-none border border-black/15 px-4 py-3 text-sm outline-none transition focus:border-black"
                />
              </div>
            </div>
          </section>

          {/* Pricing & Stock */}
          <section className="border border-black/15 bg-white p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
              Pricing & Stock
            </p>

            <div className="mt-6 grid gap-6 md:grid-cols-3">

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider">
                  Price (₹)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  className="mt-2 w-full border border-black/15 px-4 py-3 text-sm outline-none transition focus:border-black"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider">
                  Discount (%)
                </label>

                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  name="discount_percentage"
                  value={form.discount_percentage}
                  onChange={handleChange}
                  className="mt-2 w-full border border-black/15 px-4 py-3 text-sm outline-none transition focus:border-black"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider">
                  Stock
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  className="mt-2 w-full border border-black/15 px-4 py-3 text-sm outline-none transition focus:border-black"
                />
              </div>
            </div>

            {/* Active Status */}
            <label className="mt-6 flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
                className="h-4 w-4"
              />

              <span className="text-sm">
                Product is active and visible in the shop
              </span>
            </label>
          </section>

          {/* Existing Images */}
          <section className="border border-black/15 bg-white p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
              Current Images
            </p>

            {existingImages.length === 0 ? (
              <p className="mt-5 text-sm text-black/40">
                No product images.
              </p>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {existingImages.map((image) => (
                  <div
                    key={image.id}
                    className="group relative aspect-square overflow-hidden border border-black/10 bg-[#f7f6f2]"
                  >
                    <img
                      src={image.image_url}
                      alt={form.name}
                      className="h-full w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => deleteExistingImage(image)}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center bg-black text-white opacity-90 transition hover:bg-red-600"
                      title="Delete image"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Add New Images */}
          <section className="border border-black/15 bg-white p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
              Add New Images
            </p>

            <label className="mt-6 flex cursor-pointer flex-col items-center justify-center border border-dashed border-black/20 px-6 py-12 text-center transition hover:border-black hover:bg-black/[.02]">
              <Upload size={24} />

              <span className="mt-3 text-sm font-semibold">
                Choose images from your computer
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

            {previews.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {previews.map((preview, index) => (
                  <div
                    key={preview}
                    className="relative aspect-square overflow-hidden border border-black/10"
                  >
                    <img
                      src={preview}
                      alt={`New product ${index + 1}`}
                      className="h-full w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center bg-black text-white transition hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Submit */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              to="/seller/products"
              className="border border-black/20 px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider transition hover:bg-black hover:text-white"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="bg-black px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}