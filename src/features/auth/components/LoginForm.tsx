import { reportError } from "@/lib/sentry";
import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "../hooks/AuthContext";
import { humanAuthMessage } from "../authErrors";

import { Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Login form component with email/password authentication.
 * Ghibli garden visual layer — wooden frame card on garden background.
 */
export function LoginForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  // AuthCallback sends users here when the code exchange fails, rather than
  // leaving them on a spinner with no explanation.
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "auth_callback"
      ? "We couldn't finish signing you in. Please try again."
      : null,
  );
  const [showPassword, setShowPassword] = useState(false);

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
        setError(humanAuthMessage(signInError));
        return;
      }
      navigate("/home");
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      reportError("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/garden-login-bg.jpg)" }}
      />

      {/* Golden hour overlay */}
      <div
        className="fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, hsl(45 85% 70% / 0.2) 0%, transparent 60%), linear-gradient(to bottom, hsl(45 60% 50% / 0.08), hsl(33 30% 20% / 0.25))",
        }}
      />

      {/* Mist edges */}
      <div className="fixed inset-0 mist-overlay pointer-events-none" />

      {/* Foliage */}
      <img
        src="/foliage-left.png"
        alt=""
        className="fixed left-0 bottom-0 w-72 lg:w-96 pointer-events-none z-20 animate-drift select-none"
        style={{
          filter: "drop-shadow(4px 0 15px hsl(var(--ghibli-canopy) / 0.3))",
        }}
      />
      <img
        src="/foliage-right.png"
        alt=""
        className="fixed right-0 top-0 w-64 lg:w-80 pointer-events-none z-20 animate-drift select-none"
        style={{
          animationDelay: "3s",
          filter: "drop-shadow(-4px 0 15px hsl(var(--ghibli-canopy) / 0.3))",
        }}
      />

      {/* Dappled light */}
      <div className="fixed top-16 left-1/3 w-48 h-48 rounded-full bg-ghibli-sunlight/15 blur-3xl animate-shimmer pointer-events-none" />
      <div
        className="fixed bottom-32 right-1/4 w-40 h-40 rounded-full bg-ghibli-sunlight/10 blur-3xl animate-shimmer pointer-events-none"
        style={{ animationDelay: "2.5s" }}
      />

      {/* Login card — wooden notice board */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Outer wood frame */}
        <div
          className="rounded-3xl p-[10px]"
          style={{
            background:
              "linear-gradient(145deg, hsl(30 35% 38%), hsl(25 30% 28%))",
            boxShadow:
              "0 12px 40px -8px hsl(30 30% 15% / 0.5), inset 0 1px 0 hsl(35 40% 50% / 0.3), inset 0 -1px 0 hsl(25 25% 18% / 0.5)",
          }}
        >
          {/* Wood grain texture line */}
          <div
            className="absolute inset-0 rounded-3xl opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, transparent, transparent 8px, hsl(30 20% 60% / 0.3) 8px, hsl(30 20% 60% / 0.3) 9px)",
            }}
          />

          {/* Inner parchment */}
          <div className="relative parchment-solid rounded-[1.1rem] p-8">
            <div className="relative z-10">
              {/* Heading */}
              <div className="text-center mb-6">
                <h1 className="font-serif text-2xl font-bold text-primary mb-1">
                  Welcome back to your garden
                </h1>
                <p className="font-sans text-sm text-ghibli-bark">
                  Your knowledge awaits
                </p>
              </div>

              {/* Form */}
              <div className="flex flex-col gap-4">
                {/* Google sign-in — organic 4-petal style */}
                <button
                  type="button"
                  onClick={async () => {
                    const { error: gError } = await signInWithGoogle();
                    if (gError) setError(humanAuthMessage(gError));
                  }}
                  className="w-full rounded-parchment border-2 border-ghibli-moss/45 bg-ghibli-ivory/85 py-3 font-sans font-medium text-sm text-ghibli-canopy transition-all duration-300 hover:border-ghibli-amber/50 hover:shadow-glow flex items-center justify-center gap-2"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    className="shrink-0"
                  >
                    <circle
                      cx="9"
                      cy="9"
                      r="3"
                      fill="hsl(var(--ghibli-amber))"
                    />
                    <ellipse
                      cx="9"
                      cy="3"
                      rx="2.5"
                      ry="3"
                      fill="hsl(0 65% 55%)"
                      opacity="0.85"
                    />
                    <ellipse
                      cx="15"
                      cy="9"
                      rx="3"
                      ry="2.5"
                      fill="hsl(45 80% 55%)"
                      opacity="0.85"
                    />
                    <ellipse
                      cx="9"
                      cy="15"
                      rx="2.5"
                      ry="3"
                      fill="hsl(140 45% 40%)"
                      opacity="0.85"
                    />
                    <ellipse
                      cx="3"
                      cy="9"
                      rx="3"
                      ry="2.5"
                      fill="hsl(210 55% 50%)"
                      opacity="0.85"
                    />
                  </svg>
                  Continue with Google
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-ghibli-moss/30" />
                  <span className="font-sans text-[10px] uppercase tracking-widest text-ghibli-bark">
                    or email
                  </span>
                  <div className="flex-1 h-px bg-ghibli-moss/30" />
                </div>

                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="flex flex-col gap-4"
                >
                  {error && (
                    <div className="p-3 text-sm rounded-parchment bg-destructive/10 text-destructive border border-destructive/20">
                      {error}
                    </div>
                  )}

                  {/* Email */}
                  <div>
                    <label htmlFor="login-email" className="font-sans text-xs font-medium text-ghibli-bark mb-1.5 block">
                      Email
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="username"
                      placeholder="gardener@passai.app"
                      {...register("email")}
                      disabled={loading}
                      className="w-full rounded-parchment border-2 border-ghibli-moss/30 bg-ghibli-ivory px-4 py-3 font-sans text-sm text-ghibli-canopy placeholder:text-ghibli-bark outline-none transition-all duration-300 focus:border-primary focus:shadow-glow disabled:opacity-50"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-baseline justify-between mb-1.5">
                      <label htmlFor="login-password" className="font-sans text-xs font-medium text-ghibli-bark block">
                        Password
                      </label>
                      {/* There was no way out of a forgotten password at all —
                          no link, no route, no page. */}
                      <Link
                        to="/forgot-password"
                        className="font-sans text-xs text-ghibli-jungle hover:text-ghibli-canopy underline underline-offset-2"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        {...register("password")}
                        disabled={loading}
                        className="w-full rounded-parchment border-2 border-ghibli-moss/30 bg-ghibli-ivory px-4 py-3 pr-10 font-sans text-sm text-ghibli-canopy placeholder:text-ghibli-bark outline-none transition-all duration-300 focus:border-primary focus:shadow-glow disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ghibli-bark hover:text-ghibli-canopy transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-parchment bg-primary text-primary-foreground py-3 font-sans font-semibold text-sm tracking-wide transition-all duration-300 hover:shadow-glow hover:brightness-110 relative overflow-hidden disabled:opacity-50"
                  >
                    <span className="relative z-10">
                      {loading ? "Entering..." : "Enter the Garden"}
                    </span>
                    <div
                      className="absolute inset-0 opacity-[0.07] pointer-events-none"
                      style={{
                        backgroundImage:
                          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M30 5 Q40 15 35 30 Q30 20 25 30 Q20 15 30 5Z' fill='%23fff' opacity='0.5'/%3E%3C/svg%3E\")",
                      }}
                    />
                  </button>
                </form>
              </div>

              {/* Sign up link */}
              <p className="text-center font-sans text-xs text-ghibli-bark mt-5">
                New to the garden?{" "}
                <Link
                  to="/signup"
                  className="text-primary font-medium hover:underline"
                >
                  Plant your first seed
                </Link>
              </p>

              {/* Cat paw print */}
              <div className="flex justify-center mt-4">
                <img
                  src="/cat-pawprint.png"
                  alt="Cat paw print"
                  className="w-8 h-8 object-contain opacity-40 select-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
