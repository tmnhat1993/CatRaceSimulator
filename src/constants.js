export const W = 1280;
export const H = 720;
export const NUM_SPRITES = 17;
export const RACE_SECS = 90;
export const RANK_BAR_H = 80;
export const TRACK_TOP = RANK_BAR_H + 8;
export const TRACK_BOT = H - 16;
export const TRACK_LENGTH = W * 6;
export const CAT_ASPECT = 377 / 417;
export const CAT_H = 70;
export const CAT_W = Math.round(CAT_H * CAT_ASPECT);
export const LEADER_SCREEN_X = W * 0.72;

export const STATES = {
  START: 0,
  STAGING: 1,
  COUNTDOWN: 2,
  RACING: 3,
  FINISHED: 4,
};
