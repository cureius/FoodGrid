import type { Metadata } from "next";
import { Inter } from "next/font/google";
import StyledComponentsRegistry from "@/lib/registry";
import { TenantAdminNavbar } from "@/components/ui/TenantAdminNavbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tenant Admin Dashboard",
  description: "FoodGrid Tenant Management System",
};

export default function TenantAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ margin: 0 }}>
        <StyledComponentsRegistry>
          <TenantAdminNavbar />
          {children}
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
