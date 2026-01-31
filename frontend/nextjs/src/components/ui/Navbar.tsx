"use client";
import styled from "styled-components";
import { LayoutDashboard, ShoppingCart, Tablet, Calendar, History, Box, Bell, ChevronDown, Store } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { COLORS } from "@/lib/constants";
import Logo from "../Logo";
import { useOutlet } from "@/contexts/OutletContext";
import { ThemeSwitcher } from "../ThemeSwitcher";

const Nav = styled.nav`
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  background: var(--bg-surface);
  box-shadow: var(--shadow-sm);
  border-bottom: 1px solid var(--border-light);

  @media (max-width: 640px) {
    padding: 10px 0;
  }
`;

const LeftWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 0 16px;
  min-width: 0;

  @media (max-width: 640px) {
    gap: 12px;
    padding: 0 12px;
    flex: 1;
  }
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;

  span {
    font-weight: 800;
    font-size: 20px;
    color: var(--text-main);
  }

  @media (max-width: 640px) {
    span {
      font-size: 16px;
    }

    @media (max-width: 360px) {
      span {
        display: none;
      }
    }
  }
`;

const Tabs = styled.div`
  display: flex;
  background: var(--bg-secondary);
  padding: 4px;
  border-radius: 12px;
  gap: 4px;

  @media (max-width: 640px) {
    flex: 1;
    min-width: 0;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const TabItem = styled.div<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background: ${(p) => (p.active ? "var(--bg-surface)" : "transparent")};
  color: ${(p) => (p.active ? "var(--text-main)" : "var(--text-muted)")};
  box-shadow: ${(p) => (p.active ? "var(--shadow-sm)" : "none")};
  transition: all 0.2s;
  white-space: nowrap;

  @media (max-width: 640px) {
    padding: 8px 12px;
    scroll-snap-align: start;
    font-size: 13px;

    svg {
      flex: 0 0 auto;
    }

    @media (max-width: 420px) {
      span[data-label] {
        display: none;
      }
    }
  }
`;

const RightWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding-right: 16px;
  flex: 0 0 auto;

  @media (max-width: 640px) {
    gap: 8px;
    padding-right: 12px;
  }
`;

const BellButton = styled.button`
  padding: 10px;
  background: var(--bg-surface);
  border-radius: 50%;
  border: 1px solid var(--border-light);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-main);

  @media (max-width: 640px) {
    padding: 8px;
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

  @media (max-width: 640px) {
    padding: 4px;
    gap: 6px;

    div {
      display: none;
    }
  }
`;

const OutletBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--primary-light);
  padding: 8px 14px;
  border-radius: 12px;
  border: 1px solid var(--primary-border);
  font-size: 13px;
  font-weight: 600;
  color: var(--primary);

  svg {
    flex-shrink: 0;
  }

  @media (max-width: 768px) {
    padding: 6px 10px;
    font-size: 12px;
    
    span {
      max-width: 80px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  @media (max-width: 480px) {
    span {
      display: none;
    }
  }
`;

export const Navbar = () => {
  const pathname = usePathname();
  const { selectedOutlet } = useOutlet();

  return (
    <Nav>
      <LeftWrap>
        <Brand>
          <Logo size={34} />
        </Brand>

        <Tabs aria-label="Primary navigation">
          <Link href="/dashboard" passHref>
            <TabItem active={pathname === "/dashboard"}>
              <LayoutDashboard size={18} /> <span data-label>Dashboard</span>
            </TabItem>
          </Link>
          <Link href="/orders" passHref>
            <TabItem active={pathname === "/orders"}>
              <ShoppingCart size={18} /> <span data-label>Order</span>
            </TabItem>
          </Link>
          <Link href="/tables" passHref>
            <TabItem active={pathname === "/tables"}>
              <Tablet size={18} /> <span data-label>Table</span>
            </TabItem>
          </Link>
          <Link href="/history" passHref>
            <TabItem active={pathname === "/history"}>
              <History size={18} /> <span data-label>History</span>
            </TabItem>
          </Link>
          <Link href="/inventory" passHref>
            <TabItem active={pathname === "/inventory"}>
              <Box size={18} /> <span data-label>Inventory</span>
            </TabItem>
          </Link>
        </Tabs>
      </LeftWrap>

      <RightWrap>
        <ThemeSwitcher />
        {selectedOutlet && (
          <OutletBadge>
            <Store size={16} />
            <span>{selectedOutlet.name}</span>
          </OutletBadge>
        )}
        <BellButton aria-label="Notifications">
          <Bell size={20} />
        </BellButton>
        <ProfilePill>
          <img src="https://i.pravatar.cc/150?u=richardo" alt="Richardo" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
          <div style={{ fontSize: "13px" }}>
            <b>Richardo</b> <span style={{ color: "var(--text-muted)" }}>/ Waiter</span>
          </div>
        </ProfilePill>
      </RightWrap>
    </Nav>
  );
};