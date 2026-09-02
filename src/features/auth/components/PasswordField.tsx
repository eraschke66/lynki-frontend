import { useState } from "react";
import type { ReactNode } from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";

interface PasswordFieldProps {
  id: string;
  label: string;
  labelExtra?: ReactNode;
  autoComplete: "new-password" | "current-password";
  disabled?: boolean;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  /** Shown in place of the error once, before the field has ever failed validation. */
  hint?: string;
}

/**
 * A password input with a show/hide toggle, shared by every auth form that
 * collects one. When react-hook-form's `criteriaMode: "all"` is in play,
 * `error.types` carries every failing rule at once instead of just the first.
 */
export function PasswordField({
  id,
  label,
  labelExtra,
  autoComplete,
  disabled,
  registration,
  error,
  hint,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  const messages = error?.types
    ? Object.values(error.types).flat().filter(Boolean).map(String)
    : error?.message
      ? [error.message]
      : [];

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label htmlFor={id} className="font-sans text-xs font-medium text-ghibli-bark block">
          {label}
        </label>
        {labelExtra}
      </div>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder="••••••••"
          disabled={disabled}
          {...registration}
          className="w-full rounded-parchment border-2 border-ghibli-moss/30 bg-ghibli-ivory px-4 py-3 pr-10 font-sans text-sm text-ghibli-canopy placeholder:text-ghibli-bark outline-none transition-all duration-300 focus:border-primary focus:shadow-glow disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ghibli-bark hover:text-ghibli-canopy transition-colors"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {messages.length === 0 && hint && (
        <p className="font-sans text-xs text-ghibli-bark mt-1">{hint}</p>
      )}
      {messages.length === 1 && (
        <p className="font-sans text-xs text-destructive mt-1">{messages[0]}</p>
      )}
      {messages.length > 1 && (
        <ul className="font-sans text-xs text-destructive mt-1 space-y-0.5 list-none">
          {messages.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
