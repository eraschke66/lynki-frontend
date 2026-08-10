import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { updatePassword } from "../services/authService";
import { humanAuthMessage } from "../authErrors";
import { AuthScene, WoodenFrame } from "./AuthScene";

// Identical rules to signup. Two different password policies in one product is
// how a student ends up locked out by a rule they already satisfied once.
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

type LinkState = "checking" | "valid" | "invalid";

/**
 * Set a new password, reached from the emailed recovery link.
 *
 * Supabase's client picks the recovery session out of the URL and strips it, so
 * by the time this renders the only question is whether a session exists. The
 * PASSWORD_RECOVERY event is also handled, because the exchange can land just
 * after first paint.
 */
export function ResetPasswordForm() {
  const navigate = useNavigate();
  const [linkState, setLinkState] = useState<LinkState>("checking");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
    criteriaMode: "all",
  });

  useEffect(() => {
    let cancelled = false;

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY" || session) setLinkState("valid");
    });

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setLinkState(data.session ? "valid" : "invalid");
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const onSubmit = async (data: ResetPasswordData) => {
    setSaving(true);
    setError(null);
    try {
      const { error: updateError } = await updatePassword(data.password);
      if (updateError) {
        setError(humanAuthMessage(updateError));
        return;
      }
      setDone(true);
      // Straight in — they are already authenticated by the recovery session,
      // and sending them back to /login to type the password they just chose
      // is the kind of small indignity that loses people.
      setTimeout(() => navigate("/home"), 1800);
    } catch {
      setError("Something went wrong on our end. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const shell = (children: React.ReactNode) => (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      <AuthScene />
      <WoodenFrame>{children}</WoodenFrame>
    </div>
  );

  if (linkState === "checking") {
    return shell(
      <p className="text-center font-sans text-sm text-ghibli-bark py-6">
        Checking your link…
      </p>,
    );
  }

  if (linkState === "invalid") {
    return shell(
      <div className="text-center">
        <h1 className="font-serif text-2xl font-semibold text-ghibli-canopy mb-2">
          That link has wilted
        </h1>
        <p className="font-sans text-sm text-ghibli-bark mb-6">
          Reset links only last about an hour. Ask for a fresh one and it'll work.
        </p>
        <Link
          to="/forgot-password"
          className="inline-block rounded-parchment border-0 bg-gradient-to-br from-ghibli-jungle to-ghibli-canopy px-6 py-3 font-sans font-medium text-sm text-primary-foreground"
        >
          Send a new link
        </Link>
      </div>,
    );
  }

  if (done) {
    return shell(
      <div className="text-center">
        <img
          src="/plant-stage-2.webp"
          alt=""
          className="w-16 h-16 object-contain mx-auto mb-3"
          style={{ mixBlendMode: "darken" }}
        />
        <h1 className="font-serif text-2xl font-semibold text-ghibli-canopy mb-2">
          Your new password is set
        </h1>
        <p className="font-sans text-sm text-ghibli-bark">
          Taking you back to your garden.
        </p>
      </div>,
    );
  }

  return shell(
    <>
      <div className="text-center mb-6">
        <h1 className="font-serif text-2xl font-bold text-primary mb-1">
          Choose a new password
        </h1>
        <p className="font-sans text-sm text-ghibli-bark">
          Then we'll take you straight back in.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-parchment border bg-destructive/10 border-destructive/20 text-destructive text-sm font-sans">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="font-sans text-xs font-medium text-ghibli-bark mb-1.5 block"
          >
            New password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              {...register("password")}
              disabled={saving}
              className="w-full rounded-parchment border-2 border-ghibli-moss/30 bg-ghibli-ivory px-4 py-3 pr-10 font-sans text-sm text-ghibli-canopy placeholder:text-ghibli-bark outline-none transition-all duration-300 focus:border-primary focus:shadow-glow disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ghibli-bark hover:text-ghibli-canopy transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {!errors.password && (
            <p className="font-sans text-xs text-ghibli-bark mt-1">
              At least 8 characters, with an uppercase letter, a lowercase letter
              and a number.
            </p>
          )}
          {errors.password && (
            <ul className="font-sans text-xs text-destructive mt-1 space-y-0.5 list-none">
              {(errors.password.types
                ? Object.values(errors.password.types).flat()
                : [errors.password.message]
              )
                .filter(Boolean)
                .map((msg) => (
                  <li key={String(msg)}>{String(msg)}</li>
                ))}
            </ul>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="font-sans text-xs font-medium text-ghibli-bark mb-1.5 block"
          >
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              {...register("confirmPassword")}
              disabled={saving}
              className="w-full rounded-parchment border-2 border-ghibli-moss/30 bg-ghibli-ivory px-4 py-3 pr-10 font-sans text-sm text-ghibli-canopy placeholder:text-ghibli-bark outline-none transition-all duration-300 focus:border-primary focus:shadow-glow disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ghibli-bark hover:text-ghibli-canopy transition-colors"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="font-sans text-xs text-destructive mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-parchment border-0 bg-gradient-to-br from-ghibli-jungle to-ghibli-canopy py-3 font-sans font-medium text-sm text-primary-foreground shadow-[0_2px_8px_hsl(var(--ghibli-canopy)/0.25)] transition-shadow hover:shadow-[0_4px_12px_hsl(var(--ghibli-canopy)/0.35)] disabled:opacity-50 cursor-pointer"
        >
          {saving ? "Saving…" : "Set new password"}
        </button>
      </form>
    </>,
  );
}
