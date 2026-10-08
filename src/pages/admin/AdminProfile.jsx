import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Check,
  CalendarDays,
  Mail,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

export default function AdminProfile() {
  const { user, profile } = useAuth();

  const [fullName, setFullName] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setAvatarPreview(profile.avatar_url || "");
    }
  }, [profile]);

  function handleAvatarChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Profile image must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    const preview = URL.createObjectURL(file);

    setAvatarFile(file);
    setAvatarPreview(preview);

    event.target.value = "";
  }

  function getAvatarStoragePath(url) {
    if (!url) return null;

    const marker = "/storage/v1/object/public/avatars/";

    if (!url.includes(marker)) {
      return null;
    }

    return url.split(marker)[1] || null;
  }

  async function handleRemoveAvatar() {
    if (!user?.id) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (avatarFile) {
        if (avatarPreview?.startsWith("blob:")) {
          URL.revokeObjectURL(avatarPreview);
        }

        setAvatarFile(null);
        setAvatarPreview(profile?.avatar_url || "");

        return;
      }

      const currentAvatar = profile?.avatar_url;

      if (currentAvatar) {
        const storagePath =
          getAvatarStoragePath(currentAvatar);

        if (storagePath) {
          await supabase.storage
            .from("avatars")
            .remove([storagePath]);
        }
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: null,
        })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      setAvatarPreview("");
      setAvatarFile(null);

      setSuccess("Profile picture removed.");
    } catch (err) {
      console.error(err);
      setError(
        err.message ||
          "Unable to remove profile picture."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSave(event) {
    event.preventDefault();

    if (!user?.id) {
      setError("User session not found.");
      return;
    }

    const name = fullName.trim();

    if (!name) {
      setError("Please enter your full name.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const { error: nameError } = await supabase
        .from("profiles")
        .update({
          full_name: name,
        })
        .eq("id", user.id);

      if (nameError) {
        throw nameError;
      }

      if (avatarFile) {
        const extension =
          avatarFile.name
            .split(".")
            .pop()
            ?.toLowerCase() || "jpg";

        const filePath =
          `${user.id}/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } =
          await supabase.storage
            .from("avatars")
            .upload(filePath, avatarFile, {
              cacheControl: "3600",
              upsert: false,
              contentType: avatarFile.type,
            });

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        const publicUrl = data?.publicUrl;

        if (!publicUrl) {
          await supabase.storage
            .from("avatars")
            .remove([filePath]);

          throw new Error(
            "Unable to create profile image URL."
          );
        }

        const { error: avatarError } =
          await supabase
            .from("profiles")
            .update({
              avatar_url: publicUrl,
            })
            .eq("id", user.id);

        if (avatarError) {
          await supabase.storage
            .from("avatars")
            .remove([filePath]);

          throw avatarError;
        }

        const oldAvatar = profile?.avatar_url;

        if (oldAvatar) {
          const oldPath =
            getAvatarStoragePath(oldAvatar);

          if (oldPath) {
            await supabase.storage
              .from("avatars")
              .remove([oldPath]);
          }
        }

        if (avatarPreview?.startsWith("blob:")) {
          URL.revokeObjectURL(avatarPreview);
        }

        setAvatarPreview(publicUrl);
        setAvatarFile(null);
      }

      setSuccess(
        "Admin profile updated successfully."
      );
    } catch (err) {
      console.error("Admin profile error:", err);

      setError(
        err.message ||
          "Unable to update admin profile."
      );
    } finally {
      setSaving(false);
    }
  }

  function formatDate(date) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f6f2]">
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-14">

        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-black/40 hover:text-black"
        >
          <ArrowLeft size={14} />
          Admin Dashboard
        </Link>

        <div className="mt-8 border-b border-black/15 pb-8">
          <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-black/40">
            E-SHOP Administration
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-.05em] md:text-6xl">
            My Profile
          </h1>

          <p className="mt-3 text-sm text-black/50">
            Manage your administrator account information.
          </p>
        </div>

        {success && (
          <div className="mt-8 flex items-center gap-2 border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <Check size={18} />
            {success}
          </div>
        )}

        {error && (
          <div className="mt-8 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">

          <section className="border border-black/10 bg-white p-6 md:p-8">

            <div className="flex items-center gap-5 border-b border-black/10 pb-7">

              <div className="relative h-20 w-20 shrink-0">

                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Admin profile"
                    className="h-20 w-20 rounded-full border border-black/10 object-cover"
                  />
                ) : (
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-black text-xl font-semibold text-white">
                    {(fullName || "A")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                <label
                  htmlFor="admin-avatar"
                  className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-black text-white hover:bg-black/80"
                >
                  <Camera size={14} />

                  <input
                    id="admin-avatar"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>

              </div>

              <div>
                <h2 className="text-xl font-semibold">
                  Account Information
                </h2>

                <p className="mt-1 text-sm text-black/40">
                  Administrator account
                </p>

                <p className="mt-2 text-xs text-black/35">
                  JPG, PNG or WEBP · Maximum 5 MB
                </p>
              </div>

            </div>

            <form
              onSubmit={handleSave}
              className="mt-8 space-y-6"
            >

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-black/50">
                  <User size={14} />
                  Full Name
                </label>

                <input
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  className="mt-2 w-full border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-black"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-black/50">
                  <Mail size={14} />
                  Email
                </label>

                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="mt-2 w-full cursor-not-allowed border border-black/10 bg-black/[0.03] px-4 py-3 text-sm text-black/50"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-black/50">
                  <ShieldCheck size={14} />
                  Account Type
                </label>

                <div className="mt-2 border border-black/10 bg-black/[0.03] px-4 py-3 text-sm uppercase text-black/60">
                  ADMIN
                </div>
              </div>

              {avatarPreview && (
                <div className="border-t border-black/10 pt-6">
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={saving}
                    className="flex items-center gap-2 border border-red-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-red-600 hover:bg-red-600 hover:text-white"
                  >
                    <Trash2 size={14} />
                    Remove Profile Picture
                  </button>
                </div>
              )}

              <div className="flex justify-end border-t border-black/10 pt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-black px-7 py-3 text-xs font-semibold uppercase tracking-wider text-white hover:bg-black/80 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>

            </form>
          </section>

          <aside>
            <section className="border border-black/10 bg-white p-6">

              <h2 className="text-lg font-semibold">
                Account Details
              </h2>

              <div className="mt-6 space-y-5">

                <div className="flex items-start gap-3">
                  <CalendarDays
                    size={18}
                    className="mt-0.5 text-black/40"
                  />

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
                      Joined
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {formatDate(
                        profile?.created_at ||
                          user?.created_at
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail
                    size={18}
                    className="mt-0.5 text-black/40"
                  />

                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
                      Email
                    </p>

                    <p className="mt-1 break-all text-sm font-medium">
                      {user?.email || "—"}
                    </p>
                  </div>
                </div>

              </div>
            </section>
          </aside>

        </div>
      </div>
    </main>
  );
}