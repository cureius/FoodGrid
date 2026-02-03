import "./globals.css";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/styles/ThemeProvider";

export const metadata = {
  title: "FoodGrid | Restaurant Management System",
  description: "Advanced Restaurant POS System"
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
