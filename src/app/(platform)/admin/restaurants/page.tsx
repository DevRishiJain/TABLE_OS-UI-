"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  useGetAdminRestaurantsQuery,
  useAdminExtendSubscriptionMutation,
  useReactivateRestaurantMutation,
  useSuspendRestaurantMutation,
} from "@/store/api/adminApi";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Building2, ArrowRight, RefreshCw, Calendar, Sparkles, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function AdminRestaurantsDirectoryPage() {
  const { data: tenants, isLoading, refetch } = useGetAdminRestaurantsQuery();
  const [extendSubscription, { isLoading: isExtending }] = useAdminExtendSubscriptionMutation();
  const [reactivateTenant] = useReactivateRestaurantMutation();
  const [suspendTenant] = useSuspendRestaurantMutation();
  const [actionMsg, setActionMsg] = useState("");

  const tenantsList = tenants || [];

  const activeSubCount = tenantsList.filter(
    (t: any) => t.subscription_status === "ACTIVE" || t.status === "ACTIVE"
  ).length;

  const handleExtend = async (id: string) => {
    try {
      await extendSubscription({ restaurantId: id, days: 30, plan: "PRO" }).unwrap();
      setActionMsg(`Extended subscription by 30 days for tenant ${id.substring(0, 8)}`);
      setTimeout(() => setActionMsg(""), 3000);
    } catch (err: any) {
      console.error("Extend subscription failed:", err);
    }
  };

  const handleToggleStatus = async (tenant: any) => {
    try {
      if (tenant.status === "SUSPENDED") {
        await reactivateTenant({ restaurantId: tenant.id }).unwrap();
        setActionMsg(`Reactivated tenant ${tenant.name}`);
      } else {
        await suspendTenant({ restaurantId: tenant.id, reason: "Administrative suspension by Super Admin" }).unwrap();
        setActionMsg(`Suspended tenant ${tenant.name}`);
      }
      setTimeout(() => setActionMsg(""), 3000);
    } catch (err: any) {
      console.error("Toggle status failed:", err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-100 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-300" />
            Super-Admin Multi-Tenant Governance
          </h1>
          <p className="text-xs text-gray-400">
            Manage active subscriptions, tenant access control, and platform infrastructure
          </p>
        </div>

        <Button
          variant="subtle"
          size="sm"
          onClick={() => refetch()}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Directory
        </Button>
      </div>

      {actionMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Network Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-900/60 border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-medium">Total Registered Tenants</span>
            <b className="text-xl font-bold text-white block">{tenantsList.length}</b>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-medium">Active Subscriptions</span>
            <b className="text-xl font-bold text-emerald-400 block">{activeSubCount} Active</b>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-medium">Subscription Model</span>
            <b className="text-xl font-bold text-amber-300 block">SaaS Subscription Mode</b>
          </div>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 h-56">
              <Skeleton className="h-full w-full" />
            </Card>
          ))}
        </div>
      ) : tenantsList.length === 0 ? (
        <Card className="p-12 text-center text-gray-500">
          <Building2 className="w-12 h-12 mx-auto text-gray-600 mb-3" />
          <span className="text-sm font-bold text-gray-300 block">
            No restaurant tenants found in directory
          </span>
          <span className="text-xs text-gray-500 mt-1 block">
            Tenants will display here once registered in TableOS.
          </span>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tenantsList.map((tenant: any) => {
            const isLive = tenant.status === "ACTIVE" || tenant.status === "LIVE";
            const isSuspended = tenant.status === "SUSPENDED";
            const plan = tenant.subscription_plan || "PRO";

            return (
              <Card
                key={tenant.id}
                hoverable
                className="p-6 flex flex-col justify-between gap-5 border-[#2A303C] hover:border-amber-400/50 transition-all bg-slate-900/80"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <Badge
                      variant={isLive ? "success" : isSuspended ? "error" : "amber"}
                      size="sm"
                      dot={isLive}
                    >
                      {tenant.status}
                    </Badge>
                    <span className="text-xs font-mono font-bold text-amber-300 px-2 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/20">
                      {plan} Plan
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-100 font-display mt-2">
                    {tenant.name}
                  </h3>
                  <span className="text-[11px] text-gray-400 font-mono">
                    GSTIN: {tenant.gstin || "Unregistered"}
                  </span>
                </div>

                <div className="pt-4 border-t border-surface-border/60 flex flex-col gap-2.5 text-xs">
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Subscription Status:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {tenant.subscription_status || "ACTIVE"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-400">
                    <span>Timezone:</span>
                    <span className="font-mono text-gray-200">
                      {tenant.timezone || "Asia/Kolkata"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-400">
                    <span>Tenant ID:</span>
                    <span className="font-mono text-gray-400 text-[10px]">
                      {tenant.id.substring(0, 12)}...
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      type="button"
                      disabled={isExtending}
                      onClick={() => handleExtend(tenant.id)}
                      className="py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-[11px] transition-all flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      +30 Days Sub
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(tenant)}
                      className={`py-2 px-3 rounded-xl border font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 ${
                        isSuspended
                          ? "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                          : "bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-400"
                      }`}
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      {isSuspended ? "Reactivate" : "Suspend"}
                    </button>
                  </div>

                  <Link
                    href={`/admin/restaurants/${tenant.id}`}
                    className="mt-1 text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center justify-between p-2.5 rounded-xl bg-surface-subtle hover:bg-surface-hover border border-surface-border transition-colors"
                  >
                    <span>Full Diagnostic Profile</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
