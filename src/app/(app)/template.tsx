"use client";

import { motion } from "framer-motion";
import { useNavDirection } from "@/components/layout/NavigationProvider";
import { usePathname, useRouter } from "next/navigation";
import { useRef, TouchEvent } from "react";

const mobileRoutes = [
  "/dashboard",
  "/transactions",
  "/chat",
  "/goals",
  "/credit",
];

export default function AppTemplate({ children }: { children: React.ReactNode }) {
  const { direction } = useNavDirection();
  const pathname = usePathname();
  const router = useRouter();

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: TouchEvent) => {
    const target = e.target as Element;
    // Ignore swipes that originate from horizontally scrollable containers
    if (target.closest('.overflow-x-auto, .mobile-snap-carousel, .no-scrollbar')) {
      return;
    }
    
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;

    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    const diffY = e.changedTouches[0].clientY - touchStartYRef.current;

    // Reset coordinates
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    const minSwipeDistance = 80;
    const maxVerticalDeviation = 50; // Don't trigger if user was scrolling vertically

    if (Math.abs(diffX) > minSwipeDistance && Math.abs(diffY) < maxVerticalDeviation) {
      const currentIndex = mobileRoutes.findIndex(r => pathname.startsWith(r));
      if (currentIndex === -1) return;

      if (diffX < 0) {
        // Swiped left (finger moves right to left) -> Go to next page
        if (currentIndex < mobileRoutes.length - 1) {
          router.push(mobileRoutes[currentIndex + 1]);
        }
      } else {
        // Swiped right (finger moves left to right) -> Go to previous page
        if (currentIndex > 0) {
          router.push(mobileRoutes[currentIndex - 1]);
        }
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 120 * direction }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1]
      }}
      className="min-h-full"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </motion.div>
  );
}
