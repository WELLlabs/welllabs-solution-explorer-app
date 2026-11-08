import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  WATERSHED_INFO_EYEBROW,
  WATERSHED_INFO_TITLE,
  WATERSHED_INFO_SUMMARY,
  WATERSHED_INFO_METRICS,
  WATERSHED_INFO_CONCLUSION,
  WATERSHED_INFO_PARAGRAPHS,
} from "@/data/watershedInfo";

const TONES = {
  blue: {
    card: "bg-[#6D9EC9]/10 border-[#6D9EC9]/40",
    icon: "bg-[#3669A9] text-white",
    label: "text-[#3669A9]",
  },
  green: {
    card: "bg-[#347745]/8 border-[#347745]/30",
    icon: "bg-[#347745] text-white",
    label: "text-[#347745]",
  },
};

const MetricIcon = ({ id }) =>
  id === "runoff" ? (
    // water drop
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.7c3.6 4.4 6 7.4 6 10.6a6 6 0 0 1-12 0c0-3.2 2.4-6.2 6-10.6Z" />
    </svg>
  ) : (
    // water soaking into ground
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v10" />
      <path d="m8 9 4 4 4-4" />
      <path d="M4 18c2-1.5 4-1.5 6 0s4 1.5 6 0 3-1.2 4-.8" />
    </svg>
  );

const WatershedInfoPopup = ({ onClose }) => {
  const [expanded, setExpanded] = useState(false);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <aside
      role="dialog"
      aria-labelledby="watershed-info-title"
      className="fixed bottom-4 left-1/2 z-[800] w-[min(40rem,calc(100%-1.5rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-[#C8D7BC] bg-white text-left shadow-[0_18px_50px_-12px_rgba(31,42,36,0.28)] animate-[fadeIn_0.2s_ease-out]"
    >
      {/* Brand accent strip */}
      <div className="h-1 w-full bg-gradient-to-r from-[#3669A9] via-[#6D9EC9] to-[#347745]" />

      {/* Header */}
      <div className="flex items-start gap-3 px-5 pt-4 pb-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#347745]/10 text-[#347745]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 17c2.5-4 4.5-9 9-9s6.5 5 9 9" />
            <path d="M3 21h18" />
            <path d="M12 8V3" />
          </svg>
        </div>
        <div className="min-w-0 flex-1 pr-8">
          <p className="m-0 text-[10px] font-bold uppercase tracking-[0.14em] text-[#347745]">
            {WATERSHED_INFO_EYEBROW}
          </p>
          <h3 id="watershed-info-title" className="m-0 mt-0.5 text-[15px] font-bold leading-snug text-[#1F2A24]">
            {WATERSHED_INFO_TITLE}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close watershed note"
          className="absolute right-3 top-4 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-[#6E6455] transition-colors hover:bg-[#dfebd5] hover:text-[#1F2A24]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="custom-scrollbar max-h-[55vh] overflow-y-auto px-5 pb-4">
        <p className="m-0 text-[13px] leading-relaxed text-[#1F2A24]">{WATERSHED_INFO_SUMMARY}</p>

        <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {WATERSHED_INFO_METRICS.map((m) => {
            const t = TONES[m.tone] || TONES.green;
            return (
              <div key={m.id} className={`rounded-xl border p-3 ${t.card}`}>
                <div className="flex items-center gap-2">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${t.icon}`}>
                    <MetricIcon id={m.id} />
                  </span>
                  <span className={`text-xs font-bold uppercase tracking-wide ${t.label}`}>{m.label}</span>
                </div>
                <p className="m-0 mt-2 text-[12px] leading-relaxed text-[#1F2A24]/85">{m.description}</p>
              </div>
            );
          })}
        </div>

        <p className="m-0 mt-3.5 border-l-2 border-[#F2C230] pl-3 text-[12px] italic leading-relaxed text-[#6E6455]">
          {WATERSHED_INFO_CONCLUSION}
        </p>

        {/* Full explanation (on demand) */}
        {expanded && (
          <div className="mt-3.5 space-y-2 border-t border-[#C8D7BC]/70 pt-3">
            {WATERSHED_INFO_PARAGRAPHS.map((p) => (
              <p key={p.slice(0, 24)} className="m-0 text-[12px] leading-relaxed text-[#1F2A24]/85">
                {p}
              </p>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-3 cursor-pointer border-none bg-transparent p-0 text-xs font-bold text-[#3669A9] transition-colors hover:text-[#347745]"
        >
          {expanded ? "Hide full explanation ↑" : "Read full explanation ↓"}
        </button>
      </div>
    </aside>,
    document.body
  );
};

export default WatershedInfoPopup;