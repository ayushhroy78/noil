/**
 * Habit Stability Score (HSS) Calculator
 * 
 * Computes a score (0-100) based on user's logging patterns to detect
 * suspicious/unnatural behavior and reward honest users.
 * 
 * ML-Ready: All features are structured for future ML integration
 * (Isolation Forest, One-Class SVM, etc.)
 */

export interface DailyLog {
  date: string;
  total_oil_ml: number;
}

export interface BarcodeScan {
  scan_date: string;
  oil_content_ml: number;
  product_name: string;
}

export interface HSSInput {
  dailyLogs: DailyLog[];
  barcodeScans: BarcodeScan[];
  householdSize: number;
  windowDays?: number;
}

export interface FeatureVector {
  avg_oil_ml: number;
  std_dev_oil_ml: number;
  coefficient_of_variation: number;
  weekend_weekday_diff: number;
  micro_variance_score: number;
  weekly_total_ml: number;
  barcode_oil_contradiction_score: number;
  bulk_edit_count: number;
  logs_per_week: number;
  household_size: number;
  flatline_score: number;
  sudden_drop_count: number;
  moving_avg_deviation: number;
  household_normalized_score: number;
  logging_frequency_score: number;
}

export interface Signal {
  name: string;
  value: number;
  weight: number;
  flag?: string;
  description: string;
}

export interface HSSResult {
  score: number;
  honestyLevel: 'high' | 'medium' | 'low';
  rewardMultiplier: number;
  featureVector: FeatureVector;
  signals: Signal[];
  flags: string[];
}

// Configuration constants
const CONFIG = {
  WEIGHTS: {
    volatility: 0.15,
    microVariance: 0.12,
    householdNormalized: 0.18,
    barcodeContradiction: 0.12,
    loggingFrequency: 0.10,
    flatline: 0.10,
    suddenDrop: 0.08,
    weekendWeekday: 0.08,
    movingAvgDeviation: 0.07,
  },
  THRESHOLDS: {
    highHonesty: 75,
    mediumHonesty: 45,
    minLogsForAnalysis: 5,
    expectedOilPerPerson: 20, // ml/day per person
    maxOilPerPerson: 40, // ml/day per person (upper reasonable limit)
    minOilPerPerson: 5, // ml/day per person (lower reasonable limit)
  },
  MULTIPLIERS: {
    high: 1.2,
    medium: 1.0,
    low: 0.5,
  }
};

/**
 * Calculate standard deviation of an array of numbers
 */
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
}

/**
 * Calculate coefficient of variation (CV)
 */
function calculateCV(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  if (avg === 0) return 0;
  const stdDev = calculateStdDev(values);
  return (stdDev / avg) * 100;
}

/**
 * Detect micro-variance (same exact values logged repeatedly)
 */
function calculateMicroVariance(values: number[]): number {
  if (values.length < 3) return 100; // Not enough data
  
  const uniqueValues = new Set(values);
  const uniqueRatio = uniqueValues.size / values.length;
  
  // If all values are exactly the same, very suspicious
  if (uniqueValues.size === 1) return 0;
  
  // Calculate how often values repeat
  const valueCounts = new Map<number, number>();
  values.forEach(v => {
    valueCounts.set(v, (valueCounts.get(v) || 0) + 1);
  });
  
  const maxRepeat = Math.max(...valueCounts.values());
  const repeatRatio = maxRepeat / values.length;
  
  // Score: higher is better (more variance is natural)
  // Penalize if same value appears > 50% of time
  if (repeatRatio > 0.7) return 20;
  if (repeatRatio > 0.5) return 50;
  if (uniqueRatio < 0.3) return 40;
  
  return Math.min(100, uniqueRatio * 100 + 20);
}

/**
 * Detect flatline behavior (very low variance over time)
 */
