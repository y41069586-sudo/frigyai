export const BADGE_UNLOCKED_EVENT = "frigy:badge-unlocked";

export type BadgeUnlockedDetail = {
  badgeType: string;
  badgeName: string;
  badgeIcon: string;
};

export function notifyBadgeUnlocked(detail: BadgeUnlockedDetail): void {
  window.dispatchEvent(new CustomEvent<BadgeUnlockedDetail>(BADGE_UNLOCKED_EVENT, { detail }));
}
