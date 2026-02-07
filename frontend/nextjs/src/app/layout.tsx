import "./globals.css";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/styles/ThemeProvider";

export const metadata = {
  title: "FoodGrid | Restaurant Management System",
  description: "Advanced Restaurant POS System - Streamline your restaurant operations with digital menus, order management, and analytics",
  keywords: ["restaurant", "POS", "point of sale", "food ordering", "restaurant management", "digital menu"],
  authors: [{ name: "FoodGrid" }],
  creator: "FoodGrid",
  publisher: "FoodGrid",
  applicationName: "FoodGrid",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FoodGrid",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "FoodGrid",
    title: "FoodGrid | Restaurant Management System",
    description: "Advanced Restaurant POS System",
  },
  twitter: {
    card: "summary",
    title: "FoodGrid | Restaurant Management System",
    description: "Advanced Restaurant POS System",
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4B70F5" },
    { media: "(prefers-color-scheme: dark)", color: "#1e293b" },
  ],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
