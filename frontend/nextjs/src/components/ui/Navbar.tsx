"use client";
import styled from "styled-components";
import { LayoutDashboard, ShoppingCart, Tablet, Calendar, History, Box, Bell, ChevronDown } from "lucide-react";
import { COLORS } from "@/lib/constants";

const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  margin-bottom: 24px;
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

export const Navbar = () => (
  <Nav>
    <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ color: COLORS.primary }}><Box size={28} fill="currentColor" /></div>
        <span style={{ fontWeight: 800, fontSize: '20px' }}>CloudPos</span>
      </div>
      <Tabs>
        <TabItem active><LayoutDashboard size={18} /> Dashboard</TabItem>
        <TabItem><ShoppingCart size={18} /> Order</TabItem>
        <TabItem><Tablet size={18} /> Table</TabItem>
        <TabItem><Calendar size={18} /> Reservation</TabItem>
        <TabItem><History size={18} /> History</TabItem>
        <TabItem><Box size={18} /> Inventory</TabItem>
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