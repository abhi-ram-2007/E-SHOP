import { useEffect, useState } from "react";

import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  Save,
  Trash2,
  X,
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

  // Existing images already stored in Supabase
  const [existingImages, setExistingImages] = useState([]);

  // New images selected from computer
  const [newImages, setNewImages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [deletingImageId, setDeletingImageId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
   * ------------------------------------------------------------
   * LOAD PRODUCT + CATEGORIES + IMAGES
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
            stock,
            product_images (
              id,
              image_url
            )
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

        setExistingImages(
          productData.product_images || []
        );

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
        console.error(
          "Admin edit product error:",
          err
        );

        setError(
          err.message ||
            "Unable to load product."
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
   * HANDLE NEW IMAGE SELECTION
   * ------------------------------------------------------------
   */

  function handleImageChange(event) {
    const selectedFiles = Array.from(
      event.target.files || []
    );

    if (!selectedFiles.length) {
      return;
    }

    const validFiles = [];
    const invalidFiles = [];

    selectedFiles.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        invalidFiles.push(
          `${file.name}: not an image`
        );
        return;
      }

      // Maximum 10 MB per image
      if (file.size > 10 * 1024 * 1024) {
        invalidFiles.push(
          `${file.name}: larger than 10 MB`
        );
        return;
      }

      validFiles.push(file);
    });

    if (invalidFiles.length > 0) {
      setError(
        `Some images were skipped. ${invalidFiles.join(
          ", "
        )}`
      );
    }

    const imageObjects = validFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
    }));

    setNewImages((current) => [
      ...current,
      ...imageObjects,
    ]);

    // Allows selecting the same file again
    event.target.value = "";
  }

  /*
   * ------------------------------------------------------------
   * REMOVE NEW IMAGE BEFORE UPLOAD
   * ------------------------------------------------------------
   */

  function removeNewImage(imageId) {
    setNewImages((current) => {
      const imageToRemove = current.find(
        (image) => image.id === imageId
      );

      if (imageToRemove?.preview) {
        URL.revokeObjectURL(
          imageToRemove.preview
        );
      }

      return current.filter(
        (image) => image.id !== imageId
      );
    });

    setSuccess("");
  }

  /*
   * ------------------------------------------------------------
   * GET STORAGE PATH FROM IMAGE URL
   * ------------------------------------------------------------
   */

  function getStoragePath(imageUrl) {
    if (!imageUrl) {
      return null;
    }

    try {
      const marker =
        "/storage/v1/object/public/product-images/";

      const markerIndex =
        imageUrl.indexOf(marker);

      if (markerIndex !== -1) {
        return decodeURIComponent(
          imageUrl.substring(
            markerIndex + marker.length
          )
        );
      }

      /*
       * Fallback:
       * If the URL is already just a storage path.
       */
      if (
        !imageUrl.startsWith("http://") &&
        !imageUrl.startsWith("https://")
      ) {
        return imageUrl;
      }

      return null;
    } catch (err) {
      console.error(
        "Unable to determine storage path:",
        err
      );

      return null;
    }
  }

  /*
   * ------------------------------------------------------------
   * DELETE EXISTING IMAGE
   * ------------------------------------------------------------
   */

  async function handleDeleteExistingImage(
    image
  ) {
    if (!image?.id) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this product image?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingImageId(image.id);
      setError("");
      setSuccess("");

      /*
       * Get storage path
       */
      const storagePath = getStoragePath(
        image.image_url
      );

      /*
       * Delete image from Supabase Storage
       */
      if (storagePath) {
        const { error: storageError } =
          await supabase.storage
            .from("product-images")
            .remove([storagePath]);

        if (storageError) {
          throw storageError;
        }
      }

      /*
       * Delete image record from product_images
       */
      const { error: databaseError } =
        await supabase
          .from("product_images")
          .delete()
          .eq("id", image.id);

      if (databaseError) {
        throw databaseError;
      }

      /*
       * Remove from UI
       */
      setExistingImages((current) =>
        current.filter(
          (item) => item.id !== image.id
        )
      );

      setSuccess(
        "Product image deleted successfully."
      );
    } catch (err) {
      console.error(
        "Delete product image error:",
        err
      );

      setError(
        err.message ||
          "Unable to delete product image."
      );
    } finally {
      setDeletingImageId(null);
    }
  }

  /*
   * ------------------------------------------------------------
   * UPLOAD NEW IMAGE
   * ------------------------------------------------------------
   */

  async function uploadImage(file, productId) {
    const fileExtension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() || "jpg";

    const fileName = `${crypto.randomUUID()}.${fileExtension}`;

    /*
     * Same structure used by the seller product upload:
     *
     * productId/
     *   random-file-name.jpg
     */
    const filePath = `${productId}/${fileName}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from("product-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      throw uploadError;
    }

    /*
     * Get public URL
     */
    const {
      data: publicUrlData,
    } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    const imageUrl =
      publicUrlData?.publicUrl;

    if (!imageUrl) {
      throw new Error(
        "Unable to generate image URL."
      );
    }

    /*
     * Save image URL in product_images
     */
    const {
      data: imageRecord,
      error: insertError,
    } = await supabase
      .from("product_images")
      .insert({
        product_id: productId,
        image_url: imageUrl,
      })
      .select("id, image_url")
      .single();

    if (insertError) {
      /*
       * Try to remove uploaded file if DB insert fails.
       */
      await supabase.storage
        .from("product-images")
        .remove([filePath]);

      throw insertError;
    }

    return imageRecord;
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
        setError(
          "Product name is required."
        );
        return;
      }

      if (!form.category_id) {
        setError(
          "Please select a category."
        );
        return;
      }

      const price = Number(form.price);

      const discount = Number(
        form.discount_percentage || 0
      );

      const stock = Number(form.stock);

      if (
        !Number.isFinite(price) ||
        price <= 0
      ) {
        setError(
          "Please enter a valid price."
        );
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

      if (
        !Number.isInteger(stock) ||
        stock < 0
      ) {
        setError(
          "Stock must be a whole number greater than or equal to 0."
        );
        return;
      }

      /*
       * --------------------------------------------------------
       * UPDATE PRODUCT DETAILS
       * --------------------------------------------------------
       */

      const {
        error: updateError,
      } = await supabase
        .from("products")
        .update({
          name: form.name.trim(),
          brand:
            form.brand.trim() || null,
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

      /*
       * --------------------------------------------------------
       * UPLOAD NEW IMAGES
       * --------------------------------------------------------
       */

      const uploadedImages = [];

      for (const image of newImages) {
        const uploaded =
          await uploadImage(
            image.file,
            id
          );

        uploadedImages.push(uploaded);
      }

      /*
       * Add uploaded images to existing UI state
       */
      if (uploadedImages.length > 0) {
        setExistingImages(
          (current) => [
            ...current,
            ...uploadedImages,
          ]
        );
      }

      /*
       * Revoke local preview URLs
       */
      newImages.forEach((image) => {
        if (image.preview) {
          URL.revokeObjectURL(
            image.preview
          );
        }
      });

      setNewImages([]);

      /*
       * Update local product state
       */
      setProduct((current) => ({
        ...current,

        name: form.name.trim(),

        brand:
          form.brand.trim() || null,

        category_id:
          form.category_id,

        description:
          form.description.trim() ||
          null,

        price,

        discount_percentage:
          discount,

        stock,
      }));

      setSuccess(
        uploadedImages.length > 0
          ? `Product updated successfully. ${uploadedImages.length} new image${
              uploadedImages.length > 1
                ? "s"
                : ""
            } uploaded.`
          : "Product updated successfully."
      );

      /*
       * Scroll to top
       */
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error(
        "Update product error:",
        err
      );

      setError(
        err.message ||
          "Unable to update product."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ------------------------------------------------------------
   * CLEANUP LOCAL IMAGE PREVIEWS
   * ------------------------------------------------------------
   */

  useEffect(() => {
    return () => {
      newImages.forEach((image) => {
        if (image.preview) {
          URL.revokeObjectURL(
            image.preview
          );
        }
      });
    };
  }, [newImages]);

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
            Update product information,
            images and inventory.
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

              {categories.map(
                (category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                )
              )}
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
                value={
                  form.discount_percentage
                }
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

          {/* ================================================== */}
          {/* EXISTING PRODUCT IMAGES */}
          {/* ================================================== */}

          <div className="mt-10 border-t border-black/10 pt-8">

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
                  Product Images
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  Existing Images
                </h2>

                <p className="mt-1 text-xs text-black/45">
                  Delete images that you no
                  longer want to use.
                </p>
              </div>

              <ImagePlus
                size={22}
                className="text-black/40"
              />
            </div>

            {existingImages.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">

                {existingImages.map(
                  (image) => (
                    <div
                      key={image.id}
                      className="group relative overflow-hidden border border-black/10 bg-[#f7f6f2]"
                    >
                      <div className="aspect-square">
                        <img
                          src={image.image_url}
                          alt={
                            product.name
                          }
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteExistingImage(
                            image
                          )
                        }
                        disabled={
                          deletingImageId ===
                          image.id
                        }
                        className="absolute right-2 top-2 grid h-9 w-9 place-items-center bg-black text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Delete image"
                      >
                        {deletingImageId ===
                        image.id ? (
                          <Loader2
                            size={15}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2
                            size={15}
                          />
                        )}
                      </button>
                    </div>
                  )
                )}

              </div>
            ) : (
              <div className="mt-6 border border-dashed border-black/20 bg-[#f7f6f2] p-8 text-center">
                <ImagePlus
                  size={28}
                  className="mx-auto text-black/30"
                />

                <p className="mt-3 text-sm text-black/50">
                  No product images
                  available.
                </p>
              </div>
            )}
          </div>

          {/* ================================================== */}
          {/* ADD NEW IMAGES */}
          {/* ================================================== */}

          <div className="mt-10 border-t border-black/10 pt-8">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
                Add Images
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Upload New Images
              </h2>

              <p className="mt-1 text-xs text-black/45">
                JPG, PNG, WEBP or other image
                formats. Maximum 10 MB per
                image.
              </p>
            </div>

            <label
              htmlFor="product-images"
              className="mt-6 flex cursor-pointer flex-col items-center justify-center border border-dashed border-black/20 bg-[#f7f6f2] px-6 py-10 text-center transition hover:border-black hover:bg-black/[0.02]"
            >
              <ImagePlus
                size={28}
                className="text-black/50"
              />

              <span className="mt-3 text-sm font-semibold">
                Choose Images
              </span>

              <span className="mt-1 text-xs text-black/40">
                Select one or multiple images
              </span>

              <input
                id="product-images"
                type="file"
                accept="image/*"
                multiple
                onChange={
                  handleImageChange
                }
                className="hidden"
              />
            </label>

            {/* New image previews */}
            {newImages.length > 0 && (
              <div className="mt-6">

                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-black/40">
                  Images To Upload
                </p>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">

                  {newImages.map(
                    (image) => (
                      <div
                        key={image.id}
                        className="group relative overflow-hidden border border-black/10 bg-[#f7f6f2]"
                      >
                        <div className="aspect-square">
                          <img
                            src={
                              image.preview
                            }
                            alt={
                              image.file
                                .name
                            }
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeNewImage(
                              image.id
                            )
                          }
                          className="absolute right-2 top-2 grid h-9 w-9 place-items-center bg-black text-white transition hover:bg-red-600"
                          title="Remove selected image"
                        >
                          <X
                            size={15}
                          />
                        </button>

                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-2">
                          <p className="truncate text-[10px] text-white">
                            {
                              image.file
                                .name
                            }
                          </p>
                        </div>
                      </div>
                    )
                  )}

                </div>
              </div>
            )}
          </div>

          {/* ================================================== */}
          {/* ACTIONS */}
          {/* ================================================== */}

          <div className="mt-10 flex flex-col gap-3 border-t border-black/10 pt-7 sm:flex-row">

            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 bg-black px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <Save size={15} />
              )}

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