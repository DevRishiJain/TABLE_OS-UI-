"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useGetExitPassQuery, useGetSessionQuery } from "@/store/api/customerApi";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Utensils,
  Lock,
  Download,
} from "lucide-react";

export default function CustomerExitPassPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const { data: sessionData, error: sessionError } = useGetSessionQuery(sessionId, {
    pollingInterval: 2500,
  });
  const { data: exitPass, isLoading, error: exitPassError } = useGetExitPassQuery(sessionId, {
    pollingInterval: 2500,
  });

  const isSessionGone =
    (sessionError as any)?.status === 410 ||
    (exitPassError as any)?.status === 410 ||
    JSON.stringify(sessionError || {}).includes("session has closed") ||
    JSON.stringify(exitPassError || {}).includes("session has closed");

  const session = sessionData?.session;
  const isCompleted =
    isSessionGone ||
    session?.status === "COMPLETED" ||
    exitPass?.status === "VERIFIED";

  // Dynamic OTP from exitPass or session details
  const backendOtp =
    exitPass?.otp ||
    (sessionData as any)?.exit_otp ||
    (sessionData as any)?.exit_pass?.otp ||
    (session as any)?.exit_otp ||
    "";

  const [exitCode, setExitCode] = React.useState<string>("");

  React.useEffect(() => {
    if (backendOtp) {
      setExitCode(backendOtp);
      if (typeof window !== "undefined") {
        localStorage.setItem(`table_os_exit_code_${sessionId}`, backendOtp);
      }
    } else if (typeof window !== "undefined") {
      const cached = localStorage.getItem(`table_os_exit_code_${sessionId}`);
      if (cached) setExitCode(cached);
    }
  }, [backendOtp, sessionId]);

  // QR Payload (stabilized without unstable timestamps)
  const qrPayload = React.useMemo(() => {
    return JSON.stringify({
      session_id: sessionId,
      otp: exitCode,
      restaurant_id:
        session?.restaurant_id ||
        process.env.NEXT_PUBLIC_DEFAULT_RESTAURANT_ID ||
        "",
    });
  }, [sessionId, exitCode, session?.restaurant_id]);

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center gap-4">
        <Skeleton className="w-full h-96 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-8">
      <div className="flex items-center justify-between">
        <Link
          href={`/dine/${sessionId}/bill`}
          className="p-2 rounded-xl glass-pill hover:bg-white/10 text-gray-200 flex items-center gap-1.5 text-xs shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Bill</span>
        </Link>
        <Badge variant={isCompleted ? "success" : "gold"} size="sm">
          {isCompleted ? "Session Has Closed ✅" : "Cryptographically Verified"}
        </Badge>
      </div>

      {/* Spatial Boarding Pass Container */}
      <div className={`w-full rounded-3xl glass-spatial specular-rim border ${isCompleted ? "border-emerald-500/50 shadow-2xl shadow-emerald-500/10" : "border-white/15 shadow-2xl"} overflow-hidden flex flex-col relative`}>
        {/* Top Header Ticket Band */}
        <div className={`${isCompleted ? "bg-gradient-to-r from-emerald-600/90 to-emerald-500/90 text-white border-b border-emerald-400/30" : "bg-gradient-to-r from-primary to-amber-500 text-background border-b border-amber-400/30"} px-6 py-4 flex items-center justify-between backdrop-blur-xl`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 drop-shadow-sm" />
            <span className="font-extrabold text-base tracking-tight font-display drop-shadow-sm">
              {isCompleted ? "SESSION HAS CLOSED • EXIT APPROVED" : "OFFICIAL EXIT PASS"}
            </span>
          </div>
          <span className="font-mono text-xs font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10">
            Table T1
          </span>
        </div>

        {/* Ticket Body */}
        <div className="p-6 flex flex-col items-center text-center gap-5">
          <div>
            <h2 className="text-xl font-black text-gray-100 font-display tracking-tight">
              The Spice Route
            </h2>
            <p className="text-xs text-gray-300 mt-0.5">
              Verified Dining Clearance • Bill Settled
            </p>
          </div>

          {isCompleted ? (
            /* Session Closed & 1-Click Approved Exit Clearance Stamp */
            <div className="w-full p-6 rounded-2xl glass-emerald flex flex-col items-center text-center gap-4 text-emerald-300 animate-fadeIn specular-rim">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400/50 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold uppercase tracking-wider mb-2 border border-emerald-500/40 backdrop-blur-md">
                  SESSION HAS CLOSED 🚪✨
                </span>
                <h3 className="text-xl font-black font-display tracking-tight text-emerald-200">
                  EXIT APPROVED WITH GATE PASS 🎉
                </h3>
                <p className="text-xs text-emerald-100/90 mt-2 max-w-xs leading-relaxed mx-auto">
                  Your dining session has officially closed. Your exit pass was verified and approved by the floor team. You may depart freely.
                </p>
              </div>

              <div className="w-full p-3.5 rounded-xl bg-black/40 backdrop-blur-md border border-emerald-500/30 flex flex-col gap-2 text-xs text-left">
                <div className="flex justify-between items-center text-gray-300">
                  <span>Session Status:</span>
                  <span className="text-emerald-300 font-bold font-mono">CLOSED & FINALIZED</span>
                </div>
                <div className="flex justify-between items-center text-gray-300">
                  <span>Floor Clearance:</span>
                  <span className="text-emerald-300 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approved by Waiter
                  </span>
                </div>
                {exitCode && (
                  <div className="flex justify-between items-center text-gray-300">
                    <span>Gate Pass Code:</span>
                    <span className="font-mono text-white font-bold tracking-widest">{exitCode}</span>
                  </div>
                )}
              </div>

              <span className="px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold font-mono border border-emerald-500/40 backdrop-blur-md shadow-sm">
                GOOD TO GO AHEAD! 🚪✅
              </span>
            </div>
          ) : (
            <>
              {/* QR Code Container on Floating Glass Pedestal */}
              <div className="p-4 rounded-3xl bg-white shadow-2xl flex items-center justify-center border-4 border-amber-400/80 shadow-primary/20">
                <QRCodeSVG
                  value={qrPayload}
                  size={180}
                  level="H"
                  includeMargin={false}
                />
              </div>

              {/* 4-Digit OTP Display in Spatial Glass Capsule */}
              <div className="flex flex-col items-center gap-1.5 w-full">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Manual Verification Code
                </span>
                <div className="px-8 py-3 rounded-2xl glass-pill border-2 border-primary/50 text-3xl sm:text-4xl font-black font-mono tracking-widest text-primary shadow-glow flex items-center justify-center min-w-[160px] min-h-[56px]">
                  {exitCode || (
                    <span className="text-xs font-mono font-medium text-primary/80 animate-pulse">
                      GENERATING...
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 mt-1">
                  Valid for 15+ Minutes • Single-Use Only
                </span>
              </div>
            </>
          )}

          {/* Perforated Divider Line */}
          <div className="w-full border-t-2 border-dashed border-white/10 my-1 relative">
            <div className="absolute -left-9 -top-3 w-6 h-6 rounded-full bg-background" />
            <div className="absolute -right-9 -top-3 w-6 h-6 rounded-full bg-background" />
          </div>

          {/* Departure Instructions */}
          <div className="flex items-start gap-2.5 text-left p-3.5 rounded-2xl glass-pill text-xs text-gray-200 w-full border border-white/10">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              {isCompleted
                ? "You may exit the restaurant freely. Have a wonderful day!"
                : "Present this QR code or 4-digit code to the waiter or exit guard."}
            </span>
          </div>
        </div>

        {/* Ticket Footer */}
        <div className="glass-panel px-6 py-3.5 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-300 font-mono">
          <span>Session: {sessionId.substring(0, 8)}...</span>
          <span className={`font-bold ${session?.status === "COMPLETED" ? "text-emerald-400" : "text-amber-400"}`}>
            STATUS: {session?.status === "COMPLETED" ? "SESSION CLOSED ✅" : "ISSUED 🎟️"}
          </span>
        </div>
      </div>

      <div className="text-center text-[11px] text-gray-500 pt-2">
        Thank you for dining with The Spice Route. We look forward to hosting you again!
      </div>
    </div>
  );
}
