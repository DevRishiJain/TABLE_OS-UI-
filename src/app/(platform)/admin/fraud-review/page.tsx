"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useGetFraudReviewQueueQuery } from "@/store/api/adminApi";
import { formatMoney } from "@/lib/money";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  ExternalLink,
  CheckCircle2,
  DollarSign,
  Filter,
  RefreshCw,
  Eye,
} from "lucide-react";

interface FraudIncident {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  session_id: string;
  table_number: string;
  incident_type: string;
  severity: "HIGH" | "CRITICAL" | "MEDIUM";
  amount_minor: number;
  reported_at: string;
  reason: string;
  status: "PENDING_REVIEW" | "FLAGGED_FRAUD" | "DISMISSED";
}

export default function FraudReviewPage() {
  const {
    data: apiIncidents,
    isLoading,
    refetch,
  } = useGetFraudReviewQueueQuery(undefined, { pollingInterval: 5000 });

  const [resolvedStatus, setResolvedStatus] = useState<
    Record<string, "FLAGGED_FRAUD" | "DISMISSED">
  >({});
  const [selectedIncident, setSelectedIncident] =
    useState<FraudIncident | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");

  const incidents: FraudIncident[] = (apiIncidents || []).map((item, idx) => {
    const id = `flag-${item.session_id}-${idx}`;
    const status = resolvedStatus[id] || "PENDING_REVIEW";
    const severity: "HIGH" | "CRITICAL" | "MEDIUM" =
      item.risk_score >= 80 ? "CRITICAL" : item.risk_score >= 50 ? "HIGH" : "MEDIUM";

    return {
      id,
      restaurant_id: item.restaurant_id,
      restaurant_name: item.restaurant_name || "Restaurant Property",
      session_id: item.session_id,
      table_number: "—",
      incident_type: item.flag_reason?.toUpperCase() || "FLAGGED_RISK",
      severity,
      amount_minor: item.amount_minor || 0,
      reported_at: item.created_at || new Date().toISOString(),
      reason: item.flag_reason || `Automated risk flag (score ${item.risk_score})`,
      status,
    };
  });

  const handleResolve = (
    id: string,
    newStatus: "FLAGGED_FRAUD" | "DISMISSED"
  ) => {
    setResolvedStatus((prev) => ({ ...prev, [id]: newStatus }));
    setSelectedIncident(null);
  };

  const filteredIncidents = incidents.filter((item) => {
    if (filterSeverity === "ALL") return true;
    return item.severity === filterSeverity;
  });

  const criticalCount = incidents.filter(
    (i) => i.severity === "CRITICAL" && i.status === "PENDING_REVIEW"
  ).length;
  const pendingCount = incidents.filter(
    (i) => i.status === "PENDING_REVIEW"
  ).length;
  const totalFlaggedLoss = incidents
    .filter((i) => i.status === "PENDING_REVIEW" || i.status === "FLAGGED_FRAUD")
    .reduce((acc, curr) => acc + curr.amount_minor, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Fraud & Risk Oversight Queue
            </h1>
            {criticalCount > 0 && (
              <Badge variant="error" className="animate-pulse">
                {criticalCount} Critical
              </Badge>
            )}
          </div>
          <p className="text-sm text-text-secondary mt-1">
            Real-time monitoring for unsettled walkouts, anomalous manager
            force-closes, and high-velocity order spikes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Unsettled Exposure
            </span>
            <DollarSign className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-text-primary mt-2">
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              formatMoney(totalFlaggedLoss)
            )}
          </p>
          <p className="text-xs text-text-muted mt-1">
            Pending review or confirmed walkouts
          </p>
        </Card>

        <Card className="p-5 border-l-4 border-l-accent-amber">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Active Flags
            </span>
            <AlertTriangle className="w-5 h-5 text-accent-amber" />
          </div>
          <p className="text-2xl font-bold text-text-primary mt-2">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              `${pendingCount} Incidents`
            )}
          </p>
          <p className="text-xs text-text-muted mt-1">
            Requiring admin review
          </p>
        </Card>

        <Card className="p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Network Guard Oversight
            </span>
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">Active</p>
          <p className="text-xs text-text-muted mt-1">
            Real-time exit gate verification active
          </p>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-surface-card border border-surface-border">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-muted ml-2" />
          <span className="text-xs font-medium text-text-secondary">
            Severity:
          </span>
          {["ALL", "CRITICAL", "HIGH", "MEDIUM"].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                filterSeverity === sev
                  ? "bg-accent-amber text-black font-semibold"
                  : "text-text-muted hover:text-text-primary hover:bg-surface-elevated"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Incident List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Card key={i} className="p-5">
                <Skeleton className="h-20 w-full" />
              </Card>
            ))}
          </div>
        ) : filteredIncidents.length === 0 ? (
          <Card className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-base font-medium text-text-primary">
              No High-Risk Incidents Detected
            </p>
            <p className="text-sm text-text-muted mt-1">
              All live sessions comply with standard billing settlement criteria.
            </p>
          </Card>
        ) : (
          filteredIncidents.map((incident) => {
            const isPending = incident.status === "PENDING_REVIEW";
            return (
              <Card
                key={incident.id}
                className={`p-5 transition-all ${
                  incident.severity === "CRITICAL" && isPending
                    ? "border-red-500/40 bg-red-950/10"
                    : "border-surface-border"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          incident.severity === "CRITICAL"
                            ? "error"
                            : incident.severity === "HIGH"
                            ? "warning"
                            : "blue"
                        }
                      >
                        {incident.severity}
                      </Badge>
                      <Badge variant="neutral">
                        {incident.incident_type.replace(/_/g, " ")}
                      </Badge>
                      <span className="text-xs text-text-muted font-mono">
                        Session: {incident.session_id.substring(0, 16)}...
                      </span>
                      {incident.status !== "PENDING_REVIEW" && (
                        <Badge
                          variant={
                            incident.status === "FLAGGED_FRAUD"
                              ? "error"
                              : "success"
                          }
                        >
                          {incident.status.replace(/_/g, " ")}
                        </Badge>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                        {incident.restaurant_name}
                        <Link
                          href={`/admin/restaurants/${incident.restaurant_id}`}
                          className="text-xs text-text-muted hover:text-accent-amber inline-flex items-center"
                        >
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </Link>
                      </h3>
                      <p className="text-sm text-text-secondary mt-1">
                        {incident.reason}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {new Date(incident.reported_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="font-semibold text-text-primary">
                        Exposure:{" "}
                        <span className="text-red-400 font-mono font-bold">
                          {formatMoney(incident.amount_minor)}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedIncident(incident)}
                    >
                      <Eye className="w-4 h-4 mr-1.5" />
                      Investigate
                    </Button>
                    {isPending && (
                      <>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            handleResolve(incident.id, "FLAGGED_FRAUD")
                          }
                        >
                          Confirm Loss
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            handleResolve(incident.id, "DISMISSED")
                          }
                        >
                          Dismiss
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Investigation Modal */}
      {selectedIncident && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedIncident(null)}
          title={`Incident Audit: ${selectedIncident.id}`}
        >
          <div className="space-y-4 text-sm">
            <div className="p-3 rounded-lg bg-surface-elevated border border-surface-border space-y-2">
              <div className="flex justify-between">
                <span className="text-text-muted">Restaurant Property:</span>
                <span className="font-medium text-text-primary">
                  {selectedIncident.restaurant_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Session Identifier:</span>
                <span className="font-mono text-text-primary">
                  {selectedIncident.session_id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Total Bill Amount:</span>
                <span className="font-bold text-red-400 font-mono">
                  {formatMoney(selectedIncident.amount_minor)}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-text-primary mb-1">
                System Forensic Note
              </h4>
              <p className="text-text-secondary text-xs bg-surface-elevated/50 p-3 rounded border border-surface-border leading-relaxed">
                {selectedIncident.reason}
              </p>
            </div>

            <div className="p-3 rounded bg-accent-amber/10 border border-accent-amber/20 text-accent-amber text-xs">
              <p className="font-semibold">Recommended Governance Action:</p>
              <p className="mt-0.5">
                Contact the restaurant floor manager to cross-reference CCTV
                footage before penalizing tenant or billing dispute ledger.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-surface-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIncident(null)}
              >
                Close Audit
              </Button>
              {selectedIncident.status === "PENDING_REVIEW" && (
                <>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() =>
                      handleResolve(selectedIncident.id, "FLAGGED_FRAUD")
                    }
                  >
                    Confirm Walkout Loss
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      handleResolve(selectedIncident.id, "DISMISSED")
                    }
                  >
                    Mark False Positive
                  </Button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
