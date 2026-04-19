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
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1.5px solid rgba(64,145,108,0.35)",
  background: "rgba(255,255,255,0.7)",
  color: "#1B4332",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box" as const,
  transition: "border-color 0.2s",
};

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
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      setResendingEmail(true);
      setError(null);
      const { error } = await resendVerificationEmail(registeredEmail);
      if (error) {
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

  // Shared background wrapper
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
            "radial-gradient(ellipse at 50% 30%, hsl(45 85% 70% / 0.15) 0%, transparent 60%), linear-gradient(to bottom, hsl(45 60% 50% / 0.05), hsl(33 30% 20% / 0.2))",
        }}
      />
      <div className="fixed inset-0 mist-overlay pointer-events-none" />
      <img
        src="/foliage-left.png"
        alt=""
        className="fixed left-0 bottom-0 w-72 lg:w-96 pointer-events-none z-20 animate-drift select-none"
        style={{ filter: "drop-shadow(4px 0 15px hsl(150 40% 20% / 0.3))" }}
      />
      <img
        src="/foliage-right.png"
        alt=""
        className="fixed right-0 top-0 w-64 lg:w-80 pointer-events-none z-20 animate-drift select-none"
        style={{
          animationDelay: "3s",
          filter: "drop-shadow(-4px 0 15px hsl(150 40% 20% / 0.3))",
        }}
      />
    </>
  );

  if (success) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
        <Background />
        <div className="relative z-10 w-full max-w-md mx-4 sm:mx-auto">
          <div
            style={{
              background:
                "linear-gradient(145deg, #7a5c3a 0%, #5c3d1e 30%, #6b4c28 60%, #8a6a42 100%)",
              borderRadius: 20,
              padding: 6,
              boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
            }}
          >
            <div
              style={{
                background:
                  "linear-gradient(160deg, #FEFAE0 0%, #FDF5D0 40%, #FAF0C0 100%)",
                borderRadius: 15,
                padding: "40px 32px 32px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div className="text-center">
                <img
                  src="/plant-stage-1.png"
                  alt=""
                  style={{
                    width: 64,
                    height: 64,
                    objectFit: "contain",
                    mixBlendMode: "darken",
                    marginBottom: 12,
                  }}
                />
                <h1
                  style={{
                    fontFamily: "'Lora', Georgia, serif",
                    fontSize: 24,
                    fontWeight: 600,
                    color: "#1B4332",
                    marginBottom: 8,
                  }}
                >
                  Your seed has been planted
                </h1>
                <p style={{ color: "#5a7a5a", fontSize: 14, marginBottom: 20 }}>
                  We sent a verification link to{" "}
                  <strong>{registeredEmail}</strong>
                </p>
                <p style={{ color: "#7a9a7a", fontSize: 13, marginBottom: 24 }}>
                  Click the link in the email to begin tending your garden.
                </p>
                {error && (
                  <div
                    style={{
                      marginBottom: 16,
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: error.includes("resent")
                        ? "rgba(64,145,108,0.1)"
                        : "rgba(180,60,40,0.08)",
                      border: `1px solid ${error.includes("resent") ? "rgba(64,145,108,0.3)" : "rgba(180,60,40,0.2)"}`,
                      color: error.includes("resent") ? "#1B4332" : "#8B2500",
                      fontSize: 13,
                    }}
                  >
                    {error}
                  </div>
                )}
                <button
                  onClick={handleResendEmail}
                  disabled={resendingEmail}
                  style={{
                    width: "100%",
                    padding: "11px",
                    marginBottom: 12,
                    background: "rgba(255,255,255,0.7)",
                    border: "1.5px solid rgba(64,145,108,0.35)",
                    borderRadius: 11,
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#2D4A2D",
                    cursor: "pointer",
                    fontFamily: "'Nunito', sans-serif",
                  }}
                >
                  {resendingEmail ? "Sending..." : "Resend Verification Email"}
                </button>
                <Link
                  to="/login"
                  style={{
                    color: "#2D6A4F",
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Back to the garden gate
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      <Background />

      <div className="relative z-10 w-full max-w-md mx-4 sm:mx-auto">
        {/* Wooden frame */}
        <div
          style={{
            background:
              "linear-gradient(145deg, #7a5c3a 0%, #5c3d1e 30%, #6b4c28 60%, #8a6a42 100%)",
            borderRadius: 20,
            padding: 6,
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.2)",
          }}
        >
          {/* Parchment interior */}
          <div
            style={{
              background:
                "linear-gradient(160deg, #FEFAE0 0%, #FDF5D0 40%, #FAF0C0 100%)",
              borderRadius: 15,
              padding: "36px 32px 28px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Paper grain */}
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
            <div className="text-center mb-6">
              <h1
                style={{
                  fontFamily: "'Lora', Georgia, serif",
                  fontSize: 24,
                  fontWeight: 600,
                  color: "#1B4332",
                  lineHeight: 1.3,
                  marginBottom: 6,
                }}
              >
                Plant your first seed
              </h1>
              <p style={{ color: "#5a7a5a", fontSize: 14 }}>
                Your knowledge garden awaits
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  marginBottom: 16,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(180,60,40,0.08)",
                  border: "1px solid rgba(180,60,40,0.2)",
                  color: "#8B2500",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#3a5a3a",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="gardener@passai.app"
                  {...register("email")}
                  disabled={loading}
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(27,67,50,0.6)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(64,145,108,0.35)";
                  }}
                />
                {errors.email && (
                  <p style={{ fontSize: 12, color: "#8B2500", marginTop: 4 }}>
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#3a5a3a",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("password")}
                    disabled={loading}
                    style={{ ...inputStyle, paddingRight: "40px" }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "rgba(27,67,50,0.6)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(64,145,108,0.35)";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "rgba(27,67,50,0.6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p style={{ fontSize: 12, color: "#8B2500", marginTop: 4 }}>
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#3a5a3a",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Confirm Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("confirmPassword")}
                    disabled={loading}
                    style={{ ...inputStyle, paddingRight: "40px" }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "rgba(27,67,50,0.6)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(64,145,108,0.35)";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "rgba(27,67,50,0.6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p style={{ fontSize: 12, color: "#8B2500", marginTop: 4 }}>
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Submit */}
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
                    (e.target as HTMLButtonElement).style.transform =
                      "translateY(-1px)";
                    (e.target as HTMLButtonElement).style.boxShadow =
                      "0 6px 20px rgba(27,67,50,0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.transform = "";
                  (e.target as HTMLButtonElement).style.boxShadow =
                    "0 4px 16px rgba(27,67,50,0.3)";
                }}
              >
                {loading ? "Planting your seed..." : "Begin your journey"}
              </button>

              {/* Sign in link */}
              <p
                style={{
                  textAlign: "center",
                  fontSize: 13,
                  color: "#7a9a7a",
                  marginTop: 4,
                }}
              >
                Already have an account?{" "}
                <Link
                  to="/login"
                  style={{
                    color: "#2D6A4F",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Return to the garden
                </Link>
              </p>
            </form>

            {/* Cat paw */}
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
