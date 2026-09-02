import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function LandingNav() {
  return (
    <nav className="fixed top-0 w-full z-50 glass-cream border-b border-ghibli-moss/15">
      <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-ghibli-canopy tracking-tight font-serif">PassAI</span>
          <span className="hidden sm:inline bg-ghibli-moss/10 text-ghibli-canopy text-[10px] font-bold px-2 py-0.5 rounded-full border border-ghibli-moss/20 uppercase tracking-widest">
            Beta
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-1 text-sm font-serif text-ghibli-canopy">
          <a href="#how-it-works" className="px-3 py-2 rounded-full hover:text-ghibli-canopy hover:bg-ghibli-moss/5 transition-colors">How It Works</a>
          <a href="#knowledge-garden" className="px-3 py-2 rounded-full hover:text-ghibli-canopy hover:bg-ghibli-moss/5 transition-colors">Knowledge Garden</a>
          <Link to="/pricing" className="px-3 py-2 rounded-full hover:text-ghibli-canopy hover:bg-ghibli-moss/5 transition-colors">Pricing</Link>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <Button asChild variant="ghost" className="text-ghibli-canopy hover:bg-ghibli-moss/5 font-serif">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild className="bg-ghibli-canopy hover:bg-ghibli-forest text-white shadow-md transition-all duration-300 font-serif rounded-full px-4 md:px-5">
            <Link to="/signup">Start Free Trial</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
