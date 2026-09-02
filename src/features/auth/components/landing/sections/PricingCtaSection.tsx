import { Link } from "react-router-dom";
import { CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PricingCtaSection() {
  return (
    <section id="pricing" className="relative z-10 pt-12 md:pt-14 pb-20 md:pb-24 px-6 bg-white/30 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10 space-y-3 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-ghibli-canopy">
            Your exam materials are already there. Find out what you actually know.
          </h2>
          <p className="text-ghibli-bark font-serif text-base md:text-lg leading-relaxed">
            Try the whole garden free for 7 days. No credit card, nothing held back.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Trial card — full access, time-limited. There is no permanent free tier. */}
          <div className="parchment-solid rounded-[2rem] p-8 border-2 border-ghibli-gold shadow-md flex flex-col relative hover:-translate-y-1 transition-transform duration-500">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-ghibli-gold text-ghibli-canopy text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
              Start here
            </div>
            <h3 className="text-xl font-bold font-serif text-ghibli-canopy mb-1">Your first 7 days</h3>
            <div className="mb-1">
              <span className="text-4xl font-bold font-serif text-ghibli-canopy">Free</span>
            </div>
            <p className="text-xs text-ghibli-bark font-sans mb-6">
              No credit card required
            </p>
            <ul className="space-y-3 mb-8 flex-1 font-sans">
              {[
                "Unlimited courses from your own materials",
                "Adaptive quizzes and mock exams",
                "Full Knowledge Garden — concept-level mastery",
                "Smart Study Plan tailored to your exam",
                "Pass-probability tracking",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-ghibli-bark">
                  <CheckCircle2 className="w-4 h-4 text-ghibli-forest shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Button asChild className="w-full h-12 rounded-full bg-ghibli-canopy hover:bg-ghibli-forest text-white font-serif">
              <Link to="/signup">Start Your 7-Day Free Trial</Link>
            </Button>
          </div>

          <div className="parchment-solid rounded-[2rem] p-8 border border-ghibli-moss/10 flex flex-col hover:-translate-y-1 transition-transform duration-500">
            <h3 className="text-xl font-bold font-serif text-ghibli-canopy mb-1">Pass Pro, after day 7</h3>
            <div className="mb-1">
              <span className="text-4xl font-bold font-serif text-ghibli-canopy">$79</span>
              <span className="text-ghibli-bark font-serif">/year</span>
            </div>
            <p className="text-xs text-ghibli-bark font-sans mb-6">
              or $9.99/month — see <Link to="/pricing" className="underline underline-offset-2 hover:text-ghibli-canopy">all plans</Link>
            </p>
            <ul className="space-y-3 mb-8 flex-1 font-sans">
              {[
                "Everything from your trial, kept growing",
                "Your garden and study plan carry over",
                "Priority AI generation",
                "Cancel any time before day 7 and you are not charged",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-ghibli-bark">
                  <Sparkles className="w-4 h-4 text-ghibli-gold shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="w-full h-12 rounded-full border-ghibli-moss/30 text-ghibli-canopy font-serif">
              <Link to="/pricing">See Plans</Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
          <Button asChild size="lg" className="h-13 px-8 bg-ghibli-canopy hover:bg-ghibli-forest text-white shadow-md font-serif rounded-full">
            <Link to="/signup">
              <Sparkles className="w-4 h-4 mr-2" />
              Start Your 7-Day Free Trial
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-13 px-8 border-ghibli-moss/30 text-ghibli-canopy hover:bg-white/60 font-serif rounded-full">
            <Link to="/login">Log In</Link>
          </Button>
        </div>

        <p className="text-center text-sm text-ghibli-bark font-sans mt-6 max-w-xl mx-auto leading-relaxed">
          Free for 7 days, no credit card. After that, Pass Pro is $9.99/month or
          $79/year — and you will not be charged unless you choose to continue.
        </p>
      </div>
    </section>
  );
}
