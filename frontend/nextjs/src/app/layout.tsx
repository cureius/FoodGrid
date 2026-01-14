import "./globals.css";
import type { ReactNode } from "react";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata = {
  title: "FoodGrid POS",
  description: "Advanced Restaurant POS System"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
