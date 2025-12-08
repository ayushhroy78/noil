/**
 * Reward Multiplier Utilities
 * 
 * Pure functions for applying HSS reward multipliers to points.
 * Extracted for testability.
 */

/**
 * Apply reward multiplier to base points
 * @param basePoints - The original points to award
 * @param multiplier - The HSS reward multiplier (0.5, 1.0, or 1.2)
 * @returns The adjusted points value
 */
export function applyRewardMultiplier(basePoints: number, multiplier: number): number {
  return Math.round(basePoints * multiplier);
}

/**
 * Get multiplier description for display
 */
export function getMultiplierDescription(multiplier: number): string | null {
  if (multiplier >= 1.2) {
    return '+20% Honesty Boost';
  }
  if (multiplier <= 0.5) {
    return 'Reduced (improve logging habits)';
  }
  return null;
}

/**
 * Calculate total points earned including multiplier
 */
export function calculateTotalPoints(
  basePoints: number, 
  multiplier: number
): { 
  finalPoints: number; 
  bonus: number;
  multiplierApplied: boolean;
} {
  const finalPoints = applyRewardMultiplier(basePoints, multiplier);
  const bonus = finalPoints - basePoints;
  
  return {
    finalPoints,
    bonus,
    multiplierApplied: multiplier !== 1.0
  };
}
