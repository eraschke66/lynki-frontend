import type { ConnectionPair } from "../../types";

interface RightConnectionItemProps {
  pair: ConnectionPair;
  isMatched: boolean;
  isFlashing: boolean;
  isPulsing: boolean;
  isTouch: boolean;
  canTapToMatch: boolean;
  onDropMatch: (leftId: string) => void;
  onTapMatch: () => void;
}

export function RightConnectionItem({
  pair,
  isMatched,
  isFlashing,
  isPulsing,
  isTouch,
  canTapToMatch,
  onDropMatch,
  onTapMatch,
}: RightConnectionItemProps) {
  return (
    <div
      onDragOver={(e) => {
        if (isMatched || isTouch) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDrop={(e) => {
        if (isMatched || isTouch) return;
        e.preventDefault();
        const leftId = e.dataTransfer.getData("text/plain");
        if (leftId) onDropMatch(leftId);
      }}
      onClick={() => {
        if (isMatched || !isTouch || !canTapToMatch) return;
        onTapMatch();
      }}
      className={[
        "rounded-md border p-3 text-sm font-sans transition-all select-none",
        isMatched
          ? "bg-ghibli-moss/10 border-ghibli-moss/40 text-ghibli-forest cursor-default"
          : "bg-cream-50 border-ghibli-moss/30 text-ghibli-canopy hover:border-ghibli-moss/60",
        isTouch && !isMatched && canTapToMatch ? "cursor-pointer" : "",
        isFlashing ? "bg-amber-100 border-amber-500/70" : "",
        isPulsing ? "bg-emerald-100/70 border-emerald-500/60" : "",
      ].join(" ")}
    >
      {pair.right}
    </div>
  );
}
