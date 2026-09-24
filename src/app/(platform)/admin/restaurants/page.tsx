"use client";

import React from "react";
import Link from "next/link";
import { useGetAdminRestaurantsQuery } from "@/store/api/adminApi";
import { formatMoney } from "@/lib/money";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Building2, ArrowRight, RefreshCw } from "lucide-react";

export default function AdminRestaurantsDirectoryPage() {
  const { data: tenants, isLoading, refetch } = useGetAdminRestaurantsQuery();

  const tenantsList = tenants || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-100 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-300" />
            Global Tenant Directory
          </h1>
          <p className="text-xs text-gray-400">
            Multi-tenant governance, commission management & diagnostic inspection
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
          {tenantsList.map((tenant) => {
            const isLive = tenant.status === "ACTIVE" || tenant.status === "LIVE";
            const isSuspended = tenant.status === "SUSPENDED";

            return (
              <Card
                key={tenant.id}
                hoverable
                className="p-6 flex flex-col justify-between gap-5 border-[#2A303C] hover:border-amber-400/50 transition-all"
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
                    <span className="text-xs font-mono font-bold text-amber-300">
                      {(tenant.commission_rate_bps / 100).toFixed(2)}% Fee
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-100 font-display mt-2">
                    {tenant.name}
                  </h3>
                  <span className="text-[11px] text-gray-400 font-mono">
                    GSTIN: {tenant.gstin || "Unregistered"}
                  </span>
                </div>

                <div className="pt-4 border-t border-surface-border/60 flex flex-col gap-2 text-xs">
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

                  <Link
                    href={`/admin/restaurants/${tenant.id}`}
                    className="mt-2 text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center justify-between p-2.5 rounded-xl bg-surface-subtle hover:bg-surface-hover border border-surface-border transition-colors"
                  >
                    <span>Diagnostic Profile</span>
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
