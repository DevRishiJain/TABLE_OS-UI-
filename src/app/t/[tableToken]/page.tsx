"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStartSessionMutation } from "@/store/api/customerApi";
import { useAppDispatch } from "@/store";
import { setCustomerSession } from "@/store/slices/authSlice";
import { addToast } from "@/store/slices/uiSlice";
import { translateBackendError } from "@/lib/errors";
import {
  Loader2,
  Utensils,
  AlertCircle,
  Users,
  Phone,
  User,
  Sparkles,
  ArrowRight,
  Plus,
  Minus,
  Car,
  Hotel,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function TableQREntryPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [startSession, { isLoading }] = useStartSessionMutation();

  const tableToken = (params.tableToken as string) || "table-qr-token-spice-route-01";
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [isDriveInMode, setIsDriveInMode] = useState<boolean>(false);
  const [guestCount, setGuestCount] = useState<number>(2);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Determine venue concept and labels from table token
  const tokenLower = tableToken.toLowerCase();
  const isTokenDriveIn = tokenLower.includes("drive") || tokenLower.includes("car");
  const isTokenHotel = tokenLower.includes("room") || tokenLower.includes("hotel");

  useEffect(() => {
    if (isTokenDriveIn) {
      setIsDriveInMode(true);
    }
  }, [isTokenDriveIn]);

  // Pre-fill from localStorage if previously entered
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("tableos_customer_name");
      const savedPhone = localStorage.getItem("tableos_customer_phone");
      const savedGuests = localStorage.getItem("tableos_guest_count");
      const savedVehicle = localStorage.getItem("tableos_vehicle_number");
      if (savedName) setCustomerName(savedName);
      if (savedPhone) setCustomerPhone(savedPhone);
      if (savedVehicle) setVehicleNumber(savedVehicle);
      if (savedGuests && !isNaN(Number(savedGuests))) {
        setGuestCount(Math.max(1, Number(savedGuests)));
      }
    }
  }, []);

  // Generate or retrieve persistent client device fingerprint
  const getDeviceFingerprint = () => {
    if (typeof window === "undefined") return "fp-client-default";
    let fp = localStorage.getItem("tableos_device_fingerprint");
    if (!fp) {
      fp = `fp-${Math.random().toString(36).substring(2, 10)}-${Date.now()}`;
      localStorage.setItem("tableos_device_fingerprint", fp);
    }
    return fp;
  };

  // Derive readable location label
  const getLocationDetails = () => {
    if (isTokenDriveIn) {
      return {
        badge: "🚗 Car-O-Bar • Drive-In",
        title: "Drive-In & Car-O-Bar",
        subtext: "Scan from parking bay • Food delivered hot directly to your car",
        icon: Car,
        accentColor: "text-amber-400 border-amber-500/40 bg-amber-500/10",
      };
    }
    if (isTokenHotel) {
      const match = tableToken.match(/(\d+)$/);
      const roomNum = match ? match[1] : "101";
      return {
        badge: `🏨 Room ${roomNum} • In-Room Dining`,
        title: "The Grand Royale Hotel",
        subtext: `In-room gourmet dining delivered directly to Room ${roomNum}`,
        icon: Hotel,
        accentColor: "text-purple-400 border-purple-500/40 bg-purple-500/10",
      };
    }
    const match = tableToken.match(/(\d+)$/);
    const tableNum = match ? parseInt(match[1], 10) : 1;
    return {
      badge: `🍽️ Table ${tableNum} • Dine-In`,
      title: "The Spice Route",
      subtext: "Please enter your details below so our kitchen and floor team can prepare your seating and dishes accordingly.",
      icon: Utensils,
      accentColor: "text-primary border-primary/40 bg-primary/20",
    };
  };

  const loc = getLocationDetails();
  const HeaderIcon = loc.icon;

  const handleStartDining = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const displayName = customerName.trim() || "Guest Diner";
    const phone = customerPhone.trim();
    const guests = Math.max(1, guestCount || 2);
    const vehicle = vehicleNumber.trim().toUpperCase();

    // Validation: If in Drive-In mode or isTokenDriveIn, vehicle number is mandatory!
    if ((isDriveInMode || isTokenDriveIn) && !vehicle) {
      setErrorMessage("Please enter your Vehicle / Car Plate Number (e.g. DL 01 AB 1234) so our car-hops know which car to deliver your food to!");
      return;
    }

    try {
      const fingerprint = getDeviceFingerprint();

      // Save locally for smooth return visits
      if (typeof window !== "undefined") {
        localStorage.setItem("tableos_customer_name", displayName);
        if (phone) localStorage.setItem("tableos_customer_phone", phone);
        if (vehicle) localStorage.setItem("tableos_vehicle_number", vehicle);
        localStorage.setItem("tableos_guest_count", String(guests));
      }

      const session = await startSession({
        table_token: tableToken,
        customer_name: displayName,
        customer_phone: phone,
        guest_count: guests,
        vehicle_number: vehicle,
        car_number: vehicle,
        device_fingerprint: fingerprint,
      }).unwrap();

      // Store in Redux
      dispatch(
        setCustomerSession({
          sessionId: session.id,
          sessionToken: session.session_token,
          customerName: displayName,
          deviceFingerprint: fingerprint,
        })
      );

      const welcomeMsg = vehicle
        ? `Delivery to Car ${vehicle} confirmed for ${guests} guests. Explore our handcrafted menu below!`
        : `Party of ${guests} confirmed. Explore our handcrafted menu below.`;

      dispatch(
        addToast({
          type: "success",
          title: `Welcome to ${loc.title}!`,
          message: welcomeMsg,
          durationMs: 3500,
        })
      );

      // Redirect into customer dining menu
      router.replace(`/dine/${session.id}/menu`);
    } catch (err: unknown) {
      console.error("Session start error:", err);
      const translated = translateBackendError(err);
      setErrorMessage(translated);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl glass-card border border-surface-border p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Icon */}
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-glow mb-4 ${loc.accentColor}`}>
          <HeaderIcon className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-black text-gray-100 font-display">
          {loc.title}
        </h1>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`text-xs px-3 py-1 rounded-full border font-bold font-mono tracking-wider uppercase ${loc.accentColor}`}>
            {loc.badge}
          </span>
        </div>

        <p className="text-xs text-gray-400 mt-2.5 max-w-xs leading-relaxed">
          {loc.subtext}
        </p>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-400 text-left w-full animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Guest Details Form */}
        <form onSubmit={handleStartDining} className="mt-5 w-full flex flex-col gap-4 text-left">
          {/* Vehicle Plate Input (Prominent for Drive-In or optional for Dine-In) */}
          {(isDriveInMode || isTokenDriveIn) ? (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 shadow-inner">
              <label className="text-xs font-bold text-amber-300 block mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-amber-400" />
                  <span>Car / Vehicle Plate Number <span className="text-red-400">*</span></span>
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-md">
                  Required for Car Delivery
                </span>
              </label>
              <Input
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                placeholder="e.g. DL 01 AB 1234 or HR 26 DQ 5555"
                className="w-full text-base font-mono tracking-wider font-extrabold uppercase bg-background border-amber-500/50 text-amber-300 placeholder:text-gray-600"
                autoFocus
              />
              <p className="text-[11px] text-amber-400/80 mt-1.5 leading-snug font-medium">
                🚗 Waiters will locate your vehicle and deliver food straight to your window.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-gray-400" />
                  <span>Car / Drive-In Parking?</span>
                </label>
                {!isDriveInMode && (
                  <button
                    type="button"
                    onClick={() => setIsDriveInMode(true)}
                    className="text-[11px] font-mono text-amber-400 hover:underline flex items-center gap-1"
                  >
                    + Add Vehicle Number
                  </button>
                )}
              </div>
              {isDriveInMode && (
                <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border mb-2">
                  <Input
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. DL 01 AB 1234 (Vehicle Plate)"
                    className="w-full text-xs font-mono font-bold uppercase"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block font-mono">
                    Car hops will deliver directly to this vehicle.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Customer Name */}
          <div>
            <label className="text-xs font-bold text-gray-300 block mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary" />
              <span>Full Name</span>
            </label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Dev Rishi Jain"
              className="w-full text-sm"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="text-xs font-bold text-gray-300 block mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-primary" />
                <span>Mobile Number</span>
              </span>
              <span className="text-[10px] font-mono text-gray-500">No OTP Required</span>
            </label>
            <Input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full text-sm font-mono"
            />
          </div>

          {/* Number of Guests */}
          <div>
            <label className="text-xs font-bold text-gray-300 block mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" />
                <span>Number of Guests in Party</span>
              </span>
              <span className="text-[10px] font-mono text-gray-400">
                Helps kitchen portioning
              </span>
            </label>

            {/* Stepper & Chips */}
            <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-surface-subtle border border-surface-border">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGuestCount((g) => Math.max(1, g - 1))}
                  className="w-8 h-8 rounded-lg bg-surface border border-surface-border flex items-center justify-center text-gray-300 hover:text-white active:scale-95"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-14 text-center text-base font-black font-mono text-primary">
                  {guestCount} {guestCount === 1 ? "Guest" : "Guests"}
                </span>
                <button
                  type="button"
                  onClick={() => setGuestCount((g) => Math.min(20, g + 1))}
                  className="w-8 h-8 rounded-lg bg-primary text-background font-bold flex items-center justify-center active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Select Buttons */}
              <div className="flex items-center gap-1">
                {[1, 2, 4, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setGuestCount(num)}
                    className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all ${
                      guestCount === num
                        ? "bg-primary text-background shadow-md shadow-primary/20"
                        : "bg-surface text-gray-400 border border-surface-border hover:text-white"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="gold"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-2 font-bold shadow-xl shadow-amber-500/20"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {isLoading ? "Opening Session..." : (isDriveInMode || isTokenDriveIn) ? "Place Car Order & View Menu" : "Start Dining & View Menu"}
          </Button>
        </form>

        <div className="pt-4 mt-5 border-t border-surface-border/50 w-full text-[11px] text-gray-500 font-mono flex items-center justify-between">
          <span>TableOS Dining Engine</span>
          <span className="truncate max-w-[150px]">Token: {tableToken}</span>
        </div>
      </div>
    </div>
  );
}
