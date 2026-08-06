import { useEffect, useState } from "react";
import { CloudOff } from "lucide-react";

/**
 * A small pill that appears only when the connection is gone, so a student
 * knows why answers aren't being marked and that the app hasn't broken.
 *
 * Silent whenever there is a connection.
 */
export function OfflineStatus() {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[9998] flex justify-center p-2 pt-[calc(0.5rem+env(safe-area-inset-top))] pointer-events-none">
      <div
        role="status"
        className="pointer-events-auto flex items-center gap-2 rounded-full border border-ghibli-gold/50 bg-ghibli-sunlight/40 px-3 py-1.5 text-xs font-medium text-ghibli-bark shadow-sm backdrop-blur"
      >
        <CloudOff className="size-3.5 text-ghibli-gold" aria-hidden />
        Offline — you can keep reading, but answers won't be marked yet
      </div>
    </div>
  );
}
