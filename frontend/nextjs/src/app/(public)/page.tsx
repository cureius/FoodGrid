'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  CheckCircle2,
  ArrowRight,
  Smartphone,
  TrendingUp,
  Network,
  Settings,
  Clock,
  Layout,
  Globe
} from 'lucide-react';
import Logo from '@/components/Logo';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import styles from './landing.module.css';
import { motion } from 'framer-motion';

import { LeadsForm } from '@/components/ui/LeadsForm';

export default function LandingPage() {
  const [showLeadsForm, setShowLeadsForm] = React.useState(false);

  return (
    <div className={styles.landingPage}>
      {/* Leads Form Modal */}
      {showLeadsForm && <LeadsForm onClose={() => setShowLeadsForm(false)} />}
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Logo size={32} />
          <div className={styles.headerActions}>
            <ThemeSwitcher />
            <Link href="/start-free-trial">
              <button className={`${styles.btnSecondary} ${styles.btnSmall}`}>
                Get Brochure
              </button>
            </Link>
            <Link href="/auth-selection">
              <button className={`${styles.btnPrimary} ${styles.btnSmall}`}>
                Login
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <motion.div
          className={styles.heroContent}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            borderRadius: 100,
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 24,
            width: 'fit-content'
          }}>
            <Zap size={16} /> New: AI-Powered Analytics
          </div>
          <h1 className={styles.heroTitle}>
            Modern <span>POS & Management</span> For Modern Restaurants
          </h1>
          <p className={styles.heroSubtitle}>
            From local cafés to national chains. Manage orders, kitchen workflows, and real-time sales with India's most powerful restaurant management cloud.
          </p>
          <div className={styles.heroCta}>
            <button className={styles.btnPrimary} onClick={() => setShowLeadsForm(true)}>
              Start Today <ArrowRight size={20} />
            </button>
            <button className={styles.btnSecondary} onClick={() => setShowLeadsForm(true)}>
              Book a Demo
            </button>
          </div>

          <div style={{ marginTop: 40, display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>10k+</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Outlets Trusted</div>
            </div>
            <div style={{ width: 1, height: 40, background: 'var(--border-light)' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>99.9%</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Uptime</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className={styles.heroImageContainer}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <div className={styles.heroImage}>
            <Image
              src="/landing_hero_pos_illustration.svg"
              alt="FoodGrid Dashboard"
              width={600}
              height={500}
              className={styles.heroImage}
              priority
            />
          </div>
          <div className={`${styles.floatingCard} ${styles.card1}`}>
            <div style={{ background: '#10b981', padding: 8, borderRadius: 10, color: 'white' }}><TrendingUp size={20} /></div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Live Sales</div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>₹42,500</div>
            </div>
          </div>
          <div className={`${styles.floatingCard} ${styles.card2}`}>
            <div style={{ background: '#3b82f6', padding: 8, borderRadius: 10, color: 'white' }}><ShoppingCart size={20} /></div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Orders</div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>124 Today</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Trust Bar */}
      {/* <section style={{ padding: '2rem 0', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-secondary)' }}>
        <div className={styles.section} style={{ padding: 0, display: 'flex', justifyContent: 'space-around', alignItems: 'center', opacity: 0.6, filter: 'grayscale(1)' }}>
           <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 2 }}>TECHBURST</div>
           <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 2 }}>FOODIFY</div>
           <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 2 }}>RESTROCLOUD</div>
           <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 2 }}>QUICKSERVE</div>
        </div>
      </section> */}

      {/* Platform Overview */}
      <section className={styles.section}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className={styles.sectionTitle}>Everything You Need to Scale</h2>
          <p className={styles.sectionSubtitle}>
            A comprehensive suite of tools designed to streamline your operations and delight your customers.
          </p>
        </motion.div>

        <div className={styles.grid3}>
          {[
            { icon: <Receipt size={24} />, title: 'Advanced POS', desc: 'Lightning fast billing with GST compliance, split bills, and multiple payment integrations.' },
            { icon: <Smartphone size={24} />, title: 'QR Ordering', desc: 'Contactless ordering solution that reduces wait times and increases order value.' },
            { icon: <Utensils size={24} />, title: 'Smart KOT', desc: 'Kitchen order management that ensures zero delays and perfect order accuracy.' },
            { icon: <BarChart3 size={24} />, title: 'Analytics', desc: 'Deep insights into your sales, inventory, and staff performance from a single dashboard.' },
            { icon: <Store size={24} />, title: 'Multi-Outlet', desc: 'Manage your entire chain centralized. Sync menus and view reports across all locations.' },
            { icon: <Users size={24} />, title: 'CRM & Loyalty', desc: 'Understand your customers better and keep them coming back with automated rewards.' }
          ].map((f, i) => (
            <motion.div
              key={i}
              className={styles.featureCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <div className={styles.featureIcon}>{f.icon}</div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDescription}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Role-Based Flows */}
      <section className={styles.section} style={{ background: 'var(--bg-secondary)', borderRadius: 40 }}>
        <h2 className={styles.sectionTitle}>Tailored for Every Role</h2>
        <p className={styles.sectionSubtitle}>
          Specific interfaces for owners, staff, and customers to ensure maximum efficiency.
        </p>
        <div className={styles.grid3}>
          <div className={styles.roleCard} style={{ border: '2px solid var(--primary)' }}>
            <div className={styles.roleHeader}>
              <div className={styles.roleIconWrapper}>
                <Building2 size={28} />
              </div>
              <h3 className={styles.roleTitle}>Chain Owner</h3>
            </div>
            <ul className={styles.roleFeatures}>
              <li>Centralized menu control</li>
              <li>Consolidated chain reports</li>
              <li>Global staff permissions</li>
              <li>Financial auditing tools</li>
            </ul>
          </div>

          <div className={styles.roleCard} style={{ border: '2px solid var(--primary)' }}>
            <div className={styles.roleHeader}>
              <div className={styles.roleIconWrapper}>
                <Users size={28} />
              </div>
              <h3 className={styles.roleTitle}>Outlet Staff</h3>
            </div>
            <ul className={styles.roleFeatures}>
              <li>One-tap bill generation</li>
              <li>Real-time table status</li>
              <li>Kitchen shift updates</li>
              <li>Daily revenue closing</li>
            </ul>
          </div>

          <div className={styles.roleCard} style={{ border: '2px solid var(--primary)' }}>
            <div className={styles.roleHeader}>
              <div className={styles.roleIconWrapper}>
                <ShoppingCart size={28} />
              </div>
              <h3 className={styles.roleTitle}>Customer</h3>
            </div>
            <ul className={styles.roleFeatures}>
              <li>Scan & View digital menu</li>
              <li>Self-checkout & tracking</li>
              <li>Personalized recommendations</li>
              <li>Instant feedback & loyalty</li>
            </ul>
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
          {[
            { num: '1', title: 'Create Business', desc: 'Register your chain and set up your brand identity.' },
            { num: '2', title: 'Add Outlets', desc: 'Add multiple locations and assign outlet managers.' },
            { num: '3', title: 'Setup Menu', desc: 'Upload your categories and items in bulk or manually.' },
            { num: '4', title: 'Go Live', desc: 'Deploy POS tablets and QR codes to start taking orders.' }
          ].map((s, i) => (
            <motion.div
              key={i}
              className={styles.step}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <div className={styles.stepNumber}>{s.num}</div>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.featureDescription}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.section} style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)', textAlign: 'center', borderRadius: 40, color: 'white', marginBottom: '3rem' }}>
        <h2 className={styles.sectionTitle} style={{ color: 'white' }}>Transform Your Restaurant Today</h2>
        <p className={styles.sectionSubtitle} style={{ color: 'rgba(255,255,255,0.8)' }}>
          Join thousands of successful restaurants who scaled their business with FoodGrid.
        </p>
        <div className={styles.heroCta}>
          <button className={styles.btnPrimary} onClick={() => setShowLeadsForm(true)} style={{ background: 'var(--text-primary)', color: 'var(--primary)', boxShadow: 'none' }}>
            Create Free Account <ArrowRight size={20} />
          </button>
          <button className={styles.btnSecondary} onClick={() => setShowLeadsForm(true)} style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}>
            Contact Sales
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerGrid}>
            <div className={styles.footerSection}>
              <Logo size={28} />
              <p style={{ marginTop: 16, color: 'var(--text-secondary)', fontSize: 14, maxWidth: 240 }}>
                The ultimate cloud-based management platform for restaurants, cafés, and cloud kitchens in India.
              </p>
            </div>
            <div className={styles.footerSection}>
              <h4>Product</h4>
              <ul>
                <li><Link href="#">Features</Link></li>
                <li><Link href="#">Pricing</Link></li>
                <li><Link href="#">Integrations</Link></li>
              </ul>
            </div>
            <div className={styles.footerSection}>
              <h4>Company</h4>
              <ul>
                <li><Link href="#">About Us</Link></li>
                <li><Link href="#">Careers</Link></li>
                <li><Link href="#">Blog</Link></li>
              </ul>
            </div>
            <div className={styles.footerSection}>
              <h4>Support</h4>
              <ul>
                <li><Link href="#">Help Center</Link></li>
                <li><Link href="#">Documentation</Link></li>
                <li><Link href="#">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>© {new Date().getFullYear()} FoodGrid POS. Built with ❤️ for Restaurateurs.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
