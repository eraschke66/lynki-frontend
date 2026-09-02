import { reportError } from "@/lib/sentry";
import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
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
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  // AuthCallback sends users here when the code exchange fails, rather than
  // leaving them on a spinner with no explanation.
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "auth_callback"
      ? "We couldn't finish signing you in. Please try again."
      : null,
  );

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
      <AuthScene />
      <WoodenFrame>
        <div className="text-center mb-6">
          <h1 className="font-serif text-2xl font-bold text-primary mb-1">
            Welcome back to your garden
          </h1>
          <p className="font-sans text-sm text-ghibli-bark">Your knowledge awaits</p>
        </div>

        <div className="flex flex-col gap-4">
          <GoogleSignInButton label="Continue with Google" onError={setError} />

          <OrDivider />

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {error && (
              <div className="p-3 text-sm rounded-parchment bg-destructive/10 text-destructive border border-destructive/20">
                {error}
              </div>
            )}

            <EmailField id="login-email" registration={register("email")} error={errors.email} disabled={loading} />

            <PasswordField
              id="login-password"
              label="Password"
              autoComplete="current-password"
              disabled={loading}
              registration={register("password")}
              error={errors.password}
              labelExtra={
                // There was no way out of a forgotten password at all —
                // no link, no route, no page.
                <Link
                  to="/forgot-password"
                  className="font-sans text-xs text-ghibli-jungle hover:text-ghibli-canopy underline underline-offset-2"
                >
                  Forgot password?
                </Link>
              }
            />

            <SubmitButton loading={loading} label="Enter the Garden" loadingLabel="Entering..." />
          </form>
        </div>

        <p className="text-center font-sans text-xs text-ghibli-bark mt-5">
          New to the garden?{" "}
          <Link to="/signup" className="text-primary font-medium hover:underline">
            Plant your first seed
          </Link>
        </p>

        <div className="flex justify-center mt-4">
          <img
            src="/cat-pawprint.png"
            alt="Cat paw print"
            className="w-8 h-8 object-contain opacity-40 select-none"
          />
        </div>
      </WoodenFrame>
    </div>
  );
}
