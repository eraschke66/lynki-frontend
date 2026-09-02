import { FileText, Image as ImageIcon, Upload } from "lucide-react";
import { ParchmentCard } from "@/components/garden/ParchmentCard";
import { PreviewBadge } from "../shared/PreviewBadge";

export function MaterialsPreview() {
  const files = [
    { name: "Lecture 04 — Mitosis.pdf", icon: FileText, status: "Indexed" },
    { name: "Cell Cycle slides.pptx", icon: FileText, status: "Indexed" },
    { name: "Whiteboard photo.jpg", icon: ImageIcon, status: "Indexed" },
    { name: "Past paper notes.docx", icon: FileText, status: "Reading…" },
  ];
  return (
    <ParchmentCard className="p-6 md:p-7" hover={false}>
      <div className="flex items-center justify-between mb-5">
        <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-ghibli-forest font-semibold">
          Materials · Biology
        </span>
        <PreviewBadge />
      </div>
      <p className="font-sans text-[11px] text-ghibli-bark italic mb-4">
        Example layout. Accepted: PDF · DOCX · PPTX · PNG · JPEG.
      </p>
      <div className="border-2 border-dashed border-ghibli-moss/30 rounded-2xl py-7 px-4 mb-4 text-center bg-white/50">
        <Upload className="w-6 h-6 mx-auto text-ghibli-forest mb-2" />
        <p className="font-serif text-sm font-semibold text-ghibli-canopy">
          Drop your notes, slides or readings
        </p>
        <p className="font-sans text-[11px] text-ghibli-bark mt-0.5">
          We'll extract the concepts your course is built on.
        </p>
      </div>
      <div className="space-y-2">
        {files.map((f) => (
          <div
            key={f.name}
            className="flex items-center gap-3 rounded-xl bg-white/55 border border-ghibli-moss/12 px-3 py-2.5"
          >
            <f.icon className="w-4 h-4 text-ghibli-canopy shrink-0" />
            <span className="font-sans text-sm text-ghibli-canopy truncate flex-1">{f.name}</span>
            <span
              className={`font-sans text-[10px] uppercase tracking-widest shrink-0 ${
                f.status === "Indexed" ? "text-ghibli-forest" : "text-ghibli-bark italic"
              }`}
            >
              {f.status}
            </span>
          </div>
        ))}
      </div>
    </ParchmentCard>
  );
}
