"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store";
import { setStaffAuth, setGuardAuth } from "@/store/slices/authSlice";
import { addToast } from "@/store/slices/uiSlice";
import { generateClientJWT, DEMO_PROFILES } from "@/lib/jwt";
import { StaffRole } from "@/types/enums";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Lock,
  Mail,
  ShieldCheck,
  ChefHat,
  Layers,
  ArrowRight,
  Sparkles,
  UserCheck,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState<"staff" | "platform">("staff");
  const [email, setEmail] = useState("admin@spiceroute.com");
  const [password, setPassword] = useState("••••••••••••");
  const [isLoading, setIsLoading] = useState(false);

  // One-click demo sign-in
  const handleDemoSignIn = async (profileKey: string) => {
    setIsLoading(true);
    try {
      const profile = DEMO_PROFILES[profileKey];
      const payload = profile.getPayload();
      const token = await generateClientJWT(payload);

      if (profileKey === "guard") {
        dispatch(
          setGuardAuth({
            token,
            userName: profile.name,
          })
        );
        dispatch(
          addToast({
            type: "success",
            title: "Authenticated as Security Guard",
            message: "Redirecting to Exit Camera Scanner...",
          })
        );
        router.push("/guard/scan");
      } else if (profileKey === "platform") {
        dispatch(
          setStaffAuth({
            token,
            role: StaffRole.SUPER_ADMIN,
            isPlatformAdmin: true,
            staffId: payload.staff_id as string,
            userName: profile.name,
          })
        );
        dispatch(
          addToast({
            type: "success",
            title: "Super-Admin Access Granted",
            message: "Redirecting to Platform Governance Directory...",
          })
        );
        router.push("/admin/restaurants");
      } else if (profileKey === "kitchen") {
        dispatch(
          setStaffAuth({
            token,
            role: StaffRole.KITCHEN,
            isPlatformAdmin: false,
            staffId: payload.staff_id as string,
            userName: profile.name,
          })
        );
        dispatch(
          addToast({
            type: "success",
            title: "Authenticated as Head Chef",
            message: "Launching Kitchen KDS Kanban...",
          })
        );
        router.push("/kitchen/queue");
      } else if (profileKey === "waiter") {
        dispatch(
          setStaffAuth({
            token,
            role: StaffRole.WAITER,
            isPlatformAdmin: false,
            staffId: payload.staff_id as string,
            userName: profile.name,
          })
        );
        dispatch(
          addToast({
            type: "success",
            title: "Authenticated as Floor Staff",
            message: "Opening Live Floor Plan...",
          })
        );
        router.push("/staff/tables");
      } else {
        // Admin
        dispatch(
          setStaffAuth({
            token,
            role: StaffRole.RESTAURANT_ADMIN,
            isPlatformAdmin: false,
            staffId: payload.staff_id as string,
            userName: profile.name,
          })
        );
        dispatch(
          addToast({
            type: "success",
            title: "Authenticated as Restaurant Admin",
            message: "Opening Executive Dashboard...",
          })
        );
        router.push("/restaurant/dashboard");
      }
    } catch (err) {
      console.error("Sign-in error:", err);
      dispatch(
        addToast({
          type: "error",
          title: "Sign-in Failed",
          message: "Could not generate authentication credentials.",
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col items-center text-center gap-1">
        <h1 className="text-2xl font-extrabold text-gray-100 font-display">
          Staff & Admin Sign-In
        </h1>
        <p className="text-xs text-gray-400">
          Enter credentials or tap a Demo Quick-Fill profile
        </p>
      </div>

      {/* Tabs */}
      <div className="p-1 rounded-2xl bg-surface border border-surface-border grid grid-cols-2 gap-1">
        <button
          onClick={() => {
            setActiveTab("staff");
            setEmail("admin@spiceroute.com");
          }}
          className={`py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "staff"
              ? "bg-primary text-background shadow-md shadow-primary/20"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Restaurant Operations
        </button>
        <button
          onClick={() => {
            setActiveTab("platform");
            setEmail("superadmin@tableos.internal");
          }}
          className={`py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "platform"
              ? "bg-amber-400 text-black shadow-md shadow-amber-400/20"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Platform Super-Admin
        </button>
      </div>

      {/* Credentials Card */}
      <Card className="p-6 flex flex-col gap-4">
        <Input
          label="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@spiceroute.com"
          leftIcon={<Mail className="w-4 h-4" />}
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="admin123"
          leftIcon={<Lock className="w-4 h-4" />}
        />

        <Button
          variant={activeTab === "platform" ? "gold" : "primary"}
          size="lg"
          className="w-full font-bold mt-1"
          isLoading={isLoading}
          onClick={() => {
            const lowerEmail = email.toLowerCase();
            let roleToUse = "admin";
            if (activeTab === "platform" || lowerEmail.includes("super") || lowerEmail.includes("platform")) {
              roleToUse = "platform";
            } else if (lowerEmail.includes("waiter") || lowerEmail.includes("floor") || lowerEmail.includes("rohan")) {
              roleToUse = "waiter";
            } else if (lowerEmail.includes("kitchen") || lowerEmail.includes("chef") || lowerEmail.includes("anita")) {
              roleToUse = "kitchen";
            } else if (lowerEmail.includes("guard") || lowerEmail.includes("security") || lowerEmail.includes("suresh") || lowerEmail.includes("8888888888")) {
              roleToUse = "guard";
            }
            handleDemoSignIn(roleToUse);
          }}
        >
          Sign In
        </Button>

        {/* Credentials Cheat Sheet */}
        <div className="mt-2 p-3 rounded-xl bg-surface-elevated/70 border border-surface-border text-xs text-text-secondary space-y-1.5">
          <div className="font-semibold text-text-primary text-[11px] uppercase tracking-wider flex items-center justify-between">
            <span>Verified System Logins</span>
            <span className="text-[10px] text-accent-amber lowercase font-mono">click below to autofill</span>
          </div>
          <div className="grid grid-cols-1 gap-1 text-[11px] font-mono">
            <div 
              onClick={() => { setEmail('admin@spiceroute.com'); setPassword('admin123'); setActiveTab('staff'); }}
              className="cursor-pointer hover:text-accent-amber flex justify-between p-1 rounded hover:bg-surface-border transition-colors"
            >
              <span>Admin: admin@spiceroute.com</span>
              <span className="text-text-muted">admin123</span>
            </div>
            <div 
              onClick={() => { setEmail('waiter@spiceroute.com'); setPassword('waiter123'); setActiveTab('staff'); }}
              className="cursor-pointer hover:text-sky-400 flex justify-between p-1 rounded hover:bg-surface-border transition-colors"
            >
              <span>Waiter: waiter@spiceroute.com</span>
              <span className="text-text-muted">waiter123</span>
            </div>
            <div 
              onClick={() => { setEmail('kitchen@spiceroute.com'); setPassword('chef123'); setActiveTab('staff'); }}
              className="cursor-pointer hover:text-amber-400 flex justify-between p-1 rounded hover:bg-surface-border transition-colors"
            >
              <span>Kitchen: kitchen@spiceroute.com</span>
              <span className="text-text-muted">chef123</span>
            </div>
            <div 
              onClick={() => { setEmail('guard@spiceroute.com'); setPassword('guard123'); setActiveTab('staff'); }}
              className="cursor-pointer hover:text-emerald-400 flex justify-between p-1 rounded hover:bg-surface-border transition-colors"
            >
              <span>Guard: guard@spiceroute.com</span>
              <span className="text-text-muted">guard123</span>
            </div>
            <div 
              onClick={() => { setEmail('superadmin@tableos.internal'); setPassword('super123'); setActiveTab('platform'); }}
              className="cursor-pointer hover:text-amber-300 flex justify-between p-1 rounded hover:bg-surface-border transition-colors"
            >
              <span>SuperAdmin: superadmin@tableos.internal</span>
              <span className="text-text-muted">super123</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Instant Demo Quick-Fill Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            1-Click Demo Quick-Fill Profiles
          </span>
          <Badge variant="gold" size="sm">
            Live Verified
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {/* Admin */}
          <button
            onClick={() => handleDemoSignIn("admin")}
            className="p-3 rounded-xl bg-surface hover:bg-surface-hover border border-surface-border text-left flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                A
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-200 group-hover:text-primary transition-colors">
                  Vikram Mehta (Restaurant Admin)
                </span>
                <span className="text-[10px] text-gray-400">
                  Dashboard, Analytics, Menu OCR, Staff & Ledger
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors" />
          </button>

          {/* Waiter */}
          <button
            onClick={() => handleDemoSignIn("waiter")}
            className="p-3 rounded-xl bg-surface hover:bg-surface-hover border border-surface-border text-left flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                <Layers className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-200 group-hover:text-sky-400 transition-colors">
                  Rohan Verma (Floor Waiter)
                </span>
                <span className="text-[10px] text-gray-400">
                  Table Floor Grid, First-Order OTP & Payments
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-sky-400 transition-colors" />
          </button>

          {/* Kitchen */}
          <button
            onClick={() => handleDemoSignIn("kitchen")}
            className="p-3 rounded-xl bg-surface hover:bg-surface-hover border border-surface-border text-left flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                <ChefHat className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-200 group-hover:text-amber-400 transition-colors">
                  Chef Anita Desai (Head Chef)
                </span>
                <span className="text-[10px] text-gray-400">
                  KDS Kanban: Preparing → Ready → Served
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-amber-400 transition-colors" />
          </button>

          {/* Guard */}
          <button
            onClick={() => handleDemoSignIn("guard")}
            className="p-3 rounded-xl bg-surface hover:bg-surface-hover border border-surface-border text-left flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-200 group-hover:text-emerald-400 transition-colors">
                  Suresh Patil (Exit Security Officer)
                </span>
                <span className="text-[10px] text-gray-400">
                  Camera QR Scanner & 4-Digit OTP Fallback
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-emerald-400 transition-colors" />
          </button>

          {/* Super Admin */}
          <button
            onClick={() => handleDemoSignIn("platform")}
            className="p-3 rounded-xl bg-surface hover:bg-surface-hover border border-amber-500/30 text-left flex items-center justify-between transition-all group shadow-glow"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-amber-200 group-hover:text-amber-300 transition-colors">
                  Platform Super-Admin
                </span>
                <span className="text-[10px] text-gray-400">
                  Tenant Governance, Cross-Tenant GMV & Fraud Review
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-400 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
}
