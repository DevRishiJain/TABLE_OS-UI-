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

  const { data: sessionData } = useGetSessionQuery(sessionId);
  const { data: exitPass, isLoading, error } = useGetExitPassQuery(sessionId, {
    pollingInterval: 5000,
  });

  const session = sessionData?.session;
  const isSessionPaid =
    session?.status === "PAID" || session?.status === "COMPLETED";

  // Dynamic OTP from exitPass
  const exitCode = exitPass?.otp || "";

  // QR Payload
  const qrPayload = JSON.stringify({
    session_id: sessionId,
    otp: exitCode,
    restaurant_id:
      session?.restaurant_id ||
      process.env.NEXT_PUBLIC_DEFAULT_RESTAURANT_ID ||
      "",
    timestamp: new Date().toISOString(),
  });

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
          className="p-2 rounded-xl bg-surface hover:bg-surface-hover border border-surface-border text-gray-300 flex items-center gap-1 text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Bill</span>
        </Link>
        <Badge variant="gold" size="sm">
          Cryptographically Verified
        </Badge>
      </div>

      {/* Boarding Pass Container */}
      <div className="w-full rounded-3xl bg-surface border-2 border-primary/50 shadow-glow overflow-hidden flex flex-col">
        {/* Top Header Ticket Band */}
        <div className="bg-primary px-6 py-4 flex items-center justify-between text-background">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6" />
            <span className="font-extrabold text-base tracking-tight font-display">
              OFFICIAL EXIT PASS
            </span>
          </div>
          <span className="font-mono text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded bg-background/20">
            Table T1
          </span>
        </div>

        {/* Ticket Body */}
        <div className="p-6 flex flex-col items-center text-center gap-5">
          <div>
            <h2 className="text-xl font-black text-gray-100 font-display">
              The Spice Route
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Verified Dining Clearance • Bill Settled
            </p>
          </div>

          {/* QR Code Container */}
          <div className="p-4 rounded-2xl bg-white shadow-2xl flex items-center justify-center border-4 border-primary">
            <QRCodeSVG
              value={qrPayload}
              size={180}
              level="H"
              includeMargin={false}
            />
          </div>

          {/* 4-Digit OTP Display for Manual Guard Fallback */}
          <div className="flex flex-col items-center gap-1 w-full">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Manual Guard Verification Code
            </span>
            <div className="px-8 py-2.5 rounded-2xl bg-surface-subtle border border-primary/40 text-3xl sm:text-4xl font-black font-mono tracking-widest text-primary shadow-inner">
              {exitCode}
            </div>
            <span className="text-[10px] text-gray-500 mt-1">
              Single-Use Only • Valid for 120 Minutes
            </span>
          </div>

          {/* Perforated Divider Line */}
          <div className="w-full border-t-2 border-dashed border-surface-border my-1 relative">
            <div className="absolute -left-9 -top-3 w-6 h-6 rounded-full bg-background" />
            <div className="absolute -right-9 -top-3 w-6 h-6 rounded-full bg-background" />
          </div>

          {/* Departure Instructions */}
          <div className="flex items-start gap-2.5 text-left p-3 rounded-xl bg-surface-subtle text-xs text-gray-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Present this QR code or 4-digit OTP to the security officer stationed at the restaurant exit.
            </span>
          </div>
        </div>

        {/* Ticket Footer */}
        <div className="bg-surface-subtle px-6 py-3 border-t border-surface-border flex items-center justify-between text-[11px] text-gray-400 font-mono">
          <span>Session: {sessionId.substring(0, 8)}...</span>
          <span className="text-emerald-400 font-bold">STATUS: ISSUED</span>
        </div>
      </div>

      <div className="text-center text-[11px] text-gray-500 pt-2">
        Thank you for dining with The Spice Route. We look forward to hosting you again!
      </div>
    </div>
  );
}
