import React from "react";

const MapBoundarySearch = ({
  searchDropdownContainerRef,
  handleLocationSearch,
  selectedSearchCategory,
  setSelectedSearchCategory,
  locationSearchQuery,
  setLocationSearchQuery,
  isSearchDropdownOpen,
  setIsSearchDropdownOpen,
  filteredSearchItems,
  searchLayerItems,
  handleSelectBoundaryItem,
}) => {
  return (
                  <div
                    ref={searchDropdownContainerRef}
                    className="relative max-w-lg w-full sm:w-auto"
                  >
                    <form
                      onSubmit={handleLocationSearch}
                      className="flex items-center bg-slate-50 hover:bg-white focus-within:bg-white border border-slate-300 focus-within:border-indigo-500 rounded-xl transition-all shadow-xs overflow-hidden"
                    >
                      <div className="pl-3 pr-1 text-slate-400">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                      </div>

                      <input
                        type="text"
                        placeholder={
                          selectedSearchCategory === "assembly"
                            ? "Search Bengaluru Assemblies..."
                            : selectedSearchCategory === "ward"
                              ? "Search GBA Wards..."
                              : selectedSearchCategory === "corporation"
                                ? "Search GBA Corporations..."
                                : "Search Assemblies, Wards, Corporations..."
                        }
                        value={locationSearchQuery}
                        onChange={(e) => {
                          setLocationSearchQuery(e.target.value);
                          setIsSearchDropdownOpen(true);
                        }}
                        onFocus={() => setIsSearchDropdownOpen(true)}
                        className="w-full sm:w-72 py-1.5 px-2 text-xs outline-none bg-transparent text-slate-900 placeholder:text-slate-400 font-medium"
                      />

                      {locationSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setLocationSearchQuery("")}
                          className="px-1.5 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      )}

                      {/* Dropdown Toggle Chevron */}
                      <button
                        type="button"
                        onClick={() => setIsSearchDropdownOpen((prev) => !prev)}
                        className="px-2.5 py-2 border-l border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center"
                        title="Select Layer or Boundary"
                      >
                        <svg
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${isSearchDropdownOpen ? "rotate-180 text-indigo-600" : ""}`}
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
                    </form>

                    {/* Dropdown Menu */}
                    {isSearchDropdownOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-full sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-[1050] overflow-hidden animate-[fadeIn_0.15s_ease-out]">
                        {/* Category Filter Tabs */}
                        <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1 overflow-x-auto text-[11px]">
                          <button
                            type="button"
                            onClick={() => setSelectedSearchCategory("all")}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${selectedSearchCategory === "all" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-200/70"}`}
                          >
                            All ({searchLayerItems.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedSearchCategory("assembly")}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${selectedSearchCategory === "assembly" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}
                          >
                            <span>Assembly</span>
                            <span className="opacity-80">
                              (
                              {
                                searchLayerItems.filter(
                                  (i) => i.category === "assembly",
                                ).length
                              }
                              )
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedSearchCategory("ward")}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${selectedSearchCategory === "ward" ? "bg-rose-600 text-white shadow-xs" : "text-slate-600 hover:bg-rose-50 hover:text-rose-700"}`}
                          >
                            <span>Wards</span>
                            <span className="opacity-80">
                              (
                              {
                                searchLayerItems.filter(
                                  (i) => i.category === "ward",
                                ).length
                              }
                              )
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedSearchCategory("corporation")
                            }
                            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${selectedSearchCategory === "corporation" ? "bg-pink-600 text-white shadow-xs" : "text-slate-600 hover:bg-pink-50 hover:text-pink-700"}`}
                          >
                            <span>Corporations</span>
                            <span className="opacity-80">
                              (
                              {
                                searchLayerItems.filter(
                                  (i) => i.category === "corporation",
                                ).length
                              }
                              )
                            </span>
                          </button>
                        </div>

                        {/* Results / Browse List */}
                        <div className="max-h-64 overflow-y-auto custom-scrollbar p-1.5 flex flex-col gap-1 text-left">
                          {filteredSearchItems.length === 0 ? (
                            <div className="py-6 text-center text-xs text-slate-400 font-medium">
                              No matching boundaries found.
                            </div>
                          ) : (
                            filteredSearchItems.map((item) => (
                              <div
                                key={item.id}
                                onClick={() => handleSelectBoundaryItem(item)}
                                className="p-2.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 cursor-pointer transition-colors border border-transparent hover:border-slate-200/80 flex items-center justify-between gap-3 text-left group"
                              >
                                <div className="flex flex-col gap-0.5 overflow-hidden">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded leading-none shrink-0"
                                      style={{
                                        backgroundColor: item.categoryBg,
                                        color: item.categoryColor,
                                        border: `1px solid ${item.categoryBorder}`,
                                      }}
                                    >
                                      {item.categoryLabel}
                                    </span>
                                    <strong className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                                      {item.name}
                                    </strong>
                                  </div>
                                  <span className="text-[10.5px] text-slate-500 truncate pl-0.5">
                                    {item.subtitle}
                                  </span>
                                </div>

                                <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-600 shrink-0 transition-transform group-hover:translate-x-0.5">
                                  →
                                </span>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Footer Info */}
                        <div className="px-3 py-2 bg-slate-50/80 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500 font-medium">
                          <span>
                            Showing {filteredSearchItems.length} boundary items
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsSearchDropdownOpen(false)}
                            className="text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
                          >
                            Close ✕
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
  );
};

export default MapBoundarySearch;
