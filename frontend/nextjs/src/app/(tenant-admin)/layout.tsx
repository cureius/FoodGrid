import type { Metadata } from "next";
import { Inter } from "next/font/google";
import StyledComponentsRegistry from "@/lib/registry";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FoodGrid | Tenant Admin Dashboard",
  description: "FoodGrid Tenant Management System",
};

export default function TenantAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={inter.className}>
      <StyledComponentsRegistry>
        {children}
      </StyledComponentsRegistry>
    </div>
  );
}
