import Link from 'next/link';
import { Play, ShieldCheck, Zap, Utensils } from 'lucide-react';

export default function Page() {
  return (
    <main style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-app)', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      textAlign: 'center'
    }}>
      <div style={{ 
        width: 80, height: 80, background: 'var(--primary)', 
        borderRadius: 24, display: 'flex', alignItems: 'center', 
        justifyContent: 'center', color: 'white', marginBottom: '32px',
        boxShadow: '0 20px 40px rgba(255, 171, 46, 0.3)'
      }}>
        <Utensils size={40} />
      </div>
      
      <h1 style={{ fontSize: '48px', fontWeight: 800, marginBottom: '16px', letterSpacing: '-1px' }}>
        Food<span style={{ color: 'var(--primary)' }}>Grid</span> POS
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '18px', maxWidth: '600px', marginBottom: '48px', lineHeight: 1.6 }}>
        The most powerful, intuitive, and beautiful Point of Sale system for modern restaurants. 
        Start your shift and manage your outlet with ease.
      </p>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/employee-login" style={{ 
          background: 'var(--primary)', color: 'white', padding: '16px 32px', 
          borderRadius: '16px', fontWeight: 700, fontSize: '18px',
          boxShadow: '0 12px 24px rgba(255, 171, 46, 0.3)',
          display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          Start Your Shift <Play size={20} fill="currentColor" />
        </Link>
        <Link href="/admin-login" style={{ 
          background: 'var(--bg-card)', color: 'var(--text-main)', padding: '16px 32px', 
          borderRadius: '16px', fontWeight: 700, fontSize: '18px',
          border: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          Admin Portal <ShieldCheck size={20} />
        </Link>
      </div>

      <div style={{ marginTop: '80px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px', maxWidth: '900px' }}>
        <div>
          <Zap size={32} color="var(--primary)" style={{ marginBottom: '16px' }} />
          <h4 style={{ marginBottom: '8px' }}>Lightning Fast</h4>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Optimized for quick service and peak hours.</p>
        </div>
        <div>
          <ShieldCheck size={32} color="var(--success)" style={{ marginBottom: '16px' }} />
          <h4 style={{ marginBottom: '8px' }}>Secure & Reliable</h4>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Enterprise-grade security for your transactions.</p>
        </div>
        <div>
          <Utensils size={32} color="var(--info)" style={{ marginBottom: '16px' }} />
          <h4 style={{ marginBottom: '8px' }}>Table Management</h4>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Real-time floor plan and reservation tracking.</p>
        </div>
      </div>
    </main>
  );
}

