import React from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Package, AlertTriangle, ArrowUpRight } from 'lucide-react';

const ITEMS = [
  { name: 'Chicken Breast', stock: '25 kg', status: 'In Stock', min: '10 kg' },
  { name: 'Tomato Sauce', stock: '5 liters', status: 'Low Stock', min: '8 liters' },
  { name: 'Potatoes', stock: '0 kg', status: 'Out of Stock', min: '20 kg' },
  { name: 'Coke 330ml', stock: '120 units', status: 'In Stock', min: '50 units' },
];

export default function InventoryPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        <Card variant="premium" style={{ borderLeft: '4px solid var(--success)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Total Items</p>
          <h2 style={{ margin: '8px 0' }}>1,240</h2>
          <Badge variant="success">+12 this week</Badge>
        </Card>
        <Card variant="premium" style={{ borderLeft: '4px solid var(--warning)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Low Stock Alerts</p>
          <h2 style={{ margin: '8px 0' }}>08</h2>
          <span style={{ color: 'var(--warning)', fontSize: 12, fontWeight: 600 }}>Action required</span>
        </Card>
        <Card variant="premium" style={{ borderLeft: '4px solid var(--danger)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Out of Stock</p>
          <h2 style={{ margin: '8px 0' }}>03</h2>
          <span style={{ color: 'var(--danger)', fontSize: 12, fontWeight: 600 }}>Urgent restock</span>
        </Card>
      </div>

      <Card>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '16px 8px', color: 'var(--text-muted)', fontSize: 14 }}>Item Name</th>
              <th style={{ padding: '16px 8px', color: 'var(--text-muted)', fontSize: 14 }}>Stock Level</th>
              <th style={{ padding: '16px 8px', color: 'var(--text-muted)', fontSize: 14 }}>Status</th>
              <th style={{ padding: '16px 8px', color: 'var(--text-muted)', fontSize: 14 }}>Min. Threshold</th>
              <th style={{ padding: '16px 8px', color: 'var(--text-muted)', fontSize: 14 }}></th>
            </tr>
          </thead>
          <tbody>
            {ITEMS.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '20px 8px', fontWeight: 600 }}>{item.name}</td>
                <td style={{ padding: '20px 8px' }}>{item.stock}</td>
                <td style={{ padding: '20px 8px' }}>
                  <Badge variant={
                    item.status === 'In Stock' ? 'success' : 
                    item.status === 'Low Stock' ? 'warning' : 'danger'
                  }>
                    {item.status}
                  </Badge>
                </td>
                <td style={{ padding: '20px 8px', color: 'var(--text-muted)' }}>{item.min}</td>
                <td style={{ padding: '20px 8px', textAlign: 'right' }}>
                  <button style={{ background: 'transparent', color: 'var(--primary)' }}><ArrowUpRight size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
