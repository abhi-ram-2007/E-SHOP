import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  Check,
  LogOut,
  Mail,
  MapPin,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

export default function CustomerProfile() {
  const { user, profile, signOut } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || "");

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(
    profile?.avatar_url || ""
  );

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // LOAD PROFILE
  // ============================================================

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setAvatarPreview(profile.avatar_url || "");
      setLoading(false);
    }
  }, [profile]);

  // ============================================================
  // PROFILE IMAGE
  // ============================================================

  function handleAvatarChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    // Validate image type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    // 5 MB limit
    if (file.size > 5 * 1024 * 1024) {
      setError("Profile image must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    // Remove previous local preview
    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setAvatarFile(file);
    setAvatarPreview(previewUrl);

    // Allow selecting same file again
    event.target.value = "";
  }

  // ============================================================
  // GET STORAGE PATH FROM AVATAR URL
  // ============================================================

  function getAvatarStoragePath(url) {
    if (!url) return null;

    const marker = "/storage/v1/object/public/avatars/";

    if (!url.includes(marker)) {
      return null;
    }

    return url.split(marker)[1] || null;
  }

  // ============================================================
  // REMOVE PROFILE IMAGE
  // ============================================================

  async function handleRemoveAvatar() {
    if (!user?.id) {
      setError("User session not found.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // If a new image has been selected but not saved,
      // just remove the local preview.
      if (avatarFile) {
        if (avatarPreview?.startsWith("blob:")) {
          URL.revokeObjectURL(avatarPreview);
        }

        setAvatarFile(null);
        setAvatarPreview(profile?.avatar_url || "");

        setSaving(false);
        return;
      }

      const currentAvatarUrl = profile?.avatar_url;

      if (!currentAvatarUrl) {
        setAvatarPreview("");
        setSaving(false);
        return;
      }

      // Delete image from Storage
      const storagePath = getAvatarStoragePath(currentAvatarUrl);

      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from("avatars")
          .remove([storagePath]);

        if (storageError) {
          console.error("Storage delete error:", storageError);
        }
      }

      // Remove URL from profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          avatar_url: null,
        })
        .eq("id", user.id);

      if (profileError) {
        throw profileError;
      }

      setAvatarFile(null);
      setAvatarPreview("");

      setSuccess("Profile picture removed.");
    } catch (err) {
      console.error("Avatar removal error:", err);

      setError(
        err?.message || "Unable to remove profile picture."
      );
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // UPDATE PROFILE
  // ============================================================

  async function handleSave(event) {
    event.preventDefault();

    const name = fullName.trim();

    if (!name) {
      setError("Please enter your name.");
      setSuccess("");
      return;
    }

    if (!user?.id) {
      setError("User session not found.");
      setSuccess("");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // --------------------------------------------------------
      // UPDATE NAME
      // --------------------------------------------------------

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: name,
        })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      // --------------------------------------------------------
      // UPLOAD NEW PROFILE IMAGE
      // --------------------------------------------------------

      if (avatarFile) {
        const extension =
          avatarFile.name.split(".").pop()?.toLowerCase() || "jpg";

        const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;

        // Upload
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: avatarFile.type,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: publicData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        const publicUrl = publicData?.publicUrl;

        if (!publicUrl) {
          // Clean up uploaded image
          await supabase.storage
            .from("avatars")
            .remove([filePath]);

          throw new Error(
            "Unable to get profile image URL."
          );
        }

        // Save URL to profile
        const { error: avatarUpdateError } = await supabase
          .from("profiles")
          .update({
            avatar_url: publicUrl,
          })
          .eq("id", user.id);

        if (avatarUpdateError) {
          // Clean up if DB update fails
          await supabase.storage
            .from("avatars")
            .remove([filePath]);

          throw avatarUpdateError;
        }

        // Delete old avatar
        const previousAvatarUrl = profile?.avatar_url;

        if (previousAvatarUrl) {
          const previousPath =
            getAvatarStoragePath(previousAvatarUrl);

          if (previousPath) {
            await supabase.storage
              .from("avatars")
              .remove([previousPath]);
          }
        }

        // Remove browser preview
        if (avatarPreview?.startsWith("blob:")) {
          URL.revokeObjectURL(avatarPreview);
        }

        setAvatarPreview(publicUrl);
        setAvatarFile(null);
      }

      setSuccess("Profile updated successfully.");
    } catch (err) {
      console.error("Profile update error:", err);

      setError(
        err?.message || "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // PASSWORD RESET
  // ============================================================

  async function handlePasswordReset() {
    if (!user?.email) {
      setError("Email address not available.");
      setSuccess("");
      return;
    }

    try {
      setError("");
      setSuccess("");

      const redirectTo =
        `${window.location.origin}/update-password`;

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(
          user.email,
          {
            redirectTo,
          }
        );

      if (resetError) {
        throw resetError;
      }

      setSuccess(
        "Password reset link has been sent to your email. Check your inbox."
      );
    } catch (err) {
      console.error("Password reset error:", err);

      setError(
        err?.message ||
          "Unable to send password reset email."
      );
    }
  }

  // ============================================================
  // LOGOUT
  // ============================================================

  async function handleLogout() {
    await signOut();
  }

  // ============================================================
  // DATE FORMAT
  // ============================================================

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

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f6f2]">
        <div className="mx-auto max-w-5xl px-4 py-16 md:px-8">
          <p className="text-sm text-black/40">
            Loading profile...
          </p>
        </div>
      </main>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <main className="min-h-screen bg-[#f7f6f2]">
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-14">

        {/* HEADER */}

        <div className="border-b border-black/15 pb-8">
          <Link
            to="/customer"
            className="mb-6 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-black/40 transition hover:text-black"
          >
            <ArrowLeft size={14} />
            Customer Dashboard
          </Link>

          <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-black/40">
            E-SHOP Account
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-.05em] md:text-6xl">
            My Profile
          </h1>

          <p className="mt-3 text-sm text-black/50">
            Manage your account information and security.
          </p>
        </div>

        {/* SUCCESS MESSAGE */}

        {success && (
          <div className="mt-8 flex items-start gap-3 border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <Check
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>{success}</span>
          </div>
        )}

        {/* ERROR MESSAGE */}

        {error && (
          <div className="mt-8 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">

          {/* ================================================== */}
          {/* PROFILE FORM */}
          {/* ================================================== */}

          <section className="border border-black/10 bg-white p-6 md:p-8">

            {/* PROFILE HEADER */}

            <div className="flex items-center gap-5 border-b border-black/10 pb-6">

              {/* AVATAR */}

              <div className="relative h-20 w-20 shrink-0">

                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile"
                    className="h-20 w-20 rounded-full border border-black/10 object-cover"
                  />
                ) : (
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-black text-xl font-semibold text-white">
                    {(fullName || "C")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                {/* CAMERA BUTTON */}

                <label
                  htmlFor="customer-avatar"
                  className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-black text-white transition hover:bg-black/80"
                  title="Change profile picture"
                >
                  <Camera size={14} />

                  <input
                    id="customer-avatar"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* PROFILE TITLE */}

              <div className="min-w-0">
                <h2 className="text-xl font-semibold">
                  Account Information
                </h2>

                <p className="mt-1 text-sm text-black/40">
                  Update your personal information.
                </p>

                <p className="mt-2 text-xs text-black/35">
                  JPG, PNG or WEBP · Maximum 5 MB
                </p>
              </div>
            </div>

            {/* FORM */}

            <form
              onSubmit={handleSave}
              className="mt-8 space-y-6"
            >

              {/* NAME */}

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
                  placeholder="Enter your full name"
                  className="mt-2 w-full border border-black/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
                />
              </div>

              {/* EMAIL */}

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-black/50">
                  <Mail size={14} />
                  Email
                </label>

                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="mt-2 w-full cursor-not-allowed border border-black/10 bg-black/[0.03] px-4 py-3 text-sm text-black/50 outline-none"
                />

                <p className="mt-2 text-xs text-black/35">
                  Your login email is managed by Supabase authentication.
                </p>
              </div>

              {/* ROLE */}

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-black/50">
                  <ShieldCheck size={14} />
                  Account Type
                </label>

                <div className="mt-2 border border-black/10 bg-black/[0.03] px-4 py-3 text-sm capitalize text-black/60">
                  {profile?.role || "customer"}
                </div>
              </div>

              {/* REMOVE IMAGE */}

              {avatarPreview && (
                <div className="border-t border-black/10 pt-6">
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={saving}
                    className="flex items-center gap-2 border border-red-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-red-600 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    Remove Profile Picture
                  </button>
                </div>
              )}

              {/* SAVE */}

              <div className="flex justify-end border-t border-black/10 pt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-black px-7 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </section>

          {/* ================================================== */}
          {/* SIDEBAR */}
          {/* ================================================== */}

          <aside className="space-y-6">

            {/* ACCOUNT DETAILS */}

            <section className="border border-black/10 bg-white p-6">
              <h2 className="text-lg font-semibold">
                Account Details
              </h2>

              <div className="mt-6 space-y-5">

                {/* JOINED */}

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

                {/* EMAIL */}

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

            {/* SECURITY */}

            <section className="border border-black/10 bg-white p-6">
              <div className="flex items-center gap-3">
                <ShieldCheck
                  size={20}
                  className="text-black/50"
                />

                <h2 className="text-lg font-semibold">
                  Security
                </h2>
              </div>

              <p className="mt-3 text-sm leading-6 text-black/50">
                Reset your password through your registered email address.
              </p>

              <button
                type="button"
                onClick={handlePasswordReset}
                className="mt-5 w-full border border-black/20 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition hover:bg-black hover:text-white"
              >
                Reset Password
              </button>
            </section>

            {/* SAVED ADDRESSES */}

            <section className="border border-black/10 bg-white p-6">
              <div className="flex items-center gap-3">
                <MapPin
                  size={20}
                  className="text-black/50"
                />

                <h2 className="text-lg font-semibold">
                  Saved Addresses
                </h2>
              </div>

              <p className="mt-3 text-sm leading-6 text-black/50">
                Manage your delivery addresses and default shipping location.
              </p>

              <Link
                to="/customer/addresses"
                className="mt-5 flex w-full items-center justify-center gap-2 border border-black/20 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition hover:bg-black hover:text-white"
              >
                Manage Addresses
              </Link>
            </section>

            {/* LOGOUT */}

            <section className="border border-red-200 bg-white p-6">
              <h2 className="text-lg font-semibold">
                Sign Out
              </h2>

              <p className="mt-2 text-sm leading-6 text-black/50">
                Sign out of your E-SHOP account on this device.
              </p>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-5 flex w-full items-center justify-center gap-2 border border-red-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-red-600 transition hover:bg-red-600 hover:text-white"
              >
                <LogOut size={14} />
                Logout
              </button>
            </section>

          </aside>
        </div>
      </div>
    </main>
  );
}