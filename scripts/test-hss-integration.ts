/**
 * Integration Test Script for compute-habit-stability Edge Function
 * 
 * This script tests the full HSS flow:
 * 1. Seeds test data into the database
 * 2. Calls the edge function
 * 3. Verifies the results in habit_integrity table
 * 
 * Prerequisites:
 * - Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
 * - Or run with: npx tsx --env-file=.env.local scripts/test-hss-integration.ts
 * 
 * Usage:
 *   npx tsx scripts/test-hss-integration.ts
 */

// This is a pseudo-integration test script
// In production, you would use the actual Supabase client

interface TestScenario {
  name: string;
  logs: Array<{ log_date: string; amount_ml: number }>;
  household_size: number;
  expected: {
    honesty_level: 'high' | 'medium' | 'low';
    score_range: [number, number];
    flags_should_include?: string[];
  };
}

// Generate date string for N days ago
function daysAgo(n: number): string {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString().split('T')[0];
}

// Test scenarios
const scenarios: TestScenario[] = [
  {
    name: 'Honest User',
    household_size: 3,
    logs: Array.from({ length: 14 }, (_, i) => ({
      log_date: daysAgo(14 - i),
      amount_ml: 50 + Math.floor(Math.random() * 30 - 15) // 35-65 range
    })),
    expected: {
      honesty_level: 'medium', // Or high with good variance
      score_range: [45, 100]
    }
  },
  {
    name: 'Flatline Cheater',
    household_size: 2,
    logs: Array.from({ length: 14 }, (_, i) => ({
      log_date: daysAgo(14 - i),
      amount_ml: 40 // Same value every day
    })),
    expected: {
      honesty_level: 'low',
      score_range: [0, 50],
      flags_should_include: ['FLATLINE_PATTERN']
    }
  }
];

// Print test plan (actual execution would require Supabase client)
function printTestPlan(): void {
  console.log('\n========================================');
  console.log('  HSS Integration Test Plan');
  console.log('========================================\n');

  scenarios.forEach((scenario, index) => {
    console.log(`Scenario ${index + 1}: ${scenario.name}`);
    console.log('  Household Size:', scenario.household_size);
    console.log('  Logs:', scenario.logs.length, 'entries');
    console.log('  Expected Honesty:', scenario.expected.honesty_level);
    console.log('  Expected Score Range:', scenario.expected.score_range.join('-'));
    if (scenario.expected.flags_should_include) {
      console.log('  Expected Flags:', scenario.expected.flags_should_include.join(', '));
    }
    console.log('');
  });

  console.log('To run actual integration tests:');
  console.log('1. Set up test user in Supabase');
  console.log('2. Insert logs using the scenario data above');
  console.log('3. Call compute-habit-stability edge function');
  console.log('4. Query habit_integrity table for results');
  console.log('');
  console.log('Example API call:');
  console.log(`
  const { data } = await supabase.functions.invoke('compute-habit-stability', {
    body: { user_id: 'test-user-uuid' }
  });
  `);
}

// SQL to seed test data (for manual testing)
function generateSeedSQL(scenario: TestScenario, userId: string): string {
  const logsSQL = scenario.logs.map(log => 
    `('${userId}', '${log.log_date}', ${log.amount_ml})`
  ).join(',\n  ');

  return `
-- Seed data for: ${scenario.name}
-- User ID: ${userId}

-- 1. Set household size
INSERT INTO user_profiles (user_id, household_size)
VALUES ('${userId}', ${scenario.household_size})
ON CONFLICT (user_id) 
DO UPDATE SET household_size = ${scenario.household_size};

-- 2. Insert daily logs (clear existing first)
DELETE FROM daily_logs WHERE user_id = '${userId}';
INSERT INTO daily_logs (user_id, log_date, amount_ml)
VALUES
  ${logsSQL};

-- 3. Now call the edge function and verify:
-- SELECT * FROM habit_integrity WHERE user_id = '${userId}';
`;
}

// Main
printTestPlan();

console.log('\n========================================');
console.log('  Sample Seed SQL');
console.log('========================================\n');

scenarios.forEach((scenario, index) => {
  console.log(`-- ${scenario.name} --`);
  console.log(generateSeedSQL(scenario, `test-user-${index + 1}-uuid`));
  console.log('');
});
