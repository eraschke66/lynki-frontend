import { useAuth } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { useNavigate, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import LogoSvg from "@/assets/logo.svg?react";
import { Home, FileText, Settings } from "lucide-react";

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md",
      isActive ? "text-primary bg-primary/10" : "text-muted-foreground",
    );

  return (
    <header className="sticky top-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-b border-border z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={handleLogoClick}
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <LogoSvg className="w-full h-full" />
            </div>
            <div>
              <h1 className="text-xl font-bold">PassAI</h1>
            </div>
          </div>

          {user && (
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/home" className={navLinkClass} end>
                <Home className="w-4 h-4" />
                Home
              </NavLink>
              <NavLink to="/documents" className={navLinkClass}>
                <FileText className="w-4 h-4" />
                Materials
              </NavLink>
              <NavLink to="/settings" className={navLinkClass}>
                <Settings className="w-4 h-4" />
                Settings
              </NavLink>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {user.email}
              </p>
              <Button variant="outline" onClick={handleLogout}>
                Log Out
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
