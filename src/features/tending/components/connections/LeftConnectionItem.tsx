import { Check } from "lucide-react";
import type { ConnectionPair } from "../../types";

interface LeftConnectionItemProps {
  pair: ConnectionPair;
  isMatched: boolean;
  isSelected: boolean;
  isPulsing: boolean;
  isTouch: boolean;
  onSelect: () => void;
}

export function LeftConnectionItem({ pair, isMatched, isSelected, isPulsing, isTouch, onSelect }: LeftConnectionItemProps) {
  return (
    <div
      draggable={!isMatched && !isTouch}
      style={!isMatched && !isTouch ? ({ WebkitUserDrag: "element" } as React.CSSProperties) : undefined}
      onDragStart={(e) => {
        if (isMatched) return;
        e.dataTransfer.setData("text/plain", pair.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={() => {
        if (isMatched || !isTouch) return;
        onSelect();
      }}
      className={[
        "rounded-md border p-3 text-sm font-sans transition-all select-none",
        isMatched
          ? "bg-ghibli-moss/10 border-ghibli-moss/40 text-ghibli-forest line-through cursor-default"
          : "bg-cream-50 border-ghibli-moss/30 text-ghibli-canopy cursor-grab active:cursor-grabbing hover:border-ghibli-moss/60",
        isSelected ? "ring-2 ring-ghibli-canopy/60" : "",
        isPulsing ? "bg-emerald-100/70 border-emerald-500/60" : "",
      ].join(" ")}
    >
      <span className="flex items-start gap-2">
        {isMatched && <Check className="w-3.5 h-3.5 mt-0.5 text-emerald-700 shrink-0" />}
        <span>{pair.left}</span>
      </span>
    </div>
  );
}
