"use client";

import React from "react";
import Link from "next/link";
import { useAppSelector, useAppDispatch } from "@/store";
import { addToast } from "@/store/slices/uiSlice";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  CheckCircle2,
  Store,
  QrCode,
  FileText,
  Users,
  ShieldCheck,
  Rocket,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from "lucide-react";

export default function RestaurantOnboardingPipelinePage() {
  const dispatch = useAppDispatch();
  const restaurantName = useAppSelector((state) => state.auth.restaurantName) || "The Spice Route";
  const storedCount = typeof window !== "undefined" ? Number(localStorage.getItem("tableos_table_count")) || 8 : 8;

  const steps = [
    {
      id: 1,
      title: "Restaurant Brand Identity & Legal Details",
      description: `Entity profile configured for ${restaurantName}, GSTIN 07AABCG1234F1Z5, Connaught Place location.`,
      status: "Verified",
      link: "/restaurant/settings",
      linkText: "Edit Profile",
      icon: Store,
    },
    {
      id: 2,
      title: "Table Provisioning & Scannable QR Cards",
      description: `${storedCount} dining tables provisioned with vector QR codes and direct ordering tokens.`,
      status: "Active",
      link: "/restaurant/tables",
      linkText: "View & Print QRs",
      icon: QrCode,
    },
    {
      id: 3,
      title: "Digital Menu Catalog & Tax Rules",
      description: "Gemini 3.6 Flash parsed dishes with 5% GST (2.5% CGST + 2.5% SGST) applied.",
      status: "Cataloged",
      link: "/restaurant/menu",
      linkText: "Menu Studio",
      icon: FileText,
    },
    {
      id: 4,
      title: "Staff Roster & Auto Employee IDs",
      description: "Key operational roles provisioned with Employee IDs (Waiters, Chefs, Cashier).",
      status: "Provisioned",
      link: "/restaurant/staff",
      linkText: "Staff Directory",
      icon: Users,
    },
    {
      id: 5,
      title: "Daily Settlement Payout Route",
      description: "Direct bank account verified for daily 99% net proceeds distribution via payment gateway.",
      status: "Verified",
      link: "/restaurant/settlements",
      linkText: "Payout Settings",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-100 flex items-center gap-2.5">
            <CheckCircle2 className="w-6 h-6 text-primary" />
            {restaurantName} • Onboarding Status
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            5-step production readiness checklist for contactless ordering and shift operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success" size="md">
            100% Operational & Live
          </Badge>
          <Link
            href="/signup"
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-primary text-black hover:bg-primary/90 transition-all flex items-center gap-1 font-mono"
          >
            <Sparkles className="w-3.5 h-3.5" /> Launch Another Branch
          </Link>
        </div>
      </div>

      {/* Step Cards */}
      <div className="flex flex-col gap-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className="p-4 rounded-2xl bg-surface border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md hover:border-primary/40 transition-all"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-100 font-display flex items-center gap-2">
                    Step {step.id}: {step.title}
                    <Badge variant="success" size="sm">
                      {step.status}
                    </Badge>
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              <Link
                href={step.link}
                className="self-end sm:self-center px-3 py-1.5 rounded-xl bg-surface-subtle hover:bg-surface-hover border border-surface-border text-xs text-primary font-mono flex items-center gap-1 shrink-0"
              >
                <span>{step.linkText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          );
        })}
      </div>

      {/* Quick Launch Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-surface to-surface border-2 border-primary/40 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-glow">
        <div>
          <h3 className="text-base font-bold font-display text-gray-100">
            Operations Are Active Across All Terminals
          </h3>
          <p className="text-xs text-gray-300 mt-1 max-w-lg leading-relaxed">
            Waiters can log in at <code className="text-amber-400 font-mono">/staff/login</code>, kitchen KDS is live at <code className="text-amber-400 font-mono">/kitchen/queue</code>, and customers can scan tables directly.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/staff/login"
            className="px-4 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20"
          >
            <Users className="w-4 h-4" /> Open Staff Station
          </Link>
          <Link
            href="/restaurant/tables"
            className="px-4 py-2.5 rounded-xl bg-surface border border-surface-border hover:border-primary text-gray-200 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <QrCode className="w-4 h-4 text-primary" /> Print Table QRs
          </Link>
        </div>
      </div>
    </div>
  );
}
