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

  const SKINS = [
    { id: "paper", n: "Paper white", pp: "#FFFFFF", ac: "#8C6A2E" },
    { id: "cream", n: "Warm cream", pp: "#FBF8F0", ac: "#A9772A" },
    { id: "sage", n: "Sage", pp: "#FFFFFF", ac: "#3F7A55" },
    { id: "night", n: "Midnight", pp: "#1C1812", ac: "#D2A252" },
  ];
  const [currentSkin, setCurrentSkin] = useState<string>("paper");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSkin = localStorage.getItem("tableos_customer_skin") || "paper";
      setCurrentSkin(savedSkin);
    }
  }, []);

  const handleSetSkin = (skinId: string) => {
    setCurrentSkin(skinId);
    if (typeof window !== "undefined") {
      localStorage.setItem("tableos_customer_skin", skinId);
    }
  };

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
        title: "Hotel In-Room Dining",
        subtext: `In-room gourmet dining delivered directly to Room ${roomNum}`,
        icon: Hotel,
        accentColor: "text-purple-400 border-purple-500/40 bg-purple-500/10",
      };
    }
    const match = tableToken.match(/(\d+)$/);
    const tableNum = match ? parseInt(match[1], 10) : 1;
    return {
      badge: `🍽️ Table ${tableNum} • Dine-In`,
      title: "Restaurant",
      subtext: "Please enter your details below so our kitchen and floor team can prepare your seating and dishes accordingly.",
      icon: Utensils,
      accentColor: "text-primary border-primary/40 bg-primary/20",
    };
  };

  const loc = getLocationDetails();
  const restaurantInitials = loc.title
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "SR";

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
        ? `Delivery to Car ${vehicle} confirmed for ${guests} guests. Explore our handcrafted menu!`
        : `Party of ${guests} confirmed. Explore our handcrafted menu!`;

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
    <div className="customer-app min-h-screen flex flex-col justify-center" data-skin={currentSkin}>
      <div className="w">
        <div className="wl">
        <div>
          <div className="lg" style={{ width: 56, height: 56, marginBottom: 18 }}>
            {restaurantInitials}
          </div>
          <h1>
            Welcome to<br />
            {loc.title}
          </h1>
          <p className="mu" style={{ margin: "10px 0 0" }}>
            {loc.badge} · Dine-in. Order from your seat, no app needed.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="say" style={{ background: "color-mix(in srgb, var(--er) 15%, var(--pp))", color: "var(--er)", border: "1px solid color-mix(in srgb, var(--er) 30%, transparent)" }}>
            <AlertCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Guest Details Form Card */}
        <form onSubmit={handleStartDining} className="cd g">
          <div>
            <label htmlFor="nm">Your name</label>
            <input
              id="nm"
              className="in"
              placeholder="e.g. Raj"
              autoComplete="given-name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="ph">
              Mobile <span className="mu" style={{ fontWeight: 500 }}>(optional, for order updates)</span>
            </label>
            <input
              id="ph"
              className="in"
              type="tel"
              inputMode="tel"
              placeholder="+91"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>

          <div>
            <label>Guests at your table</label>
            <div className="px">
              <button
                type="button"
                className="b i"
                onClick={() => setGuestCount((g) => Math.max(1, g - 1))}
                aria-label="Fewer guests"
              >
                <Minus style={{ width: 18, height: 18 }} />
              </button>
              <b>{guestCount}</b>
              <button
                type="button"
                className="b i"
                onClick={() => setGuestCount((g) => Math.min(20, g + 1))}
                aria-label="More guests"
              >
                <Plus style={{ width: 18, height: 18 }} />
              </button>

              <div className="qk">
                {[1, 2, 4, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setGuestCount(num)}
                    className={guestCount === num ? "on" : ""}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <button
              type="button"
              className="sw"
              onClick={() => setIsDriveInMode(!isDriveInMode)}
              aria-pressed={isDriveInMode || isTokenDriveIn}
            >
              <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Car style={{ width: 20, height: 20 }} />
                Parked outside in a car?
              </span>
              <i />
            </button>

            {(isDriveInMode || isTokenDriveIn) && (
              <input
                className="in"
                style={{ marginTop: 8 }}
                placeholder="Vehicle plate number (e.g. DL 01 AB 1234) *"
                aria-label="Vehicle number"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                autoFocus
              />
            )}
          </div>

          <button
            type="submit"
            className="b p"
            disabled={isLoading}
          >
            {isLoading ? "Starting..." : "Start dining"}
          </button>
        </form>

        {/* Restaurant Theme Switcher matching sample UI */}
        <div className="sk">
          <span className="mu sm">Restaurant theme (demo)</span>
          <div>
            {SKINS.map((sk) => (
              <button
                key={sk.id}
                type="button"
                aria-pressed={currentSkin === sk.id}
                aria-label={`${sk.n} theme`}
                title={sk.n}
                style={
                  {
                    "--c1": sk.pp,
                    "--c2": sk.ac,
                  } as React.CSSProperties
                }
                onClick={() => handleSetSkin(sk.id)}
              />
            ))}
          </div>
        </div>

        <div className="ft" style={{ fontSize: "1.1rem" }}>
          TableOS Dining Engine · Token: {tableToken.slice(0, 16)}...
        </div>
      </div>
    </div>
  </div>
  );
}

