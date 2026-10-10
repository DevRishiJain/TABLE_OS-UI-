"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useGetAdminRestaurantActivityQuery,
  useGenerateSubscriptionOtpMutation,
  useGetSubscriptionOtpsQuery,
  useAdminExtendSubscriptionMutation,
  useSuspendRestaurantMutation,
  useReactivateRestaurantMutation,
  useOverrideCommissionRateMutation,
} from "@/store/api/adminApi";
import { Copy, Check, KeyRound } from "lucide-react";

const card = "bg-[#121418] border border-[#2A303C] rounded-2xl p-5";
const label = "text-[11px] font-mono uppercase tracking-wider text-gray-500";
const input =
  "px-3 py-2 rounded-xl bg-[#0A0C0E] border border-[#2A303C] text-xs text-gray-100 focus:outline-none focus:border-amber-400";
const btnGold =
  "px-4 py-2 rounded-xl bg-amber-400 text-black text-xs font-extrabold hover:bg-amber-300 disabled:opacity-50 transition-all";

export default function SpAdminRestaurantDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const { data, isLoading, refetch } = useGetAdminRestaurantActivityQuery(id, {
    pollingInterval: 10000,
  });
  const { data: otpHistory, refetch: refetchOtps } = useGetSubscriptionOtpsQuery(id);

  const [generateOtp, { isLoading: isGenOtp }] = useGenerateSubscriptionOtpMutation();
  const [extendSub, { isLoading: isExtending }] = useAdminExtendSubscriptionMutation();
  const [suspendRest, { isLoading: isSuspending }] = useSuspendRestaurantMutation();
  const [reactivateRest, { isLoading: isReactivating }] = useReactivateRestaurantMutation();
  const [overrideRate, { isLoading: isOverriding }] = useOverrideCommissionRateMutation();

  const [otpDays, setOtpDays] = useState(30);
  const [otpPlan, setOtpPlan] = useState("PRO");
  const [issuedOtp, setIssuedOtp] = useState<{ otp: string; expires_at: string; days: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [extendDays, setExtendDays] = useState(30);
  const [rateBps, setRateBps] = useState("");
  const [rateReason, setRateReason] = useState("");
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);

  const r = data?.restaurant;
  const sub = data?.subscription;

  const flash = (msg: string, isErr = false) => {
    if (isErr) {
      setActionErr(msg);
      setActionMsg(null);
    } else {
      setActionMsg(msg);
      setActionErr(null);
    }
    setTimeout(() => {
      setActionMsg(null);
      setActionErr(null);
    }, 5000);
  };

  const handleGenerateOtp = async () => {
    try {
      const res = await generateOtp({ restaurantId: id, days: otpDays, plan: otpPlan }).unwrap();
      setIssuedOtp({ otp: res.otp, expires_at: res.expires_at, days: res.days });
      refetchOtps();
    } catch (err: any) {
      flash(err?.data?.error || "Failed to generate OTP", true);
    }
  };

  const handleExtend = async () => {
    try {
      await extendSub({ restaurantId: id, days: extendDays }).unwrap();
      flash(`Subscription extended by ${extendDays} days`);
      refetch();
    } catch (err: any) {
      flash(err?.data?.error || "Extension failed", true);
    }
  };

  const handleSuspend = async () => {
    if (!suspendReason.trim()) {
      flash("A suspension reason is required", true);
      return;
    }
    try {
      await suspendRest({ restaurantId: id, reason: suspendReason.trim() }).unwrap();
      setSuspendReason("");
      flash("Restaurant suspended");
      refetch();
    } catch (err: any) {
      flash(err?.data?.error || "Suspend failed", true);
    }
  };

  const handleReactivate = async () => {
    try {
      await reactivateRest({ restaurantId: id }).unwrap();
      flash("Restaurant reactivated");
      refetch();
    } catch (err: any) {
      flash(err?.data?.error || "Reactivate failed", true);
    }
  };

  const handleOverrideRate = async () => {
    const bps = Number(rateBps);
    if (!bps || bps < 0) {
      flash("Enter commission rate in basis points (e.g. 500 = 5%)", true);
      return;
    }
    try {
      await overrideRate({ restaurantId: id, new_rate_bps: bps, reason: rateReason || undefined }).unwrap();
      flash(`Commission overridden to ${(bps / 100).toFixed(2)}%`);
      refetch();
    } catch (err: any) {
      flash(err?.data?.error || "Override failed", true);
    }
  };

  if (isLoading && !data) {
    return <p className="text-xs text-gray-500">Loading restaurant activity…</p>;
  }

  if (!r) {
    return <p className="text-xs text-gray-500">Restaurant not found.</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href="/spadmin/restaurants" className="text-[11px] text-gray-500 hover:text-gray-300 font-mono">
            ← All restaurants
          </Link>
          <h1 className="text-xl font-extrabold text-white mt-1">{r.name}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                r.is_active ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"
              }`}
            >
              {r.is_active ? "ACTIVE" : "SUSPENDED"}
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                r.ownership_type === "FRANCHISE"
                  ? "bg-violet-500/15 text-violet-300"
                  : "bg-sky-500/15 text-sky-300"
              }`}
            >
              {r.ownership_type || "SINGLE"}
            </span>
            {r.franchise_name && (
              <span className="text-[11px] text-gray-400 font-mono">⚑ {r.franchise_name}</span>
            )}
            <span className="text-[11px] text-gray-500 font-mono">/{(r as any).slug || "—"}</span>
          </div>
        </div>
      </div>

      {(actionMsg || actionErr) && (
        <div
          className={`p-3 rounded-xl text-xs font-mono border ${
            actionErr
              ? "bg-red-500/10 border-red-500/30 text-red-300"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
          }`}
        >
          {actionErr || actionMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Subscription management */}
        <div className={card}>
          <h2 className="text-sm font-bold text-white mb-1">Subscription</h2>
          <div className="flex gap-5 text-xs text-gray-400 mb-4 flex-wrap">
            <span>Plan: <b className="text-white">{sub?.plan || "—"}</b></span>
            <span>Status: <b className="text-white">{sub?.status || "—"}</b></span>
            <span>
              Expires:{" "}
              <b className="text-white">
                {sub?.end_at ? new Date(sub.end_at).toLocaleDateString("en-IN") : "—"}
              </b>
            </span>
            <span>
              Days left:{" "}
              <b className={sub && sub.days_remaining <= 5 ? "text-red-400" : "text-amber-300"}>
                {sub?.days_remaining ?? "—"}
              </b>
            </span>
          </div>

          {/* OTP issuance */}
          <div className={label}>Generate activation OTP</div>
          <div className="flex gap-2 mt-1.5 flex-wrap">
            <select value={otpDays} onChange={(e) => setOtpDays(Number(e.target.value))} className={input}>
              {[30, 90, 180, 365].map((d) => (
                <option key={d} value={d}>{d} days</option>
              ))}
            </select>
            <select value={otpPlan} onChange={(e) => setOtpPlan(e.target.value)} className={input}>
              {["PRO", "STARTER", "ENTERPRISE"].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <button className={btnGold} onClick={handleGenerateOtp} disabled={isGenOtp}>
              <KeyRound className="w-3.5 h-3.5 inline mr-1" />
              {isGenOtp ? "Generating…" : "Issue OTP"}
            </button>
          </div>

          {issuedOtp && (
            <div className="mt-3 p-4 rounded-xl bg-amber-400/10 border border-amber-400/40 flex items-center justify-between gap-3">
              <div>
                <div className="text-3xl font-black font-mono tracking-[0.3em] text-amber-300">
                  {issuedOtp.otp}
                </div>
                <div className="text-[10px] font-mono text-gray-400 mt-1">
                  {issuedOtp.days}-day plan · expires{" "}
                  {new Date(issuedOtp.expires_at).toLocaleString("en-IN")}
                </div>
                <div className="text-[10px] text-amber-400/80 mt-0.5">
                  ⚠ Shown once — share securely with the restaurant admin.
                </div>
              </div>
              <button
                className={`${btnGold} bg-amber-400/20 text-amber-300 border border-amber-400/40`}
                onClick={() => {
                  navigator.clipboard.writeText(issuedOtp.otp);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          )}

          {/* OTP history */}
          <div className={label} style={{ marginTop: 16 }}>OTP history</div>
          <div className="mt-1.5 divide-y divide-[#2A303C] text-xs font-mono">
            {(otpHistory || []).length === 0 && (
              <p className="py-2 text-gray-500">No OTPs issued yet.</p>
            )}
            {(otpHistory || []).map((o) => (
              <div key={o.id} className="py-1.5 flex items-center justify-between text-gray-400">
                <span>{o.days}d · {o.plan}</span>
                <span
                  className={
                    o.status === "USED"
                      ? "text-emerald-400"
                      : o.status === "REVOKED"
                      ? "text-red-400"
                      : "text-amber-300"
                  }
                >
                  {o.status}
                </span>
                <span>{o.attempts} tries</span>
                <span className="text-[10px]">
                  {o.used_at
                    ? `used ${new Date(o.used_at).toLocaleDateString("en-IN")}`
                    : `exp ${new Date(o.expires_at).toLocaleDateString("en-IN")}`}
                </span>
              </div>
            ))}
          </div>

          {/* Direct extend */}
          <div className={label} style={{ marginTop: 16 }}>Direct extension</div>
          <div className="flex gap-2 mt-1.5">
            <input
              type="number"
              min={1}
              value={extendDays}
              onChange={(e) => setExtendDays(Number(e.target.value))}
              className={`${input} w-24`}
            />
            <button className={btnGold} onClick={handleExtend} disabled={isExtending}>
              {isExtending ? "Extending…" : "Extend subscription"}
            </button>
          </div>

          {/* Suspend / reactivate */}
          <div className={label} style={{ marginTop: 16 }}>Enforcement</div>
          {r.is_active ? (
            <div className="flex gap-2 mt-1.5">
              <input
                type="text"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Suspension reason (required)"
                className={`${input} flex-1`}
              />
              <button
                className="px-4 py-2 rounded-xl bg-red-500/15 text-red-300 border border-red-500/30 text-xs font-extrabold hover:bg-red-500/25 disabled:opacity-50"
                onClick={handleSuspend}
                disabled={isSuspending}
              >
                Suspend
              </button>
            </div>
          ) : (
            <button
              className="mt-1.5 px-4 py-2 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold hover:bg-emerald-500/25 disabled:opacity-50"
              onClick={handleReactivate}
              disabled={isReactivating}
            >
              {isReactivating ? "Reactivating…" : "Reactivate restaurant"}
            </button>
          )}

          {/* Commission override */}
          <div className={label} style={{ marginTop: 16 }}>Commission override</div>
          <div className="flex gap-2 mt-1.5 flex-wrap">
            <input
              type="number"
              value={rateBps}
              onChange={(e) => setRateBps(e.target.value)}
              placeholder="New rate (bps)"
              className={`${input} w-32`}
            />
            <input
              type="text"
              value={rateReason}
              onChange={(e) => setRateReason(e.target.value)}
              placeholder="Reason"
              className={`${input} flex-1`}
            />
            <button className={btnGold} onClick={handleOverrideRate} disabled={isOverriding}>
              {isOverriding ? "Saving…" : "Apply"}
            </button>
          </div>
        </div>

        {/* Live floor */}
        <div className={card}>
          <h2 className="text-sm font-bold text-white mb-1">Live Floor</h2>
          <p className="text-[11px] text-gray-500 mb-3">Polls every 10s</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {(data?.tables || []).map((t) => (
              <div
                key={t.table_id}
                className={`p-3 rounded-xl border text-xs ${
                  t.is_occupied
                    ? "border-amber-400/40 bg-amber-400/5"
                    : "border-[#2A303C] bg-[#0A0C0E]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <b className="text-white">{t.table_number}</b>
                  <span className="text-[10px] font-mono text-gray-500">
                    {t.guest_count ?? 0}/{t.capacity ?? 4} seats
                  </span>
                </div>
                {t.is_occupied ? (
                  <div className="mt-1.5 space-y-0.5">
                    <div className="text-gray-300">{t.customer_name || "Guest"}</div>
                    {t.assigned_waiter_name && (
                      <div className="text-[10px] text-amber-300">Waiter: {t.assigned_waiter_name}</div>
                    )}
                    <div className="text-[10px] font-mono text-gray-500">
                      {t.guest_count ?? 1} guests
                      {t.opened_at ? ` · since ${new Date(t.opened_at).toLocaleTimeString("en-IN")}` : ""}
                    </div>
                  </div>
                ) : (
                  <div className="mt-1.5 text-gray-600">Free</div>
                )}
              </div>
            ))}
            {(data?.tables || []).length === 0 && (
              <p className="text-xs text-gray-500 col-span-full">No tables configured.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className={card}>
        <h2 className="text-sm font-bold text-white mb-3">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[10px] font-mono uppercase tracking-wider text-gray-500">
                <th className="pb-2 pr-3">#</th>
                <th className="pb-2 pr-3">Table</th>
                <th className="pb-2 pr-3">Customer</th>
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2 pr-3">Accepted by</th>
                <th className="pb-2 text-right">Placed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A303C]">
              {(data?.recent_orders || []).map((o) => (
                <tr key={o.id} className="text-xs text-gray-300">
                  <td className="py-2 pr-3 font-mono">#{o.sequence_number}</td>
                  <td className="py-2 pr-3">{o.table_number || "—"}</td>
                  <td className="py-2 pr-3">{o.customer_name || "—"}</td>
                  <td className="py-2 pr-3">
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-[#2A303C] font-mono text-[10px]">
                      {o.status}
                    </span>
                  </td>
                  <td className="py-2 pr-3">{o.accepted_by_name || "—"}</td>
                  <td className="py-2 text-right font-mono text-[10px] text-gray-500">
                    {o.placed_at ? new Date(o.placed_at).toLocaleString("en-IN") : ""}
                  </td>
                </tr>
              ))}
              {(data?.recent_orders || []).length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-xs text-gray-500">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Staff */}
        <div className={card}>
          <h2 className="text-sm font-bold text-white mb-3">Staff</h2>
          <div className="divide-y divide-[#2A303C]">
            {(data?.staff || []).map((st) => (
              <div key={st.id} className="py-2 flex items-center justify-between text-xs">
                <div>
                  <b className="text-gray-200">{st.name}</b>
                  <span className="text-gray-500 font-mono text-[10px] ml-2">
                    {st.employee_id}
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[10px]">
                  <span className="text-gray-400">{st.role}</span>
                  <span className={st.is_active ? "text-emerald-400" : "text-red-400"}>
                    {st.is_active ? "active" : "disabled"}
                  </span>
                </div>
              </div>
            ))}
            {(data?.staff || []).length === 0 && (
              <p className="py-3 text-xs text-gray-500">No staff records.</p>
            )}
          </div>
        </div>

        {/* Audit log */}
        <div className={card}>
          <h2 className="text-sm font-bold text-white mb-3">Recent Audit Log</h2>
          <div className="divide-y divide-[#2A303C] max-h-80 overflow-y-auto">
            {(data?.recent_audit || []).map((a, i) => (
              <div key={i} className="py-2 text-xs">
                <b className="text-gray-200 font-mono text-[11px]">
                  {a.action || a.entity || "event"}
                </b>
                <span className="text-gray-500 ml-2 font-mono text-[10px]">
                  {a.actor_role || a.actor_type || ""}
                </span>
                <div className="text-[10px] font-mono text-gray-500 mt-0.5">
                  {a.created_at ? new Date(a.created_at as string).toLocaleString("en-IN") : ""}
                </div>
              </div>
            ))}
            {(data?.recent_audit || []).length === 0 && (
              <p className="py-3 text-xs text-gray-500">No audit events.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
