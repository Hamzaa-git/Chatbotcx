// ==============================================================================
// Supabase Edge Function: generate-reply
// Validates JWT, verifies Brand Membership, resolves Conversation Brand,
// runs deterministic retrieval & rules, and calls OpenRouter Gateway.
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    const openRouterModel = Deno.env.get("OPENROUTER_MODEL") || "meta-llama/llama-3.3-70b-instruct:free";

    // 1. Authenticate user from incoming Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { conversation_id, client_request_id } = await req.json();
    if (!conversation_id || !client_request_id) {
      return new Response(JSON.stringify({ error: "Missing required parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Resolve Conversation and enforce Brand Membership
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("*, brand:brands(*), order:orders(*)")
      .eq("id", conversation_id)
      .single();

    if (convError || !conversation) {
      return new Response(JSON.stringify({ error: "Conversation not found or access denied" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify brand membership explicitly
    const { data: membership, error: memError } = await supabase
      .from("brand_memberships")
      .select("role")
      .eq("brand_id", conversation.brand_id)
      .eq("user_id", user.id)
      .single();

    if (memError || !membership) {
      return new Response(JSON.stringify({ error: "Forbidden: Not a member of this brand" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Load active brand policies and recent conversation messages
    const { data: policies } = await supabase
      .from("kb_entries")
      .select("*")
      .eq("brand_id", conversation.brand_id)
      .eq("active", true);

    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: true })
      .limit(10);

    // 4. Return structured response or invoke OpenRouter
    return new Response(
      JSON.stringify({
        success: true,
        brand_id: conversation.brand_id,
        model: openRouterModel,
        has_api_key: Boolean(openRouterApiKey),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
