"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStartSessionMutation } from "@/store/api/customerApi";
import { useAppDispatch } from "@/store";
import { setCustomerSession } from "@/store/slices/authSlice";
import { addToast } from "@/store/slices/uiSlice";
import { translateBackendError } from "@/lib/errors";
import { Loader2, Utensils, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function TableQREntryPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [startSession, { isLoading }] = useStartSessionMutation();

  const tableToken = (params.tableToken as string) || "table-qr-token-spice-route-01";
  const [customerName, setCustomerName] = useState("Guest Diner");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [needsNameInput, setNeedsNameInput] = useState(false);

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

  const initiateSession = async (name: string) => {
    setErrorMessage(null);
    try {
      const fingerprint = getDeviceFingerprint();
      const session = await startSession({
        table_token: tableToken,
        customer_name: name.trim() || "Guest Diner",
        device_fingerprint: fingerprint,
      }).unwrap();

      // Store in Redux and localStorage
      dispatch(
        setCustomerSession({
          sessionId: session.id,
          sessionToken: session.session_token,
          customerName: name.trim() || "Guest Diner",
          deviceFingerprint: fingerprint,
        })
      );

      dispatch(
        addToast({
          type: "success",
          title: "Welcome to The Spice Route!",
          message: "Your dining session has begun. Explore our menu below.",
        })
      );

      // Redirect into customer dining menu
      router.replace(`/dine/${session.id}/menu`);
    } catch (err: unknown) {
      console.error("Session start error:", err);
      const translated = translateBackendError(err);
      setErrorMessage(translated);
      setNeedsNameInput(true);
    }
  };

  // Attempt auto-start on mount if diner name already known
  useEffect(() => {
    const savedName =
      typeof window !== "undefined"
        ? localStorage.getItem("tableos_customer_name")
        : null;
    if (savedName) {
      setCustomerName(savedName);
      initiateSession(savedName);
    } else {
      initiateSession("Guest Diner");
    }
  }, [tableToken]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl glass-card border border-surface-border p-8 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-glow mb-5">
          <Utensils className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-extrabold text-gray-100 font-display">
          The Spice Route
        </h2>
        <p className="text-xs text-primary font-semibold tracking-wider uppercase mt-1">
          Table T1 • Instant Dining
        </p>

        {isLoading && !errorMessage ? (
          <div className="flex flex-col items-center gap-3 my-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs text-gray-400">
              Connecting table session with restaurant...
            </p>
          </div>
        ) : errorMessage ? (
          <div className="flex flex-col gap-4 my-6 w-full text-left">
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>

            <Input
              label="Your Name (Optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. John Doe"
            />

            <Button
              onClick={() => initiateSession(customerName)}
              isLoading={isLoading}
              className="w-full"
            >
              Retry Starting Session
            </Button>
          </div>
        ) : (
          <div className="my-6 w-full flex flex-col gap-4">
            <Input
              label="Your Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Priya Sharma"
            />
            <Button
              onClick={() => initiateSession(customerName)}
              isLoading={isLoading}
              className="w-full"
            >
              Enter Dining Session
            </Button>
          </div>
        )}

        <div className="pt-4 border-t border-surface-border/50 w-full text-[11px] text-gray-500 font-mono">
          Token: {tableToken.substring(0, 20)}...
        </div>
      </div>
    </div>
  );
}
