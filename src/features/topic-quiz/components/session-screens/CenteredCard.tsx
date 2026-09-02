import type { ReactNode } from "react";

export function CenteredCard({ embedded, children }: { embedded: boolean; children: ReactNode }) {
  if (embedded) {
    return <div className="max-w-xl mx-auto w-full">{children}</div>;
  }
  return (
    <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
      {children}
    </div>
  );
}
