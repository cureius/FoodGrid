"use client";
import styled from "styled-components";
import { LayoutDashboard, ShoppingCart, Tablet, Calendar, History, Box, Bell, ChevronDown, Store, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { COLORS } from "@/lib/constants";
import Logo from "../Logo";
import { useOutlet } from "@/contexts/OutletContext";
import { ThemeSwitcher } from "../ThemeSwitcher";

const Nav = styled.nav`
  position: sticky;
  z-index: 1100;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 clamp(12px, 2vw, 24px);
  background: var(--bg-surface);
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  border-bottom: 1px solid var(--border-light);
  height: 64px;
  box-sizing: border-box;

  @media (max-width: 1024px) {
    height: 60px;
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;

  span {
    font-weight: 800;
    font-size: 19px;
    color: var(--text-main);
    letter-spacing: -0.5px;
  }

  @media (max-width: 1200px) {
    span { display: none; }
  }
`;

const MiddleSection = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  min-width: 0;
  padding: 0 16px;

  @media (max-width: 1024px) {
    justify-content: flex-start;
    padding: 0 8px;
  }
`;

const Tabs = styled.div`
  display: flex;
  background: var(--bg-secondary);
  padding: 4px;
  border-radius: 12px;
  gap: 2px;
  min-width: 0;

  @media (max-width: 1150px) {
    background: transparent;
    padding: 0;
  }

  @media (max-width: 1024px) {
    overflow-x: auto;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
    -webkit-overflow-scrolling: touch;
  }
`;

const TabItem = styled.div<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  background: ${(p) => (p.active ? "var(--bg-surface)" : "transparent")};
  color: ${(p) => (p.active ? "var(--text-main)" : "var(--text-muted)")};
  box-shadow: ${(p) => (p.active ? "0 2px 4px rgba(0,0,0,0.05)" : "none")};
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;

  &:hover {
    color: var(--text-main);
    background: ${(p) => (p.active ? "var(--bg-surface)" : "rgba(0,0,0,0.03)")};
  }

  @media (max-width: 1250px) {
    padding: 8px 10px;
    span[data-label] { display: none; }
  }

  @media (max-width: 1150px) {
     background: ${(p) => (p.active ? "var(--primary-light)" : "transparent")};
     color: ${(p) => (p.active ? "var(--primary)" : "var(--text-muted)")};
     padding: 10px;
     border-radius: 50%;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: clamp(8px, 1.5vw, 16px);
  flex-shrink: 0;
`;

const ActionBtn = styled.button`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-light);
  background: var(--bg-surface);
  color: var(--text-main);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--bg-secondary);
    border-color: var(--border-main);
    transform: translateY(-1px);
  }

  @media (max-width: 1024px) {
    width: 34px;
    height: 34px;
    svg { width: 18px; height: 18px; }
  }
`;

const OutletBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--primary-light);
  padding: 8px 14px;
  border-radius: 100px;
  border: 1px solid var(--primary-border);
  font-size: 13px;
  font-weight: 600;
  color: var(--primary);
  cursor: pointer;

  @media (max-width: 1350px) {
    span {
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  @media (max-width: 1200px) {
    span { display: none; }
    padding: 10px;
  }
`;

const ProfilePill = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg-surface);
  padding: 4px 12px 4px 6px;
  border-radius: 100px;
  border: 1px solid var(--border-light);
  color: var(--text-main);
  cursor: pointer;

  .name-box {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
  }

  @media (max-width: 1400px) {
    .name-box { display: none; }
    padding: 4px;
  }
`;

export const Navbar = () => {
  const pathname = usePathname();
  const { selectedOutlet } = useOutlet();

  return (
    <Nav>
      <LeftSection>
        <Brand>
          <Logo size={34} />
          <span>FoodGrid</span>
        </Brand>
      </LeftSection>

      <MiddleSection>
        <Tabs aria-label="Primary navigation">
          <Link href="/dashboard" passHref>
            <TabItem active={pathname === "/dashboard"}>
              <LayoutDashboard size={20} /> <span data-label>Dashboard</span>
            </TabItem>
          </Link>
          <Link href="/orders" passHref>
            <TabItem active={pathname === "/orders"}>
              <ShoppingCart size={20} /> <span data-label>Order</span>
            </TabItem>
          </Link>
          <Link href="/tables" passHref>
            <TabItem active={pathname === "/tables"}>
              <Tablet size={20} /> <span data-label>Table</span>
            </TabItem>
          </Link>
          <Link href="/pos" passHref>
            <TabItem active={pathname === "/pos"}>
              <LayoutGrid size={20} /> <span data-label>POS</span>
            </TabItem>
          </Link>
          <Link href="/history" passHref>
            <TabItem active={pathname === "/history"}>
              <History size={20} /> <span data-label>History</span>
            </TabItem>
          </Link>
          <Link href="/inventory" passHref>
            <TabItem active={pathname === "/inventory"}>
              <Box size={20} /> <span data-label>Inventory</span>
            </TabItem>
          </Link>
        </Tabs>
      </MiddleSection>

      <RightSection>
        <ThemeSwitcher />
        {selectedOutlet && (
          <OutletBadge title={selectedOutlet.name}>
            <Store size={18} />
            <span>{selectedOutlet.name}</span>
          </OutletBadge>
        )}
        <ActionBtn aria-label="Notifications">
          <Bell size={20} />
        </ActionBtn>
        <ProfilePill>
          {(() => {
            if (typeof window === "undefined") return null;

            const isClientAdmin = pathname.startsWith('/client-admin') || 
                                  pathname.startsWith('/tenant-admin') ||
                                  pathname.startsWith('/internal-admin');
            
            const userStr = isClientAdmin 
              ? localStorage.getItem("fg_client_admin_user") 
              : localStorage.getItem("fg_staff_user");
              
            const user = userStr ? JSON.parse(userStr) : null;
            const displayName = user?.displayName || user?.email?.split('@')[0] || "User";
            const roleStr = user?.roles?.[0] || (isClientAdmin ? "Admin" : "Staff");
            const avatarUrl = user?.avatarUrl || "";

            return (
              <>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                ) : (
                  <div style={{ 
                    width: "32px", height: "32px", borderRadius: "50%", 
                    background: "var(--bg-secondary)", 
                    color: "var(--text-main)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "13px", fontWeight: "bold", border: "1px solid var(--border-light)"
                  }}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="name-box">
                  <span style={{ fontSize: "13px", fontWeight: "700" }}>{displayName}</span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{roleStr}</span>
                </div>
              </>
            );
          })()}
        </ProfilePill>
      </RightSection>
    </Nav>
  );
};