'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/components/Logo';
import { CheckCircle2, Phone, Globe, ArrowLeft, ArrowRight, Printer } from 'lucide-react';
import styles from './brochure.module.css';

export default function BrochurePage() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.pageContainer}>
      {/* Hide on print controls */}
      <div className={styles.controls}>
        <Link href="/" className={styles.backLink}>
           <ArrowLeft size={16} /> Back to Home
        </Link>
        <button onClick={handlePrint} className={styles.printBtn}>
           <Printer size={16} /> Print Brochure
        </button>
      </div>

      <div className={styles.brochureWrapper}>
        
        {/* FRONT PANEL (Right half of the first page in folded view) */}
        <section className={`${styles.panel} ${styles.frontPanel}`}>
          <div className={styles.frontContent}>
            <div className={styles.logoLarge}>
               <Logo size={64} />
            </div>
            
            <h1 className={styles.mainHeadline}>
              All-in-One Restaurant POS & QR Ordering System
            </h1>
            
            <p className={styles.subHeadline}>
              Manage orders, tables, staff and multiple outlets from one simple platform
            </p>

            <div className={styles.mockupPlaceholder}>
               <Image 
                 src="/pos-mockup.png" 
                 alt="FoodGrid POS Dashboard" 
                 fill
                 style={{ objectFit: 'contain' }} // Changed to contain and centered
                 className={styles.mockupImage} 
               />
            </div>

            <div className={styles.tagline}>
              Simple. Fast. Made for restaurants.
            </div>
            
            <div className={styles.ctaBlock}>
               <div className={styles.ctaTitle}>Start your legacy today</div>
               <Link href="/user/register" className={styles.ctaButtonMain}>
                 Start Free Trial <ArrowRight size={16} />
               </Link>
               <div className={styles.trialNote}>14 days free trial. No card required.</div>
            </div>
          </div>
        </section>

        {/* INSIDE PANEL (Left half of open brochure) */}
        <section className={`${styles.panel} ${styles.insidePanel}`}>
           
           <div className={styles.insideSection}>
             <h2 className={styles.panelTitle}>Key Benefits</h2>
             <ul className={styles.benefitList}>
               {[
                 'QR based ordering for dine-in customers',
                 'Fast and simple POS billing',
                 'Kitchen order display (KOT)',
                 'Real-time sales and item reports',
                 'Customer ordering website',
                 'Multiple outlet support'
               ].map((item, i) => (
                 <li key={i} className={styles.benefitItem}>
                   <CheckCircle2 className={styles.checkIcon} size={20} />
                   <span>{item}</span>
                 </li>
               ))}
             </ul>
           </div>

           <div className={styles.insideSection} style={{ marginTop: 'auto' }}>
              <h2 className={styles.panelTitle}>Best For</h2>
              <div className={styles.bestForGrid}>
                 <div className={styles.bestForCard}>Cafés & Restaurants</div>
                 <div className={styles.bestForCard}>Cloud Kitchens</div>
                 <div className={styles.bestForCard}>Small Restaurant Chains</div>
              </div>
           </div>

        </section>

        {/* BACK PANEL (Center/Back when folded) or Right half of open brochure */}
        <section className={`${styles.panel} ${styles.backPanel}`}>
          
          <h2 className={styles.panelTitle} style={{ textAlign: 'center' }}>Plans & Pricing</h2>
          
          <div className={styles.pricingGrid}>
            <div className={styles.priceCard}>
              <div className={styles.priceHeader}>
                <h3>Starter</h3>
                <div className={styles.priceVal}>₹999<span className={styles.period}>/mo</span></div>
              </div>
              <ul className={styles.priceFeatures}>
                <li>1 Outlet</li>
                <li>QR Ordering</li>
                <li>POS Billing</li>
                <li>Menu Management</li>
                <li>Basic Reports</li>
              </ul>
            </div>

            <div className={`${styles.priceCard} ${styles.highlight}`}>
              <div className={styles.priceHeader}>
                <h3>Growth</h3>
                <div className={styles.priceVal}>₹1,999<span className={styles.period}>/mo</span></div>
              </div>
              <ul className={styles.priceFeatures}>
                <li>1 Outlet</li>
                <li>Unlimited Staff</li>
                <li>Tables & KOT</li>
                <li>Discounts & DB</li>
                <li>Detailed Reports</li>
              </ul>
            </div>

            <div className={styles.priceCard}>
              <div className={styles.priceHeader}>
                <h3>Pro</h3>
                <div className={styles.priceVal}>₹3,999<span className={styles.period}>/mo</span></div>
              </div>
              <ul className={styles.priceFeatures}>
                <li>Up to 5 Outlets</li>
                <li>Central Dashboard</li>
                <li>Outlet-wise Reports</li>
                <li>Roles & Permissions</li>
                <li>Advanced Features</li>
              </ul>
            </div>
          </div>

          <div className={styles.extraCost}>
            Extra outlet: + ₹499 per outlet per month
          </div>

          <div className={styles.contactFooter}>
             <div className={styles.contactItem}>
               <Phone size={16} /> +91 98765 43210
             </div>
             <div className={styles.contactItem}>
               <Globe size={16} /> www.foodgrid.com
             </div>
             <Link href="/user/login" className={styles.bookDemoBtn}>
               Book a free demo
             </Link>
          </div>

        </section>

      </div>
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body {
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
