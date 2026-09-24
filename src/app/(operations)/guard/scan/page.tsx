"use client";

import React, { useState } from "react";
import { useVerifyExitMutation } from "@/store/api/guardApi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import {
  ShieldCheck,
  ShieldAlert,
  Camera,
  KeyRound,
  CheckCircle2,
  XCircle,
  Hash,
} from "lucide-react";

export default function GuardScanPage() {
  const [verifyExit, { isLoading }] = useVerifyExitMutation();

  const [otp, setOtp] = useState("");
  const [sessionIdInput, setSessionIdInput] = useState("");
  const [verificationResult, setVerificationResult] = useState<{
    status: "APPROVED" | "DENIED";
    reason?: string;
  } | null>(null);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sessionIdInput.trim() || otp.trim().length !== 4) return;

    try {
      const resp = await verifyExit({
        session_id: sessionIdInput.trim(),
        otp: otp.trim(),
      }).unwrap();

      if (resp.result === "APPROVED") {
        setVerificationResult({ status: "APPROVED" });
      } else {
        setVerificationResult({
          status: "DENIED",
          reason: resp.reason || "UNAUTHORIZED_EXIT",
        });
      }
    } catch (err: unknown) {
      console.error("Verification failed:", err);
      setVerificationResult({
        status: "DENIED",
        reason: "INVALID_PASS_CREDENTIALS",
      });
    }
  };

  const resetScanner = () => {
    setVerificationResult(null);
    setOtp("");
    setSessionIdInput("");
  };

  // Full-Screen Binary Result Overlay
  if (verificationResult) {
    const isApproved = verificationResult.status === "APPROVED";

    return (
      <div
        className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-8 text-center animate-in zoom-in-95 duration-200 ${
          isApproved
            ? "bg-emerald-950 text-emerald-100"
            : "bg-red-950 text-red-100"
        }`}
      >
        <div className="pt-8 flex flex-col items-center gap-2">
          <span className="text-xs uppercase tracking-widest font-mono font-bold opacity-75">
            Security Gate Verification
          </span>
          <div className="font-mono text-sm opacity-60">
            Session: {sessionIdInput ? `${sessionIdInput.substring(0, 16)}...` : "—"}
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 my-auto">
          <div
            className={`w-32 h-32 rounded-3xl flex items-center justify-center shadow-2xl border-4 ${
              isApproved
                ? "bg-emerald-500 text-black border-emerald-400"
                : "bg-red-600 text-white border-red-500 animate-bounce"
            }`}
          >
            {isApproved ? (
              <CheckCircle2 className="w-20 h-20" />
            ) : (
              <XCircle className="w-20 h-20" />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight font-display">
              {isApproved ? "PASS APPROVED" : "EXIT DENIED"}
            </h1>
            <p className="text-lg font-medium opacity-90">
              {isApproved
                ? "Guest Authorized to Depart."
                : `Flagged: ${verificationResult.reason}`}
            </p>
          </div>
        </div>

        <div className="w-full max-w-sm pb-8">
          <button
            onClick={resetScanner}
            className={`w-full py-5 rounded-2xl font-black text-lg uppercase tracking-wider select-none shadow-2xl active:scale-[0.98] transition-transform ${
              isApproved
                ? "bg-white text-emerald-950 hover:bg-gray-100"
                : "bg-white text-red-950 hover:bg-gray-100"
            }`}
          >
            Scan Next Guest
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-6">
      {/* Viewfinder Frame */}
      <div className="w-full max-w-sm aspect-video rounded-3xl border-2 border-dashed border-gray-600 bg-surface/50 relative overflow-hidden flex flex-col items-center justify-center p-6 shadow-2xl">
        {/* Animated Laser Scanning Beam */}
        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse top-1/2 -translate-y-1/2 shadow-[0_0_15px_#10B981]" />

        {/* Viewfinder Corners */}
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-emerald-400" />
        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-emerald-400" />
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-emerald-400" />
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-emerald-400" />

        <div className="flex flex-col items-center text-center gap-2 pointer-events-none">
          <Camera className="w-10 h-10 text-gray-500 animate-pulse" />
          <span className="text-xs text-gray-400 font-mono">
            Aim optical scanner at customer's ExitPass QR code
          </span>
        </div>
      </div>

      {/* Manual Verification Form */}
      <Card className="w-full max-w-sm p-6 flex flex-col gap-4 border-surface-border">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200">
            Exit Pass Verification
          </h3>
        </div>

        <p className="text-xs text-gray-400">
          Enter the Session ID and the diner's 4-digit departure code from their pass.
        </p>

        <form onSubmit={handleVerify} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-gray-400 uppercase font-semibold">
              Session ID
            </label>
            <Input
              value={sessionIdInput}
              onChange={(e) => setSessionIdInput(e.target.value)}
              placeholder="e.g. 32af184e-..."
              className="font-mono text-xs"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-gray-400 uppercase font-semibold">
              4-Digit Exit Code
            </label>
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="0000"
              maxLength={4}
              className="font-mono text-center tracking-widest text-xl font-bold"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={!sessionIdInput.trim() || otp.length !== 4}
            isLoading={isLoading}
            className="w-full mt-2 font-bold"
            leftIcon={<ShieldCheck className="w-4 h-4" />}
          >
            Verify Exit Pass
          </Button>
        </form>
      </Card>
    </div>
  );
}
