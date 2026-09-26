"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStartSessionMutation } from "@/store/api/customerApi";
import { useAppDispatch } from "@/store";
import { setCustomerSession } from "@/store/slices/authSlice";
import { addToast } from "@/store/slices/uiSlice";
import { translateBackendError } from "@/lib/errors";
import {
  Loader2,
  Utensils,
  AlertCircle,
  Users,
  Phone,
  User,
  Sparkles,
  ArrowRight,
  Plus,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function TableQREntryPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [startSession, { isLoading }] = useStartSessionMutation();

  const tableToken = (params.tableToken as string) || "table-qr-token-spice-route-01";
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [guestCount, setGuestCount] = useState<number>(2);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pre-fill from localStorage if previously entered
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("tableos_customer_name");
      const savedPhone = localStorage.getItem("tableos_customer_phone");
      const savedGuests = localStorage.getItem("tableos_guest_count");
      if (savedName) setCustomerName(savedName);
      if (savedPhone) setCustomerPhone(savedPhone);
      if (savedGuests && !isNaN(Number(savedGuests))) {
        setGuestCount(Math.max(1, Number(savedGuests)));
      }
    }
  }, []);

  // Generate or retrieve persistent client device fingerprint
  const getDeviceFingerprint = () => {
    if (typeof window === "undefined") return "fp-client-default";
    let fp = localStorage.getItem("tableos_device_fingerprint");
    if (!fp) {
      fp = `fp-${Math.random().toString(36).substring(2, 10)}-${Date.now()}`;
      localStorage.setItem("tableos_device_fingerprint", fp);
    }
    return fp;
  };

  const handleStartDining = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const displayName = customerName.trim() || "Guest Diner";
    const phone = customerPhone.trim();
    const guests = Math.max(1, guestCount || 2);

    try {
      const fingerprint = getDeviceFingerprint();

      // Save locally for smooth return visits
      if (typeof window !== "undefined") {
        localStorage.setItem("tableos_customer_name", displayName);
        if (phone) localStorage.setItem("tableos_customer_phone", phone);
        localStorage.setItem("tableos_guest_count", String(guests));
      }

      const session = await startSession({
        table_token: tableToken,
        customer_name: displayName,
        customer_phone: phone,
        guest_count: guests,
        device_fingerprint: fingerprint,
      }).unwrap();

      // Store in Redux
      dispatch(
        setCustomerSession({
          sessionId: session.id,
          sessionToken: session.session_token,
          customerName: displayName,
          deviceFingerprint: fingerprint,
        })
      );

      dispatch(
        addToast({
          type: "success",
          title: "Welcome to The Spice Route!",
          message: `Party of ${guests} confirmed. Explore our handcrafted menu below.`,
          durationMs: 3500,
        })
      );

      // Redirect into customer dining menu
      router.replace(`/dine/${session.id}/menu`);
    } catch (err: unknown) {
      console.error("Session start error:", err);
      const translated = translateBackendError(err);
      setErrorMessage(translated);
    }
  };

  // Derive readable table label deterministically from scanned table token
  const getTableLabel = (token: string) => {
    if (!token) return "Table 1";
    const match = token.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      return `Table ${num}`;
    }
    return "Table 1";
  };
  const tableLabel = getTableLabel(tableToken);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl glass-card border border-surface-border p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Icon */}
        <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-glow mb-4">
          <Utensils className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-black text-gray-100 font-display">
          The Spice Route
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/20 border border-primary/40 text-primary font-bold font-mono tracking-wider uppercase">
            {tableLabel} • Dine-In
          </span>
        </div>

        <p className="text-xs text-gray-400 mt-2 max-w-xs leading-relaxed">
          Please enter your details below so our kitchen and floor team can prepare your seating and dishes accordingly.
        </p>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-400 text-left w-full">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Guest Details Form */}
        <form onSubmit={handleStartDining} className="mt-5 w-full flex flex-col gap-4 text-left">
          {/* Customer Name */}
          <div>
            <label className="text-xs font-bold text-gray-300 block mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary" />
              <span>Full Name</span>
            </label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Dev Rishi Jain"
              className="w-full text-sm"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="text-xs font-bold text-gray-300 block mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-primary" />
                <span>Mobile Number</span>
              </span>
              <span className="text-[10px] font-mono text-gray-500">No OTP Required</span>
            </label>
            <Input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full text-sm font-mono"
            />
          </div>

          {/* Number of Guests */}
          <div>
            <label className="text-xs font-bold text-gray-300 block mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" />
                <span>Number of Guests</span>
              </span>
              <span className="text-[10px] font-mono text-gray-400">
                Helps kitchen portioning
              </span>
            </label>

            {/* Stepper & Chips */}
            <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-surface-subtle border border-surface-border">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGuestCount((g) => Math.max(1, g - 1))}
                  className="w-8 h-8 rounded-lg bg-surface border border-surface-border flex items-center justify-center text-gray-300 hover:text-white active:scale-95"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-base font-black font-mono text-primary">
                  {guestCount} {guestCount === 1 ? "Guest" : "Guests"}
                </span>
                <button
                  type="button"
                  onClick={() => setGuestCount((g) => Math.min(20, g + 1))}
                  className="w-8 h-8 rounded-lg bg-primary text-background font-bold flex items-center justify-center active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Select Buttons */}
              <div className="flex items-center gap-1">
                {[1, 2, 4, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setGuestCount(num)}
                    className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all ${
                      guestCount === num
                        ? "bg-primary text-background shadow-md shadow-primary/20"
                        : "bg-surface text-gray-400 border border-surface-border hover:text-white"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="gold"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-2 font-bold shadow-xl shadow-amber-500/20"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {isLoading ? "Opening Session..." : "Start Dining & View Menu"}
          </Button>
        </form>

        <div className="pt-4 mt-5 border-t border-surface-border/50 w-full text-[11px] text-gray-500 font-mono flex items-center justify-between">
          <span>TableOS Dining Engine</span>
          <span className="truncate max-w-[150px]">Token: {tableToken}</span>
        </div>
      </div>
    </div>
  );
}
