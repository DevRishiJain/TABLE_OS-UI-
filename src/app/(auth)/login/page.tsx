"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { setStaffAuth, setGuardAuth } from "@/store/slices/authSlice";
import { useStaffLoginMutation } from "@/store/api/staffApi";
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
  Utensils,
  Store,
  Users,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const currentRestaurantName = useAppSelector((state) => state.auth.restaurantName) || "The Spice Route";
  const restaurantId = useAppSelector((state) => state.auth.restaurantId);

  const [activeTab, setActiveTab] = useState<"admin" | "staff">("admin");
  const [email, setEmail] = useState("owner@spiceroute.com");
  const [password, setPassword] = useState("Admin@12345");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [staffLogin] = useStaffLoginMutation();

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = await generateClientJWT({
        staff_id: "s-admin-001",
        restaurant_id: restaurantId,
        role: "RESTAURANT_ADMIN",
        permissions: ["ALL"],
      });

      dispatch(
        setStaffAuth({
          token,
          role: StaffRole.RESTAURANT_ADMIN,
          isPlatformAdmin: false,
          staffId: "s-admin-001",
          employeeId: "EMP-ADM-001",
          restaurantId,
          restaurantName: currentRestaurantName,
          userName: email.split("@")[0].toUpperCase() || "Admin",
        })
      );

      dispatch(
        addToast({
          type: "success",
          title: "Admin Access Granted",
          message: `Welcome to ${currentRestaurantName} Executive Suite.`,
        })
      );

      router.push("/restaurant/dashboard");
    } catch (err) {
      dispatch(addToast({ type: "error", title: "Sign-in Failed", message: "Invalid credentials." }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStaffQuickLogin = (role: StaffRole, empId: string, name: string, targetPath: string) => {
    dispatch(
      setStaffAuth({
        token: "demo-staff-token",
        role: role,
        isPlatformAdmin: false,
        staffId: "staff-" + empId,
        employeeId: empId,
        restaurantId,
        restaurantName: currentRestaurantName,
        userName: name,
      })
    );
    dispatch(
      addToast({
        type: "success",
        title: `Signed in as ${name}`,
        message: `Employee ID: ${empId} • Opening station...`,
      })
    );
    router.push(targetPath);
  };

  return (
    <div className="min-h-screen bg-background text-gray-100 flex flex-col justify-between">
      {/* Top Header */}
      <header className="px-6 py-4 glass-panel border-b border-surface-border flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-glow">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-bold font-display text-gray-100">
              {currentRestaurantName}
            </span>
            <span className="text-[10px] text-gray-400 block font-mono">
              Operating System
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/staff/login"
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30 transition-all flex items-center gap-1.5 font-mono"
          >
            <Users className="w-3.5 h-3.5" /> Staff Shift Login
          </Link>
          <Link
            href="/signup"
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 transition-all font-mono"
          >
            + Onboard Restaurant
          </Link>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="max-w-md w-full mx-auto p-4 sm:p-6 flex-1 flex flex-col justify-center">
        <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-surface-border shadow-2xl flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          {/* Heading */}
          <div className="text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/20 mb-3">
              <Store className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold font-display text-gray-100">
              {currentRestaurantName} Portal
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Select your sign-in portal or enter your credentials below.
            </p>
          </div>

          {/* Portals Switcher */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-surface-subtle border border-surface-border">
            <button
              type="button"
              onClick={() => setActiveTab("admin")}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "admin"
                  ? "bg-primary text-black shadow-md shadow-primary/20 font-extrabold"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Owner / Admin
            </button>
            <button
              type="button"
              onClick={() => router.push("/staff/login")}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-gray-400 hover:text-amber-400`}
            >
              <Users className="w-3.5 h-3.5" /> Floor Staff Login &rarr;
            </button>
          </div>

          {/* Admin Sign In Form */}
          <form onSubmit={handleAdminSignIn} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1.5">
                Owner Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@spiceroute.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-primary font-mono"
                />
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-primary font-mono"
                />
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full py-3 rounded-xl bg-primary text-black font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              {isLoading ? "Signing in..." : "Enter Restaurant Management Suite"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Staff Roles Links */}
          <div className="pt-4 border-t border-surface-border flex flex-col gap-2">
            <span className="text-[11px] font-mono text-gray-400">
              Looking for Floor Staff Terminals?
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleStaffQuickLogin(StaffRole.WAITER, "EMP-WTR-001", "Floor Waiter", "/staff/orders")}
                className="p-2.5 rounded-xl bg-surface-subtle border border-surface-border hover:border-amber-400/40 text-left flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                  W
                </div>
                <div className="truncate">
                  <span className="font-bold text-gray-200 block text-[11px]">Waiter Queue</span>
                  <span className="text-[9px] font-mono text-gray-500">EMP-WTR-001</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleStaffQuickLogin(StaffRole.KITCHEN, "EMP-CHF-001", "Head Chef", "/kitchen/queue")}
                className="p-2.5 rounded-xl bg-surface-subtle border border-surface-border hover:border-amber-400/40 text-left flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">
                  K
                </div>
                <div className="truncate">
                  <span className="font-bold text-gray-200 block text-[11px]">Kitchen KDS</span>
                  <span className="text-[9px] font-mono text-gray-500">EMP-CHF-001</span>
                </div>
              </button>
            </div>
          </div>

          {/* Onboarding Callout */}
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-between text-xs">
            <span className="text-gray-300">Need to register a new restaurant?</span>
            <Link href="/signup" className="text-primary font-bold hover:underline flex items-center gap-1 font-mono">
              Onboard &rarr;
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-gray-500 font-mono border-t border-surface-border">
        {currentRestaurantName} • Secured by TableOS Cloud Core
      </footer>
    </div>
  );
}
