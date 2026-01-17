import React from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Calendar, User, Clock } from 'lucide-react';

const RESERVATIONS = [
  { id: 1, name: 'Jessica Chen', people: 4, time: '19:00', date: 'Today', status: 'Confirmed' },
  { id: 2, name: 'David Miller', people: 2, time: '20:30', date: 'Today', status: 'Pending' },
  { id: 3, name: 'Sarah Wilson', people: 6, time: '18:00', date: 'Tomorrow', status: 'Confirmed' },
];

export default function ReservationsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Upcoming Reservations</h3>
        <button style={{ 
          background: 'var(--primary)', color: 'white', padding: '12px 20px', 
          borderRadius: '12px', fontWeight: 600 
        }}>
          New Reservation
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {RESERVATIONS.map(res => (
          <Card key={res.id} variant="premium">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 40 }}>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Customer</p>
                  <p style={{ fontWeight: 700 }}>{res.name}</p>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Guests</p>
                  <p style={{ fontWeight: 700 }}>{res.people} People</p>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Date & Time</p>
                  <p style={{ fontWeight: 700 }}>{res.date} at {res.time}</p>
                </div>
              </div>
              <Badge variant={res.status === 'Confirmed' ? 'success' : 'warning'}>{res.status}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
