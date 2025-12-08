/**
 * Manual Test Script for HSS Scenarios
 * 
 * Run this script to manually verify HSS behavior with synthetic test users.
 * 
 * Usage:
 *   npx tsx src/dev/testHssScenarios.ts
 * 
 * This creates three synthetic test scenarios and logs their scores:
 * 1. Honest user - natural variation, appropriate for household
 * 2. Flatline cheater - same value every day
 * 3. Sudden drop cheater - high usage then zero
 */

import { 
  calculateHabitStabilityScore, 
  type DailyLog, 
  type HSSInput,
  type HSSResult 
} from '../lib/habitStabilityScore';

// ============ Helper Functions ============

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

function generateNaturalLogs(numDays: number, baseOil: number): DailyLog[] {
  const dates = generateDates(numDays);
  return dates.map(date => {
    const dayOfWeek = new Date(date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const variance = (Math.random() - 0.5) * 0.6 * baseOil;
    const weekendBoost = isWeekend ? baseOil * 0.15 : 0;
    const total = Math.max(10, Math.round(baseOil + variance + weekendBoost));
    return { date, total_oil_ml: total };
  });
}

function generateFlatlineLogs(numDays: number, value: number): DailyLog[] {
  const dates = generateDates(numDays);
  return dates.map(date => ({ date, total_oil_ml: value }));
}

function generateSuddenDropLogs(): DailyLog[] {
  const dates = generateDates(14);
  return dates.map((date, index) => ({
    date,
    total_oil_ml: index < 7 ? 200 + Math.random() * 50 : 0
  }));
}

// ============ Test Scenarios ============

interface TestUser {
  name: string;
  description: string;
  input: HSSInput;
  expectedBehavior: string;
}

const testUsers: TestUser[] = [
  {
    name: "Honest User",
    description: "14 days of realistic oil logs with natural variation, household of 3",
    input: {
      dailyLogs: generateNaturalLogs(14, 60), // ~60ml avg for 3 people
      barcodeScans: [],
      householdSize: 3,
      windowDays: 14
    },
    expectedBehavior: "Score: medium/high | Multiplier: >= 1.0 | No suspicious flags"
  },
  {
    name: "Flatline Cheater",
    description: "14 days of exactly 50ml every single day - unnaturally consistent",
    input: {
      dailyLogs: generateFlatlineLogs(14, 50),
      barcodeScans: [],
      householdSize: 3,
      windowDays: 14
    },
    expectedBehavior: "Score: low | Multiplier: 0.5 | FLATLINE_PATTERN or REPETITIVE_VALUES flag"
  },
  {
    name: "Sudden Drop Cheater",
    description: "Week 1: 200+ ml/day, Week 2: 0 ml/day - suspicious pattern",
    input: {
      dailyLogs: generateSuddenDropLogs(),
      barcodeScans: [],
      householdSize: 2,
      windowDays: 14
    },
    expectedBehavior: "Score: not high | Sudden drop detected | Possible flags"
  },
  {
    name: "Household Mismatch",
    description: "Household of 5 but only 10ml/day logged - unrealistic",
    input: {
      dailyLogs: generateNaturalLogs(14, 10),
      barcodeScans: [],
      householdSize: 5,
      windowDays: 14
    },
    expectedBehavior: "Score: reduced | HOUSEHOLD_MISMATCH flag | Not high honesty"
  },
  {
    name: "Barcode Contradiction",
    description: "Logs 5ml/day but scans high-oil products",
    input: {
      dailyLogs: generateNaturalLogs(14, 5),
      barcodeScans: [
        { scan_date: generateDates(1)[0], oil_content_ml: 50, product_name: 'Chips' },
        { scan_date: generateDates(1)[0], oil_content_ml: 60, product_name: 'Snacks' },
        { scan_date: generateDates(1)[0], oil_content_ml: 45, product_name: 'Samosa' },
      ],
      householdSize: 1,
      windowDays: 14
    },
    expectedBehavior: "Score: not high | Barcode contradiction score low"
  }
];

// ============ Run Tests ============

function formatResult(result: HSSResult): void {
  console.log('  Score:', result.score);
  console.log('  Honesty Level:', result.honestyLevel);
  console.log('  Reward Multiplier:', result.rewardMultiplier);
  console.log('  Flags:', result.flags.length > 0 ? result.flags.join(', ') : 'None');
  console.log('  Key Features:');
  console.log('    - CV:', result.featureVector.coefficient_of_variation.toFixed(2) + '%');
  console.log('    - Micro Variance Score:', result.featureVector.micro_variance_score);
  console.log('    - Flatline Score:', result.featureVector.flatline_score);
  console.log('    - Household Normalized:', result.featureVector.household_normalized_score);
  console.log('    - Barcode Contradiction:', result.featureVector.barcode_oil_contradiction_score);
  console.log('    - Sudden Drops:', result.featureVector.sudden_drop_count);
}

function runAllScenarios(): void {
  console.log('\n========================================');
  console.log('  HSS Manual Test - Scenario Verification');
  console.log('========================================\n');

  testUsers.forEach((user, index) => {
    console.log(`--- Test ${index + 1}: ${user.name} ---`);
    console.log(`Description: ${user.description}`);
    console.log(`Expected: ${user.expectedBehavior}`);
    console.log('');

    try {
      const result = calculateHabitStabilityScore(user.input);
      formatResult(result);
      
      // Simple validation
      let status = '✓ PASS';
      if (user.name === 'Honest User' && result.honestyLevel === 'low') {
        status = '✗ FAIL - Honest user got low score';
      }
      if (user.name === 'Flatline Cheater' && result.honestyLevel === 'high') {
        status = '✗ FAIL - Flatline cheater got high score';
      }
      if (user.name === 'Household Mismatch' && !result.flags.includes('HOUSEHOLD_MISMATCH') && result.featureVector.household_normalized_score > 50) {
        status = '⚠ WARN - Household mismatch not detected clearly';
      }

      console.log('');
      console.log(`  Status: ${status}`);
    } catch (error) {
      console.log(`  ✗ ERROR: ${error}`);
    }

    console.log('\n----------------------------------------\n');
  });

  console.log('Test run complete.');
}

// Run if called directly
runAllScenarios();
