import React, { useState } from "react";

const TYPE_LABEL = {
  lake: "Lake",
  park: "Park",
  stormdrain: "Road / drain",
  campus: "Campus",
};

const CatchmentProjectsPanel = ({
  catchment,
  hotspotName,
  projects,
  isOpen,
  onClose,
  onReopen,
  onFundSelected,
}) => {
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  if (!catchment) return null;

  const toggleProject = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const fundSelected = () => {
    const ids = projects.map((project) => project.id).filter((id) => selectedIds.has(id));
    if (ids.length && onFundSelected) onFundSelected(ids);
  };

  return (
    <>
      {isOpen && (
        <div className="order-2 lg:order-none lg:col-span-2 xl:col-span-1 bg-white border border-[#C8D7BC] rounded-2xl shadow-sm flex flex-col xl:sticky xl:top-3 xl:max-h-[calc(100vh-24px)] overflow-hidden text-left">
          <div className="shrink-0 p-3.5 border-b border-[#C8D7BC]/70 bg-[#fff7ed]">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#c2410c]">
                  Delineated catchment
                </div>
                <h3 className="text-sm font-extrabold text-[#1F2A24] m-0 mt-1 leading-snug">
                  {catchment.name}
                </h3>
                {hotspotName && (
                  <p className="text-[11px] text-[#6E6455] m-0 mt-1">Hotspot: {hotspotName}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-[#6E6455] hover:text-[#1F2A24] rounded-md px-1.5 py-0.5 text-sm cursor-pointer border-none bg-transparent"
                title="Close catchment projects"
              >
                ✕
              </button>
            </div>
            <p className="text-[11px] text-[#1F2A24] m-0 mt-2">
              {projects.length} citywide project{projects.length === 1 ? "" : "s"} inside this boundary.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar">
            {projects.length === 0 ? (
              <div className="text-xs text-[#6E6455] border border-dashed border-[#C8D7BC] rounded-xl p-4">
                No citywide projects fall inside this catchment yet.
              </div>
            ) : (
              projects.map((project) => {
                const checked = selectedIds.has(project.id);
                const type = TYPE_LABEL[project._raw?.type] || project._raw?.type || "Project";
                return (
                  <label
                    key={project.id}
                    className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 cursor-pointer ${
                      checked ? "bg-teal-50 border-teal-400" : "bg-white border-[#C8D7BC] hover:border-teal-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleProject(project.id)}
                      className="mt-0.5 w-4 h-4 accent-teal-700 cursor-pointer"
                    />
                    <span className="min-w-0">
                      <span className="block text-[10px] font-bold uppercase tracking-wide text-[#347745]">
                        {type}
                      </span>
                      <span className="block text-sm font-bold text-[#1F2A24] leading-snug">{project.name}</span>
                    </span>
                  </label>
                );
              })
            )}
          </div>

          {selectedIds.size > 0 && (
            <div className="shrink-0 p-3 border-t border-[#C8D7BC]/70 bg-white">
              <button
                type="button"
                onClick={fundSelected}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-white border-none bg-[#C8743C] hover:bg-[#b8602c] cursor-pointer"
              >
                Fund the selected Projects
              </button>
            </div>
          )}
        </div>
      )}

      {!isOpen && (
        <button
          type="button"
          onClick={onReopen}
          className="fixed bottom-4 right-4 z-[500] bg-[#c2410c] text-white px-4 py-2.5 rounded-full font-bold text-xs shadow-lg cursor-pointer border-none"
        >
          {projects.length} catchment projects
        </button>
      )}
    </>
  );
};

export default CatchmentProjectsPanel;
