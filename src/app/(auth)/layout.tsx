import React from "react";
import Link from "next/link";
import { Utensils } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-4 sm:p-6">
      <header className="max-w-7xl mx-auto w-full flex items-center justify-between py-2">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-glow">
            <Utensils className="w-4 h-4" />
          </div>
          <span className="font-display font-extrabold text-lg text-gray-100">
            Table<span className="text-primary">OS</span>
          </span>
        </Link>
        <Link
          href="/"
          className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          ← Back to Overview
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center py-8">
        {children}
      </main>

      <footer className="text-center text-xs text-gray-500 py-4 font-mono">
        TableOS Security • Encrypted HMAC-SHA256 Token Infrastructure
      </footer>
    </div>
  );
}
