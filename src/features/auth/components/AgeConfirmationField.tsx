import { Link } from "react-router-dom";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface AgeConfirmationFieldProps {
  registration: UseFormRegisterReturn;
  error?: FieldError;
  disabled?: boolean;
}

export function AgeConfirmationField({ registration, error, disabled }: AgeConfirmationFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="ageConfirmed" className="flex items-start gap-2.5 cursor-pointer">
        <input
          id="ageConfirmed"
          type="checkbox"
          disabled={disabled}
          {...registration}
          className="mt-0.5 w-4 h-4 accent-primary cursor-pointer"
        />
        <span className="font-sans text-xs text-ghibli-bark leading-snug">
          I confirm that I am at least 13 years old
        </span>
      </label>
      {error && <p className="font-sans text-xs text-destructive ml-6">{error.message}</p>}
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
  );
}
