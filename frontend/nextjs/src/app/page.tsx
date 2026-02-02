'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Store, 
  Users, 
  ShoppingCart,
  Receipt,
  Utensils,
  BarChart3,
  Shield,
  Zap,
  Globe,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  TrendingUp,
  Network,
  Settings
} from 'lucide-react';
import Logo from '@/components/Logo';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import styles from './landing.module.css';

export default function LandingPage() {
  return (
    <div className={styles.landingPage}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Logo size={32} />
          <div className={styles.headerActions}>
            {/* <ThemeSwitcher /> */}
            <Link href="/user/login">
              <button className={`${styles.btnSecondary} ${styles.btnSmall}`}>
                Login
              </button>
            </Link>
            <Link href="/user/register">
              <button className={`${styles.btnPrimary} ${styles.btnSmall}`}>
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Complete Restaurant & Café Management Platform
        </h1>
        <p className={styles.heroSubtitle}>
          Multi-tenant POS, KOT, online ordering and chain management system. Built for single outlets to multi-location restaurant chains.
        </p>
        <div className={styles.heroCta}>
          <Link href="/user/register">
            <button className={styles.btnPrimary}>
              Start Free Trial <ArrowRight size={20} />
            </button>
          </Link>
          <Link href="/user/login">
            <button className={styles.btnSecondary}>
              Book a Demo
            </button>
          </Link>
        </div>
      </section>

      {/* Platform Overview */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Platform Overview</h2>
        <p className={styles.sectionSubtitle}>
          Everything you need to run and scale your restaurant business
        </p>
        <div className={styles.grid2}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Building2 size={24} />
            </div>
            <h3 className={styles.featureTitle}>Multi-Tenant Architecture</h3>
            <p className={styles.featureDescription}>
              Isolated tenant environments with centralized management. Perfect for SaaS deployment and white-label solutions.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Receipt size={24} />
            </div>
            <h3 className={styles.featureTitle}>POS & KOT System</h3>
            <p className={styles.featureDescription}>
              Fast billing, kitchen order tickets, table management and real-time order tracking for dine-in and takeaway.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Smartphone size={24} />
            </div>
            <h3 className={styles.featureTitle}>Online Ordering</h3>
            <p className={styles.featureDescription}>
              QR-based customer ordering, digital menu and contactless payments. No app installation required.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Network size={24} />
            </div>
            <h3 className={styles.featureTitle}>Chain & Outlet Management</h3>
            <p className={styles.featureDescription}>
              Manage multiple outlets, centralized menu control, outlet-level reporting and chain-wide analytics.
            </p>
          </div>
        </div>
      </section>

      {/* Role-Based Flows */}
      <section className={styles.section} style={{ background: 'var(--bg-secondary)' }}>
        <h2 className={styles.sectionTitle}>Built for Every Role</h2>
        <p className={styles.sectionSubtitle}>
          Tailored workflows for different user types
        </p>
        <div className={styles.grid2}>
          <div className={styles.roleCard}>
            <div className={styles.roleHeader}>
              <div className={styles.roleIconWrapper}>
                <Shield size={28} />
              </div>
              <h3 className={styles.roleTitle}>Tenant Admin</h3>
            </div>
            <ul className={styles.roleFeatures}>
              <li>Platform configuration and tenant onboarding</li>
              <li>Global settings and system monitoring</li>
              <li>Payment gateway configuration</li>
              <li>Multi-tenant analytics dashboard</li>
            </ul>
          </div>

          <div className={styles.roleCard}>
            <div className={styles.roleHeader}>
              <div className={styles.roleIconWrapper}>
                <Building2 size={28} />
              </div>
              <h3 className={styles.roleTitle}>Client Admin (Chain Owner)</h3>
            </div>
            <ul className={styles.roleFeatures}>
              <li>Manage multiple outlets and locations</li>
              <li>Centralized menu and pricing control</li>
              <li>Chain-wide reporting and analytics</li>
              <li>Staff management across outlets</li>
            </ul>
          </div>

          <div className={styles.roleCard}>
            <div className={styles.roleHeader}>
              <div className={styles.roleIconWrapper}>
                <Users size={28} />
              </div>
              <h3 className={styles.roleTitle}>Staff</h3>
            </div>
            <ul className={styles.roleFeatures}>
              <li>Quick POS billing and order entry</li>
              <li>KOT generation and kitchen updates</li>
              <li>Table and order management</li>
              <li>Daily sales and shift reports</li>
            </ul>
          </div>

          <div className={styles.roleCard}>
            <div className={styles.roleHeader}>
              <div className={styles.roleIconWrapper}>
                <ShoppingCart size={28} />
              </div>
              <h3 className={styles.roleTitle}>Customer</h3>
            </div>
            <ul className={styles.roleFeatures}>
              <li>QR code based self-ordering</li>
              <li>Browse menu and place orders</li>
              <li>Real-time order status tracking</li>
              <li>Digital payment integration</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Core Features</h2>
        <p className={styles.sectionSubtitle}>
          Comprehensive tools for restaurant operations
        </p>
        <div className={styles.grid3}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Receipt size={24} />
            </div>
            <h3 className={styles.featureTitle}>POS & Billing</h3>
            <p className={styles.featureDescription}>
              Fast checkout, split bills, discounts, GST invoicing and multiple payment modes.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Utensils size={24} />
            </div>
            <h3 className={styles.featureTitle}>KOT & Kitchen Workflow</h3>
            <p className={styles.featureDescription}>
              Kitchen order tickets, order status updates and real-time kitchen display system.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Settings size={24} />
            </div>
            <h3 className={styles.featureTitle}>Menu & Category Management</h3>
            <p className={styles.featureDescription}>
              Create categories, items, variants, add-ons and manage pricing across outlets.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <BarChart3 size={24} />
            </div>
            <h3 className={styles.featureTitle}>Outlet & Chain Reporting</h3>
            <p className={styles.featureDescription}>
              Sales reports, item-wise analysis, outlet comparison and chain-level insights.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Users size={24} />
            </div>
            <h3 className={styles.featureTitle}>Staff & Role Management</h3>
            <p className={styles.featureDescription}>
              Role-based access, staff performance tracking and shift management.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Smartphone size={24} />
            </div>
            <h3 className={styles.featureTitle}>Customer QR Ordering</h3>
            <p className={styles.featureDescription}>
              Contactless ordering via QR code, digital menu and order tracking for customers.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Network size={24} />
            </div>
            <h3 className={styles.featureTitle}>Multi-Location Support</h3>
            <p className={styles.featureDescription}>
              Manage multiple outlets, sync menus and centralized chain management.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Store size={24} />
            </div>
            <h3 className={styles.featureTitle}>Table Management</h3>
            <p className={styles.featureDescription}>
              Table layout, reservations, order assignment and real-time table status.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <CheckCircle2 size={24} />
            </div>
            <h3 className={styles.featureTitle}>Order Management</h3>
            <p className={styles.featureDescription}>
              Track orders from placement to completion with status updates and notifications.
            </p>
          </div>
        </div>
      </section>

      {/* Why FoodGrid */}
      <section className={styles.section} style={{ background: 'var(--bg-secondary)' }}>
        <h2 className={styles.sectionTitle}>Why FoodGrid?</h2>
        <p className={styles.sectionSubtitle}>
          Built for scale, control and operational excellence
        </p>
        <div className={styles.whyGrid}>
          <div className={styles.whyCard}>
            <div className={styles.whyIcon}>
              <Network size={32} />
            </div>
            <h3 className={styles.whyTitle}>Multi-Outlet Ready</h3>
            <p className={styles.whyDescription}>
              Designed from the ground up for restaurant chains. Manage unlimited outlets from a single dashboard.
            </p>
          </div>

          <div className={styles.whyCard}>
            <div className={styles.whyIcon}>
              <Shield size={32} />
            </div>
            <h3 className={styles.whyTitle}>Central Control</h3>
            <p className={styles.whyDescription}>
              Chain owners get complete control over menus, pricing, staff and operations across all locations.
            </p>
          </div>

          <div className={styles.whyCard}>
            <div className={styles.whyIcon}>
              <Zap size={32} />
            </div>
            <h3 className={styles.whyTitle}>Real-Time Operations</h3>
            <p className={styles.whyDescription}>
              Live order tracking, instant KOT updates and real-time reporting for faster decision making.
            </p>
          </div>

          <div className={styles.whyCard}>
            <div className={styles.whyIcon}>
              <TrendingUp size={32} />
            </div>
            <h3 className={styles.whyTitle}>Built to Scale</h3>
            <p className={styles.whyDescription}>
              Multi-tenant architecture that grows with your business. From single outlet to nationwide chains.
            </p>
          </div>
        </div>
      </section>

      {/* Onboarding Flow */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Get Started in Minutes</h2>
        <p className={styles.sectionSubtitle}>
          Simple onboarding process to get your restaurant online
        </p>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <h3 className={styles.stepTitle}>Create Tenant</h3>
            <p className={styles.stepDescription}>
              Sign up and create your tenant account with business details.
            </p>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <h3 className={styles.stepTitle}>Add Outlets</h3>
            <p className={styles.stepDescription}>
              Add your restaurant outlets with location and contact information.
            </p>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <h3 className={styles.stepTitle}>Configure Menu</h3>
            <p className={styles.stepDescription}>
              Set up categories, items, pricing and availability for each outlet.
            </p>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>4</div>
            <h3 className={styles.stepTitle}>Start Taking Orders</h3>
            <p className={styles.stepDescription}>
              Begin accepting orders via POS, online ordering or QR code.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.section} style={{ background: 'var(--bg-secondary)', textAlign: 'center' }}>
        <h2 className={styles.sectionTitle}>Ready to Transform Your Restaurant Operations?</h2>
        <p className={styles.sectionSubtitle}>
          Join restaurants and cafés across India using FoodGrid
        </p>
        <div className={styles.heroCta}>
          <Link href="/user/register">
            <button className={styles.btnPrimary}>
              Start Free Trial <ArrowRight size={20} />
            </button>
          </Link>
          <Link href="/user/login">
            <button className={styles.btnSecondary}>
              Contact Sales
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerGrid}>
            <div className={styles.footerSection}>
              <h4>Product</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#integrations">Integrations</a></li>
                <li><a href="#updates">Updates</a></li>
              </ul>
            </div>

            <div className={styles.footerSection}>
              <h4>Company</h4>
              <ul>
                <li><a href="#about">About Us</a></li>
                <li><a href="#careers">Careers</a></li>
                <li><a href="#blog">Blog</a></li>
                <li><a href="#press">Press</a></li>
              </ul>
            </div>

            <div className={styles.footerSection}>
              <h4>Support</h4>
              <ul>
                <li><a href="#help">Help Center</a></li>
                <li><a href="#docs">Documentation</a></li>
                <li><a href="#contact">Contact Us</a></li>
                <li><a href="#status">System Status</a></li>
              </ul>
            </div>

            <div className={styles.footerSection}>
              <h4>Legal</h4>
              <ul>
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#terms">Terms of Service</a></li>
                <li><a href="#security">Security</a></li>
              </ul>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <p>© {new Date().getFullYear()} FoodGrid. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
