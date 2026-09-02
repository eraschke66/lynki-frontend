import { Link } from "react-router-dom";

export function LandingFooter() {
  return (
    <footer className="relative z-10 py-12 px-6 border-t border-ghibli-moss/10 text-center">
      <div className="max-w-2xl mx-auto space-y-4">
        <p className="text-xs text-ghibli-bark font-sans italic">
          Built for students preparing for the exam they actually have.
        </p>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[10px] text-ghibli-bark font-serif uppercase tracking-widest">
          <Link to="/terms" className="hover:text-ghibli-canopy">Terms</Link>
          <Link to="/privacy" className="hover:text-ghibli-canopy">Privacy</Link>
          <Link to="/cookies" className="hover:text-ghibli-canopy">Cookies</Link>
          <span>© 2026 Shryn, Inc.</span>
        </div>
      </div>
    </footer>
  );
}
