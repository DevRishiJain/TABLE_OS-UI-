"use client";

import React, { useState } from "react";
import {
  useGetRestaurantSettingsQuery,
  useUpdateRestaurantSettingsMutation,
} from "@/store/api/restaurantApi";
import { addToast } from "@/store/slices/uiSlice";
import { useAppDispatch } from "@/store";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Settings, Shield, Clock, Sliders, CheckCircle2 } from "lucide-react";

export default function RestaurantSettingsPage() {
  const dispatch = useAppDispatch();
  const { data: settings } = useGetRestaurantSettingsQuery();
  const [updateSettings, { isLoading }] = useUpdateRestaurantSettingsMutation();

  const [firstOrderOtpTtl, setFirstOrderOtpTtl] = useState(15);
  const [exitPassOtpTtl, setExitPassOtpTtl] = useState(120);
  const [exitMode, setExitMode] = useState("GUARD_ENFORCED");
  const [highValueMinor, setHighValueMinor] = useState(500000); // ₹5,000

  const handleSave = async () => {
    try {
      await updateSettings({
        first_order_otp_ttl_minutes: firstOrderOtpTtl,
        exit_pass_otp_ttl_minutes: exitPassOtpTtl,
        exit_verification_mode: exitMode,
        high_value_threshold_minor: highValueMinor,
      }).unwrap();

      dispatch(
        addToast({
          type: "success",
          title: "Settings Updated",
          message: "Operational rules and OTP TTLs saved.",
        })
      );
    } catch (err) {
      console.error(err);
      dispatch(
        addToast({
          type: "error",
          title: "Update Failed",
          message: "Failed to update restaurant settings.",
        })
      );
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-100 flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            Operational & Security Settings
          </h1>
          <p className="text-xs text-gray-400">
            Configure OTP time-to-live thresholds, exit security mode & fraud parameters
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          isLoading={isLoading}
          onClick={handleSave}
          leftIcon={<CheckCircle2 className="w-4 h-4" />}
        >
          Save Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* OTP & Security Configuration */}
        <Card className="p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-surface-border/60 pb-3">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-200">
              OTP Time-to-Live (TTL) Controls
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="First-Order Verification OTP TTL (Minutes)"
                type="number"
                value={firstOrderOtpTtl}
                onChange={(e) => setFirstOrderOtpTtl(parseInt(e.target.value) || 15)}
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Time before the guest's 4-digit verification code rotates.
              </p>
            </div>

            <div>
              <Input
                label="Exit Pass QR / OTP TTL (Minutes)"
                type="number"
                value={exitPassOtpTtl}
                onChange={(e) => setExitPassOtpTtl(parseInt(e.target.value) || 120)}
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Time after bill payment before the Exit Pass expires.
              </p>
            </div>
          </div>
        </Card>

        {/* Exit Verification Mode */}
        <Card className="p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-surface-border/60 pb-3">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-200">
              Exit Verification Mode
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setExitMode("GUARD_ENFORCED")}
              className={`p-4 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                exitMode === "GUARD_ENFORCED"
                  ? "border-emerald-500 bg-emerald-500/10 shadow-glow text-gray-100"
                  : "border-surface-border bg-surface text-gray-400"
              }`}
            >
              <span className="text-xs font-bold text-gray-100">
                Guard Enforced (Standard)
              </span>
              <span className="text-[11px] text-gray-400">
                Physical security officer verifies Exit Pass at door before departure.
              </span>
            </button>

            <button
              onClick={() => setExitMode("SELF_CHECKOUT")}
              className={`p-4 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                exitMode === "SELF_CHECKOUT"
                  ? "border-primary bg-primary/10 shadow-glow text-gray-100"
                  : "border-surface-border bg-surface text-gray-400"
              }`}
            >
              <span className="text-xs font-bold text-gray-100">
                Express Self-Checkout
              </span>
              <span className="text-[11px] text-gray-400">
                Session automatically completes upon payment confirmation.
              </span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
