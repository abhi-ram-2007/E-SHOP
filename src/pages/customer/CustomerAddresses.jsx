import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Star,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

const emptyForm = {
  full_name: "",
  phone: "",
  address_line: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  is_default: false,
};

export default function CustomerAddresses() {
  const { user } = useAuth();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user?.id) {
      loadAddresses();
    }
  }, [user?.id]);

  async function loadAddresses() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setAddresses(data || []);
    }

    setLoading(false);
  }

  function openAddForm() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setMessage("");
    setShowForm(true);
  }

  function openEditForm(address) {
    setEditingId(address.id);

    setForm({
      full_name: address.full_name || "",
      phone: address.phone || "",
      address_line: address.address_line || "",
      city: address.city || "",
      state: address.state || "",
      pincode: address.pincode || "",
      country: address.country || "India",
      is_default: address.is_default || false,
    });

    setError("");
    setMessage("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function makeDefault(addressId) {
    setError("");
    setMessage("");

    const { error } = await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", user.id);

    if (error) {
      setError(error.message);
      return;
    }

    const { error: defaultError } = await supabase
      .from("addresses")
      .update({ is_default: true })
      .eq("id", addressId)
      .eq("user_id", user.id);

    if (defaultError) {
      setError(defaultError.message);
      return;
    }

    setMessage("Default address updated.");
    await loadAddresses();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (
      !form.full_name.trim() ||
      !form.phone.trim() ||
      !form.address_line.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.pincode.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    setSaving(true);

    try {
      // If this address is default,
      // remove default from other addresses first.
      if (form.is_default) {
        const { error: resetError } = await supabase
          .from("addresses")
          .update({ is_default: false })
          .eq("user_id", user.id);

        if (resetError) {
          throw resetError;
        }
      }

      const addressData = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        address_line: form.address_line.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        country: form.country.trim() || "India",
        is_default: form.is_default,
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from("addresses")
          .update(addressData)
          .eq("id", editingId)
          .eq("user_id", user.id);

        if (updateError) {
          throw updateError;
        }

        setMessage("Address updated successfully.");
      } else {
        const { error: insertError } = await supabase
          .from("addresses")
          .insert({
            ...addressData,
            user_id: user.id,
          });

        if (insertError) {
          throw insertError;
        }

        setMessage("Address added successfully.");
      }

      closeForm();
      await loadAddresses();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAddress(addressId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this address?"
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", addressId)
      .eq("user_id", user.id);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Address deleted successfully.");
    await loadAddresses();
  }

  return (
    <main className="min-h-screen bg-[#f7f6f2] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/customer/profile"
              className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black"
            >
              <ArrowLeft size={16} />
              Back to Profile
            </Link>

            <h1 className="text-3xl font-semibold tracking-tight text-black">
              Saved Addresses
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Manage your delivery addresses.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            <Plus size={18} />
            Add Address
          </button>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {message && !showForm && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {/* LOADING / EMPTY / ADDRESSES */}

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <p className="text-sm text-gray-500">
              Loading your addresses...
            </p>
          </div>
        ) : addresses.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <MapPin size={25} />
            </div>

            <h2 className="text-lg font-semibold text-black">
              No saved addresses
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Add a delivery address so you can check out faster next time.
            </p>

            <button
              type="button"
              onClick={openAddForm}
              className="mt-6 rounded-full bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800"
            >
              Add Your First Address
            </button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="relative rounded-2xl border border-gray-200 bg-white p-6"
              >

                {/* DEFAULT BADGE */}

                {address.is_default && (
                  <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
                    <Star size={12} fill="currentColor" />
                    Default Address
                  </div>
                )}

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-black">
                      {address.full_name}
                    </h2>

                    <p className="mt-1 text-sm text-gray-600">
                      {address.phone}
                    </p>
                  </div>

                  <MapPin
                    size={20}
                    className="shrink-0 text-gray-400"
                  />
                </div>

                <div className="mt-5 space-y-1 text-sm leading-6 text-gray-600">
                  <p>{address.address_line}</p>

                  <p>
                    {address.city}, {address.state} -{" "}
                    {address.pincode}
                  </p>

                  <p>{address.country}</p>
                </div>

                {/* ACTIONS */}

                <div className="mt-6 flex flex-wrap gap-2 border-t border-gray-100 pt-5">

                  {!address.is_default && (
                    <button
                      type="button"
                      onClick={() => makeDefault(address.id)}
                      className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:border-black hover:text-black"
                    >
                      <Star size={14} />
                      Set Default
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => openEditForm(address)}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:border-black hover:text-black"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteAddress(address.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ADD / EDIT MODAL */}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              {/* MODAL HEADER */}

              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
                <div>
                  <h2 className="text-xl font-semibold text-black">
                    {editingId
                      ? "Edit Address"
                      : "Add New Address"}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Enter your delivery details.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-black"
                >
                  <X size={20} />
                </button>
              </div>

              {/* FORM */}

              <form
                onSubmit={handleSubmit}
                className="p-6"
              >
                <div className="grid gap-5 sm:grid-cols-2">

                  {/* FULL NAME */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Full Name *
                    </label>

                    <input
                      type="text"
                      name="full_name"
                      value={form.full_name}
                      onChange={handleChange}
                      placeholder="Enter full name"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />
                  </div>

                  {/* PHONE */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Phone *
                    </label>

                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />
                  </div>

                  {/* ADDRESS */}

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Address *
                    </label>

                    <textarea
                      name="address_line"
                      value={form.address_line}
                      onChange={handleChange}
                      rows={3}
                      placeholder="House / Flat / Street / Area"
                      className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />
                  </div>

                  {/* CITY */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      City *
                    </label>

                    <input
                      type="text"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="City"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />
                  </div>

                  {/* STATE */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      State *
                    </label>

                    <input
                      type="text"
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                      placeholder="State"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />
                  </div>

                  {/* PINCODE */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Pincode *
                    </label>

                    <input
                      type="text"
                      name="pincode"
                      value={form.pincode}
                      onChange={handleChange}
                      placeholder="Pincode"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />
                  </div>

                  {/* COUNTRY */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Country
                    </label>

                    <input
                      type="text"
                      name="country"
                      value={form.country}
                      onChange={handleChange}
                      placeholder="Country"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                    />
                  </div>
                </div>

                {/* DEFAULT */}

                <label className="mt-6 flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    name="is_default"
                    checked={form.is_default}
                    onChange={handleChange}
                    className="h-4 w-4 accent-black"
                  />

                  <span className="text-sm text-gray-700">
                    Make this my default delivery address
                  </span>
                </label>

                {/* FORM ERROR */}

                {error && (
                  <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* BUTTONS */}

                <div className="mt-7 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="rounded-full border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:border-black hover:text-black"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Update Address"
                        : "Save Address"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}