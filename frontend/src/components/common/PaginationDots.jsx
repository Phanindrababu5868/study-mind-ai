import { memo } from "react";

/**
 * Display-only pagination indicator.
 *
 * Deliberately renders <span> elements, not <button>s — the dots communicate
 * progress but must NOT be a navigation affordance. Callers that need to
 * jump to an arbitrary page should not use this component.
 *
 * `completed` lets a caller distinguish meaningfully-finished steps (e.g.
 * answered quiz questions) from merely-visited ones, without making the
 * dots interactive.
 *
 * For long sequences the dot list is windowed around the current index so
 * a 50-question quiz doesn't render 50 dots and wrap across several lines.
 */
function PaginationDots({
  total,
  current,
  completed = [],
  maxVisible = 12,
  label = "Progress",
}) {
  if (!total || total <= 1) return null;

  // Compute a sliding window centred on `current`, clamped to the ends.
  let start = 0;
  let end = total;

  if (total > maxVisible) {
    const half = Math.floor(maxVisible / 2);
    start = Math.max(0, Math.min(current - half, total - maxVisible));
    end = start + maxVisible;
  }

  const completedSet = new Set(completed);

  return (
    <div
      role="img"
      aria-label={`${label}: step ${current + 1} of ${total}`}
      className="flex items-center justify-center gap-1.5"
    >
      {start > 0 && <span className="text-[10px] text-neutral-400 mr-0.5">…</span>}

      {Array.from({ length: end - start }, (_, offset) => {
        const index = start + offset;
        const isCurrent = index === current;
        const isCompleted = completedSet.has(index);

        return (
          <span
            key={index}
            className={`rounded-full transition-all duration-200 ${
              isCurrent
                ? "w-6 h-2 bg-[#00d492]"
                : isCompleted
                ? "w-2 h-2 bg-[#00d492]/40"
                : "w-2 h-2 bg-neutral-200"
            }`}
          />
        );
      })}

      {end < total && <span className="text-[10px] text-neutral-400 ml-0.5">…</span>}
    </div>
  );
}

export default memo(PaginationDots);
