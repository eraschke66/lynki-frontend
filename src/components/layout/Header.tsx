import { useAuth } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { useNavigate, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import LogoSvg from "@/assets/logo.svg?react";
import { Home, FileText, Settings, Volume2, VolumeOff, Sparkles } from "lucide-react";
import { useAmbientMusic } from "@/hooks/useAmbientMusic";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { playing, toggle: toggleMusic } = useAmbientMusic();
  const { isPremium, isLoading: subLoading } = useSubscription();

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const handleLogoClick = () => {
    if (user) {
      navigate("/home");
    } else {
      navigate("/");
    }
  };

  const pillClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-2 px-5 py-2 rounded-full text-sm font-sans font-medium transition-all",
      isActive
        ? "bg-gradient-to-b from-ghibli-jungle to-ghibli-canopy text-primary-foreground shadow-md"
        : "text-ghibli-canopy/70 hover:text-ghibli-canopy hover:bg-ghibli-ivory/60",
    );

  return (
    <header className="relative z-40 max-w-6xl mx-auto px-6 pt-6 md:pt-8">
      <nav className="flex items-center justify-between gap-4">
        {/* Logo block */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={handleLogoClick}
        >
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-ghibli-sunlight/40 blur-xl rounded-full" />
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-ghibli-jungle to-ghibli-canopy flex items-center justify-center shadow-md overflow-hidden">
              <LogoSvg className="w-7 h-7 text-ghibli-sunlight" />
            </div>
          </div>
          <div className="leading-none">
            <h1 className="font-serif text-2xl md:text-[1.75rem] font-semibold text-ghibli-canopy tracking-tight">
              Pass<span className="italic text-ghibli-forest">AI</span>
            </h1>
            <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-ghibli-moss/80">
              a quiet study garden
            </span>
          </div>
        </div>

        {/* Cream pill nav */}
        {user && (
          <div className="hidden md:flex items-center gap-1 p-1.5 rounded-full glass-cream botanical-border shadow-parchment">
            <NavLink to="/home" className={pillClass} end>
              <Home className="w-4 h-4" />
              Home
            </NavLink>
            <NavLink to="/documents" className={pillClass}>
              <FileText className="w-4 h-4" />
              Materials
            </NavLink>
            <NavLink to="/settings" className={pillClass}>
              <Settings className="w-4 h-4" />
              Settings
            </NavLink>
          </div>
        )}

        {/* Right cluster */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMusic}
            aria-label={playing ? "Pause ambient music" : "Play ambient music"}
            title={playing ? "Pause ambient music" : "Play ambient music"}
            className="p-2 rounded-full text-ghibli-canopy/70 hover:text-ghibli-forest hover:bg-ghibli-ivory/60 transition-colors"
          >
            {playing ? <Volume2 className="w-4 h-4" /> : <VolumeOff className="w-4 h-4" />}
          </button>
          {user && (
            <>
              {!subLoading && !isPremium && (
                <Button
                  size="sm"
                  onClick={() => navigate("/pricing")}
                  className="gap-1.5 rounded-full px-4 font-semibold bg-gradient-to-b from-ghibli-jungle to-ghibli-canopy hover:from-ghibli-forest hover:to-ghibli-canopy text-primary-foreground shadow-md hover:shadow-glow transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Upgrade
                </Button>
              )}
              {!subLoading && isPremium && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-ghibli-gold/15 text-ghibli-bark">
                  <Sparkles className="w-3 h-3" />
                  Premium
                </span>
              )}
              <p className="text-xs font-sans text-ghibli-canopy/70 hidden lg:block max-w-[12rem] truncate">
                {user.email}
              </p>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="rounded-full border-ghibli-moss/40 text-ghibli-canopy hover:border-ghibli-forest hover:text-ghibli-forest hover:bg-ghibli-ivory/60 transition-colors"
              >
                Log Out
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
