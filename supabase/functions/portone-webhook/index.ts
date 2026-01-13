import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-portone-signature',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    console.log('PortOne webhook received:', body);

    const webhookData = JSON.parse(body);
    const { type, data } = webhookData;

    console.log('Webhook type:', type);
    console.log('Webhook data:', JSON.stringify(data, null, 2));

    // 결제 완료 이벤트만 처리
    if (type !== 'Transaction.Paid') {
      console.log('Ignoring non-payment event:', type);
      return new Response(
        JSON.stringify({ success: true, message: 'Event ignored' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paymentId = data?.paymentId;
    if (!paymentId) {
      console.error('No paymentId in webhook data');
      return new Response(
        JSON.stringify({ success: false, error: 'No paymentId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PortOne API로 결제 정보 조회하여 검증
    const portoneSecret = Deno.env.get('PORTONE_API_SECRET');
    if (!portoneSecret) {
      throw new Error('PortOne API secret not configured');
    }

    const paymentResponse = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
      {
        headers: {
          'Authorization': `PortOne ${portoneSecret}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      console.error('PortOne API error:', errorText);
      throw new Error(`Failed to verify payment: ${paymentResponse.status}`);
    }

    const paymentData = await paymentResponse.json();
    console.log('Payment verified:', JSON.stringify(paymentData, null, 2));

    // 결제 상태 확인
    if (paymentData.status !== 'PAID') {
      console.log('Payment not completed:', paymentData.status);
      return new Response(
        JSON.stringify({ success: true, message: 'Payment not yet completed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // customData에서 orderId 추출
    const orderId = paymentData.customData?.orderId;
    if (!orderId) {
      console.error('No orderId in payment customData');
      return new Response(
        JSON.stringify({ success: false, error: 'No orderId in payment data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Supabase 클라이언트 생성
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 주문 정보 조회
    const { data: existingOrder, error: fetchError } = await supabase
      .from('premium_saju_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError) {
      console.error('Error fetching order:', fetchError);
      throw new Error('Order not found');
    }

    // 이미 결제 완료된 주문인지 확인
    if (existingOrder.payment_status === 'paid') {
      console.log('Order already paid, skipping:', orderId);
      return new Response(
        JSON.stringify({ success: true, message: 'Order already processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 금액 검증
    const expectedAmount = 3900;
    if (paymentData.amount?.total !== expectedAmount) {
      console.error(`Amount mismatch: expected ${expectedAmount}, got ${paymentData.amount?.total}`);
      
      // 금액 불일치 시 주문 상태를 failed로 업데이트
      await supabase
        .from('premium_saju_orders')
        .update({ payment_status: 'failed' })
        .eq('id', orderId);

      return new Response(
        JSON.stringify({ success: false, error: 'Amount mismatch' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 주문 정보 업데이트
    const { error: updateError } = await supabase
      .from('premium_saju_orders')
      .update({
        payment_status: 'paid',
        payment_id: paymentId,
        paid_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order:', updateError);
      throw new Error('Failed to update order status');
    }

    console.log('Order updated via webhook:', orderId);

    // 분석 결과가 이미 있는지 확인
    const { data: existingResult } = await supabase
      .from('premium_saju_results')
      .select('id')
      .eq('order_id', orderId)
      .single();

    if (existingResult) {
      console.log('Analysis already exists for order:', orderId);
      return new Response(
        JSON.stringify({ success: true, message: 'Analysis already completed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 사주 분석 시작
    console.log('Starting premium saju analysis for order:', orderId);
    
    fetch(
      `${supabaseUrl}/functions/v1/premium-saju-analysis`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      }
    ).then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Analysis function error:', errorText);
      } else {
        console.log('Analysis completed successfully');
      }
    }).catch((err) => {
      console.error('Error calling analysis:', err);
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Payment processed and analysis started' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Webhook processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Webhook processing failed';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
