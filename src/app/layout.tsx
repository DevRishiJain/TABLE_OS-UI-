import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ReduxProvider } from "@/components/providers/ReduxProvider";

export const metadata: Metadata = {
  title: "TableOS | Next-Gen Restaurant Dining & Operations Operating System",
  description:
    "An AI-native, fraud-resistant restaurant dining platform connecting table QR scan, real-time KDS, automated exit passes, and transparent 1% platform fee ledger.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0F1115",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-background text-gray-100">
      <body className="min-h-screen bg-background antialiased selection:bg-primary/30 selection:text-primary">
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
