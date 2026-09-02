import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface EmailFieldProps {
  id: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  disabled?: boolean;
}

/** The email input shared by login, signup, and the forgot-password form. */
export function EmailField({ id, registration, error, disabled }: EmailFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="font-sans text-xs font-medium text-ghibli-bark mb-1.5 block">
        Email
      </label>
      <input
        id={id}
        type="email"
        autoComplete="username"
        placeholder="gardener@passai.app"
        disabled={disabled}
        {...registration}
        className="w-full rounded-parchment border-2 border-ghibli-moss/30 bg-ghibli-ivory px-4 py-3 font-sans text-sm text-ghibli-canopy placeholder:text-ghibli-bark outline-none transition-all duration-300 focus:border-primary focus:shadow-glow disabled:opacity-50"
      />
      {error && <p className="font-sans text-xs text-destructive mt-1">{error.message}</p>}
    </div>
  );
}
