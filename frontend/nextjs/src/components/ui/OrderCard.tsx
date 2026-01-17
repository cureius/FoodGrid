"use client";
import styled from "styled-components";
import { ChevronRight, Check } from "lucide-react";
import { COLORS } from "@/lib/constants";

const Card = styled.div`
  background: white;
  border: 1px solid ${COLORS.border};
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
`;

const ProgressRing = ({ pct }: { pct: number }) => {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const strokeDashoffset = circ - (pct / 100) * circ;
  return (
    <svg width="45" height="45">
      <circle cx="22.5" cy="22.5" r={r} fill="transparent" stroke="#F3F4F6" strokeWidth="4" />
      <circle cx="22.5" cy="22.5" r={r} fill="transparent" stroke={COLORS.orange} 
        strokeWidth="4" strokeDasharray={circ} strokeDashoffset={strokeDashoffset} 
        strokeLinecap="round" transform="rotate(-90 22.5 22.5)" />
      <text x="50%" y="55%" textAnchor="middle" fontSize="10px" fontWeight="700" fill={COLORS.orange}>{pct}%</text>
    </svg>
  );
};

export const OrderCard = ({ orderId, type, time, name, table, items, progress, status }: any) => (
  <Card>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: COLORS.textMuted, marginBottom: '12px' }}>
      <span>Order# <b>{orderId}</b> / {type}</span>
      <span>{time}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
      <div style={{ width: '36px', height: '36px', background: COLORS.primary, color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
        {table}
      </div>
      <div>
        <div style={{ fontSize: '11px', color: COLORS.textMuted }}>Customer Name</div>
        <div style={{ fontWeight: '700', fontSize: '14px' }}>{name}</div>
      </div>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      {progress ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ProgressRing pct={progress} />
          <span style={{ color: COLORS.orange, fontWeight: '700', fontSize: '13px' }}>In Progress</span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: COLORS.primary, fontSize: '13px', fontWeight: '600', background: COLORS.iconBg, padding: '6px 12px', borderRadius: '20px' }}>
          <Check size={14} /> {status}
        </div>
      )}
      <div style={{ color: COLORS.orange, fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center' }}>
        {items} Items <ChevronRight size={16} />
      </div>
    </div>
  </Card>
);