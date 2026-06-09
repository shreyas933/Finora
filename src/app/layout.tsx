import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FinanceProvider } from "@/context/FinanceContext";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { CapacitorUserBridge } from "@/components/CapacitorUserBridge";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FINORA | AI Personal CFO",
  description: "Your smart financial assistant to track money, manage budgets, and plan goals.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FINORA",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#1e1b4b" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="shortcut icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-full text-foreground bg-background">
        <ServiceWorkerRegistrar />
        <CapacitorUserBridge />
        <FinanceProvider>
          {children}
        </FinanceProvider>
      </body>
    </html>
  );
}
