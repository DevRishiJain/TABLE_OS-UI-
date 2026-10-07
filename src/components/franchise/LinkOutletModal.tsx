"use client";

import React, { useState } from "react";
import {
  useGenerateFranchiseInviteCodeMutation,
  useCreateFranchiseOutletMutation,
} from "@/store/api/staffApi";
import { X, KeyRound, Store, ShieldCheck, Copy, Check } from "lucide-react";

interface LinkOutletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const LinkOutletModal: React.FC<LinkOutletModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [tab, setTab] = useState<"INVITE" | "CREATE">("INVITE");

  const [generateInviteCode, { isLoading: isGenerating }] = useGenerateFranchiseInviteCodeMutation();
  const [createOutlet, { isLoading: isCreating }] = useCreateFranchiseOutletMutation();

  // Protocol A (Generate OTP) State
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [codeExpiry, setCodeExpiry] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Protocol B (Direct Provisioning) State
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreSlug, setNewStoreSlug] = useState("");
  const [newVenueType, setNewVenueType] = useState("FINE_DINE");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [tableCount, setTableCount] = useState(4);
  const [defaultCapacity, setDefaultCapacity] = useState(4);
  const [createdInfo, setCreatedInfo] = useState<{ name: string; slug: string; admin_email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateCode = async () => {
    setError(null);
    try {
      const res = await generateInviteCode().unwrap();
      setGeneratedCode(res.code);
      setCodeExpiry(res.expires_at);
    } catch (err: any) {
      setError(err?.data?.error || "Failed to generate invite code");
    }
  };

  const handleCopy = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleCreateOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newStoreName.trim() || !adminEmail.trim() || !adminPassword) {
      setError("Outlet name, admin email and password are required.");
      return;
    }
    try {
      const res = await createOutlet({
        name: newStoreName.trim(),
        slug: newStoreSlug.trim() || newStoreName.toLowerCase().replace(/\s+/g, "-"),
        venue_type: newVenueType,
        admin_name: adminName.trim() || "Outlet Admin",
        email: adminEmail.trim(),
        password: adminPassword,
        phone: adminPhone.trim() || undefined,
        table_count: tableCount,
        default_capacity: defaultCapacity,
      }).unwrap();
      setCreatedInfo({ name: res.name, slug: res.slug, admin_email: res.admin_email });
      setNewStoreName("");
      setNewStoreSlug("");
      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
      setAdminPhone("");
      onCreated?.();
    } catch (err: any) {
      setError(err?.data?.error || "Failed to provision outlet");
    }
  };

  const inputCls =
    "w-full px-3.5 py-2 rounded-xl bg-surface-subtle border border-surface-border text-xs text-gray-100 focus:outline-none focus:border-amber-400 font-mono";
  const labelCls = "text-xs font-bold text-gray-300 block mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-surface border border-surface-border rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-gray-100 hover:bg-surface-subtle transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div>
          <h3 className="text-lg font-bold font-display text-gray-100 flex items-center gap-2">
            <Store className="w-5 h-5 text-amber-400" />
            Franchise Outlet Attachment Manager
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Securely link existing independent restaurants or provision new franchise outlets.
          </p>
        </div>

        {/* Protocol Switcher Tabs */}
        <div className="flex rounded-xl bg-surface-subtle p-1 border border-surface-border text-xs font-bold font-mono">
          <button
            onClick={() => setTab("INVITE")}
            className={`flex-1 py-2 rounded-lg transition-all ${
              tab === "INVITE"
                ? "bg-amber-500 text-black shadow-md font-extrabold"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Protocol A: Link Code OTP
          </button>
          <button
            onClick={() => setTab("CREATE")}
            className={`flex-1 py-2 rounded-lg transition-all ${
              tab === "CREATE"
                ? "bg-amber-500 text-black shadow-md font-extrabold"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Protocol B: Direct Provisioning
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
            {error}
          </div>
        )}

        {/* Protocol A Content */}
        {tab === "INVITE" ? (
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                2-Factor Mutual Verification Guarantee
              </div>
              Generate a single-use, 15-minute OTP code. The independent Store Owner must enter this code along with their Store Password under their Settings tab to complete the link.
            </div>

            {generatedCode ? (
              <div className="p-5 rounded-2xl bg-surface-subtle border border-amber-500/40 text-center flex flex-col items-center gap-2">
                <span className="text-[11px] font-mono text-gray-400 uppercase tracking-widest">
                  Single-Use Franchise Link OTP Code
                </span>
                <div className="text-3xl font-black font-mono tracking-widest text-amber-400 my-1">
                  {generatedCode}
                </div>
                <span className="text-[10px] font-mono text-emerald-400">
                  ⏱️ Expires{" "}
                  {codeExpiry
                    ? new Date(codeExpiry).toLocaleTimeString("en-IN")
                    : "in 15 minutes"}{" "}
                  · Single Use Only
                </span>

                <button
                  onClick={handleCopy}
                  className="mt-3 py-2 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold font-mono flex items-center gap-2 transition-all"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy OTP Code</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={handleGenerateCode}
                disabled={isGenerating}
                className="py-3 w-full rounded-xl bg-amber-500 text-black font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" />
                {isGenerating ? "Generating…" : "Generate Secure 15-Min Link OTP Code"}
              </button>
            )}
          </div>
        ) : createdInfo ? (
          /* Provisioning success screen */
          <div className="flex flex-col gap-3">
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex flex-col gap-1.5">
              <div className="font-bold text-sm">✓ Outlet provisioned</div>
              <div><b>{createdInfo.name}</b> is now part of your franchise.</div>
              <div className="font-mono">
                Handle: /{createdInfo.slug}
              </div>
              <div className="font-mono">
                Admin login: <b>{createdInfo.admin_email}</b>
              </div>
              <div className="text-emerald-400/80">
                Share the admin credentials with the outlet manager — they sign in at the staff login page.
              </div>
            </div>
            <button
              onClick={onClose}
              className="py-3 w-full rounded-xl bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          /* Protocol B Content */
          <form onSubmit={handleCreateOutlet} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Outlet Name *</label>
                <input
                  type="text"
                  required
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder="e.g. Spice Route - CP"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Handle / Slug *</label>
                <input
                  type="text"
                  required
                  value={newStoreSlug}
                  onChange={(e) => setNewStoreSlug(e.target.value)}
                  placeholder="spiceroute-cp"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Venue Type</label>
              <select
                value={newVenueType}
                onChange={(e) => setNewVenueType(e.target.value)}
                className={inputCls}
              >
                <option value="FINE_DINE">Fine Dine</option>
                <option value="CAFE">Cafe / Quick Dining</option>
                <option value="HOTEL">Hotel Room Service</option>
                <option value="DRIVE_IN">Drive-In</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Tables</label>
                <input
                  type="number"
                  min={1}
                  value={tableCount}
                  onChange={(e) => setTableCount(Math.max(1, Number(e.target.value)))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Seats per table</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={defaultCapacity}
                  onChange={(e) => setDefaultCapacity(Math.max(1, Number(e.target.value)))}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Outlet Admin Name *</label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Admin Email *</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="manager.cp@brand.com"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Admin Phone</label>
                <input
                  type="tel"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  placeholder="+91…"
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Admin Password *</label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Initial password"
                className={inputCls}
              />
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="mt-2 py-3 w-full rounded-xl bg-amber-500 text-black font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {isCreating ? "Provisioning..." : "Provision & Attach Franchise Outlet"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
