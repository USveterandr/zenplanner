import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zen Planner - AI-Powered Todo & Planner",
  description: "Beat procrastination with AI-powered task management, goal tracking, habit building, and productivity insights.",
  keywords: ["todo", "planner", "productivity", "AI", "task management", "goals", "habits"],
  authors: [{ name: "Zen Planner Team" }],
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-512.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#7c3aed",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
