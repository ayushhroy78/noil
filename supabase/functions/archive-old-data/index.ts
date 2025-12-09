import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BATCH_SIZE = 1000;
const RETENTION_MONTHS = 18;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    // Use service role for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - RETENTION_MONTHS);
    const cutoffStr = cutoffDate.toISOString();

    const results = {
      daily_logs: { archived: 0, deleted: 0 },
      barcode_scans: { archived: 0, deleted: 0 },
      chat_messages: { archived: 0, deleted: 0 },
      point_transactions: { archived: 0, deleted: 0 },
    };

    // Archive daily_logs
    const { data: oldLogs } = await supabase
      .from("daily_logs")
      .select("*")
      .lt("created_at", cutoffStr)
      .limit(BATCH_SIZE);

    if (oldLogs && oldLogs.length > 0) {
      const { error: insertError } = await supabase
        .from("daily_logs_archive")
        .insert(oldLogs.map(log => ({ ...log, archived_at: new Date().toISOString() })));

      if (!insertError) {
        const ids = oldLogs.map(l => l.id);
        const { error: deleteError } = await supabase
          .from("daily_logs")
          .delete()
          .in("id", ids);

        if (!deleteError) {
          results.daily_logs = { archived: oldLogs.length, deleted: oldLogs.length };
        }
      }
    }

    // Archive barcode_scans
    const { data: oldScans } = await supabase
      .from("barcode_scans")
      .select("*")
      .lt("created_at", cutoffStr)
      .limit(BATCH_SIZE);

    if (oldScans && oldScans.length > 0) {
      const { error: insertError } = await supabase
        .from("barcode_scans_archive")
        .insert(oldScans.map(scan => ({ ...scan, archived_at: new Date().toISOString() })));

      if (!insertError) {
        const ids = oldScans.map(s => s.id);
        const { error: deleteError } = await supabase
          .from("barcode_scans")
          .delete()
          .in("id", ids);

        if (!deleteError) {
          results.barcode_scans = { archived: oldScans.length, deleted: oldScans.length };
        }
      }
    }

    // Archive chat_messages
    const { data: oldMessages } = await supabase
      .from("chat_messages")
      .select("*")
      .lt("created_at", cutoffStr)
      .limit(BATCH_SIZE);

    if (oldMessages && oldMessages.length > 0) {
      const { error: insertError } = await supabase
        .from("chat_messages_archive")
        .insert(oldMessages.map(msg => ({ ...msg, archived_at: new Date().toISOString() })));

      if (!insertError) {
        const ids = oldMessages.map(m => m.id);
        const { error: deleteError } = await supabase
          .from("chat_messages")
          .delete()
          .in("id", ids);

        if (!deleteError) {
          results.chat_messages = { archived: oldMessages.length, deleted: oldMessages.length };
        }
      }
    }

    // Archive point_transactions
    const { data: oldTransactions } = await supabase
      .from("point_transactions")
      .select("*")
      .lt("created_at", cutoffStr)
      .limit(BATCH_SIZE);

    if (oldTransactions && oldTransactions.length > 0) {
      const { error: insertError } = await supabase
        .from("point_transactions_archive")
        .insert(oldTransactions.map(tx => ({ ...tx, archived_at: new Date().toISOString() })));

      if (!insertError) {
        const ids = oldTransactions.map(t => t.id);
        const { error: deleteError } = await supabase
          .from("point_transactions")
          .delete()
          .in("id", ids);

        if (!deleteError) {
          results.point_transactions = { archived: oldTransactions.length, deleted: oldTransactions.length };
        }
      }
    }

    const latency = Date.now() - startTime;
    console.log(`[archive-old-data] completed in ${latency}ms`, results);

    return new Response(JSON.stringify({ 
      success: true, 
      results,
      cutoff_date: cutoffStr,
      latency_ms: latency 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[archive-old-data] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
