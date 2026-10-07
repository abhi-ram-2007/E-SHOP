import { useState } from "react";
import { LockKeyhole, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../../lib/supabase";

export default function UpdatePasswordPage() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSaving(true);

      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        });

      if (updateError) {
        throw updateError;
      }

      setSuccess(
        "Password updated successfully."
      );

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1800);
    } catch (err) {
      console.error(
        "Password update error:",
        err
      );

      setError(
        err.message ||
          "Unable to update password."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f6f2] px-4 py-16">
      <div className="mx-auto max-w-md">

        <div className="border border-black/10 bg-white p-8 md:p-10">

          <div className="mb-8">
            <div className="grid h-12 w-12 place-items-center bg-black text-white">
              <LockKeyhole size={20} />
            </div>

            <p className="mt-6 text-[10px] font-semibold uppercase tracking-[.15em] text-black/40">
              E-SHOP Security
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em]">
              Create new password
            </h1>

            <p className="mt-3 text-sm leading-6 text-black/50">
              Enter a new password for your E-SHOP
              account.
            </p>
          </div>

          {success && (
            <div className="mb-6 flex gap-3 border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0"
              />

              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-black/50">
                New Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter new password"
                autoComplete="new-password"
                className="mt-2 w-full border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-black/50">
                Confirm Password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="Confirm new password"
                autoComplete="new-password"
                className="mt-2 w-full border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-black"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-black px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Updating..."
                : "Update Password"}
            </button>

          </form>

        </div>

      </div>
    </main>
  );
}