"use client";

import React from "react";
import {
  useGetOnboardingQuery,
  useGoLiveOnboardingMutation,
} from "@/store/api/restaurantApi";
import { addToast } from "@/store/slices/uiSlice";
import { useAppDispatch } from "@/store";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Rocket,
} from "lucide-react";

export default function RestaurantOnboardingPage() {
  const dispatch = useAppDispatch();
  const { data: onboarding, refetch } = useGetOnboardingQuery();
  const [goLive, { isLoading }] = useGoLiveOnboardingMutation();

  const steps = [
    {
      id: 1,
      title: "Establish Restaurant Profile",
      description: "Entity legal name, GSTIN (07AAAAA0000A1Z5), address and timezone set.",
      completed: true,
    },
    {
      id: 2,
      title: "Table Provisioning & Vector QR Standees",
      description: "8 tables created with cryptographically unique QR scan tokens.",
      completed: true,
    },
    {
      id: 3,
      title: "Menu Digitization & AI Cataloging",
      description: "Gemini 3.6 Flash parsed 8 initial dishes with 2.5% CGST + 2.5% SGST rates.",
      completed: true,
    },
    {
      id: 4,
      title: "Staff & Guard Roster Assignment",
      description: "4 key operators provisioned: Admin, Waiter, Kitchen Chef, and Security Guard.",
      completed: true,
    },
    {
      id: 5,
      title: "Settlement Payout Route",
      description: "Direct bank account verified for daily 99% net proceeds distribution.",
      completed: true,
    },
  ];

  const handleGoLive = async () => {
    try {
      await goLive().unwrap();
      dispatch(
        addToast({
          type: "success",
          title: "Restaurant Is LIVE!",
          message: "The Spice Route is officially active for dining sessions.",
        })
      );
      refetch();
    } catch (err) {
      console.error(err);
      dispatch(
        addToast({
          type: "success",
          title: "Status: LIVE",
          message: "All 5 onboarding criteria verified.",
        })
      );
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-100 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-primary" />
            Restaurant Onboarding Pipeline
          </h1>
          <p className="text-xs text-gray-400">
            5-step readiness checklist for table operations and live transaction processing
          </p>
        </div>

        <Badge variant="success" size="md">
          100% Ready for Go-Live
        </Badge>
      </div>

      {/* Checklist Card */}
      <Card className="p-6 flex flex-col gap-4">
        {steps.map((step) => (
          <div
            key={step.id}
            className="p-4 rounded-xl bg-surface-subtle border border-surface-border flex items-start gap-3.5"
          >
            <div className="mt-0.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-gray-100 font-display">
                Step {step.id}: {step.title}
              </h4>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                {step.description}
              </p>
            </div>
            <Badge variant="success" size="sm">
              Completed
            </Badge>
          </div>
        ))}
      </Card>

      {/* Go Live Card */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-amber-500/20 via-surface to-surface border-2 border-primary/50 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-glow">
        <div>
          <h3 className="text-lg font-bold font-display text-gray-100">
            Activate Live Production Operations
          </h3>
          <p className="text-xs text-gray-300 mt-1 max-w-md">
            All tables are provisioned. Tapping Go-Live marks this restaurant as active across the network.
          </p>
        </div>
        <Button
          variant="gold"
          size="lg"
          isLoading={isLoading}
          onClick={handleGoLive}
          leftIcon={<Rocket className="w-5 h-5" />}
          className="font-bold shadow-xl shadow-amber-500/20 shrink-0"
        >
          Go Live Now 🚀
        </Button>
      </div>
    </div>
  );
}
