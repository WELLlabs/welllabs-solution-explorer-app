import React from "react";
import { rs } from "../NewProjectsView";

const FundingDeckPanel = ({
  showFloodingHotspots,
  isRightDeckOpen,
  setIsRightDeckOpen,
  cityProjectsList,
  selectAllAvailableAssets,
  clearAllSelections,
  fundSummary,
  selectedFundPicks,
  committedPicks,
  toggleProjectAllAssets,
  toggleFundPick,
  setShowFunderModal,
  setActiveDetailView,
}) => {
  if (!showFloodingHotspots) return null;

  return (
    <>
            {showFloodingHotspots && isRightDeckOpen && (
              <div data-tour="funding-panel" className="bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col h-[calc(100vh-80px)] min-h-[580px] sticky top-3 overflow-hidden animate-[fadeIn_0.3s_ease-out]">
                {/* Compact Panel Header */}
                <div className="shrink-0 p-3 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Flood Mitigation
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

                  <div className="flex items-baseline justify-between text-left">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 m-0 leading-tight">
                        City Level Projects
                      </h3>
                      <p className="text-[10.5px] text-slate-500 m-0 mt-0.5">
                        Select assets &amp; timelines to fund
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10.5px] font-bold text-teal-700 font-mono bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-full">
                        {cityProjectsList.length} Sites
                      </span>
                    </div>
                  </div>

                  {/* Quick Select Actions & Counter */}
                  <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100 text-[10.5px]">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={selectAllAvailableAssets}
                        className="text-teal-700 hover:text-teal-900 font-semibold cursor-pointer underline text-[10.5px] border-none bg-transparent p-0"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        onClick={clearAllSelections}
                        className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer underline text-[10.5px] border-none bg-transparent p-0"
                      >
                        Clear
                      </button>
                    </div>
                    <span className="text-slate-600 font-mono font-bold text-[10px]">
                      {fundSummary.totalAssets} sel ({rs(fundSummary.totalCost)})
                    </span>
                  </div>
                </div>

                {/* Scrollable Projects Deck with min-h-0 */}
                <div className="flex-1 min-h-0 overflow-y-auto p-2.5 flex flex-col gap-2.5 custom-scrollbar">
                  {cityProjectsList.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs font-semibold">
                      Loading city projects...
                    </div>
                  ) : (
                    cityProjectsList.map((proj) => {
                      const projKeys = proj.assets.map(
                        (_, i) => `${proj.id}__${i}`,
                      );
                      const selectedCountInProj = projKeys.filter((k) =>
                        selectedFundPicks.has(k),
                      ).length;
                      const allInProjSelected =
                        selectedCountInProj === proj.assets.length &&
                        proj.assets.length > 0;

                      return (
                        <div
                          key={proj.id}
                          className="shrink-0 w-full bg-white border border-slate-200/90 rounded-xl overflow-hidden text-left shadow-2xs hover:border-teal-300/80"
                        >
                          {/* Compact Project Card Header */}
                          <div className="shrink-0 p-2.5 bg-slate-50/80 border-b border-slate-100 flex flex-col gap-1.5">
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="flex flex-col gap-0.5 overflow-hidden">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-teal-700 truncate block">
                                  {proj.loc || "City Project"}
                                </span>
                                <h4 className="text-xs font-bold text-slate-900 m-0 leading-snug truncate block" title={proj.name}>
                                  {proj.name}
                                </h4>
                              </div>
                              <button
                                onClick={() =>
                                  setActiveDetailView({
                                    type: "site",
                                    id: proj.id,
                                  })
                                }
                                className="shrink-0 inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 border border-blue-200/80 transition-colors cursor-pointer"
                              >
                                <span>Details</span>
                                <span className="text-[10px]">→</span>
                              </button>
                            </div>

                            <div className="flex items-center justify-between text-[10.5px] pt-1 border-t border-slate-200/60">
                              <button
                                onClick={() => toggleProjectAllAssets(proj)}
                                className={`text-[9.5px] font-bold px-2 py-0.5 rounded transition-colors cursor-pointer border ${allInProjSelected
                                  ? "bg-teal-100 text-teal-800 border-teal-300"
                                  : selectedCountInProj > 0
                                    ? "bg-teal-50 text-teal-700 border-teal-200"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                  }`}
                              >
                                {allInProjSelected
                                  ? "✓ All"
                                  : selectedCountInProj > 0
                                    ? `Sel (${selectedCountInProj}/${proj.assets.length})`
                                    : "Select All"}
                              </button>
                              <span className="font-mono text-[10.5px] font-bold text-slate-800">
                                {rs(proj.total)}
                              </span>
                            </div>
                          </div>

                          {/* Assets & Timelines List */}
                          <div className="p-2 flex flex-col gap-1.5 bg-white">
                            {proj.assets.map((a, idx) => {
                              const key = `${proj.id}__${idx}`;
                              const isSelected = selectedFundPicks.has(key);
                              const isCommitted = committedPicks.has(key);

                              return (
                                <div
                                  key={idx}
                                  onClick={() =>
                                    !isCommitted &&
                                    toggleFundPick(proj.id, idx)
                                  }
                                  className={`shrink-0 p-2 rounded-lg border transition-all duration-150 cursor-pointer flex flex-col gap-1 ${isCommitted
                                    ? "bg-slate-100 border-slate-200 opacity-75 cursor-default"
                                    : isSelected
                                      ? "bg-teal-50/90 border-teal-400 shadow-2xs"
                                      : "bg-slate-50/50 border-slate-200/70 hover:border-teal-300 hover:bg-slate-50"
                                    }`}
                                >
                                  <div className="flex items-start justify-between gap-1.5">
                                    <div className="flex items-start gap-2 overflow-hidden">
                                      <input
                                        type="checkbox"
                                        checked={isSelected || isCommitted}
                                        disabled={isCommitted}
                                        onChange={() =>
                                          !isCommitted &&
                                          toggleFundPick(proj.id, idx)
                                        }
                                        className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 accent-teal-600 cursor-pointer shrink-0"
                                      />
                                      <div className="flex flex-col overflow-hidden">
                                        <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1 flex-wrap leading-tight">
                                          {a.n}
                                          <span
                                            className={`text-[8px] font-extrabold uppercase px-1 py-0.2 rounded ${a.t === "blue"
                                              ? "bg-[#E2EEF4] text-[#1D5E8C]"
                                              : a.t === "green"
                                                ? "bg-[#E7EFDF] text-[#3E6325]"
                                                : "bg-[#E5E9EB] text-[#475760]"
                                              }`}
                                          >
                                            {a.t}
                                          </span>
                                          {isCommitted && (
                                            <span className="text-[8px] font-extrabold uppercase px-1 py-0.2 rounded bg-purple-100 text-purple-700">
                                              Funded
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Timeline & Cost Row */}
                                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100 text-slate-600">
                                    <span className="flex items-center gap-1 font-mono text-slate-500">
                                      <span>⏱️</span>
                                      <strong className="text-slate-700">
                                        {a.timeline && a.timeline !== "—"
                                          ? `${a.timeline} ${/^\d+(\.\d+)?$/.test(String(a.timeline).trim()) ? (parseFloat(a.timeline) === 1 ? "mo" : "mos") : ""}`
                                          : "Planning"}
                                      </strong>
                                    </span>
                                    <span className="font-mono text-[11px] font-bold text-teal-800">
                                      {a.cost > 0 ? rs(a.cost) : "TBD"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Compact Sticky Bottom Action Footer */}
                <div className="shrink-0 p-2.5 bg-white border-t border-slate-200 shadow-md flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 font-semibold">
                      {fundSummary.totalAssets} asset{fundSummary.totalAssets !== 1 ? "s" : ""}
                    </span>
                    <div className="text-right">
                      <strong className="text-xs font-bold font-mono text-teal-800">
                        {rs(fundSummary.totalCost)}
                      </strong>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowFunderModal(true)}
                    disabled={fundSummary.totalAssets === 0}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold text-white transition-all duration-150 cursor-pointer shadow-xs flex items-center justify-center gap-1.5 ${fundSummary.totalAssets === 0
                        ? "bg-slate-300 opacity-60 cursor-not-allowed"
                        : "bg-[#C8743C] hover:bg-[#b8602c] hover:shadow active:scale-[0.99]"
                      }`}
                  >
                    <span>Fund</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}
          {/* Floating Re-Open Button when Deck is Minimized */}
          {showFloodingHotspots && !isRightDeckOpen && (
            <button
              onClick={() => setIsRightDeckOpen(true)}
              className="fixed bottom-6 right-6 z-[500] bg-[#C8743C] text-white px-4 py-2.5 rounded-full font-bold text-xs shadow-lg hover:shadow-xl hover:bg-[#b8602c] transition-all flex items-center gap-2 cursor-pointer border border-white/40 animate-[bounceIn_0.3s_ease-out]"
            >
              <span>🌊 View City Projects &amp; Fund Deck</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">
                {fundSummary.totalAssets} selected
              </span>
            </button>
          )}
    </>
  );
};

export default FundingDeckPanel;
