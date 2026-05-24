import { Button } from "@/components/ui/button";
import { Link, Navigate } from "react-router-dom";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  CalendarDays,
  Target,
  Droplets,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { PlantIndicator } from "@/components/garden/PlantIndicator";

export function LandingPage() {
  const { user } = useAuth();
  if (user) return <Navigate to="/home" replace />;

  return (
    <div className="relative min-h-screen bg-background text-ghibli-canopy overflow-x-hidden">
      {/* Soft botanical background — matches the in-app garden atmosphere */}
      <div className="fixed inset-0 mist-overlay pointer-events-none z-0" />
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-ghibli-sunlight/10 blur-[120px] rounded-full pointer-events-none animate-shimmer" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-ghibli-moss/5 blur-[100px] rounded-full pointer-events-none animate-pulse-soft" />

      {/* ── Header ─────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 glass-cream border-b border-ghibli-moss/15">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-ghibli-canopy tracking-tight font-serif">PassAI</span>
            <span className="hidden sm:inline bg-ghibli-moss/10 text-ghibli-canopy text-[10px] font-bold px-2 py-0.5 rounded-full border border-ghibli-moss/20 uppercase tracking-widest">
              Beta
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-1 text-sm font-serif text-ghibli-canopy/80">
            <a href="#how-it-works" className="px-3 py-2 rounded-full hover:text-ghibli-canopy hover:bg-ghibli-moss/5 transition-colors">How It Works</a>
            <a href="#knowledge-garden" className="px-3 py-2 rounded-full hover:text-ghibli-canopy hover:bg-ghibli-moss/5 transition-colors">Knowledge Garden</a>
            <Link to="/pricing" className="px-3 py-2 rounded-full hover:text-ghibli-canopy hover:bg-ghibli-moss/5 transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Button asChild variant="ghost" className="text-ghibli-canopy hover:bg-ghibli-moss/5 font-serif">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild className="bg-ghibli-canopy hover:bg-ghibli-forest text-white shadow-md transition-all duration-300 font-serif rounded-full px-4 md:px-5">
              <Link to="/signup">Start Free</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
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
              Know what to study<br className="hidden sm:block" /> before your exam.
            </h1>

            <p className="text-lg md:text-xl text-ghibli-bark max-w-xl mx-auto lg:mx-0 leading-relaxed font-serif">
              Upload your notes, slides and readings. PassAI creates quizzes from your actual course
              materials, finds the concepts holding you back, and shows how close you are to your
              target grade.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start pt-2">
              <Button asChild size="lg" className="h-14 px-8 text-base bg-ghibli-canopy hover:bg-ghibli-forest text-white shadow-md hover:shadow-lg transition-all duration-300 font-serif rounded-full">
                <Link to="/signup">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Materials Free
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-base border-ghibli-moss/30 text-ghibli-canopy hover:bg-white/60 font-serif rounded-full">
                <a href="#how-it-works">See How It Works</a>
              </Button>
            </div>

            <p className="text-sm text-ghibli-bark/75 font-sans max-w-md mx-auto lg:mx-0 leading-relaxed">
              Built from your materials. Focused on your exam. Designed to show what you actually know.
            </p>
          </div>

          {/* Hero product preview — believable PassAI screen */}
          <div className="relative">
            <div className="absolute inset-0 bg-ghibli-moss/10 blur-3xl rounded-[2.5rem] transform scale-95" />
            <HeroProductPreview />
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 py-20 md:py-24 px-6 bg-white/30 backdrop-blur-sm border-y border-ghibli-moss/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-ghibli-canopy">
              From your materials to exam readiness
            </h2>
            <p className="text-ghibli-bark font-serif text-base md:text-lg leading-relaxed">
              PassAI turns what you are already studying into a focused plan for what to study next.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StepCard
              number="01"
              plant="/plant-seedling-raw.png"
              title="Upload what you are studying"
              text="Add your class notes, teacher's slides, readings or revision documents."
            />
            <StepCard
              number="02"
              plant="/plant-young-raw.png"
              title="Take quizzes from your course"
              text="PassAI generates targeted questions from the materials your exam is based on."
            />
            <StepCard
              number="03"
              plant="/plant-flower-raw.png"
              title="Find what needs water"
              text="See which concepts are weak, which are growing and where to focus next."
            />
            <StepCard
              number="04"
              plant="/plant-lush-raw.png"
              title="Grow toward your target grade"
              text="Set your exam date and target grade, then follow a study plan shaped by your progress."
            />
          </div>
        </div>
      </section>

      {/* ── Product proof panels ────────────────────────────── */}
      <section className="relative z-10 py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-ghibli-canopy">
              See exactly what the product does.
            </h2>
            <p className="text-ghibli-bark font-serif text-base md:text-lg leading-relaxed">
              Four real screens from inside PassAI — every claim on this page lives in the product.
              Values below are example data, not a live account.
            </p>
          </div>

          <div className="space-y-12 md:space-y-20">
            <ProofPanel
              align="left"
              label="Materials"
              title="Upload your real study materials"
              text="PDFs, slides, readings and images become the source for your practice — no generic question banks."
              visual={<MaterialsPreview />}
            />
            <ProofPanel
              align="right"
              label="Quiz"
              title="Answer questions based on your course"
              text="Practice with questions generated from what you are actually expected to know."
              visual={<QuizPreview />}
            />
            <ProofPanel
              align="left"
              label="Knowledge Garden"
              title="See which topics need attention"
              text="Your Knowledge Garden shows the concepts that need water and the ones already growing."
              visual={<GardenPreview />}
            />
            <ProofPanel
              align="right"
              label="Study Plan"
              title="Study toward your exam goal"
              text="Set an exam date and target grade, then focus on the topics most likely to improve your readiness."
              visual={<StudyPlanPreview />}
            />
          </div>

          <p className="text-center mt-16 text-ghibli-canopy font-serif text-lg md:text-xl italic max-w-2xl mx-auto leading-relaxed">
            PassAI does not simply generate more questions. It helps you decide what to study next.
          </p>
        </div>
      </section>

      {/* ── Differentiator / Comparison ─────────────────────── */}
      <section className="relative z-10 py-20 md:py-24 px-6 bg-white/30 backdrop-blur-sm border-y border-ghibli-moss/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-ghibli-canopy">
              Not another generic quiz generator.
            </h2>
            <p className="text-ghibli-bark font-serif text-base md:text-lg leading-relaxed">
              Most study tools give you flashcards or AI questions detached from your actual class.
              PassAI begins with your own course materials, then uses your quiz progress to show
              what you understand and what still needs work before the exam.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 md:gap-6">
            <ComparisonCard
              tone="muted"
              heading="Ordinary study tools"
              items={[
                "Generic flashcards or prompts",
                "One-off quiz scores",
                "No clear exam path",
                "Students still guess what to revise",
              ]}
            />
            <ComparisonCard
              tone="primary"
              heading="PassAI"
              items={[
                "Questions from your own materials",
                "Concept-by-concept progress",
                "Weak topics clearly identified",
                "A study path toward your target grade",
              ]}
            />
          </div>
        </div>
      </section>

      {/* ── Knowledge Garden ────────────────────────────────── */}
      <section id="knowledge-garden" className="relative z-10 py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.1fr] gap-12 items-center">
          <div className="space-y-5">
            <span className="inline-block font-sans text-[11px] uppercase tracking-[0.22em] text-ghibli-moss px-3 py-1 rounded-full bg-ghibli-mist/60 border border-ghibli-moss/15">
              Knowledge Garden
            </span>
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-ghibli-canopy leading-tight">
              See your knowledge grow.
            </h2>
            <p className="text-ghibli-bark font-serif text-base md:text-lg leading-relaxed">
              Every topic in your course becomes part of your Knowledge Garden. Concepts you
              understand begin to grow. Topics that need attention are marked clearly, so you can
              stop reviewing everything and focus on what matters most.
            </p>
            <div className="grid grid-cols-2 gap-3 max-w-md pt-2">
              <GardenStatusChip dot="#c98a3b" label="Needs Water" />
              <GardenStatusChip dot="#7fa05a" label="Sprouting" />
              <GardenStatusChip dot="#4f8a3f" label="Growing" />
              <GardenStatusChip dot="#2d6a3e" label="Thriving" />
            </div>
          </div>
          <div>
            <BigGardenPreview />
          </div>
        </div>
      </section>

      {/* ── Exam Readiness / Pain ───────────────────────────── */}
      <section className="relative z-10 py-20 md:py-24 px-6 bg-white/30 backdrop-blur-sm border-y border-ghibli-moss/10">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-ghibli-canopy">
            Stop guessing whether you are ready.
          </h2>
          <ParchmentCard className="p-8 md:p-10 text-left max-w-2xl mx-auto" hover={false}>
            <ul className="space-y-3 font-serif text-base md:text-lg text-ghibli-canopy leading-relaxed">
              <li>Your exam is getting closer.</li>
              <li>Your materials are scattered across notes, slides and documents.</li>
              <li>You do not need to revise everything again.</li>
              <li className="font-semibold">You need to know what to study next.</li>
            </ul>
          </ParchmentCard>
          <p className="text-ghibli-bark font-serif text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            PassAI turns your existing materials into a focused path from uncertainty to exam
            readiness.
          </p>
          <div className="pt-2">
            <Button asChild size="lg" className="h-14 px-10 text-base bg-ghibli-canopy hover:bg-ghibli-forest text-white shadow-md hover:shadow-lg transition-all duration-300 font-serif rounded-full">
              <Link to="/signup">
                <Sparkles className="w-4 h-4 mr-2" />
                Start Your Study Garden
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Pricing — preserves existing plans and routes ───── */}
      <section id="pricing" className="relative z-10 py-20 md:py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-ghibli-canopy">
              Your exam materials are already there. Find out what you actually know.
            </h2>
            <p className="text-ghibli-bark font-serif text-base md:text-lg leading-relaxed">
              Upload your materials, take your first quiz and begin growing toward your target grade.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="parchment-solid rounded-[2rem] p-8 border border-ghibli-moss/10 flex flex-col hover:-translate-y-1 transition-transform duration-500">
              <h3 className="text-xl font-bold font-serif text-ghibli-canopy mb-1">Starter</h3>
              <p className="text-4xl font-bold font-serif text-ghibli-canopy mb-6">Free</p>
              <ul className="space-y-3 mb-8 flex-1 font-sans">
                {[
                  "Unlimited courses",
                  "Quizzes from your own materials",
                  "Knowledge Garden topic view",
                  "Pass-probability tracking",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-ghibli-bark">
                    <CheckCircle2 className="w-4 h-4 text-ghibli-moss shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="w-full h-12 rounded-full border-ghibli-moss/30 text-ghibli-canopy font-serif">
                <Link to="/signup">Upload Materials Free</Link>
              </Button>
            </div>

            <div className="parchment-solid rounded-[2rem] p-8 border-2 border-ghibli-gold shadow-md flex flex-col relative hover:-translate-y-1 transition-transform duration-500">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-ghibli-gold text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                Recommended
              </div>
              <h3 className="text-xl font-bold font-serif text-ghibli-canopy mb-1">Pass Pro</h3>
              <div className="mb-1">
                <span className="text-4xl font-bold font-serif text-ghibli-canopy">$79</span>
                <span className="text-ghibli-bark font-serif opacity-60">/year</span>
              </div>
              <p className="text-xs text-ghibli-bark/75 font-sans mb-6">
                or $9.99/month — see <Link to="/pricing" className="underline underline-offset-2 hover:text-ghibli-canopy">all plans</Link>
              </p>
              <ul className="space-y-3 mb-8 flex-1 font-sans">
                {[
                  "Everything in Starter",
                  "Full Knowledge Garden — concept-level mastery",
                  "Smart Study Plan tailored to your exam",
                  "Priority AI generation",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-ghibli-bark">
                    <Sparkles className="w-4 h-4 text-ghibli-gold shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full h-12 rounded-full bg-ghibli-canopy hover:bg-ghibli-forest text-white font-serif">
                <Link to="/signup">Begin 7-Day Trial</Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
            <Button asChild size="lg" className="h-13 px-8 bg-ghibli-canopy hover:bg-ghibli-forest text-white shadow-md font-serif rounded-full">
              <Link to="/signup">
                <Upload className="w-4 h-4 mr-2" />
                Upload Materials Free
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-13 px-8 border-ghibli-moss/30 text-ghibli-canopy hover:bg-white/60 font-serif rounded-full">
              <Link to="/login">Log In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="relative z-10 py-12 px-6 border-t border-ghibli-moss/10 text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <p className="text-xs text-ghibli-bark/60 font-sans italic">
            Built for students preparing for the exam they actually have.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[10px] text-ghibli-bark/60 font-serif uppercase tracking-widest">
            <Link to="/terms" className="hover:text-ghibli-canopy">Terms</Link>
            <Link to="/privacy" className="hover:text-ghibli-canopy">Privacy</Link>
            <Link to="/cookies" className="hover:text-ghibli-canopy">Cookies</Link>
            <span>© 2026 Shryn, Inc.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Small reusable bits
   ────────────────────────────────────────────────────────── */

function PreviewBadge({ className = "" }: { className?: string }) {
  return (
    <span
      aria-label="Example preview — not live data"
      title="Example preview — not live data"
      className={`inline-flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-[0.18em] font-semibold px-2 py-0.5 rounded-full bg-ghibli-bark/10 text-ghibli-bark/85 border border-ghibli-bark/15 ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-ghibli-bark/40" />
      Preview
    </span>
  );
}

function StepCard({
  number,
  plant,
  title,
  text,
}: {
  number: string;
  plant: string;
  title: string;
  text: string;
}) {
  return (
    <ParchmentCard className="p-6 md:p-7 h-full flex flex-col" hover={false}>
      <div className="flex items-center justify-between mb-4">
        <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-ghibli-moss font-semibold">
          Step {number}
        </span>
        <img
          src={plant}
          alt=""
          className="w-12 h-12 object-contain opacity-90"
          style={{ mixBlendMode: "darken" }}
        />
      </div>
      <h3 className="font-serif text-lg font-semibold text-ghibli-canopy mb-2 leading-snug">
        {title}
      </h3>
      <p className="font-sans text-sm text-ghibli-bark/90 leading-relaxed">{text}</p>
    </ParchmentCard>
  );
}

function ProofPanel({
  align,
  label,
  title,
  text,
  visual,
}: {
  align: "left" | "right";
  label: string;
  title: string;
  text: string;
  visual: React.ReactNode;
}) {
  return (
    <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
      <div className={align === "right" ? "lg:order-2" : ""}>
        <span className="inline-block font-sans text-[11px] uppercase tracking-[0.22em] text-ghibli-moss mb-3 px-3 py-1 rounded-full bg-ghibli-mist/60 border border-ghibli-moss/15">
          {label}
        </span>
        <h3 className="font-serif text-2xl md:text-3xl font-semibold text-ghibli-canopy leading-tight mb-3">
          {title}
        </h3>
        <p className="font-serif text-base md:text-lg text-ghibli-bark leading-relaxed max-w-md">
          {text}
        </p>
      </div>
      <div className={align === "right" ? "lg:order-1" : ""}>{visual}</div>
    </div>
  );
}

function ComparisonCard({
  tone,
  heading,
  items,
}: {
  tone: "muted" | "primary";
  heading: string;
  items: string[];
}) {
  const isPrimary = tone === "primary";
  return (
    <div
      className={`rounded-[2rem] p-7 md:p-8 border ${
        isPrimary
          ? "parchment-solid border-ghibli-moss/30 shadow-md"
          : "bg-white/50 border-ghibli-bark/15"
      }`}
    >
      <h3
        className={`font-serif text-lg md:text-xl font-semibold mb-5 ${
          isPrimary ? "text-ghibli-canopy" : "text-ghibli-bark/80"
        }`}
      >
        {heading}
      </h3>
      <ul className="space-y-3">
        {items.map((it) => (
          <li
            key={it}
            className={`flex items-start gap-3 text-sm md:text-base font-sans ${
              isPrimary ? "text-ghibli-canopy" : "text-ghibli-bark/75"
            }`}
          >
            {isPrimary ? (
              <CheckCircle2 className="w-4 h-4 mt-0.5 text-ghibli-moss shrink-0" />
            ) : (
              <span className="w-4 h-4 mt-0.5 inline-flex items-center justify-center text-ghibli-bark/50 shrink-0">
                ✕
              </span>
            )}
            <span className="leading-relaxed">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GardenStatusChip({ dot, label }: { dot: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-full bg-white/60 border border-ghibli-moss/15 font-sans text-sm text-ghibli-canopy">
      <span
        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
        style={{ background: dot }}
      />
      {label}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Product preview blocks — modelled on real in-app screens.
   All numbers are example data; each card carries a Preview
   badge so visitors don't mistake them for a live account.
   ────────────────────────────────────────────────────────── */

function HeroProductPreview() {
  return (
    <ParchmentCard className="relative p-6 md:p-7" glow>
      {/* Window chrome */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-ghibli-coral/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-ghibli-gold/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-ghibli-moss/70" />
        </div>
        <div className="flex items-center gap-2">
          <PreviewBadge />
          <span className="hidden sm:inline font-sans text-[10px] uppercase tracking-[0.22em] text-ghibli-moss">
            Biology Final
          </span>
        </div>
      </div>
      <p className="font-sans text-[11px] text-ghibli-bark/70 italic text-center mb-4">
        Example dashboard. Your numbers will come from your own materials and quizzes.
      </p>

      {/* Hero garden mini-card */}
      <div className="rounded-2xl bg-white/55 border border-ghibli-moss/15 p-5 md:p-6 mb-4">
        <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
          <div>
            <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-ghibli-moss mb-1.5">
              Growing toward Grade 6
            </p>
            <p className="font-serif text-2xl md:text-3xl font-semibold text-ghibli-canopy leading-tight mb-2">
              72% pass probability
            </p>
            <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "#e8e3d5" }}>
              <div className="h-full rounded-full" style={{ width: "72%", background: "#6b8e4e" }} />
              <div
                className="absolute"
                style={{ left: "85%", width: "2px", top: "-3px", bottom: "-3px", background: "#4a6b3a" }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-ghibli-canopy/65 font-sans">
              <span>Needs water</span>
              <span className="mr-[13%]">Target</span>
            </div>
          </div>
          <PlantIndicator probability={72} size="lg" showPercent={false} />
        </div>
      </div>

      {/* Exam countdown row */}
      <div className="flex items-center gap-3 rounded-xl bg-white/60 border border-ghibli-moss/15 px-3.5 py-2.5 mb-2.5">
        <CalendarDays className="w-4 h-4 text-ghibli-canopy shrink-0" />
        <span className="font-sans text-sm text-ghibli-canopy flex-1">12 days until your exam</span>
        <span className="font-sans text-[10px] uppercase tracking-widest text-ghibli-moss">Study Plan</span>
      </div>

      {/* Material row */}
      <div className="flex items-center gap-3 rounded-xl bg-white/60 border border-ghibli-moss/15 px-3.5 py-2.5 mb-2.5">
        <FileText className="w-4 h-4 text-ghibli-canopy shrink-0" />
        <span className="font-sans text-sm text-ghibli-canopy truncate flex-1">The Phoenix.pdf</span>
        <span className="font-sans text-[10px] uppercase tracking-widest text-ghibli-moss">Indexed</span>
      </div>

      {/* Weak concept card */}
      <div className="rounded-xl bg-white/60 border border-ghibli-moss/15 px-3.5 py-3 flex items-center gap-3">
        <span
          className="inline-flex items-center justify-center w-9 h-9 rounded-full shrink-0"
          style={{ background: "rgba(201, 138, 59, 0.15)" }}
        >
          <Droplets className="w-4 h-4" style={{ color: "#c98a3b" }} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-sm font-semibold text-ghibli-canopy truncate">
            Cellular Respiration
          </p>
          <p className="font-sans text-[11px] text-ghibli-bark/80">
            Weak concept · 38% mastery
          </p>
        </div>
        <span
          className="font-sans text-[10px] uppercase tracking-widest font-semibold px-2 py-1 rounded-full"
          style={{ background: "rgba(201, 138, 59, 0.12)", color: "#a06b1f" }}
        >
          Needs Water
        </span>
      </div>
    </ParchmentCard>
  );
}

function MaterialsPreview() {
  const files = [
    { name: "Lecture 04 — Mitosis.pdf", icon: FileText, status: "Indexed" },
    { name: "Cell Cycle slides.pptx", icon: FileText, status: "Indexed" },
    { name: "Whiteboard photo.jpg", icon: ImageIcon, status: "Indexed" },
    { name: "Past paper notes.docx", icon: FileText, status: "Reading…" },
  ];
  return (
    <ParchmentCard className="p-6 md:p-7" hover={false}>
      <div className="flex items-center justify-between mb-5">
        <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-ghibli-moss font-semibold">
          Materials · Biology
        </span>
        <PreviewBadge />
      </div>
      <p className="font-sans text-[11px] text-ghibli-bark/70 italic mb-4">
        Example layout. Accepted: PDF · DOCX · PPTX · PNG · JPEG.
      </p>
      <div className="border-2 border-dashed border-ghibli-moss/30 rounded-2xl py-7 px-4 mb-4 text-center bg-white/50">
        <Upload className="w-6 h-6 mx-auto text-ghibli-moss mb-2" />
        <p className="font-serif text-sm font-semibold text-ghibli-canopy">
          Drop your notes, slides or readings
        </p>
        <p className="font-sans text-[11px] text-ghibli-bark/70 mt-0.5">
          We'll extract the concepts your course is built on.
        </p>
      </div>
      <div className="space-y-2">
        {files.map((f) => (
          <div
            key={f.name}
            className="flex items-center gap-3 rounded-xl bg-white/55 border border-ghibli-moss/12 px-3 py-2.5"
          >
            <f.icon className="w-4 h-4 text-ghibli-canopy shrink-0" />
            <span className="font-sans text-sm text-ghibli-canopy truncate flex-1">{f.name}</span>
            <span
              className={`font-sans text-[10px] uppercase tracking-widest shrink-0 ${
                f.status === "Indexed" ? "text-ghibli-moss" : "text-ghibli-bark/60 italic"
              }`}
            >
              {f.status}
            </span>
          </div>
        ))}
      </div>
    </ParchmentCard>
  );
}

function QuizPreview() {
  return (
    <ParchmentCard className="p-6 md:p-7" hover={false}>
      <div className="flex items-center justify-between mb-4">
        <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-ghibli-moss font-semibold">
          Topic Quiz · Cellular Respiration
        </span>
        <PreviewBadge />
      </div>
      <p className="font-sans text-[11px] text-ghibli-bark/70 italic mb-3">
        Example question. Yours come from your own course materials.
      </p>
      <div className="h-1.5 w-full rounded-full bg-ghibli-mist/80 overflow-hidden mb-5">
        <div className="h-full rounded-full bg-ghibli-moss" style={{ width: "50%" }} />
      </div>
      <h4 className="font-serif text-lg font-semibold text-ghibli-canopy leading-snug mb-4">
        In which stage of cellular respiration is the majority of ATP produced?
      </h4>
      <div className="space-y-2.5">
        {[
          { letter: "A", text: "Glycolysis", state: "idle" as const },
          { letter: "B", text: "Citric acid cycle", state: "idle" as const },
          { letter: "C", text: "Oxidative phosphorylation", state: "correct" as const },
          { letter: "D", text: "Fermentation", state: "idle" as const },
        ].map((o) => {
          const isCorrect = o.state === "correct";
          return (
            <div
              key={o.letter}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border font-sans text-sm ${
                isCorrect
                  ? "bg-ghibli-moss/12 border-ghibli-moss/40 text-ghibli-canopy"
                  : "bg-white/55 border-ghibli-moss/15 text-ghibli-canopy/85"
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold shrink-0 ${
                  isCorrect
                    ? "bg-ghibli-moss text-white"
                    : "bg-ghibli-mist text-ghibli-canopy/70"
                }`}
              >
                {o.letter}
              </span>
              <span className="flex-1 leading-snug">{o.text}</span>
              {isCorrect && <CheckCircle2 className="w-4 h-4 text-ghibli-moss" />}
            </div>
          );
        })}
      </div>
    </ParchmentCard>
  );
}

function GardenPreview() {
  const topics = [
    { name: "Cellular Respiration", status: "Needs Water", color: "#c98a3b", bg: "rgba(201,138,59,0.12)", pct: 38, plant: 28 },
    { name: "Photosynthesis", status: "Growing", color: "#4f8a3f", bg: "rgba(79,138,63,0.12)", pct: 64, plant: 64 },
    { name: "Cell Division", status: "Blooming", color: "#2d6a3e", bg: "rgba(45,106,62,0.14)", pct: 78, plant: 78 },
    { name: "Genetics & Heredity", status: "Sprouting", color: "#7fa05a", bg: "rgba(127,160,90,0.14)", pct: 48, plant: 48 },
  ];
  return (
    <ParchmentCard className="p-6 md:p-7" hover={false}>
      <div className="flex items-center justify-between mb-5">
        <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-ghibli-moss font-semibold">
          Knowledge Garden · Biology
        </span>
        <PreviewBadge />
      </div>
      <div className="space-y-3">
        {topics.map((t) => (
          <div
            key={t.name}
            className="flex items-center gap-3 rounded-2xl bg-white/55 border border-ghibli-moss/15 px-3.5 py-3"
          >
            <PlantIndicator probability={t.plant} size="sm" showPercent={false} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <p className="font-serif text-sm font-semibold text-ghibli-canopy truncate">
                  {t.name}
                </p>
                <span
                  className="font-sans text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: t.bg, color: t.color }}
                >
                  {t.status}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-ghibli-mist overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${t.pct}%`, background: t.color }}
                />
              </div>
            </div>
            <span className="font-sans text-xs font-semibold text-ghibli-canopy/80 tabular-nums shrink-0">
              {t.pct}%
            </span>
          </div>
        ))}
      </div>
    </ParchmentCard>
  );
}

function StudyPlanPreview() {
  return (
    <ParchmentCard className="p-6 md:p-7" hover={false}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-ghibli-moss font-semibold">
          Study Plan · Biology
        </span>
        <PreviewBadge />
      </div>
      <div className="flex items-center gap-1.5 font-sans text-[11px] text-ghibli-bark/70 mb-4">
        <CalendarDays className="w-3.5 h-3.5" />
        Example · Exam in 12 days
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-2xl bg-white/55 border border-ghibli-moss/15 p-4">
          <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-ghibli-moss mb-1.5">
            Target Grade
          </p>
          <p className="font-serif text-2xl font-semibold text-ghibli-canopy leading-none flex items-center gap-2">
            <Target className="w-5 h-5 text-ghibli-moss" /> Grade 6
          </p>
        </div>
        <div className="rounded-2xl bg-white/55 border border-ghibli-moss/15 p-4">
          <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-ghibli-moss mb-1.5">
            Pass Probability
          </p>
          <p className="font-serif text-2xl font-semibold text-ghibli-canopy leading-none">
            72%
          </p>
        </div>
      </div>

      <p className="font-sans text-[11px] uppercase tracking-[0.18em] text-ghibli-moss/90 mb-2.5">
        Focus next
      </p>
      <div className="space-y-2.5">
        {[
          { name: "Cellular Respiration", reason: "Needs Water · biggest impact", icon: Droplets },
          { name: "Genetics & Heredity", reason: "Sprouting · second priority", icon: ArrowRight },
        ].map((row) => (
          <div
            key={row.name}
            className="flex items-center gap-3 rounded-xl bg-white/55 border border-ghibli-moss/15 px-3.5 py-2.5"
          >
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-ghibli-mist shrink-0">
              <row.icon className="w-4 h-4 text-ghibli-canopy" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-serif text-sm font-semibold text-ghibli-canopy truncate">
                {row.name}
              </p>
              <p className="font-sans text-[11px] text-ghibli-bark/80">{row.reason}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-ghibli-canopy/60 shrink-0" />
          </div>
        ))}
      </div>
    </ParchmentCard>
  );
}

function BigGardenPreview() {
  const topics = [
    { name: "Cellular Respiration", status: "Needs Water", color: "#c98a3b", bg: "rgba(201,138,59,0.12)", pct: 38 },
    { name: "Photosynthesis", status: "Growing", color: "#4f8a3f", bg: "rgba(79,138,63,0.12)", pct: 64 },
    { name: "Cell Division", status: "Blooming", color: "#2d6a3e", bg: "rgba(45,106,62,0.14)", pct: 78 },
    { name: "Genetics & Heredity", status: "Sprouting", color: "#7fa05a", bg: "rgba(127,160,90,0.14)", pct: 48 },
    { name: "Evolution", status: "Thriving", color: "#1f5a3a", bg: "rgba(31,90,58,0.14)", pct: 92 },
  ];
  return (
    <ParchmentCard className="p-7 md:p-8" glow>
      <div className="flex items-center justify-end mb-4">
        <PreviewBadge />
      </div>
      <div className="grid md:grid-cols-[auto_1fr] gap-7 items-center mb-6">
        <PlantIndicator probability={64} size="xl" glow showPercent />
        <div>
          <p className="font-sans text-[11px] uppercase tracking-[0.22em] text-ghibli-moss mb-1.5">
            Biology · Year 12 · Example
          </p>
          <h3 className="font-serif text-2xl md:text-3xl font-semibold text-ghibli-canopy leading-tight mb-1.5">
            14 of 22 concepts mastered.
          </h3>
          <p className="font-sans text-sm text-ghibli-bark/80">
            A grove of <span className="font-semibold text-ghibli-forest">5 topics</span> is taking root.
          </p>
        </div>
      </div>
      <div className="space-y-2.5">
        {topics.map((t) => (
          <div
            key={t.name}
            className="flex items-center gap-3 rounded-2xl bg-white/55 border border-ghibli-moss/15 px-3.5 py-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <p className="font-serif text-sm font-semibold text-ghibli-canopy truncate">
                  {t.name}
                </p>
                <span
                  className="font-sans text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: t.bg, color: t.color }}
                >
                  {t.status}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-ghibli-mist overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${t.pct}%`, background: t.color }}
                />
              </div>
            </div>
            <span className="font-sans text-xs font-semibold text-ghibli-canopy/80 tabular-nums shrink-0">
              {t.pct}%
            </span>
          </div>
        ))}
      </div>
    </ParchmentCard>
  );
}
