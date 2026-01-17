import React from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { History, Download } from 'lucide-react';

export default function HistoryPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h3>Order History</h3>
      {[1,2,3,4,5].map(i => (
        <Card key={i} variant="outline">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 700 }}>Order #ORD-0{900 + i}</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Yesterday at 14:30 • Table T-0{i}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: 700 }}>$56.00</p>
              <Badge variant="neutral">Paid via Card</Badge>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
