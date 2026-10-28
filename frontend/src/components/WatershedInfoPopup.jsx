import React from "react";
import { createPortal } from "react-dom";
import { WATERSHED_INFO_PARAGRAPHS, WATERSHED_INFO_TITLE } from "@/data/watershedInfo";

const WatershedInfoPopup = ({ onClose }) => {
  if (typeof document === "undefined") return null;
  return createPortal(
    <aside className="fixed bottom-4 left-1/2 z-[800] w-[min(36rem,calc(100%-1.5rem))] -translate-x-1/2 rounded-2xl border border-[#C8D7BC] bg-white text-left shadow-[0_12px_40px_rgba(31,42,36,0.18)]">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close watershed note"
        className="absolute top-2 right-2 w-7 h-7 rounded-md text-[#6E6455] hover:text-[#1F2A24] hover:bg-[#f3f8ef] cursor-pointer border-none bg-transparent text-sm leading-none"
      >
        ✕
      </button>
      <div className="max-h-44 overflow-y-auto custom-scrollbar px-4 pt-3 pb-3 pr-10">
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#347745]">
          {WATERSHED_INFO_TITLE}
        </div>
        {WATERSHED_INFO_PARAGRAPHS.map((paragraph) => (
          <p key={paragraph.slice(0, 24)} className="text-[11px] leading-relaxed text-[#1F2A24] m-0 mt-2">
            {paragraph}
          </p>
        ))}
      </div>
    </aside>,
    document.body
  );
};

export default WatershedInfoPopup;
