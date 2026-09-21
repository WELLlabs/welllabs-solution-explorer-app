import React from "react";
import { createPortal } from "react-dom";
import { rs } from "../NewProjectsView";

const FunderModal = ({
  showFunderModal,
  setShowFunderModal,
  fundSummary,
  selectedFundPicks,
  cityProjectsList,
  funderFormData,
  setFunderFormData,
  setCommittedPicks,
  commitSuccess,
  setCommitSuccess,
}) => {
  if (!showFunderModal || typeof document === "undefined") return null;

  return createPortal(
              <div
                className="fixed inset-0 bg-slate-900/15 backdrop-blur-[2px] z-[999999] flex items-center justify-center p-4 overflow-hidden"
                style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
                onClick={() => setShowFunderModal(false)}
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                <div
                  className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-[500px] max-h-[85vh] flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out] z-[1000000]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-left">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9.5px] uppercase font-bold tracking-wider text-amber-800 bg-amber-100/80 border border-amber-200 px-2 py-0.5 rounded">
                          CSR Term Sheet
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1 mb-0">
                        Commit Funding for Flood Mitigation
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 mb-0">
                        Selected {fundSummary.totalAssets} asset{fundSummary.totalAssets !== 1 ? "s" : ""} across {fundSummary.projectsCount} project{fundSummary.projectsCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowFunderModal(false)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors text-base cursor-pointer border-none bg-transparent"
                      title="Close"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-5 overflow-y-auto flex flex-col gap-3.5 text-left custom-scrollbar">
                    {commitSuccess ? (
                      <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center flex flex-col items-center gap-3">
                        <span className="text-3xl">🎉</span>
                        <h4 className="text-base font-bold text-emerald-900 m-0">
                          Funding Commitment Confirmed!
                        </h4>
                        <p className="text-xs text-emerald-700 leading-relaxed max-w-[380px] m-0">
                          Thank you <strong>{funderFormData.orgName || "Funder"}</strong>! Your commitment of <strong>{rs(fundSummary.totalCost)}</strong> has been recorded for the selected flood mitigation assets.
                        </p>
                        <button
                          onClick={() => {
                            setCommitSuccess(false);
                            setShowFunderModal(false);
                          }}
                          className="mt-2 px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 cursor-pointer border-none transition-colors"
                        >
                          Done
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Selected Summary Card */}
                        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-mono uppercase font-bold text-amber-800">
                              Total Commitment Amount
                            </span>
                            <strong className="text-xl font-bold font-mono text-slate-900">
                              {rs(fundSummary.totalCost)}
                            </strong>
                          </div>
                          <span className="text-xs font-bold text-amber-800 bg-white px-2.5 py-1 rounded-lg border border-amber-200 shadow-2xs">
                            {fundSummary.totalAssets} Asset{fundSummary.totalAssets !== 1 ? "s" : ""}
                          </span>
                        </div>

                        {/* Funder Form */}
                        <div className="flex flex-col gap-3">
                          <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1">
                              Organization / Corporate Name *
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Infosys Foundation, Wipro Cares, Tata Trusts"
                              value={funderFormData.orgName}
                              onChange={(e) =>
                                setFunderFormData({
                                  ...funderFormData,
                                  orgName: e.target.value,
                                })
                              }
                              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-bold text-slate-700 block mb-1">
                                CSR Sector Focus
                              </label>
                              <select
                                value={funderFormData.csrSector}
                                onChange={(e) =>
                                  setFunderFormData({
                                    ...funderFormData,
                                    csrSector: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer"
                              >
                                <option value="Water Security & Flood Mitigation">
                                  Water Security &amp; Flood Mitigation
                                </option>
                                <option value="Climate Resilience & Urban Ecology">
                                  Climate Resilience &amp; Urban Ecology
                                </option>
                                <option value="Schedule VII - Environmental Sustainability">
                                  Schedule VII - Sustainability
                                </option>
                                <option value="Community Infrastructure">
                                  Community Infrastructure
                                </option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-bold text-slate-700 block mb-1">
                                Contact Email *
                              </label>
                              <input
                                type="email"
                                placeholder="csr-lead@company.com"
                                value={funderFormData.email}
                                onChange={(e) =>
                                  setFunderFormData({
                                    ...funderFormData,
                                    email: e.target.value,
                                  })
                                }
                                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* List of Selected Assets */}
                        <div className="flex flex-col gap-1.5 mt-0.5">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Committed Allocation Breakdown:
                          </span>
                          <div className="max-h-[130px] overflow-y-auto border border-slate-200 rounded-xl p-2.5 bg-slate-50 flex flex-col gap-1.5 custom-scrollbar text-xs">
                            {cityProjectsList.map((p) => {
                              const pickedInThisProj = p.assets
                                .map((a, i) => ({ a, i }))
                                .filter(({ i }) =>
                                  selectedFundPicks.has(`${p.id}__${i}`),
                                );

                              if (pickedInThisProj.length === 0) return null;

                              return (
                                <div
                                  key={p.id}
                                  className="p-2 bg-white rounded-lg border border-slate-200 flex flex-col gap-1 shadow-2xs"
                                >
                                  <div className="font-bold text-slate-800 text-[11.5px]">
                                    {p.name}
                                  </div>
                                  {pickedInThisProj.map(({ a, i }) => (
                                    <div
                                      key={i}
                                      className="flex justify-between items-center text-[10.5px] text-slate-600 pl-2"
                                    >
                                      <span>
                                        • {a.n} (⏱️ {a.timeline})
                                      </span>
                                      <span className="font-mono font-bold text-teal-800">
                                        {rs(a.cost)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setShowFunderModal(false)}
                            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer border-none bg-transparent transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCommittedPicks(
                                (prev) =>
                                  new Set([...prev, ...selectedFundPicks]),
                              );
                              setCommitSuccess(true);
                            }}
                            disabled={
                              !funderFormData.orgName.trim() ||
                              !funderFormData.email.trim()
                            }
                            className={`px-5 py-2 text-xs font-bold text-white rounded-xl cursor-pointer transition-all border-none ${!funderFormData.orgName.trim() ||
                                !funderFormData.email.trim()
                                ? "bg-slate-300 cursor-not-allowed"
                                : "bg-[#C8743C] hover:bg-[#b8602c] shadow-xs"
                              }`}
                          >
                            Confirm CSR Funding →
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>,
              document.body
  );
};

export default FunderModal;
