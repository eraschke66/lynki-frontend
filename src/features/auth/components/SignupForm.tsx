import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "../hooks/useAuth";

import { Eye, EyeOff } from "lucide-react";

const signupSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
    ageConfirmed: z.literal(true, {
      message: "You must confirm you are at least 13 years old",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupForm() {
  const navigate = useNavigate();
  const { signUp, resendVerificationEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string>("");
  const [resendingEmail, setResendingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      setLoading(true);
      setError(null);
      const { error: signUpError, session } = await signUp({
        email: data.email,
        password: data.password,
      });
      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setError("This email is already registered. Please sign in instead.");
        } else {
          setError(signUpError.message);
        }
        return;
      }
      if (session) {
        navigate("/home");
        return;
      }
      setRegisteredEmail(data.email);
      setSuccess(true);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      setResendingEmail(true);
      setError(null);
      const { error: resendError } = await resendVerificationEmail(registeredEmail);
      if (resendError) {
        setError("Failed to resend verification email. Please try again.");
      } else {
        setError("Verification email resent! Please check your inbox.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setResendingEmail(false);
    }
  };

  // Shared scene background
  const Background = () => (
    <>
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/garden-login-bg.jpg)" }}
      />
      <div
        className="fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, hsl(45 85% 70% / 0.2) 0%, transparent 60%), linear-gradient(to bottom, hsl(45 60% 50% / 0.08), hsl(33 30% 20% / 0.25))",
        }}
      />
      <div className="fixed inset-0 mist-overlay pointer-events-none" />
      <img
        src="/foliage-left.png"
        alt=""
        className="fixed left-0 bottom-0 w-72 lg:w-96 pointer-events-none z-20 animate-drift select-none"
        style={{ filter: "drop-shadow(4px 0 15px hsl(var(--ghibli-canopy) / 0.3))" }}
      />
      <img
        src="/foliage-right.png"
        alt=""
        className="fixed right-0 top-0 w-64 lg:w-80 pointer-events-none z-20 animate-drift select-none"
        style={{ animationDelay: "3s", filter: "drop-shadow(-4px 0 15px hsl(var(--ghibli-canopy) / 0.3))" }}
      />
      <div className="fixed top-16 left-1/3 w-48 h-48 rounded-full bg-ghibli-sunlight/15 blur-3xl animate-shimmer pointer-events-none" />
      <div
        className="fixed bottom-32 right-1/4 w-40 h-40 rounded-full bg-ghibli-sunlight/10 blur-3xl animate-shimmer pointer-events-none"
        style={{ animationDelay: "2.5s" }}
      />
    </>
  );

  // Shared wooden notice board frame
  const WoodenFrame = ({ children }: { children: React.ReactNode }) => (
    <div className="relative z-10 w-full max-w-md mx-4 sm:mx-auto">
      <div
        className="rounded-[1.5rem] p-[10px]"
        style={{
          background: "linear-gradient(145deg, hsl(30 35% 38%), hsl(25 30% 28%))",
          boxShadow:
            "0 12px 40px -8px hsl(30 30% 15% / 0.5), inset 0 1px 0 hsl(35 40% 50% / 0.3), inset 0 -1px 0 hsl(25 25% 18% / 0.5)",
        }}
      >
        <div
          className="absolute inset-0 rounded-[1.5rem] opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent, transparent 8px, hsl(30 20% 60% / 0.3) 8px, hsl(30 20% 60% / 0.3) 9px)",
          }}
        />
        <div className="relative parchment-solid rounded-[1.1rem] p-8">
          <div className="relative z-10">{children}</div>
        </div>
      </div>
    </div>
  );

  if (success) {
    const isResent = error?.includes("resent");
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
        <Background />
        <WoodenFrame>
          <div className="text-center">
            <img
              src="/plant-stage-1.png"
              alt=""
              className="w-16 h-16 object-contain mx-auto mb-3 animate-pulse-soft"
              style={{ mixBlendMode: "darken" }}
            />
            <h1 className="font-serif text-2xl font-semibold text-ghibli-canopy mb-2">
              Your seed has been planted
            </h1>
            <p className="font-sans text-sm text-ghibli-bark mb-2">
              We sent a verification link to{" "}
              <strong className="text-ghibli-forest">{registeredEmail}</strong>
            </p>
            <p className="font-sans text-xs text-ghibli-bark italic mb-6">
              Click the link in the email to begin tending your garden.
            </p>
            {error && (
              <div
                className={`mb-4 p-3 rounded-parchment border text-sm font-sans ${
                  isResent
                    ? "bg-ghibli-moss/10 border-ghibli-moss/30 text-ghibli-canopy"
                    : "bg-destructive/10 border-destructive/20 text-destructive"
                }`}
              >
                {error}
              </div>
            )}
            <button
              onClick={handleResendEmail}
              disabled={resendingEmail}
              className="w-full rounded-parchment border-2 border-ghibli-moss/30 bg-ghibli-ivory py-3 mb-3 font-sans font-medium text-sm text-ghibli-canopy transition-all duration-300 hover:border-ghibli-forest hover:shadow-glow disabled:opacity-50"
            >
              {resendingEmail ? "Sending..." : "Resend Verification Email"}
            </button>
            <Link
              to="/login"
              className="font-sans text-sm text-primary font-semibold hover:underline"
            >
              Back to the garden gate
            </Link>
          </div>
        </WoodenFrame>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-8">
      <Background />
      <WoodenFrame>
        <div className="text-center mb-6">
          <h1 className="font-serif text-2xl font-semibold text-ghibli-canopy mb-1">
            Plant your first seed
          </h1>
          <p className="font-sans text-sm text-ghibli-bark">
            Your knowledge garden awaits 🌿
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 text-sm rounded-parchment bg-destructive/10 text-destructive border border-destructive/20 font-sans">
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="font-sans text-xs font-medium text-ghibli-bark mb-1.5 block">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="gardener@passai.app"
              {...register("email")}
              disabled={loading}
              className="w-full rounded-parchment border-2 border-ghibli-moss/30 bg-ghibli-ivory px-4 py-3 font-sans text-sm text-ghibli-canopy placeholder:text-ghibli-bark/60 outline-none transition-all duration-300 focus:border-primary focus:shadow-glow disabled:opacity-50"
            />
            {errors.email && (
              <p className="font-sans text-xs text-destructive mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="font-sans text-xs font-medium text-ghibli-bark mb-1.5 block">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                {...register("password")}
                disabled={loading}
                className="w-full rounded-parchment border-2 border-ghibli-moss/30 bg-ghibli-ivory px-4 py-3 pr-10 font-sans text-sm text-ghibli-canopy placeholder:text-ghibli-bark/60 outline-none transition-all duration-300 focus:border-primary focus:shadow-glow disabled:opacity-50"
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
              <p className="font-sans text-xs text-destructive mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="font-sans text-xs font-medium text-ghibli-bark mb-1.5 block">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                disabled={loading}
                className="w-full rounded-parchment border-2 border-ghibli-moss/30 bg-ghibli-ivory px-4 py-3 pr-10 font-sans text-sm text-ghibli-canopy placeholder:text-ghibli-bark/60 outline-none transition-all duration-300 focus:border-primary focus:shadow-glow disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ghibli-bark hover:text-ghibli-canopy transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="font-sans text-xs text-destructive mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Age confirmation */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ageConfirmed" className="flex items-start gap-2.5 cursor-pointer">
              <input
                id="ageConfirmed"
                type="checkbox"
                {...register("ageConfirmed")}
                disabled={loading}
                className="mt-0.5 w-4 h-4 accent-primary cursor-pointer"
              />
              <span className="font-sans text-xs text-ghibli-bark leading-snug">
                I confirm that I am at least 13 years old
              </span>
            </label>
            {errors.ageConfirmed && (
              <p className="font-sans text-xs text-destructive ml-6">
                {errors.ageConfirmed.message}
              </p>
            )}
            <p className="font-sans text-[11px] text-ghibli-bark text-center leading-relaxed mt-1">
              By signing up, you agree to our{" "}
              <Link to="/terms" className="text-primary font-semibold hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-primary font-semibold hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-parchment bg-primary text-primary-foreground py-3 font-sans font-semibold text-sm tracking-wide transition-all duration-300 hover:shadow-glow hover:brightness-110 relative overflow-hidden disabled:opacity-50"
          >
            <span className="relative z-10">
              {loading ? "Planting your seed..." : "🌿 Begin your journey"}
            </span>
            <div
              className="absolute inset-0 opacity-[0.07] pointer-events-none"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M30 5 Q40 15 35 30 Q30 20 25 30 Q20 15 30 5Z' fill='%23fff' opacity='0.5'/%3E%3C/svg%3E\")",
              }}
            />
          </button>

          {/* Sign in link */}
          <p className="text-center font-sans text-xs text-ghibli-bark mt-1">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Return to the garden
            </Link>
          </p>
        </form>

        {/* Cat paw print */}
        <div className="flex justify-center mt-4">
          <img
            src="/cat-pawprint.png"
            alt=""
            className="w-8 h-8 object-contain opacity-40 select-none"
          />
        </div>
      </WoodenFrame>
    </div>
  );
}
