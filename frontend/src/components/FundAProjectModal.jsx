import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import wardsList from "@/data/wards_list.json";

const CORPORATIONS = ["North", "South", "East", "West", "Central"];

const PROJECT_TYPES = [
  { id: "park", label: "Park" },
  { id: "lake", label: "Lakes" },
  { id: "road", label: "Roads" },
];

const FundAProjectModal = ({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters = {},
  searchLayerItems = [],
}) => {
  // Initialize selected area (Ward, Corporation, or All)
  const [selectedArea, setSelectedArea] = useState(() => {
    if (currentFilters.selectedArea) {
      return currentFilters.selectedArea;
    }
    return null;
  });

  const [selectedCorps, setSelectedCorps] = useState(() => {
    if (Array.isArray(currentFilters.selectedCorps) && currentFilters.selectedCorps.length > 0) {
      return currentFilters.selectedCorps;
    }
    return [];
  });

  const [selectedTypes, setSelectedTypes] = useState(() => {
    if (Array.isArray(currentFilters.selectedTypes) && currentFilters.selectedTypes.length > 0) {
      return currentFilters.selectedTypes;
    }
    return ["lake"]; // One project type by default
  });

  const [solveFlooding, setSolveFlooding] = useState(() => {
    return currentFilters.solveFlooding !== undefined ? currentFilters.solveFlooding : "yes";
  });

  // Search query & dropdown open state for Area of Interest
  const [areaSearchQuery, setAreaSearchQuery] = useState("");
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const [activeAreaTab, setActiveAreaTab] = useState("all"); // "all" | "wards" | "corps"

  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsAreaDropdownOpen(false);
      }
    };
    if (isAreaDropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isAreaDropdownOpen]);

  // Lock background scrolling and handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Filter wards and corporations based on search query
  const filteredOptions = useMemo(() => {
    const query = areaSearchQuery.trim().toLowerCase();

    // Check if query matches "All of Bengaluru"
    const matchAllBengaluru =
      !query ||
      "all of bengaluru".includes(query) ||
      "all bengaluru".includes(query) ||
      "bengaluru".includes(query) ||
      "bangalore".includes(query) ||
      "entire city".includes(query);

    const showAllBengaluru = (activeAreaTab === "all" || activeAreaTab === "corps") && matchAllBengaluru;

    // Corporations matching query
    const matchedCorps = CORPORATIONS.filter((c) => {
      if (!query) return true;
      return (
        c.toLowerCase().includes(query) ||
        `${c} corporation`.toLowerCase().includes(query)
      );
    });

    // Wards matching query (search in ward name, id, ac, corp)
    const matchedWards = wardsList.filter((w) => {
      if (!query) return true;
      return (
        w.name.toLowerCase().includes(query) ||
        String(w.id).toLowerCase() === query ||
        (w.ac && w.ac.toLowerCase().includes(query)) ||
        (w.corp && w.corp.toLowerCase().includes(query))
      );
    });

    return {
      corps: matchedCorps,
      wards: matchedWards,
      showAllBengaluru,
      hasMatches: showAllBengaluru || matchedCorps.length > 0 || matchedWards.length > 0 || (!query && activeAreaTab !== "wards"),
    };
  }, [areaSearchQuery, activeAreaTab]);

  if (!isOpen || typeof document === "undefined") return null;

  // Handler: Select a specific ward
  const handleSelectWard = (ward) => {
    const matchedItem = (searchLayerItems || []).find((item) => {
      if (item.category !== "ward") return false;
      const itemName = item.name.toLowerCase();
      const targetName = ward.name.toLowerCase();
      const numMatch = ward.id && String(ward.id) === String(item.feature?.properties?.wardId);
      return numMatch || itemName === targetName || itemName.includes(targetName) || targetName.includes(itemName);
    });

    const area = {
      type: "ward",
      id: ward.id,
      name: ward.name,
      ac: ward.ac,
      corp: ward.corp,
      feature: matchedItem?.feature || null,
    };
    setSelectedArea(area);
    setSelectedCorps([]); // Keep empty so corporation layer is not opened
    setIsAreaDropdownOpen(false);
    setAreaSearchQuery("");
  };

  // Handler: Select a corporation
  const handleSelectCorp = (corpName) => {
    const matchedItem = (searchLayerItems || []).find(
      (item) => item.category === "corporation" && item.name.toLowerCase().includes(corpName.toLowerCase())
    );
    const area = {
      type: "corporation",
      name: `${corpName} Corporation`,
      corp: corpName,
      feature: matchedItem?.feature || null,
    };
    setSelectedArea(area);
    setSelectedCorps([corpName]);
    setIsAreaDropdownOpen(false);
    setAreaSearchQuery("");
  };

  // Handler: Select Entire City (All of Bengaluru)
  const handleSelectAllBengaluru = () => {
    const area = {
      type: "all",
      name: "All of Bengaluru",
    };
    setSelectedArea(area);
    setSelectedCorps(["North", "South", "East", "West", "Central"]);
    setIsAreaDropdownOpen(false);
    setAreaSearchQuery("");
  };


  // Toggle project type: keeps at least one selected
  const toggleType = (typeId) => {
    setSelectedTypes((prev) => {
      if (prev.includes(typeId)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        return prev.filter((t) => t !== typeId);
      } else {
        return [...prev, typeId];
      }
    });
  };

  const handleReset = () => {
    setSelectedArea(null);
    setSelectedCorps([]);
    setSelectedTypes(["lake"]);
    setSolveFlooding("yes");
    setAreaSearchQuery("");
    setIsAreaDropdownOpen(false);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    onApplyFilters({
      selectedCorps: selectedCorps.length > 0 ? selectedCorps : ["North", "South", "East", "West", "Central"],
      selectedTypes,
      solveFlooding,
      selectedArea,
    });
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/35 backdrop-blur-xs z-[999999] flex items-center justify-center p-4 overflow-hidden"
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-[#C8D7BC] shadow-xl w-[90vw] max-w-xl max-h-[88vh] flex flex-col overflow-hidden z-[1000000]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fund-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#C8D7BC]/60 flex items-center justify-between bg-white text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#dfebd5]/60 flex items-center justify-center text-[#347745]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div>
              <h2 id="fund-modal-title" className="text-base font-bold text-[#1F2A24] m-0">
                Fund a project
              </h2>
              <p className="text-xs text-[#6E6455] m-0">
                Customize parameters to discover aligned climate projects
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6E6455] hover:text-[#1F2A24] hover:bg-[#dfebd5]/30 transition-colors border-none bg-transparent cursor-pointer text-base"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Body - Questions & Options */}
        <div className="p-6 sm:p-7 overflow-y-auto flex flex-col gap-6 text-left bg-white">
          
          {/* Question 1: Area of Interest with Dropdown Menu & Search Bar */}
          <div className="flex flex-col gap-2.5" ref={dropdownRef}>
            <label className="text-sm font-bold text-[#1F2A24]">
              1. Select your area of interest
            </label>

            {/* Search Input & Dropdown Trigger */}
            <div className="relative">
              <div className="flex items-center bg-white border border-[#C8D7BC] focus-within:border-[#347745] rounded-xl transition-all shadow-xs overflow-hidden">
                <div className="pl-3 pr-1 text-[#6E6455]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search ward (e.g., Yamalur, Agaram) or corporation..."
                  value={areaSearchQuery}
                  onChange={(e) => {
                    setAreaSearchQuery(e.target.value);
                    setIsAreaDropdownOpen(true);
                  }}
                  onFocus={() => setIsAreaDropdownOpen(true)}
                  className="w-full py-2.5 px-2 text-xs outline-none bg-transparent text-[#1F2A24] placeholder:text-[#6E6455]/70 font-medium"
                />
                {areaSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setAreaSearchQuery("")}
                    className="px-2 text-[#6E6455] hover:text-[#1F2A24] text-xs cursor-pointer border-none bg-transparent"
                    title="Clear query"
                  >
                    ✕
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsAreaDropdownOpen((prev) => !prev)}
                  className="px-3 py-2.5 border-l border-[#C8D7BC]/60 text-[#6E6455] hover:text-[#347745] hover:bg-[#dfebd5]/20 transition-colors cursor-pointer border-none bg-transparent flex items-center justify-center"
                  title="Toggle area dropdown"
                >
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${isAreaDropdownOpen ? "rotate-180 text-[#347745]" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Dropdown Menu */}
              {isAreaDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#C8D7BC] rounded-xl shadow-xl z-50 overflow-hidden max-h-64 flex flex-col">
                  {/* Category Filter Tabs */}
                  <div className="p-1.5 bg-[#dfebd5]/20 border-b border-[#C8D7BC]/40 flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setActiveAreaTab("all")}
                      className={`px-2 py-0.5 rounded font-semibold cursor-pointer border-none transition-all ${
                        activeAreaTab === "all" ? "bg-[#347745] text-white shadow-2xs" : "bg-transparent text-[#6E6455] hover:bg-[#dfebd5]/40"
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveAreaTab("wards")}
                      className={`px-2 py-0.5 rounded font-semibold cursor-pointer border-none transition-all ${
                        activeAreaTab === "wards" ? "bg-[#347745] text-white shadow-2xs" : "bg-transparent text-[#6E6455] hover:bg-[#dfebd5]/40"
                      }`}
                    >
                      Wards ({filteredOptions.wards.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveAreaTab("corps")}
                      className={`px-2 py-0.5 rounded font-semibold cursor-pointer border-none transition-all ${
                        activeAreaTab === "corps" ? "bg-[#347745] text-white shadow-2xs" : "bg-transparent text-[#6E6455] hover:bg-[#dfebd5]/40"
                      }`}
                    >
                      Corporations ({filteredOptions.corps.length})
                    </button>
                  </div>

                  {/* Scrollable list of options */}
                  <div className="overflow-y-auto max-h-52 divide-y divide-[#C8D7BC]/20">
                    {/* Entire City Option */}
                    {filteredOptions.showAllBengaluru && (
                      <div
                        onClick={handleSelectAllBengaluru}
                        className={`p-2.5 px-3 flex items-center justify-between cursor-pointer transition-colors hover:bg-[#dfebd5]/30 ${
                          selectedArea?.type === "all" ? "bg-[#dfebd5]/50 font-bold" : ""
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-[#1F2A24]">All of Bengaluru</div>
                          <div className="text-[10px] text-[#6E6455]">Includes all 5 City Corporations & 369 Wards</div>
                        </div>
                        {selectedArea?.type === "all" && (
                          <span className="text-xs text-[#347745] font-bold">✓ Selected</span>
                        )}
                      </div>
                    )}

                    {/* Corporations Group */}
                    {(activeAreaTab === "all" || activeAreaTab === "corps") &&
                      filteredOptions.corps.map((corp) => {
                        const isSelected = selectedArea?.type === "corporation" && selectedArea.corp === corp;
                        return (
                          <div
                            key={corp}
                            onClick={() => handleSelectCorp(corp)}
                            className={`p-2 px-3 flex items-center justify-between cursor-pointer transition-colors hover:bg-[#dfebd5]/30 ${
                              isSelected ? "bg-[#dfebd5]/50 font-bold" : ""
                            }`}
                          >
                            <div>
                              <span className="text-xs font-semibold text-[#1F2A24]">{corp} Corporation</span>
                              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">Zone</span>
                            </div>
                            {isSelected && (
                              <span className="text-xs text-[#347745] font-bold">✓</span>
                            )}
                          </div>
                        );
                      })}

                    {/* Wards Group */}
                    {(activeAreaTab === "all" || activeAreaTab === "wards") &&
                      filteredOptions.wards.slice(0, 60).map((ward) => {
                        const isSelected = selectedArea?.type === "ward" && selectedArea.id === ward.id && selectedArea.name === ward.name;
                        return (
                          <div
                            key={`${ward.id}-${ward.name}`}
                            onClick={() => handleSelectWard(ward)}
                            className={`p-2 px-3 flex items-center justify-between cursor-pointer transition-colors hover:bg-[#dfebd5]/30 ${
                              isSelected ? "bg-[#dfebd5]/50 font-bold" : ""
                            }`}
                          >
                            <div>
                              <div className="text-xs font-semibold text-[#1F2A24]">{ward.name}</div>
                              <div className="text-[10px] text-[#6E6455] flex items-center gap-1.5 mt-0.5">
                                <span className="px-1.5 py-0.2 rounded bg-[#dfebd5]/60 text-[#347745] font-medium">
                                  Ward
                                </span>
                                {ward.ac && <span>• AC: {ward.ac}</span>}
                              </div>
                            </div>
                            {isSelected && (
                              <span className="text-xs text-[#347745] font-bold">✓</span>
                            )}
                          </div>
                        );
                      })}

                    {!filteredOptions.hasMatches && (
                      <div className="p-4 text-center text-xs text-[#6E6455]">
                        No matching wards or areas found. Try another search term.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Area Confirmation Card with Explanation */}
            {selectedArea && (
              <div className="p-2.5 px-3 rounded-xl bg-[#dfebd5]/35 border border-[#C8D7BC]">
                <div className="text-xs font-bold text-[#1F2A24] flex items-center gap-1.5">
                  <span>Selected: {selectedArea.name}</span>
                </div>
                <div className="text-[11px] text-[#4F5E52] mt-0.5">
                  {selectedArea.type === "ward" ? (
                    <span>
                      Selected Ward / Place: <strong>{selectedArea.name}</strong>
                      {selectedArea.ac ? ` • Assembly: ${selectedArea.ac}` : ""}
                    </span>
                  ) : selectedArea.type === "corporation" ? (
                    <span>Covers all projects across {selectedArea.corp} zone</span>
                  ) : (
                    <span>Citywide coverage across all 5 City Corporations</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Question 2: Project Type (1 selected by default, multiple can be selected) */}
          <div className="flex flex-col gap-2.5">
            <label className="text-sm font-bold text-[#1F2A24]">
              2. What type of project do you want to fund?
            </label>
            <div className="grid grid-cols-3 gap-3">
              {PROJECT_TYPES.map((pt) => {
                const isSelected = selectedTypes.includes(pt.id);
                return (
                  <button
                    key={pt.id}
                    type="button"
                    onClick={() => toggleType(pt.id)}
                    className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer text-center ${
                      isSelected
                        ? "bg-[#dfebd5]/50 text-[#347745] border-2 border-[#347745] shadow-xs"
                        : "bg-white text-[#1F2A24] border border-[#C8D7BC] hover:bg-[#dfebd5]/20 hover:border-[#347745]/40"
                    }`}
                  >
                    {pt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question 3: Flooding Contribution */}
          <div className="flex flex-col gap-2.5">
            <label className="text-sm font-bold text-[#1F2A24]">
              3. Do you want to contribute to solving flooding in an area?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSolveFlooding("yes")}
                className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer text-center ${
                  solveFlooding === "yes"
                    ? "bg-[#dfebd5]/50 text-[#347745] border-2 border-[#347745] shadow-xs"
                    : "bg-white text-[#1F2A24] border border-[#C8D7BC] hover:bg-[#dfebd5]/20 hover:border-[#347745]/40"
                }`}
              >
                Yes
              </button>

              <button
                type="button"
                onClick={() => setSolveFlooding("no")}
                className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer text-center ${
                  solveFlooding === "no"
                    ? "bg-[#dfebd5]/50 text-[#347745] border-2 border-[#347745] shadow-xs"
                    : "bg-white text-[#1F2A24] border border-[#C8D7BC] hover:bg-[#dfebd5]/20 hover:border-[#347745]/40"
                }`}
              >
                No
              </button>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#dfebd5]/15 border-t border-[#C8D7BC]/40 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-[#6E6455] hover:text-[#1F2A24] font-medium cursor-pointer border-none bg-transparent transition-colors"
          >
            Reset
          </button>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#6E6455] hover:text-[#1F2A24] hover:bg-[#dfebd5]/30 rounded-lg cursor-pointer border-none bg-transparent transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#3669A9] hover:bg-[#347745] rounded-xl shadow-xs transition-colors cursor-pointer border-none"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FundAProjectModal;

