import { Link, useLocation } from "react-router-dom";
import { useCookieConsent } from "@/hooks/useCookieConsent";

export function Footer() {
  const { clearConsent } = useCookieConsent();
  const { pathname } = useLocation();

  // Hide footer on quiz pages so legal links don't compete with questions for attention.
  // Routes: /test/:courseId  and  /course/:courseId/topic-quiz/:topicId
  const isQuizPage =
    /^\/test\/[^/]+$/.test(pathname) ||
    /^\/course\/[^/]+\/topic-quiz\/[^/]+$/.test(pathname);

  if (isQuizPage) {
    return null;
  }

  return (
    <footer
      className="relative z-40 mt-auto w-full"
      style={{
        background: "transparent",
        borderTop: "1px solid hsl(140 25% 60% / 0.15)",
        borderRadius: "0",
      }}
    >
      <div
        className="max-w-5xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ textShadow: "0 1px 2px hsl(48 80% 97% / 0.7)" }}
      >

        {/* Left: wordmark + copyright */}
        <div className="flex flex-col items-center sm:items-start gap-0.5">
          <span className="text-sm font-bold tracking-tight text-ghibli-canopy">
            PassAI
          </span>
          <span className="text-xs text-ghibli-bark">
            © 2026 Shryn, Inc.
          </span>
        </div>

        {/* Right: legal links */}
        <nav
          aria-label="Legal links"
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs text-ghibli-bark"
        >
          <Link
            to="/privacy"
            className="hover:text-ghibli-jungle transition-colors"
          >
            Privacy Policy
          </Link>
          <span aria-hidden className="opacity-40">·</span>
          <Link
            to="/terms"
            className="hover:text-ghibli-jungle transition-colors"
          >
            Terms of Service
          </Link>
          <span aria-hidden className="opacity-40">·</span>
          <Link
            to="/cookies"
            className="hover:text-ghibli-jungle transition-colors"
          >
            Cookie Policy
          </Link>
          <span aria-hidden className="opacity-40">·</span>
          <a
            href="mailto:passai.study@gmail.com"
            className="hover:text-ghibli-jungle transition-colors"
          >
            Contact
          </a>
          <span aria-hidden className="opacity-40">·</span>
          <button
            onClick={clearConsent}
            className="hover:text-ghibli-jungle transition-colors underline-offset-2 hover:underline cursor-pointer"
          >
            Cookie Settings
          </button>
        </nav>
      </div>
    </footer>
  );
}
