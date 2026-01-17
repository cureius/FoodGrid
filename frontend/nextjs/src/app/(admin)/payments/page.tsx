import React from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { CreditCard, DollarSign, PieChart } from 'lucide-react';

export default function PaymentsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <Card variant="premium">
          <div style={{ display: 'flex', gap: 16 }}>
             <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(5, 205, 153, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={24} />
             </div>
             <div>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Today's Revenue</p>
                <h2 style={{ fontSize: 32 }}>$2,450.00</h2>
             </div>
          </div>
        </Card>
        <Card variant="premium">
           <div style={{ display: 'flex', gap: 16 }}>
             <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(66, 42, 251, 0.1)', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={24} />
             </div>
             <div>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Transactions</p>
                <h2 style={{ fontSize: 32 }}>145</h2>
             </div>
          </div>
        </Card>
      </div>

      <Card>
        <h3>Settlement Details</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>All payments are settled daily at 11:59 PM.</p>
      </Card>
    </div>
  );
}
