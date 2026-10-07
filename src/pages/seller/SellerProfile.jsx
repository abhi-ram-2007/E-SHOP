import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Camera,
  Check,
  Mail,
  User,
  ShieldCheck,
  Pencil,
  X,
  Trash2,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

export default function SellerProfile() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);

  const [fullName, setFullName] = useState(
    profile?.full_name || ""
  );

  const [email, setEmail] = useState(
    user?.email || profile?.email || ""
  );

  // ============================================================
  // PROFILE IMAGE
  // ============================================================

  const [avatarFile, setAvatarFile] = useState(null);

  const [avatarPreview, setAvatarPreview] = useState(
    profile?.avatar_url || ""
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ============================================================
  // UPDATE PROFILE WHEN AUTH PROFILE CHANGES
  // ============================================================

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setAvatarPreview(profile.avatar_url || "");
    }
  }, [profile]);

  // ============================================================
  // EDIT
  // ============================================================

  const handleEdit = () => {
    setFullName(profile?.full_name || "");
    setEmail(user?.email || profile?.email || "");
    setMessage("");
    setError("");
    setIsEditing(true);
  };

  // ============================================================
  // CANCEL
  // ============================================================

  const handleCancel = () => {
    // Remove temporary image preview
    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setFullName(profile?.full_name || "");
    setEmail(user?.email || profile?.email || "");
    setAvatarFile(null);
    setAvatarPreview(profile?.avatar_url || "");

    setMessage("");
    setError("");
    setIsEditing(false);
  };

  // ============================================================
  // PROFILE IMAGE SELECTION
  // ============================================================

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setMessage("");
    setError("");

    // Validate image
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

    // Remove previous temporary preview
    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setAvatarFile(file);
    setAvatarPreview(previewUrl);

    // Allow selecting same image again
    event.target.value = "";
  };

  // ============================================================
  // GET AVATAR STORAGE PATH
  // ============================================================

  const getAvatarStoragePath = (url) => {
    if (!url) return null;

    const marker = "/storage/v1/object/public/avatars/";

    if (!url.includes(marker)) {
      return null;
    }

    return url.split(marker)[1] || null;
  };

  // ============================================================
  // REMOVE PROFILE IMAGE
  // ============================================================

  const handleRemoveAvatar = async () => {
    if (!user?.id) {
      setError("User session not found.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      // --------------------------------------------------------
      // REMOVE UNSAVED LOCAL IMAGE
      // --------------------------------------------------------

      if (avatarFile) {
        if (avatarPreview?.startsWith("blob:")) {
          URL.revokeObjectURL(avatarPreview);
        }

        setAvatarFile(null);
        setAvatarPreview(profile?.avatar_url || "");

        setSaving(false);
        return;
      }

      // --------------------------------------------------------
      // REMOVE SAVED IMAGE
      // --------------------------------------------------------

      const currentAvatarUrl = profile?.avatar_url;

      if (!currentAvatarUrl) {
        setAvatarPreview("");
        setSaving(false);
        return;
      }

      const storagePath =
        getAvatarStoragePath(currentAvatarUrl);

      // Delete from Supabase Storage
      if (storagePath) {
        const { error: storageError } =
          await supabase.storage
            .from("avatars")
            .remove([storagePath]);

        if (storageError) {
          console.error(
            "Avatar storage delete error:",
            storageError
          );
        }
      }

      // Remove URL from profiles table
      const { error: profileError } =
        await supabase
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

      setMessage("Profile picture removed.");
    } catch (err) {
      console.error("Avatar removal error:", err);

      setError(
        err?.message ||
          "Unable to remove profile picture."
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // SAVE PROFILE
  // ============================================================

  const handleSave = async () => {
    setMessage("");
    setError("");

    if (!fullName.trim()) {
      setError("Full name cannot be empty.");
      return;
    }

    if (!email.trim()) {
      setError("Email cannot be empty.");
      return;
    }

    if (!user?.id) {
      setError("User session not found.");
      return;
    }

    setSaving(true);

    try {
      // ========================================================
      // UPDATE PROFILE NAME
      // ========================================================

      const { error: profileError } =
        await supabase
          .from("profiles")
          .update({
            full_name: fullName.trim(),
          })
          .eq("id", user.id);

      if (profileError) {
        throw profileError;
      }

      // ========================================================
      // UPDATE AUTH EMAIL
      // ========================================================

      const currentEmail = user?.email || "";

      if (
        email.trim().toLowerCase() !==
        currentEmail.toLowerCase()
      ) {
        const { error: emailError } =
          await supabase.auth.updateUser({
            email: email.trim(),
          });

        if (emailError) {
          throw emailError;
        }

        setMessage(
          "Profile updated. Please check your new email to confirm the email change."
        );
      } else {
        setMessage("Profile updated successfully.");
      }

      // ========================================================
      // UPLOAD NEW PROFILE IMAGE
      // ========================================================

      if (avatarFile) {
        const extension =
          avatarFile.name
            .split(".")
            .pop()
            ?.toLowerCase() || "jpg";

        const filePath =
          `${user.id}/${crypto.randomUUID()}.${extension}`;

        // ------------------------------------------------------
        // Upload
        // ------------------------------------------------------

        const { error: uploadError } =
          await supabase.storage
            .from("avatars")
            .upload(
              filePath,
              avatarFile,
              {
                cacheControl: "3600",
                upsert: false,
                contentType: avatarFile.type,
              }
            );

        if (uploadError) {
          throw uploadError;
        }

        // ------------------------------------------------------
        // Get Public URL
        // ------------------------------------------------------

        const { data: publicData } =
          supabase.storage
            .from("avatars")
            .getPublicUrl(filePath);

        const publicUrl =
          publicData?.publicUrl;

        if (!publicUrl) {
          await supabase.storage
            .from("avatars")
            .remove([filePath]);

          throw new Error(
            "Unable to get profile image URL."
          );
        }

        // ------------------------------------------------------
        // Save URL in profiles
        // ------------------------------------------------------

        const { error: avatarUpdateError } =
          await supabase
            .from("profiles")
            .update({
              avatar_url: publicUrl,
            })
            .eq("id", user.id);

        if (avatarUpdateError) {
          // Delete uploaded image if DB update fails
          await supabase.storage
            .from("avatars")
            .remove([filePath]);

          throw avatarUpdateError;
        }

        // ------------------------------------------------------
        // Delete previous image
        // ------------------------------------------------------

        const previousAvatarUrl =
          profile?.avatar_url;

        if (previousAvatarUrl) {
          const previousPath =
            getAvatarStoragePath(
              previousAvatarUrl
            );

          if (previousPath) {
            await supabase.storage
              .from("avatars")
              .remove([previousPath]);
          }
        }

        // ------------------------------------------------------
        // Update local state
        // ------------------------------------------------------

        if (avatarPreview?.startsWith("blob:")) {
          URL.revokeObjectURL(avatarPreview);
        }

        setAvatarPreview(publicUrl);
        setAvatarFile(null);
      }

      setIsEditing(false);
    } catch (err) {
      console.error(
        "Profile update error:",
        err
      );

      setError(
        err?.message ||
          "Something went wrong while updating your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  // ============================================================
  // CLEANUP TEMPORARY PREVIEW
  // ============================================================

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <main className="min-h-screen bg-[#f7f6f2]">
      <div className="mx-auto max-w-7xl px-6 py-12 md:px-10 md:py-16">

        {/* TOP NAVIGATION */}

        <div className="mb-10">
          <Link
            to="/seller"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-black/50 transition hover:text-black"
          >
            <ArrowLeft size={15} />
            Back to Dashboard
          </Link>
        </div>

        {/* PAGE HEADER */}

        <div className="border-b border-black/15 pb-12">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/40">
            Seller Account
          </p>

          <h1 className="mt-3 text-5xl font-semibold tracking-[-0.05em] md:text-7xl">
            My Profile
          </h1>

          <p className="mt-5 max-w-xl text-sm leading-6 text-black/50">
            Manage your seller account information and view
            your account details.
          </p>
        </div>

        {/* PROFILE CARD */}

        <div className="mt-12 max-w-4xl border border-black/10 bg-white">

          {/* PROFILE HEADER */}

          <div className="flex flex-col gap-6 border-b border-black/10 p-8 sm:flex-row sm:items-center sm:justify-between md:p-10">

            <div className="flex items-center gap-6">

              {/* ================================================= */}
              {/* SELLER AVATAR / LOGO */}
              {/* ================================================= */}

              <div className="relative h-20 w-20 shrink-0">

                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Seller profile"
                    className="h-20 w-20 rounded-full border border-black/10 object-cover"
                  />
                ) : (
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-[#171717] text-white">
                    <User
                      size={32}
                      strokeWidth={1.5}
                    />
                  </div>
                )}

                {/* CAMERA BUTTON */}

                {isEditing && (
                  <label
                    htmlFor="seller-avatar"
                    title="Change seller profile picture"
                    className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-black text-white transition hover:bg-black/80"
                  >
                    <Camera size={14} />

                    <input
                      id="seller-avatar"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* SELLER NAME */}

              <div className="min-w-0">

                {isEditing ? (
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) =>
                      setFullName(e.target.value)
                    }
                    className="w-full max-w-xs border-b border-black/30 bg-transparent py-2 text-xl font-semibold outline-none focus:border-black"
                    placeholder="Full name"
                  />
                ) : (
                  <h2 className="text-xl font-semibold">
                    {profile?.full_name || "Seller"}
                  </h2>
                )}

                <p className="mt-1 text-sm text-black/50">
                  Seller Account
                </p>

                {isEditing && (
                  <p className="mt-2 text-xs text-black/35">
                    JPG, PNG or WEBP · Maximum 5 MB
                  </p>
                )}
              </div>
            </div>

            {!isEditing && (
              <button
                onClick={handleEdit}
                className="inline-flex w-fit items-center gap-2 border border-black/20 px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] transition hover:bg-black hover:text-white"
              >
                <Pencil size={14} />
                Edit Profile
              </button>
            )}
          </div>

          {/* ================================================= */}
          {/* FULL NAME */}
          {/* ================================================= */}

          <div className="flex items-center gap-6 border-b border-black/10 p-8 md:p-10">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#f1f0ec]">
              <User
                size={19}
                strokeWidth={1.5}
              />
            </div>

            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/40">
                Full Name
              </p>

              {isEditing ? (
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) =>
                    setFullName(e.target.value)
                  }
                  className="mt-2 w-full max-w-md border-b border-black/20 bg-transparent py-2 text-base outline-none focus:border-black"
                />
              ) : (
                <p className="mt-2 text-base">
                  {profile?.full_name ||
                    "Not provided"}
                </p>
              )}
            </div>
          </div>

          {/* ================================================= */}
          {/* EMAIL */}
          {/* ================================================= */}

          <div className="flex items-center gap-6 border-b border-black/10 p-8 md:p-10">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#f1f0ec]">
              <Mail
                size={19}
                strokeWidth={1.5}
              />
            </div>

            <div className="flex-1">

              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/40">
                Email
              </p>

              {isEditing ? (
                <>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    className="mt-2 w-full max-w-md border-b border-black/20 bg-transparent py-2 text-base outline-none focus:border-black"
                  />

                  <p className="mt-2 text-xs text-black/40">
                    Changing your email may require
                    confirmation.
                  </p>
                </>
              ) : (
                <p className="mt-2 text-base">
                  {user?.email ||
                    profile?.email ||
                    "Not provided"}
                </p>
              )}
            </div>
          </div>

          {/* ================================================= */}
          {/* ACCOUNT TYPE */}
          {/* ================================================= */}

          <div className="flex items-center gap-6 border-b border-black/10 p-8 md:p-10">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#f1f0ec]">
              <ShieldCheck
                size={19}
                strokeWidth={1.5}
              />
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/40">
                Account Type
              </p>

              <p className="mt-2 text-base uppercase">
                SELLER
              </p>

              {isEditing && (
                <p className="mt-2 text-xs text-black/40">
                  Account type cannot be changed.
                </p>
              )}
            </div>
          </div>

          {/* ================================================= */}
          {/* REMOVE PROFILE IMAGE */}
          {/* ================================================= */}

          {isEditing && avatarPreview && (
            <div className="border-b border-black/10 px-8 py-6 md:px-10">
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={saving}
                className="inline-flex items-center gap-2 border border-red-200 px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-red-600 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={14} />
                Remove Profile Picture
              </button>
            </div>
          )}

          {/* ================================================= */}
          {/* SUCCESS MESSAGE */}
          {/* ================================================= */}

          {message && (
            <div className="border-b border-black/10 bg-[#f7f6f2] px-8 py-4 text-sm text-black/70 md:px-10">
              <div className="flex items-center gap-2">
                <Check size={16} />
                {message}
              </div>
            </div>
          )}

          {/* ================================================= */}
          {/* ERROR MESSAGE */}
          {/* ================================================= */}

          {error && (
            <div className="border-b border-red-200 bg-red-50 px-8 py-4 text-sm text-red-700 md:px-10">
              {error}
            </div>
          )}

          {/* ================================================= */}
          {/* ACTIONS */}
          {/* ================================================= */}

          <div className="flex flex-wrap gap-3 p-8 md:p-10">

            {isEditing ? (
              <>
                {/* SAVE */}

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-black px-7 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Check size={15} />

                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

                {/* CANCEL */}

                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="inline-flex items-center gap-2 border border-black/20 px-7 py-4 text-xs font-semibold uppercase tracking-[0.12em] transition hover:bg-black hover:text-white disabled:opacity-50"
                >
                  <X size={15} />
                  Cancel
                </button>
              </>
            ) : (
              <>
                {/* DASHBOARD */}

                <Link
                  to="/seller"
                  className="inline-flex items-center gap-3 bg-black px-7 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-black/80"
                >
                  Dashboard
                  <ArrowUpRight size={15} />
                </Link>

                {/* LOGOUT */}

                <button
                  onClick={handleLogout}
                  className="border border-black/20 px-7 py-4 text-xs font-semibold uppercase tracking-[0.12em] transition hover:bg-black hover:text-white"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}