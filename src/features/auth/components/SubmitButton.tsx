interface SubmitButtonProps {
  loading: boolean;
  label: string;
  loadingLabel: string;
}

/** The primary call-to-action button shared by login and signup, leaf motif included. */
export function SubmitButton({ loading, label, loadingLabel }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-parchment bg-primary text-primary-foreground py-3 font-sans font-semibold text-sm tracking-wide transition-all duration-300 hover:shadow-glow hover:brightness-110 relative overflow-hidden disabled:opacity-50"
    >
      <span className="relative z-10">{loading ? loadingLabel : label}</span>
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M30 5 Q40 15 35 30 Q30 20 25 30 Q20 15 30 5Z' fill='%23fff' opacity='0.5'/%3E%3C/svg%3E\")",
        }}
      />
    </button>
  );
}
