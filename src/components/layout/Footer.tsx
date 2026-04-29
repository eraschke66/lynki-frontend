import { Link } from "react-router-dom";
import { useCookieConsent } from "@/hooks/useCookieConsent";

export function Footer() {
  const { clearConsent } = useCookieConsent();

  return (
    <footer
      className="relative z-50 mt-auto w-full"
      style={{
        background: "rgba(250, 243, 224, 0.95)",
        borderTop: "1px solid rgba(64, 145, 108, 0.2)",
      }}
    >
      <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">

        {/* Left: wordmark + copyright */}
        <div className="flex flex-col items-center sm:items-start gap-0.5">
          <span
            className="text-sm font-bold tracking-tight"
            style={{ color: "#0D7377" }}
          >
            PassAI
          </span>
          <span className="text-xs text-muted-foreground">
            © 2026 Shryn, Inc.
          </span>
        </div>

        {/* Right: legal links */}
        <nav
          aria-label="Legal links"
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground"
        >
          <Link
            to="/privacy"
            className="hover:text-[#2D6A4F] transition-colors"
          >
            Privacy Policy
          </Link>
          <span aria-hidden className="opacity-40">·</span>
          <Link
            to="/terms"
            className="hover:text-[#2D6A4F] transition-colors"
          >
            Terms of Service
          </Link>
          <span aria-hidden className="opacity-40">·</span>
          <Link
            to="/cookies"
            className="hover:text-[#2D6A4F] transition-colors"
          >
            Cookie Policy
          </Link>
          <span aria-hidden className="opacity-40">·</span>
          <a
            href="mailto:passai.study@gmail.com"
            className="hover:text-[#2D6A4F] transition-colors"
          >
            Contact
          </a>
          <span aria-hidden className="opacity-40">·</span>
          <button
            onClick={clearConsent}
            className="hover:text-[#2D6A4F] transition-colors underline-offset-2 hover:underline cursor-pointer"
          >
            Cookie Settings
          </button>
        </nav>
      </div>
    </footer>
  );
}
