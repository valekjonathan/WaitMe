import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const DISTANCE_THRESHOLD_M = 5;
const MAX_ACCURACY_M = 30;
const RATE_LIMIT_WINDOW_MS = 5000;
const RATE_LIMIT_MAX = 5;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-idempotency-key',
};

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  let times = rateLimitMap.get(userId) ?? [];
  times = times.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (times.length >= RATE_LIMIT_MAX) return false;
  times.push(now);
  rateLimitMap.set(userId, times);
  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Server configuration missing' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();
    const {
      alertId,
      userAId,
      userBId,
      distance: clientDistance,
      timestamp,
      idempotencyKey,
      accuracyUserA,
      accuracyUserB,
    } = body ?? {};

    if (!alertId || !userAId || !userBId) {
      return new Response(JSON.stringify({ error: 'alertId, userAId, userBId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const key = idempotencyKey ?? `${alertId}-${userBId}-${timestamp ?? Date.now()}`;

    if (!checkRateLimit(userBId)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: existing } = await supabase
      .from('payment_release_log')
      .select('transaction_id')
      .eq('idempotency_key', key)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ ok: true, idempotent: true, transactionId: existing.transaction_id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: locA } = await supabase
      .from('user_locations')
      .select('lat, lng, accuracy_m')
      .eq('user_id', userAId)
      .maybeSingle();

    const { data: locB } = await supabase
      .from('user_locations')
      .select('lat, lng, accuracy_m')
      .eq('user_id', userBId)
      .maybeSingle();

    if (!locA || !locB) {
      return new Response(JSON.stringify({ error: 'User locations not found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accA = locA.accuracy_m ?? accuracyUserA ?? Infinity;
    const accB = locB.accuracy_m ?? accuracyUserB ?? Infinity;
    if (accA > MAX_ACCURACY_M || accB > MAX_ACCURACY_M) {
      return new Response(
        JSON.stringify({ error: 'Accuracy too low', accuracyA: accA, accuracyB: accB }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serverDistance = haversineMeters(locA.lat, locA.lng, locB.lat, locB.lng);

    if (serverDistance > DISTANCE_THRESHOLD_M) {
      return new Response(
        JSON.stringify({
          error: 'Distance exceeds threshold',
          distance: serverDistance,
          maxAllowed: DISTANCE_THRESHOLD_M,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: alert } = await supabase
      .from('parking_alerts')
      .select('id, status, seller_id')
      .eq('id', alertId)
      .maybeSingle();

    if (!alert) {
      return new Response(JSON.stringify({ error: 'Alert not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sellerId = alert.seller_id ?? (alert as { user_id?: string }).user_id;
    if (sellerId !== userAId) {
      return new Response(JSON.stringify({ error: 'User A is not the seller' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const status = alert.status;
    if (status !== 'reserved' && status !== 'active') {
      return new Response(JSON.stringify({ error: 'Alert not active', status }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: txRows } = await supabase
      .from('transactions')
      .select('id, status, metadata')
      .eq('alert_id', alertId)
      .eq('buyer_id', userBId)
      .eq('seller_id', userAId)
      .in('status', ['pending'])
      .limit(1);

    const tx = txRows?.[0];
    if (!tx) {
      const { data: anyTx } = await supabase
        .from('transactions')
        .select('id, status')
        .eq('alert_id', alertId)
        .maybeSingle();
      if (anyTx?.status === 'completed') {
        await supabase
          .from('payment_release_log')
          .upsert(
            { idempotency_key: key, transaction_id: anyTx.id, alert_id: alertId },
            { onConflict: 'idempotency_key' }
          );
        return new Response(
          JSON.stringify({ ok: true, idempotent: true, transactionId: anyTx.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(JSON.stringify({ error: 'No pending transaction found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    const paymentIntentId = (tx.metadata as Record<string, unknown>)?.payment_intent_id as
      | string
      | undefined;

    if (stripeSecret && paymentIntentId) {
      try {
        const stripeRes = await fetch(
          `https://api.stripe.com/v1/payment_intents/${paymentIntentId}/capture`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${stripeSecret}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: '',
          }
        );
        if (!stripeRes.ok) {
          const errData = await stripeRes.json().catch(() => ({}));
          return new Response(
            JSON.stringify({
              error: 'Stripe capture failed',
              details:
                (errData as { error?: { message?: string } })?.error?.message ??
                stripeRes.statusText,
            }),
            { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (stripeErr) {
        return new Response(
          JSON.stringify({ error: 'Stripe capture error', details: String(stripeErr) }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const { error: updateErr } = await supabase
      .from('transactions')
      .update({ status: 'completed' })
      .eq('id', tx.id);

    if (updateErr) {
      return new Response(
        JSON.stringify({ error: 'Failed to complete transaction', details: updateErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await supabase.from('payment_release_log').insert({
      idempotency_key: key,
      transaction_id: tx.id,
      alert_id: alertId,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        transactionId: tx.id,
        distance: serverDistance,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
