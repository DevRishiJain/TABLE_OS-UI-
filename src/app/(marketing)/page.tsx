"use client";

import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  QrCode,
  Sparkles,
  ShieldCheck,
  ChefHat,
  ReceiptText,
  LineChart,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

// Dynamic Three.js scene with zero layout-shift fallback
const DiningTableScene = dynamic(
  () =>
    import("@/components/3d/DiningTableScene").then(
      (mod) => mod.DiningTableScene
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[460px] md:h-[540px] rounded-3xl bg-surface border border-surface-border flex flex-col items-center justify-center p-8">
        <Skeleton className="w-24 h-24 rounded-2xl mb-4" />
        <Skeleton className="w-48 h-6 rounded-lg mb-2" />
        <Skeleton className="w-64 h-4 rounded-lg" />
      </div>
    ),
  }
);

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-24 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-6">
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="inline-flex items-center gap-2">
            <Badge variant="gold" dot>
              TableOS Production V5
            </Badge>
            <span className="text-xs text-gray-400 font-mono">
              Live on AWS EC2
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-100 tracking-tight leading-[1.1] font-display">
            Hospitality Elegance. <br />
            <span className="bg-gradient-to-r from-amber-400 via-primary to-yellow-500 bg-clip-text text-transparent">
              Precision Engineering.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-xl">
            A single-codebase operating system eliminating wait times, order discrepancies, and walkout fraud. Seamlessly orchestrates diners, servers, head chefs, and door security.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="/signup">
              <Button size="lg" variant="gold" leftIcon={<Sparkles className="w-5 h-5" />}>
                Onboard Restaurant (5 Steps)
              </Button>
            </Link>
            <Link href="/staff/login">
              <Button size="lg" variant="secondary" leftIcon={<ShieldCheck className="w-5 h-5 text-amber-400" />}>
                Floor Staff Terminal
              </Button>
            </Link>
            <Link href="/t/table-qr-token-spice-route-01">
              <Button size="lg" variant="outline" leftIcon={<QrCode className="w-5 h-5" />}>
                Scan QR Demo
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-surface-border/60">
            <div>
              <div className="text-2xl font-extrabold text-primary font-display">
                0%
              </div>
              <div className="text-xs text-gray-400">Payment Fraud Risk</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-gray-100 font-display">
                1.0%
              </div>
              <div className="text-xs text-gray-400">Transparent Platform Fee</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-emerald-400 font-display">
                &lt; 30s
              </div>
              <div className="text-xs text-gray-400">Table Turn Initiation</div>
            </div>
          </div>
        </div>

        {/* 3D Interactive Hero Canvas */}
        <div className="lg:col-span-6 relative">
          <DiningTableScene />
        </div>
      </section>

      {/* Role Suite Grid */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <Badge variant="default" className="w-fit">
            Unified Multi-Role Architecture
          </Badge>
          <h2 className="text-3xl font-bold font-display text-gray-100">
            Four Dedicated Interfaces. One Master Ledger.
          </h2>
          <p className="text-sm text-gray-400 max-w-2xl">
            No fragmented micro-apps or brittle integrations. Built with Next.js 14 App Router route groups.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Customer Journey */}
          <Card hoverable className="flex flex-col justify-between">
            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-100 font-display">
                1. Mobile Diner
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Table QR scan to instant digital menu. AI semantic dish recommendations, first-order 4-digit OTP, and digital ExitPass.
              </p>
            </div>
            <div className="pt-6 border-t border-surface-border/50 mt-6">
              <Link
                href="/t/table-qr-token-spice-route-01"
                className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1"
              >
                Scan Table T1 QR <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>

          {/* Floor Staff */}
          <Card hoverable className="flex flex-col justify-between">
            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-100 font-display">
                2. Floor & Waiter
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Color-coded interactive table floor grid. First-order OTP verification, incoming order acceptance, and offline Cash/POS confirmation.
              </p>
            </div>
            <div className="pt-6 border-t border-surface-border/50 mt-6">
              <Link
                href="/staff/tables"
                className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                Open Table Floor Grid <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>

          {/* Kitchen Display */}
          <Card hoverable className="flex flex-col justify-between">
            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ChefHat className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-100 font-display">
                3. Kitchen KDS
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                High-contrast kitchen tablet Kanban. 60px+ touch targets advancing orders: Accepted → Preparing → Ready → Served.
              </p>
            </div>
            <div className="pt-6 border-t border-surface-border/50 mt-6">
              <Link
                href="/kitchen/queue"
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                Launch KDS Tablet <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>

          {/* Security Guard */}
          <Card hoverable className="flex flex-col justify-between">
            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-100 font-display">
                4. Exit Guard
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Single-purpose camera scanner with 4-digit manual OTP fallback. Cryptographically enforces paid bills with binary APPROVED / DENIED display.
              </p>
            </div>
            <div className="pt-6 border-t border-surface-border/50 mt-6">
              <Link
                href="/guard/scan"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                Open Guard Scanner <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Intelligence & Platform Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex flex-col gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-gray-100 font-display">
            Google Gemini 3.6 Flash AI
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Drag-and-drop physical restaurant menu photos. AI automatically parses categories, items, prices, and GST rates into PostgreSQL and MinIO. Diners can ask natural language questions in real time.
          </p>
        </Card>

        <Card className="flex flex-col gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ReceiptText className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-gray-100 font-display">
            Immutable Financial Authority
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Zero frontend financial calculations. Round-Half-Up integer minor units (paise), 2.5% CGST / 2.5% SGST statutory breakup, and an immutable 1% platform fee payable ledger.
          </p>
        </Card>

        <Card className="flex flex-col gap-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
            <LineChart className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-gray-100 font-display">
            7x Deep Analytics Suite
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Today sales curves, month-to-date trajectory, period comparison, 7x24 peak hours heatmap, 7-day moving-average forecast, table turn-times, and menu item velocity.
          </p>
        </Card>
      </section>

      {/* Quick Launch CTA Banner */}
      <div className="rounded-3xl glass-card border border-primary/40 p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-glow">
        <div className="flex flex-col gap-2 max-w-xl">
          <h3 className="text-2xl sm:text-3xl font-bold font-display text-gray-100">
            Ready to test the live platform?
          </h3>
          <p className="text-sm text-gray-300">
            Scan the demo table QR token or log in with one-click test credentials to review the complete multi-role system.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button size="lg" variant="gold">
              Launch Staff Sign-In
            </Button>
          </Link>
          <Link href="/t/table-qr-token-spice-route-01">
            <Button size="lg" variant="secondary">
              Diner Demo
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
