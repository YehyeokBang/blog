interface HorizontalScrollMetrics {
  scrollWidth: number;
  clientWidth: number;
  scrollLeft: number;
}

export function hasHorizontalOverflow({
  scrollWidth,
  clientWidth,
  scrollLeft,
}: HorizontalScrollMetrics): boolean {
  return scrollWidth > clientWidth + scrollLeft + 1;
}
