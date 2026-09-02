import { useAuth } from "../hooks/AuthContext";
import { humanAuthMessage } from "../authErrors";

interface GoogleSignInButtonProps {
  label: string;
  onError: (message: string) => void;
}

/** The Google auth entry point shared by login and signup — same handler, same 4-petal mark. */
export function GoogleSignInButton({ label, onError }: GoogleSignInButtonProps) {
  const { signInWithGoogle } = useAuth();

  const handleClick = async () => {
    const { error } = await signInWithGoogle();
    if (error) onError(humanAuthMessage(error));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full rounded-parchment border-2 border-ghibli-moss/45 bg-ghibli-ivory/85 py-3 font-sans font-medium text-sm text-ghibli-canopy transition-all duration-300 hover:border-ghibli-amber/50 hover:shadow-glow flex items-center justify-center gap-2"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" className="shrink-0">
        <circle cx="9" cy="9" r="3" fill="hsl(var(--ghibli-amber))" />
        <ellipse cx="9" cy="3" rx="2.5" ry="3" fill="hsl(0 65% 55%)" opacity="0.85" />
        <ellipse cx="15" cy="9" rx="3" ry="2.5" fill="hsl(45 80% 55%)" opacity="0.85" />
        <ellipse cx="9" cy="15" rx="2.5" ry="3" fill="hsl(140 45% 40%)" opacity="0.85" />
        <ellipse cx="3" cy="9" rx="3" ry="2.5" fill="hsl(210 55% 50%)" opacity="0.85" />
      </svg>
      {label}
    </button>
  );
}
