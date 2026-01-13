import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const storeId = Deno.env.get('PORTONE_STORE_ID');
    const channelKey = Deno.env.get('PORTONE_CHANNEL_KEY');

    if (!storeId || !channelKey) {
      console.error('PortOne configuration not found');
      return new Response(
        JSON.stringify({ error: 'PortOne configuration not available' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store ID와 Channel Key는 publishable key이므로 클라이언트에 노출해도 안전
    return new Response(
      JSON.stringify({ storeId, channelKey }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error getting PortOne config:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
