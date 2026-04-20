import { Link } from "react-router-dom";
import { useCookieConsent } from "@/hooks/useCookieConsent";

interface LegalPageLayoutProps {
  children: React.ReactNode;
}

export function LegalPageLayout({ children }: LegalPageLayoutProps) {
  const { clearConsent } = useCookieConsent();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b border-border/30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary tracking-tight">
            PassAI
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to home
          </Link>
        </div>
      </nav>

      <main className="pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          {children}
        </div>
      </main>

      <footer className="py-6 px-6 border-t border-border/30">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <span aria-hidden>·</span>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          <span aria-hidden>·</span>
          <Link to="/cookies" className="hover:text-foreground transition-colors">Cookie Policy</Link>
          <span aria-hidden>·</span>
          <button
            onClick={clearConsent}
            className="hover:text-foreground transition-colors underline-offset-2 hover:underline cursor-pointer"
          >
            Cookie Settings
          </button>
          <span aria-hidden>·</span>
          <span>© 2026 Shryn, Inc.</span>
        </div>
      </footer>
    </div>
  );
}
