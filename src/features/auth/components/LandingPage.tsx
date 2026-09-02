import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import { LandingNav } from "./landing/sections/LandingNav";
import { HeroSection } from "./landing/sections/HeroSection";
import { EducatorTrustSection } from "./landing/sections/EducatorTrustSection";
import { HowItWorksSection } from "./landing/sections/HowItWorksSection";
import { ProductProofSection } from "./landing/sections/ProductProofSection";
import { ComparisonSection } from "./landing/sections/ComparisonSection";
import { KnowledgeGardenSection } from "./landing/sections/KnowledgeGardenSection";
import { ExamReadinessSection } from "./landing/sections/ExamReadinessSection";
import { PricingCtaSection } from "./landing/sections/PricingCtaSection";
import { LandingFooter } from "./landing/sections/LandingFooter";

export function LandingPage() {
  const { user } = useAuth();
  if (user) return <Navigate to="/home" replace />;

  return (
    <div className="relative min-h-screen bg-background text-ghibli-canopy overflow-x-hidden">
      {/* Soft botanical background — matches the in-app garden atmosphere */}
      <div className="fixed inset-0 mist-overlay pointer-events-none z-0" />
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-ghibli-sunlight/10 blur-[120px] rounded-full pointer-events-none animate-shimmer" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-ghibli-moss/5 blur-[100px] rounded-full pointer-events-none animate-pulse-soft" />

      {/* Faded foliage at viewport edges — restrained botanical framing */}
      <img
        src="/foliage-left-v2.png"
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className="hidden md:block fixed left-0 bottom-0 w-[280px] lg:w-[340px] opacity-[0.18] pointer-events-none select-none z-0"
        style={{ mixBlendMode: "multiply" }}
      />
      <img
        src="/foliage-right-v2.png"
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className="hidden md:block fixed right-0 bottom-0 w-[280px] lg:w-[340px] opacity-[0.18] pointer-events-none select-none z-0"
        style={{ mixBlendMode: "multiply" }}
      />

      <LandingNav />
      <HeroSection />
      <EducatorTrustSection />
      <HowItWorksSection />
      <ProductProofSection />
      <ComparisonSection />
      <KnowledgeGardenSection />
      <ExamReadinessSection />
      <PricingCtaSection />
      <LandingFooter />
    </div>
  );
}
