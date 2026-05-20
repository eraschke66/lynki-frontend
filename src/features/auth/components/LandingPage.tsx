import { Button } from "@/components/ui/button";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function LandingPage() {
  const { user } = useAuth();
  if (user) return <Navigate to="/home" replace />;

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Premium Background Effects */}
      <div className="fixed inset-0 mist-overlay pointer-events-none z-0" />
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-ghibli-sunlight/10 blur-[120px] rounded-full pointer-events-none animate-shimmer" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-ghibli-moss/5 blur-[100px] rounded-full pointer-events-none animate-pulse-soft" />

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 glass-cream border-b border-ghibli-moss/15">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-ghibli-canopy tracking-tight font-serif">PassAI</span>
            <span className="bg-ghibli-moss/10 text-ghibli-canopy text-[10px] font-bold px-2 py-0.5 rounded-full border border-ghibli-moss/20 uppercase tracking-widest">Beta</span>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" className="text-ghibli-canopy hover:bg-ghibli-moss/5 font-serif"><Link to="/login">Sign in</Link></Button>
            <Button asChild className="bg-ghibli-canopy hover:bg-ghibli-forest text-white shadow-glow transition-all duration-300 font-serif"><Link to="/signup">Begin Journey</Link></Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-40 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ghibli-sunlight/20 border border-ghibli-sunlight/30 text-ghibli-bark text-xs font-medium animate-in fade-in slide-in-from-top-4 duration-1000">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ghibli-gold opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-ghibli-gold"></span>
            </span>
            Designed for calm, focused learning
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight font-serif text-ghibli-canopy">
            Tend to your knowledge.
            <br />
            <span className="text-ghibli-gold drop-shadow-sm">Watch your grades grow.</span>
          </h1>

          <p className="text-xl text-ghibli-bark max-w-2xl mx-auto leading-relaxed font-serif opacity-90">
            A beautiful, science-backed garden for your studies. 
            Upload notes, take real-material quizzes, and know if you'll pass—without the stress.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button asChild size="lg" className="h-14 px-10 text-lg bg-ghibli-canopy hover:bg-ghibli-forest text-white shadow-glow-soft transition-all duration-300 font-serif rounded-leaf">
              <Link to="/signup">Start your garden for free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-10 text-lg border-ghibli-moss/30 text-ghibli-canopy hover:bg-white/50 font-serif rounded-leaf">
              <a href="#how-it-works">How it works</a>
            </Button>
          </div>

          <div className="relative mt-16 max-w-4xl mx-auto group">
            <div className="absolute inset-0 bg-ghibli-moss/10 blur-3xl rounded-4xl transform scale-95 group-hover:scale-100 transition-transform duration-700" />
            <img
              src="/students-hero-final.png"
              alt="Two students studying together"
              className="relative w-full rounded-3xl shadow-parchment border border-ghibli-moss/10 z-10"
            />
            {/* Floating leaf decorations */}
            <img src="/plant-young-raw.png" className="absolute -left-12 -bottom-12 w-32 h-32 animate-float-leaf z-20 opacity-80" alt="" />
            <img src="/plant-seedling-raw.png" className="absolute -right-8 -top-8 w-24 h-24 animate-drift z-20 opacity-60" alt="" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative z-10 py-24 px-6 bg-white/30 backdrop-blur-sm border-y border-ghibli-moss/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-ghibli-canopy">The Gardener's Method</h2>
            <p className="text-ghibli-bark font-serif opacity-80">Three simple steps to mastery.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center group">
              <div className="w-24 h-24 mb-6 rounded-full bg-ghibli-cream flex items-center justify-center border-2 border-ghibli-moss/10 shadow-parchment group-hover:shadow-parchment-hover transition-all duration-500">
                <img src="/plant-seedling-raw.png" alt="" className="w-14 h-14 object-contain animate-drift" style={{mixBlendMode:'darken'}} />
              </div>
              <h3 className="text-xl font-bold font-serif text-ghibli-canopy mb-3">Plant Seeds</h3>
              <p className="text-ghibli-bark font-serif text-sm leading-relaxed opacity-90">
                Upload your real notes and slides. We transform them into a unique knowledge bed.
              </p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <div className="w-24 h-24 mb-6 rounded-full bg-ghibli-cream flex items-center justify-center border-2 border-ghibli-moss/10 shadow-parchment group-hover:shadow-parchment-hover transition-all duration-500">
                <img src="/plant-young-raw.png" alt="" className="w-14 h-14 object-contain animate-float-leaf" style={{mixBlendMode:'darken'}} />
              </div>
              <h3 className="text-xl font-bold font-serif text-ghibli-canopy mb-3">Tend Daily</h3>
              <p className="text-ghibli-bark font-serif text-sm leading-relaxed opacity-90">
                Take quizzes generated from your material. Focus on what's weakest.
              </p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <div className="w-24 h-24 mb-6 rounded-full bg-ghibli-cream flex items-center justify-center border-2 border-ghibli-moss/10 shadow-parchment group-hover:shadow-parchment-hover transition-all duration-500">
                <img src="/plant-flower-raw.png" alt="" className="w-14 h-14 object-contain animate-pulse-soft" style={{mixBlendMode:'darken'}} />
              </div>
              <h3 className="text-xl font-bold font-serif text-ghibli-canopy mb-3">Harvest Mastery</h3>
              <p className="text-ghibli-bark font-serif text-sm leading-relaxed opacity-90">
                See a real-time pass probability. Know exactly when you're ready for the exam.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="parchment-solid rounded-[2.5rem] p-10 md:p-16 border-2 border-ghibli-moss/10 relative overflow-hidden">
             {/* Decorative corner */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-ghibli-sunlight/20 blur-3xl rounded-full" />
            
            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold font-serif text-ghibli-canopy">This isn't Quizlet.</h2>
                <p className="text-ghibli-bark font-serif leading-relaxed">
                  Most apps test what you can memorize in a flashcard session. 
                  PassAI uses <span className="text-ghibli-jungle font-bold">Bayesian Knowledge Tracing</span>—the gold standard in cognitive science—to track what you actually <span className="italic">know</span> across weeks of study.
                </p>
                <div className="space-y-4">
                  {[
                    "Quizzes from your notes, not generic banks",
                    "Scientific tracking of long-term mastery",
                    "A calm interface designed to reduce anxiety"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-ghibli-canopy font-serif font-medium">
                      <div className="w-5 h-5 rounded-full bg-ghibli-moss/20 flex items-center justify-center text-[10px]">✓</div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <img src="/cat-pawprint.png" className="absolute -top-12 -left-8 w-20 h-20 opacity-10 -rotate-12" alt="" />
                <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 border border-ghibli-moss/20 shadow-sm">
                  <div className="h-40 w-full bg-ghibli-moss/5 rounded-lg flex items-center justify-center mb-4 border border-ghibli-moss/10">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-ghibli-canopy font-serif">87%</p>
                      <p className="text-xs text-ghibli-bark font-serif uppercase tracking-widest mt-1">Pass Probability</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-1.5 w-full bg-ghibli-moss/10 rounded-full overflow-hidden">
                      <div className="h-full bg-ghibli-moss w-[87%]" />
                    </div>
                    <p className="text-[10px] text-ghibli-bark font-serif italic text-center">Trending towards a Distinction</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing - simplified and premium */}
      <section className="relative z-10 py-24 px-6 bg-ghibli-mist/30">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold font-serif text-ghibli-canopy mb-4">A simple garden gate.</h2>
          <p className="text-ghibli-bark font-serif opacity-80">Start free, upgrade for the full experience.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Starter */}
          <div className="parchment-solid rounded-4xl p-8 border border-ghibli-moss/10 flex flex-col hover:translate-y-[-4px] transition-transform duration-500">
            <h3 className="text-xl font-bold font-serif text-ghibli-canopy mb-1">Starter</h3>
            <p className="text-4xl font-bold font-serif text-ghibli-canopy mb-6">Free</p>
            <ul className="space-y-4 mb-8 flex-1">
              {["Unlimited courses", "AI quizzes from your notes", "Pass probability tracking"].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-ghibli-bark font-serif">
                  <span className="text-ghibli-moss">✓</span> {item}
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="w-full h-12 rounded-leaf border-ghibli-moss/30 text-ghibli-canopy font-serif"><Link to="/signup">Get Started</Link></Button>
          </div>

          {/* Pro */}
          <div className="parchment-solid rounded-4xl p-8 border-2 border-ghibli-gold shadow-glow-soft flex flex-col relative hover:translate-y-[-4px] transition-transform duration-500">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-ghibli-gold text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">Recommended</div>
            <h3 className="text-xl font-bold font-serif text-ghibli-canopy mb-1">Pass Pro</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold font-serif text-ghibli-canopy">$79</span>
              <span className="text-ghibli-bark font-serif opacity-60">/year</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {["Everything in Starter", "Knowledge Garden — visualize mastery", "Smart Study Plan — AI-tailored to your exam", "Priority AI generation"].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-ghibli-bark font-serif">
                  <span className="text-ghibli-gold">✦</span> {item}
                </li>
              ))}
            </ul>
            <Button asChild className="w-full h-12 rounded-leaf bg-ghibli-canopy hover:bg-ghibli-forest text-white shadow-sm font-serif"><Link to="/signup">Begin 7-Day Trial</Link></Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <footer className="relative z-10 py-24 px-6 border-t border-ghibli-moss/10 text-center">
        <div className="max-w-2xl mx-auto space-y-8">
          <img src="/cat-pawprint.png" className="w-12 h-12 mx-auto opacity-30" alt="" />
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-ghibli-canopy">Ready to start tending?</h2>
          <p className="text-ghibli-bark font-serif opacity-80 italic">Your notes. Your garden. Your peace of mind.</p>
          <Button asChild size="lg" className="h-14 px-12 text-lg bg-ghibli-canopy hover:bg-ghibli-forest text-white shadow-glow transition-all duration-300 font-serif rounded-leaf">
            <Link to="/signup">Create your free account</Link>
          </Button>
          
          <div className="pt-12 flex flex-wrap justify-center gap-x-8 gap-y-4 text-[10px] text-ghibli-bark/60 font-serif uppercase tracking-widest">
            <Link to="/terms" className="hover:text-ghibli-canopy">Terms</Link>
            <Link to="/privacy" className="hover:text-ghibli-canopy">Privacy</Link>
            <span>© 2026 Shryn, Inc.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}


