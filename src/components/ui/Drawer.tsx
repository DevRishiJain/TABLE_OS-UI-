import React, { useEffect } from "react";
import { X } from "lucide-react";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: "bottom" | "right";
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  position = "bottom",
  className = "",
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {position === "bottom" ? (
        <div className="fixed inset-x-0 bottom-0 max-h-[90vh] flex flex-col rounded-t-3xl bg-surface border-t border-surface-border shadow-2xl z-10 animate-in slide-in-from-bottom duration-300">
          <div className="mx-auto w-12 h-1.5 bg-gray-700 rounded-full mt-3 mb-1" />
          <div className="flex items-center justify-between px-6 py-3 border-b border-surface-border/50">
            {title ? (
              <h3 className="text-base font-bold text-gray-100 font-display">
                {title}
              </h3>
            ) : <div />}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-surface-hover"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className={`overflow-y-auto p-6 ${className}`}>{children}</div>
        </div>
      ) : (
        <div className="fixed inset-y-0 right-0 w-full max-w-md flex flex-col bg-surface border-l border-surface-border shadow-2xl z-10 animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
            {title ? (
              <h3 className="text-lg font-bold text-gray-100 font-display">
                {title}
              </h3>
            ) : <div />}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-surface-hover"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className={`overflow-y-auto p-6 flex-1 ${className}`}>{children}</div>
        </div>
      )}
    </div>
  );
};
