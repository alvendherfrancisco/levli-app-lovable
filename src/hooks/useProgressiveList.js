import { useCallback, useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// One page of a long list at a time.
//
// A list that renders everything it holds is slow to draw and slow to scroll,
// so every long list in the app draws 20 rows and puts the next 20 in as the
// end of the list comes into view. Nothing is hidden or dropped: the rest of the
// list is simply drawn later, and a search or a filter that shrinks the list
// starts again at the first page.
//
// `items` is the whole list, already in the order it should be shown (newest
// first). `resetKey` is anything that changes what the list holds — the search
// text, the chosen filter — so the list goes back to its first 20 rows.
// ─────────────────────────────────────────────────────────────────────────────

export const LIST_PAGE_SIZE = 20;

export default function useProgressiveList(items, { pageSize = LIST_PAGE_SIZE, resetKey = "" } = {}) {
  const [count, setCount] = useState(pageSize);
  const sentinelRef = useRef(null);

  const total = items.length;
  const shown = Math.min(count, total);
  const visible = shown === total ? items : items.slice(0, shown);
  const hasMore = shown < total;

  const loadMore = useCallback(() => setCount((c) => c + pageSize), [pageSize]);

  // A new search, a new filter or a different list starts at the first page.
  useEffect(() => {
    setCount(pageSize);
  }, [resetKey, pageSize]);

  // The next page comes in while the list is still being scrolled — the marker
  // is watched from well below the fold, so the rows are already there by the
  // time the eye arrives.
  useEffect(() => {
    const marker = sentinelRef.current;
    if (!marker || !hasMore) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setCount((c) => c + pageSize);
      },
      { rootMargin: "240px 0px" },
    );
    observer.observe(marker);
    return () => observer.disconnect();
  }, [hasMore, pageSize, count]);

  return { visible, total, shown, hasMore, loadMore, sentinelRef };
}