"use client";
import styled from "styled-components";
import { LayoutDashboard, ShoppingCart, Tablet, Calendar, History, Box, Bell, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { COLORS } from "@/lib/constants";

const Nav = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;

  @media (max-width: 640px) {
    /* tighter navbar for phones */
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
  }

  @media (max-width: 640px) {
    span {
      font-size: 16px;
    }

    /* logo-only feel if screen is extremely narrow */
    @media (max-width: 360px) {
      span {
        display: none;
      }
    }
  }
`;

const Tabs = styled.div`
  display: flex;
  background: #eceff3;
  padding: 4px;
  border-radius: 12px;
  gap: 4px;

  @media (max-width: 640px) {
    /* Make tabs horizontally scrollable on mobile */
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
  background: ${(p) => (p.active ? "white" : "transparent")};
  color: ${(p) => (p.active ? COLORS.textMain : COLORS.textMuted)};
  box-shadow: ${(p) => (p.active ? "0 2px 4px rgba(0,0,0,0.05)" : "none")};
  transition: all 0.2s;
  white-space: nowrap;

  @media (max-width: 640px) {
    padding: 8px 12px;
    scroll-snap-align: start;

    /* On mobile, keep icon and shorten label footprint */
    font-size: 13px;

    svg {
      flex: 0 0 auto;
    }

    /* Hide text on very small screens (icons only) */
    @media (max-width: 420px) {
      span[data-label] {
        display: none;
      }
    }
  }
`;

const RightWrap = styled.div`
  display: flex;
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
  background: white;
  border-radius: 50%;
  border: 1px solid ${COLORS.border};
  display: inline-flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 640px) {
    padding: 8px;
  }
`;

const ProfilePill = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  padding: 4px 12px 4px 6px;
  border-radius: 100px;
  border: 1px solid ${COLORS.border};

  @media (max-width: 640px) {
    padding: 4px;
    gap: 6px;

    /* hide name/meta on mobile (keeps avatar accessible) */
    div {
      display: none;
    }
  }
`;

export const Navbar = () => {
  const pathname = usePathname();
  return (
    <Nav>
      <LeftWrap>
        <Brand>
          <div style={{ color: COLORS.primary }}>
            <Box size={24} fill="currentColor" />
          </div>
          <span>CloudPos</span>
        </Brand>

        <Tabs aria-label="Primary navigation">
          <Link href="/v2dashboard" passHref>
            <TabItem active={pathname === "/v2dashboard"}>
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
        <BellButton aria-label="Notifications">
          <Bell size={20} />
        </BellButton>
        <ProfilePill>
          <img src="https://i.pravatar.cc/150?u=richardo" alt="Richardo" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
          <div style={{ fontSize: "13px" }}>
            <b>Richardo</b> <span style={{ color: COLORS.textMuted }}>/ Waiter</span>
          </div>
        </ProfilePill>
      </RightWrap>
    </Nav>
  );
};