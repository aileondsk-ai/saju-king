import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentVerifyRequest {
  paymentId: string;
  orderId: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentId, orderId } = await req.json() as PaymentVerifyRequest;

    console.log(`Verifying payment: ${paymentId} for order: ${orderId}`);

    // PortOne API로 결제 검증
    const portoneSecret = Deno.env.get('PORTONE_API_SECRET');
    if (!portoneSecret) {
      throw new Error('PortOne API secret not configured');
    }

    // PortOne V2 API로 결제 정보 조회
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
    console.log('Payment data from PortOne:', JSON.stringify(paymentData, null, 2));

    // 결제 상태 확인
    if (paymentData.status !== 'PAID') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Payment not completed. Status: ${paymentData.status}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 금액 검증 (3,900원)
    const expectedAmount = 3900;
    if (paymentData.amount?.total !== expectedAmount) {
      console.error(`Amount mismatch: expected ${expectedAmount}, got ${paymentData.amount?.total}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Payment amount mismatch' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Supabase 클라이언트 생성
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 주문 정보 업데이트
    const { data: order, error: updateError } = await supabase
      .from('premium_saju_orders')
      .update({
        payment_status: 'paid',
        payment_id: paymentId,
        paid_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order:', updateError);
      throw new Error('Failed to update order status');
    }

    console.log('Order updated successfully:', order.order_number);

    // 사주 분석 시작 (비동기로 호출하고 응답은 즉시 반환)
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
        orderNumber: order.order_number,
        message: '결제가 완료되었습니다. 사주 분석이 시작됩니다.' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    console.error('Payment verification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Payment verification failed';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
