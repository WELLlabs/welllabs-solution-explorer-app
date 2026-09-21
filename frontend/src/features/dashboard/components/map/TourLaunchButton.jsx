import React from "react";
import { useTour } from "@/shared/tour/TourGuide";

export default function TourLaunchButton() {
  const { start } = useTour();
  return (
    <button
      type="button"
      onClick={() => start()}
      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#1F2A24] bg-[#F2C230] hover:bg-[#e0b228] border border-[#F2C230] rounded-lg transition-all cursor-pointer shadow-2xs"
      title="Start Interactive Walkthrough"
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
      <span>Tour</span>
    </button>
  );
}
