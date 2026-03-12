import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "../hooks/useAuth";
import { Neko } from "@/components/garden/Neko";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      setError(null);
      const { error: signInError } = await signIn(data);
      if (signInError) {
        if (signInError.message.includes("Email not confirmed")) {
          setError("Please verify your email before logging in. Check your inbox for the verification link.");
        } else if (signInError.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please try again.");
        } else {
          setError(signInError.message);
        }
        return;
      }
      navigate("/home");
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        // Layered forest gradient — warm amber center, forest green mist at edges
        background: `
          radial-gradient(ellipse at 15% 10%, rgba(27,67,50,0.35) 0%, transparent 45%),
          radial-gradient(ellipse at 85% 5%, rgba(45,106,79,0.28) 0%, transparent 40%),
          radial-gradient(ellipse at 10% 90%, rgba(64,145,108,0.22) 0%, transparent 40%),
          radial-gradient(ellipse at 90% 85%, rgba(27,67,50,0.25) 0%, transparent 40%),
          radial-gradient(ellipse at 50% 40%, rgba(212,160,23,0.18) 0%, rgba(250,243,224,0.9) 55%, transparent 80%),
          linear-gradient(160deg, #2a4a2e 0%, #3d6b3a 15%, #c8d89a 35%, #FAF3E0 55%, #f0d890 75%, #d4950a 95%)
        `,
      }}
    >
      {/* Left vine edge */}
      <div
        className="absolute left-0 top-0 bottom-0 pointer-events-none"
        style={{
          width: 90,
          backgroundImage: "url(/vine-border.png)",
          backgroundRepeat: "repeat-y",
          backgroundSize: "90px auto",
          opacity: 0.85,
          mixBlendMode: "multiply",
        }}
      />
      {/* Right vine edge */}
      <div
        className="absolute right-0 top-0 bottom-0 pointer-events-none"
        style={{
          width: 90,
          backgroundImage: "url(/vine-border.png)",
          backgroundRepeat: "repeat-y",
          backgroundSize: "90px auto",
          opacity: 0.75,
          mixBlendMode: "multiply",
          transform: "scaleX(-1)",
        }}
      />

      {/* Dappled light circles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          { x: "20%", y: "15%", r: 80, o: 0.12 },
          { x: "75%", y: "25%", r: 60, o: 0.09 },
          { x: "45%", y: "70%", r: 100, o: 0.08 },
          { x: "10%", y: "60%", r: 50, o: 0.1 },
        ].map((d, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: d.x,
              top: d.y,
              width: d.r * 2,
              height: d.r * 2,
              marginLeft: -d.r,
              marginTop: -d.r,
              background: `radial-gradient(circle, rgba(255,220,100,${d.o}) 0%, transparent 70%)`,
            }}
          />
        ))}
      </div>

      {/* Sleeping cat — peek from bottom-left behind foliage */}
      <Neko placement="bottom-left" width={130} />

      {/* Login card — wooden notice board / parchment */}
      <div className="relative z-10 w-full max-w-md mx-4 sm:mx-auto">
        <div
          style={{
            // Wooden frame outer
            background: "linear-gradient(145deg, #7a5c3a 0%, #5c3d1e 30%, #6b4c28 60%, #8a6a42 100%)",
            borderRadius: 20,
            padding: 6,
            boxShadow: "0 20px 60px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.2)",
          }}
        >
          {/* Inner parchment */}
          <div
            style={{
              background: "linear-gradient(160deg, #FEFAE0 0%, #FDF5D0 40%, #FAF0C0 100%)",
              borderRadius: 15,
              padding: "36px 32px 28px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Subtle paper grain texture overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
                pointerEvents: "none",
                opacity: 0.6,
              }}
            />

            {/* Heading */}
            <div className="text-center mb-7">
              <h1
                style={{
                  fontFamily: "'Lora', Georgia, serif",
                  fontSize: 26,
                  fontWeight: 600,
                  color: "#1B4332",
                  lineHeight: 1.3,
                  marginBottom: 6,
                }}
              >
                Welcome back to your garden
              </h1>
              <p style={{ color: "#5a7a5a", fontSize: 14 }}>
                Your knowledge awaits
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                className="mb-4 p-3 text-sm rounded-xl"
                style={{
                  background: "rgba(180,60,40,0.08)",
                  border: "1px solid rgba(180,60,40,0.2)",
                  color: "#8B2500",
                }}
              >
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  style={{ fontSize: 13, fontWeight: 500, color: "#3a5a3a", display: "block" }}
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="gardener@passai.app"
                  {...register("email")}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1.5px solid rgba(64,145,108,0.35)",
                    background: "rgba(255,255,255,0.7)",
                    color: "#1B4332",
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(27,67,50,0.6)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(64,145,108,0.35)"; }}
                />
                {errors.email && (
                  <p style={{ fontSize: 12, color: "#8B2500" }}>{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="password"
                    style={{ fontSize: 13, fontWeight: 500, color: "#3a5a3a" }}
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    style={{ fontSize: 12, color: "#40916C", textDecoration: "none" }}
                  >
                    Forgot your path?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1.5px solid rgba(64,145,108,0.35)",
                    background: "rgba(255,255,255,0.7)",
                    color: "#1B4332",
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(27,67,50,0.6)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(64,145,108,0.35)"; }}
                />
                {errors.password && (
                  <p style={{ fontSize: 12, color: "#8B2500" }}>{errors.password.message}</p>
                )}
              </div>

              {/* Enter the Garden button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: 4,
                  background: loading
                    ? "rgba(27,67,50,0.5)"
                    : "linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)",
                  color: "#FEFAE0",
                  border: "none",
                  borderRadius: 11,
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: "'Nunito', sans-serif",
                  cursor: loading ? "not-allowed" : "pointer",
                  letterSpacing: "0.01em",
                  boxShadow: "0 4px 16px rgba(27,67,50,0.3)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    (e.target as HTMLButtonElement).style.transform = "translateY(-1px)";
                    (e.target as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(27,67,50,0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.transform = "";
                  (e.target as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(27,67,50,0.3)";
                }}
              >
                {loading ? "Opening the gate..." : "Enter the Garden"}
              </button>

              {/* Divider */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  margin: "4px 0",
                }}
              >
                <div style={{ flex: 1, height: 1, background: "rgba(64,145,108,0.2)" }} />
                <span style={{ fontSize: 12, color: "#7a9a7a" }}>or continue with</span>
                <div style={{ flex: 1, height: 1, background: "rgba(64,145,108,0.2)" }} />
              </div>

              {/* Google sign-in */}
              <button
                type="button"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "rgba(255,255,255,0.65)",
                  border: "1.5px solid rgba(64,145,108,0.25)",
                  borderRadius: 11,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#2D4A2D",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  fontFamily: "'Nunito', sans-serif",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.9)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(64,145,108,0.4)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.65)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(64,145,108,0.25)";
                }}
              >
                {/* Four-petal flower icon instead of Google G */}
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <ellipse cx="9" cy="5" rx="3.5" ry="5" fill="#4285F4" opacity="0.85" />
                  <ellipse cx="9" cy="13" rx="3.5" ry="5" fill="#34A853" opacity="0.85" />
                  <ellipse cx="5" cy="9" rx="5" ry="3.5" fill="#EA4335" opacity="0.85" />
                  <ellipse cx="13" cy="9" rx="5" ry="3.5" fill="#FBBC05" opacity="0.85" />
                  <circle cx="9" cy="9" r="2.5" fill="white" />
                </svg>
                Continue with Google
              </button>

              {/* Sign up link */}
              <p style={{ textAlign: "center", fontSize: 13, color: "#7a9a7a", marginTop: 4 }}>
                New to the garden?{" "}
                <Link
                  to="/signup"
                  style={{ color: "#2D6A4F", fontWeight: 600, textDecoration: "none" }}
                >
                  Plant your first seed
                </Link>
              </p>
            </form>

            {/* Cat paw print at bottom */}
            <div style={{ textAlign: "center", marginTop: 16, opacity: 0.3 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#40916C">
                <ellipse cx="12" cy="16" rx="5" ry="4" />
                <ellipse cx="6" cy="11" rx="2.5" ry="2" />
                <ellipse cx="18" cy="11" rx="2.5" ry="2" />
                <ellipse cx="9" cy="8.5" rx="2" ry="1.8" />
                <ellipse cx="15" cy="8.5" rx="2" ry="1.8" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
