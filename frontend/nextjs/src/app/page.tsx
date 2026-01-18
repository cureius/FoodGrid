"use client";

import Link from 'next/link';
import { Play, ShieldCheck, Zap, Utensils, Building2, Users } from 'lucide-react';

export default function Page() {
  return (
    <main style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #F4F7FE 0%, #E8F0FF 100%)',
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background elements */}
      <div style={{
        position: 'absolute',
        top: '-100px',
        right: '-100px',
        width: '400px',
        height: '400px',
        background: 'linear-gradient(135deg, rgba(75, 112, 245, 0.1) 0%, rgba(75, 112, 245, 0.05) 100%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-150px',
        left: '-150px',
        width: '500px',
        height: '500px',
        background: 'linear-gradient(135deg, rgba(75, 112, 245, 0.08) 0%, rgba(75, 112, 245, 0.03) 100%)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', width: '100%' }}>
        {/* Logo */}
        <div style={{ 
          width: 96, 
          height: 96, 
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)', 
          borderRadius: 28, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          color: 'white', 
          margin: '0 auto 40px',
          boxShadow: '0 20px 40px rgba(75, 112, 245, 0.3)',
          transition: 'transform 0.3s ease',
        }}>
          <Utensils size={48} />
        </div>
        
        {/* Heading */}
        <h1 style={{ 
          fontSize: 'clamp(36px, 5vw, 64px)', 
          fontWeight: 800, 
          marginBottom: '24px', 
          letterSpacing: '-2px',
          background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Food<span style={{ color: 'var(--primary)' }}>Grid</span> POS
        </h1>
        
        <p style={{ 
          color: 'var(--text-muted)', 
          fontSize: 'clamp(16px, 2vw, 20px)', 
          maxWidth: '700px', 
          margin: '0 auto 56px', 
          lineHeight: 1.7 
        }}>
          The most powerful, intuitive, and beautiful Point of Sale system for modern restaurants. 
          Start your shift and manage your outlet with ease.
        </p>

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          flexWrap: 'wrap', 
          justifyContent: 'center',
          marginBottom: '120px'
        }}>
          <Link 
            href="/employee-login" 
            style={{ 
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
              color: 'white', 
              padding: '18px 40px', 
              borderRadius: '16px', 
              fontWeight: 700, 
              fontSize: '18px',
              boxShadow: '0 12px 24px rgba(75, 112, 245, 0.3)',
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              transform: 'translateY(0)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 16px 32px rgba(75, 112, 245, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(75, 112, 245, 0.3)';
            }}
          >
            Start Your Shift <Play size={20} fill="currentColor" />
          </Link>
          
          <Link 
            href="/admin-login" 
            style={{ 
              background: 'var(--bg-card)', 
              color: 'var(--text-primary)', 
              padding: '18px 40px', 
              borderRadius: '16px', 
              fontWeight: 700, 
              fontSize: '18px',
              border: '2px solid var(--border-light)',
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-light)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
            }}
          >
            Admin Portal <ShieldCheck size={20} />
          </Link>
        </div>

        {/* Features Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '32px', 
          maxWidth: '1000px',
          margin: '0 auto'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            padding: '32px',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
            transition: 'all 0.3s ease',
            border: '1px solid var(--border-light)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.06)';
          }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, rgba(75, 112, 245, 0.1) 0%, rgba(75, 112, 245, 0.05) 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <Zap size={28} color="var(--primary)" />
            </div>
            <h4 style={{ marginBottom: '12px', fontSize: '20px', fontWeight: 700 }}>Lightning Fast</h4>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Optimized for quick service and peak hours.
            </p>
          </div>
          
          <div style={{
            background: 'var(--bg-card)',
            padding: '32px',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
            transition: 'all 0.3s ease',
            border: '1px solid var(--border-light)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.06)';
          }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <ShieldCheck size={28} color="var(--status-green)" />
            </div>
            <h4 style={{ marginBottom: '12px', fontSize: '20px', fontWeight: 700 }}>Secure & Reliable</h4>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Enterprise-grade security for your transactions.
            </p>
          </div>
          
          <div style={{
            background: 'var(--bg-card)',
            padding: '32px',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
            transition: 'all 0.3s ease',
            border: '1px solid var(--border-light)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.06)';
          }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, rgba(246, 155, 66, 0.1) 0%, rgba(246, 155, 66, 0.05) 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <Utensils size={28} color="var(--accent-orange)" />
            </div>
            <h4 style={{ marginBottom: '12px', fontSize: '20px', fontWeight: 700 }}>Table Management</h4>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Real-time floor plan and table tracking.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