function calculateFlatlineScore(values: number[]): number {
  if (values.length < 7) return 100; // Not enough data
  
  const cv = calculateCV(values);
  
  // Natural logging should have CV between 15-80%
  if (cv < 5) return 10; // Almost no variation - very suspicious
  if (cv < 10) return 30;
  if (cv < 15) return 60;
  if (cv > 150) return 50; // Too erratic might also be suspicious
  
  return 100;
}

/**
 * Detect sudden drops from high to zero/very low
 */
function countSuddenDrops(values: number[]): number {
  if (values.length < 3) return 0;
  
  let dropCount = 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  
  for (let i = 1; i < values.length; i++) {
    const prev = values[i - 1];
    const curr = values[i];
    
    // Drop from above average to near zero
    if (prev > avg * 1.5 && curr < avg * 0.2) {
      dropCount++;
    }
  }
  
  return dropCount;
}

/**
 * Calculate weekend vs weekday difference
 */
function calculateWeekendWeekdayDiff(logs: DailyLog[]): number {
  if (logs.length < 7) return 100; // Not enough data
  
  const weekendLogs: number[] = [];
  const weekdayLogs: number[] = [];
  
  logs.forEach(log => {
    const date = new Date(log.date);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendLogs.push(log.total_oil_ml);
    } else {
      weekdayLogs.push(log.total_oil_ml);
    }
  });
  
  if (weekendLogs.length === 0 || weekdayLogs.length === 0) return 100;
  
  const weekendAvg = weekendLogs.reduce((a, b) => a + b, 0) / weekendLogs.length;
  const weekdayAvg = weekdayLogs.reduce((a, b) => a + b, 0) / weekdayLogs.length;
  
  // Some difference is natural (weekends often have different cooking patterns)
  const diff = Math.abs(weekendAvg - weekdayAvg);
  const avgTotal = (weekendAvg + weekdayAvg) / 2;
  
  if (avgTotal === 0) return 100;
  
  const diffPercent = (diff / avgTotal) * 100;
  
  // No difference at all is slightly suspicious
  if (diffPercent < 5) return 70;
  // Natural difference
  if (diffPercent < 30) return 100;
  // Large difference might be suspicious
  if (diffPercent > 80) return 60;
  
  return 90;
}

/**
 * Calculate moving average deviation
 */
function calculateMovingAvgDeviation(values: number[]): number {
  if (values.length < 7) return 100;
  
  const windowSize = 7;
  const deviations: number[] = [];
  
  for (let i = windowSize; i < values.length; i++) {
    const window = values.slice(i - windowSize, i);
    const movingAvg = window.reduce((a, b) => a + b, 0) / windowSize;
    const deviation = Math.abs(values[i] - movingAvg);
    const deviationPercent = movingAvg > 0 ? (deviation / movingAvg) * 100 : 0;
    deviations.push(deviationPercent);
  }
  
  if (deviations.length === 0) return 100;
  
  const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
  
  // Natural deviation should be 10-40%
  if (avgDeviation < 5) return 50; // Too consistent
  if (avgDeviation < 10) return 70;
  if (avgDeviation > 80) return 60; // Too erratic
  
  return 100;
}

/**
 * Calculate household-normalized expected range score
 */
function calculateHouseholdNormalizedScore(
  avgOil: number, 
  householdSize: number
): number {
  const expectedMin = CONFIG.THRESHOLDS.minOilPerPerson * householdSize;
  const expectedMax = CONFIG.THRESHOLDS.maxOilPerPerson * householdSize;
  const expectedIdeal = CONFIG.THRESHOLDS.expectedOilPerPerson * householdSize;
  
  // Within expected range
  if (avgOil >= expectedMin && avgOil <= expectedMax) {
    // Closer to ideal is better
    const distanceFromIdeal = Math.abs(avgOil - expectedIdeal);
    const maxDistance = Math.max(expectedIdeal - expectedMin, expectedMax - expectedIdeal);
    return 100 - (distanceFromIdeal / maxDistance) * 30;
  }
  
  // Below minimum - suspicious (especially for large families)
  if (avgOil < expectedMin) {
    const ratio = avgOil / expectedMin;
    if (ratio < 0.3) return 10; // Very suspicious
    if (ratio < 0.5) return 30;
    return 50;
  }
  
  // Above maximum - less suspicious, might just be heavy cooking
  const ratio = avgOil / expectedMax;
  if (ratio > 2) return 60;
  return 80;
}

