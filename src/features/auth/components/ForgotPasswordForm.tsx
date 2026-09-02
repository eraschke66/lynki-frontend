import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { sendPasswordReset } from "../services/authService";
import { humanAuthMessage } from "../authErrors";
import { AuthScene, WoodenFrame } from "./AuthScene";
import { EmailField } from "./EmailField";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

/**
 * "I've forgotten my password."
 *
 * Until now this did not exist: no route, no page, no link on /login. A student
 * who forgot their password had no way back into their account and no way to
 * reach /settings, which is where every right the privacy policy grants would
 * have to be exercised.
 *
 * The success state deliberately does not confirm whether the address is
 * registered. Saying "no account with that email" turns this form into a way to
 * test whether a given student has an account.
 */
export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onTouched",
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    setLoading(true);
    setError(null);
    try {
      const { error: sendError } = await sendPasswordReset(data.email);
      if (sendError) {
        setError(humanAuthMessage(sendError));
        return;
      }
      setSentTo(data.email);
      setSent(true);
    } catch {
      setError("Something went wrong on our end. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
        <AuthScene />
        <WoodenFrame>
          <div className="text-center">
            <img
              src="/plant-stage-1.webp"
              alt=""
              className="w-16 h-16 object-contain mx-auto mb-3"
              style={{ mixBlendMode: "darken" }}
            />
            <h1 className="font-serif text-2xl font-semibold text-ghibli-canopy mb-2">
              Check your inbox
            </h1>
            <p className="font-sans text-sm text-ghibli-bark mb-2">
              If there's an account for{" "}
              <strong className="text-ghibli-forest">{sentTo}</strong>, a reset
              link is on its way.
            </p>
            <p className="font-sans text-xs text-ghibli-bark italic mb-6">
              The link lasts about an hour. If it doesn't arrive, check your spam
              folder.
            </p>
            <Link
              to="/login"
              className="inline-block font-sans text-sm text-ghibli-jungle hover:text-ghibli-canopy underline underline-offset-2"
            >
              Return to the garden
            </Link>
          </div>
        </WoodenFrame>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      <AuthScene />
      <WoodenFrame>
        <div className="text-center mb-6">
          <h1 className="font-serif text-2xl font-bold text-primary mb-1">
            Find your way back
          </h1>
          <p className="font-sans text-sm text-ghibli-bark">
            We'll email you a link to set a new password.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-parchment border bg-destructive/10 border-destructive/20 text-destructive text-sm font-sans">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <EmailField id="email" registration={register("email")} error={errors.email} disabled={loading} />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-parchment border-0 bg-gradient-to-br from-ghibli-jungle to-ghibli-canopy py-3 font-sans font-medium text-sm text-primary-foreground shadow-[0_2px_8px_hsl(var(--ghibli-canopy)/0.25)] transition-shadow hover:shadow-[0_4px_12px_hsl(var(--ghibli-canopy)/0.35)] disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-center font-sans text-sm text-ghibli-bark">
          Remembered it?{" "}
          <Link
            to="/login"
            className="text-ghibli-jungle hover:text-ghibli-canopy font-medium underline underline-offset-2"
          >
            Return to the garden
          </Link>
        </p>
      </WoodenFrame>
    </div>
  );
}
