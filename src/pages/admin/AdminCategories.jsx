import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  FolderOpen,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

import { supabase } from "../../lib/supabase";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [editingCategory, setEditingCategory] =
    useState(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
   * ------------------------------------------------------------
   * LOAD CATEGORIES
   * ------------------------------------------------------------
   */

  async function loadCategories() {
    try {
      setLoading(true);
      setError("");

      const {
        data: categoryData,
        error: categoryError,
      } = await supabase
        .from("categories")
        .select(`
          id,
          name,
          slug,
          created_at
        `)
        .order("name", {
          ascending: true,
        });

      if (categoryError) {
        throw categoryError;
      }

      const categoryList = categoryData || [];

      /*
       * Get products so we can calculate
       * how many products belong to each category.
       */
      const {
        data: productData,
        error: productError,
      } = await supabase
        .from("products")
        .select(`
          id,
          category_id
        `);

      if (productError) {
        throw productError;
      }

      const products = productData || [];

      const categoriesWithCounts =
        categoryList.map((category) => ({
          ...category,
          productCount: products.filter(
            (product) =>
              product.category_id === category.id
          ).length,
        }));

      setCategories(categoriesWithCounts);
    } catch (err) {
      console.error(
        "Admin categories error:",
        err
      );

      setError(
        err.message ||
          "Unable to load categories."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  /*
   * ------------------------------------------------------------
   * FORM
   * ------------------------------------------------------------
   */

  function openAddForm() {
    setEditingCategory(null);

    setForm({
      name: "",
      slug: "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(category) {
    setEditingCategory(category);

    setForm({
      name: category.name || "",
      slug: category.slug || "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingCategory(null);

    setForm({
      name: "",
      slug: "",
    });
  }

  /*
   * Automatically create slug from category name.
   */
  function handleNameChange(value) {
    setForm((current) => ({
      ...current,
      name: value,
      slug: value
        .toLowerCase()
        .trim()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    }));
  }

  /*
   * ------------------------------------------------------------
   * SAVE
   * ------------------------------------------------------------
   */

  async function handleSubmit(event) {
    event.preventDefault();

    const name = form.name.trim();
    const slug = form.slug.trim();

    if (!name) {
      setError("Category name is required.");
      return;
    }

    if (!slug) {
      setError("Category slug is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingCategory) {
        /*
         * UPDATE
         */
        const {
          error: updateError,
        } = await supabase
          .from("categories")
          .update({
            name,
            slug,
          })
          .eq("id", editingCategory.id);

        if (updateError) {
          throw updateError;
        }

        setSuccess(
          "Category updated successfully."
        );
      } else {
        /*
         * INSERT
         */
        const {
          error: insertError,
        } = await supabase
          .from("categories")
          .insert({
            name,
            slug,
          });

        if (insertError) {
          throw insertError;
        }

        setSuccess(
          "Category created successfully."
        );
      }

      closeForm();

      await loadCategories();
    } catch (err) {
      console.error(
        "Save category error:",
        err
      );

      setError(
        err.message ||
          "Unable to save category."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ------------------------------------------------------------
   * DELETE
   * ------------------------------------------------------------
   */

  async function handleDelete(category) {
    if (category.productCount > 0) {
      window.alert(
        `Cannot delete "${category.name}" because it has ${category.productCount} product(s). Move or delete those products first.`
      );

      return;
    }

    const confirmed = window.confirm(
      `Delete the category "${category.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const {
        error: deleteError,
      } = await supabase
        .from("categories")
        .delete()
        .eq("id", category.id);

      if (deleteError) {
        throw deleteError;
      }

      setCategories((current) =>
        current.filter(
          (item) => item.id !== category.id
        )
      );

      setSuccess(
        "Category deleted successfully."
      );
    } catch (err) {
      console.error(
        "Delete category error:",
        err
      );

      setError(
        err.message ||
          "Unable to delete category."
      );
    }
  }

  /*
   * ------------------------------------------------------------
   * SEARCH
   * ------------------------------------------------------------
   */

  const filteredCategories =
    categories.filter((category) => {
      const searchText =
        search.toLowerCase().trim();

      if (!searchText) {
        return true;
      }

      return (
        category.name
          ?.toLowerCase()
          .includes(searchText) ||
        category.slug
          ?.toLowerCase()
          .includes(searchText)
      );
    });

  /*
   * ------------------------------------------------------------
   * LOADING
   * ------------------------------------------------------------
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f6f2]">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <p className="text-sm text-black/40">
            Loading categories...
          </p>
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
              Categories
            </h1>

            <p className="mt-3 text-sm text-black/50">
              Manage the product categories used
              throughout E-SHOP.
            </p>

          </div>

          <div className="flex gap-3">

            <button
              type="button"
              onClick={loadCategories}
              className="flex items-center gap-2 border border-black/20 px-5 py-3 text-xs font-semibold uppercase tracking-wider transition hover:bg-black hover:text-white"
            >
              <RefreshCw size={14} />
              Refresh
            </button>

            <button
              type="button"
              onClick={openAddForm}
              className="flex items-center gap-2 bg-black px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-black/80"
            >
              <Plus size={14} />
              Add Category
            </button>

          </div>

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

        {/* ADD / EDIT FORM */}
        {showForm && (
          <section className="mt-8 border border-black/10 bg-white p-6 md:p-8">

            <div className="flex items-center justify-between border-b border-black/10 pb-5">

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
                  Category Management
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  {editingCategory
                    ? "Edit Category"
                    : "Add Category"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="grid h-9 w-9 place-items-center border border-black/15 transition hover:bg-black hover:text-white"
              >
                <X size={16} />
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-6 grid gap-5 md:grid-cols-2"
            >

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-black/50">
                  Category Name
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    handleNameChange(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Electronics"
                  className="mt-2 w-full border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-black/50">
                  Slug
                </label>

                <input
                  type="text"
                  value={form.slug}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      slug: event.target.value
                        .toLowerCase()
                        .replace(/\s+/g, "-"),
                    }))
                  }
                  placeholder="electronics"
                  className="mt-2 w-full border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-black"
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={closeForm}
                  className="border border-black/20 px-6 py-3 text-xs font-semibold uppercase tracking-wider transition hover:bg-black hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-black px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingCategory
                    ? "Update Category"
                    : "Create Category"}
                </button>

              </div>

            </form>

          </section>
        )}

        {/* SEARCH */}
        <div className="mt-8 flex items-center border border-black/15 bg-white">

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
            placeholder="Search categories by name or slug..."
            className="w-full bg-transparent px-4 py-4 text-sm outline-none"
          />

        </div>

        {/* SUMMARY */}
        <div className="mt-6 flex items-center justify-between">

          <p className="text-sm text-black/50">
            Showing{" "}
            <span className="font-semibold text-black">
              {filteredCategories.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-black">
              {categories.length}
            </span>{" "}
            categories
          </p>

        </div>

        {/* CATEGORY TABLE */}
        <section className="mt-6">

          {filteredCategories.length === 0 ? (
            <div className="border border-black/10 bg-white px-6 py-16 text-center">

              <FolderOpen
                size={34}
                className="mx-auto text-black/20"
              />

              <h2 className="mt-4 text-xl font-semibold">
                No categories found
              </h2>

              <p className="mt-2 text-sm text-black/40">
                Create a category or change your
                search.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto border border-black/10 bg-white">

              <table className="w-full min-w-[750px] border-collapse">

                <thead>
                  <tr className="border-b border-black/10 text-left">

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-black/40">
                      Category
                    </th>

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-black/40">
                      Slug
                    </th>

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-black/40">
                      Products
                    </th>

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-black/40">
                      Created
                    </th>

                    <th className="px-5 py-4 text-right text-[10px] font-semibold uppercase tracking-wider text-black/40">
                      Actions
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {filteredCategories.map(
                    (category) => (
                      <tr
                        key={category.id}
                        className="border-b border-black/10 last:border-b-0"
                      >

                        {/* NAME */}
                        <td className="px-5 py-5">

                          <div className="flex items-center gap-3">

                            <div className="grid h-10 w-10 place-items-center bg-black text-white">
                              <FolderOpen
                                size={16}
                              />
                            </div>

                            <p className="font-semibold">
                              {category.name}
                            </p>

                          </div>

                        </td>

                        {/* SLUG */}
                        <td className="px-5 py-5">

                          <span className="bg-black/5 px-3 py-1.5 font-mono text-xs text-black/60">
                            {category.slug}
                          </span>

                        </td>

                        {/* PRODUCTS */}
                        <td className="px-5 py-5">

                          <span className="text-sm font-semibold">
                            {category.productCount}
                          </span>

                        </td>

                        {/* CREATED */}
                        <td className="px-5 py-5 text-sm text-black/50">
                          {category.created_at
                            ? new Date(
                                category.created_at
                              ).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : "—"}
                        </td>

                        {/* ACTIONS */}
                        <td className="px-5 py-5">

                          <div className="flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                openEditForm(
                                  category
                                )
                              }
                              className="grid h-9 w-9 place-items-center border border-black/15 transition hover:bg-black hover:text-white"
                              title="Edit category"
                            >
                              <Pencil size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  category
                                )
                              }
                              className="grid h-9 w-9 place-items-center border border-red-200 text-red-600 transition hover:bg-red-600 hover:text-white"
                              title="Delete category"
                            >
                              <Trash2 size={14} />
                            </button>

                          </div>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>

      </div>
    </main>
  );
}