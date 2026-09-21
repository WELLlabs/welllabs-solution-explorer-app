import React from "react";
import ThreeDWalkthrough from "./ThreeDWalkthrough";

const ItemDetailsPane = ({ selectedItem, setSelectedItem }) => {
  if (!selectedItem) return null;

  return (
                <div className="min-h-[280px] xl:flex-1 xl:h-0 overflow-y-auto bg-white border border-[#C8D7BC]/80 rounded-[20px] p-6 shadow-sm custom-scrollbar animate-[fadeIn_0.25s_ease-out]">
                  <div className="flex flex-col gap-5">
                    {selectedItem.isCorporation ? (
                      <>
                        <div className="flex justify-between items-start border-b border-slate-100 pb-3.5 flex-wrap gap-3 text-left">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span
                              className="text-[9.5px] font-extrabold tracking-wider px-2.5 py-1 rounded-md uppercase"
                              style={{
                                backgroundColor: (selectedItem.color || "#2563eb") + "18",
                                color: selectedItem.color || "#2563eb",
                              }}
                            >
                              🏛️ GBA CORPORATION
                            </span>
                            <h3 className="text-base font-bold text-slate-800 m-0 grow min-w-[200px] text-left">
                              {selectedItem.name}
                            </h3>
                          </div>
                          <button
                            onClick={() => setSelectedItem(null)}
                            className="text-slate-400 hover:text-slate-700 cursor-pointer border-none bg-transparent text-sm p-1 leading-none"
                            title="Close details"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="flex flex-col gap-4 text-left">
                          <div className="grid grid-cols-2 gap-3.5">
                            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 flex flex-col gap-1 text-left">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
                                🌱 Active Projects
                              </span>
                              <p className="text-xl font-extrabold text-blue-900 m-0">
                                {selectedItem.projectsCount}
                              </p>
                              <span className="text-[10.5px] text-slate-500">
                                City-wide nature-based sites
                              </span>
                            </div>
                            <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-3.5 flex flex-col gap-1 text-left">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
                                🚨 Flood Hotspots
                              </span>
                              <p className="text-xl font-extrabold text-amber-900 m-0">
                                {selectedItem.floodCount}
                              </p>
                              <span className="text-[10.5px] text-slate-500">
                                Vulnerable drainage points
                              </span>
                            </div>
                          </div>

                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex flex-col gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Administrative Zone Info
                            </span>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-slate-400 block text-[10.5px]">Region Zone</span>
                                <strong className="text-slate-700 font-semibold">{selectedItem.zoneName} Zone</strong>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10.5px]">Jurisdiction</span>
                                <strong className="text-slate-700 font-semibold">Greater Bengaluru Authority</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : selectedItem.isHotspot ? (
                      <>
                        <div className="flex justify-between items-start border-b border-slate-100 pb-3.5 flex-wrap gap-3 text-left">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span
                              className={`text-[9.5px] font-extrabold tracking-wider px-2.5 py-1 rounded-md uppercase ${
                                selectedItem.vulnerabilityCode === "H" || selectedItem.vulnerabilityLevel === "High"
                                  ? "bg-red-100 text-red-700 border border-red-200"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {selectedItem.vulnerabilityCode === "H" || selectedItem.vulnerabilityLevel === "High"
                                ? "🚨 HIGH VULNERABILITY HOTSPOT"
                                : "⚠️ MODERATE VULNERABILITY HOTSPOT"}
                            </span>
                            <h3 className="text-base font-bold text-slate-800 m-0 grow min-w-[200px] text-left">
                              {selectedItem.name}
                            </h3>
                          </div>
                          <button
                            onClick={() => setSelectedItem(null)}
                            className="text-slate-400 hover:text-slate-700 cursor-pointer border-none bg-transparent text-sm p-1 leading-none"
                            title="Close details"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="flex flex-col gap-4 text-left">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Zone / Corporation
                              </span>
                              <strong className="text-xs text-slate-800 font-bold">
                                {selectedItem.zone} {selectedItem.corp ? `(${selectedItem.corp})` : ""}
                              </strong>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Coordinates
                              </span>
                              <code className="font-mono text-[11px] text-slate-700 bg-white border border-slate-300 px-2 py-0.5 rounded w-fit">
                                {selectedItem.lat?.toFixed(5)}° N, {selectedItem.lng?.toFixed(5)}° E
                              </code>
                            </div>
                          </div>

                          {selectedItem.remarks && (
                            <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 flex flex-col gap-1 text-left">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
                                📝 Remarks &amp; Site Observations
                              </span>
                              <p className="text-xs font-semibold text-slate-700 m-0 leading-relaxed">
                                {selectedItem.remarks}
                              </p>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                            {selectedItem.vulnerabilityMeasure && (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                  Vulnerability Measure
                                </span>
                                <strong className="text-xs text-slate-700 font-semibold">
                                  {selectedItem.vulnerabilityMeasure}
                                </strong>
                              </div>
                            )}
                            {selectedItem.reducedLevel && (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                  Reduced Level (RL)
                                </span>
                                <strong className="text-xs text-slate-700 font-semibold">
                                  {selectedItem.reducedLevel} m
                                </strong>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    ) : selectedItem.isSiteProject ? (
                      <>
                        <div className="flex justify-between items-start border-b border-slate-100 pb-3.5 flex-wrap gap-3 text-left">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span
                              className="text-[9.5px] font-extrabold tracking-wider px-2.5 py-1 rounded-md uppercase"
                              style={{
                                backgroundColor:
                                  (selectedItem.categoryInfo?.color ||
                                    "#3b82f6") + "18",
                                color:
                                  selectedItem.categoryInfo?.color || "#3b82f6",
                              }}
                            >
                              {selectedItem.categoryInfo?.icon}{" "}
                              {String(selectedItem.type || "SITE").toUpperCase()}
                            </span>
                            <h3 className="text-base font-bold text-slate-800 m-0 grow min-w-[200px] text-left">
                              {selectedItem.name}
                            </h3>
                          </div>
                          <button
                            onClick={() =>
                              window.openSiteDetailInPlace &&
                              window.openSiteDetailInPlace(selectedItem.site_id)
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer border-0"
                          >
                            <span>Open Project Workspace</span>
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <path d="M5 12h14" />
                              <path d="M12 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>

                        <div className="flex flex-col gap-5 text-left">
                          {selectedItem.image_url && (
                            <div className="w-full h-44 sm:h-52 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs relative">
                              <img
                                src={selectedItem.image_url}
                                alt={selectedItem.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  if (e.currentTarget?.parentElement)
                                    e.currentTarget.parentElement.style.display =
                                      "none";
                                }}
                              />
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5 flex flex-col gap-1 text-left">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                                🌱 Site Level Impact
                              </span>
                              <p className="text-xs font-semibold text-slate-700 m-0 leading-relaxed">
                                {selectedItem.site_level_impact ||
                                  "Infiltration & storage modeling."}
                              </p>
                            </div>
                            <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-3.5 flex flex-col gap-1 text-left">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700">
                                🌊 Subcatchment Level Impact
                              </span>
                              <p className="text-xs font-semibold text-slate-700 m-0 leading-relaxed">
                                {selectedItem.subcatchment_level_impact ||
                                  "Subcatchment runoff & infiltration telemetry."}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-3">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                Watershed
                              </span>
                              <strong className="text-xs text-slate-700 font-semibold">
                                {selectedItem.watershed || "—"}
                              </strong>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                Coordinates
                              </span>
                              <code className="font-mono text-[11px] text-slate-700 bg-white border border-slate-300 px-2 py-0.5 rounded w-fit inline-block">
                                {selectedItem.lat?.toFixed(6)}° N,{" "}
                                {selectedItem.lng?.toFixed(6)}° E
                              </code>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                Total Interventions
                              </span>
                              <strong className="text-xs text-blue-600 font-bold">
                                {selectedItem.interventions?.length ||
                                  selectedItem.linked_intervention_ids?.length ||
                                  0}{" "}
                                planned
                              </strong>
                            </div>
                          </div>

                          {((selectedItem.interventions &&
                            selectedItem.interventions.length > 0) ||
                            (selectedItem.linked_intervention_ids &&
                              selectedItem.linked_intervention_ids.length >
                              0)) && (
                              <div className="border-t border-dashed border-slate-200 pt-3 flex flex-col gap-2">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                  Planned Nature-Based Interventions
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {selectedItem.interventions?.length > 0
                                    ? selectedItem.interventions.map((iv, idx) => (
                                      <span
                                        key={idx}
                                        className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200"
                                      >
                                        🔧 {iv.type?.replace(/_/g, " ")}{" "}
                                        {iv.quantity ? `×${iv.quantity}` : ""}
                                      </span>
                                    ))
                                    : selectedItem.linked_intervention_ids.map(
                                      (id, idx) => {
                                        const parts = id.split("__");
                                        const typeName = parts[1]
                                          ? parts[1].replace(/_/g, " ")
                                          : id;
                                        return (
                                          <span
                                            key={idx}
                                            className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200"
                                          >
                                            🔧 {typeName}
                                          </span>
                                        );
                                      },
                                    )}
                                </div>
                              </div>
                            )}
                        </div>
                      </>
                    ) : selectedItem.projName !== undefined ? (
                      <>
                        <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 text-left">
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {selectedItem.categoryInfo && (
                                <span
                                  className="text-[9.5px] font-extrabold tracking-wider px-2 py-0.5 rounded-md"
                                  style={{
                                    backgroundColor:
                                      selectedItem.categoryInfo.color + "15",
                                    color: selectedItem.categoryInfo.color,
                                  }}
                                >
                                  {selectedItem.categoryInfo.icon}{" "}
                                  {selectedItem.categoryInfo.name.toUpperCase()}
                                </span>
                              )}
                              {selectedItem.siteTypeInfo && (
                                <span className="text-[9.5px] font-extrabold tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {selectedItem.siteTypeInfo.icon}{" "}
                                  {selectedItem.siteTypeInfo.name}
                                </span>
                              )}
                              {selectedItem.interventionTypologyInfo && (
                                <span className="text-[9.5px] font-extrabold tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                  {selectedItem.interventionTypologyInfo.icon}{" "}
                                  {selectedItem.interventionTypologyInfo.name}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${selectedItem.status?.toLowerCase().includes("completed") ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-indigo-500/10 border-indigo-500/20 text-indigo-600"}`}
                              >
                                {selectedItem.status || "Active"}
                              </div>
                              <button
                                onClick={() => setSelectedItem(null)}
                                className="text-slate-400 hover:text-slate-700 cursor-pointer border-none bg-transparent text-sm p-1 leading-none"
                                title="Close details"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 m-0 leading-snug">
                            {selectedItem.projName}
                          </h3>
                        </div>

                        <div className="flex flex-col gap-5 text-left">
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Project Lead
                              </span>
                              <strong className="text-xs font-bold text-slate-700">
                                {selectedItem.projLead || "Not specified"}
                              </strong>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Budget
                              </span>
                              <strong className="text-xs font-bold text-slate-700">
                                {selectedItem.budget || "Not specified"}
                              </strong>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Timeline
                              </span>
                              <strong className="text-xs font-bold text-slate-700">
                                {selectedItem.timeline || "Not specified"}
                              </strong>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Area / Catchment
                              </span>
                              <strong className="text-xs font-bold text-slate-700">
                                {selectedItem.areaCatchment || "Not specified"}
                              </strong>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Drain Length
                              </span>
                              <strong className="text-xs font-bold text-slate-700">
                                {selectedItem.drainLength || "Not specified"}
                              </strong>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Tags
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {(selectedItem.tags || "Rejuvenation")
                                  .split(",")
                                  .map((t, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                                    >
                                      {t.trim()}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-dashed border-slate-200 pt-4">
                            <h5 className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-2.5">
                              📍 Geographic Telemetry
                            </h5>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-slate-400 font-bold">
                                  Ward Name
                                </span>
                                <strong className="text-xs text-slate-700 font-bold">
                                  {selectedItem.wardName || "Unknown Ward"}{" "}
                                  {selectedItem.wardNameKn
                                    ? `(${selectedItem.wardNameKn})`
                                    : ""}
                                </strong>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-slate-400 font-bold">
                                  Corporation
                                </span>
                                <strong className="text-xs text-slate-700 font-bold">
                                  {selectedItem.corporation ||
                                    "Unknown Corporation"}
                                </strong>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-slate-400 font-bold">
                                  Coordinates
                                </span>
                                <code className="font-mono text-[11px] text-slate-700 bg-white border border-slate-300 px-2 py-1 rounded w-fit inline-block">
                                  {selectedItem.lat.toFixed(6)}° N,{" "}
                                  {selectedItem.lng.toFixed(6)}° E
                                </code>
                              </div>
                              {selectedItem.wardId && (
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] text-slate-400 font-bold">
                                    Ward ID
                                  </span>
                                  <strong className="text-xs text-slate-700 font-bold">
                                    {selectedItem.wardId}
                                  </strong>
                                </div>
                              )}
                              {selectedItem.ac && (
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] text-slate-400 font-bold">
                                    Assembly Constituency
                                  </span>
                                  <strong className="text-xs text-slate-700 font-bold">
                                    {selectedItem.ac}{" "}
                                    {selectedItem.acKn
                                      ? `(${selectedItem.acKn})`
                                      : ""}
                                  </strong>
                                </div>
                              )}
                            </div>
                          </div>

                          {selectedItem.mediaLink &&
                            selectedItem.mediaLink.trim() !== "" && (
                              <a
                                href={selectedItem.mediaLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center bg-slate-50 border border-slate-300 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-100 hover:border-slate-400 hover:text-slate-900 hover:-translate-y-0.5 transition-all duration-200 self-start no-underline"
                              >
                                Read Case Report / Media Coverage
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  style={{ marginLeft: "6px" }}
                                >
                                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                  <polyline points="15 3 21 3 21 9" />
                                  <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                              </a>
                            )}

                          {/* 3D Walkthrough Simulator Section */}
                          {[
                            "kadugodi_park",
                            "hoodi_lake",
                            "sheelavanthakere_lake",
                          ].includes(selectedItem.id) && (
                              <div className="mt-5 border-t border-dashed border-slate-200 pt-4 text-left">
                                <h5 className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                                  🎮 Interactive 3D Walkthrough Simulator
                                </h5>
                                <p
                                  style={{
                                    fontSize: "11.5px",
                                    color: "#64748b",
                                    marginBottom: "12px",
                                    margin: "0 0 12px 0",
                                  }}
                                >
                                  Simulate stormwater storage & infiltration by
                                  toggling individual watershed assets.
                                </p>
                                <ThreeDWalkthrough project={selectedItem} />
                              </div>
                            )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-2 text-left">
                          <span className="text-[9px] font-extrabold tracking-wider px-2 py-1 rounded-md bg-purple-500/10 text-purple-500">
                            GROUND WELL
                          </span>
                          <h3 className="text-base font-bold text-slate-800 m-0 grow min-w-[200px] text-left">
                            {selectedItem.wellName}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                              {selectedItem.wellType || "Open Well"}
                            </span>
                            <button
                              onClick={() => setSelectedItem(null)}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer border-none bg-transparent text-sm p-1 leading-none"
                              title="Close details"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col gap-5 text-left">
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Owner Name
                              </span>
                              <strong className="text-xs font-bold text-slate-700">
                                {selectedItem.ownerName || "Not specified"}
                              </strong>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Lining Material
                              </span>
                              <strong className="text-xs font-bold text-slate-700">
                                {selectedItem.lining || "Not specified"}
                              </strong>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Diameter
                              </span>
                              <strong className="text-xs font-bold text-slate-700">
                                {selectedItem.diameterFt
                                  ? `${selectedItem.diameterFt} Ft`
                                  : "Not specified"}
                              </strong>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Well Depth
                              </span>
                              <strong className="text-xs font-bold text-slate-700">
                                {selectedItem.depthFt
                                  ? `${selectedItem.depthFt} Ft`
                                  : "Not specified"}
                              </strong>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                Water Level
                              </span>
                              <strong className="text-xs font-bold text-slate-700">
                                {selectedItem.waterLevelFt
                                  ? `${selectedItem.waterLevelFt} Ft`
                                  : "Not specified"}
                              </strong>
                            </div>
                          </div>

                          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3">
                            <h5 className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider m-0">
                              🧪 Hydrochemistry & Quality
                            </h5>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-slate-400 font-bold">
                                  pH Level
                                </span>
                                <strong className="text-sm text-slate-800 font-extrabold">
                                  {selectedItem.ph !== null &&
                                    selectedItem.ph !== undefined
                                    ? selectedItem.ph
                                    : "—"}
                                </strong>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-slate-400 font-bold">
                                  TDS (ppm)
                                </span>
                                <strong className="text-sm text-slate-800 font-extrabold">
                                  {selectedItem.tds !== null &&
                                    selectedItem.tds !== undefined
                                    ? selectedItem.tds
                                    : "—"}
                                </strong>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-slate-400 font-bold">
                                  Salinity
                                </span>
                                <strong className="text-sm text-slate-800 font-extrabold">
                                  {selectedItem.salinity !== null &&
                                    selectedItem.salinity !== undefined
                                    ? selectedItem.salinity
                                    : "—"}
                                </strong>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-slate-400 font-bold">
                                  Fluoride
                                </span>
                                <span
                                  className={`text-[10px] font-bold self-start px-1.5 py-0.5 rounded ${selectedItem.hasFluoride?.toLowerCase() === "true" ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"}`}
                                >
                                  {selectedItem.hasFluoride?.toLowerCase() ===
                                    "true"
                                    ? "Detected"
                                    : "Safe"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-dashed border-slate-200 pt-4">
                            <h5 className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-2.5">
                              📍 Geographic Telemetry
                            </h5>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-slate-400 font-bold">
                                  Ward Name
                                </span>
                                <strong className="text-xs text-slate-700 font-bold">
                                  {selectedItem.wardName || "Unknown Ward"}{" "}
                                  {selectedItem.wardNameKn
                                    ? `(${selectedItem.wardNameKn})`
                                    : ""}
                                </strong>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-slate-400 font-bold">
                                  Corporation
                                </span>
                                <strong className="text-xs text-slate-700 font-bold">
                                  {selectedItem.corporation ||
                                    "Unknown Corporation"}
                                </strong>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-slate-400 font-bold">
                                  Coordinates
                                </span>
                                <code className="font-mono text-[11px] text-slate-700 bg-white border border-slate-300 px-2 py-1 rounded w-fit inline-block">
                                  {selectedItem.lat.toFixed(6)}° N,{" "}
                                  {selectedItem.lng.toFixed(6)}° E
                                </code>
                              </div>
                              {selectedItem.wardId && (
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] text-slate-400 font-bold">
                                    Ward ID
                                  </span>
                                  <strong className="text-xs text-slate-700 font-bold">
                                    {selectedItem.wardId}
                                  </strong>
                                </div>
                              )}
                              {selectedItem.ac && (
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] text-slate-400 font-bold">
                                    Assembly Constituency
                                  </span>
                                  <strong className="text-xs text-slate-700 font-bold">
                                    {selectedItem.ac}{" "}
                                    {selectedItem.acKn
                                      ? `(${selectedItem.acKn})`
                                      : ""}
                                  </strong>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
  );
};

export default ItemDetailsPane;
