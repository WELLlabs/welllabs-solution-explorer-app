import React from "react";
import { rs } from "../NewProjectsView";

const SITE_TYPE_INFO = {
  lake: { label: "Lake Intervention", icon: "🔵", color: "#3b82f6", bg: "bg-blue-50 text-blue-700 border-blue-200" },
  park: { label: "Parks & Green Spaces", icon: "🟢", color: "#22c55e", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  campus: { label: "Institutional Campus", icon: "🏢", color: "#f59e0b", bg: "bg-amber-50 text-amber-800 border-amber-200" },
  stormdrain: { label: "Stormdrain / Drainage", icon: "⚫", color: "#94a3b8", bg: "bg-slate-100 text-slate-700 border-slate-200" },
};

const FundingDeckPanel = ({
  showNewProjects,
  activeProject,
  isRightDeckOpen,
  setIsRightDeckOpen,
  selectAllAvailableAssets,
  clearAllSelections,
  selectedFundPicks,
  committedPicks,
  toggleProjectAllAssets,
  toggleFundPick,
  setShowFunderModal,
  setActiveDetailView,
}) => {
  // Only render when City Wide BGG Projects layer is active AND a project is clicked
  if (!showNewProjects || !activeProject) return null;

  const proj = activeProject;
  const typeInfo = SITE_TYPE_INFO[proj.type] || {
    label: (proj.type || "Site Project").toUpperCase(),
    icon: "📍",
    color: "#3b82f6",
    bg: "bg-blue-50 text-blue-700 border-blue-200",
  };

  const projKeys = (proj.assets || []).map((_, i) => `${proj.id}__${i}`);
  const selectedCountInProj = projKeys.filter((k) =>
    selectedFundPicks.has(k)
  ).length;
  const allInProjSelected =
    selectedCountInProj === (proj.assets || []).length &&
    (proj.assets || []).length > 0;

  const selectedCostInProj = (proj.assets || []).reduce((sum, a, idx) => {
    return selectedFundPicks.has(`${proj.id}__${idx}`) ? sum + (a.cost || 0) : sum;
  }, 0);

  return (
    <>
      {isRightDeckOpen && (
        <div
          data-tour="funding-panel"
          className="bg-white border border-slate-200/90 rounded-2xl shadow-sm flex flex-col h-[calc(100vh-80px)] min-h-[580px] sticky top-3 overflow-hidden animate-[fadeIn_0.3s_ease-out]"
        >
          {/* Compact Panel Header for Clicked Project */}
          <div className="shrink-0 p-3.5 border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-slate-50 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">{typeInfo.icon}</span>
                <span
                  className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${typeInfo.bg}`}
                >
                  {typeInfo.label}
                </span>
              </div>
              <button
                onClick={() => setIsRightDeckOpen(false)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md p-1 text-xs transition-colors cursor-pointer border-none bg-transparent leading-none"
                title="Minimize Deck"
              >
                ✕
              </button>
            </div>

            <div className="flex items-start justify-between text-left gap-2">
              <div className="flex-1 min-w-0">
                <h3
                  className="text-sm font-extrabold text-slate-900 m-0 leading-snug truncate"
                  title={proj.name}
                >
                  {proj.name}
                </h3>
                <p className="text-[11px] text-slate-500 m-0 mt-0.5 truncate">
                  {proj.loc || "City Project Location"}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] font-bold text-slate-800 font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md block">
                  {rs(proj.total)}
                </span>
                <span className="text-[9.5px] text-slate-400 font-semibold block mt-0.5">
                  Total Budget
                </span>
              </div>
            </div>

            {/* Quick Select Actions & Counter for Clicked Project */}
            <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-100 text-[11px]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    allInProjSelected
                      ? clearAllSelections(proj)
                      : selectAllAvailableAssets(proj)
                  }
                  className="text-teal-700 hover:text-teal-900 font-bold cursor-pointer underline text-[11px] border-none bg-transparent p-0"
                >
                  {allInProjSelected ? "Deselect All" : "Select All"}
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() => clearAllSelections(proj)}
                  className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer underline text-[11px] border-none bg-transparent p-0"
                >
                  Clear
                </button>
              </div>
              <span className="text-slate-700 font-mono font-bold text-[10.5px]">
                {selectedCountInProj} / {(proj.assets || []).length} sel ({rs(selectedCostInProj)})
              </span>
            </div>
          </div>

          {/* Scrollable Assets & Timelines for Clicked Project */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-2.5 custom-scrollbar text-left">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider px-0.5">
              <span>Project Assets &amp; Timelines</span>
              <span className="text-[10px] text-slate-400 font-mono normal-case">
                {(proj.assets || []).length} items
              </span>
            </div>

            {(proj.assets || []).length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs font-semibold bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No individual assets found for this project.
              </div>
            ) : (
              proj.assets.map((a, idx) => {
                const key = `${proj.id}__${idx}`;
                const isSelected = selectedFundPicks.has(key);
                const isCommitted = committedPicks.has(key);

                return (
                  <div
                    key={idx}
                    onClick={() =>
                      !isCommitted && toggleFundPick(proj.id, idx)
                    }
                    className={`shrink-0 p-2.5 rounded-xl border transition-all duration-150 cursor-pointer flex flex-col gap-1.5 ${
                      isCommitted
                        ? "bg-slate-100 border-slate-200 opacity-75 cursor-default"
                        : isSelected
                          ? "bg-teal-50/90 border-teal-400 shadow-2xs"
                          : "bg-slate-50/60 border-slate-200/80 hover:border-teal-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 overflow-hidden">
                        <input
                          type="checkbox"
                          checked={isSelected || isCommitted}
                          disabled={isCommitted}
                          onChange={() =>
                            !isCommitted && toggleFundPick(proj.id, idx)
                          }
                          className="mt-0.5 w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 accent-teal-600 cursor-pointer shrink-0"
                        />
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 flex-wrap leading-snug">
                            {a.n}
                            <span
                              className={`text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                a.t === "blue"
                                  ? "bg-[#E2EEF4] text-[#1D5E8C]"
                                  : a.t === "green"
                                    ? "bg-[#E7EFDF] text-[#3E6325]"
                                    : "bg-[#E5E9EB] text-[#475760]"
                              }`}
                            >
                              {a.t}
                            </span>
                            {isCommitted && (
                              <span className="text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                                Funded
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Timeline & Cost Row */}
                    <div className="flex items-center justify-between text-[10.5px] pt-1.5 border-t border-slate-100/90 text-slate-600">
                      <span className="flex items-center gap-1 font-mono text-slate-500">
                        <span>⏱️</span>
                        <strong className="text-slate-700">
                          {a.timeline && a.timeline !== "—"
                            ? `${a.timeline} ${
                                /^\d+(\.\d+)?$/.test(String(a.timeline).trim())
                                  ? parseFloat(a.timeline) === 1
                                    ? "mo"
                                    : "mos"
                                  : ""
                              }`
                            : "Planning"}
                        </strong>
                      </span>
                      <span className="font-mono text-xs font-bold text-teal-800">
                        {a.cost > 0 ? rs(a.cost) : "TBD"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Sticky Bottom Action Footer for Clicked Project */}
          <div className="shrink-0 p-3 bg-white border-t border-slate-200 shadow-md flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-semibold">
                {selectedCountInProj} asset{selectedCountInProj !== 1 ? "s" : ""} selected
              </span>
              <div className="text-right">
                <strong className="text-sm font-bold font-mono text-teal-800">
                  {rs(selectedCostInProj)}
                </strong>
              </div>
            </div>

            <button
              onClick={() => setShowFunderModal(true)}
              disabled={selectedCountInProj === 0}
              className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold text-white transition-all duration-150 cursor-pointer shadow-xs flex items-center justify-center gap-2 ${
                selectedCountInProj === 0
                  ? "bg-slate-300 opacity-60 cursor-not-allowed"
                  : "bg-[#C8743C] hover:bg-[#b8602c] hover:shadow active:scale-[0.99]"
              }`}
            >
              <span>Fund Selected Assets</span>
              <span>→</span>
            </button>

            <button
              onClick={() => setActiveDetailView({ type: "site", id: proj.id })}
              className="w-full py-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50/60 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
            >
              Open Project Workspace →
            </button>
          </div>
        </div>
      )}

      {/* Floating Re-Open Button when Project is Clicked but Deck is Minimized */}
      {!isRightDeckOpen && (
        <button
          onClick={() => setIsRightDeckOpen(true)}
          className="fixed bottom-6 right-6 z-[500] bg-[#C8743C] text-white px-4 py-2.5 rounded-full font-bold text-xs shadow-lg hover:shadow-xl hover:bg-[#b8602c] transition-all flex items-center gap-2 cursor-pointer border border-white/40 animate-[bounceIn_0.3s_ease-out]"
        >
          <span>🌊 View {proj.name} Assets</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">
            {selectedCountInProj} selected
          </span>
        </button>
      )}
    </>
  );
};

export default FundingDeckPanel;
