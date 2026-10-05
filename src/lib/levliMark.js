// The Levli droplet artwork, kept in one place: its outline and its colours.
//
// It is drawn as vector shapes everywhere it appears — the launch splash and the
// sign-in screens — so it stays sharp at any size and can never end up as a
// cropped or squashed raster copy. The proportions belong to the artwork itself:
// 64 wide by 104 tall.

/** The droplet outline: a soft point at the top, a round base. */
export const DROPLET_PATH = "M32 2 C32 2 61 44 61 62 A29 29 0 0 1 3 62 C3 44 32 2 32 2 Z";

/** The artwork's own width-to-height ratio, used to size it without distorting. */
export const DROPLET_RATIO = 64 / 104;

/** The mark's indigo gradient: light on the left, deep at the base, white face. */
export const DROPLET_COLORS = {
  light: "#7c7cf5",
  mid: "#4f46e5",
  deep: "#3b35b8",
  face: "#ffffff",
};