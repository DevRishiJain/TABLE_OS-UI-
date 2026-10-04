"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Utensils,
  Sparkles,
  QrCode,
  ShieldCheck,
  ChefHat,
  ArrowRight,
  Clock,
  Phone,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { useLookupRestaurantQuery } from "@/store/api/publicApi";
import { useAppDispatch } from "@/store";
import { setRestaurantInfo, setRestaurantTheme } from "@/store/slices/authSlice";
import { Skeleton } from "@/components/ui/Skeleton";

export default function RestaurantPublicHubPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const slug = (params.slug as string)?.toLowerCase().replace(/^@/, "");

  const { data: restaurant, isLoading, error } = useLookupRestaurantQuery(slug, {
    skip: !slug,
  });

  useEffect(() => {
    if (restaurant && restaurant.id) {
      const activeTheme = restaurant.theme || "gold";
      dispatch(
        setRestaurantInfo({
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          restaurantSlug: restaurant.slug || slug,
          restaurantTheme: activeTheme,
        })
      );
      dispatch(setRestaurantTheme(activeTheme));
    }
  }, [restaurant, slug, dispatch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-gray-100 flex flex-col items-center justify-center p-6 space-y-4">
        <Skeleton className="w-16 h-16 rounded-2xl" />
        <Skeleton className="w-48 h-6 rounded-lg" />
        <Skeleton className="w-64 h-4 rounded-lg" />
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-background text-gray-100 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <Utensils className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold font-display text-white">Restaurant Not Found</h1>
        <p className="text-sm text-gray-400 max-w-sm">
          No restaurant is registered with handle <span className="font-mono text-primary font-bold">@{slug}</span>.
        </p>
        <Link
          href="/"
          className="px-4 py-2 rounded-xl bg-surface-subtle border border-surface-border text-xs font-semibold text-gray-200 hover:text-white"
        >
          Return to TableOS Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-gray-100 flex flex-col">
      {/* Brand Header */}
      <header className="border-b border-surface-border bg-surface/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-glow">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-base text-white tracking-tight leading-none">
                {restaurant.name}
              </h2>
              <span className="text-[10px] font-mono text-primary font-bold">
                @{restaurant.slug || slug}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/login?tab=staff&restaurant=${encodeURIComponent(slug)}`}
              className="px-3.5 py-1.5 text-xs font-bold text-gray-200 hover:text-white bg-surface-subtle hover:bg-surface-hover rounded-xl border border-surface-border transition-colors font-mono"
            >
              Staff Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-4 py-12 w-full flex flex-col gap-10">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Welcome to {restaurant.name}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black font-display text-white tracking-tight">
            Seamless Dining & Ordering Experience
          </h1>
          <p className="text-sm text-gray-300 leading-relaxed">
            Scan your table QR code to explore the interactive digital menu, place your order, and receive real-time updates directly on your device.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto w-full">
          {/* Guest Action */}
          <div className="p-8 rounded-3xl bg-surface border border-surface-border flex flex-col justify-between gap-6 hover:border-primary/50 transition-all shadow-xl">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-display text-white">Guest Dining</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Already seated at a table or parked in a bay? Scan the QR code located on your table or enter your table token.
              </p>
            </div>
            <div className="text-xs text-primary font-bold flex items-center gap-1.5 pt-4 border-t border-surface-border">
              <span>Scan table QR code to begin</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Staff Action */}
          <div className="p-8 rounded-3xl bg-surface border border-surface-border flex flex-col justify-between gap-6 hover:border-primary/50 transition-all shadow-xl">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <ChefHat className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-display text-white">Staff & Management</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Floor waitstaff, kitchen chefs, cashiers, and restaurant administrators sign in here to access station terminals.
              </p>
            </div>
            <Link
              href={`/login?tab=staff&restaurant=${encodeURIComponent(slug)}`}
              className="w-full py-3 px-4 rounded-xl bg-primary text-black font-bold text-xs hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
            >
              <span>Access Station Terminal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
