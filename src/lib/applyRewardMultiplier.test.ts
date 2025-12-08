/**
 * Tests for Reward Multiplier Logic
 * 
 * Verifies that reward multipliers are correctly applied to points.
 */

import { describe, it, expect } from 'vitest';
import { 
  applyRewardMultiplier, 
  getMultiplierDescription, 
  calculateTotalPoints 
} from './applyRewardMultiplier';

describe('applyRewardMultiplier', () => {
  describe('High Honesty (1.2x)', () => {
    it('should apply 1.2x multiplier correctly', () => {
      expect(applyRewardMultiplier(10, 1.2)).toBe(12);
      expect(applyRewardMultiplier(100, 1.2)).toBe(120);
      expect(applyRewardMultiplier(50, 1.2)).toBe(60);
    });

    it('should round correctly for fractional results', () => {
      expect(applyRewardMultiplier(15, 1.2)).toBe(18);
      expect(applyRewardMultiplier(7, 1.2)).toBe(8); // 8.4 rounds to 8
      expect(applyRewardMultiplier(3, 1.2)).toBe(4); // 3.6 rounds to 4
    });
  });

  describe('Medium Honesty (1.0x)', () => {
    it('should apply 1.0x multiplier (no change)', () => {
      expect(applyRewardMultiplier(10, 1.0)).toBe(10);
      expect(applyRewardMultiplier(100, 1.0)).toBe(100);
      expect(applyRewardMultiplier(0, 1.0)).toBe(0);
    });
  });

  describe('Low Honesty (0.5x)', () => {
    it('should apply 0.5x multiplier correctly', () => {
      expect(applyRewardMultiplier(10, 0.5)).toBe(5);
      expect(applyRewardMultiplier(100, 0.5)).toBe(50);
      expect(applyRewardMultiplier(20, 0.5)).toBe(10);
    });

    it('should round correctly for odd numbers', () => {
      expect(applyRewardMultiplier(11, 0.5)).toBe(6); // 5.5 rounds to 6
      expect(applyRewardMultiplier(3, 0.5)).toBe(2); // 1.5 rounds to 2
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero points', () => {
      expect(applyRewardMultiplier(0, 1.2)).toBe(0);
      expect(applyRewardMultiplier(0, 0.5)).toBe(0);
    });

    it('should handle small points', () => {
      expect(applyRewardMultiplier(1, 1.2)).toBe(1);
      expect(applyRewardMultiplier(1, 0.5)).toBe(1);
    });
  });
});

describe('getMultiplierDescription', () => {
  it('should return boost message for high honesty', () => {
    expect(getMultiplierDescription(1.2)).toBe('+20% Honesty Boost');
  });

  it('should return reduction message for low honesty', () => {
    expect(getMultiplierDescription(0.5)).toBe('Reduced (improve logging habits)');
  });

  it('should return null for neutral multiplier', () => {
    expect(getMultiplierDescription(1.0)).toBeNull();
  });
});

describe('calculateTotalPoints', () => {
  it('should calculate correctly for high honesty boost', () => {
    const result = calculateTotalPoints(100, 1.2);
    
    expect(result.finalPoints).toBe(120);
    expect(result.bonus).toBe(20);
    expect(result.multiplierApplied).toBe(true);
  });

  it('should calculate correctly for neutral multiplier', () => {
    const result = calculateTotalPoints(100, 1.0);
    
    expect(result.finalPoints).toBe(100);
    expect(result.bonus).toBe(0);
    expect(result.multiplierApplied).toBe(false);
  });

  it('should calculate correctly for low honesty penalty', () => {
    const result = calculateTotalPoints(100, 0.5);
    
    expect(result.finalPoints).toBe(50);
    expect(result.bonus).toBe(-50);
    expect(result.multiplierApplied).toBe(true);
  });
});
