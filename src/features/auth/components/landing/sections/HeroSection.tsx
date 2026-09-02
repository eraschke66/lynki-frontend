import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroProductPreview } from "../previews/HeroProductPreview";

export function HeroSection() {
  return (
    <section className="relative z-10 pt-32 md:pt-36 pb-16 px-6">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
        <div className="text-center lg:text-left space-y-7">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ghibli-moss/10 border border-ghibli-moss/20 text-ghibli-canopy text-[11px] font-semibold uppercase tracking-[0.18em] font-sans">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ghibli-gold opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-ghibli-gold" />
            </span>
            Your materials. Your exam. Your study path.
          </div>

          <h1 className="font-serif text-[2.5rem] leading-[1.05] sm:text-5xl lg:text-[3.75rem] font-semibold text-ghibli-canopy tracking-tight">
            Find your gaps.<br className="hidden sm:block" /> Walk into the exam ready.
          </h1>

          <p className="text-lg md:text-xl text-ghibli-bark max-w-xl mx-auto lg:mx-0 leading-relaxed font-serif">
            PassAI analyzes your own course material, tests your real understanding, and shows
            which topics need attention before exam day.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start pt-2">
            <Button asChild size="lg" className="h-14 px-8 text-base bg-ghibli-canopy hover:bg-ghibli-forest text-white shadow-md hover:shadow-lg transition-all duration-300 font-serif rounded-full">
              <Link to="/signup">
                <Sparkles className="w-4 h-4 mr-2" />
                Try Free for 7 Days
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-8 text-base border-ghibli-moss/30 text-ghibli-canopy hover:bg-white/60 font-serif rounded-full">
              <a href="#how-it-works">See How It Works</a>
            </Button>
          </div>

          <p className="text-sm text-ghibli-bark font-sans max-w-md mx-auto lg:mx-0 leading-relaxed">
            Upload one document. Take your first quiz. See what needs work.
          </p>
          <p className="text-sm text-ghibli-bark font-sans max-w-md mx-auto lg:mx-0 leading-relaxed">
            The whole garden, free for 7 days. No credit card. After that it is
            $9.99/month or $79/year.
          </p>
        </div>

        {/* Hero product preview — believable PassAI screen */}
        <div className="relative">
          <div className="absolute inset-0 bg-ghibli-moss/10 blur-3xl rounded-[2.5rem] transform scale-95" />
          <HeroProductPreview />
          <p className="font-sans text-[12px] md:text-xs text-ghibli-bark italic text-center mt-3 max-w-md mx-auto leading-relaxed">
            Your readiness estimate updates as you complete quizzes from your materials.
          </p>
        </div>
      </div>
    </section>
  );
}
