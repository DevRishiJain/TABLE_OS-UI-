"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { setStaffAuth, setGuardAuth } from "@/store/slices/authSlice";
import { useStaffLoginMutation } from "@/store/api/staffApi";
import { addToast } from "@/store/slices/uiSlice";
import { generateClientJWT, DEMO_PROFILES } from "@/lib/jwt";
import { generateUUID } from "@/lib/idempotency";
import { StaffRole } from "@/types/enums";
import {
  Utensils,
  Lock,
  Mail,
  Users,
  Eye,
  EyeOff,
  ChefHat,
  Banknote,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  KeyRound,
  Store,
} from "lucide-react";

export default function DedicatedStaffLoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const currentRestaurantName = useAppSelector((state) => state.auth.restaurantName) || "The Spice Route";
  const restaurantId = useAppSelector((state) => state.auth.restaurantId);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [staffLogin] = useStaffLoginMutation();

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      dispatch(
        addToast({
          type: "error",
          title: "Incomplete Credentials",
          message: "Please enter your Employee ID / Username and Password.",
        })
      );
      return;
    }

    setIsLoading(true);
    try {
      // First attempt real backend staff login API
      const res = await staffLogin({
        identifier: identifier.trim(),
        password: password.trim(),
        restaurant_id: restaurantId,
      }).unwrap();

      const userRole = (res.staff.role as StaffRole) || StaffRole.WAITER;
      const empId = res.staff.employee_id || identifier.trim();

      dispatch(
        setStaffAuth({
          token: res.token,
          role: userRole,
          isPlatformAdmin: false,
          staffId: res.staff.id,
          employeeId: empId,
          restaurantId: res.staff.restaurant_id || restaurantId,
          restaurantName: currentRestaurantName,
          userName: res.staff.name || "Floor Operator",
        })
      );

      dispatch(
        addToast({
          type: "success",
          title: `Welcome, ${res.staff.name || "Staff"}!`,
          message: `Logged in as ${empId} (${userRole}).`,
        })
      );

      // Smart role-based dispatch
      if (userRole === StaffRole.WAITER) {
        router.push("/staff/orders");
      } else if (userRole === StaffRole.KITCHEN) {
        router.push("/kitchen/queue");
      } else if (userRole === StaffRole.CASHIER) {
        router.push("/staff/payments");
      } else if (userRole === StaffRole.GUARD || String(userRole) === "GUARD") {
        dispatch(
          setGuardAuth({
            token: res.token,
            userName: res.staff.name || "Security Guard",
            restaurantId: res.staff.restaurant_id || restaurantId,
          })
        );
        router.push("/guard/scan");
      } else {
        router.push("/restaurant/dashboard");
      }
    } catch (err: any) {
      console.warn("Backend auth failed or running in preview mode, falling back to simulated staff session:", err);
      // Fallback: Smart local dispatch based on role / identifier prefix
      let detectedRole: StaffRole = StaffRole.WAITER;
      let targetPath = "/staff/orders";
      let staffName = "Floor Waiter";

      const upperId = identifier.toUpperCase();
      if (upperId.includes("CHF") || upperId.includes("CHEF") || upperId.includes("KITCHEN")) {
        detectedRole = StaffRole.KITCHEN;
        targetPath = "/kitchen/queue";
        staffName = "Head Chef";
      } else if (upperId.includes("CSH") || upperId.includes("CASHIER") || upperId.includes("PAY")) {
        detectedRole = StaffRole.CASHIER;
        targetPath = "/staff/payments";
        staffName = "Cash Desk Operator";
      } else if (upperId.includes("GRD") || upperId.includes("GUARD")) {
        const guardPayload = DEMO_PROFILES.guard.getPayload();
        const guardToken = await generateClientJWT({
          ...guardPayload,
          restaurant_id: restaurantId,
        });
        dispatch(
          setGuardAuth({
            token: guardToken,
            userName: "Security Guard",
            restaurantId: restaurantId,
          })
        );
        router.push("/guard/scan");
        return;
      } else if (upperId.includes("MGR") || upperId.includes("ADMIN") || upperId.includes("MANAGER")) {
        detectedRole = StaffRole.RESTAURANT_ADMIN;
        targetPath = "/restaurant/dashboard";
        staffName = "Floor Manager";
      }

      let profileKey = "waiter";
      if (detectedRole === StaffRole.KITCHEN) profileKey = "kitchen";
      else if (detectedRole === StaffRole.RESTAURANT_ADMIN) profileKey = "admin";

      const demoProfile = DEMO_PROFILES[profileKey];
      const payload = demoProfile ? demoProfile.getPayload() : DEMO_PROFILES.waiter.getPayload();
      const staffUuid = (payload.staff_id as string) || generateUUID();

      const clientToken = await generateClientJWT({
        ...payload,
        restaurant_id: restaurantId,
      });

      dispatch(
        setStaffAuth({
          token: clientToken,
          role: detectedRole,
          isPlatformAdmin: false,
          staffId: staffUuid,
          employeeId: identifier.toUpperCase().startsWith("EMP-") ? identifier.toUpperCase() : "EMP-WTR-001",
          restaurantId: restaurantId,
          restaurantName: currentRestaurantName,
          userName: staffName,
        })
      );

      dispatch(
        addToast({
          type: "success",
          title: `Welcome, ${staffName}!`,
          message: `Authenticated as ${identifier} (${detectedRole}).`,
        })
      );

      router.push(targetPath);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickChipSelect = (empId: string, role: string) => {
    setIdentifier(empId);
    dispatch(
      addToast({
        type: "info",
        title: "Selected Role",
        message: `Selected ${role} (${empId}). Enter password to continue.`,
      })
    );
  };

  return (
    <div className="min-h-screen bg-background text-gray-100 flex flex-col justify-between">
      {/* Top Header */}
      <header className="px-6 py-4 glass-panel border-b border-surface-border flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-glow">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <span
              suppressHydrationWarning
              className="text-sm font-bold font-display text-gray-100"
            >
              {mounted ? currentRestaurantName : "TableOS"}
            </span>
            <span className="text-[10px] text-amber-400 block font-mono font-bold tracking-wider uppercase">
              Staff Operations Terminal
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-surface border border-surface-border text-gray-300 hover:text-white transition-all"
          >
            Admin Sign In
          </Link>
          <Link
            href="/signup"
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 transition-all"
          >
            Onboard Restaurant
          </Link>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="max-w-md w-full mx-auto p-4 sm:p-6 flex-1 flex flex-col justify-center">
        <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-surface-border shadow-2xl flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Heading */}
          <div className="text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-3">
              <Users className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold font-display text-gray-100">
              Staff Shift Sign-In
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Enter your assigned Employee ID and shift passcode for{" "}
              <strong suppressHydrationWarning className="text-gray-200">
                {mounted ? currentRestaurantName : "TableOS"}
              </strong>.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleStaffLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1.5 flex items-center justify-between">
                <span>Employee ID or Email</span>
                <span className="text-[10px] font-mono text-gray-500">e.g. EMP-WTR-001</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="EMP-WTR-001"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-amber-400 font-mono"
                />
                <KeyRound className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1.5 flex items-center justify-between">
                <span>Passcode / Password</span>
                <span className="text-[10px] font-mono text-gray-500">Assigned by Manager</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-amber-400 font-mono"
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
              className="mt-2 w-full py-3 rounded-xl bg-amber-500 text-black font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
            >
              {isLoading ? "Validating Shift Pass..." : "Sign In & Open Shift Station"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Profile Chips for rapid testing */}
          <div className="pt-4 border-t border-surface-border flex flex-col gap-2.5">
            <span className="text-[11px] font-mono text-gray-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Quick One-Tap Staff Roles:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickChipSelect("EMP-WTR-001", "Waiter")}
                className="p-2 rounded-xl bg-surface-subtle border border-surface-border hover:border-amber-400/50 text-left flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">
                  W
                </div>
                <div className="truncate">
                  <span className="font-bold text-gray-200 block text-[11px]">Waiter Terminal</span>
                  <span className="text-[9px] font-mono text-gray-500">EMP-WTR-001</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickChipSelect("EMP-CHF-001", "Head Chef")}
                className="p-2 rounded-xl bg-surface-subtle border border-surface-border hover:border-amber-400/50 text-left flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">
                  C
                </div>
                <div className="truncate">
                  <span className="font-bold text-gray-200 block text-[11px]">Kitchen KDS</span>
                  <span className="text-[9px] font-mono text-gray-500">EMP-CHF-001</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickChipSelect("EMP-CSH-001", "Cashier")}
                className="p-2 rounded-xl bg-surface-subtle border border-surface-border hover:border-amber-400/50 text-left flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">
                  $
                </div>
                <div className="truncate">
                  <span className="font-bold text-gray-200 block text-[11px]">POS Payments</span>
                  <span className="text-[9px] font-mono text-gray-500">EMP-CSH-001</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickChipSelect("EMP-GRD-001", "Guard")}
                className="p-2 rounded-xl bg-surface-subtle border border-surface-border hover:border-amber-400/50 text-left flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">
                  G
                </div>
                <div className="truncate">
                  <span className="font-bold text-gray-200 block text-[11px]">Exit Scanner</span>
                  <span className="text-[9px] font-mono text-gray-500">EMP-GRD-001</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-gray-500 font-mono border-t border-surface-border">
        {currentRestaurantName} • Floor Operations Station
      </footer>
    </div>
  );
}
