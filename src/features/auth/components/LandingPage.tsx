import { Button } from "@/components/ui/button";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Neko } from "@/components/garden/Neko";

export function LandingPage() {
  const { user } = useAuth();
  if (user) return <Navigate to="/home" replace />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b border-border/30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-primary tracking-tight">PassAI</span>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm"><Link to="/login">Sign in</Link></Button>
            <Button asChild size="sm"><Link to="/signup">Start Growing</Link></Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="flex justify-center mb-4">
            <img
              src="/students-hero.png"
              alt="Two students studying together with a cat"
              className="w-full max-w-lg rounded-2xl shadow-lg"
            />
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
            A quiet place to grow
            <br />
            <span className="text-primary">what you know.</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Upload your study materials. Take quizzes rooted in your own notes.
            Watch your understanding grow — and know, honestly, where you stand
            before test day.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild size="lg" className="text-base px-8">
              <Link to="/signup">Start Growing — Free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base px-8">
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground/60 pt-2">
            No credit card. No streaks. No pressure.
          </p>
        </div>
      </section>

      {/* Philosophy strip */}
      <section className="py-12 border-y border-border/30 bg-secondary/30">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl mx-auto">
            PassAI is built on the principle of{" "}
            <span className="text-foreground font-medium">shizen</span>{" "}
            <span className="text-muted-foreground/60">(自然)</span> — naturalness.
            Learning isn't a race. It's a garden. Some days things grow quickly.
            Other days the roots go deeper where you can't see them. Both matter.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-16">How your garden grows</h2>
          <div className="space-y-16">
            <div className="flex items-start gap-6">
              <img src="/plant-seedling-raw.png" alt="" className="w-16 h-auto shrink-0" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Plant your seeds</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Upload your PDFs, notes, or slides. PassAI reads your materials
                  and understands the concepts inside — the soil your garden grows from.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-6">
              <img src="/plant-young-raw.png" alt="" className="w-16 h-auto shrink-0" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Walk the path</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Take quizzes generated from your own materials. Each question is a step
                  along a meandering path — not a straight line, not a test. Just an honest
                  look at what you know.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-6">
              <img src="/plant-flower-raw.png" alt="" className="w-16 h-auto shrink-0" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Watch things grow</h3>
                <p className="text-muted-foreground leading-relaxed">
                  See your pass probability — a real estimate of where you stand, powered by
                  the same knowledge-tracing models used in academic research. Not a guess.
                  Not a score. An honest mirror.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What makes this different */}
      <section className="py-20 px-6 bg-secondary/30 border-y border-border/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-4">Not another flashcard app</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Quizlet tests what you remember. PassAI tells you if you'll pass.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="p-6 bg-card rounded-2xl border border-border/50">
              <div className="text-2xl mb-3">🌱</div>
              <h3 className="font-semibold mb-2">Your materials, your garden</h3>
              <p className="text-sm text-muted-foreground">
                Upload your actual study materials. Quizzes come from what you need to know — not a generic database.
              </p>
            </div>
            <div className="p-6 bg-card rounded-2xl border border-border/50">
              <div className="text-2xl mb-3">🪴</div>
              <h3 className="font-semibold mb-2">Bayesian knowledge tracing</h3>
              <p className="text-sm text-muted-foreground">
                The same model used in learning science research tracks what you actually understand — not just what you got right once.
              </p>
            </div>
            <div className="p-6 bg-card rounded-2xl border border-border/50">
              <div className="text-2xl mb-3">🌿</div>
              <h3 className="font-semibold mb-2">Designed for calm</h3>
              <p className="text-sm text-muted-foreground">
                No streaks. No leaderboards. No panic. Built by a teacher who knows that anxiety is the enemy of learning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Simple, transparent</h2>
          <p className="text-center text-muted-foreground mb-12">
            See where you stand for free. Upgrade when you want the path forward.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="p-8 bg-card rounded-2xl border border-border/50">
              <h3 className="text-lg font-semibold mb-1">Starter</h3>
              <p className="text-3xl font-bold mb-6">Free</p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span>Upload your study materials</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span>AI-generated quizzes from your notes</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span>Pass probability after each quiz</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span>1 subject</li>
              </ul>
              <Button asChild variant="outline" className="w-full mt-8" size="lg">
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
            <div className="p-8 bg-card rounded-2xl border-2 border-primary/40 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold text-primary-foreground bg-primary px-3 py-1 rounded-full">Most Popular</span>
              <h3 className="text-lg font-semibold mb-1">Pass Pro</h3>
              <div className="mb-6">
                <span className="text-3xl font-bold">$79</span>
                <span className="text-muted-foreground">/year</span>
                <p className="text-xs text-muted-foreground mt-1">~$6.58/mo — save 34% vs monthly</p>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span>Everything in Starter</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span>Unlimited subjects</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span>Knowledge garden — topic-by-topic growth</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span>Smart study plans for your exam date</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span>Progress over time</li>
              </ul>
              <Button asChild className="w-full mt-8" size="lg">
                <Link to="/signup">Start 7-Day Free Trial</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="py-16 px-6 border-t border-border/30 bg-secondary/20">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <Neko size={64} className="mx-auto opacity-40" />
          <p className="text-muted-foreground text-sm italic">
            "Gardens don't grow on schedules. But they always grow."
          </p>
          <Button asChild size="lg">
            <Link to="/signup">Start Growing — Free</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/30">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">© 2026 PassAI — Built by a teacher, for students.</span>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <span>IB</span><span>AP</span><span>GCSE</span><span>A-Level</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
