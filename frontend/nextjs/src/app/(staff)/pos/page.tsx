'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { 
  Users, 
  Clock, 
  Receipt, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  LayoutGrid,
  Search,
  Store,
  Filter,
  RefreshCw,
  MoreVertical,
  LogOut,
  Settings
} from 'lucide-react';
import { useOutlet } from '@/contexts/OutletContext';
import { 
  listTables, 
  listOrders, 
  createOrder, 
  type OrderResponse,
} from '@/lib/api/clientAdmin';

const PageContainer = styled.div`
  background: #f1f3f6;
  min-height: calc(100dvh - 64px);
  display: flex;
  flex-direction: column;

  @media (max-width: 1024px) {
    min-height: calc(100dvh - 60px);
  }
`;

const StatsHeader = styled.div`
  background: #2c3e50;
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  flex-wrap: wrap;
  gap: 16px;

  @media (max-width: 1024px) {
    padding: 12px 16px;
  }
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: clamp(8px, 1.5vw, 16px);
  padding: 4px 16px;
  border-right: 1px solid rgba(255,255,255,0.1);
  
  &:last-child {
    border-right: none;
  }

  @media (max-width: 1024px) {
    border-right: none;
    padding: 4px 8px;
  }
`;

const StatCircle = styled.div<{ bg: string }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${p => p.bg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
  color: white;
`;

const StatLabel = styled.div`
  display: flex;
  flex-direction: column;
  
  span:first-child {
    font-size: 10px;
    text-transform: uppercase;
    font-weight: 600;
    opacity: 0.7;
    letter-spacing: 0.5px;
  }
  
  span:last-child {
    font-size: 14px;
    font-weight: 700;
  }
`;

/* Navigation/Floor Selector Bar */
const ActionToolbar = styled.div`
  background: white;
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e0e6ed;

  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    align-items: stretch;
  }
`;

const FloorTabs = styled.div`
  display: flex;
  gap: 4px;
  background: #f1f3f6;
  padding: 4px;
  border-radius: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const FloorTab = styled.button<{ active: boolean }>`
  padding: 8px 20px;
  border-radius: 6px;
  border: none;
  background: ${p => p.active ? 'white' : 'transparent'};
  color: ${p => p.active ? '#333' : '#666'};
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  box-shadow: ${p => p.active ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'};
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    color: #333;
  }
`;

const ToolbarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchBox = styled.div`
  position: relative;
  
  input {
    background: #f1f3f6;
    border: 1px solid #e0e6ed;
    padding: 8px 12px 8px 36px;
    border-radius: 8px;
    font-size: 13px;
    width: 240px;
    outline: none;
    
    @media (max-width: 1024px) {
      width: 100%;
    }

    &:focus {
      border-color: #3498db;
      background: white;
    }
  }
  
  svg {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #999;
  }
`;

const IconButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid #e0e6ed;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
  
  &:hover {
    background: #f9fafb;
    color: #333;
  }
`;

/* Table Grid Area */
const MainContent = styled.div`
  padding: 24px;
  flex: 1;
  overflow-y: auto;

  @media (max-width: 640px) {
    padding: 16px;
  }
`;

const TableGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;

  @media (max-width: 480px) {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  }
`;

const STATUS_THEMES = {
  AVAILABLE: {
    header: '#27ae60', // Vibrant Green
    body: '#ffffff',
    text: '#27ae60',
    hover: '#f1fcf4'
  },
  IN_PROGRESS: {
    header: '#e67e22', // Vibrant Orange/Brown for occupied
    body: '#fff7ed',
    text: '#c2410c',
    hover: '#ffedd5'
  },
  BILLED: {
    header: '#3498db', // Vibrant Blue for Billing
    body: '#eff6ff',
    text: '#1d4ed8',
    hover: '#dbeafe'
  },
  DISABLED: {
    header: '#95a5a6',
    body: '#f4f4f4',
    text: '#7f8c8d',
    hover: '#f4f4f4'
  }
};

const TableCard = styled.div<{ status: string; clickable: boolean }>`
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 140px;
  cursor: ${p => p.clickable ? 'pointer' : 'not-allowed'};
  border: 1px solid #e0e6ed;
  transition: transform 0.15s ease;

  &:hover {
    ${p => p.clickable && `
      transform: scale(1.03);
      border-color: ${STATUS_THEMES[p.status as keyof typeof STATUS_THEMES].header};
    `}
  }
`;

const CardHeader = styled.div<{ status: string }>`
  background: ${p => STATUS_THEMES[p.status as keyof typeof STATUS_THEMES].header};
  padding: 6px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  font-weight: 800;
`;

const CardBody = styled.div<{ status: string }>`
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: ${p => STATUS_THEMES[p.status as keyof typeof STATUS_THEMES].body};
  text-align: center;
`;

const TableTitle = styled.div`
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
`;

const Amount = styled.div`
  font-size: 20px;
  font-weight: 900;
  color: #2c3e50;
  margin: 4px 0;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  color: #7f8c8d;
`;

