"use client";

import React, { useEffect } from "react";
import { X, ShieldCheck, Lock, FileText, Phone, Mail } from "lucide-react";

export type ModalType = "privacy" | "security" | "terms" | null;

interface PolicyModalsProps {
  activeModal: ModalType;
  onClose: () => void;
}

export function PolicyModals({ activeModal, onClose }: PolicyModalsProps) {
  useEffect(() => {
    if (!activeModal) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeModal, onClose]);

  if (!activeModal) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
      style={{ background: "rgba(8,6,4,0.6)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-[#12151B] border border-surface-border rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative text-gray-200 space-y-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              {activeModal === "privacy" && <Lock className="w-5 h-5" />}
              {activeModal === "security" && <ShieldCheck className="w-5 h-5" />}
              {activeModal === "terms" && <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white">
                {activeModal === "privacy" && "Privacy & Data Protection Policy"}
                {activeModal === "security" && "Enterprise Security & Fraud Protection"}
                {activeModal === "terms" && "Terms of Service & Licensing"}
              </h2>
              <p className="text-xs text-gray-400">TableOS Hospitality Operating Standard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface border border-surface-border hover:bg-surface-hover flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="text-xs text-gray-300 leading-relaxed space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {activeModal === "privacy" && (
            <>
              <p>
                At TableOS, we hold guest confidentiality and restaurant operational data with the highest standard of privacy. All dining sessions, digital menu interactions, order histories, and payment receipts are strictly isolated per tenant restaurant.
              </p>
              <h4 className="text-sm font-bold text-white pt-2">1. Guest Information</h4>
              <p>
                We do not sell, barter, or distribute diner phone numbers or ordering patterns to third-party ad networks. Guest contact details collected during order placement or OTP validation are utilized solely for digital receipt delivery, kitchen updates, and exit gate validation.
              </p>
              <h4 className="text-sm font-bold text-white pt-2">2. Financial Isolation</h4>
              <p>
                Payment processing information is routed directly through regulated banking gateways. TableOS never stores CVVs or unencrypted card numbers on application servers.
              </p>
              <h4 className="text-sm font-bold text-white pt-2">3. Data Retention & Deletion</h4>
              <p>
                Restaurant owners retain full sovereignty over their inventory catalogs, employee logs, recipe BOM costs, and daily sales receipts. Data can be exported or purged on request by contacting concierge@tableos.in.
              </p>
            </>
          )}

          {activeModal === "security" && (
            <>
              <p>
                TableOS is built ground-up to eliminate revenue shrinkage, inventory leakage, and table walkouts.
              </p>
              <h4 className="text-sm font-bold text-white pt-2">1. Cryptographic Exit Gate Pass</h4>
              <p>
                Every table session generates an authenticated digital ExitPass upon verified bill settlement. Security door scanners and staff tablets cross-verify passes to ensure zero unpaid departures.
              </p>
              <h4 className="text-sm font-bold text-white pt-2">2. Role-Based Station Access</h4>
              <p>
                Staff accounts (Waiters, Chefs, Cashiers, Floor Managers) operate on zero-trust station isolation. Staff cannot alter settled bills, delete recipe costs, or access other tenant databases.
              </p>
              <h4 className="text-sm font-bold text-white pt-2">3. End-to-End Encryption</h4>
              <p>
                All data transmission between guest mobile devices, staff floor tablets, kitchen KDS screens, and the central cloud ledger is encrypted using TLS 1.3 standards.
              </p>
            </>
          )}

          {activeModal === "terms" && (
            <>
              <p>
                Welcome to TableOS. By deploying TableOS in your restaurant, cafe, bar, hotel, or cloud kitchen, you agree to our operating terms.
              </p>
              <h4 className="text-sm font-bold text-white pt-2">1. 2-Month Free Trial Guarantee</h4>
              <p>
                New hospitality partners enjoy an unrestricted 2-month introductory period with zero platform subscription charges and zero setup fees. No credit card is required to initiate onboarding.
              </p>
              <h4 className="text-sm font-bold text-white pt-2">2. Hardware Compatibility</h4>
              <p>
                TableOS runs smoothly in any modern web browser across iPads, Android tablets, kitchen touch monitors, thermal printers, and diner smartphones. No proprietary locked-in hardware is mandated.
              </p>
              <h4 className="text-sm font-bold text-white pt-2">3. Concierge SLA & Support</h4>
              <p>
                Enterprise hospitality clients receive 24/7 technical desk access via phone (+91 1800 890 3240) and dedicated email support (concierge@tableos.in).
              </p>
            </>
          )}
        </div>

        {/* Footer Contact bar */}
        <div className="pt-4 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-400 bg-surface/40 -mx-6 -mb-6 p-4 rounded-b-3xl">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-primary" />
            <span>Customer Care: <strong className="text-gray-200">+91 1800 890 3240</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-primary" />
            <span>Support Desk: <strong className="text-gray-200">concierge@tableos.in</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
