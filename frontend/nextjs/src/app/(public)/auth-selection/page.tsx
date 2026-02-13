"use client";

import React from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Building2, Store, Users, User, ArrowRight, ShieldCheck } from 'lucide-react';
import Logo from '@/components/Logo';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-app);
`;

const Content = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 500px;
  background: var(--bg-surface);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
  border: 1px solid var(--component-border);
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 12px;
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: 15px;
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: 40px;
  line-height: 1.5;
`;

const Grid = styled.div`
  display: grid;
  gap: 16px;
`;

const Option = styled(Link)`
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px;
  border-radius: 16px;
  text-decoration: none;
  border: 2px solid var(--component-border);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--bg-surface);

  &:hover {
    border-color: var(--primary);
    background: var(--primary-light);
    transform: translateY(-2px);
  }
`;

const IconBox = styled.div<{ bg: string; color: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${p => p.bg};
  color: ${p => p.color};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TextContent = styled.div`
  flex: 1;

  span:first-child {
    display: block;
    font-size: 16px;
    font-weight: 700;
    color: var(--text-primary);
  }

  span:last-child {
    display: block;
    font-size: 13px;
    color: var(--text-secondary);
    margin-top: 2px;
  }
`;

export default function LoginSelectionPage() {
  return (
    <Container>
      <header style={{ padding: '24px 40px' }}>
        <Logo size={32} />
      </header>

      <Content>
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
           style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
        >
          <Card>
            <Title>Welcome Back</Title>
            <Subtitle>Please select your login type to access the FoodGrid ecosystem.</Subtitle>

            <Grid>
              <Option href="/tenant-admin-login">
                <IconBox bg="var(--primary-light)" color="var(--primary)">
                  <Building2 size={24} />
                </IconBox>
                <TextContent>
                  <span>Tenant Admin</span>
                  <span>Manage your brand & chain settings</span>
                </TextContent>
                <ArrowRight size={18} color="var(--text-tertiary)" />
              </Option>

              <Option href="/client-admin/login">
                <IconBox bg="var(--success-light)" color="var(--success)">
                  <Store size={24} />
                </IconBox>
                <TextContent>
                  <span>Client Admin</span>
                  <span>Outlet owners & store managers</span>
                </TextContent>
                <ArrowRight size={18} color="var(--text-tertiary)" />
              </Option>

              <Option href="/staff-login">
                <IconBox bg="var(--warning-light)" color="var(--warning)">
                  <Users size={24} />
                </IconBox>
                <TextContent>
                  <span>Staff / POS</span>
                  <span>Cooks, waiters and cashiers</span>
                </TextContent>
                <ArrowRight size={18} color="#94a3b8" />
              </Option>

              {/* <Option href="/user/login">
                <IconBox bg="#f3e8ff" color="#9333ea">
                  <User size={24} />
                </IconBox>
                <TextContent>
                  <span>Customer</span>
                  <span>Orders, rewards and profile</span>
                </TextContent>
                <ArrowRight size={18} color="#94a3b8" />
              </Option> */}
            </Grid>

            <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--component-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
              <ShieldCheck size={16} />
              Secure multi-role authentication system
            </div>
          </Card>
        </motion.div>
      </Content>

      <footer style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
        © {new Date().getFullYear()} FoodGrid POS. All rights reserved.
      </footer>
    </Container>
  );
}
