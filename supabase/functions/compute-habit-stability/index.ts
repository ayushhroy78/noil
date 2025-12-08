import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DailyLog {
  date: string;
  total_oil_ml: number;
}

interface BarcodeScan {
  scan_date: string;
  oil_content_ml: number;
}

// HSS Calculation functions (same as frontend)
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
}

function calculateCV(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  if (avg === 0) return 0;
  return (calculateStdDev(values) / avg) * 100;
}

function calculateMicroVariance(values: number[]): number {
  if (values.length < 3) return 100;
  const uniqueValues = new Set(values);
  if (uniqueValues.size === 1) return 0;
  const valueCounts = new Map<number, number>();
  values.forEach(v => valueCounts.set(v, (valueCounts.get(v) || 0) + 1));
  const maxRepeat = Math.max(...valueCounts.values());
  const repeatRatio = maxRepeat / values.length;
  if (repeatRatio > 0.7) return 20;
  if (repeatRatio > 0.5) return 50;
  const uniqueRatio = uniqueValues.size / values.length;
  if (uniqueRatio < 0.3) return 40;
  return Math.min(100, uniqueRatio * 100 + 20);
}

function calculateFlatlineScore(values: number[]): number {
  if (values.length < 7) return 100;
  const cv = calculateCV(values);
  if (cv < 5) return 10;
  if (cv < 10) return 30;
  if (cv < 15) return 60;
  if (cv > 150) return 50;
  return 100;
}

function countSuddenDrops(values: number[]): number {
  if (values.length < 3) return 0;
  let dropCount = 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] > avg * 1.5 && values[i] < avg * 0.2) dropCount++;
  }
  return dropCount;
}

function calculateWeekendWeekdayDiff(logs: DailyLog[]): number {
  if (logs.length < 7) return 100;
  const weekendLogs: number[] = [];
  const weekdayLogs: number[] = [];
  logs.forEach(log => {
    const dayOfWeek = new Date(log.date).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendLogs.push(log.total_oil_ml);
    } else {
      weekdayLogs.push(log.total_oil_ml);
    }
  });
  if (weekendLogs.length === 0 || weekdayLogs.length === 0) return 100;
  const weekendAvg = weekendLogs.reduce((a, b) => a + b, 0) / weekendLogs.length;
  const weekdayAvg = weekdayLogs.reduce((a, b) => a + b, 0) / weekdayLogs.length;
  const diff = Math.abs(weekendAvg - weekdayAvg);
  const avgTotal = (weekendAvg + weekdayAvg) / 2;
  if (avgTotal === 0) return 100;
  const diffPercent = (diff / avgTotal) * 100;
  if (diffPercent < 5) return 70;
  if (diffPercent < 30) return 100;
  if (diffPercent > 80) return 60;
  return 90;
}

function calculateHouseholdNormalizedScore(avgOil: number, householdSize: number): number {
  const expectedMin = 5 * householdSize;
  const expectedMax = 40 * householdSize;
  const expectedIdeal = 20 * householdSize;
  
  if (avgOil >= expectedMin && avgOil <= expectedMax) {
    const distanceFromIdeal = Math.abs(avgOil - expectedIdeal);
    const maxDistance = Math.max(expectedIdeal - expectedMin, expectedMax - expectedIdeal);
    return 100 - (distanceFromIdeal / maxDistance) * 30;
  }
  
  if (avgOil < expectedMin) {
    const ratio = avgOil / expectedMin;
    if (ratio < 0.3) return 10;
    if (ratio < 0.5) return 30;
    return 50;
  }
  
  const ratio = avgOil / expectedMax;
  if (ratio > 2) return 60;
  return 80;
}

function calculateBarcodeContradiction(avgLoggedOil: number, scans: BarcodeScan[]): number {
  if (scans.length === 0) return 100;
  const totalBarcodeOil = scans.reduce((sum, scan) => sum + scan.oil_content_ml, 0);
  const avgBarcodeOilPerDay = totalBarcodeOil / 30;
  if (avgLoggedOil < 15 && avgBarcodeOilPerDay > 30) return 30;
  if (avgLoggedOil < avgBarcodeOilPerDay * 0.5 && avgBarcodeOilPerDay > 20) return 50;
  return 100;
}