/**
 * Calculate barcode contradiction score
 */
function calculateBarcodeContradiction(
  avgLoggedOil: number,
  barcodeScans: BarcodeScan[]
): number {
  if (barcodeScans.length === 0) return 100; // No scans to compare
  
  const totalBarcodeOil = barcodeScans.reduce((sum, scan) => sum + scan.oil_content_ml, 0);
  const avgBarcodeOilPerDay = totalBarcodeOil / 30; // Spread over window
  
  // If logged oil is very low but barcode oil is high
  if (avgLoggedOil < 15 && avgBarcodeOilPerDay > 30) {
    return 30; // Suspicious
  }
  
  // Some discrepancy is normal (not all food is scanned)
  if (avgLoggedOil < avgBarcodeOilPerDay * 0.5 && avgBarcodeOilPerDay > 20) {
    return 50;
  }
  
  return 100;
}

/**
 * Calculate logging frequency score
 */
function calculateLoggingFrequencyScore(logs: DailyLog[], windowDays: number): number {
  const logsPerWeek = (logs.length / windowDays) * 7;
  
  // 5-10 logs per week is ideal
  if (logsPerWeek >= 5 && logsPerWeek <= 14) return 100;
  
  // Very few logs - not enough data
  if (logsPerWeek < 2) return 60;
  
  // Some logs
  if (logsPerWeek < 5) return 80;
  
  // Too many logs might indicate bulk editing
  if (logsPerWeek > 21) return 50;
  
  return 70;
}

/**
 * Detect bulk edits (many logs on same day)
 */
function countBulkEdits(logs: DailyLog[]): number {
  const logsByDate = new Map<string, number>();
  
  logs.forEach(log => {
    logsByDate.set(log.date, (logsByDate.get(log.date) || 0) + 1);
  });
  
  let bulkCount = 0;
  logsByDate.forEach(count => {
    if (count > 5) bulkCount++; // More than 5 logs on same day
  });
  
  return bulkCount;
}

/**
 * Main HSS calculation function
 */
