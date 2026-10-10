"use client";

import React, { useState } from "react";
import {
  useGenerateFranchiseInviteCodeMutation,
  useCreateFranchiseOutletMutation,
} from "@/store/api/staffApi";
import { Modal } from "@/components/ui/Modal";
import { KeyRound, ShieldCheck, Copy, Check } from "lucide-react";

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

  const isBusy = isCreating;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Franchise Outlet Attachment Manager"
      description="Securely link existing independent restaurants or provision new franchise outlets."
      size="lg"
      closeDisabled={isBusy}
    >
      {/* Protocol Switcher Tabs */}
      <div className="ch" style={{ marginBottom: 14 }}>
        <button
          type="button"
          className="chip"
          aria-pressed={tab === "INVITE"}
          onClick={() => setTab("INVITE")}
          style={{ flex: 1, justifyContent: "center" }}
        >
          Protocol A: Link Code OTP
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={tab === "CREATE"}
          onClick={() => setTab("CREATE")}
          style={{ flex: 1, justifyContent: "center" }}
        >
          Protocol B: Direct Provisioning
        </button>
      </div>

      {error && (
        <div className="al" style={{ marginBottom: 14 }}>
          <div>
            <b>Action failed</b>
            <small>{error}</small>
          </div>
        </div>
      )}

      {/* Protocol A Content */}
      {tab === "INVITE" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="al w" style={{ "--c": "var(--admin-am)" } as React.CSSProperties}>
            <div>
              <b style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <ShieldCheck size={16} />
                2-Factor Mutual Verification Guarantee
              </b>
              <small>
                Generate a single-use, 15-minute OTP code. The independent Store Owner must enter this
                code along with their Store Password under their Settings tab to complete the link.
              </small>
            </div>
          </div>

          {generatedCode ? (
            <div
              style={{
                padding: 20,
                borderRadius: 18,
                background: "var(--admin-s2)",
                border: "1.5px solid var(--admin-am)",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontWeight: 800,
                  color: "var(--admin-mute)",
                }}
              >
                Single-Use Franchise Link OTP Code
              </span>
              <div
                style={{
                  font: "400 2.6rem/1.1 var(--admin-serif)",
                  color: "var(--admin-am)",
                  letterSpacing: "0.12em",
                }}
              >
                {generatedCode}
              </div>
              <span style={{ fontSize: "0.8rem", color: "var(--admin-grn)", fontWeight: 700 }}>
                Expires{" "}
                {codeExpiry
                  ? new Date(codeExpiry).toLocaleTimeString("en-IN")
                  : "in 15 minutes"}{" "}
                · Single Use Only
              </span>

              <button
                type="button"
                className="btn s sm"
                onClick={handleCopy}
                style={{ marginTop: 10 }}
              >
                {isCopied ? (
                  <>
                    <Check size={16} />
                    Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy OTP Code
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn"
              onClick={handleGenerateCode}
              disabled={isGenerating}
              style={{ width: "100%" }}
            >
              <KeyRound size={16} />
              {isGenerating ? "Generating…" : "Generate Secure 15-Min Link OTP Code"}
            </button>
          )}
        </div>
      ) : createdInfo ? (
        /* Provisioning success screen */
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            className="al"
            style={{ "--c": "var(--admin-grn)" } as React.CSSProperties}
          >
            <div>
              <b>Outlet provisioned</b>
              <small>
                <b>{createdInfo.name}</b> is now part of your franchise.
                <br />
                Handle: /{createdInfo.slug}
                <br />
                Admin login: <b>{createdInfo.admin_email}</b>
                <br />
                Share the admin credentials with the outlet manager — they sign in at the staff
                login page.
              </small>
            </div>
          </div>
          <button type="button" className="btn" onClick={onClose} style={{ width: "100%" }}>
            Done
          </button>
        </div>
      ) : (
        /* Protocol B Content */
        <form onSubmit={handleCreateOutlet}>
          <div className="mf">
            <label>
              Outlet Name *
              <input
                type="text"
                required
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                placeholder="e.g. Spice Route - CP"
              />
            </label>
            <label>
              Handle / Slug *
              <input
                type="text"
                required
                value={newStoreSlug}
                onChange={(e) => setNewStoreSlug(e.target.value)}
                placeholder="spiceroute-cp"
              />
            </label>

            <label className="w">
              Venue Type
              <select
                value={newVenueType}
                onChange={(e) => setNewVenueType(e.target.value)}
              >
                <option value="FINE_DINE">Fine Dine</option>
                <option value="CAFE">Cafe / Quick Dining</option>
                <option value="HOTEL">Hotel Room Service</option>
                <option value="DRIVE_IN">Drive-In</option>
              </select>
            </label>

            <label>
              Tables
              <input
                type="number"
                min={1}
                value={tableCount}
                onChange={(e) => setTableCount(Math.max(1, Number(e.target.value)))}
              />
            </label>
            <label>
              Seats per table
              <input
                type="number"
                min={1}
                max={50}
                value={defaultCapacity}
                onChange={(e) => setDefaultCapacity(Math.max(1, Number(e.target.value)))}
              />
            </label>

            <label className="w">
              Outlet Admin Name *
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="e.g. Priya Sharma"
              />
            </label>
            <label>
              Admin Email *
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="manager.cp@brand.com"
              />
            </label>
            <label>
              Admin Phone
              <input
                type="tel"
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                placeholder="+91…"
              />
            </label>
            <label className="w">
              Admin Password *
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Initial password"
              />
            </label>
          </div>

          <div className="ac" style={{ marginTop: 20 }}>
            <button
              type="button"
              className="btn s"
              onClick={onClose}
              disabled={isBusy}
            >
              Cancel
            </button>
            <button type="submit" className="btn" disabled={isBusy}>
              {isCreating ? "Provisioning…" : "Provision & Attach Outlet"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
