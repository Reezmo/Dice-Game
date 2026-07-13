// Central config for the dice system. Designed so new backgrounds and
// variants can be dropped in without reshaping the app.

export type BackgroundId = "glacier" | "club" | "alley";
export type VariantId = "ice" | "neon" | "classic";

export interface DiceSceneConfig {
  background: BackgroundId;
  variant: VariantId;
  diceCount: number; // 1-6
}

export const BACKGROUNDS: Record<BackgroundId, { label: string; description: string }> = {
  glacier: {
    label: "Glacier Hollow",
    description: "A frozen ice cave arena lit by cold blue light.",
  },
  club: {
    label: "Midnight Club",
    description: "A neon-lit lounge table under a spinning disco ball.",
  },
  alley: {
    label: "The Alley",
    description: "A warm wooden bowling-alley lane under hanging lamps.",
  },
};

export const VARIANTS: Record<VariantId, { label: string; description: string }> = {
  ice: {
    label: "Glacier Ice",
    description: "Translucent carved-ice dice with frost-burst impacts.",
  },
  neon: {
    label: "Neon",
    description: "Glowing acrylic dice that crackle with electric light on impact.",
  },
  classic: {
    label: "Classic",
    description: "Traditional white-and-black casino dice with a soft felt-dust landing.",
  },
};

export const DEFAULT_CONFIG: DiceSceneConfig = {
  background: "glacier",
  variant: "ice",
  diceCount: 2,
};

export const MIN_DICE = 1;
export const MAX_DICE = 6;
