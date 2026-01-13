import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  orderId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId }: EmailRequest = await req.json();
    console.log('Sending email for order:', orderId);

    // Supabase 클라이언트 초기화
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 주문 정보 조회
    const { data: order, error: orderError } = await supabase
      .from('premium_saju_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      throw new Error('주문 정보를 찾을 수 없습니다.');
    }

    // 분석 결과 조회
    const { data: result, error: resultError } = await supabase
      .from('premium_saju_results')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (resultError || !result) {
      console.error('Result not found:', resultError);
      throw new Error('분석 결과를 찾을 수 없습니다.');
    }

    // 마크다운을 HTML로 변환 (간단한 변환)
    const analysisHtml = result.analysis_content
      .replace(/^### (.*$)/gim, '<h3 style="color: #8b5cf6; margin-top: 24px;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="color: #7c3aed; margin-top: 32px; border-bottom: 2px solid #e9d5ff; padding-bottom: 8px;">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="color: #6d28d9; margin-top: 40px;">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li style="margin: 4px 0;">$1</li>')
      .replace(/\n/g, '<br>')
      .replace(/---/g, '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">');

    // 이메일 HTML 템플릿
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>사주킹 프리미엄 사주 분석 결과</title>
</head>
<body style="font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; background-color: #0f0f23; color: #ffffff; margin: 0; padding: 0;">
  <div style="max-width: 700px; margin: 0 auto; padding: 40px 20px;">
    <!-- 헤더 -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #a78bfa; font-size: 32px; margin-bottom: 8px;">🔮 사주킹</h1>
      <p style="color: #8b5cf6; font-size: 14px; margin: 0;">프리미엄 사주 분석 서비스</p>
    </div>

    <!-- 인사말 -->
    <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(30, 30, 60, 0.8)); border-radius: 16px; padding: 24px; margin-bottom: 32px; border: 1px solid rgba(139, 92, 246, 0.3);">
      <h2 style="color: #fbbf24; margin: 0 0 16px 0; font-size: 24px;">
        ${order.name}님, 분석이 완료되었습니다! ✨
      </h2>
      <p style="color: #a0aec0; margin: 0; line-height: 1.6;">
        2026년 병오년, ${order.name}님만을 위한 맞춤 사주 분석 결과를 보내드립니다.<br>
        한 해 동안 이 분석이 좋은 길잡이가 되길 바랍니다.
      </p>
    </div>

    <!-- 분석 결과 -->
    <div style="background-color: #1a1a2e; border-radius: 16px; padding: 32px; border: 1px solid #2d3748;">
      ${analysisHtml}
    </div>

    <!-- 푸터 -->
    <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #2d3748;">
      <p style="color: #718096; font-size: 12px; line-height: 1.8;">
        본 분석은 전통 명리학과 현대적 해석을 바탕으로 작성되었습니다.<br>
        중요한 결정은 전문가와 상담하시기 바랍니다.
      </p>
      <p style="color: #4a5568; font-size: 11px; margin-top: 16px;">
        주문번호: ${order.order_number}<br>
        © 2026 사주킹. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // 이메일 발송
    const emailResponse = await resend.emails.send({
      from: "사주킹 <onboarding@resend.dev>",
      to: [order.email],
      subject: `🔮 [사주킹] ${order.name}님의 2026년 프리미엄 사주 분석 결과`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    // 이메일 발송 상태 업데이트
    const { error: updateError } = await supabase
      .from('premium_saju_results')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
      })
      .eq('order_id', orderId);

    if (updateError) {
      console.error('Failed to update email status:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '이메일이 성공적으로 발송되었습니다.',
        emailId: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error) {
    console.error("Error in send-premium-result-email:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
