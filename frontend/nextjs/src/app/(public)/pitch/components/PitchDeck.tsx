"use client";

import { useCallback, useEffect, useState, useRef, ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Logo from "@/components/Logo";
import styles from "../pitch.module.css";

export interface SlideConfig {
  id: string;
  label: string;
  component: ReactNode;
}

interface PitchDeckProps {
  slides: SlideConfig[];
}

export default function PitchDeck({ slides }: PitchDeckProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Get initial slide from URL or default to first
  const getInitialSlide = () => {
    const slideParam = searchParams.get("slide");
    if (slideParam) {
      const index = slides.findIndex(s => s.id === slideParam);
      return index >= 0 ? index : 0;
    }
    return 0;
  };

  const [currentSlide, setCurrentSlide] = useState(getInitialSlide);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Update URL when slide changes
  const updateUrl = useCallback((index: number) => {
    const slide = slides[index];
    if (slide) {
      router.replace(`/pitch?slide=${slide.id}`, { scroll: false });
    }
  }, [router, slides]);

  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < slides.length && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentSlide(index);
      updateUrl(index);
      setTimeout(() => setIsTransitioning(false), 500);
    }
  }, [slides.length, isTransitioning, updateUrl]);

  const nextSlide = useCallback(() => {
    goToSlide(currentSlide + 1);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentSlide - 1);
  }, [currentSlide, goToSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        nextSlide();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        prevSlide();
      } else if (e.key === "Home") {
        e.preventDefault();
        goToSlide(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goToSlide(slides.length - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide, goToSlide, slides.length]);

  // Touch/swipe navigation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
      const minSwipeDistance = 50;

      // Only trigger if horizontal swipe is dominant
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) {
          prevSlide();
        } else {
          nextSlide();
        }
      }

      touchStartRef.current = null;
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [nextSlide, prevSlide]);

  // Mouse wheel navigation (with debounce)
  useEffect(() => {
    let lastWheelTime = 0;
    const wheelThreshold = 800; // ms between wheel navigations

    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastWheelTime < wheelThreshold) return;

      if (Math.abs(e.deltaY) > 50) {
        if (e.deltaY > 0) {
          nextSlide();
        } else {
          prevSlide();
        }
        lastWheelTime = now;
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [nextSlide, prevSlide]);

  return (
    <div className={styles.pitchContainer} ref={containerRef}>
      {/* Header */}
      <header className={styles.navHeader}>
        <div className={styles.navLogo}>
          <Logo size={28} />
        </div>
        <div className={styles.navControls}>
          <span className={styles.slideCounter}>
            {currentSlide + 1} / {slides.length}
          </span>
        </div>
      </header>

      {/* Slide Wrapper */}
      <div className={styles.slideWrapper}>
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`${styles.slide} ${
              index === currentSlide
                ? styles.active
                : index < currentSlide
                ? styles.prev
                : ""
            }`}
          >
            <div className={styles.slideContent}>
              {slide.component}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Dots */}
      <nav className={styles.navDots}>
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            className={`${styles.navDot} ${index === currentSlide ? styles.active : ""}`}
            onClick={() => goToSlide(index)}
            data-label={slide.label}
            aria-label={`Go to slide: ${slide.label}`}
          />
        ))}
      </nav>

      {/* Arrow Navigation */}
      <div className={styles.navArrows}>
        <button
          className={styles.navArrow}
          onClick={prevSlide}
          disabled={currentSlide === 0}
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          className={styles.navArrow}
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          aria-label="Next slide"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Keyboard Hint */}
      <div className={styles.keyboardHint}>
        <span className={styles.keyHint}>←</span>
        <span className={styles.keyHint}>→</span>
        <span>to navigate</span>
      </div>
    </div>
  );
}
