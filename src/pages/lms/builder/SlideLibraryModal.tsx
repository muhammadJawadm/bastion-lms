/* ============================================================
   SLIDE LIBRARY MODAL — SC Training-style slide picker
   ============================================================ */

import { useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BlockType } from "./types";
import { SLIDE_LIBRARY } from "./types";

interface SlideLibraryModalProps {
  onAdd: (type: BlockType) => void;
  onClose: () => void;
}

const CATEGORY_LABELS = {
  teach: "TEACH",
  quiz: "QUIZ",
  engage: "ENGAGE",
  more: "MORE",
};

// Mini preview thumbnails for each slide type
function SlidePreview({ type }: { type: BlockType }) {
  const previewMap: Record<string, React.ReactNode> = {
    slide_title: (
      <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center gap-1 p-2">
        <div className="w-3/4 h-2 bg-gray-400 rounded" />
        <div className="w-1/2 h-1.5 bg-gray-300 rounded" />
        <div className="w-1/3 h-4 bg-indigo-400 rounded mt-1" />
      </div>
    ),
    slide_bulleted_list: (
      <div className="w-full h-full bg-gray-100 flex flex-col justify-center gap-1 p-3">
        <div className="w-3/4 h-1.5 bg-gray-400 rounded mb-1" />
        {[0.9, 0.7, 0.8].map((w, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
            <div className={`h-1.5 bg-gray-300 rounded`} style={{ width: `${w * 100}%` }} />
          </div>
        ))}
      </div>
    ),
    slide_image: (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
        <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-400" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
        </div>
      </div>
    ),
    slide_video: (
      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-white ml-0.5" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </div>
      </div>
    ),
    slide_file: (
      <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center gap-1">
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-red-400" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/></svg>
        <div className="text-[8px] text-gray-400 font-bold">PDF / FILE</div>
      </div>
    ),
    slide_table: (
      <div className="w-full h-full bg-gray-100 p-2 flex flex-col gap-0.5">
        <div className="flex gap-0.5">
          {[1,1,1].map((_, i) => <div key={i} className="flex-1 h-2 bg-gray-400 rounded-sm" />)}
        </div>
        {[0,1,2].map((r) => (
          <div key={r} className="flex gap-0.5">
            {[1,1,1].map((_, i) => <div key={i} className="flex-1 h-1.5 bg-gray-200 rounded-sm" />)}
          </div>
        ))}
      </div>
    ),
    slide_quote: (
      <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center p-2 gap-1">
        <div className="text-gray-400 text-2xl leading-none">"</div>
        <div className="w-3/4 h-1.5 bg-gray-300 rounded" />
        <div className="w-1/2 h-1.5 bg-gray-300 rounded" />
        <div className="w-1/3 h-1 bg-gray-400 rounded mt-1" />
      </div>
    ),
    slide_comparison: (
      <div className="w-full h-full bg-gray-100 flex gap-1 p-2">
        <div className="flex-1 bg-blue-100 rounded p-1 flex flex-col gap-1">
          <div className="w-full h-1.5 bg-blue-300 rounded" />
          <div className="w-3/4 h-1 bg-blue-200 rounded" />
        </div>
        <div className="flex-1 bg-green-100 rounded p-1 flex flex-col gap-1">
          <div className="w-full h-1.5 bg-green-300 rounded" />
          <div className="w-3/4 h-1 bg-green-200 rounded" />
        </div>
      </div>
    ),
    slide_expandable_list: (
      <div className="w-full h-full bg-gray-100 flex flex-col justify-center gap-1 p-2">
        {[0,1,2].map((i) => (
          <div key={i} className="flex items-center justify-between bg-white rounded px-1.5 py-1">
            <div className="h-1.5 bg-gray-300 rounded w-2/3" />
            <div className="w-2 h-2 text-gray-400">+</div>
          </div>
        ))}
      </div>
    ),
    slide_horizontal_series: (
      <div className="w-full h-full bg-gray-100 flex items-center gap-1 p-2">
        {[0,1,2].map((i) => (
          <div key={i} className="flex-1 bg-white rounded p-1 flex flex-col gap-0.5">
            <div className="w-full h-1.5 bg-gray-300 rounded" />
            <div className="w-3/4 h-1 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    ),
    slide_reveal: (
      <div className="w-full h-full bg-gray-100 flex flex-col justify-center gap-1 p-2">
        <div className="h-1.5 bg-gray-400 rounded w-2/3 mb-1" />
        {[0,1].map((i) => (
          <div key={i} className="bg-indigo-100 rounded px-1.5 py-1 h-4 flex items-center">
            <div className="h-1.5 bg-indigo-300 rounded w-3/4" />
          </div>
        ))}
      </div>
    ),
    slide_scrolling_mix: (
      <div className="w-full h-full bg-gray-100 p-2 flex flex-col gap-1 overflow-hidden">
        <div className="h-1.5 bg-gray-400 rounded w-2/3" />
        <div className="h-8 bg-gray-300 rounded" />
        <div className="h-1.5 bg-gray-300 rounded" />
        <div className="h-1.5 bg-gray-300 rounded w-3/4" />
      </div>
    ),
    slide_scrolling_text: (
      <div className="w-full h-full bg-gray-100 p-2 flex flex-col gap-1">
        {[1, 0.9, 0.8, 0.95, 0.7].map((w, i) => (
          <div key={i} className="h-1.5 bg-gray-300 rounded" style={{ width: `${w * 100}%` }} />
        ))}
      </div>
    ),
    slide_sequence: (
      <div className="w-full h-full bg-gray-100 flex flex-col justify-center gap-1 p-2">
        {[0,1,2].map((i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-indigo-400 flex items-center justify-center text-[7px] text-white font-bold flex-shrink-0">{i+1}</div>
            <div className="h-1.5 bg-gray-300 rounded flex-1" />
          </div>
        ))}
      </div>
    ),
    slide_vertical_series: (
      <div className="w-full h-full bg-gray-100 flex flex-col gap-1 p-2">
        {[0,1,2].map((i) => (
          <div key={i} className="bg-white rounded p-1 flex flex-col gap-0.5">
            <div className="h-1.5 bg-gray-400 rounded w-2/3" />
            <div className="h-1 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    ),
    quiz_multiple_choice: (
      <div className="w-full h-full bg-gray-100 p-2 flex flex-col gap-1">
        <div className="h-1.5 bg-gray-400 rounded w-3/4 mb-1" />
        {[0,1,2,3].map((i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full border-2 border-gray-400 flex-shrink-0" />
            <div className="h-1.5 bg-gray-300 rounded flex-1" />
          </div>
        ))}
      </div>
    ),
    quiz_true_false: (
      <div className="w-full h-full bg-gray-100 p-2 flex flex-col gap-2">
        <div className="h-1.5 bg-gray-400 rounded w-3/4 mb-1" />
        <div className="flex gap-1">
          <div className="flex-1 bg-green-200 rounded py-1.5 flex items-center justify-center text-[8px] font-bold text-green-700">TRUE</div>
          <div className="flex-1 bg-red-200 rounded py-1.5 flex items-center justify-center text-[8px] font-bold text-red-700">FALSE</div>
        </div>
      </div>
    ),
    quiz_match: (
      <div className="w-full h-full bg-gray-100 p-2 flex flex-col gap-1">
        <div className="h-1.5 bg-gray-400 rounded w-1/2 mb-1" />
        {[0,1,2].map((i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="flex-1 h-3 bg-blue-100 rounded" />
            <div className="w-2 text-gray-400 text-[8px]">↔</div>
            <div className="flex-1 h-3 bg-orange-100 rounded" />
          </div>
        ))}
      </div>
    ),
    quiz_numbers: (
      <div className="w-full h-full bg-gray-100 p-2 flex flex-col justify-center gap-2">
        <div className="h-1.5 bg-gray-400 rounded w-3/4" />
        <div className="h-5 bg-white border border-gray-300 rounded flex items-center px-1.5">
          <div className="h-1.5 bg-gray-300 rounded w-1/3" />
        </div>
      </div>
    ),
    quiz_words: (
      <div className="w-full h-full bg-gray-100 p-2 flex flex-col justify-center gap-2">
        <div className="h-1.5 bg-gray-400 rounded w-3/4" />
        <div className="h-5 bg-white border border-gray-300 rounded flex items-center px-1.5">
          <div className="h-1.5 bg-gray-300 rounded w-2/3" />
        </div>
      </div>
    ),
  };

  return (
    <div className="w-full h-full overflow-hidden">
      {previewMap[type] ?? (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <div className="w-6 h-6 bg-gray-300 rounded" />
        </div>
      )}
    </div>
  );
}

export function SlideLibraryModal({ onAdd, onClose }: SlideLibraryModalProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<"teach" | "quiz" | "engage" | "more">("teach");

  const filtered = SLIDE_LIBRARY.filter((item) => {
    const matchCat = item.category === activeCategory;
    const matchSearch = !search || item.label.toLowerCase().includes(search.toLowerCase()) || item.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const allFiltered = search
    ? SLIDE_LIBRARY.filter((item) =>
        item.label.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())
      )
    : filtered;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1f35] rounded-2xl shadow-2xl border border-[#2a2f4a] w-full max-w-4xl max-h-[85vh] flex overflow-hidden">
        {/* Left sidebar */}
        <div className="w-52 border-r border-[#2a2f4a] flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-[#2a2f4a]">
            <h2 className="text-white font-bold text-base">Slide library</h2>
          </div>

          <div className="flex-1 overflow-y-auto py-3 px-2">
            {/* TEACH */}
            <div className="mb-4">
              <p className="text-[#4a5070] text-[10px] font-bold uppercase tracking-widest px-2 mb-1">TEACH</p>
              {(["slide_title", "slide_bulleted_list", "slide_image", "slide_file", "slide_video"] as BlockType[]).map((type) => {
                const item = SLIDE_LIBRARY.find(i => i.type === type);
                if (!item) return null;
                return (
                  <button
                    key={type}
                    onClick={() => setActiveCategory("teach")}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors text-sm",
                      activeCategory === "teach" ? "bg-[#2a2f4a] text-white" : "text-[#8892b0] hover:text-white hover:bg-[#252a45]"
                    )}
                  >
                    <span className="text-xs">{item.label}</span>
                  </button>
                );
              })}
              <button
                onClick={() => setActiveCategory("teach")}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors",
                  activeCategory === "teach" ? "bg-[#5b5fc7] text-white" : "text-[#8892b0] hover:text-white hover:bg-[#252a45]"
                )}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
                <span className="text-xs font-medium">Text</span>
              </button>
              <button
                onClick={() => setActiveCategory("teach")}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors text-[#8892b0] hover:text-white hover:bg-[#252a45]"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                <span className="text-xs font-medium">Image</span>
              </button>
              <button
                onClick={() => setActiveCategory("teach")}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors text-[#8892b0] hover:text-white hover:bg-[#252a45]"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/></svg>
                <span className="text-xs font-medium flex items-center gap-1">File <span className="bg-blue-500 text-white text-[8px] px-1 rounded">New</span></span>
              </button>
              <button
                onClick={() => setActiveCategory("teach")}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors text-[#8892b0] hover:text-white hover:bg-[#252a45]"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                <span className="text-xs font-medium">Video</span>
              </button>
            </div>

            {/* QUIZ */}
            <div className="mb-4">
              <p className="text-[#4a5070] text-[10px] font-bold uppercase tracking-widest px-2 mb-1">QUIZ</p>
              <button
                onClick={() => setActiveCategory("quiz")}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors",
                  activeCategory === "quiz" ? "bg-[#5b5fc7] text-white" : "text-[#8892b0] hover:text-white hover:bg-[#252a45]"
                )}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
                <span className="text-xs font-medium">Create with AI</span>
              </button>
              <button
                onClick={() => setActiveCategory("quiz")}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors",
                  activeCategory === "quiz" ? "bg-[#2a2f4a] text-white" : "text-[#8892b0] hover:text-white hover:bg-[#252a45]"
                )}
              >
                <span className="text-xs">Multiple choice</span>
              </button>
              <button
                onClick={() => setActiveCategory("quiz")}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors text-[#8892b0] hover:text-white hover:bg-[#252a45]"
              >
                <span className="text-xs">Numbers</span>
              </button>
              <button
                onClick={() => setActiveCategory("quiz")}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors text-[#8892b0] hover:text-white hover:bg-[#252a45]"
              >
                <span className="text-xs">Words</span>
              </button>
              <button
                onClick={() => setActiveCategory("quiz")}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors text-[#8892b0] hover:text-white hover:bg-[#252a45]"
              >
                <span className="text-xs">Match</span>
              </button>
            </div>

            {/* MORE */}
            <div>
              <p className="text-[#4a5070] text-[10px] font-bold uppercase tracking-widest px-2 mb-1">MORE</p>
              <button
                onClick={() => setActiveCategory("more")}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors",
                  activeCategory === "more" ? "bg-[#5b5fc7] text-white" : "text-[#8892b0] hover:text-white hover:bg-[#252a45]"
                )}
              >
                <span className="text-xs">Advanced</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-[#2a2f4a]">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5070]" />
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#252a45] border border-[#3a3f5c] rounded-lg pl-8 pr-3 py-2 text-white placeholder-[#4a5070] text-sm focus:outline-none focus:border-[#5b5fc7] transition-colors"
              />
            </div>
            <button onClick={onClose} className="text-[#6b7db3] hover:text-white transition-colors p-1">
              <X size={18} />
            </button>
          </div>

          {/* Slide grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {allFiltered.map((item) => (
                <button
                  key={item.type}
                  onClick={() => { onAdd(item.type); onClose(); }}
                  className="group flex flex-col rounded-xl border border-[#2a2f4a] hover:border-[#5b5fc7] bg-[#252a45] hover:bg-[#2a2f4a] transition-all overflow-hidden text-left"
                >
                  {/* Preview thumbnail */}
                  <div className="h-24 w-full overflow-hidden border-b border-[#2a2f4a]">
                    <SlidePreview type={item.type} />
                  </div>
                  {/* Label */}
                  <div className="p-2.5">
                    <p className="text-white text-xs font-semibold leading-tight">{item.label}</p>
                    <p className="text-[#6b7db3] text-[10px] mt-0.5 leading-tight">{item.description}</p>
                  </div>
                </button>
              ))}
            </div>

            {allFiltered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-[#6b7db3] text-sm">No slides found for "{search}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
