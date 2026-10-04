"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useGetExitPassQuery, useGetSessionQuery } from "@/store/api/customerApi";
import { useAppSelector } from "@/store";
import { formatMoney } from "@/lib/money";

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
  const customerName =
    useAppSelector((state) => state.auth.customerName) ||
    session?.customer_name ||
    "";
  const restaurantName =
    useAppSelector((state) => state.auth.restaurantName) ||
    (session as any)?.restaurant_name ||
    "The Spice Route";

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

  const [exitCode, setExitCode] = useState<string>("");
  const [showPassReceipt, setShowPassReceipt] = useState<boolean>(false);

  useEffect(() => {
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

  // QR Payload
  const qrPayload = useMemo(() => {
    return JSON.stringify({
      session_id: sessionId,
      otp: exitCode,
      restaurant_id:
        session?.restaurant_id ||
        process.env.NEXT_PUBLIC_DEFAULT_RESTAURANT_ID ||
        "",
    });
  }, [sessionId, exitCode, session?.restaurant_id]);

  const tableNumber = (session as any)?.table_number || "4";
  const guestCount = (session as any)?.guest_count || 2;
  const vehicleNumber = (session as any)?.vehicle_number || (session as any)?.car_number || "";
  const finalTotalMinor = session?.final_total?.amount_minor_units || 0;

  const restaurantInitials = restaurantName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "SR";

  if (isLoading) {
    return (
      <div style={{ paddingTop: 6 }}>
        <div className="bk">
          <Link href={`/dine/${sessionId}/bill`} className="b i" aria-label="Back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.2rem", height: "1.2rem" }}>
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </Link>
          <h2>Exit pass</h2>
        </div>
        <div className="cd" style={{ height: 350, opacity: 0.5, marginTop: 12 }} />
      </div>
    );
  }

  // If completed/approved and not explicitly viewing the receipt pass: show thanks view matching reference HTML
  if (isCompleted && !showPassReceipt) {
    return (
      <div className="wl ct g" style={{ alignContent: "center", minHeight: "80vh", padding: "20px 0" }}>
        <div className="ck">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "2.2rem", height: "2.2rem" }}>
            <path d="M5 12l5 5 9-10" />
          </svg>
        </div>
        <div>
          <span className="tag">Session closed · exit approved</span>
          <h1 style={{ marginTop: 14 }}>
            Thank you{customerName ? `, ${customerName}` : ""}
          </h1>
          <p className="mu" style={{ margin: "12px auto 0" }}>
            We loved hosting you. Have a safe journey and see you again soon.
          </p>
        </div>
        <div className="ft">Atithi Devo Bhava</div>
        <div className="cd" style={{ textAlign: "left" }}>
          <div className="it">
            <span className="mu">Table</span>
            <b>{tableNumber}</b>
          </div>
          <div className="it">
            <span className="mu">Paid in full</span>
            <b>{formatMoney(finalTotalMinor)}</b>
          </div>
          <div className="it">
            <span className="mu">Exit code</span>
            <b>{exitCode || "----"}</b>
          </div>
        </div>

        <Link href={`/dine/${sessionId}/menu`} className="b p">
          Start a new visit
        </Link>
        <button
          type="button"
          className="b o"
          onClick={() => setShowPassReceipt(true)}
        >
          View exit pass receipt
        </button>
      </div>
    );
  }

  // Active / Pass View matching reference HTML
  return (
    <div style={{ paddingTop: 6 }}>
      {/* Top Header */}
      <div className="bk">
        <Link
          href={`/dine/${sessionId}/bill`}
          className="b i"
          aria-label="Back"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1.2rem", height: "1.2rem" }}>
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </Link>
        <h2>Exit pass</h2>
      </div>

      {/* Perforated Receipt Card */}
      <div className="rp ct" style={{ marginTop: 10 }}>
        <div className="lg" style={{ margin: "0 auto 8px" }}>
          {restaurantInitials}
        </div>
        <h3 style={{ fontSize: "1.6rem" }}>{restaurantName}</h3>
        <span className="mu sm">Verified dining clearance · bill settled</span>

        {/* QR Code Container */}
        <div className="pz">
          <QRCodeSVG
            value={qrPayload}
            size={176}
            level="H"
            includeMargin={false}
          />
        </div>

        {/* 4-Digit Exit Code */}
        {exitCode ? (
          <div className="cn" aria-label={`Exit code ${exitCode}`}>
            {exitCode.split("").map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </div>
        ) : (
          <div className="say" style={{ justifyContent: "center" }}>
            Generating code...
          </div>
        )}

        <div className="dv" />

        <div className="it">
          <span className="mu">Table</span>
          <b>{tableNumber}</b>
        </div>
        <div className="it">
          <span className="mu">Guest</span>
          <b>{customerName || "Guest"} · {guestCount}</b>
        </div>
        {vehicleNumber && (
          <div className="it">
            <span className="mu">Vehicle</span>
            <b>{vehicleNumber}</b>
          </div>
        )}
        <div className="it">
          <span className="mu">Amount paid</span>
          <b>{formatMoney(finalTotalMinor)}</b>
        </div>

        <div className="dv" />

        <span
          className={`tag ${isCompleted ? "" : "pl"}`}
          style={{
            display: "inline-block",
            padding: "8px 16px",
            fontSize: ".9rem",
          }}
        >
          {isCompleted ? "Exit approved" : "Waiting for staff to approve"}
        </span>

        <p className="mu sm" style={{ marginTop: 10 }}>
          Show this to the floor team at the exit.
        </p>

        {isCompleted && (
          <button
            type="button"
            className="b p"
            style={{ marginTop: 16 }}
            onClick={() => setShowPassReceipt(false)}
          >
            Back to thank you screen
          </button>
        )}
      </div>
    </div>
  );
}
