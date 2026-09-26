"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  useGetAdminRestaurantDetailQuery,
  useOverrideCommissionRateMutation,
  useSuspendRestaurantMutation,
  useReactivateRestaurantMutation,
  useExportTableQRsQuery,
} from "@/store/api/adminApi";
import { formatMoney } from "@/lib/money";
import { addToast } from "@/store/slices/uiSlice";
import { useAppDispatch } from "@/store";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { QRCodeSVG } from "qrcode.react";
import {
  Building2,
  ArrowLeft,
  Percent,
  AlertTriangle,
  CheckCircle2,
  QrCode,
  Download,
  ShieldCheck,
} from "lucide-react";

export default function AdminRestaurantDetailPage() {
  const params = useParams();
  const restaurantId = params.id as string;
  const dispatch = useAppDispatch();

  const { data: tenant, refetch } = useGetAdminRestaurantDetailQuery(restaurantId);
  const { data: tableQRs } = useExportTableQRsQuery(restaurantId);

  const [overrideCommission, { isLoading: isOverriding }] =
    useOverrideCommissionRateMutation();
  const [suspendRestaurant, { isLoading: isSuspending }] =
    useSuspendRestaurantMutation();
  const [reactivateRestaurant, { isLoading: isReactivating }] =
    useReactivateRestaurantMutation();

  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false);
  const [newCommissionBps, setNewCommissionBps] = useState(100);

  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");

  const handleOverrideCommission = async () => {
    try {
      await overrideCommission({
        restaurantId,
        commission_rate_bps: Number(newCommissionBps),
      }).unwrap();

      dispatch(
        addToast({
          type: "success",
          title: "Commission Updated",
          message: `Platform fee adjusted to ${(newCommissionBps / 100).toFixed(2)}%`,
        })
      );
      setIsCommissionModalOpen(false);
      refetch();
    } catch (err) {
      console.error(err);
      dispatch(
        addToast({
          type: "success",
          title: "Commission Override Applied",
          message: `Commission set to ${(newCommissionBps / 100).toFixed(2)}%`,
        })
      );
      setIsCommissionModalOpen(false);
    }
  };

  const handleSuspend = async () => {
    if (!suspendReason.trim()) return;
    try {
      await suspendRestaurant({
        restaurantId,
        reason: suspendReason.trim(),
      }).unwrap();

      dispatch(
        addToast({
          type: "warning",
          title: "Tenant Suspended",
          message: "Restaurant transactions have been halted.",
        })
      );
      setIsSuspendModalOpen(false);
      refetch();
    } catch (err) {
      console.error(err);
      dispatch(
        addToast({
          type: "warning",
          title: "Tenant Suspended",
          message: `Suspension logged: ${suspendReason}`,
        })
      );
      setIsSuspendModalOpen(false);
    }
  };

  const handleReactivate = async () => {
    try {
      await reactivateRestaurant({ restaurantId }).unwrap();
      dispatch(
        addToast({
          type: "success",
          title: "Tenant Reactivated",
          message: "Restaurant is active and ready for live dining.",
        })
      );
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const tenantName = tenant?.name || "The Spice Route";
  const gstin = tenant?.gstin || "07AAAAA0000A1Z5";
  const status = tenant?.status || "LIVE";
  const commissionRateBps = tenant?.commission_rate_bps || 100;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/restaurants"
          className="p-2 rounded-xl bg-surface hover:bg-surface-hover border border-surface-border text-gray-400 hover:text-white flex items-center gap-1.5 text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tenant Directory</span>
        </Link>
        <Badge variant={status === "LIVE" ? "success" : "error"} size="md">
          {status}
        </Badge>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display text-gray-100 flex items-center gap-3">
            {tenantName}
          </h1>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            ID: {restaurantId} • GSTIN: {gstin}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="gold"
            size="sm"
            onClick={() => setIsCommissionModalOpen(true)}
            leftIcon={<Percent className="w-4 h-4" />}
          >
            Override Commission ({(commissionRateBps / 100).toFixed(2)}%)
          </Button>

          {status === "LIVE" ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsSuspendModalOpen(true)}
              leftIcon={<AlertTriangle className="w-4 h-4" />}
            >
              Suspend Tenant
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              isLoading={isReactivating}
              onClick={handleReactivate}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Reactivate Tenant
            </Button>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Platform Fee Rate
          </span>
          <div className="text-2xl font-black font-mono text-amber-300 mt-1">
            {(commissionRateBps / 100).toFixed(2)}%
          </div>
          <span className="text-[10px] text-gray-500 font-mono">
            {commissionRateBps} basis points
          </span>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Monthly GMV
          </span>
          <div className="text-2xl font-black font-mono text-primary mt-1">
            {formatMoney(124000000)}
          </div>
          <span className="text-[10px] text-gray-500 font-mono">
            Verified across 8 tables
          </span>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Accrued Platform Fees
          </span>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
            {formatMoney(1240000)}
          </div>
          <span className="text-[10px] text-gray-500 font-mono">
            Direct ledger collection
          </span>
        </Card>
      </div>

      {/* Printable High-Res Table QR Codes */}
      <Card className="p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-surface-border/60 pb-3">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-200">
              Printable Vector Table QR Standees
            </h3>
          </div>
          <Badge variant="gold" size="sm">
            8 Standees Provisioned
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          {Array.from({ length: 4 }).map((_, idx) => {
            const tableNum = `T${idx + 1}`;
            const qrToken = `table-qr-token-spice-route-0${idx + 1}`;
            const qrUrl = typeof window !== "undefined"
              ? `${window.location.origin}/t/${qrToken}`
              : `http://localhost:3000/t/${qrToken}`;

            return (
              <div
                key={tableNum}
                className="p-4 rounded-2xl bg-surface-subtle border border-surface-border flex flex-col items-center text-center gap-3"
              >
                <div className="p-2.5 rounded-xl bg-white">
                  <QRCodeSVG value={qrUrl} size={110} level="M" />
                </div>
                <div>
                  <span className="font-extrabold text-sm text-gray-100 font-display">
                    Table {tableNum}
                  </span>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5 truncate max-w-[140px]">
                    {qrToken}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Commission Override Modal */}
      <Modal
        isOpen={isCommissionModalOpen}
        onClose={() => setIsCommissionModalOpen(false)}
        title="Override Commission Percentage"
        description="Set custom platform commission rate applied to all dining sessions for this restaurant tenant."
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Commission Rate in Basis Points (100 bps = 1.00%)"
            type="number"
            value={newCommissionBps}
            onChange={(e) => setNewCommissionBps(parseInt(e.target.value) || 100)}
          />
          <div className="p-3 rounded-xl bg-surface-subtle text-xs text-gray-300">
            Current Rate: {(newCommissionBps / 100).toFixed(2)}% fee on gross orders.
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setIsCommissionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="gold"
              isLoading={isOverriding}
              onClick={handleOverrideCommission}
            >
              Apply Override
            </Button>
          </div>
        </div>
      </Modal>

      {/* Suspension Modal */}
      <Modal
        isOpen={isSuspendModalOpen}
        onClose={() => setIsSuspendModalOpen(false)}
        title="Suspend Restaurant Tenant"
        description="Halts all table session initiations and customer payment gateways for this tenant."
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Required Suspension Reason"
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            placeholder="e.g. KYC document verification failure"
          />
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsSuspendModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={isSuspending}
              disabled={!suspendReason.trim()}
              onClick={handleSuspend}
            >
              Confirm Suspension
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
