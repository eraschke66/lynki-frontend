import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "../hooks/AuthContext";
import { humanAuthMessage } from "../authErrors";
import { AuthScene, WoodenFrame } from "./AuthScene";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { PasswordField } from "./PasswordField";
import { EmailField } from "./EmailField";
import { SubmitButton } from "./SubmitButton";
import { OrDivider } from "./OrDivider";
import { AgeConfirmationField } from "./AgeConfirmationField";

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

function SignupSuccess({ registeredEmail }: { registeredEmail: string }) {
  const { resendVerificationEmail } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const isResent = error?.includes("resent");

  const handleResend = async () => {
    try {
      setResending(true);
      setError(null);
      const { error: resendError } = await resendVerificationEmail(registeredEmail);
      // Resend is the single most likely place to hit the send rate limit,
      // so it needs the real reason, not a flat "failed".
      setError(resendError ? humanAuthMessage(resendError) : "Verification email resent! Please check your inbox.");
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      <AuthScene />
      <WoodenFrame>
        <div className="text-center">
          <img
            src="/plant-stage-1.webp"
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
            onClick={handleResend}
            disabled={resending}
            className="w-full rounded-parchment border-2 border-ghibli-moss/30 bg-ghibli-ivory py-3 mb-3 font-sans font-medium text-sm text-ghibli-canopy transition-all duration-300 hover:border-ghibli-forest hover:shadow-glow disabled:opacity-50"
          >
            {resending ? "Sending..." : "Resend Verification Email"}
          </button>
          <Link to="/login" className="font-sans text-sm text-primary font-semibold hover:underline">
            Back to the garden gate
          </Link>
        </div>
      </WoodenFrame>
    </div>
  );
}

export function SignupForm() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    // onTouched, not onBlur: validate once they leave a field, then correct
    // live as they fix it. onBlur alone turns a half-typed email red mid-flow.
    mode: "onTouched",
    // Zod already returns every failing rule at once; react-hook-form's default
    // ("firstError") threw all but the first away, which is why a student
    // discovered a four-part password policy one submit at a time.
    criteriaMode: "all",
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
        // Every branch goes through the mapper now — the old `else` put the
        // raw Supabase string on screen, which is how a student met
        // "email rate limit exceeded".
        setError(humanAuthMessage(signUpError));
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

  if (success) {
    return <SignupSuccess registeredEmail={registeredEmail} />;
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-8">
      <AuthScene />
      <WoodenFrame>
        <div className="text-center mb-6">
          <h1 className="font-serif text-2xl font-semibold text-ghibli-canopy mb-1">
            Plant your first seed
          </h1>
          <p className="font-sans text-sm text-ghibli-bark">Your knowledge garden awaits 🌿</p>
        </div>

        <div className="flex flex-col gap-4">
          <GoogleSignInButton label="Sign up with Google" onError={setError} />

          <OrDivider />

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {error && (
              <div className="p-3 text-sm rounded-parchment bg-destructive/10 text-destructive border border-destructive/20 font-sans">
                {error}
              </div>
            )}

            <EmailField id="email" registration={register("email")} error={errors.email} disabled={loading} />

            <PasswordField
              id="password"
              label="Password"
              autoComplete="new-password"
              disabled={loading}
              registration={register("password")}
              error={errors.password}
              hint="At least 8 characters, with an uppercase letter, a lowercase letter and a number."
            />

            <PasswordField
              id="confirmPassword"
              label="Confirm Password"
              autoComplete="new-password"
              disabled={loading}
              registration={register("confirmPassword")}
              error={errors.confirmPassword}
            />

            <AgeConfirmationField
              registration={register("ageConfirmed")}
              error={errors.ageConfirmed}
              disabled={loading}
            />

            <SubmitButton loading={loading} label="Walk the Path →" loadingLabel="Planting your seed..." />

            <p className="text-center font-sans text-xs text-ghibli-bark mt-1">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Return to the garden
              </Link>
            </p>
          </form>
        </div>

        <div className="flex justify-center mt-4">
          <img src="/cat-pawprint.png" alt="" className="w-8 h-8 object-contain opacity-40 select-none" />
        </div>
      </WoodenFrame>
    </div>
  );
}