export function calculateHabitStabilityScore(input: HSSInput): HSSResult {
  const { 
    dailyLogs, 
    barcodeScans, 
    householdSize, 
    windowDays = 30 
  } = input;
  
  const signals: Signal[] = [];
  const flags: string[] = [];
  
  // Extract values
  const oilValues = dailyLogs.map(log => log.total_oil_ml);
  
  // Handle insufficient data
  if (dailyLogs.length < CONFIG.THRESHOLDS.minLogsForAnalysis) {
    return {
      score: 50,
      honestyLevel: 'medium',
      rewardMultiplier: CONFIG.MULTIPLIERS.medium,
      featureVector: createEmptyFeatureVector(householdSize),
      signals: [{
        name: 'insufficient_data',
        value: dailyLogs.length,
        weight: 1,
        description: 'Not enough logs for analysis',
        flag: 'INSUFFICIENT_DATA'
      }],
      flags: ['INSUFFICIENT_DATA']
    };
  }
  
  // Calculate all features
  const avgOil = oilValues.reduce((a, b) => a + b, 0) / oilValues.length;
  const stdDev = calculateStdDev(oilValues);
  const cv = calculateCV(oilValues);
  const microVarianceScore = calculateMicroVariance(oilValues);
  const flatlineScore = calculateFlatlineScore(oilValues);
  const suddenDropCount = countSuddenDrops(oilValues);
  const weekendWeekdayScore = calculateWeekendWeekdayDiff(dailyLogs);
  const movingAvgDeviation = calculateMovingAvgDeviation(oilValues);
  const householdNormalizedScore = calculateHouseholdNormalizedScore(avgOil, householdSize);
  const barcodeContradictionScore = calculateBarcodeContradiction(avgOil, barcodeScans);
  const loggingFrequencyScore = calculateLoggingFrequencyScore(dailyLogs, windowDays);
  const bulkEditCount = countBulkEdits(dailyLogs);
  const weeklyTotal = avgOil * 7;
  const logsPerWeek = (dailyLogs.length / windowDays) * 7;
  
  // Build feature vector (ML-ready)
  const featureVector: FeatureVector = {
    avg_oil_ml: Math.round(avgOil * 100) / 100,
    std_dev_oil_ml: Math.round(stdDev * 100) / 100,
    coefficient_of_variation: Math.round(cv * 100) / 100,
    weekend_weekday_diff: weekendWeekdayScore,
    micro_variance_score: microVarianceScore,
    weekly_total_ml: Math.round(weeklyTotal * 100) / 100,
    barcode_oil_contradiction_score: barcodeContradictionScore,
    bulk_edit_count: bulkEditCount,
    logs_per_week: Math.round(logsPerWeek * 100) / 100,
    household_size: householdSize,
    flatline_score: flatlineScore,
    sudden_drop_count: suddenDropCount,
    moving_avg_deviation: movingAvgDeviation,
    household_normalized_score: householdNormalizedScore,
    logging_frequency_score: loggingFrequencyScore,
  };
  
  // Build signals with descriptions
  signals.push({
    name: 'volatility',
    value: 100 - Math.min(100, cv),
    weight: CONFIG.WEIGHTS.volatility,
    description: cv < 15 ? 'Very consistent (possibly suspicious)' : cv > 80 ? 'High variation' : 'Natural variation'
  });
  
  signals.push({
    name: 'micro_variance',
    value: microVarianceScore,
    weight: CONFIG.WEIGHTS.microVariance,
    description: microVarianceScore < 50 ? 'Same values logged repeatedly' : 'Good value diversity',
    flag: microVarianceScore < 30 ? 'REPETITIVE_VALUES' : undefined
  });
  
  signals.push({
    name: 'household_normalized',
    value: householdNormalizedScore,
    weight: CONFIG.WEIGHTS.householdNormalized,
    description: householdNormalizedScore < 50 ? 'Usage does not match household size' : 'Usage matches household size',
    flag: householdNormalizedScore < 30 ? 'HOUSEHOLD_MISMATCH' : undefined
  });
  
  signals.push({
    name: 'barcode_contradiction',
    value: barcodeContradictionScore,
    weight: CONFIG.WEIGHTS.barcodeContradiction,
    description: barcodeContradictionScore < 50 ? 'Logged oil contradicts scanned products' : 'Consistent with scanned products',
    flag: barcodeContradictionScore < 40 ? 'BARCODE_CONTRADICTION' : undefined
  });
  
  signals.push({
    name: 'logging_frequency',
    value: loggingFrequencyScore,
    weight: CONFIG.WEIGHTS.loggingFrequency,
    description: logsPerWeek < 3 ? 'Infrequent logging' : logsPerWeek > 20 ? 'Excessive logging' : 'Regular logging pattern'
  });
  
  signals.push({
    name: 'flatline',
    value: flatlineScore,
    weight: CONFIG.WEIGHTS.flatline,
    description: flatlineScore < 40 ? 'Unnaturally consistent values' : 'Natural variation over time',
    flag: flatlineScore < 30 ? 'FLATLINE_PATTERN' : undefined
  });
  
  signals.push({
    name: 'sudden_drops',
    value: suddenDropCount > 2 ? 30 : suddenDropCount > 0 ? 70 : 100,
    weight: CONFIG.WEIGHTS.suddenDrop,
    description: suddenDropCount > 2 ? 'Multiple sudden drops detected' : 'No suspicious drops',
    flag: suddenDropCount > 2 ? 'SUDDEN_DROPS' : undefined
  });
  
  signals.push({
    name: 'weekend_weekday',
    value: weekendWeekdayScore,
    weight: CONFIG.WEIGHTS.weekendWeekday,
    description: 'Weekend vs weekday usage pattern'
  });
  
  signals.push({
    name: 'moving_avg_deviation',
    value: movingAvgDeviation,
    weight: CONFIG.WEIGHTS.movingAvgDeviation,
    description: 'Deviation from rolling average'
  });
  
  // Collect flags
  signals.forEach(s => {
    if (s.flag) flags.push(s.flag);
  });
  
  if (bulkEditCount > 2) {
    flags.push('BULK_EDITS_DETECTED');
  }
  
  // Calculate weighted score
  const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0);
  const weightedSum = signals.reduce((sum, s) => sum + (s.value * s.weight), 0);
  const rawScore = weightedSum / totalWeight;
  
  // Apply bulk edit penalty
  const bulkPenalty = Math.min(20, bulkEditCount * 5);
  const finalScore = Math.max(0, Math.min(100, Math.round(rawScore - bulkPenalty)));
  
  // Determine honesty level
  let honestyLevel: 'high' | 'medium' | 'low';
  if (finalScore >= CONFIG.THRESHOLDS.highHonesty) {
    honestyLevel = 'high';
  } else if (finalScore >= CONFIG.THRESHOLDS.mediumHonesty) {
    honestyLevel = 'medium';
  } else {
    honestyLevel = 'low';
  }
  
  return {
    score: finalScore,
    honestyLevel,
    rewardMultiplier: CONFIG.MULTIPLIERS[honestyLevel],
    featureVector,
    signals,
    flags
  };
}

