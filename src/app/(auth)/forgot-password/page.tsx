"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForgotPasswordMutation, useResetPasswordMutation } from "@/store/api/staffApi";
import { Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, ArrowLeft, KeyRound } from "lucide-react";

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<"request" | "reset">("request");
  const [identifier, setIdentifier] = useState("");
  const [restaurantSlug, setRestaurantSlug] = useState(searchParams.get("restaurant") || "");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [forgotPassword, { isLoading: isRequesting }] = useForgotPasswordMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation();

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!identifier.trim()) {
      setErrorMsg("Please enter your Email or Employee ID.");
      return;
    }

    try {
      const res = await forgotPassword({
        identifier: identifier.trim(),
        restaurant_id: restaurantSlug.trim() || undefined,
      }).unwrap();

      setSuccessMsg(res.message || "Password reset instructions have been generated.");
      if (res.reset_token) {
        setResetToken(res.reset_token);
      }
      setStep("reset");
    } catch (err: any) {
      console.error("Forgot password request failed:", err);
      setErrorMsg(err?.data?.error || "Failed to process request. Please try again.");
    }
  };

  const handlePerformReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!resetToken.trim()) {
      setErrorMsg("Reset token is required.");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    try {
      const res = await resetPassword({
        token: resetToken.trim(),
        new_password: newPassword,
      }).unwrap();

      setSuccessMsg(res.message || "Password successfully reset!");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      console.error("Password reset failed:", err);
      setErrorMsg(err?.data?.error || "Failed to reset password. Token may be invalid or expired.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-slate-950 to-slate-950" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <KeyRound className="h-6 w-6" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-white">
          {step === "request" ? "Forgot Password" : "Set New Password"}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          {step === "request"
            ? "Enter your email or employee ID to receive reset instructions."
            : "Enter your reset token and your new password below."}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl border border-slate-800/80">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {step === "request" ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Email or Employee ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. john@example.com or EMP-WTR-001"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Restaurant Handle / Slug <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={restaurantSlug}
                  onChange={(e) => setRestaurantSlug(e.target.value)}
                  placeholder="e.g. urban-bistro"
                  className="block w-full px-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isRequesting}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isRequesting ? "Requesting..." : "Send Reset Code"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handlePerformReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Reset Token
                </label>
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste 64-character reset token"
                  className="block w-full px-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isResetting}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isResetting ? "Resetting Password..." : "Update Password"}
                <CheckCircle2 className="h-4 w-4" />
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-slate-800/60 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Staff Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading...</div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
