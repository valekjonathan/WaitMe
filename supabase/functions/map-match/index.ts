import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const MAPBOX_SECRET = Deno.env.get("MAPBOX_SECRET_TOKEN");

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!MAPBOX_SECRET) {
    return new Response(
      JSON.stringify({ error: "MAPBOX_SECRET_TOKEN not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const points = body?.points ?? [];
    if (!Array.isArray(points) || points.length < 2) {
      return new Response(
        JSON.stringify({ error: "points array with at least 2 items required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const coords = points
      .map((p: { lat: number; lng: number }) => `${p.lng},${p.lat}`)
      .join(";");
    const timestamps = points
      .map((p: { timestamp?: number }) => p.timestamp ?? Math.floor(Date.now() / 1000))
      .join(";");

    const url = `https://api.mapbox.com/matching/v5/mapbox/driving/${coords}?access_token=${MAPBOX_SECRET}&geometries=geojson&tidy=true&timestamps=${timestamps}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: data.message ?? "Map matching failed" }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const match = data.matchings?.[0];
    const geometry = match?.geometry;
    const confidence = match?.confidence ?? 0;

    return new Response(
      JSON.stringify({ geometry, confidence }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
