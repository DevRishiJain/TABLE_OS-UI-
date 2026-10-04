"use client";

import React, { useState, useEffect } from "react";
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
  Package,
  Trash2,
  Percent,
  Clock,
  Car,
  BedDouble,
  Coffee,
  Utensils,
  Phone,
  Mail,
  AlertTriangle,
  Boxes,
  FileSpreadsheet,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ContactConciergeForm } from "@/components/marketing/ContactConciergeForm";
import { THEME_OPTIONS, ThemeKey } from "@/components/providers/RestaurantThemeProvider";
import { useTheme } from "@/components/providers/RestaurantThemeProvider";

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
  const { currentTheme, setTheme, isMounted, colorMode, themePrimaryColor } = useTheme();
  const [activeInventoryTab, setActiveInventoryTab] = useState<"sourcing" | "packaging" | "wastage" | "bom">("sourcing");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col gap-24 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-4">
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="inline-flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/30 flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              2 MONTHS INITIALLY FREE
            </span>
            <span className="text-xs text-gray-400 font-mono">
              Zero Platform Fee • Zero Setup Cost
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] font-display">
            Hospitality Elegance. <br />
            <span
              className="bg-clip-text text-transparent transition-all duration-300 inline-block"
              style={{
                backgroundImage:
                  colorMode === "light"
                    ? "linear-gradient(135deg, var(--theme-primary) 0%, #0F172A 75%)"
                    : "linear-gradient(135deg, var(--theme-primary) 0%, #FFFFFF 55%, var(--theme-primary-hover) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Modern Restaurant OS.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-xl">
            A unified operating platform engineered for fine dining, cafes, drive-in bars, hotels, and cloud kitchens. Seamlessly orchestrate guests, staff, kitchen KDS, raw material sourcing, packaging consumables, and automated wastage control.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="#contact"
              className="px-6 py-3.5 rounded-xl bg-primary text-black font-bold text-sm hover:bg-primary-hover transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>Claim 2 Months Free Trial</span>
            </a>
            <a
              href="#features"
              className="px-6 py-3.5 rounded-xl bg-surface-subtle border border-surface-border text-gray-200 hover:text-white hover:bg-surface-hover transition-all text-sm font-semibold flex items-center gap-2"
            >
              <span>Explore Features</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* 4 Feature Value Props */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-surface-border/60">
            <div className="p-3 rounded-2xl bg-surface/40 border border-surface-border">
              <div className="text-xl sm:text-2xl font-black text-primary font-display">
                2 Months Free
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">Complimentary Trial</div>
            </div>

            <div className="p-3 rounded-2xl bg-surface/40 border border-surface-border">
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-display">
                &lt; 30s
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">Table Turn Initiation</div>
            </div>

            <div className="p-3 rounded-2xl bg-surface/40 border border-surface-border">
              <div className="text-xl sm:text-2xl font-black text-cyan-400 font-display">
                100%
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">Exit Pass Protection</div>
            </div>

            <div className="p-3 rounded-2xl bg-surface/40 border border-surface-border">
              <div className="text-xl sm:text-2xl font-black text-primary font-display">
                Auto BOM
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">Wastage & Sourcing</div>
            </div>
          </div>
        </div>

        {/* 3D Interactive Hero Canvas */}
        <div className="lg:col-span-6 relative">
          <DiningTableScene />
        </div>
      </section>

      {/* SECTION 1: GUEST & DINER EXPERIENCE (#features) */}
      <section id="features" className="flex flex-col gap-8 scroll-mt-24">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary font-mono">
            Guest Experience Suite
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-white">
            Frictionless Ordering. Zero Waiting.
          </h2>
          <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
            Eliminate server delays and lost paper slips. Guests scan a high-resolution table QR code to explore interactive menus, customize dishes, and track meal progress in real time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="flex flex-col justify-between p-6 space-y-4 hover:border-primary/50 transition-all">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-display">
                Instant Mobile Digital Menu
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                High-speed visual menu loading in under a second. Guests filter by dietary preferences (Veg, Non-Veg, Vegan), customize spices & add-ons, and add items directly to a shared table cart.
              </p>
            </div>
            <ul className="space-y-2 text-xs text-gray-300 pt-4 border-t border-surface-border">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero app download required</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Multi-guest synchronized cart</span>
              </li>
            </ul>
          </Card>

          <Card className="flex flex-col justify-between p-6 space-y-4 hover:border-cyan-500/50 transition-all">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-display">
                Visual Menu Digitizer & Concierge
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Take a photo of your printed physical paper menu. The system automatically structures categories, dish titles, prices, descriptions, and tax rates without manual typing.
              </p>
            </div>
            <ul className="space-y-2 text-xs text-gray-300 pt-4 border-t border-surface-border">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Instant paper menu photo onboarding</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Chef recommendation highlights</span>
              </li>
            </ul>
          </Card>

          <Card className="flex flex-col justify-between p-6 space-y-4 hover:border-emerald-500/50 transition-all">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ReceiptText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-display">
                Split Billing & ExitPass Security
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Automated statutory tax breakdown (2.5% CGST / 2.5% SGST). Diners pay via UPI or card, receive a verifiable digital receipt, and generate a cryptographic exit door pass.
              </p>
            </div>
            <ul className="space-y-2 text-xs text-gray-300 pt-4 border-t border-surface-border">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero calculation errors or bill disputes</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Camera-verified exit pass prevents walkouts</span>
              </li>
            </ul>
          </Card>
        </div>
      </section>

      {/* SECTION 2: RAW MATERIAL SOURCING, PACKAGING & WASTAGE CALCULATOR (#inventory) */}
      <section id="inventory" className="flex flex-col gap-8 scroll-mt-24">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary font-mono">
            Kitchen Back-of-House Intelligence
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-white">
            Raw Material Sourcing, Packaging & Wastage Calculator
          </h2>
          <p className="text-sm text-gray-300 max-w-3xl leading-relaxed">
            Every gram of raw ingredient and every piece of packaging matters. Monitor daily supplier procurement, keep count of tissue papers and takeaway boxes, record burnt or spoiled items with the automated wastage calculator, and maintain live plate margins.
          </p>
        </div>

        {/* Interactive Tabs */}
        <div className="flex flex-wrap gap-2 pb-2 border-b border-surface-border">
          {[
            { id: "sourcing" as const, label: "Raw Material Sourcing", icon: Boxes },
            { id: "packaging" as const, label: "Packaging & Consumables", icon: Package },
            { id: "wastage" as const, label: "Automated Wastage Calculator", icon: Trash2 },
            { id: "bom" as const, label: "Recipe BOM & Food Costing", icon: FileSpreadsheet },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeInventoryTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveInventoryTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  isActive
                    ? "bg-primary text-black shadow-md shadow-primary/20"
                    : "bg-surface-subtle text-gray-300 hover:text-white hover:bg-surface-hover border border-surface-border"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Raw Material Sourcing */}
        {activeInventoryTab === "sourcing" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-surface/50 border border-surface-border rounded-3xl p-6 sm:p-8 animate-fade-in">
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-primary">
                <Boxes className="w-4 h-4" />
                <span>Supplier Delivery Intake & Inventory Valuation</span>
              </div>
              <h3 className="text-2xl font-bold font-display text-white">
                Never Run Out of Essential Kitchen Stock
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                Log fresh farm produce, dairy, poultry, seafood, oils, spices, and dry staples as soon as vendor crates arrive at your loading dock. Set automatic re-order alerts so your kitchen never halts service during peak dinner rushes.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border">
                  <div className="text-xs font-bold text-white">Low-Stock Warnings</div>
                  <div className="text-[11px] text-gray-400 mt-1">Alerts when items fall below minimum kg/litre threshold</div>
                </div>
                <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border">
                  <div className="text-xs font-bold text-white">Live Stock Valuation</div>
                  <div className="text-[11px] text-gray-400 mt-1">Real-time total rupee value of all items in your pantry</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="terminal-display bg-[#0e1117] border border-surface-border rounded-2xl p-5 shadow-xl space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-surface-border text-gray-400">
                  <span>RAW MATERIAL</span>
                  <span>CATEGORY</span>
                  <span>ON HAND</span>
                  <span>STATUS</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-surface-border/50 text-gray-200">
                  <span className="font-sans font-semibold text-white">Farm Fresh Paneer</span>
                  <span className="text-gray-400">Dairy</span>
                  <span className="text-primary font-bold">14.5 kg</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Optimal</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-surface-border/50 text-gray-200">
                  <span className="font-sans font-semibold text-white">San Marzano Tomatoes</span>
                  <span className="text-gray-400">Produce</span>
                  <span className="text-amber-400 font-bold">3.2 kg</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Low Stock</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-surface-border/50 text-gray-200">
                  <span className="font-sans font-semibold text-white">Basmati Aged Rice</span>
                  <span className="text-gray-400">Dry Pantry</span>
                  <span className="text-primary font-bold">50.0 kg</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Optimal</span>
                </div>
                <div className="flex items-center justify-between py-2 text-gray-200">
                  <span className="font-sans font-semibold text-white">Extra Virgin Olive Oil</span>
                  <span className="text-gray-400">Oils</span>
                  <span className="text-primary font-bold">18.0 L</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Optimal</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Packaging Materials */}
        {activeInventoryTab === "packaging" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-surface/50 border border-surface-border rounded-3xl p-6 sm:p-8 animate-fade-in">
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400">
                <Package className="w-4 h-4" />
                <span>Takeaway Packaging & Dining Consumables</span>
              </div>
              <h3 className="text-2xl font-bold font-display text-white">
                Tissue Papers, Takeaway Boxes & Disposables
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                Packaging materials are major hidden costs in modern dining and delivery. TableOS tracks tissue paper boxes, dining napkins, biodegradable takeout containers, cups, straws, cutlery packs, and delivery bags with zero guesswork.
              </p>
              <ul className="space-y-2 text-xs text-gray-300 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>Track tissue paper packs & dining table napkins</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>Monitor meal packaging boxes, kraft bags & cups</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>Deduct packaging units automatically per takeaway order</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-6">
              <div className="terminal-display bg-[#0e1117] border border-surface-border rounded-2xl p-5 shadow-xl space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-surface-border text-gray-400">
                  <span>PACKAGING ITEM</span>
                  <span>UNIT</span>
                  <span>QUANTITY</span>
                  <span>REORDER LEVEL</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-surface-border/50 text-gray-200">
                  <span className="font-sans font-semibold text-white">Branded 2-Ply Tissue Napkins</span>
                  <span className="text-gray-400">Boxes (100pcs)</span>
                  <span className="text-cyan-400 font-bold">120 Boxes</span>
                  <span className="text-gray-400">25 Boxes</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-surface-border/50 text-gray-200">
                  <span className="font-sans font-semibold text-white">Kraft Meal Containers (750ml)</span>
                  <span className="text-gray-400">Pieces</span>
                  <span className="text-cyan-400 font-bold">850 Pcs</span>
                  <span className="text-gray-400">200 Pcs</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-surface-border/50 text-gray-200">
                  <span className="font-sans font-semibold text-white">Biryani Clay Handi / Sealed Bowls</span>
                  <span className="text-gray-400">Pieces</span>
                  <span className="text-cyan-400 font-bold">320 Pcs</span>
                  <span className="text-gray-400">50 Pcs</span>
                </div>
                <div className="flex items-center justify-between py-2 text-gray-200">
                  <span className="font-sans font-semibold text-white">Biodegradable Wooden Cutlery Set</span>
                  <span className="text-gray-400">Packets</span>
                  <span className="text-cyan-400 font-bold">500 Pkts</span>
                  <span className="text-gray-400">100 Pkts</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Wastage Calculator */}
        {activeInventoryTab === "wastage" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-surface/50 border border-surface-border rounded-3xl p-6 sm:p-8 animate-fade-in">
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-rose-400">
                <Trash2 className="w-4 h-4" />
                <span>Automated Kitchen Spoilage & Loss Calculator</span>
              </div>
              <h3 className="text-2xl font-bold font-display text-white">
                Calculate Exact Rupee Loss from Spoilage & Burnt Food
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                Unrecorded food waste is the #1 killer of restaurant profit margins. With the TableOS Wastage Calculator, line cooks and head chefs record burnt dishes, expired produce, and transit spillages in 3 seconds. The system immediately calculates rupee loss.
              </p>
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Instant Financial Visibility
                </div>
                <p className="text-rose-300/80 leading-relaxed">
                  Shift reports break down wastage by category: burnt in kitchen, expired in cold storage, or returned by guest. Managers pinpoint exact operational inefficiencies before they compound.
                </p>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="terminal-display bg-[#0e1117] border border-surface-border rounded-2xl p-5 shadow-xl space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-surface-border text-gray-400">
                  <span>WASTED ITEM</span>
                  <span>REASON</span>
                  <span>QTY</span>
                  <span>RUPEE LOSS</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-surface-border/50 text-gray-200">
                  <div>
                    <div className="font-sans font-semibold text-white">Heavy Cream 1L</div>
                    <div className="text-[10px] text-gray-500">Exp. 03 Oct</div>
                  </div>
                  <span className="text-gray-400">Expired in Chiller</span>
                  <span className="text-rose-400">2 Units</span>
                  <span className="text-rose-400 font-bold">₹540.00</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-surface-border/50 text-gray-200">
                  <div>
                    <div className="font-sans font-semibold text-white">Butter Chicken Gravy</div>
                    <div className="text-[10px] text-gray-500">Shift 2 Dinner</div>
                  </div>
                  <span className="text-gray-400">Burnt on Tandoor</span>
                  <span className="text-rose-400">1.5 Litres</span>
                  <span className="text-rose-400 font-bold">₹780.00</span>
                </div>
                <div className="flex items-center justify-between py-2 text-gray-200">
                  <div>
                    <div className="font-sans font-semibold text-white">Burger Buns (Brioche)</div>
                    <div className="text-[10px] text-gray-500">Damaged Pack</div>
                  </div>
                  <span className="text-gray-400">Transit Damage</span>
                  <span className="text-rose-400">12 Pcs</span>
                  <span className="text-rose-400 font-bold">₹240.00</span>
                </div>
                <div className="pt-3 border-t border-surface-border flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-400">TODAY&#39;S WASTAGE LOSS</span>
                  <span className="text-rose-400 text-sm">₹1,560.00</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Recipe BOM */}
        {activeInventoryTab === "bom" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-surface/50 border border-surface-border rounded-3xl p-6 sm:p-8 animate-fade-in">
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Recipe Bill of Materials & Food Costing</span>
              </div>
              <h3 className="text-2xl font-bold font-display text-white">
                Live Plate Margin & Ingredient Depletion
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                Connect each menu dish directly to its underlying ingredient components. Whenever an order is prepared in the kitchen, TableOS automatically depletes exact grams of cheese, meat, spices, and packaging, while showing your gross profit margin percentage.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border">
                  <div className="text-xs font-bold text-emerald-400">Auto Food Cost %</div>
                  <div className="text-[11px] text-gray-400 mt-1">Calculates cost of goods sold (COGS) per dish automatically</div>
                </div>
                <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border">
                  <div className="text-xs font-bold text-emerald-400">Gross Margin %</div>
                  <div className="text-[11px] text-gray-400 mt-1">Identifies top-profit margin dishes vs low-margin items</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="terminal-display bg-[#0e1117] border border-surface-border rounded-2xl p-5 shadow-xl space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-surface-border text-gray-400">
                  <span>DISH NAME</span>
                  <span>MENU PRICE</span>
                  <span>FOOD COST</span>
                  <span>MARGIN %</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-surface-border/50 text-gray-200">
                  <span className="font-sans font-semibold text-white">Paneer Butter Masala</span>
                  <span className="text-gray-300">₹360.00</span>
                  <span className="text-amber-400">₹94.20</span>
                  <span className="text-emerald-400 font-bold">73.8%</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-surface-border/50 text-gray-200">
                  <span className="font-sans font-semibold text-white">Murgh Tikka Angara</span>
                  <span className="text-gray-300">₹440.00</span>
                  <span className="text-amber-400">₹128.50</span>
                  <span className="text-emerald-400 font-bold">70.8%</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-surface-border/50 text-gray-200">
                  <span className="font-sans font-semibold text-white">Dal Makhani Heritage</span>
                  <span className="text-gray-300">₹290.00</span>
                  <span className="text-amber-400">₹58.00</span>
                  <span className="text-emerald-400 font-bold">80.0%</span>
                </div>
                <div className="flex items-center justify-between py-2 text-gray-200">
                  <span className="font-sans font-semibold text-white">Truffle Mushroom Risotto</span>
                  <span className="text-gray-300">₹520.00</span>
                  <span className="text-amber-400">₹145.60</span>
                  <span className="text-emerald-400 font-bold">72.0%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 3: OPERATIONS COMMAND (#operations) */}
      <section id="operations" className="flex flex-col gap-8 scroll-mt-24">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
            Front & Back-of-House Harmony
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-white">
            Dedicated Station Command. Zero Chaos.
          </h2>
          <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
            Every staff member gets a purpose-built, high-contrast touch interface optimized for speed and resilience under rush hours.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="flex flex-col justify-between p-6 space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-display">
                Floor & Waiter Terminal
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Color-coded interactive table grid. First-order OTP verification, walk-in guest initiation, live table occupancy, order acceptance, and offline Cash/POS settlements.
              </p>
            </div>
            <div className="pt-4 border-t border-surface-border text-xs text-sky-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Instant table seating & cash settlement</span>
            </div>
          </Card>

          <Card className="flex flex-col justify-between p-6 space-y-4 hover:border-primary/50 transition-all">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <ChefHat className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-display">
                Kitchen Display System (KDS)
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Touch-first kitchen Kanban screen. 60px+ touch targets advancing tickets: Incoming → Preparing → Ready → Served. Eliminates thermal printer paper jams and lost orders.
              </p>
            </div>
            <div className="pt-4 border-t border-surface-border text-xs text-primary font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Real-time prep timer & audio chimes</span>
            </div>
          </Card>

          <Card className="flex flex-col justify-between p-6 space-y-4">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-display">
                Exit Gate Pass Scanner
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Single-purpose camera scanner with 4-digit manual OTP fallback. Verifies that every departing guest holds an authentic paid digital receipt. Completely eliminates walkouts.
              </p>
            </div>
            <div className="pt-4 border-t border-surface-border text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>100% walkout loss elimination</span>
            </div>
          </Card>
        </div>
      </section>

      {/* SECTION 4: MULTI-VENUE CONCEPTS (#venues) */}
      <section id="venues" className="flex flex-col gap-8 scroll-mt-24">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400 font-mono">
            Hospitality Versatility
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-white">
            Configured for Every Dining Concept
          </h2>
          <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
            Whether running a drive-in car-o-bar, luxury hotel room service, rooftop cocktail lounge, or high-volume cloud kitchen, TableOS adapts effortlessly.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-5 rounded-2xl bg-surface border border-surface-border space-y-3 hover:border-primary/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Utensils className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Fine Dine Restaurant</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Table seating, pacing multi-course meals, sommelier drink recommendations, and split payments.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-surface-border space-y-3 hover:border-cyan-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Car className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Drive-In / Car-O-Bar</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Universal parking bay QR code. Guests order appetizers & drinks directly from their car without waiter delays.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-surface-border space-y-3 hover:border-amber-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Coffee className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Cafe & Bakery</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Rapid counter ordering, pastry inventory tracking, takeaway packaging, and custom coffee notes.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-surface-border space-y-3 hover:border-purple-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <BedDouble className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Hotel Room Service</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              In-room dining QR cards, suite number routing, centralized kitchen routing, and checkout billing.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-surface-border space-y-3 hover:border-emerald-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Boxes className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Cloud Kitchen / QSR</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Multi-brand batch ticket routing, centralized packaging stock, rapid prep times, and dispatch alerts.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 5: BRAND THEMES & ATMOSPHERE PALETTE */}
      <section className="flex flex-col gap-8 bg-surface/40 border border-surface-border rounded-3xl p-6 sm:p-10 relative overflow-hidden">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary font-mono">
            Unique Identity For Every Restaurant
          </span>
          <h2 className="text-3xl font-bold font-display text-white">
            Custom Restaurant Ambiance Themes
          </h2>
          <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
            Every hospitality partner selects their brand ambiance palette during onboarding. When guests or staff enter your restaurant handle (e.g. <span className="font-mono text-primary font-bold">@spiceroute</span>), the entire platform automatically adopts your venue colors.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {THEME_OPTIONS.map((t) => {
            const isSelected = mounted ? currentTheme === t.key : t.key === "gold";
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTheme(t.key)}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/40 bg-surface shadow-glow"
                    : "border-surface-border bg-surface-subtle hover:border-gray-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    suppressHydrationWarning
                    className="w-7 h-7 rounded-full border border-white/20 shadow-sm flex items-center justify-center shrink-0"
                    style={{ backgroundColor: t.primaryColor }}
                  >
                    {isSelected && <Check className="w-4 h-4 text-black stroke-[3]" />}
                  </div>
                  {isSelected && (
                    <span
                      suppressHydrationWarning
                      className="text-[10px] font-bold text-primary font-mono uppercase"
                    >
                      Previewing
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-white font-display">
                    {t.name}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 leading-snug">
                    {t.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 6: CONTACT CONCIERGE & DEMO REQUEST FORM (#contact) */}
      <ContactConciergeForm />
    </div>
  );
}
