import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

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
}) => {
  // Select only ONE by default, but allow selecting more than one as well (multi-select toggle)
  const [selectedCorps, setSelectedCorps] = useState(() => {
    if (Array.isArray(currentFilters.selectedCorps) && currentFilters.selectedCorps.length > 0) {
      return currentFilters.selectedCorps;
    }
    return ["East"]; // One corporation by default
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

  if (!isOpen || typeof document === "undefined") return null;

  // Toggle corporation: can select multiple, keeps at least one selected
  const toggleCorp = (corp) => {
    setSelectedCorps((prev) => {
      if (prev.includes(corp)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        return prev.filter((c) => c !== corp);
      } else {
        return [...prev, corp];
      }
    });
  };

  // Toggle project type: can select multiple, keeps at least one selected
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
    setSelectedCorps(["East"]);
    setSelectedTypes(["lake"]);
    setSolveFlooding("yes");
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    onApplyFilters({
      selectedCorps,
      selectedTypes,
      solveFlooding,
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
        className="bg-white rounded-2xl border border-[#C8D7BC] shadow-xl w-[90vw] max-w-xl max-h-[85vh] flex flex-col overflow-hidden z-[1000000]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fund-modal-title"
      >
        {/* Header - Styled with project brand palette */}
        <div className="px-6 py-4 border-b border-[#C8D7BC]/60 flex items-center justify-between bg-white text-left">
          <h2 id="fund-modal-title" className="text-base font-bold text-[#1F2A24] m-0">
            Fund a project
          </h2>
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
          
          {/* Question 1: Corporation (1 selected by default, multiple can be selected) */}
          <div className="flex flex-col gap-2.5">
            <label className="text-sm font-bold text-[#1F2A24]">
              1. Which corporation are you interested in?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {CORPORATIONS.map((corp) => {
                const isSelected = selectedCorps.includes(corp);
                return (
                  <button
                    key={corp}
                    type="button"
                    onClick={() => toggleCorp(corp)}
                    className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition-all cursor-pointer text-center ${
                      isSelected
                        ? "bg-[#dfebd5]/50 text-[#347745] border-2 border-[#347745] shadow-xs"
                        : "bg-white text-[#1F2A24] border border-[#C8D7BC] hover:bg-[#dfebd5]/20 hover:border-[#347745]/40"
                    }`}
                  >
                    {corp}
                  </button>
                );
              })}
            </div>
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

          {/* Question 3: Flooding Problem */}
          <div className="flex flex-col gap-2.5">
            <label className="text-sm font-bold text-[#1F2A24]">
              3. Are you looking at solving flooding problem?
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
