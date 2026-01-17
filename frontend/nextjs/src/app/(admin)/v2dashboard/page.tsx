"use client";
import styled from "styled-components";
import { Navbar } from "@/components/ui/Navbar";
import { OrderCard } from "@/components/ui/OrderCard";
import { Plus, CreditCard, Clock, CheckCircle, FileText, ChevronRight } from "lucide-react";
import { COLORS } from "@/lib/constants";

const Main = styled.main`
  background: ${COLORS.bg};
  min-height: 100vh;
  padding: 80px 40px 40px; /* top padding for fixed navbar */
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: white;
  padding: 24px;
  border-radius: 20px;
  display: flex;
  justify-content: space-between;
  border: 1px solid ${COLORS.border};
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 340px;
  gap: 24px;
  align-items: start;
`;

const Section = styled.div`
  background: white;
  border-radius: 24px;
  padding: 24px;
  border: 1px solid ${COLORS.border};
  min-height: 500px;
  display: flex;
  flex-direction: column;
`;

const CreateBtn = styled.button`
  background: ${COLORS.primary};
  color: white;
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  border: none;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
  cursor: pointer;
  box-shadow: 0 8px 16px rgba(75, 139, 255, 0.2);
`;

export default function Dashboard() {
  return (
    <Main>
      <Navbar />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Good Morning, Richardo</h1>
          <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>Give your best services for customers, happy working 😌</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '800' }}>09:55:02</h1>
          <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>Thu, 2 April 2025</p>
        </div>
      </div>

      <StatGrid>
        {[
          { label: "Total Earning", val: "$ 1,400", icon: CreditCard },
          { label: "In Progress", val: "11", icon: Clock },
          { label: "Ready to Served", val: "5", icon: CheckCircle },
          { label: "Completed", val: "8", icon: FileText },
        ].map((s, i) => (
          <StatCard key={i}>
            <div>
              <p style={{ color: COLORS.textMuted, fontSize: '14px', marginBottom: '8px' }}>{s.label}</p>
              <h2 style={{ fontSize: '28px', fontWeight: '800' }}>{s.val}</h2>
            </div>
            <div style={{ width: '40px', height: '40px', background: COLORS.iconBg, color: COLORS.primary, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={20} />
            </div>
          </StatCard>
        ))}
      </StatGrid>

      <ContentGrid>
        {/* Column 1 */}
        <Section>
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>In Progress</h3>
          <OrderCard orderId="DI008" type="Dine In" time="Mon, 17 Feb 03:43 PM" name="Daniel" table="A1" items={6} progress={10} />
          <OrderCard orderId="TA001" type="Take Away" time="Mon, 17 Feb 02:56 PM" name="Vlona" table="V" items={3} progress={60} />
          <div style={{ marginTop: 'auto', textAlign: 'center', borderTop: `1px solid ${COLORS.border}`, paddingTop: '16px', fontWeight: '700', color: COLORS.textMain, cursor: 'pointer' }}>
            See All Order <ChevronRight size={16} style={{ verticalAlign: 'middle' }} />
          </div>
        </Section>

        {/* Column 2 */}
        <Section>
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>Waiting for Payments</h3>
          <OrderCard orderId="DI002" type="Dine In" time="Mon, 17 Feb 10:32 AM" name="Daniel" table="A4" items={6} status="Waiting for Payment" />
          <OrderCard orderId="DI001" type="Dine In" time="Mon, 17 Feb 10:24 AM" name="Eve" table="B3" items={6} status="Waiting for Payment" />
          <div style={{ marginTop: 'auto', textAlign: 'center', borderTop: `1px solid ${COLORS.border}`, paddingTop: '16px', fontWeight: '700', color: COLORS.textMain, cursor: 'pointer' }}>
            See All Order <ChevronRight size={16} style={{ verticalAlign: 'middle' }} />
          </div>
        </Section>

        {/* Sidebar */}
        <div>
          <CreateBtn><Plus size={20} /> Create New Order</CreateBtn>
          
          <Section style={{ minHeight: 'auto', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Table Available</h3>
              <select style={{ background: 'none', border: `1px solid ${COLORS.border}`, padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}>
                <option>First Floor</option>
              </select>
            </div>
            {['A1', 'A7', 'A8', 'A15'].map(t => (
              <div key={t} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${COLORS.border}`, fontSize: '14px' }}>
                <span style={{ fontWeight: '700' }}>{t}</span>
                <span style={{ color: COLORS.textMuted }}>{t === 'A15' ? '6' : '4'} Person</span>
              </div>
            ))}
          </Section>

          <Section style={{ minHeight: 'auto' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>Out of Stock</h3>
            {[
              { name: "Hawaiian Chicken Skewers", time: "03:00 PM" },
              { name: "BBQ Beef Ribs", time: "04:30 PM" },
              { name: "Veggie Supreme Pizza", time: "04:30 PM" }
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                 <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f0f0f0', overflow: 'hidden' }}>
                    <img src={`https://source.unsplash.com/100x100/?food,${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                 </div>
                 <div>
                    <div style={{ fontWeight: '700', fontSize: '14px' }}>{item.name}</div>
                    <div style={{ color: COLORS.primary, fontSize: '12px', fontWeight: '600' }}>Available: {item.time}</div>
                 </div>
              </div>
            ))}
          </Section>
        </div>
      </ContentGrid>
    </Main>
  );
}