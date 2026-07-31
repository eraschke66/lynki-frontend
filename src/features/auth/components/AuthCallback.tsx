import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

/**
 * Landing page for every auth redirect (Google OAuth, email confirmation).
 *
 * The client detects the ?code= in the URL and exchanges it for a session
 * before this component mounts, so we cannot rely on catching SIGNED_IN alone:
 * a subscriber that registers after the exchange has already fired misses it.
 * auth-js emits INITIAL_SESSION to every new subscriber once initialisation
 * (including the code exchange) has settled, so that event is the reliable
 * signal — it carries the session on success and null on failure.
 */
export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/home", { replace: true });
        return;
      }
      // Initialisation finished with no session: the code exchange failed
      // (expired link, or the link was opened in a different browser from the
      // one that started the flow, which has the PKCE verifier). Don't spin.
      if (event === "INITIAL_SESSION") {
        navigate("/login?error=auth_callback", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-ghibli-bark">Verifying your account...</p>
      </div>
    </div>
  );
}
