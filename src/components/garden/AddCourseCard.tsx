interface AddCourseCardProps {
  onClick?: () => void;
}

export function AddCourseCard({ onClick }: AddCourseCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative rounded-[28px] border-2 border-dashed border-ghibli-moss/50 bg-ghibli-ivory/40 backdrop-blur-md parchment-texture flex flex-col items-center justify-center gap-3 p-6 transition-all duration-300 hover:border-ghibli-forest hover:bg-ghibli-ivory/70 hover:shadow-parchment cursor-pointer min-h-[240px]"
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-ghibli-sunlight/30 blur-2xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <img
          src="/seedling-add.png"
          alt=""
          className="relative h-20 w-20 object-contain opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform duration-500 select-none"
        />
      </div>
      <div className="text-center">
        <span className="block font-serif text-lg font-semibold text-ghibli-canopy">
          Plant a New Course
        </span>
        <span className="block font-sans text-xs text-ghibli-bark mt-1 italic">
          Drop a seed into your garden
        </span>
      </div>
    </button>
  );
}

export default AddCourseCard;
