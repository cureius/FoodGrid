"use client";

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { CreditCard, TrendingUp, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight, Loader2, RotateCcw } from 'lucide-react';
import { COLORS } from '@/lib/constants';
import { listClientTransactions, GatewayTransactionResponse } from '@/lib/api/payments';

const NAV_HEIGHT_DESKTOP = 72;
const NAV_HEIGHT_MOBILE = 56;

const Container = styled.main`
  background: ${COLORS.bg};
  min-height: 100dvh;
  overflow: hidden;
  padding: 0 clamp(14px, 4vw, 56px) clamp(16px, 3vw, 48px);

  @media (min-width: 1600px) {
    padding-left: 72px;
    padding-right: 72px;
  }
`;

const ContentWrapper = styled.div`
  height: calc(100dvh - ${NAV_HEIGHT_DESKTOP}px);
  display: flex;
  flex-direction: column;
  min-height: 0;

  @media (max-width: 640px) {
    height: calc(100dvh - ${NAV_HEIGHT_MOBILE}px);
    padding-top: ${NAV_HEIGHT_MOBILE}px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Title = styled.h1`
  font-size: clamp(20px, 2vw, 28px);
  font-weight: 800;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const IconBox = styled.div`
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, ${COLORS.primary} 0%, #6366f1 100%);
  color: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
`;

const FilterBar = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
`;

const Select = styled.select`
  background: var(--bg-surface);
  border: 1px solid ${COLORS.border};
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-secondary);

  &:hover {
    border-color: ${COLORS.primary};
  }

  &:focus {
    outline: none;
    border-color: ${COLORS.primary};
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
  margin-bottom: 24px;

  @media (max-width: 1280px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div<{ $gradient?: string }>`
  background: var(--bg-surface);
  padding: 20px;
  border-radius: 16px;
  border: 1px solid ${COLORS.border};
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }
`;

const StatInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const StatLabel = styled.p`
  color: ${COLORS.textMuted};
  font-size: 14px;
  margin: 0;
  font-weight: 500;
`;

const StatValue = styled.h2`
  font-size: clamp(24px, 2.2vw, 32px);
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, var(--text-secondary) 0%, var(--text-primary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const StatIconBox = styled.div<{ $bgColor: string }>`
  width: 48px;
  height: 48px;
  background: ${props => props.$bgColor};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const TableContainer = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: var(--bg-surface);
  border-radius: 16px;
  border: 1px solid ${COLORS.border};
  position: relative;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
`;

const Th = styled.th`
  text-align: left;
  padding: 16px 20px;
  background: ${COLORS.bg};
  color: ${COLORS.textMuted};
  font-weight: 600;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const Td = styled.td`
  padding: 16px 20px;
  border-top: 1px solid ${COLORS.border};
  font-size: 14px;
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  
  ${props => {
    switch (props.$status) {
      case 'CAPTURED':
      case 'COMPLETED':
        return `background: #dcfce7; color: #166534;`;
      case 'PENDING':
      case 'INITIATED':
      case 'AUTHORIZED':
        return `background: #fef3c7; color: #92400e;`;
      case 'FAILED':
      case 'VOIDED':
        return `background: #fee2e2; color: #991b1b;`;
      case 'REFUNDED':
      case 'PARTIALLY_REFUNDED':
        return `background: #e0e7ff; color: #3730a3;`;
      default:
        return `background: #f3f4f6; color: #374151;`;
    }
  }}
`;

const PaymentMethodBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  background: ${COLORS.bg};
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: ${COLORS.textMain};
  text-transform: capitalize;
`;

const CustomerName = styled.span`
  font-weight: 600;
  color: ${COLORS.textMain};
`;

const OrderId = styled.span`
  color: ${COLORS.primary};
  font-weight: 500;
`;

const Amount = styled.span`
  font-weight: 700;
  color: ${COLORS.textMain};
`;

const DateTime = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const DateText = styled.span`
  font-weight: 500;
`;

const TimeText = styled.span`
  font-size: 12px;
  color: ${COLORS.textMuted};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: ${COLORS.textMuted};
  text-align: center;
`;

const PaginationBar = styled.div`
  padding: 16px 20px;
  border-top: 1px solid ${COLORS.border};
  background: var(--bg-surface);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
`;

const PaginationInfo = styled.span`
  font-size: 14px;
  color: ${COLORS.textMuted};
`;

const PaginationButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const PageButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid ${COLORS.border};
  background: var(--bg-surface);
  color: ${COLORS.textMain};
  cursor: pointer;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:hover:not(:disabled) {
    border-color: ${COLORS.primary};
    color: ${COLORS.primary};
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(var(--bg-surface-rgb), 0.7);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
`;

const RefreshBtn = styled.button`
  border: none;
  background: var(--bg-surface);
  color: ${COLORS.textMuted};
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid ${COLORS.border};
  
  &:hover {
    color: ${COLORS.primary};
    border-color: ${COLORS.primary};
    transform: rotate(180deg);
  }
`;

export default function PaymentsPage({ loginPath = "/client-admin/login" }: { loginPath?: string }) {
  useEffect(() => {
    const isClientAdmin = loginPath.includes('client-admin');
    const tokenKey = isClientAdmin ? "fg_client_admin_access_token" : "fg_staff_access_token";
    const t = localStorage.getItem(tokenKey);
    if (!t) window.location.href = loginPath;
  }, [loginPath]);

  const [statusFilter, setStatusFilter] = useState<'All' | 'CAPTURED' | 'PENDING' | 'FAILED' | 'REFUNDED'>('All');
  const [methodFilter, setMethodFilter] = useState<'All' | 'card' | 'upi' | 'wallet' | 'netbanking'>('All');
  const [dateFilter, setDateFilter] = useState<'All' | 'Today' | 'Last 7 Days' | 'Last 30 Days'>('All');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<GatewayTransactionResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      let fromDate: string | undefined;
      let toDate: string | undefined;

      if (dateFilter !== 'All') {
        const now = new Date();
        const start = new Date();
        if (dateFilter === 'Today') {
          start.setHours(0, 0, 0, 0);
        } else if (dateFilter === 'Last 7 Days') {
          start.setDate(now.getDate() - 7);
        } else if (dateFilter === 'Last 30 Days') {
          start.setDate(now.getDate() - 30);
        }
        fromDate = start.toISOString();
        toDate = now.toISOString();
      }

      const response = await listClientTransactions({
        page,
        size,
        status: statusFilter,
        paymentMethod: methodFilter,
        fromDate,
        toDate
      });

      if (response) {
        setTransactions(response.content);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [page, size, statusFilter, methodFilter, dateFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Calculate stats from current view (or could be a separate API call)
  const stats = React.useMemo(() => {
    // Note: These stats are only for the current filtered view/page in this implementation
    // For proper global stats, we'd need a separate aggregate API endpoint
    const completed = transactions.filter(t => t.status === 'CAPTURED');
    const pending = transactions.filter(t => t.status === 'PENDING' || t.status === 'INITIATED');
    const failed = transactions.filter(t => t.status === 'FAILED');
    
    return {
      totalAmount: completed.reduce((sum, t) => sum + t.amount, 0),
      totalCount: totalElements, // Use total from API
      pendingCount: pending.length,
      failedCount: failed.length,
    };
  }, [transactions, totalElements]);

  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  function formatDateTime(isoString: string) {
    try {
      const date = new Date(isoString);
      return {
        date: new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date),
        time: new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).format(date)
      };
    } catch {
      return { date: '-', time: '-' };
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CAPTURED':
      case 'COMPLETED': return <CheckCircle size={14} />;
      case 'PENDING': 
      case 'INITIATED': return <Clock size={14} />;
      case 'FAILED': return <XCircle size={14} />;
      case 'REFUNDED': return <AlertCircle size={14} />;
      default: return null;
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

  return (
    <Container>
      <ContentWrapper>
        <Header>
          <TitleRow>
            <IconBox>
              <CreditCard size={22} />
            </IconBox>
            <Title>Payments</Title>
            <RefreshBtn onClick={fetchTransactions} title="Refresh data">
              <RotateCcw size={16} />
            </RefreshBtn>
          </TitleRow>
          <FilterBar>
            <Select 
              value={statusFilter} 
              onChange={(e) => { setStatusFilter(e.target.value as any); setPage(0); }}
              aria-label="Status filter"
            >
              <option value="All">All Statuses</option>
              <option value="CAPTURED">Captured</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </Select>
            <Select 
              value={methodFilter} 
              onChange={(e) => { setMethodFilter(e.target.value as any); setPage(0); }}
              aria-label="Payment method filter"
            >
              <option value="All">All Methods</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="wallet">Wallet</option>
              <option value="netbanking">Net Banking</option>
            </Select>
            <Select 
              value={dateFilter} 
              onChange={(e) => { setDateFilter(e.target.value as any); setPage(0); }}
              aria-label="Date filter"
            >
              <option value="All">All Time</option>
              <option value="Today">Today</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
            </Select>
          </FilterBar>
        </Header>

        <StatGrid>
          <StatCard>
            <StatInfo>
              <StatLabel>Revenue (Page)</StatLabel>
              <StatValue>{formatCurrency(stats.totalAmount, 'INR')}</StatValue>
            </StatInfo>
            <StatIconBox $bgColor="rgba(34, 197, 94, 0.1)">
              <DollarSign size={24} color="#22c55e" />
            </StatIconBox>
          </StatCard>
          <StatCard>
            <StatInfo>
              <StatLabel>Total Transactions</StatLabel>
              <StatValue>{stats.totalCount}</StatValue>
            </StatInfo>
            <StatIconBox $bgColor="rgba(99, 102, 241, 0.1)">
              <TrendingUp size={24} color="#6366f1" />
            </StatIconBox>
          </StatCard>
          <StatCard>
            <StatInfo>
              <StatLabel>Pending (Page)</StatLabel>
              <StatValue>{stats.pendingCount}</StatValue>
            </StatInfo>
            <StatIconBox $bgColor="rgba(234, 179, 8, 0.1)">
              <Clock size={24} color="#eab308" />
            </StatIconBox>
          </StatCard>
          <StatCard>
            <StatInfo>
              <StatLabel>Failed (Page)</StatLabel>
              <StatValue>{stats.failedCount}</StatValue>
            </StatInfo>
            <StatIconBox $bgColor="rgba(239, 68, 68, 0.1)">
              <XCircle size={24} color="var(--danger)" />
            </StatIconBox>
          </StatCard>
        </StatGrid>

        <TableContainer>
          {loading && (
            <LoadingOverlay>
              <Loader2 size={32} className="animate-spin text-indigo-500" />
            </LoadingOverlay>
          )}
          
          <Table>
            <thead>
              <tr>
                <Th>Payment ID</Th>
                <Th>Order ID</Th>
                <Th>Amount</Th>
                <Th>Date & Time</Th>
                <Th>Method</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((tx) => {
                  const { date, time } = formatDateTime(tx.createdAt);
                  return (
                    <tr key={tx.id}>
                      <Td><OrderId>{tx.paymentId || tx.id.substring(0, 8)}</OrderId></Td>
                      <Td><OrderId>{tx.orderId}</OrderId></Td>
                      <Td><Amount>{formatCurrency(tx.amount, tx.currency)}</Amount></Td>
                      <Td>
                        <DateTime>
                          <DateText>{date}</DateText>
                          <TimeText>{time}</TimeText>
                        </DateTime>
                      </Td>
                      <Td>
                        <PaymentMethodBadge>
                          {tx.paymentMethod || tx.gatewayType}
                        </PaymentMethodBadge>
                      </Td>
                      <Td>
                        <StatusBadge $status={tx.status}>
                          {getStatusIcon(tx.status)}
                          {tx.status}
                        </StatusBadge>
                      </Td>
                    </tr>
                  );
                })
              ) : (
                !loading && (
                  <tr>
                    <Td colSpan={6}>
                      <EmptyState>
                        <CreditCard size={48} strokeWidth={1.5} />
                        <p style={{ marginTop: 16, fontWeight: 600 }}>No payments found</p>
                        <p style={{ fontSize: 14 }}>Try adjusting your filters</p>
                      </EmptyState>
                    </Td>
                  </tr>
                )
              )}
            </tbody>
          </Table>
        </TableContainer>
        
        <PaginationBar>
          <PaginationInfo>
            Page {page + 1} of {Math.max(1, totalPages)} • Total {totalElements} items
          </PaginationInfo>
          <PaginationButtons>
            <PageButton 
              onClick={() => handlePageChange(page - 1)} 
              disabled={page === 0 || loading}
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </PageButton>
            <PageButton 
              onClick={() => handlePageChange(page + 1)} 
              disabled={page >= totalPages - 1 || loading}
              title="Next Page"
            >
              <ChevronRight size={16} />
            </PageButton>
          </PaginationButtons>
        </PaginationBar>
      </ContentWrapper>
    </Container>
  );
}
