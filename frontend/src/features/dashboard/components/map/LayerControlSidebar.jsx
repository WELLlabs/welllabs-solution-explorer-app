import React from "react";
import TourLaunchButton from "./TourLaunchButton";
import { SITE_TYPOLOGY_OPTIONS, INTERVENTION_TYPOLOGY_OPTIONS } from "../../utils/constants";
import { getProjectColor, getWellColor } from "../../utils/projectHelpers";

const LayerControlSidebar = ({
  openSections,
  toggleSection,
  showProjects,
  setShowProjects,
  enableSiteTypologyFilter,
  setEnableSiteTypologyFilter,
  selectedSiteTypologies,
  setSelectedSiteTypologies,
  enableInterventionTypologyFilter,
  setEnableInterventionTypologyFilter,
  selectedInterventionTypologies,
  setSelectedInterventionTypologies,
  showNewFloodRisk,
  setShowNewFloodRisk,
  showFloodingHotspots,
  setShowFloodingHotspots,
  showWells,
  setShowWells,
  browseByCorporations,
  setBrowseByCorporations,
  selectedCorpRegions,
  setSelectedCorpRegions,
  browseByHotspots,
  setBrowseByHotspots,
  selectedHotspotRegions,
  setSelectedHotspotRegions,
  hotspotSearchQuery,
  setHotspotSearchQuery,
  showWards,
  setShowWards,
  showAssemblyConst2,
  setShowAssemblyConst2,
  showBengaluruAssembly,
  setShowBengaluruAssembly,
  showKarnatakaAssembly,
  setShowKarnatakaAssembly,
  showGbaWards,
  setShowGbaWards,
  showGbaCorporations,
  setShowGbaCorporations,
  showValleys,
  setShowValleys,
  showGreenspaces,
  setShowGreenspaces,
  projects,
  wells,
  sitesData,
  filterCounts,
  corpProjectCounts,
  corpFloodCounts,
  filteredHotspotsList,
  handleSelectHotspotFromList,
  loadingAssemblyConst2,
  loadingBengaluruAssembly,
  loadingKarnatakaAssembly,
  loadingGbaWards,
  loadingGbaCorporations,
  loadingValleys,
  loadingGreenspaces,
  loadingFloodHazard,
  loadingFloodingHotspots,
  searchText,
  setSearchText,
  filteredItems,
  handleSelectItem,
  isItemSelected,
  showNewProjects,
  setShowNewProjects,
  setIsRightDeckOpen,
  loading,
}) => {
  return (
            <div className="bg-white border border-[#C8D7BC]/80 rounded-[20px] p-5 flex flex-col gap-4 shadow-sm h-auto">
              {/* Header */}
              <div className="border-b border-[#C8D7BC]/40 pb-2.5 flex items-center justify-between">
                <h5 className="text-xs font-bold text-[#1F2A24] uppercase tracking-wider m-0">
                  Map Exploration Layers
                </h5>
                <TourLaunchButton />
              </div>

              {/* Section 1: What's Happening in the City? */}
              <div data-tour="whats-happening" className="border border-[#C8D7BC]/70 rounded-2xl overflow-hidden bg-white shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleSection("happening")}
                  className="w-full flex items-center justify-between p-3.5 bg-[#C8D7BC]/15 hover:bg-[#C8D7BC]/25 text-left transition-colors cursor-pointer"
                >
                  <span className="text-[13px] font-bold text-[#1F2A24] flex items-center gap-2">
                    <span>What&apos;s Happening in the City?</span>
                  </span>
                  <svg
                    className={`w-4 h-4 text-[#6E6455] transition-transform duration-200 ${openSections.happening ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openSections.happening && (
                  <div data-tour="existing-interventions-full" className="p-3.5 flex flex-col gap-3 border-t border-[#C8D7BC]/40 animate-[slideDown_0.2s_ease-out]">
                    <label data-tour="whats-happening-row" className="flex items-start gap-2.5 text-[13px] font-semibold text-[#1F2A24] cursor-pointer select-none relative text-left">
                      <input
                        type="checkbox"
                        checked={showProjects}
                        onChange={(e) => setShowProjects(e.target.checked)}
                        className="w-4 h-4 rounded border-[#C8D7BC] text-[#3669A9] focus:ring-[#3669A9] accent-[#3669A9] mt-0.5"
                      />
                      <span>
                        Existing Interventions (
                        {showProjects
                          ? `${filteredItems.filter((i) => i.projName !== undefined).length} active`
                          : `${projects.length} total`}
                        )
                      </span>
                    </label>

                    {/* Sub-Filters for Existing Interventions: Two Sub-Layers Only */}
                    {showProjects && (
                      <div className="flex flex-col gap-2.5 pl-2 mt-2 animate-[slideDown_0.2s_ease-out] border-l-2 border-[#C8D7BC] ml-1">
                        {/* 1. Explore by site typology */}
                        <div className="flex flex-col gap-2 p-2.5 bg-[#C8D7BC]/15 rounded-xl border border-[#C8D7BC]/40">
                          <label className="flex items-center justify-between cursor-pointer select-none">
                            <span className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={enableSiteTypologyFilter}
                                onChange={(e) => setEnableSiteTypologyFilter(e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-[#A99E8A] accent-[#347745]"
                              />
                              <span className="text-xs font-bold text-[#1F2A24]">
                                Explore by site typology:
                              </span>
                            </span>
                            {enableSiteTypologyFilter && (
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const allOn = {};
                                    SITE_TYPOLOGY_OPTIONS.forEach((opt) => {
                                      allOn[opt.id] = true;
                                    });
                                    setSelectedSiteTypologies(allOn);
                                  }}
                                  className="text-[#347745] hover:underline cursor-pointer border-none bg-transparent p-0 font-bold"
                                >
                                  All
                                </button>
                                <span className="text-[#A99E8A]">·</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const allOff = {};
                                    SITE_TYPOLOGY_OPTIONS.forEach((opt) => {
                                      allOff[opt.id] = false;
                                    });
                                    setSelectedSiteTypologies(allOff);
                                  }}
                                  className="text-[#6E6455] hover:underline cursor-pointer border-none bg-transparent p-0"
                                >
                                  Clear
                                </button>
                              </div>
                            )}
                          </label>

                          {enableSiteTypologyFilter && (
                            <div className="flex flex-col gap-1.5 pl-5 pt-1 border-t border-[#C8D7BC]/40 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                              {SITE_TYPOLOGY_OPTIONS.map((opt) => (
                                <label
                                  key={opt.id}
                                  className="flex items-center gap-2 text-xs font-semibold text-[#1F2A24] hover:text-black cursor-pointer select-none"
                                >
                                  <input
                                    type="checkbox"
                                    checked={!!selectedSiteTypologies[opt.id]}
                                    onChange={(e) =>
                                      setSelectedSiteTypologies((prev) => ({
                                        ...prev,
                                        [opt.id]: e.target.checked,
                                      }))
                                    }
                                    className="w-3.5 h-3.5 rounded border-[#A99E8A] accent-[#347745]"
                                  />
                                  <span className="leading-tight text-[11px]">
                                    {opt.label} ({filterCounts.siteTypology[opt.id] || 0})
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 2. Explore by intervention typology */}
                        <div className="flex flex-col gap-2 p-2.5 bg-[#C8D7BC]/15 rounded-xl border border-[#C8D7BC]/40">
                          <label className="flex items-center justify-between cursor-pointer select-none">
                            <span className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={enableInterventionTypologyFilter}
                                onChange={(e) => setEnableInterventionTypologyFilter(e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-[#A99E8A] accent-[#3669A9]"
                              />
                              <span className="text-xs font-bold text-[#1F2A24]">
                                Explore by intervention typology:
                              </span>
                            </span>
                            {enableInterventionTypologyFilter && (
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const allOn = {};
                                    INTERVENTION_TYPOLOGY_OPTIONS.forEach((opt) => {
                                      allOn[opt.id] = true;
                                    });
                                    setSelectedInterventionTypologies(allOn);
                                  }}
                                  className="text-[#3669A9] hover:underline cursor-pointer border-none bg-transparent p-0 font-bold"
                                >
                                  All
                                </button>
                                <span className="text-[#A99E8A]">·</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const allOff = {};
                                    INTERVENTION_TYPOLOGY_OPTIONS.forEach((opt) => {
                                      allOff[opt.id] = false;
                                    });
                                    setSelectedInterventionTypologies(allOff);
                                  }}
                                  className="text-[#6E6455] hover:underline cursor-pointer border-none bg-transparent p-0"
                                >
                                  Clear
                                </button>
                              </div>
                            )}
                          </label>

                          {enableInterventionTypologyFilter && (
                            <div className="flex flex-col gap-1.5 pl-5 pt-1 border-t border-[#C8D7BC]/40 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                              {INTERVENTION_TYPOLOGY_OPTIONS.map((opt) => (
                                <label
                                  key={opt.id}
                                  className="flex items-center gap-2 text-xs font-semibold text-[#1F2A24] hover:text-black cursor-pointer select-none"
                                >
                                  <input
                                    type="checkbox"
                                    checked={!!selectedInterventionTypologies[opt.id]}
                                    onChange={(e) =>
                                      setSelectedInterventionTypologies((prev) => ({
                                        ...prev,
                                        [opt.id]: e.target.checked,
                                      }))
                                    }
                                    className="w-3.5 h-3.5 rounded border-[#A99E8A] accent-[#3669A9]"
                                  />
                                  <span className="leading-tight text-[11px]">
                                    {opt.label} ({filterCounts.interventionTypology[opt.id] || 0})
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section 2: Water Risks of the City? */}
              <div data-tour="city-risks" className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleSection("risks")}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50/90 hover:bg-slate-100 text-left transition-colors cursor-pointer"
                >
                  <span className="text-[13px] font-bold text-slate-800 flex items-center gap-2">
                    <span>Water Risks of the City?</span>
                  </span>
                  <svg
                    className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${openSections.risks ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openSections.risks && (
                  <div className="p-3.5 flex flex-col gap-3.5 border-t border-slate-100 animate-[slideDown_0.2s_ease-out]">
                    {/* Flood Risk Map Layer */}
                    <div data-tour="flood-risk-row" className="flex flex-col gap-1.5">
                      <label className="flex items-start gap-2.5 text-[13px] font-semibold text-slate-700 cursor-pointer select-none relative text-left">
                        <input
                          type="checkbox"
                          checked={showNewFloodRisk}
                          onChange={(e) => setShowNewFloodRisk(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 accent-[#ef4444] mt-0.5"
                        />
                        <span>
                          Flood Risk Map{" "}
                          {loadingFloodHazard && (
                            <span className="small-inline-spinner"></span>
                          )}
                        </span>
                      </label>
                      {showNewFloodRisk && (
                        <div className="ml-6 flex flex-col gap-1.5 text-[11px] text-slate-700 font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 shadow-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                            Flood Hazard Index Legend
                          </span>
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-xs bg-[#ef4444] inline-block border border-black/15"></span>{" "}
                              Very High
                            </span>
                            <strong className="font-mono text-[10.5px] text-slate-600">
                              0.543 - 0.667
                            </strong>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-xs bg-[#f97316] inline-block border border-black/15"></span>{" "}
                              High
                            </span>
                            <strong className="font-mono text-[10.5px] text-slate-600">
                              0.497 - 0.543
                            </strong>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-xs bg-[#fde047] inline-block border border-black/15"></span>{" "}
                              Moderate
                            </span>
                            <strong className="font-mono text-[10.5px] text-slate-600">
                              0.456 - 0.497
                            </strong>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-xs bg-[#84cc16] inline-block border border-black/15"></span>{" "}
                              Low
                            </span>
                            <strong className="font-mono text-[10.5px] text-slate-600">
                              0.416 - 0.456
                            </strong>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-xs bg-[#16a34a] inline-block border border-black/15"></span>{" "}
                              Very Low
                            </span>
                            <strong className="font-mono text-[10.5px] text-slate-600">
                              0.000 - 0.416
                            </strong>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Flooding Hotspots (Points) Layer */}
                    <div className="flex flex-col gap-1.5">
                      <label className="flex items-start gap-2.5 text-[13px] font-semibold text-slate-700 cursor-pointer select-none relative text-left">
                        <input
                          type="checkbox"
                          checked={showFloodingHotspots}
                          onChange={(e) => {
                            setShowFloodingHotspots(e.target.checked);
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 accent-[#d97706] mt-0.5"
                        />
                        <span className="flex items-center gap-1.5">
                          <span>
                            Flooding Hotspots{" "}
                            {loadingFloodingHotspots && (
                              <span className="small-inline-spinner"></span>
                            )}
                          </span>
                        </span>
                      </label>
                      {showFloodingHotspots && (
                        <div className="ml-6 flex flex-col gap-1.5 text-[11px] text-slate-700 font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 shadow-xs animate-[slideDown_0.2s_ease-out]">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                            Hotspot Vulnerability Legend
                          </span>
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-full bg-[#dc2626] inline-block border border-white shadow-xs"></span>
                              High Risk Hotspots
                            </span>
                            <strong className="font-mono text-[10.5px] text-slate-600">
                              58 points
                            </strong>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-full bg-[#d97706] inline-block border border-white shadow-xs"></span>
                              Moderate Risk Hotspots
                            </span>
                            <strong className="font-mono text-[10.5px] text-slate-600">
                              143 points
                            </strong>
                          </div>
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                            <span className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-xs border-2 border-dashed border-[#d97706] bg-[#f59e0b]/30 inline-block"></span>
                              Delineated Catchment
                            </span>
                            <span className="text-[10.5px] font-semibold text-slate-600">
                              Borewell Rd
                            </span>
                          </div>
                          <div className="pt-1.5 mt-0.5 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500">
                            <span>Zones Covered:</span>
                            <strong className="text-slate-700">10 Zones</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Ground water risk in the city? */}
              <div data-tour="groundwater-risk-section" className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleSection("groundwater")}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50/90 hover:bg-slate-100 text-left transition-colors cursor-pointer"
                >
                  <span className="text-[13px] font-bold text-slate-800 flex items-center gap-2">
                    <span>Ground water risk in the city?</span>
                  </span>
                  <svg
                    className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${openSections.groundwater ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openSections.groundwater && (
                  <div className="p-3.5 flex flex-col gap-3.5 border-t border-slate-100 animate-[slideDown_0.2s_ease-out]">
                    <div data-tour="groundwater-risk-row" className="flex flex-col gap-1.5">
                      <label className="flex items-start gap-2.5 text-[13px] font-semibold text-slate-700 cursor-pointer select-none relative text-left">
                        <input
                          type="checkbox"
                          checked={showWells}
                          onChange={(e) => setShowWells(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 accent-purple-600 mt-0.5 cursor-pointer"
                        />
                        <span>
                          Ground water risk in the city (
                          {showWells
                            ? `${filteredItems.filter((i) => i.projName === undefined).length} active`
                            : `${wells.length} total`}
                          )
                        </span>
                      </label>
                      {showWells && (
                        <div className="ml-6 flex flex-col gap-1.5 text-[11px] text-slate-700 font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 shadow-xs animate-[slideDown_0.2s_ease-out]">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                            Groundwater Vulnerability Legend
                          </span>
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-xs bg-[#ef4444] inline-block border border-black/15"></span>{" "}
                              Over-Exploited / Critical
                            </span>
                            <strong className="font-mono text-[10.5px] text-slate-600">
                              &gt; 100% Extraction
                            </strong>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-xs bg-[#f59e0b] inline-block border border-black/15"></span>{" "}
                              Semi-Critical
                            </span>
                            <strong className="font-mono text-[10.5px] text-slate-600">
                              70% - 100%
                            </strong>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-xs bg-[#10b981] inline-block border border-black/15"></span>{" "}
                              Safe / Recharge Potential
                            </span>
                            <strong className="font-mono text-[10.5px] text-slate-600">
                              &lt; 70%
                            </strong>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 4: What can we do about it ? */}
              <div data-tour="explore-projects" className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                <button
                  type="button"
                  onClick={() => toggleSection("projects")}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50/90 hover:bg-slate-100 text-left transition-colors cursor-pointer"
                >
                  <span className="text-[13px] font-bold text-slate-800 flex items-center gap-2">
                    <span>Explore Potential Projects?</span>
                  </span>
                  <svg
                    className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${openSections.projects ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openSections.projects && (
                  <div className="p-3.5 flex flex-col gap-3 border-t border-slate-100 animate-[slideDown_0.2s_ease-out]">
                    <label data-tour="citywide-bgg-row" className="flex items-start gap-2.5 text-[13px] font-semibold text-slate-700 cursor-pointer select-none relative text-left">
                      <input
                        type="checkbox"
                        checked={showNewProjects}
                        onChange={(e) => setShowNewProjects(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-[#3b82f6] mt-0.5"
                      />
                      <span>City wide BGG projects</span>
                    </label>
                    {showNewProjects && (
                      <div className="ml-6 flex flex-col gap-1.5 text-[11px] text-slate-700 font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 shadow-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                          Project Types Legend
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-[#3b82f6] inline-block border border-white shadow-xs"></span>
                          <span>Lake Interventions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-[#22c55e] inline-block border border-white shadow-xs"></span>
                          <span>Parks & Green Spaces</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-[#f59e0b] inline-block border border-white shadow-xs"></span>
                          <span>Institutional Campuses</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-[#94a3b8] inline-block border border-white shadow-xs"></span>
                          <span>Stormdrains & Drainage</span>
                        </div>
                      </div>
                    )}

                    {/* 1. Browse by corporations */}
                    <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200/80">
                      <label
                        data-tour="browse-corporations-row"
                        className="flex items-start gap-2.5 text-[13px] font-semibold text-slate-700 hover:text-slate-900 cursor-pointer select-none relative text-left"
                      >
                        <input
                          type="checkbox"
                          checked={browseByCorporations}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setBrowseByCorporations(checked);
                            if (checked) {
                              setSelectedCorpRegions({
                                East: true,
                                West: true,
                                North: true,
                                South: true,
                                Central: true,
                              });
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-[#3b82f6] mt-0.5 cursor-pointer"
                        />
                        <span className="flex-1 flex items-center justify-between">
                          <span>Browse by corporations</span>
                          {browseByCorporations && (
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                              5 Regions
                            </span>
                          )}
                        </span>
                      </label>

                      {browseByCorporations && (
                        <div className="ml-6 flex flex-col gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl animate-[slideDown_0.2s_ease-out]">
                          <div className="flex items-center justify-between pb-1 border-b border-slate-200/70">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Corporation Regions
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedCorpRegions({
                                    East: true,
                                    West: true,
                                    North: true,
                                    South: true,
                                    Central: true,
                                  })
                                }
                                className="text-blue-600 hover:underline cursor-pointer font-bold bg-transparent p-0 border-none"
                              >
                                All
                              </button>
                              <span className="text-slate-400">·</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedCorpRegions({
                                    East: false,
                                    West: false,
                                    North: false,
                                    South: false,
                                    Central: false,
                                  })
                                }
                                className="text-slate-500 hover:underline cursor-pointer bg-transparent p-0 border-none"
                              >
                                Clear
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            {[
                              { key: "East", color: "#2563eb" },
                              { key: "West", color: "#059669" },
                              { key: "North", color: "#7c3aed" },
                              { key: "South", color: "#ea580c" },
                              { key: "Central", color: "#db2777" },
                            ].map((corp) => (
                              <label
                                key={corp.key}
                                className="flex items-center justify-between text-xs font-medium text-slate-700 hover:text-slate-900 cursor-pointer select-none"
                              >
                                <span className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={!!selectedCorpRegions[corp.key]}
                                    onChange={(e) =>
                                      setSelectedCorpRegions((prev) => ({
                                        ...prev,
                                        [corp.key]: e.target.checked,
                                      }))
                                    }
                                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-[#2563eb] cursor-pointer"
                                  />
                                  <span
                                    className="w-3 h-3 rounded-full inline-block shrink-0 border border-black/15 shadow-xs"
                                    style={{ backgroundColor: corp.color }}
                                  ></span>
                                  <span className="text-[11.5px]">{corp.key}</span>
                                </span>
                                <span className="text-[10.5px] font-mono text-slate-400">
                                  {corpProjectCounts[corp.key] || 0} projects
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. Browse by flood hotspot (formerly Browse by issues) */}
                    <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200/80">
                      <label
                        data-tour="browse-issues-row"
                        className="flex items-start gap-2.5 text-[13px] font-semibold text-slate-700 hover:text-slate-900 cursor-pointer select-none relative text-left"
                      >
                        <input
                          type="checkbox"
                          checked={browseByHotspots}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setBrowseByHotspots(checked);
                            if (checked) {
                              setSelectedHotspotRegions({
                                East: true,
                                West: true,
                                North: true,
                                South: true,
                                Central: true,
                              });
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 accent-[#d97706] mt-0.5 cursor-pointer"
                        />
                        <span className="flex-1 flex items-center justify-between">
                          <span>Browse by flood hotspot</span>
                          {browseByHotspots && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                              {filteredHotspotsList.length} Hotspots
                            </span>
                          )}
                        </span>
                      </label>

                      {browseByHotspots && (
                        <div className="ml-6 flex flex-col gap-2.5 p-2.5 bg-amber-50/40 border border-amber-200/80 rounded-xl animate-[slideDown_0.2s_ease-out]">
                          {/* Sub layers: East, West, North, South, Central */}
                          <div className="flex items-center justify-between pb-1 border-b border-amber-200/60">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900/80">
                              Hotspot Regions
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedHotspotRegions({
                                    East: true,
                                    West: true,
                                    North: true,
                                    South: true,
                                    Central: true,
                                  })
                                }
                                className="text-amber-700 hover:underline cursor-pointer font-bold bg-transparent p-0 border-none"
                              >
                                All
                              </button>
                              <span className="text-amber-400">·</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedHotspotRegions({
                                    East: false,
                                    West: false,
                                    North: false,
                                    South: false,
                                    Central: false,
                                  })
                                }
                                className="text-amber-800/60 hover:underline cursor-pointer bg-transparent p-0 border-none"
                              >
                                Clear
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            {[
                              { key: "East", color: "#2563eb" },
                              { key: "West", color: "#059669" },
                              { key: "North", color: "#7c3aed" },
                              { key: "South", color: "#ea580c" },
                              { key: "Central", color: "#db2777" },
                            ].map((corp) => (
                              <label
                                key={corp.key}
                                className="flex items-center justify-between text-xs font-medium text-slate-700 hover:text-slate-900 cursor-pointer select-none"
                              >
                                <span className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={!!selectedHotspotRegions[corp.key]}
                                    onChange={(e) =>
                                      setSelectedHotspotRegions((prev) => ({
                                        ...prev,
                                        [corp.key]: e.target.checked,
                                      }))
                                    }
                                    className="w-3.5 h-3.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500 accent-[#d97706] cursor-pointer"
                                  />
                                  <span
                                    className="w-3 h-3 rounded-full inline-block shrink-0 border border-black/15 shadow-xs"
                                    style={{ backgroundColor: corp.color }}
                                  ></span>
                                  <span className="text-[11.5px]">{corp.key}</span>
                                </span>
                                <span className="text-[10.5px] font-mono text-slate-500">
                                  {corpFloodCounts[corp.key] || 0} pts
                                </span>
                              </label>
                            ))}
                          </div>

                          {/* Hotspots Search Input */}
                          <div className="pt-2 border-t border-amber-200/70 flex flex-col gap-1.5">
                            <div className="relative">
                              <input
                                type="text"
                                value={hotspotSearchQuery}
                                onChange={(e) => setHotspotSearchQuery(e.target.value)}
                                placeholder="Search hotspots by name/zone..."
                                className="w-full text-xs pl-7 pr-6 py-1.5 bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-slate-400"
                              />
                              <svg
                                className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                              </svg>
                              {hotspotSearchQuery && (
                                <button
                                  type="button"
                                  onClick={() => setHotspotSearchQuery("")}
                                  className="absolute right-2 top-1.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent"
                                >
                                  ×
                                </button>
                              )}
                            </div>

                            {/* Hotspots matching list */}
                            <div className="max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-0.5 rounded-lg">
                              {filteredHotspotsList.length === 0 ? (
                                <div className="text-[11px] text-slate-400 italic py-2 text-center bg-white/60 rounded-md border border-dashed border-amber-200">
                                  No matching hotspots found
                                </div>
                              ) : (
                                filteredHotspotsList.map((spot) => {
                                  const isHigh =
                                    spot.vulnerabilityCode === "H" ||
                                    spot.vulnerabilityLevel === "High";
                                  return (
                                    <button
                                      key={spot.id || spot.location}
                                      type="button"
                                      onClick={() => handleSelectHotspotFromList(spot)}
                                      className="flex items-start justify-between gap-1.5 p-1.5 text-left bg-white hover:bg-amber-100/70 border border-amber-100 hover:border-amber-300 rounded-lg transition-colors cursor-pointer group"
                                    >
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-[11.5px] font-semibold text-slate-800 group-hover:text-amber-900 truncate">
                                          {spot.location}
                                        </span>
                                        <span className="text-[10px] text-slate-500 truncate">
                                          {spot.zone || spot.corp}
                                        </span>
                                      </div>
                                      <span
                                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                                          isHigh
                                            ? "bg-red-100 text-red-700"
                                            : "bg-amber-100 text-amber-800"
                                        }`}
                                      >
                                        {isHigh ? "High" : "Mod"}
                                      </span>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Remaining Base and Boundary Layers Openly Below */}
              {/* <div className="pt-2 border-t border-slate-200 flex flex-col gap-3">
                <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider m-0">
                  Additional Base & Boundary Layers
                </h5>

                <label className="flex items-start gap-2.5 text-[13px] font-semibold text-slate-600 cursor-pointer select-none relative text-left">
                  <input
                    type="checkbox"
                    checked={showWells}
                    onChange={(e) => setShowWells(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 accent-purple-600 mt-0.5"
                  />
                  <span>
                    Recharge Wells (
                    {showWells
                      ? `${filteredItems.filter((i) => i.projName === undefined).length} active`
                      : `${wells.length} total`}
                    )
                  </span>
                </label>

                <label className="flex items-start gap-2.5 text-[13px] font-semibold text-slate-600 cursor-pointer select-none relative text-left">
                  <input
                    type="checkbox"
                    checked={showWards}
                    onChange={(e) => setShowWards(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 accent-[#d97706] mt-0.5"
                  />
                  <span>
                    Wards Summary (
                    {
                      Object.keys(
                        wells.concat(projects).reduce((acc, item) => {
                          if (
                            item.wardName &&
                            !item.wardName.toLowerCase().includes("unknown") &&
                            item.wardName.trim() !== ""
                          ) {
                            acc[item.wardName] = true;
                          }
                          return acc;
                        }, {}),
                      ).length
                    }{" "}
                    Wards)
                  </span>
                </label>

                <label className="flex items-start gap-2.5 text-[13px] font-semibold text-slate-600 cursor-pointer select-none relative text-left">
                  <input
                    type="checkbox"
                    checked={showBengaluruAssembly}
                    onChange={(e) => setShowBengaluruAssembly(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-[#3b82f6] mt-0.5"
                  />
                  <span>
                    Bengaluru Assemblies{" "}
                    {loadingBengaluruAssembly && (
                      <span className="small-inline-spinner"></span>
                    )}
                  </span>
                </label>

                <label className="flex items-start gap-2.5 text-[13px] font-semibold text-slate-600 cursor-pointer select-none relative text-left">
                  <input
                    type="checkbox"
                    checked={showKarnatakaAssembly}
                    onChange={(e) => setShowKarnatakaAssembly(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-[#10b981] mt-0.5"
                  />
                  <span>
                    Karnataka Assemblies{" "}
                    {loadingKarnatakaAssembly && (
                      <span className="small-inline-spinner"></span>
                    )}
                  </span>
                </label>

                <label className="flex items-start gap-2.5 text-[13px] font-semibold text-slate-600 cursor-pointer select-none relative text-left">
                  <input
                    type="checkbox"
                    checked={showGbaWards}
                    onChange={(e) => setShowGbaWards(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 accent-[#f43f5e] mt-0.5"
                  />
                  <span>
                    GBA Wards{" "}
                    {loadingGbaWards && (
                      <span className="small-inline-spinner"></span>
                    )}
                  </span>
                </label>

                <label className="flex items-start gap-2.5 text-[13px] font-semibold text-slate-600 cursor-pointer select-none relative text-left">
                  <input
                    type="checkbox"
                    checked={showGbaCorporations}
                    onChange={(e) => setShowGbaCorporations(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500 accent-[#ec4899] mt-0.5"
                  />
                  <span>
                    GBA Corporations{" "}
                    {loadingGbaCorporations && (
                      <span className="small-inline-spinner"></span>
                    )}
                  </span>
                </label>

                <label className="flex items-start gap-2.5 text-[13px] font-semibold text-slate-600 cursor-pointer select-none relative text-left">
                  <input
                    type="checkbox"
                    checked={showValleys}
                    onChange={(e) => setShowValleys(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 accent-[#06b6d4] mt-0.5"
                  />
                  <span>
                    Valleys{" "}
                    {loadingValleys && (
                      <span className="small-inline-spinner"></span>
                    )}
                  </span>
                </label>

                <label className="flex items-start gap-2.5 text-[13px] font-semibold text-slate-600 cursor-pointer select-none relative text-left">
                  <input
                    type="checkbox"
                    checked={showGreenspaces}
                    onChange={(e) => setShowGreenspaces(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500 accent-[#15803d] mt-0.5"
                  />
                  <span>
                    Greenspaces{" "}
                    {loadingGreenspaces && (
                      <span className="small-inline-spinner"></span>
                    )}
                  </span>
                </label>
              </div> */}

              {/* Search Assets inside Selected Layers */}
              <div className="flex flex-col gap-2.5 pt-3 border-slate-200">
                {(showWells || showProjects) && (
                  <>
                    <div className="relative w-full">
                      <svg
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-[2]"
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#64748b"
                        strokeWidth="2.5"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Filter active layer assets..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        disabled={!showWells && !showProjects}
                        className="w-full pl-9 pr-9 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/12 text-slate-900 bg-white transition-all shadow-xs"
                      />
                      {searchText && (
                        <button
                          onClick={() => setSearchText("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-sm text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#64748b",
                        paddingLeft: "2px",
                      }}
                    >
                      Showing {filteredItems.length} of{" "}
                      {wells.length + projects.length} items
                    </div>
                  </>
                )}

                <div className="max-h-52 overflow-y-auto flex flex-col gap-2 custom-scrollbar pr-1">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-6 gap-2 text-slate-500 text-xs">
                      <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
                      <span>Loading GIS assets...</span>
                    </div>
                  ) : !showWells && !showProjects ? null : filteredItems.length === 0 ? (
                    <div className="text-center py-4 px-2 text-slate-400 text-xs font-medium">
                      No matching assets found.
                    </div>
                  ) : (
                    filteredItems.map((item, index) => {
                      const isProj = item.projName !== undefined;
                      const name = isProj ? item.projName : item.wellName;
                      const desc = isProj ? item.status : item.wellType;
                      const color = isProj
                        ? getProjectColor(item.status, item.tags)
                        : getWellColor(item.wellType);

                      return (
                        <div
                          key={item._id || item._mb_row_id || index}
                          className={`flex items-center gap-2.5 p-2.5 bg-slate-50 hover:bg-slate-100/80 border rounded-xl cursor-pointer transition-all duration-200 text-left ${isItemSelected(item) ? "bg-indigo-500/5 border-indigo-500" : "border-slate-100 hover:border-slate-300"}`}
                          onClick={() => handleSelectItem(item)}
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          ></div>
                          <div className="flex flex-col gap-0.5 overflow-hidden w-full">
                            <strong className="text-xs font-bold text-slate-800 truncate block">
                              {name}
                            </strong>
                            <span className="text-[10.5px] text-slate-500 truncate block">
                              {desc || "Open Well"} —{" "}
                              {item.wardName || "Unknown Ward"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
  );
};

export default LayerControlSidebar;
