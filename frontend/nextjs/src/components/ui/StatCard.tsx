"use client";
import styled from "styled-components";
import { theme } from "@/styles/theme";

const Card = styled.div`
  background: ${theme.colors.white};
  padding: 20px;
  border-radius: 16px;
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  box-shadow: ${theme.shadows.card};
  border: 1px solid ${theme.colors.border};
`;

const IconWrapper = styled.div<{ color: string }>`
  background: ${props => props.color}15;
  color: ${props => props.color};
  padding: 8px;
  border-radius: 10px;
`;

export const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <Card>
    <div>
      <p style={{ color: theme.colors.textSecondary, fontSize: '14px', marginBottom: '8px' }}>{title}</p>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>{value}</h2>
    </div>
    <IconWrapper color={color}><Icon size={20} /></IconWrapper>
  </Card>
);