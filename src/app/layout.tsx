import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ReduxProvider } from "@/components/providers/ReduxProvider";
import { RestaurantThemeProvider } from "@/components/providers/RestaurantThemeProvider";

export const metadata: Metadata = {
  title: "TableOS | Next-Gen Restaurant Dining & Operations Operating System",
  description:
    "An all-in-one hospitality operating system for dine-in, cafes, bars, and cloud kitchens with instant QR ordering, live KDS, inventory management, and raw material sourcing.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
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
    <html lang="en" className="dark bg-background text-gray-100" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('tableos-theme');if(t&&t!=='amber'&&t!=='gold'){document.documentElement.setAttribute('data-theme',t);}else{document.documentElement.removeAttribute('data-theme');}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background antialiased selection:bg-primary/30 selection:text-primary">
        <ReduxProvider>
          <RestaurantThemeProvider>{children}</RestaurantThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
