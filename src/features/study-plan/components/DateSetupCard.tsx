import { useState } from "react";
import { Calendar } from "lucide-react";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { Button } from "@/components/ui/button";
import {
  daysUntil,
  describeGrowingWindow,
  formatExamDate,
  todayISO,
} from "@/lib/examDate";

export function DateSetupCard({
  onSave,
  isPending,
}: {
  onSave: (date: string) => void;
  isPending: boolean;
}) {
  const [value, setValue] = useState("");
  const today = todayISO();

  // Show the resulting countdown as soon as a date is picked, so the student
  // sees the date -> days mapping before committing rather than meeting an
  // unexplained number on the next screen.
  const days = value ? daysUntil(value) : null;

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
          We'll count the days from today to your exam and build a study plan
          that fits them.
        </p>
      </div>
      <input
        type="date"
        min={today}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Exam date"
        className="w-full max-w-xs border border-ghibli-moss/45 rounded-lg px-3 py-2 text-sm text-ghibli-canopy focus:outline-none focus:border-ghibli-jungle bg-ghibli-ivory/85"
      />
      {days !== null && days >= 0 && (
        <div
          aria-live="polite"
          className="w-full max-w-xs rounded-lg bg-ghibli-moss/10 border border-ghibli-moss/30 px-4 py-3"
        >
          <p className="text-sm font-medium text-ghibli-canopy">
            {days === 0
              ? "Your exam is today"
              : `${days} ${days === 1 ? "day" : "days"} until your exam`}
          </p>
          <p className="text-xs text-ghibli-bark mt-0.5">
            {formatExamDate(value)} — {describeGrowingWindow(days)}
          </p>
        </div>
      )}
      {value && value < today && (
        <p aria-live="polite" className="text-xs text-amber-700">
          That date has already passed — pick a date from today onward.
        </p>
      )}
      <Button
        onClick={() => onSave(value)}
        disabled={!value || value < today || isPending}
        className="w-full max-w-xs shadow-[0_2px_8px_hsl(var(--ghibli-canopy)/0.2)]"
      >
        {isPending ? "Saving…" : "Set Exam Date"}
      </Button>
    </ParchmentCard>
  );
}