const BottomLegend = styled.div`
  background: white;
  border-top: 1px solid #e0e6ed;
  padding: 8px 24px;
  display: flex;
  gap: 24px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  color: #7f8c8d;
  text-transform: uppercase;
`;

const LegendColor = styled.div<{ bg: string }>`
  width: 14px;
  height: 14px;
  border-radius: 3px;
  background: ${p => p.bg};
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255,255,255,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
`;

function getTimeDifference(dateString: string) {
  const start = new Date(dateString).getTime();
  const now = new Date().getTime();
  const diff = Math.floor((now - start) / 60000); // minutes
  return diff < 60 ? `${diff}m` : `${Math.floor(diff / 60)}h ${diff % 60}m`;
}

export default function POSPage() {
  const router = useRouter();
  const { selectedOutletId } = useOutlet();
  
  const [tables, setTables] = useState<any[]>([]);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState('1st Floor');
  const [creatingOrderId, setCreatingOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const floors = ['1st Floor', '2nd Floor', '3rd Floor'];

  const stats = useMemo(() => {
    const activeOrdersMap = new Map<string, OrderResponse>();
    orders.forEach(order => {
      if (order.tableId && ['OPEN', 'KOT_SENT', 'SERVED', 'BILLED'].includes(order.status)) {
        activeOrdersMap.set(order.tableId, order);
      }
    });

    const data = tables.map(table => {
      const activeOrder = activeOrdersMap.get(table.id);
      let status = 'AVAILABLE';
      if (activeOrder) status = activeOrder.status === 'BILLED' ? 'BILLED' : 'IN_PROGRESS';
      else if (table.status === 'INACTIVE') status = 'DISABLED';
      return { ...table, status };
    });

    return {
      total: tables.length,
      vacant: data.filter(t => t.status === 'AVAILABLE').length,
      occupied: data.filter(t => t.status === 'IN_PROGRESS').length,
      billed: data.filter(t => t.status === 'BILLED').length,
    };
  }, [tables, orders]);

  useEffect(() => {
    if (!selectedOutletId) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        if (!selectedOutletId) return;
        const [tablesData, ordersData] = await Promise.all([
          listTables(selectedOutletId),
          listOrders(100, selectedOutletId)
        ]);
        setTables(tablesData || []);
        setOrders(ordersData || []);
      } catch (err) {
        console.error("Failed to fetch POS data:", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [selectedOutletId]);

  const tableData = useMemo(() => {
    if (!selectedOutletId) return [];
    const activeOrdersMap = new Map<string, OrderResponse>();
    orders.forEach(order => {
      if (order.tableId && ['OPEN', 'KOT_SENT', 'SERVED', 'BILLED'].includes(order.status)) {
        activeOrdersMap.set(order.tableId, order);
      }
    });

    return tables.map(table => {
      const activeOrder = activeOrdersMap.get(table.id);
      let status = 'AVAILABLE';
      let statusText = 'Vacant';
      
      if (activeOrder) {
        if (activeOrder.status === 'BILLED') {
          status = 'BILLED';
          statusText = 'Billed';
        } else {
          status = 'IN_PROGRESS';
          statusText = 'Running';
        }
      } else if (table.status === 'INACTIVE') {
        status = 'DISABLED';
        statusText = 'N/A';
      }

      const index = tables.indexOf(table);
      let floor = '1st Floor';
      if (table.tableCode.startsWith('T2') || (index >= 8 && index < 16)) floor = '2nd Floor';
      else if (table.tableCode.startsWith('T3') || index >= 16) floor = '3rd Floor';

      return {
        ...table,
        status,
        statusText,
        activeOrder,
        floor
      };
    });
  }, [tables, orders, selectedOutletId]);

  const filteredTables = useMemo(() => {
    return tableData
      .filter(t => t.floor === selectedFloor)
      .filter(t => t.tableCode.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [tableData, selectedFloor, searchQuery]);

  const handleTableClick = async (table: any) => {
    if (table.status === 'DISABLED') return;
    if (creatingOrderId) return;

    if (table.activeOrder) {
      router.push(`/orders/new?orderId=${table.activeOrder.id}&step=2`);
    } else {
      try {
        setCreatingOrderId(table.id);
        const newOrder = await createOrder({
          orderType: 'DINE_IN',
          tableId: table.id,
        }, selectedOutletId!);
        router.push(`/orders/new?orderId=${newOrder.id}&step=2`);
      } catch (err) {
        console.error("Failed to create order:", err);
        setCreatingOrderId(null);
      }
    }
  };

  if (!selectedOutletId) {
    return (
      <PageContainer>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', textAlign: 'center', gap: 20 }}>
          <Store size={80} style={{ color: '#ccc' }} />
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 900 }}>Select Outlet To Start</h2>
            <p style={{ color: '#7f8c8d' }}>Choose an outlet from the top header to see your floor map.</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <PageContainer>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Loader2 size={48} style={{ animation: 'spin 1s linear infinite', color: '#2c3e50' }} />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <StatsHeader className="stats-header">
        <div className="stats-wrap" style={{ display: 'flex', gap: 0 }}>
          <StatItem>
            <StatCircle bg="#2c3e50" style={{ border: '2px solid rgba(255,255,255,0.2)' }}>{stats.total}</StatCircle>
            <StatLabel>
              <span>Total</span>
              <span>Tables</span>
            </StatLabel>
          </StatItem>
          <StatItem>
            <StatCircle bg="#27ae60">{stats.vacant}</StatCircle>
            <StatLabel>
              <span>Vacant</span>
              <span>Tables</span>
            </StatLabel>
          </StatItem>
          <StatItem>
            <StatCircle bg="#e67e22">{stats.occupied}</StatCircle>
            <StatLabel>
              <span>Occupied</span>
              <span>Tables</span>
            </StatLabel>
          </StatItem>
          <StatItem>
            <StatCircle bg="#3498db">{stats.billed}</StatCircle>
            <StatLabel>
              <span>Billed</span>
              <span>Tables</span>
            </StatLabel>
          </StatItem>
        </div>
        
        <div className="icon-buttons" style={{ display: 'flex', gap: 12 }}>
          <IconButton title="Refresh Data" onClick={() => window.location.reload()}>
            <RefreshCw size={18} />
          </IconButton>
          <IconButton title="Settings">
            <Settings size={18} />
          </IconButton>
        </div>
      </StatsHeader>

      <ActionToolbar>
        <FloorTabs>
          {floors.map(floor => (
            <FloorTab 
              key={floor} 
              active={selectedFloor === floor}
              onClick={() => setSelectedFloor(floor)}
            >
              {floor.toUpperCase()}
            </FloorTab>
          ))}
        </FloorTabs>

        <ToolbarRight className="toolbar-right">
          <SearchBox className="search-box">
            <Search size={16} />
            <input 
              placeholder="Search table number..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchBox>
          <IconButton>
            <Filter size={18} />
          </IconButton>
          <IconButton>
            <MoreVertical size={18} />
          </IconButton>
        </ToolbarRight>
      </ActionToolbar>

      <MainContent>
        <TableGrid className="table-grid">
          {filteredTables.map(table => {
            const theme = STATUS_THEMES[table.status as keyof typeof STATUS_THEMES];
            return (
              <TableCard 
                key={table.id} 
                status={table.status} 
                clickable={table.status !== 'DISABLED'}
                onClick={() => handleTableClick(table)}
              >
                {creatingOrderId === table.id && (
                  <LoadingOverlay>
                    <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#2c3e50' }} />
                  </LoadingOverlay>
                )}
                <CardHeader status={table.status}>
                  <span>{table.tableCode}</span>
                  <Users size={12} strokeWidth={3} />
                </CardHeader>
                <CardBody status={table.status}>
                  {!table.activeOrder ? (
                    <TableTitle style={{ color: theme.text }}>{table.statusText}</TableTitle>
                  ) : (
                    <>
                      <Amount>₹{table.activeOrder.grandTotal}</Amount>
                      <InfoRow>
                        <Clock size={12} /> {getTimeDifference(table.activeOrder.createdAt)}
                      </InfoRow>
                    </>
                  )}
                  <InfoRow style={{ marginTop: 8 }}>
                    <Users size={10} /> PAX: {table.capacity}
                  </InfoRow>
                </CardBody>
              </TableCard>
            );
          })}
        </TableGrid>

        {filteredTables.length === 0 && (
          <div style={{ textAlign: 'center', padding: '100px 0', color: '#bdc3c7' }}>
            <LayoutGrid size={80} style={{ opacity: 0.1, marginBottom: 16 }} />
            <div style={{ fontSize: 18, fontWeight: 700 }}>No Tables Available</div>
            <div style={{ fontSize: 13 }}>Try searching for a different number or changing floor.</div>
          </div>
        )}
      </MainContent>

      <BottomLegend className="bottom-legend">
        <LegendItem><LegendColor bg="#27ae60" /> Available</LegendItem>
        <LegendItem><LegendColor bg="#e67e22" /> Occupied</LegendItem>
        <LegendItem><LegendColor bg="#3498db" /> Billed</LegendItem>
        <LegendItem><LegendColor bg="#95a5a6" /> N/A</LegendItem>
      </BottomLegend>
      
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .stats-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 16px !important;
          }
          .stats-wrap {
            justify-content: space-between !important;
          }
          .icon-buttons {
            justify-content: flex-end !important;
          }
        }
        @media (max-width: 640px) {
          .toolbar-right {
             flex-direction: column !important;
             align-items: stretch !important;
          }
          .search-box {
            max-width: none !important;
            width: 100% !important;
          }
          .table-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
          .bottom-legend {
             flex-wrap: wrap !important;
             justify-content: center !important;
             gap: 12px !important;
          }
        }
        @media (max-width: 380px) {
          .table-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </PageContainer>
  );
}
