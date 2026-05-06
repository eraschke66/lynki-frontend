import { useState } from "react";
import { Calendar } from "lucide-react";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { Button } from "@/components/ui/button";

export function DateSetupCard({
  onSave,
  isPending,
}: {
  onSave: (date: string) => void;
  isPending: boolean;
}) {
  const [value, setValue] = useState("");
  const today = new Date().toISOString().split("T")[0];

  return (
    <ParchmentCard className="p-8 text-center flex flex-col items-center gap-5 max-w-sm mx-auto">
      <div className="w-14 h-14 rounded-full bg-ghibli-moss/12 flex items-center justify-center">
        <Calendar className="w-7 h-7 text-ghibli-jungle" />
      </div>
      <div>
        <h2 className="font-serif text-lg font-semibold text-ghibli-canopy mb-1">
          When is your exam?
        </h2>
        <p className="text-sm text-ghibli-bark">
          Set your exam date so the garden can map the path ahead.
        </p>
      </div>
      <input
        type="date"
        min={today}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full max-w-xs border border-ghibli-moss/45 rounded-lg px-3 py-2 text-sm text-ghibli-canopy focus:outline-none focus:border-ghibli-jungle bg-ghibli-ivory/85"
      />
      <Button
        onClick={() => onSave(value)}
        disabled={!value || isPending}
        className="w-full max-w-xs shadow-[0_2px_8px_hsl(var(--ghibli-canopy)/0.2)]"
      >
        {isPending ? "Saving…" : "Set Exam Date"}
      </Button>
    </ParchmentCard>
  );
}
