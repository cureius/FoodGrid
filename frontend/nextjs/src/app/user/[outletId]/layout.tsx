'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/stores/cart';
import { useParams } from 'next/navigation';

export default function OutletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const outletId = params?.outletId as string;
  const setOutlet = useCartStore((state) => state.setOutlet);

  useEffect(() => {
    if (outletId) {
      setOutlet(outletId);
    }
  }, [outletId, setOutlet]);

  return <>{children}</>;
}
