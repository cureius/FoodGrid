'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import RestaurantView from '@/components/user/menu/RestaurantView';

export default function UserHomePage() {
  const router = useRouter();
  const params = useParams();
  const outletId = params?.outletId as string;

  useEffect(() => {
    if (!outletId) {
      router.replace('/user/outlets');
    }
  }, [outletId, router]);

  if (!outletId) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
          key="landing"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
      >
          <RestaurantView outletId={outletId} onBack={() => router.push('/user/outlets')} />
      </motion.div>
    </AnimatePresence>
  );
}
