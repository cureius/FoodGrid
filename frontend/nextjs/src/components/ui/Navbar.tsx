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
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 1000;
`;

const Tabs = styled.div`
  display: flex;
  background: #ECEFF3;
  padding: 4px;
  border-radius: 12px;
  gap: 4px;
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
  background: ${p => p.active ? "white" : "transparent"};
  color: ${p => p.active ? COLORS.textMain : COLORS.textMuted};
  box-shadow: ${p => p.active ? "0 2px 4px rgba(0,0,0,0.05)" : "none"};
  transition: all 0.2s;
`;

const ProfilePill = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  padding: 4px 12px 4px 6px;
  border-radius: 100px;
  border: 1px solid ${COLORS.border};
`;

export const Navbar = () => {
  const pathname = usePathname();
  return (
    <Nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ color: COLORS.primary }}><Box size={28} fill="currentColor" /></div>
          <span style={{ fontWeight: 800, fontSize: '20px' }}>CloudPos</span>
        </div>
        <Tabs>
          <Link href="/v2dashboard" passHref>
            <TabItem active={pathname === "/v2dashboard"}><LayoutDashboard size={18} /> Dashboard</TabItem>
          </Link>
          <Link href="/orders" passHref>
            <TabItem active={pathname === "/orders"}><ShoppingCart size={18} /> Order</TabItem>
          </Link>
          <Link href="/tables" passHref>
            <TabItem active={pathname === "/tables"}><Tablet size={18} /> Table</TabItem>
          </Link>
          <Link href="/reservations" passHref>
            <TabItem active={pathname === "/reservations"}><Calendar size={18} /> Reservation</TabItem>
          </Link>
          <Link href="/history" passHref>
            <TabItem active={pathname === "/history"}><History size={18} /> History</TabItem>
          </Link>
          <Link href="/inventory" passHref>
            <TabItem active={pathname === "/inventory"}><Box size={18} /> Inventory</TabItem>
          </Link>
        </Tabs>
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ padding: '10px', background: 'white', borderRadius: '50%', border: `1px solid ${COLORS.border}` }}>
          <Bell size={20} />
        </div>
        <ProfilePill>
          <img src="https://i.pravatar.cc/150?u=richardo" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
          <div style={{ fontSize: '13px' }}><b>Richardo</b> <span style={{ color: COLORS.textMuted }}>/ Waiter</span></div>
        </ProfilePill>
      </div>
    </Nav>
  );
};