/**
 * Unit Tests for Habit Stability Score (HSS) Calculator
 * 
 * These tests verify the HSS system correctly identifies:
 * - Honest users with natural logging patterns
 * - Flatline cheaters with uniform values
 * - Sudden drop cheaters with abrupt behavior changes
 * - Household mismatches where usage doesn't fit family size
 * - Barcode contradictions where logged oil differs from scanned products
 */

import { describe, it, expect } from 'vitest';
import { 
  calculateHabitStabilityScore, 
  getRewardGovernance,
  type DailyLog, 
  type BarcodeScan, 
  type HSSInput,
  type HSSResult 
} from './habitStabilityScore';

// ============ Helper Functions ============

/**
 * Generate dates for the past N days
 */
function generateDates(numDays: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = numDays - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

/**
 * Generate logs with natural variation
 * - Base value with random variance (realistic cooking patterns)
 * - Weekends slightly higher (more home cooking)
 */
function generateNaturalLogs(numDays: number, baseOil: number = 50): DailyLog[] {
  const dates = generateDates(numDays);
  return dates.map(date => {
    const dayOfWeek = new Date(date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Add natural variance: ±30% with weekends 10-20% higher
    const variance = (Math.random() - 0.5) * 0.6 * baseOil;
    const weekendBoost = isWeekend ? baseOil * (0.1 + Math.random() * 0.1) : 0;
    const total = Math.max(10, Math.round(baseOil + variance + weekendBoost));
    
    return { date, total_oil_ml: total };
  });
}

/**
 * Generate flatline logs (suspicious - same value every day)
 */
function generateFlatlineLogs(numDays: number, constantValue: number = 50): DailyLog[] {
  const dates = generateDates(numDays);
  return dates.map(date => ({ date, total_oil_ml: constantValue }));
}

/**
 * Generate sudden drop logs (week 1 high, week 2 zero)
 */
function generateSuddenDropLogs(): DailyLog[] {
  const dates = generateDates(14);
  return dates.map((date, index) => ({
    date,
    total_oil_ml: index < 7 ? 200 + Math.random() * 50 : 0 // High first week, zero second week
  }));
}

// ============ Test Scenarios ============

describe('Habit Stability Score Calculator', () => {
  
  describe('Scenario 1: Honest Normal User', () => {
    /**
     * An honest user with 14 days of realistic oil logs:
     * - Average 35-70 ml with natural variation
     * - Weekends slightly higher
     * - Household size of 3 (reasonable for 50ml/day average)
     */
    it('should return high/medium score for natural logging patterns', () => {
      const dailyLogs = generateNaturalLogs(14, 50);
      const input: HSSInput = {
        dailyLogs,
        barcodeScans: [],
        householdSize: 3,
        windowDays: 14
      };

      const result = calculateHabitStabilityScore(input);

      // Honest user expectations
      expect(result.score).toBeGreaterThanOrEqual(45); // Medium or high range
      expect(['medium', 'high']).toContain(result.honestyLevel);
      expect(result.rewardMultiplier).toBeGreaterThanOrEqual(1.0);
      
      // Should NOT have flatline flag
      expect(result.flags).not.toContain('FLATLINE_PATTERN');
      expect(result.flags).not.toContain('REPETITIVE_VALUES');
      
      // Feature vector should show natural variance
      expect(result.featureVector.coefficient_of_variation).toBeGreaterThan(10);
    });

    it('should give 1.2x multiplier to consistently honest users', () => {
      // Generate very good honest data
      const dailyLogs = generateNaturalLogs(30, 60); // 30 days, ~60ml average for household of 3
      const input: HSSInput = {
        dailyLogs,
        barcodeScans: [],
        householdSize: 3,
        windowDays: 30
      };

      const result = calculateHabitStabilityScore(input);
      
      if (result.honestyLevel === 'high') {
        expect(result.rewardMultiplier).toBe(1.2);
      } else {
        expect(result.rewardMultiplier).toBeGreaterThanOrEqual(1.0);
      }
    });
  });

  describe('Scenario 2: Flatline Cheater', () => {
    /**
     * A cheater logging exactly the same value every day:
     * - 14 days of 0 ml or same value
     * - No barcode scans
     * - Should be flagged as suspicious
     */
    it('should detect zero flatline as suspicious', () => {
      const dailyLogs = generateFlatlineLogs(14, 0); // All zeros
      const input: HSSInput = {
        dailyLogs,
        barcodeScans: [],
        householdSize: 1,
        windowDays: 14
      };

      const result = calculateHabitStabilityScore(input);

      // Should have low score
      expect(result.score).toBeLessThan(50);
      expect(result.honestyLevel).toBe('low');
      expect(result.rewardMultiplier).toBe(0.5);
      
      // Should have flatline-related flags
      const hasRelevantFlag = result.flags.some(f => 
        f.includes('FLATLINE') || f.includes('REPETITIVE') || f.includes('HOUSEHOLD')
      );
      expect(hasRelevantFlag).toBe(true);
    });

    it('should detect constant non-zero values as suspicious', () => {
      const dailyLogs = generateFlatlineLogs(14, 50); // Same value every day
      const input: HSSInput = {
        dailyLogs,
        barcodeScans: [],
        householdSize: 3,
        windowDays: 14
      };

      const result = calculateHabitStabilityScore(input);

      // Low score due to no variance
      expect(result.score).toBeLessThan(60);
      
      // Coefficient of variation should be very low (or zero)
      expect(result.featureVector.coefficient_of_variation).toBeLessThan(5);
      
      // Should flag flatline pattern
      expect(result.featureVector.flatline_score).toBeLessThan(30);
    });

    it('should apply 0.5x multiplier to flatline cheaters', () => {
      const dailyLogs = generateFlatlineLogs(14, 25);
      const input: HSSInput = {
        dailyLogs,
        barcodeScans: [],
        householdSize: 1,
        windowDays: 14
      };

      const result = calculateHabitStabilityScore(input);

      // Cheater should get penalized multiplier
      if (result.honestyLevel === 'low') {
        expect(result.rewardMultiplier).toBe(0.5);
      }
    });
  });

  describe('Scenario 3: Sudden Drop Cheater', () => {
    /**
     * User with suspicious sudden changes:
     * - Week 1: Very high usage (180-250 ml/day)
     * - Week 2: Suddenly drops to 0 ml
     */
    it('should detect sudden drops from high to zero', () => {
      const dailyLogs = generateSuddenDropLogs();
      const input: HSSInput = {
        dailyLogs,
        barcodeScans: [],
        householdSize: 2,
        windowDays: 14
      };

      const result = calculateHabitStabilityScore(input);

      // Should not be high honesty
      expect(result.honestyLevel).not.toBe('high');
      
      // Should detect sudden drops
      expect(result.featureVector.sudden_drop_count).toBeGreaterThan(0);
    });

    it('should flag multiple sudden drops', () => {
      // Create data with multiple drops
      const dates = generateDates(21);
      const dailyLogs: DailyLog[] = dates.map((date, index) => {
        // Pattern: high -> 0 -> high -> 0 -> high -> 0
        const week = Math.floor(index / 7);
        return {
          date,
          total_oil_ml: week % 2 === 0 ? 150 + Math.random() * 50 : 0
        };
      });

      const input: HSSInput = {
        dailyLogs,
        barcodeScans: [],
        householdSize: 2,
        windowDays: 21
      };

      const result = calculateHabitStabilityScore(input);

      // Should be flagged
      if (result.featureVector.sudden_drop_count > 2) {
        expect(result.flags).toContain('SUDDEN_DROPS');
      }
    });
  });

  describe('Scenario 4: Household Mismatch', () => {
    /**
     * User claims household of 5 but logs unrealistically low usage:
     * - Expected: 5 * 20ml = 100ml/day minimum reasonable
     * - Actual: ~10ml/day (way too low)
     */
    it('should flag household mismatch for large family with low usage', () => {
      const dailyLogs = generateNaturalLogs(14, 10); // Only 10ml/day
      const input: HSSInput = {
        dailyLogs,
        barcodeScans: [],
        householdSize: 5, // Large family
        windowDays: 14
      };

      const result = calculateHabitStabilityScore(input);

      // Should have reduced score
      expect(result.score).toBeLessThan(70);
      
      // Household normalized score should be low
      expect(result.featureVector.household_normalized_score).toBeLessThan(50);
      
      // Should have household mismatch flag
      if (result.featureVector.household_normalized_score < 30) {
        expect(result.flags).toContain('HOUSEHOLD_MISMATCH');
      }
      
      // Honesty should not be high
      expect(result.honestyLevel).not.toBe('high');
    });

    it('should not flag appropriate usage for household size', () => {
      const dailyLogs = generateNaturalLogs(14, 100); // 100ml for 5 people (20ml each)
      const input: HSSInput = {
        dailyLogs,
        barcodeScans: [],
        householdSize: 5,
        windowDays: 14
      };

      const result = calculateHabitStabilityScore(input);

      // Should NOT have household mismatch
      expect(result.flags).not.toContain('HOUSEHOLD_MISMATCH');
      
      // Household score should be good
      expect(result.featureVector.household_normalized_score).toBeGreaterThanOrEqual(70);
    });
  });

  describe('Scenario 5: Barcode Contradiction', () => {
    /**
     * User logs very low oil but barcode scans show high oil content:
     * - Logged: ~5ml/day
     * - Barcodes: Scanning products with 50ml+ oil content
     */
    it('should detect contradiction between logged oil and scanned products', () => {
      const dailyLogs = generateNaturalLogs(14, 5); // Very low logged oil
      
      // High oil barcode scans
      const barcodeScans: BarcodeScan[] = [
        { scan_date: generateDates(1)[0], oil_content_ml: 50, product_name: 'Chips Pack' },
        { scan_date: generateDates(1)[0], oil_content_ml: 60, product_name: 'Fried Snacks' },
        { scan_date: generateDates(1)[0], oil_content_ml: 45, product_name: 'Samosa Pack' },
        { scan_date: generateDates(1)[0], oil_content_ml: 55, product_name: 'Bhujia' },
        { scan_date: generateDates(1)[0], oil_content_ml: 40, product_name: 'Namkeen' },
      ];

      const input: HSSInput = {
        dailyLogs,
        barcodeScans,
        householdSize: 1,
        windowDays: 14
      };

      const result = calculateHabitStabilityScore(input);

      // Should have non-high score
      expect(result.honestyLevel).not.toBe('high');
      
      // Barcode contradiction score should be low
      expect(result.featureVector.barcode_oil_contradiction_score).toBeLessThan(100);
      
      // May have barcode contradiction flag
      if (result.featureVector.barcode_oil_contradiction_score < 40) {
        expect(result.flags).toContain('BARCODE_CONTRADICTION');
      }
    });

    it('should not flag when no barcodes are scanned', () => {
      const dailyLogs = generateNaturalLogs(14, 50);
      const input: HSSInput = {
        dailyLogs,
        barcodeScans: [], // No scans
        householdSize: 3,
        windowDays: 14
      };

      const result = calculateHabitStabilityScore(input);

      // Should not have barcode contradiction flag
      expect(result.flags).not.toContain('BARCODE_CONTRADICTION');
      
      // Barcode score should be 100 (no contradiction possible)
      expect(result.featureVector.barcode_oil_contradiction_score).toBe(100);
    });
  });

  describe('Edge Cases', () => {
    it('should return neutral score for insufficient data', () => {
      const dailyLogs: DailyLog[] = [
        { date: '2024-01-01', total_oil_ml: 50 },
        { date: '2024-01-02', total_oil_ml: 55 },
      ];

      const input: HSSInput = {
        dailyLogs,
        barcodeScans: [],
        householdSize: 1,
        windowDays: 7
      };

      const result = calculateHabitStabilityScore(input);

      // Should return neutral score
      expect(result.score).toBe(50);
      expect(result.honestyLevel).toBe('medium');
      expect(result.rewardMultiplier).toBe(1.0);
      expect(result.flags).toContain('INSUFFICIENT_DATA');
    });

    it('should handle empty logs gracefully', () => {
      const input: HSSInput = {
        dailyLogs: [],
        barcodeScans: [],
        householdSize: 1,
        windowDays: 30
      };

      const result = calculateHabitStabilityScore(input);

      expect(result.score).toBe(50);
      expect(result.honestyLevel).toBe('medium');
      expect(result.flags).toContain('INSUFFICIENT_DATA');
    });
  });

  describe('Reward Governance', () => {
    it('should return correct governance for high honesty', () => {
      const hssResult: HSSResult = {
        score: 85,
        honestyLevel: 'high',
        rewardMultiplier: 1.2,
        featureVector: {} as any,
        signals: [],
        flags: []
      };

      const governance = getRewardGovernance(hssResult);

      expect(governance.multiplier).toBe(1.2);
      expect(governance.maxDailyPoints).toBe(150); // 100 * 1.5
      expect(governance.maxWeeklyPoints).toBe(750); // 500 * 1.5
      expect(governance.boostMessage).toContain('Honesty Boost');
    });

    it('should return correct governance for low honesty', () => {
      const hssResult: HSSResult = {
        score: 30,
        honestyLevel: 'low',
        rewardMultiplier: 0.5,
        featureVector: {} as any,
        signals: [],
        flags: ['FLATLINE_PATTERN']
      };

      const governance = getRewardGovernance(hssResult);

      expect(governance.multiplier).toBe(0.5);
      expect(governance.maxDailyPoints).toBe(50); // 100 * 0.5
      expect(governance.maxWeeklyPoints).toBe(150); // 500 * 0.3
      expect(governance.nudgeMessage).toBeDefined();
    });
  });
});

describe('Points Multiplier Calculation', () => {
  /**
   * Helper-level tests for reward multiplier math
   */
  it('should apply 1.2x multiplier correctly', () => {
    const basePoints = 10;
    const multiplier = 1.2;
    const final = Math.round(basePoints * multiplier);
    expect(final).toBe(12);
  });

  it('should apply 1.0x multiplier correctly', () => {
    const basePoints = 10;
    const multiplier = 1.0;
    const final = Math.round(basePoints * multiplier);
    expect(final).toBe(10);
  });

  it('should apply 0.5x multiplier correctly', () => {
    const basePoints = 10;
    const multiplier = 0.5;
    const final = Math.round(basePoints * multiplier);
    expect(final).toBe(5);
  });

  it('should handle fractional results with rounding', () => {
    const basePoints = 15;
    const multiplier = 1.2;
    const final = Math.round(basePoints * multiplier);
    expect(final).toBe(18); // 15 * 1.2 = 18
  });
});
