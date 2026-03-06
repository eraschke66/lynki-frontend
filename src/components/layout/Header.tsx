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
      "flex items-center gap-2 text-sm font-medium transition-all duration-150 px-3 py-2 rounded-md",
      isActive
        ? "text-[#1B4332] bg-[rgba(64,145,108,0.08)] border-l-2 border-[#40916C] pl-[calc(0.75rem-2px)]"
        : "text-muted-foreground hover:text-[#2D6A4F] hover:bg-[rgba(64,145,108,0.05)]",
    );

  return (
    <header
      className="sticky top-0 left-0 right-0 z-50 backdrop-blur-sm border-b"
      style={{
        background: "rgba(250, 243, 224, 0.88)",
        borderBottomColor: "rgba(64, 145, 108, 0.2)",
        borderBottomWidth: "1px",
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(64,145,108,0.4), rgba(13,115,119,0.5), rgba(64,145,108,0.4), transparent)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={handleLogoClick}
          >
            <div className="w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 group-hover:shadow-[0_0_0_2px_rgba(64,145,108,0.3)]">
              <LogoSvg className="w-full h-full" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">PassAI</h1>
              <p className="text-[10px] text-[#40916C] font-medium leading-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 -mt-0.5">
                your garden of knowledge
              </p>
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
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-[rgba(64,145,108,0.3)] hover:border-[#40916C] hover:text-[#1B4332] hover:bg-[rgba(64,145,108,0.05)] transition-colors"
              >
                Log Out
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
