// Milestone thresholds and grading configuration

export const STREAK_THRESHOLDS = {
  CONSISTENCY_7_DAYS: 7,
  CONSISTENCY_14_DAYS: 14,
  CONSISTENCY_30_DAYS: 30,
};

export const REDUCTION_THRESHOLDS = {
  REDUCTION_10_PERCENT: 10,
  REDUCTION_25_PERCENT: 25,
  REDUCTION_50_PERCENT: 50,
};

export const REGION_RANK_THRESHOLDS = {
  REGION_TOP_10: 10,
  REGION_TOP_25: 25,
};

export const HOUSEHOLD_THRESHOLDS = {
  IMPROVED: 20, // 20% improvement
};

// Household grading based on avg oil per person per day
export const HOUSEHOLD_GRADES = {
  'A+': { max: 15, label: 'Excellent', color: 'text-green-600' },
  'A': { max: 20, label: 'Very Good', color: 'text-green-500' },
  'B': { max: 25, label: 'Good', color: 'text-yellow-500' },
  'C': { max: 30, label: 'Needs Improvement', color: 'text-orange-500' },
  'D': { max: Infinity, label: 'Needs Attention', color: 'text-red-500' },
} as const;

export type HouseholdGrade = keyof typeof HOUSEHOLD_GRADES;

export const getHouseholdGrade = (avgOilPerPerson: number): HouseholdGrade => {
  if (avgOilPerPerson <= HOUSEHOLD_GRADES['A+'].max) return 'A+';
  if (avgOilPerPerson <= HOUSEHOLD_GRADES['A'].max) return 'A';
  if (avgOilPerPerson <= HOUSEHOLD_GRADES['B'].max) return 'B';
  if (avgOilPerPerson <= HOUSEHOLD_GRADES['C'].max) return 'C';
  return 'D';
};

export const getMilestoneIcon = (iconName: string) => {
  const icons: Record<string, string> = {
    flame: '🔥',
    trophy: '🏆',
    'trending-down': '📉',
    award: '🏅',
    zap: '⚡',
    leaf: '🍃',
    home: '🏠',
    users: '👨‍👩‍👧‍👦',
    'map-pin': '📍',
    map: '🗺️',
  };
  return icons[iconName] || '🎯';
};

export const getMilestoneGradient = (type: string): string => {
  const gradients: Record<string, string> = {
    streak: 'from-orange-400 via-red-500 to-pink-500',
    reduction: 'from-green-400 via-emerald-500 to-teal-500',
    challenge: 'from-purple-400 via-violet-500 to-indigo-500',
    household: 'from-blue-400 via-cyan-500 to-teal-500',
    region: 'from-amber-400 via-orange-500 to-red-500',
  };
  return gradients[type] || 'from-gray-400 to-gray-600';
};
