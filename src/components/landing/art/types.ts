/** Props shared by the landing page's inline SVG icons. */
export type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

/** Props for decorative illustrations. */
export type ArtProps = {
  /** Start the one-shot draw-in animation (loops run regardless). */
  playing?: boolean;
};
