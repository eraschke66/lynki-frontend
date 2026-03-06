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
            <Button asChild size="sm"><Link to="/signup">Start for free</Link></Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
            Turn your notes into quizzes.
            <br />
            <span className="text-primary">Find out if you'll actually pass.</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            No streaks. No leaderboards. Competitions are for sports.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild size="lg" className="text-base px-8">
              <Link to="/signup">Start for free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base px-8">
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>

          <div className="flex justify-center pt-4">
            <img
              src="/students-hero.png"
              alt="Two students studying together"
              className="w-full max-w-md rounded-2xl shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-16">How it works</h2>
          <div className="space-y-16">
            <div className="flex items-center gap-6">
              <img src="/plant-seedling-raw.png" alt="" className="w-20 h-20 object-contain shrink-0" style={{mixBlendMode:'multiply'}} />
              <div>
                <h3 className="text-lg font-semibold mb-2">Upload your notes</h3>
                <p className="text-muted-foreground leading-relaxed">
                  PDFs, slides, whatever you actually study from. PassAI reads it and builds quizzes from the real material.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <img src="/plant-young-raw.png" alt="" className="w-20 h-20 object-contain shrink-0" style={{mixBlendMode:'multiply'}} />
              <div>
                <h3 className="text-lg font-semibold mb-2">Take a real quiz</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Questions come from your own material, not some generic database. If it's not in your notes, it's not in the quiz.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <img src="/plant-flower-raw.png" alt="" className="w-20 h-20 object-contain shrink-0" style={{mixBlendMode:'multiply'}} />
              <div>
                <h3 className="text-lg font-semibold mb-2">See where you stand</h3>
                <p className="text-muted-foreground leading-relaxed">
                  A real pass probability, before the exam tells you. Powered by the same knowledge tracking used in academic research.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What makes this different */}
      <section className="py-20 px-6 bg-secondary/30 border-y border-border/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-4">This isn't Quizlet</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Quizlet tests what you remember. PassAI tells you if you'll pass.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="p-6 bg-card rounded-2xl border border-border/50">
              <div className="text-2xl mb-3">🌱</div>
              <h3 className="font-semibold mb-2">Your materials only</h3>
              <p className="text-sm text-muted-foreground">
                Upload what you actually study. Quizzes come from your notes, not a generic question bank.
              </p>
            </div>
            <div className="p-6 bg-card rounded-2xl border border-border/50">
              <div className="text-2xl mb-3">🪴</div>
              <h3 className="font-semibold mb-2">Tracks what you know</h3>
              <p className="text-sm text-muted-foreground">
                Not just what you got right once. The same knowledge tracking model used in academic research.
              </p>
            </div>
            <div className="p-6 bg-card rounded-2xl border border-border/50">
              <div className="text-2xl mb-3">🌿</div>
              <h3 className="font-semibold mb-2">Built for calm</h3>
              <p className="text-sm text-muted-foreground">
                No streaks. No rankings. No panic. Built by a teacher who knows anxiety gets in the way of learning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Simple pricing</h2>
          <p className="text-center text-muted-foreground mb-12">
            Start free. Upgrade when you want the full picture.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="p-8 bg-card rounded-2xl border border-border/50">
              <h3 className="text-lg font-semibold mb-1">Starter</h3>
              <p className="text-3xl font-bold mb-6">Free</p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span>Upload your study materials</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span>AI quizzes from your notes</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span>Pass probability after each quiz</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span>1 subject</li>
              </ul>
              <Button asChild variant="outline" className="w-full mt-8" size="lg">
                <Link to="/signup">Get started</Link>
              </Button>
            </div>
            <div className="p-8 bg-card rounded-2xl border-2 border-primary/40 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold text-primary-foreground bg-primary px-3 py-1 rounded-full">Most popular</span>
              <h3 className="text-lg font-semibold mb-1">Pass Pro</h3>
              <div className="mb-6">
                <span className="text-3xl font-bold">$79</span>
                <span className="text-muted-foreground">/year</span>
                <p className="text-xs text-muted-foreground mt-1">about $6.58 a month</p>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span>Everything in Starter</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span>Unlimited subjects</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span>Knowledge garden with topic breakdown</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span>Study plans built around your exam date</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span>Progress tracking over time</li>
              </ul>
              <Button asChild className="w-full mt-8" size="lg">
                <Link to="/signup">Start 7 day free trial</Link>
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
            Your notes. Your quiz. Your honest shot at passing.
          </p>
          <Button asChild size="lg">
            <Link to="/signup">Start for free</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/30">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">© 2026 PassAI. Built by a teacher, for students.</span>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <span>IB</span><span>AP</span><span>GCSE</span><span>A-Level</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
