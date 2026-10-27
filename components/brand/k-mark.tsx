import { K_PATH, K_TRANSFORM } from "./k-path";
import { cn } from "@/lib/cn";

type Props = {
  /** Rendered width and height in px. */
  size?: number;
  /** Outline draws in, then the glyph fills with gold. */
  animated?: boolean;
  /** Glyph only, no teal tile. */
  bare?: boolean;
  className?: string;
  title?: string;
};

/** The Tarkkash "क" mark: gold Devanagari Ka on a deep-teal tile (same artwork as the favicon). */
export function KMark({ size = 48, animated = false, bare = false, className, title }: Props) {
  return (
    <svg
      viewBox="0 0 128 128"
      width={size}
      height={size}
      className={cn("k-mark", animated && "k-mark-animated", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {!bare && <rect className="k-mark-tile" width="128" height="128" rx="28" fill="#003B3C" />}
      <path
        className="k-mark-glyph"
        transform={K_TRANSFORM}
        d={K_PATH}
        fill="#D9A441"
        stroke="#D9A441"
        strokeWidth={animated ? 1.6 : 0}
        strokeLinejoin="round"
        pathLength={1}
      />
    </svg>
  );
}
