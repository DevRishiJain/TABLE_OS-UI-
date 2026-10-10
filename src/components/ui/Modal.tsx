"use client";

import React, { useEffect, useId } from "react";
import { X } from "lucide-react";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: ModalSize;
  /** @deprecated use size */
  maxWidth?: ModalSize;
  dismissible?: boolean;
  closeDisabled?: boolean;
  showCloseButton?: boolean;
  className?: string;
  style?: React.CSSProperties;
  overlayStyle?: React.CSSProperties;
}

const SIZE_WIDTHS: Record<ModalSize, number> = {
  sm: 380,
  md: 480,
  lg: 620,
  xl: 760,
  "2xl": 920,
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size,
  maxWidth,
  dismissible = true,
  closeDisabled = false,
  showCloseButton = true,
  className,
  style,
  overlayStyle,
}) => {
  const titleId = useId();
  const canDismiss = dismissible && !closeDisabled;

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && canDismiss) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, canDismiss, onClose]);

  if (!isOpen) return null;

  const width = SIZE_WIDTHS[size || maxWidth || "md"];

  return (
    <div
      className="ov on"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && canDismiss) onClose();
      }}
      style={overlayStyle}
    >
      <div
        className={`md${className ? ` ${className}` : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        style={{ width: `min(${width}px, 100%)`, ...style }}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || description || (dismissible && showCloseButton)) && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              {title && (
                <h3 id={titleId} style={{ margin: 0 }}>
                  {title}
                </h3>
              )}
              {description && (
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "0.85rem",
                    color: "var(--admin-mute, #6F6350)",
                  }}
                >
                  {description}
                </p>
              )}
            </div>
            {dismissible && showCloseButton && (
              <button
                type="button"
                className="btn s sm"
                onClick={onClose}
                disabled={closeDisabled}
                aria-label="Close dialog"
                style={{ height: 32, padding: "0 10px", flexShrink: 0 }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
