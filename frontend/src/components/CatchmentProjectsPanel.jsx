import React, { useEffect, useState } from "react";
import { rs } from "./NewProjectsView";

const TYPE_LABEL = {
  lake: "Lake",
  park: "Park",
  stormdrain: "Road / drain",
  campus: "Campus",
};

function firstNumber(text, pattern) {
  const match = String(text || "").match(pattern);
  if (!match) return null;
  const value = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

function metres(value) {
  if (value == null || value === "") return null;
  const parsed = parseFloat(String(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function readImpact(project) {
  const raw = project._raw || {};
  const siteText = raw.site_level_impact || "";
  const subText = raw.subcatchment_level_impact || "";
  const infiltrationKl = firstNumber(siteText, /infiltration of\s+([\d,]+(?:\.\d+)?)\s*kl/i);
  const storageKl = firstNumber(siteText, /storage of\s+([\d,]+(?:\.\d+)?)\s*kl/i);
  const runoff = String(subText).match(/from\s+([\d.]+)\s*mm\s+to\s+([\d.]+)\s*mm/i);
  const infiltrationGain = String(subText).match(/infiltration increased by\s+[\d.]+%\s+from\s+([\d.]+)\s*mm\s+to\s+([\d.]+)\s*mm/i);

  let designedKl = null;
  if (storageKl == null && infiltrationKl == null) {
    let volume = 0;
    let counted = false;
    (raw.interventions || []).forEach((item) => {
      const length = metres(item.details?.length_m);
      const width = metres(item.details?.width_m);
      const depth = metres(item.details?.depth_m);
      const quantity = Number(item.quantity) || 1;
      if (length && width && depth) {
        volume += length * width * depth * quantity;
        counted = true;
      }
    });
    if (counted) designedKl = volume;
  }

  return {
    id: project.id,
    name: project.name,
    type: TYPE_LABEL[raw.type] || raw.type || "Project",
    interventions: (raw.interventions || []).length,
    siteText,
    subText,
    infiltrationKl,
    storageKl,
    runoffMm: runoff ? Math.max(0, Number(runoff[1]) - Number(runoff[2])) : null,
    infiltrationMm: infiltrationGain
      ? Math.max(0, Number(infiltrationGain[2]) - Number(infiltrationGain[1]))
      : null,
    designedKl,
    cost: Number(project.total) || 0,
  };
}

function sumOf(items, key) {
  const values = items.map((item) => item[key]).filter((value) => value != null);
  if (!values.length) return null;
  return values.reduce((total, value) => total + value, 0);
}

function formatAmount(value, digits = 0) {
  if (value == null) return "—";
  return value.toLocaleString("en-IN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: value < 20 && digits > 0 ? 1 : 0,
  });
}

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

  useEffect(() => {
    setSelectedIds(new Set());
  }, [catchment?.id]);

  if (!catchment) return null;

  const selectedImpacts = projects
    .filter((project) => selectedIds.has(project.id))
    .map(readImpact);
  const combined = {
    infiltrationKl: sumOf(selectedImpacts, "infiltrationKl"),
    storageKl: sumOf(selectedImpacts, "storageKl"),
    runoffMm: sumOf(selectedImpacts, "runoffMm"),
    infiltrationMm: sumOf(selectedImpacts, "infiltrationMm"),
    designedKl: sumOf(selectedImpacts, "designedKl"),
    cost: selectedImpacts.reduce((total, item) => total + item.cost, 0),
  };
  const share = projects.length ? Math.round((selectedImpacts.length / projects.length) * 100) : 0;

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
          <div className="shrink-0 p-3.5 border-b border-[#fed7aa]/80 bg-[#fff7ed]">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#f97316]">
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
                    <span className="min-w-0 flex-1">
                      <span className="block text-[10px] font-bold uppercase tracking-wide text-[#347745]">
                        {type}
                      </span>
                      <span className="block text-sm font-bold text-[#1F2A24] leading-snug">{project.name}</span>
                    </span>
                    <span className="shrink-0 text-xs font-extrabold text-[#1F2A24] tabular-nums">
                      {rs(Number(project.total) || 0)}
                    </span>
                  </label>
                );
              })
            )}
          </div>

          <div className="shrink-0 border-t border-[#C8D7BC]/70 bg-[#f3f8ef] p-3 text-left">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#347745]">
                Combined impact
              </div>
              <div className="text-[10px] font-bold text-[#1F2A24]">
                {selectedImpacts.length} of {projects.length} selected
              </div>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-[#d7e6cc] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#347745] transition-all duration-300"
                style={{ width: `${share}%` }}
              />
            </div>

            {selectedImpacts.length === 0 ? (
              <p className="text-[11px] text-[#6E6455] m-0 mt-2 leading-relaxed">
                Select a project to see what it changes in this catchment. Each extra project adds to the total.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  <ImpactStat label="Total cost" value={rs(combined.cost)} wide />
                  <ImpactStat label="Infiltration" value={`${formatAmount(combined.infiltrationKl)} KL`} />
                  <ImpactStat label="Flood storage" value={`${formatAmount(combined.storageKl)} KL`} />
                  <ImpactStat label="Runoff held back" value={`${formatAmount(combined.runoffMm, 1)} mm`} />
                  <ImpactStat label="Extra infiltration" value={`${formatAmount(combined.infiltrationMm, 1)} mm`} />
                  <ImpactStat
                    label="Interventions"
                    value={String(selectedImpacts.reduce((total, item) => total + item.interventions, 0))}
                  />
                  {combined.designedKl != null && (
                    <ImpactStat
                      label="Designed capacity"
                      value={`${formatAmount(combined.designedKl, 0)} KL`}
                      wide
                    />
                  )}
                </div>
                <div className="mt-2 flex flex-col gap-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                  {selectedImpacts.map((item) => (
                    <div key={item.id} className="rounded-lg bg-white border border-[#C8D7BC] px-2.5 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold uppercase tracking-wide text-[#347745]">{item.type}</div>
                          <div className="text-xs font-bold text-[#1F2A24] leading-snug">{item.name}</div>
                        </div>
                        <div className="shrink-0 text-xs font-extrabold text-[#1F2A24] tabular-nums">{rs(item.cost)}</div>
                      </div>
                      <p className="text-[11px] text-[#1F2A24] m-0 mt-1 leading-relaxed">
                        {item.siteText || (item.designedKl != null
                          ? `Designed holding capacity of about ${formatAmount(item.designedKl, 0)} KL from ${item.interventions} intervention${item.interventions === 1 ? "" : "s"}.`
                          : "Impact figures are still being added for this project.")}
                      </p>
                      {item.subText && (
                        <p className="text-[11px] text-[#6E6455] m-0 mt-1 leading-relaxed">{item.subText}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {selectedIds.size > 0 && (
            <div className="shrink-0 p-3 border-t border-[#C8D7BC]/70 bg-white">
              <button
                type="button"
                onClick={fundSelected}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-white border-none bg-[#C8743C] hover:bg-[#b8602c] cursor-pointer"
              >
                Open project workspace
              </button>
            </div>
          )}
        </div>
      )}

      {!isOpen && (
        <button
          type="button"
          onClick={onReopen}
          className="fixed bottom-4 right-4 z-[500] bg-[#f97316] text-white px-4 py-2.5 rounded-full font-bold text-xs shadow-lg cursor-pointer border-none"
        >
          {projects.length} catchment projects
        </button>
      )}
    </>
  );
};

function ImpactStat({ label, value, wide = false }) {
  return (
    <div className={`rounded-lg bg-white border border-[#C8D7BC] px-2 py-1.5 ${wide ? "col-span-2" : ""}`}>
      <div className="text-[9px] font-bold uppercase tracking-wide text-[#6E6455]">{label}</div>
      <div className="text-sm font-extrabold text-[#1F2A24] tabular-nums">{value}</div>
    </div>
  );
}

export default CatchmentProjectsPanel;