function countBulkEdits(logs: DailyLog[]): number {
  const logsByDate = new Map<string, number>();
  logs.forEach(log => logsByDate.set(log.date, (logsByDate.get(log.date) || 0) + 1));
  let bulkCount = 0;
  logsByDate.forEach(count => { if (count > 5) bulkCount++; });
  return bulkCount;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, compute_all } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const usersToCompute: string[] = [];

    if (compute_all) {
      // Get all users with logs
      const { data: users } = await supabase
        .from('daily_logs')
        .select('user_id')
        .limit(1000);
      
      const uniqueUsers = [...new Set(users?.map(u => u.user_id) || [])];
      usersToCompute.push(...uniqueUsers);
    } else if (user_id) {
      usersToCompute.push(user_id);
    } else {
      return new Response(
        JSON.stringify({ error: 'user_id or compute_all required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    for (const uid of usersToCompute) {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [logsResult, scansResult, profileResult] = await Promise.all([
          supabase
            .from('daily_logs')
            .select('log_date, amount_ml')
            .eq('user_id', uid)
            .gte('log_date', thirtyDaysAgo.toISOString().split('T')[0]),
          supabase
            .from('barcode_scans')
            .select('scan_date, oil_content_ml')
            .eq('user_id', uid)
            .gte('scan_date', thirtyDaysAgo.toISOString()),
          supabase
            .from('user_profiles')
            .select('household_size')
            .eq('user_id', uid)
            .maybeSingle()
        ]);

        const dailyLogs: DailyLog[] = (logsResult.data || []).map(log => ({
          date: log.log_date,
          total_oil_ml: Number(log.amount_ml)
        }));

        const barcodeScans: BarcodeScan[] = (scansResult.data || []).map(scan => ({
          scan_date: scan.scan_date,
          oil_content_ml: Number(scan.oil_content_ml)
        }));

        const householdSize = profileResult.data?.household_size || 1;

        // Calculate HSS
        if (dailyLogs.length < 5) {
          results.push({ user_id: uid, status: 'insufficient_data' });
          continue;
        }

        const oilValues = dailyLogs.map(l => l.total_oil_ml);
        const avgOil = oilValues.reduce((a, b) => a + b, 0) / oilValues.length;
        const cv = calculateCV(oilValues);

        const microVarianceScore = calculateMicroVariance(oilValues);
        const flatlineScore = calculateFlatlineScore(oilValues);
        const suddenDropCount = countSuddenDrops(oilValues);
        const weekendWeekdayScore = calculateWeekendWeekdayDiff(dailyLogs);
        const householdNormalizedScore = calculateHouseholdNormalizedScore(avgOil, householdSize);
        const barcodeContradictionScore = calculateBarcodeContradiction(avgOil, barcodeScans);
        const bulkEditCount = countBulkEdits(dailyLogs);
        const logsPerWeek = (dailyLogs.length / 30) * 7;
        const loggingFrequencyScore = logsPerWeek >= 5 && logsPerWeek <= 14 ? 100 :
          logsPerWeek < 2 ? 60 : logsPerWeek < 5 ? 80 : logsPerWeek > 21 ? 50 : 70;

        // Build signals
        const signals = [
          { name: 'volatility', value: 100 - Math.min(100, cv), weight: 0.15 },
          { name: 'micro_variance', value: microVarianceScore, weight: 0.12 },
          { name: 'household_normalized', value: householdNormalizedScore, weight: 0.18 },
          { name: 'barcode_contradiction', value: barcodeContradictionScore, weight: 0.12 },
          { name: 'logging_frequency', value: loggingFrequencyScore, weight: 0.10 },
          { name: 'flatline', value: flatlineScore, weight: 0.10 },
          { name: 'sudden_drops', value: suddenDropCount > 2 ? 30 : suddenDropCount > 0 ? 70 : 100, weight: 0.08 },
          { name: 'weekend_weekday', value: weekendWeekdayScore, weight: 0.08 },
        ];

        const flags: string[] = [];
        if (microVarianceScore < 30) flags.push('REPETITIVE_VALUES');
        if (householdNormalizedScore < 30) flags.push('HOUSEHOLD_MISMATCH');
        if (barcodeContradictionScore < 40) flags.push('BARCODE_CONTRADICTION');
        if (flatlineScore < 30) flags.push('FLATLINE_PATTERN');
        if (suddenDropCount > 2) flags.push('SUDDEN_DROPS');
        if (bulkEditCount > 2) flags.push('BULK_EDITS_DETECTED');

        const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0);
        const weightedSum = signals.reduce((sum, s) => sum + (s.value * s.weight), 0);
        const rawScore = weightedSum / totalWeight;
        const bulkPenalty = Math.min(20, bulkEditCount * 5);
        const finalScore = Math.max(0, Math.min(100, Math.round(rawScore - bulkPenalty)));

        const honestyLevel = finalScore >= 75 ? 'high' : finalScore >= 45 ? 'medium' : 'low';
        const rewardMultiplier = honestyLevel === 'high' ? 1.2 : honestyLevel === 'medium' ? 1.0 : 0.5;

        const featureVector = {
          avg_oil_ml: Math.round(avgOil * 100) / 100,
          std_dev_oil_ml: Math.round(calculateStdDev(oilValues) * 100) / 100,
          coefficient_of_variation: Math.round(cv * 100) / 100,
          micro_variance_score: microVarianceScore,
          household_normalized_score: householdNormalizedScore,
          barcode_contradiction_score: barcodeContradictionScore,
          flatline_score: flatlineScore,
          sudden_drop_count: suddenDropCount,
          bulk_edit_count: bulkEditCount,
          logs_per_week: Math.round(logsPerWeek * 100) / 100,
          household_size: householdSize,
          weekend_weekday_diff: weekendWeekdayScore,
          logging_frequency_score: loggingFrequencyScore,
        };

        // Upsert to habit_integrity
        const { error: upsertError } = await supabase
          .from('habit_integrity')
          .upsert({
            user_id: uid,
            habit_stability_score: finalScore,
            honesty_level: honestyLevel,
            reward_multiplier: rewardMultiplier,
            flags,
            feature_vector: featureVector,
            signals,
            last_computed_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (upsertError) {
          console.error(`Error upserting for user ${uid}:`, upsertError);
          results.push({ user_id: uid, status: 'error', error: upsertError.message });
        } else {
          results.push({ 
            user_id: uid, 
            status: 'success', 
            score: finalScore, 
            honesty_level: honestyLevel 
          });
        }
      } catch (userError) {
        console.error(`Error processing user ${uid}:`, userError);
        results.push({ user_id: uid, status: 'error', error: String(userError) });
      }
    }

    console.log(`Computed HSS for ${results.length} users`);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in compute-habit-stability:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
