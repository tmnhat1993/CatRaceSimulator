export const W = 1280;
export const H = 720;
export const NUM_SPRITES = 17;
export const RACE_SECS = 60;
export const RANK_BAR_H = 80;
export const TRACK_TOP = RANK_BAR_H + 8;
export const TRACK_BOT = H - 16;
export const TRACK_LENGTH = W * 6;

/** Leader progress 0→1: raises pace only noticeably near the finish (dramatic final sprint). */
export const FINISH_RUSH_EXPONENT = 2.25;
/** Extra multiplier at finish line (start ~1.0, end ~1 + this). */
export const FINISH_PACE_BOOST = 0.72;
/** Surge term scales up by this much toward the finish (stronger breakaways). */
export const FINISH_SURGE_BOOST = 1.25;
/** Slump (slow patches) weakens toward the finish so runners charge harder. */
export const FINISH_SLUMP_DECAY = 0.42;

/** Default speed factor floor (most of the field). */
export const SPEED_FACTOR_FLOOR = 1;
/** Speed factor floor for the leading top-fraction (front runners can dip slower). */
export const SPEED_FACTOR_FLOOR_LEAD_PACK = 0.34;
/** Share of cats (by rank ahead) that use {@link SPEED_FACTOR_FLOOR_LEAD_PACK}. */
export const TOP_LEAD_FLOOR_FRACTION = 0.1;
/** Upper clamp on speed factor (slightly caps extreme bursts). */
export const SPEED_FACTOR_CAP = 1.616;

/** Surge fatigue: builds while surge sine is positive; decays on the coast half — repeat sprinters get weaker. */
export const SURGE_FATIGUE_BUILD = 1.65;
export const SURGE_FATIGUE_RECOVERY = 0.26;
/** At fatigue 1, surge term is multiplied by (1 − this). */
export const SURGE_FATIGUE_DAMP = 0.82;
/** Extra fatigue buildup per unit fatigue already held (snowballs for chronic sprinters). */
export const SURGE_FATIGUE_ESCALATION = 3.4;
/** Strain = cumulative “surge time”; higher strain → faster fatigue (cats that surge more tire sooner). */
export const SURGE_STRAIN_WEIGHT = 0.062;
export const SURGE_STRAIN_CAP = 42;
/** Strain decays slowly while coasting so brief rests only partly reset punishment. */
export const SURGE_STRAIN_DECAY = 0.11;
/** Leaderboard ranks 1…N: surge term × this (front runners surge much weaker so the pack can catch). */
export const TOP_PACK_RANK_COUNT = 20;
export const TOP_PACK_SURGE_MULT = 0.12;
/** Front-pack drag on all movement (stacks with surge penalty). */
export const TOP_PACK_PACE_MULT = 0.84;
/** Among cats still racing: #1 by worldX gets surge × this (weakest breakaway; others can close). */
export const RACE_LEADER_SURGE_MULT = 0.03;
/** Same current leader: pace multiplier (extra drag vs {@link TOP_PACK_PACE_MULT}). */
export const RACE_LEADER_PACE_MULT = 0.76;
/** Slowest fraction of the field (by rank): surge term × this vs the rest (catch-up boost). */
export const TAIL_PACK_FRACTION = 0.2;
export const TAIL_PACK_SURGE_MULT = 2;
export const CAT_ASPECT = 377 / 417;
export const CAT_H = 70;
export const CAT_W = Math.round(CAT_H * CAT_ASPECT);
export const LEADER_SCREEN_X = W * 0.72;
/** Extra px past the right edge before “last cat left viewport” freezes sim. */
export const RACE_VIEW_EXIT_MARGIN = 48;

export const STATES = {
  START: 0,
  STAGING: 1,
  COUNTDOWN: 2,
  RACING: 3,
  FINISHED: 4,
};