function createEmptyFeatureVector(householdSize: number): FeatureVector {
  return {
    avg_oil_ml: 0,
    std_dev_oil_ml: 0,
    coefficient_of_variation: 0,
    weekend_weekday_diff: 100,
    micro_variance_score: 100,
    weekly_total_ml: 0,
    barcode_oil_contradiction_score: 100,
    bulk_edit_count: 0,
    logs_per_week: 0,
    household_size: householdSize,
    flatline_score: 100,
    sudden_drop_count: 0,
    moving_avg_deviation: 100,
    household_normalized_score: 100,
    logging_frequency_score: 50,
  };
}

/**
 * Get reward governance based on HSS result
 */
export function getRewardGovernance(hssResult: HSSResult): {
  multiplier: number;
  maxDailyPoints: number;
  maxWeeklyPoints: number;
  nudgeMessage?: string;
  boostMessage?: string;
} {
  const { honestyLevel, score, flags } = hssResult;
  
  const baseMaxDaily = 100;
  const baseMaxWeekly = 500;
  
  switch (honestyLevel) {
    case 'high':
      return {
        multiplier: 1.2,
        maxDailyPoints: baseMaxDaily * 1.5,
        maxWeeklyPoints: baseMaxWeekly * 1.5,
        boostMessage: 'Honesty Boost: +20% points for consistent, reliable logging!'
      };
    
    case 'medium':
      return {
        multiplier: 1.0,
        maxDailyPoints: baseMaxDaily,
        maxWeeklyPoints: baseMaxWeekly,
        nudgeMessage: score < 55 
          ? 'Log consistently each day to unlock bonus rewards!'
          : undefined
      };
    
    case 'low':
      const nudges = [];
      if (flags.includes('HOUSEHOLD_MISMATCH')) {
        nudges.push('Your logged usage seems unusual for your household size. Double-check today\'s entry?');
      } else if (flags.includes('REPETITIVE_VALUES')) {
        nudges.push('We noticed very similar values in your logs. Varied, realistic entries unlock better insights!');
      } else if (flags.includes('FLATLINE_PATTERN')) {
        nudges.push('Your entries look very consistent. Real cooking naturally varies day to day!');
      } else {
        nudges.push('Consistent, realistic logging unlocks extra rewards and better health insights.');
      }
      
      return {
        multiplier: 0.5,
        maxDailyPoints: baseMaxDaily * 0.5,
        maxWeeklyPoints: baseMaxWeekly * 0.3,
        nudgeMessage: nudges[0]
      };
  }
}
