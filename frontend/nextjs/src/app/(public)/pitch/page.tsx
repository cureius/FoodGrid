"use client";

import { Suspense } from "react";
import PitchDeck, { SlideConfig } from "./components/PitchDeck";
import OpeningSlide from "./slides/OpeningSlide";
import ProblemSlide from "./slides/ProblemSlide";
import SolutionSlide from "./slides/SolutionSlide";
import ProductModulesSlide from "./slides/ProductModulesSlide";
import ArchitectureSlide from "./slides/ArchitectureSlide";
import LiveFlowSlide from "./slides/LiveFlowSlide";
import AggregatorSlide from "./slides/AggregatorSlide";
import BusinessValueSlide from "./slides/BusinessValueSlide";
import UseCaseSlide from "./slides/UseCaseSlide";
import CTASlide from "./slides/CTASlide";

/**
 * Slide Registry
 *
 * Central configuration for all pitch deck slides.
 * - id: URL-friendly identifier (used in ?slide=<id>)
 * - label: Human-readable name shown in navigation dots
 * - component: The React component to render
 *
 * Slides are displayed in the order they appear in this array.
 * To reorder, simply move the entries. To add personalized decks,
 * create a new page (e.g., /pitch/diatico/page.tsx) with a modified registry.
 */
const slides: SlideConfig[] = [
  {
    id: "opening",
    label: "FoodGrid",
    component: <OpeningSlide />,
  },
  {
    id: "problem",
    label: "The Problem",
    component: <ProblemSlide />,
  },
  {
    id: "solution",
    label: "The Solution",
    component: <SolutionSlide />,
  },
  {
    id: "modules",
    label: "Product Modules",
    component: <ProductModulesSlide />,
  },
  {
    id: "architecture",
    label: "Architecture",
    component: <ArchitectureSlide />,
  },
  {
    id: "flow",
    label: "Live Flow",
    component: <LiveFlowSlide />,
  },
  {
    id: "aggregators",
    label: "Aggregator Integration",
    component: <AggregatorSlide />,
  },
  {
    id: "value",
    label: "Business Value",
    component: <BusinessValueSlide />,
  },
  {
    id: "usecase",
    label: "Use Case",
    component: <UseCaseSlide />,
  },
  {
    id: "cta",
    label: "Get Started",
    component: <CTASlide />,
  },
];

function PitchDeckContent() {
  return <PitchDeck slides={slides} />;
}

export default function PitchPage() {
  return (
    <Suspense fallback={
      <div style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-app)"
      }}>
        <div className="animate-spin" style={{
          width: 40,
          height: 40,
          border: "3px solid var(--border-light)",
          borderTopColor: "var(--primary)",
          borderRadius: "50%"
        }} />
      </div>
    }>
      <PitchDeckContent />
    </Suspense>
  );
}
