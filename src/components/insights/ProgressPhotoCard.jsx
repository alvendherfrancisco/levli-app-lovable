import React from "react";
import SafeImage from "@/components/SafeImage";

// tag: "latest" | "same-day" | null
export default function ProgressPhotoCard({ photo, dateLabel, weightLabel, tag, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center flex-shrink-0 text-left w-20 sm:w-[140px] min-w-0">
      {tag === "same-day" && (
        <p className="text-xs text-gray-400 dark:text-[#9A9DAE] mb-1">Same day</p>
      )}
      <div className={`relative w-full aspect-square rounded-xl overflow-hidden border ${
        tag === "latest" ? "border-[1.5px] border-indigo-500" : "border-cardline"
      }`}>
        <SafeImage src={photo.url} alt={`Progress ${photo.day_key}`} className="w-full h-full object-cover" />
        {tag === "latest" && (
          <span className="absolute top-2 left-2 bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Latest</span>
        )}
        {weightLabel && (
          <span className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded-full">{weightLabel}</span>
        )}
      </div>
      <p className="text-xs font-semibold text-gray-700 dark:text-[#E8E9F0] mt-1.5">{dateLabel.month}</p>
      <p className="text-xs text-gray-500 dark:text-[#9A9DAE]">{dateLabel.year}</p>
    </button>
  );
}