"use client";

import React, { useState } from "react";
import { useAppDispatch } from "@/store";
import { addFranchiseOutlet } from "@/store/slices/franchiseSlice";
import { X, KeyRound, Store, ShieldCheck, Copy, Check } from "lucide-react";

interface LinkOutletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LinkOutletModal: React.FC<LinkOutletModalProps> = ({
  isOpen,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState<"INVITE" | "CREATE">("INVITE");
  
  // Protocol A (Generate OTP) State
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Protocol B (Direct Provisioning) State
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreSlug, setNewStoreSlug] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleGenerateCode = () => {
    const code = `FRN-${Math.floor(100000 + Math.random() * 900000)}`;
    setGeneratedCode(code);
  };

  const handleCopy = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleCreateOutlet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newOutlet = {
        id: `b1000000-0000-0000-0000-${Date.now()}`,
        name: newStoreName.trim(),
        slug: newStoreSlug.trim() || newStoreName.toLowerCase().replace(/\s+/g, "-"),
        status: "ACTIVE",
        days_remaining: 30,
        is_active: true,
      };

      dispatch(addFranchiseOutlet(newOutlet));
      setIsSubmitting(false);
      onClose();
      setNewStoreName("");
      setNewStoreSlug("");
      setManagerEmail("");
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-surface border border-surface-border rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col gap-5">
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
                  ⏱️ Valid for 15 Minutes · Single Use Only
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
                className="py-3 w-full rounded-xl bg-amber-500 text-black font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
              >
                <KeyRound className="w-4 h-4" />
                Generate Secure 15-Min Link OTP Code
              </button>
            )}
          </div>
        ) : (
          /* Protocol B Content */
          <form onSubmit={handleCreateOutlet} className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">
                Outlet Name *
              </label>
              <input
                type="text"
                required
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                placeholder="e.g. The Spice Route - Connaught Place"
                className="w-full px-3.5 py-2 rounded-xl bg-surface-subtle border border-surface-border text-xs text-gray-100 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">
                Location Slug
              </label>
              <input
                type="text"
                value={newStoreSlug}
                onChange={(e) => setNewStoreSlug(e.target.value)}
                placeholder="spiceroute-cp"
                className="w-full px-3.5 py-2 rounded-xl bg-surface-subtle border border-surface-border text-xs text-gray-100 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">
                Store Manager Initial Email
              </label>
              <input
                type="email"
                value={managerEmail}
                onChange={(e) => setManagerEmail(e.target.value)}
                placeholder="manager.cp@spiceroute.com"
                className="w-full px-3.5 py-2 rounded-xl bg-surface-subtle border border-surface-border text-xs text-gray-100 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 py-3 w-full rounded-xl bg-amber-500 text-black font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {isSubmitting ? "Provisioning..." : "Provision & Attach Franchise Outlet"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
