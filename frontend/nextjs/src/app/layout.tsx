import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "FoodGrid POS",
  description: "Advanced Restaurant POS System"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
