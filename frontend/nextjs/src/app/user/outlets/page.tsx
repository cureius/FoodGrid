'use client';

import { useQuery } from '@tanstack/react-query';
import { listOutlets } from '@/lib/api/customer';
import { useCartStore } from '@/stores/cart';
import { Star, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

/* ------------------ Dynamic Banner Helpers ------------------ */

const GRADIENTS = [
  'linear-gradient(135deg, #f43f5e, #fb7185)',
  'linear-gradient(135deg, #f97316, #fb923c)',
  'linear-gradient(135deg, #0ea5e9, #38bdf8)',
  'linear-gradient(135deg, #10b981, #34d399)',
  'linear-gradient(135deg, #8b5cf6, #a78bfa)',
];

function getBannerStyle(name: string) {
  const index =
    name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    GRADIENTS.length;

  return GRADIENTS[index];
}

/* ------------------ Component ------------------ */

export default function OutletsPage() {
  const router = useRouter();
  const { setOutlet } = useCartStore();

  const { data: outlets, isLoading } = useQuery({
    queryKey: ['public-outlets'],
    queryFn: listOutlets,
  });

  const handleSelectOutlet = (id: string) => {
    setOutlet(id);
    router.push('/user');
  };

  if (isLoading) {
    return (
      <div className="explorer-loading">
        <h2 className="explorer-title">Finding restaurants...</h2>
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton-outlet-card" />
        ))}

        <style jsx>{`
          .explorer-loading {
            padding: 24px;
            max-width: 450px;
            margin: 0 auto;
            background: white;
            min-height: 100vh;
          }
          .explorer-title {
            font-size: 24px;
            font-weight: 800;
            margin-bottom: 24px;
          }
          .skeleton-outlet-card {
            height: 120px;
            border-radius: 20px;
            background: #f3f4f6;
            margin-bottom: 16px;
            animation: pulse 1.5s infinite;
          }
          @keyframes pulse {
            0%,100% { opacity: 1 }
            50% { opacity: 0.5 }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="explorer-page">
      {/* List */}
      <main className="explorer-main">
        <h2 className="section-title">All Restaurants</h2>

        <div className="outlets-list">
          {outlets?.map(outlet => (
            <motion.button
              key={outlet.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelectOutlet(outlet.id)}
              className="outlet-card"
            >
              <div
                className="outlet-image"
                style={{ background: getBannerStyle(outlet.name) }}
              >
                <span className="outlet-initial">
                  {outlet.name}
                </span>

                <div className="rating-badge">
                  <Star size={10} fill="currentColor" />
                  <span>4.2</span>
                </div>

                <div className="banner-shape shape-1" />
                <div className="banner-shape shape-2" />
              </div>

              <div className="outlet-info">
                <h3 className="outlet-name">{outlet.name}</h3>
                <p className="outlet-cuisines">
                  Indian • Chinese • Fast Food
                </p>
                <div className="outlet-meta">
                  <span>10–15 mins</span>
                  <span className="dot" />
                  <span>₹200 for two</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </main>

      {/* Styles */}
      <style jsx>{`
        .explorer-page {
          max-width: 450px;
          margin: 0 auto;
          background: white;
          min-height: 100vh;
          padding-bottom: 80px;
        }

        .explorer-header {
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-left {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .pin-icon {
          color: #ef4444;
        }

        .loc-label {
          font-size: 10px;
          font-weight: 800;
          color: #9ca3af;
          display: block;
        }

        .loc-val {
          font-size: 14px;
          font-weight: 800;
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #fee2e2;
          color: #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
        }

        .explorer-main {
          padding: 20px;
        }

        .section-title {
          font-size: 20px;
          font-weight: 800;
          margin-bottom: 20px;
        }

        .outlets-list {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .outlet-card {
          display: flex;
          gap: 16px;
          padding: 14px;
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 10px 24px rgba(0,0,0,0.08);
          border: none;
          text-align: left;
        }

        .outlet-image {
          position: relative;
          height: 120px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 28px;
          font-weight: 900;
        }

        .outlet-initial {
          z-index: 2;
          text-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .banner-shape {
          position: absolute;
          border-radius: 50%;
          filter: blur(14px);
          opacity: 0.35;
        }

        .shape-1 {
          width: 60px;
          height: 60px;
          top: -20px;
          right: -20px;
          background: rgba(255,255,255,0.7);
        }

        .shape-2 {
          width: 40px;
          height: 40px;
          bottom: -12px;
          left: -12px;
          background: rgba(255,255,255,0.6);
        }

        .rating-badge {
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          background: #16a34a;
          color: white;
          font-size: 11px;
          font-weight: 800;
          padding: 3px 7px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 3px 8px rgba(0,0,0,0.25);
          z-index: 3;
        }

        .outlet-info {
          flex: 1;
          min-width: 0;
          padding-top: 4px;
        }

        .outlet-name {
          font-size: 17px;
          font-weight: 800;
          margin-bottom: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .outlet-cuisines {
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 10px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .outlet-meta {
          display: flex;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          color: #9ca3af;
        }

        .dot {
          width: 4px;
          height: 4px;
          background: #d1d5db;
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
}
