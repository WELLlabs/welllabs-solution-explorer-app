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
  openLabel = "Open project workspace",
  extraActions = [],
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

  const selectAll = () => setSelectedIds(new Set(projects.map((project) => project.id)));
  const clearAll = () => setSelectedIds(new Set());

  const fundSelected = () => {
    const ids = projects.map((project) => project.id).filter((id) => selectedIds.has(id));
    if (ids.length && onFundSelected) onFundSelected(ids);
  };

  return (
    <>
      {isOpen && (
        <div className="order-2 lg:order-none lg:col-span-2 xl:col-span-1 bg-white border border-[#C8D7BC] rounded-2xl shadow-[0_10px_30px_-12px_rgba(31,42,36,0.22)] flex flex-col xl:sticky xl:top-3 xl:max-h-[calc(100vh-24px)] overflow-hidden text-left">
          {/* Brand accent strip */}
          <div className="h-1 shrink-0 bg-gradient-to-r from-[#3669A9] via-[#6D9EC9] to-[#347745]" />

          {/* ───────── Header ───────── */}
          <div className="shrink-0 px-4 pt-3.5 pb-3 border-b border-[#C8D7BC]/70 bg-[#dfebd5]/40">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#347745]/10 text-[#347745]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 17c2.5-4 4.5-9 9-9s6.5 5 9 9" />
                  <path d="M3 21h18" />
                  <path d="M12 8V3" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#347745]">
                  Delineated catchment
                </div>
                <h3 className="text-[15px] font-extrabold text-[#1F2A24] m-0 mt-0.5 leading-snug">
                  {catchment.name}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {hotspotName && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#C8D7BC] bg-white px-2 py-0.5 text-[10.5px] font-semibold text-[#6E6455]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#F2C230]" />
                      Hotspot: {hotspotName}
                    </span>
                  )}
                  <span className="inline-flex items-center rounded-full bg-[#3669A9]/10 px-2 py-0.5 text-[10.5px] font-bold text-[#3669A9]">
                    {projects.length} citywide project{projects.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-[#6E6455] transition-colors hover:bg-[#dfebd5] hover:text-[#1F2A24]"
                title="Close catchment projects"
                aria-label="Close catchment projects"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* ───────── Project list ───────── */}
          {projects.length > 0 && (
            <div className="shrink-0 flex items-center justify-between px-4 pt-3 pb-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6E6455]">
                Select projects to compare
              </span>
              <div className="flex items-center gap-2 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={selectAll}
                  className="cursor-pointer border-none bg-transparent p-0 text-[#3669A9] hover:text-[#347745]"
                >
                  Select all
                </button>
                <span className="text-[#C8D7BC]">|</span>
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={selectedIds.size === 0}
                  className="cursor-pointer border-none bg-transparent p-0 text-[#6E6455] hover:text-[#1F2A24] disabled:cursor-default disabled:opacity-40"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 pt-1.5 flex flex-col gap-2 custom-scrollbar">
            {projects.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-[#C8D7BC] bg-[#f3f8ef]/60 px-4 py-6 text-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6E6455" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 2.7c3.6 4.4 6 7.4 6 10.6a6 6 0 0 1-12 0c0-3.2 2.4-6.2 6-10.6Z" />
                </svg>
                <p className="m-0 text-xs font-semibold text-[#1F2A24]">No projects here yet</p>
                <p className="m-0 text-[11px] text-[#6E6455]">No citywide projects fall inside this catchment.</p>
              </div>
            ) : (
              projects.map((project) => {
                const checked = selectedIds.has(project.id);
                const type = TYPE_LABEL[project._raw?.type] || project._raw?.type || "Project";
                return (
                  <label
                    key={project.id}
                    className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 cursor-pointer transition-all duration-150 ${
                      checked
                        ? "bg-[#dfebd5]/60 border-[#347745] shadow-sm"
                        : "bg-white border-[#C8D7BC] hover:border-[#347745]/60 hover:bg-[#f3f8ef]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleProject(project.id)}
                      className="mt-0.5 w-4 h-4 accent-[#347745] cursor-pointer"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="inline-block rounded bg-[#347745]/10 px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wide text-[#347745]">
                        {type}
                      </span>
                      <span className="mt-1 block text-[13px] font-bold text-[#1F2A24] leading-snug">{project.name}</span>
                    </span>
                    <span className="shrink-0 text-xs font-extrabold text-[#1F2A24] tabular-nums">
                      {rs(Number(project.total) || 0)}
                    </span>
                  </label>
                );
              })
            )}
          </div>

          {/* ───────── Combined impact ───────── */}
          <div className="shrink-0 border-t border-[#C8D7BC]/70 bg-[#f3f8ef] px-4 py-3 text-left">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#347745]">
                Combined impact
              </div>
              <div className="text-[11px] font-bold text-[#1F2A24] tabular-nums">
                {selectedImpacts.length} of {projects.length} selected
              </div>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-[#d7e6cc] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#3669A9] to-[#347745] transition-all duration-300"
                style={{ width: `${share}%` }}
              />
            </div>

            {selectedImpacts.length === 0 ? (
              <p className="text-[11.5px] text-[#6E6455] m-0 mt-2.5 leading-relaxed">
                Select a project to see what it changes in this catchment. Each extra project adds to the total.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-1.5 mt-2.5">
                  <ImpactStat label="Total cost" value={rs(combined.cost)} tone="dark" wide />
                  <ImpactStat label="Infiltration" value={`${formatAmount(combined.infiltrationKl)} KL`} tone="green" />
                  <ImpactStat label="Flood storage" value={`${formatAmount(combined.storageKl)} KL`} tone="blue" />
                  <ImpactStat label="Runoff held back" value={`${formatAmount(combined.runoffMm, 1)} mm`} tone="blue" />
                  <ImpactStat label="Extra infiltration" value={`${formatAmount(combined.infiltrationMm, 1)} mm`} tone="green" />
                  <ImpactStat
                    label="Interventions"
                    value={String(selectedImpacts.reduce((total, item) => total + item.interventions, 0))}
                    tone="neutral"
                    wide={combined.designedKl == null}
                  />
                  {combined.designedKl != null && (
                    <ImpactStat
                      label="Designed capacity"
                      value={`${formatAmount(combined.designedKl, 0)} KL`}
                      tone="neutral"
                    />
                  )}
                </div>

                <div className="mt-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6E6455]">
                  Project breakdown
                </div>
                <div className="mt-1.5 flex flex-col gap-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                  {selectedImpacts.map((item) => (
                    <div key={item.id} className="rounded-lg bg-white border border-[#C8D7BC] border-l-[3px] border-l-[#347745] px-2.5 py-2">
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

          {/* ───────── Actions ───────── */}
          {(selectedIds.size > 0 || extraActions.length > 0) && (
            <div className="shrink-0 px-4 py-3 border-t border-[#C8D7BC]/70 bg-white flex flex-col gap-2">
              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={fundSelected}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-bold tracking-wide text-white border-none bg-[#3669A9] hover:bg-[#347745] active:scale-[0.99] shadow-md shadow-[#3669A9]/25 transition-all cursor-pointer"
                >
                  {openLabel} →
                </button>
              )}
              {extraActions.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {extraActions.map(({ label, onClick }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={onClick}
                      className="py-2 px-2.5 rounded-xl text-[11px] font-bold text-[#1F2A24] border border-[#C8D7BC] bg-white hover:bg-[#f3f8ef] hover:border-[#347745]/60 transition-colors cursor-pointer"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!isOpen && (
        <button
          type="button"
          onClick={onReopen}
          className="fixed bottom-4 right-4 z-[500] inline-flex items-center gap-2 bg-[#3669A9] hover:bg-[#347745] text-white pl-3 pr-4 py-2.5 rounded-full font-bold text-xs shadow-lg shadow-[#3669A9]/30 cursor-pointer border-none transition-colors"
        >
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F2C230] px-1 text-[10px] font-extrabold text-[#1F2A24]">
            {projects.length}
          </span>
          catchment projects
        </button>
      )}
    </>
  );
};

const STAT_TONES = {
  dark: { box: "bg-[#347745] border-[#347745]", label: "text-white/75", value: "text-white" },
  green: { box: "bg-white border-[#C8D7BC] border-l-[3px] border-l-[#347745]", label: "text-[#6E6455]", value: "text-[#1F2A24]" },
  blue: { box: "bg-white border-[#C8D7BC] border-l-[3px] border-l-[#3669A9]", label: "text-[#6E6455]", value: "text-[#1F2A24]" },
  neutral: { box: "bg-white border-[#C8D7BC] border-l-[3px] border-l-[#A99E8A]", label: "text-[#6E6455]", value: "text-[#1F2A24]" },
};

function ImpactStat({ label, value, tone = "neutral", wide = false }) {
  const t = STAT_TONES[tone] || STAT_TONES.neutral;
  return (
    <div className={`rounded-lg border px-2.5 py-1.5 ${t.box} ${wide ? "col-span-2" : ""}`}>
      <div className={`text-[9px] font-bold uppercase tracking-wide ${t.label}`}>{label}</div>
      <div className={`text-sm font-extrabold tabular-nums ${t.value}`}>{value}</div>
    </div>
  );
}

export default CatchmentProjectsPanel;