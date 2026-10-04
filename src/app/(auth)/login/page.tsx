"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { setStaffAuth, setRestaurantInfo, clearRestaurant } from "@/store/slices/authSlice";
import { useStaffLoginMutation } from "@/store/api/staffApi";
import {
  useLazyCheckHandleAvailabilityQuery,
  useLazyLookupRestaurantQuery,
} from "@/store/api/publicApi";
import { addToast } from "@/store/slices/uiSlice";
import { StaffRole } from "@/types/enums";
import {
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
  Store,
  Users,
  Eye,
  EyeOff,
  AtSign,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from "lucide-react";

interface VerifiedRestaurant {
  id: string;
  name: string;
  slug?: string;
  theme?: string;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  // Redux auth state
  const storedRestaurantId = useAppSelector((state) => state.auth.restaurantId);
  const storedRestaurantName = useAppSelector((state) => state.auth.restaurantName);
  const storedRestaurantSlug = useAppSelector((state) => state.auth.restaurantSlug);

  const [activeTab, setActiveTab] = useState<"admin" | "staff">("admin");

  // Step 1: Restaurant Handle state
  const [handleInput, setHandleInput] = useState("");
  const [isVerifyingHandle, setIsVerifyingHandle] = useState(false);
  const [handleError, setHandleError] = useState("");
  const [verifiedRestaurant, setVerifiedRestaurant] = useState<VerifiedRestaurant | null>(null);

  // Step 2: Form credentials state
  const [adminIdentifier, setAdminIdentifier] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const [staffIdentifier, setStaffIdentifier] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [showStaffPassword, setShowStaffPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  // APIs
  const [checkHandle] = useLazyCheckHandleAvailabilityQuery();
  const [lookupRestaurant] = useLazyLookupRestaurantQuery();
  const [staffLogin] = useStaffLoginMutation();

  // Validate handle function
  const validateHandle = useCallback(
    async (rawHandle: string, autoSelect = false) => {
      const clean = rawHandle.trim().replace(/^@/, "").toLowerCase();
      if (!clean) {
        setHandleError("");
        return;
      }

      setIsVerifyingHandle(true);
      setHandleError("");

      try {
        const res = await checkHandle(clean).unwrap();
        if (res && res.restaurant && res.exists) {
          const restaurantObj: VerifiedRestaurant = {
            id: res.restaurant.id,
            name: res.restaurant.name,
            slug: res.restaurant.slug || clean,
            theme: res.restaurant.theme || "gold",
          };
          if (autoSelect) {
            setVerifiedRestaurant(restaurantObj);
            dispatch(
              setRestaurantInfo({
                restaurantId: restaurantObj.id,
                restaurantName: restaurantObj.name,
                restaurantSlug: restaurantObj.slug,
                restaurantTheme: restaurantObj.theme,
              })
            );
          }
          return restaurantObj;
        } else {
          // Fallback to lookup by slug
          try {
            const lookupRes = await lookupRestaurant(clean).unwrap();
            if (lookupRes && lookupRes.id) {
              const restaurantObj: VerifiedRestaurant = {
                id: lookupRes.id,
                name: lookupRes.name,
                slug: lookupRes.slug || clean,
                theme: lookupRes.theme || "gold",
              };
              if (autoSelect) {
                setVerifiedRestaurant(restaurantObj);
                dispatch(
                  setRestaurantInfo({
                    restaurantId: restaurantObj.id,
                    restaurantName: restaurantObj.name,
                    restaurantSlug: restaurantObj.slug,
                    restaurantTheme: restaurantObj.theme,
                  })
                );
              }
              return restaurantObj;
            }
          } catch {
            // Not found
          }
          setHandleError(`@${clean} is not registered yet.`);
          return null;
        }
      } catch (err: any) {
        console.error("Handle verification failed:", err);
        setHandleError("Error verifying restaurant handle.");
        return null;
      } finally {
        setIsVerifyingHandle(false);
      }
    },
    [checkHandle, lookupRestaurant, dispatch]
  );

  // Initialize on mount
  useEffect(() => {
    // Initial tab from query param
    const tabParam = searchParams.get("tab");
    if (tabParam === "staff") {
      setActiveTab("staff");
    } else if (tabParam === "admin") {
      setActiveTab("admin");
    }

    // Check query params for restaurant
    const querySlug = searchParams.get("restaurant") || searchParams.get("slug");
    if (querySlug) {
      setHandleInput(querySlug.replace(/^@/, ""));
      validateHandle(querySlug, true);
    } else if (storedRestaurantId && storedRestaurantName) {
      // If user explicitly selected a restaurant previously in this session
      setVerifiedRestaurant({
        id: storedRestaurantId,
        name: storedRestaurantName,
        slug: storedRestaurantSlug || undefined,
      });
      if (storedRestaurantSlug) {
        setHandleInput(storedRestaurantSlug);
      }
    }
  }, [searchParams, storedRestaurantId, storedRestaurantName, storedRestaurantSlug, validateHandle]);

  // Handle Switch / Change Restaurant
  const handleSwitchRestaurant = () => {
    setVerifiedRestaurant(null);
    setHandleInput("");
    setHandleError("");
    setAdminIdentifier("");
    setAdminPassword("");
    setStaffIdentifier("");
    setStaffPassword("");
    dispatch(clearRestaurant());
  };

  // Step 1: Submit Restaurant Handle
  const handleConnectRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleInput.trim()) return;

    const resolved = await validateHandle(handleInput, true);
    if (!resolved) {
      dispatch(
        addToast({
          type: "error",
          title: "Restaurant Not Found",
          message: `No active restaurant found for @${handleInput.trim().replace(/^@/, "")}.`,
        })
      );
    }
  };

  // Step 2: Handle Admin Login
  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedRestaurant) return;

    if (!adminIdentifier.trim() || !adminPassword.trim()) {
      dispatch(
        addToast({
          type: "error",
          title: "Missing Credentials",
          message: "Please enter your email/ID and password.",
        })
      );
      return;
    }

    setIsLoading(true);
    try {
      const res = await staffLogin({
        identifier: adminIdentifier.trim(),
        password: adminPassword.trim(),
        restaurant_id: verifiedRestaurant.id,
      }).unwrap();

      if (res && res.token) {
        const staffRole = (res.staff.role as StaffRole) || StaffRole.RESTAURANT_ADMIN;

        dispatch(
          setStaffAuth({
            token: res.token,
            role: staffRole,
            isPlatformAdmin: res.staff.role === "SUPER_ADMIN",
            staffId: res.staff.id,
            employeeId: res.staff.employee_id || "",
            restaurantId: res.staff.restaurant_id || verifiedRestaurant.id,
            restaurantName: (res.staff as any).restaurant_name || verifiedRestaurant.name,
            userName: res.staff.name || adminIdentifier.split("@")[0],
          })
        );

        dispatch(
          addToast({
            type: "success",
            title: "Access Granted",
            message: `Welcome, ${res.staff.name || "Admin"}. Opening management suite.`,
          })
        );

        router.push("/restaurant/dashboard");
      }
    } catch (err: any) {
      console.error("Admin sign-in failed:", err);
      dispatch(
        addToast({
          type: "error",
          title: "Sign-in Failed",
          message:
            err?.data?.error || err?.data?.message || "Invalid credentials for this restaurant.",
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Handle Staff Shift Login (Single Name + Auto-Role Routing)
  const handleStaffSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedRestaurant) return;

    if (!staffIdentifier.trim() || !staffPassword.trim()) {
      dispatch(
        addToast({
          type: "error",
          title: "Missing Credentials",
          message: "Please enter your name/ID and shift password.",
        })
      );
      return;
    }

    setIsLoading(true);
    try {
      const res = await staffLogin({
        identifier: staffIdentifier.trim(),
        password: staffPassword.trim(),
        restaurant_id: verifiedRestaurant.id,
      }).unwrap();

      if (res && res.token) {
        const role = (res.staff.role as StaffRole) || StaffRole.WAITER;

        dispatch(
          setStaffAuth({
            token: res.token,
            role: role,
            isPlatformAdmin: res.staff.role === "SUPER_ADMIN",
            staffId: res.staff.id,
            employeeId: res.staff.employee_id || "",
            restaurantId: res.staff.restaurant_id || verifiedRestaurant.id,
            restaurantName: (res.staff as any).restaurant_name || verifiedRestaurant.name,
            userName: res.staff.name || staffIdentifier,
          })
        );

        // Auto-route based on detected role
        let targetPortal = "/staff/tables";
        let portalLabel = "Waiter Station";

        switch (role) {
          case StaffRole.KITCHEN:
            targetPortal = "/kitchen/queue";
            portalLabel = "Kitchen Display (KDS)";
            break;
          case StaffRole.CASHIER:
            targetPortal = "/staff/payments";
            portalLabel = "Cashier & Settlement Terminal";
            break;
          case StaffRole.GUARD:
            targetPortal = "/guard/scan";
            portalLabel = "Door Security Pass Scanner";
            break;
          case StaffRole.RESTAURANT_ADMIN:
          case StaffRole.MANAGER:
            targetPortal = "/restaurant/dashboard";
            portalLabel = "Restaurant Management Suite";
            break;
          case StaffRole.WAITER:
          default:
            targetPortal = "/staff/tables";
            portalLabel = "Floor Waiter Terminal";
            break;
        }

        dispatch(
          addToast({
            type: "success",
            title: `Welcome, ${res.staff.name || staffIdentifier}!`,
            message: `Role recognized as ${role}. Opening ${portalLabel}...`,
          })
        );

        router.push(targetPortal);
      }
    } catch (err: any) {
      console.error("Staff sign-in failed:", err);
      dispatch(
        addToast({
          type: "error",
          title: "Staff Login Failed",
          message:
            err?.data?.error ||
            err?.data?.message ||
            "Invalid name/employee ID or password for this restaurant.",
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto">
      {!verifiedRestaurant ? (
        /* ====================================================================
         * STEP 1: Enter Restaurant Username / Handle (Instagram Style)
         * ==================================================================== */
        <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-surface-border shadow-2xl flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-3">
              <Store className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold font-display text-gray-100">
              Sign In to Restaurant Portal
            </h2>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              Enter your restaurant handle to access your management suite or staff shift station.
            </p>
          </div>

          {/* Handle Form */}
          <form onSubmit={handleConnectRestaurant} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1.5 flex items-center justify-between">
                <span>Restaurant Username / Handle</span>
                <span className="text-[10px] font-mono text-gray-500">
                  Instagram style @handle
                </span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center text-amber-400 font-bold font-mono text-sm">
                  <AtSign className="w-4 h-4 text-amber-400" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={handleInput}
                  onChange={(e) => {
                    setHandleInput(e.target.value);
                    setHandleError("");
                  }}
                  placeholder="spiceroute"
                  className="w-full pl-9 pr-10 py-3 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-amber-400 font-mono tracking-wide"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  {isVerifyingHandle && (
                    <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                  )}
                </div>
              </div>

              {handleError && (
                <p className="text-xs text-red-400 mt-1.5 font-mono">{handleError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!handleInput.trim() || isVerifyingHandle}
              className="w-full py-3 rounded-xl bg-amber-500 text-black font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              <span>Continue to Restaurant</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Onboard Link */}
          <div className="pt-4 border-t border-surface-border flex items-center justify-between text-xs">
            <span className="text-gray-400">Need to register a restaurant?</span>
            <Link
              href="/signup"
              className="text-primary font-bold hover:underline flex items-center gap-1 font-mono"
            >
              Onboard Restaurant &rarr;
            </Link>
          </div>
        </div>
      ) : (
        /* ====================================================================
         * STEP 2: The Portal Screen (Restaurant Verified — Owner & Staff Tabs)
         * ==================================================================== */
        <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-surface-border shadow-2xl flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          {/* Verified Restaurant Banner */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-100 flex items-center gap-1.5">
                  <span>{verifiedRestaurant.name}</span>
                  <span className="text-[10px] text-amber-400 font-mono">
                    @{verifiedRestaurant.slug || "venue"}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400 block font-mono">
                  Venue Connected
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSwitchRestaurant}
              className="text-[11px] font-mono text-gray-400 hover:text-amber-400 underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Change</span>
            </button>
          </div>

          {/* Heading */}
          <div className="text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/20 mb-3">
              <Store className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold font-display text-gray-100">
              {verifiedRestaurant.name} Portal
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {activeTab === "admin"
                ? "Sign in with admin credentials to access the management suite."
                : "Sign in with your name or ID to access your shift station."}
            </p>
          </div>

          {/* Dual Switcher: Owner/Admin vs Floor Staff Login */}
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
              onClick={() => setActiveTab("staff")}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "staff"
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/20 font-extrabold"
                  : "text-gray-400 hover:text-amber-400"
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Floor Staff Login
            </button>
          </div>

          {activeTab === "admin" ? (
            /* TAB 1: OWNER / ADMIN FORM */
            <form onSubmit={handleAdminSignIn} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1.5">
                  Owner Email or Employee ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={adminIdentifier}
                    onChange={(e) => setAdminIdentifier(e.target.value)}
                    placeholder="admin@yourrestaurant.com"
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
                    type={showAdminPassword ? "text" : "password"}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-primary font-mono"
                  />
                  <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    {showAdminPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 w-full py-3 rounded-xl bg-primary text-black font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {isLoading ? "Authenticating..." : "Enter Restaurant Management Suite"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* TAB 2: FLOOR STAFF SHIFT SIGN-IN (Name or ID + Auto-Role) */
            <form onSubmit={handleStaffSignIn} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1.5 flex items-center justify-between">
                  <span>Your Name or Employee ID</span>
                  <span className="text-[10px] font-mono text-gray-400">
                    e.g. Aman, Rajesh, Sunil
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoFocus
                    value={staffIdentifier}
                    onChange={(e) => setStaffIdentifier(e.target.value)}
                    placeholder="Aman, Rajesh, Sunil, or EMP-WTR-001"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <Users className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1.5">
                  Shift Password
                </label>
                <div className="relative">
                  <input
                    type={showStaffPassword ? "text" : "password"}
                    required
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-subtle border border-surface-border text-sm text-gray-100 focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowStaffPassword(!showStaffPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    {showStaffPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 w-full py-3 rounded-xl bg-amber-500 text-black font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {isLoading ? "Recognizing Role & Connecting..." : "Sign In to Station"}
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Auto-Role Hint */}
              <div className="p-2.5 rounded-xl bg-surface-subtle border border-surface-border text-[11px] text-gray-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  Auto-Portal: Recognizes whether you are Waiter, Chef, Cashier, or Guard and opens your terminal.
                </span>
              </div>
            </form>
          )}

          {/* Quick Station Switchers */}
          <div className="pt-3 border-t border-surface-border flex items-center justify-between text-xs">
            <span className="text-gray-400">Station shortcuts:</span>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <Link href="/kitchen/queue" className="text-amber-400 hover:underline">
                KDS
              </Link>
              <span className="text-gray-600">•</span>
              <Link href="/guard/scan" className="text-emerald-400 hover:underline">
                Guard
              </Link>
              <span className="text-gray-600">•</span>
              <Link href="/staff/tables" className="text-blue-400 hover:underline">
                Waiter
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background text-gray-100 flex items-center justify-center font-mono text-sm">
          Loading TableOS Portal...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
