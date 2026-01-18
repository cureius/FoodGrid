import React from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Map, Plus } from 'lucide-react';

export default function TablesPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Floor Plan</h3>
        <button style={{ 
          display: 'flex', alignItems: 'center', gap: 8, background: 'var(--primary)', 
          color: 'white', padding: '12px 20px', borderRadius: '12px', fontWeight: 600 
        }}>
          <Plus size={20} /> Add Table
        </button>
      </div>

      <Card>
        <div style={{ 
          height: 600, background: 'var(--bg-app)', borderRadius: 20, 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px dashed var(--border-color)', color: 'var(--text-muted)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <Map size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
            <p>Interactive Floor Plan coming soon</p>
          </div>
        </div>
      </Card>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
        {[1,2,3,4,5,6].map(i => (
          <Card key={i} variant="outline" style={{ textAlign: 'center' }}>
            <h4>Table {i}</h4>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '8px 0 16px' }}>4 Seats • Window Side</p>
            <Badge variant={i % 3 === 0 ? 'success' : 'danger'}>
              {i % 3 === 0 ? 'Available' : 'Occupied'}
            </Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
