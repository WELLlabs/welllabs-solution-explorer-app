import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";

/**
 * TourGuide v3 — Interactive Walkthrough with accurate positioning,
 * multi-arrow callouts, live element tracking, and visual parity with design.
 */

const TourContext = createContext(null);

export function TourProvider({ children, steps = [], tourKey = "map-tour-v3", onStepChange, onComplete }) {
  const [stepIndex, setStepIndex] = useState(-1);
  const storageKey = `tour-completed:${tourKey}`;
  const tourStartedRef = useRef(false);

  // Automatically start tour on mount on every page load/refresh for testing
  useEffect(() => {
    if (steps.length > 0) {
      const timer = setTimeout(() => {
        tourStartedRef.current = true;
        setStepIndex(0);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [steps.length]);

  const finish = useCallback(() => {
    setStepIndex(-1);
  }, []);

  const advance = useCallback(() => {
    setStepIndex((curr) => {
      if (curr + 1 >= steps.length) {
        return -1;
      }
      return curr + 1;
    });
  }, [steps.length]);

  const previous = useCallback(() => {
    setStepIndex((curr) => Math.max(0, curr - 1));
  }, []);

  const goTo = useCallback((idx) => {
    if (idx >= 0 && idx < steps.length) {
      setStepIndex(idx);
    }
  }, [steps.length]);

  const start = useCallback(() => {
    tourStartedRef.current = true;
    setStepIndex(0);
  }, []);

  // When tour transitions from running (stepIndex >= 0) to finished (-1), trigger onComplete
  useEffect(() => {
    if (stepIndex >= 0) {
      tourStartedRef.current = true;
    } else if (stepIndex === -1 && tourStartedRef.current) {
      tourStartedRef.current = false;
      if (typeof onComplete === "function") {
        onComplete();
      }
    }
  }, [stepIndex, onComplete]);

  // Trigger step change hook whenever stepIndex changes
  useEffect(() => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      const currentStep = steps[stepIndex];
      if (onStepChange) {
        onStepChange(stepIndex, currentStep);
      }
      if (typeof currentStep?.onEnter === "function") {
        currentStep.onEnter();
      }
    }
  }, [stepIndex, steps, onStepChange]);

  const value = {
    stepIndex,
    steps,
    currentStep: stepIndex >= 0 ? steps[stepIndex] : null,
    advance,
    previous,
    skip: finish,
    start,
    goTo,
    isRunning: stepIndex >= 0 && stepIndex < steps.length,
  };

  return (
    <TourContext.Provider value={value}>
      {children}
      {value.isRunning && <TourOverlay />}
    </TourContext.Provider>
  );
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used inside a TourProvider");
  return ctx;
}

/**
 * Measure DOM rects for the step's targets.
 * Retries and tracks dynamic changes (e.g. accordion animations, map popups).
 */
function useTargetRects(targets) {
  const [rects, setRects] = useState([]);
  const targetsKey = (targets || []).join(",");

  useEffect(() => {
    if (!targets || targets.length === 0) {
      setRects([]);
      return;
    }

    let isMounted = true;

    const measure = () => {
      if (!isMounted) return;
      const found = [];

      for (const targetId of targets) {
        // Try data-tour attribute first
        let el = document.querySelector(`[data-tour="${targetId}"]`);
        // If not found, try as CSS selector directly (e.g. .leaflet-popup)
        if (!el && (targetId.startsWith(".") || targetId.startsWith("#"))) {
          el = document.querySelector(targetId);
        }
        // Fallback: special handler for leaflet popup if targetId is 'project-popup' or 'hotspot-popup'
        if (!el && (targetId === "project-popup" || targetId === "hotspot-popup")) {
          el = document.querySelector(".leaflet-popup");
        }

        if (el) {
          const rect = el.getBoundingClientRect();
          // Verify element is currently visible with non-zero dimensions
          if (rect.width > 0 && rect.height > 0) {
            found.push({
              id: targetId,
              element: el,
              top: rect.top,
              left: rect.left,
              right: rect.right,
              bottom: rect.bottom,
              width: rect.width,
              height: rect.height,
              centerX: rect.left + rect.width / 2,
              centerY: rect.top + rect.height / 2,
            });
          }
        }
      }

      setRects(found);
    };

    // Measure immediately and repeatedly for smooth layout transitions
    measure();
    const intervalId = setInterval(measure, 200);

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [targetsKey, targets]);

  return rects;
}

function TourOverlay() {
  const { stepIndex, steps, advance, skip, previous } = useTour();
  const step = steps[stepIndex];
  const rects = useTargetRects(step?.targets);
  const bubbleRef = useRef(null);

  // Auto-scroll target element into view smoothly wherever it appears (top or bottom)
  useEffect(() => {
    if (!step?.targets || step.targets.length === 0) return;

    const scrollToTarget = () => {
      for (const targetId of step.targets) {
        let el = document.querySelector(`[data-tour="${targetId}"]`);
        if (!el && (targetId.startsWith(".") || targetId.startsWith("#"))) {
          el = document.querySelector(targetId);
        }
        if (!el && (targetId === "project-popup" || targetId === "hotspot-popup")) {
          el = document.querySelector(".leaflet-popup");
        }

        if (el) {
          el.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
          });
          break;
        }
      }
    };

    // Scroll immediately and once more after DOM layout animations/popups settle
    const t1 = setTimeout(scrollToTarget, 80);
    const t2 = setTimeout(scrollToTarget, 300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [stepIndex, step]);

  if (!step) return null;

  const pad = 8;

  // Filter out any enclosing parent container rects if an inner child rect is present
  // (Prevents SVG evenodd fill rule from cancelling out cutout holes)
  const activeRects = rects.filter((rA, idxA) => {
    const isEnclosingAnother = rects.some((rB, idxB) => {
      if (idxA === idxB) return false;
      return (
        rA.left <= rB.left + 5 &&
        rA.top <= rB.top + 5 &&
        rA.right >= rB.right - 5 &&
        rA.bottom >= rB.bottom - 5
      );
    });
    return !isEnclosingAnother;
  });

  const displayRects = activeRects.length > 0 ? activeRects : rects;
  const primaryRect = displayRects[0] || null;
  const placement = step.placement || "right";

  // Build SVG path with cutouts for active elements using evenodd fill rule
  const vw = typeof window !== "undefined" ? window.innerWidth : 1920;
  const vh = typeof window !== "undefined" ? window.innerHeight : 1080;

  let maskPath = `M 0 0 L ${vw} 0 L ${vw} ${vh} L 0 ${vh} Z`;

  displayRects.forEach((r) => {
    const x = Math.max(0, r.left - pad);
    const y = Math.max(0, r.top - pad);
    const w = r.width + pad * 2;
    const h = r.height + pad * 2;
    const radius = 12;

    maskPath += ` M ${x + radius} ${y}` +
      ` h ${w - 2 * radius}` +
      ` a ${radius} ${radius} 0 0 1 ${radius} ${radius}` +
      ` v ${h - 2 * radius}` +
      ` a ${radius} ${radius} 0 0 1 -${radius} ${radius}` +
      ` h -${w - 2 * radius}` +
      ` a ${radius} ${radius} 0 0 1 -${radius} -${radius}` +
      ` v -${h - 2 * radius}` +
      ` a ${radius} ${radius} 0 0 1 ${radius} -${radius} Z`;
  });

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-auto select-none"
      style={{ overflow: "hidden" }}
      onClick={(e) => {
        // Allow clicks strictly inside the speech bubble (Skip, Back, Next, Cancel icon); block everything else
        if (bubbleRef.current && bubbleRef.current.contains(e.target)) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        if (bubbleRef.current && bubbleRef.current.contains(e.target)) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
      }}
      onPointerDown={(e) => {
        if (bubbleRef.current && bubbleRef.current.contains(e.target)) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* Dimmed backdrop SVG with open holes for cutouts */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ width: "100vw", height: "100vh" }}
      >
        <path
          d={maskPath}
          fill="rgba(11, 24, 43, 0.65)"
          fillRule="evenodd"
        />
      </svg>

      {/* Glowing highlight rings around target elements */}
      {displayRects.map((r, i) => (
        <div
          key={i}
          className="absolute rounded-xl pointer-events-none transition-all duration-200"
          style={{
            top: r.top - pad,
            left: r.left - pad,
            width: r.width + pad * 2,
            height: r.height + pad * 2,
            border: "2.5px solid #38bdf8",
            boxShadow: "0 0 16px rgba(56, 189, 248, 0.5), inset 0 0 10px rgba(56, 189, 248, 0.2)",
          }}
        />
      ))}

      {/* The Speech Bubble */}
      <TourBubble
        ref={bubbleRef}
        step={step}
        stepIndex={stepIndex}
        totalSteps={steps.length}
        primaryRect={primaryRect}
        allRects={displayRects}
        placement={placement}
        onAdvance={advance}
        onPrevious={previous}
        onSkip={skip}
      />
    </div>
  );
}

/**
 * Speech Bubble Component matching the visual styling of all provided screenshots.
 */
function TourBubble({
  step,
  stepIndex,
  totalSteps,
  primaryRect,
  allRects,
  placement,
  onAdvance,
  onPrevious,
  onSkip,
}) {
  const bubbleRef = useRef(null);
  const [bubbleHeight, setBubbleHeight] = useState(320);

  // Keep track of bubble height to correctly position the arrow beak
  useEffect(() => {
    if (bubbleRef.current) {
      setBubbleHeight(bubbleRef.current.offsetHeight);
    }
  }, [step]);

  // When multiple targets exist, compute a combined bounding box to center the bubble between them
  let targetBox = primaryRect;
  if (allRects && allRects.length > 1) {
    const minTop = Math.min(...allRects.map((r) => r.top));
    const maxBottom = Math.max(...allRects.map((r) => r.bottom));
    const maxRight = Math.max(...allRects.map((r) => r.right));
    const minLeft = Math.min(...allRects.map((r) => r.left));
    targetBox = {
      top: minTop,
      bottom: maxBottom,
      left: minLeft,
      right: maxRight,
      width: maxRight - minLeft,
      height: maxBottom - minTop,
      centerY: (minTop + maxBottom) / 2,
      centerX: (minLeft + maxRight) / 2,
    };
  }

  // Compute bubble coordinates based on target rect and viewport
  const position = getBubblePosition(targetBox, placement, bubbleHeight);

  // Target center for dynamic tail positioning
  const targetCenterY = targetBox ? targetBox.centerY : window.innerHeight * 0.45;
  const tailTopOffset = Math.max(
    36,
    Math.min(bubbleHeight - 48, targetCenterY - position.top - 18)
  );

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  return (
    <div
      ref={bubbleRef}
      className="absolute pointer-events-auto transition-all duration-300 ease-out animate-[bubbleFadeIn_0.25s_ease-out]"
      style={{
        ...position,
        width: "500px",
        maxWidth: "calc(100vw - 36px)",
        zIndex: 10000,
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes bubbleFadeIn {
              from { opacity: 0; transform: scale(0.96) translateY(6px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
          `,
        }}
      />

      {/* Bubble Container */}
      <div
        className="relative text-white rounded-[32px] p-7 sm:p-8 shadow-2xl text-left"
        style={{
          backgroundColor: "#16345e",
          boxShadow:
            "0 24px 60px -12px rgba(11, 24, 43, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* Dynamic Beak / Tail — renders a beak for each target when multiple targets are highlighted */}
        {allRects && allRects.length > 1 ? (
          allRects.map((r, idx) => {
            const multiTailTop = Math.max(
              28,
              Math.min(bubbleHeight - 52, r.centerY - position.top - 18)
            );
            return (
              <Tail
                key={idx}
                placement={placement}
                topOffset={multiTailTop}
              />
            );
          })
        ) : (
          <Tail placement={placement} topOffset={tailTopOffset} />
        )}

        {/* Top-Right Sky Blue Close Button "X" */}
        <button
          type="button"
          onClick={onSkip}
          aria-label="Close tour"
          className="absolute top-5 right-5 w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white transition-all cursor-pointer border-none shadow-md hover:brightness-110 active:scale-95"
          style={{
            backgroundColor: "#5cb3f9",
            fontSize: "20px",
            lineHeight: 1,
          }}
        >
          ✕
        </button>

        {/* Bubble Title */}
        <h3
          className="text-white font-normal leading-snug tracking-tight mb-4 pr-10"
          style={{
            fontSize: "23px",
            fontFamily:
              'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {step.title}
        </h3>

        {/* Body Paragraphs with Italic font & optional custom pointer arrows */}
        <div className="flex flex-col gap-3 my-4">
          {step.body?.map((item, idx) => {
            const hasArrow = item.arrow === true;
            return (
              <div
                key={idx}
                className="flex items-start gap-2.5 text-[#e1eeff]"
                style={{
                  fontSize: "16px",
                  lineHeight: 1.5,
                  fontStyle: "italic",
                }}
              >
                {hasArrow && (
                  <span
                    aria-hidden="true"
                    className="shrink-0 font-bold text-lg not-italic text-white select-none"
                    style={{ marginTop: "-1px" }}
                  >
                    ←
                  </span>
                )}
                <span>{item.text}</span>
              </div>
            );
          })}
        </div>

        {/* Footer Actions: Skip Button & Next/Advance Controls */}
        <div className="mt-6 pt-3 flex items-center justify-between border-t border-white/10">
          {/* Skip Button (Styled exactly like the screenshots) */}
          <button
            type="button"
            onClick={onSkip}
            className="px-6 py-2 rounded-lg text-white font-semibold transition-all cursor-pointer border-none shadow-sm hover:brightness-110 active:scale-95"
            style={{
              backgroundColor: "#6cb3f8",
              fontSize: "17px",
            }}
          >
            Skip
          </button>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={onPrevious}
                className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all cursor-pointer border-none"
              >
                Back
              </button>
            )}

            <button
              type="button"
              onClick={isLast ? onSkip : onAdvance}
              className="px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all cursor-pointer border-none flex items-center gap-1.5"
            >
              <span>{isLast ? "Finish" : "Next"}</span>
              {!isLast && <span>→</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Speech Bubble Beak / Tail.
 * Dynamically points directly at the target element.
 */
function Tail({ placement, topOffset }) {
  const color = "#16345e";

  if (placement === "left") {
    // Bubble on the left, beak on the right pointing right
    return (
      <div
        className="absolute w-0 h-0 pointer-events-none"
        style={{
          right: -24,
          top: topOffset,
          borderTop: "18px solid transparent",
          borderBottom: "18px solid transparent",
          borderLeft: `24px solid ${color}`,
        }}
      />
    );
  }

  // Default placement: "right" (Bubble on the right, beak on the left pointing left)
  return (
    <div
      className="absolute w-0 h-0 pointer-events-none"
      style={{
        left: -24,
        top: topOffset,
        borderTop: "18px solid transparent",
        borderBottom: "18px solid transparent",
        borderRight: `24px solid ${color}`,
      }}
    />
  );
}

/**
 * Calculate the positioning of the bubble relative to the target element.
 */
function getBubblePosition(rect, placement, bubbleHeight = 320) {
  const gap = 26;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1440;
  const vh = typeof window !== "undefined" ? window.innerHeight : 900;
  const bubbleWidth = 500;

  // Fallback if target rect is not currently found
  if (!rect) {
    return {
      top: Math.max(60, (vh - bubbleHeight) / 2),
      left: Math.max(20, (vw - bubbleWidth) / 2),
    };
  }

  if (placement === "left") {
    const left = Math.max(20, rect.left - bubbleWidth - gap);
    const top = Math.max(20, Math.min(vh - bubbleHeight - 20, rect.centerY - bubbleHeight * 0.4));
    return { top, left };
  }

  // placement === "right" (default)
  let left = rect.right + gap;
  // If placing to the right overflows the screen, shift left
  if (left + bubbleWidth > vw - 20) {
    left = Math.max(20, vw - bubbleWidth - 20);
  }

  const top = Math.max(20, Math.min(vh - bubbleHeight - 20, rect.centerY - bubbleHeight * 0.35));
  return { top, left };
}