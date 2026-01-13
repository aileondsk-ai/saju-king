import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { StarField } from '@/components/ui/StarField';
import { Button } from '@/components/ui/button';

type VerificationStatus = 'verifying' | 'success' | 'failed';

export default function PaymentRedirect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [message, setMessage] = useState('결제 결과를 확인하고 있습니다...');

  useEffect(() => {
    const verifyPayment = async () => {
      // 쿼리 파라미터에서 결제 결과 추출 (케이스별 파라미터명이 달라질 수 있어 fallback 처리)
      const paymentId =
        searchParams.get('paymentId') ??
        searchParams.get('payment_id') ??
        searchParams.get('paymentID');

      const code =
        searchParams.get('code') ??
        searchParams.get('errorCode') ??
        searchParams.get('pgCode');

      const errorMessage =
        searchParams.get('message') ??
        searchParams.get('errorMessage') ??
        searchParams.get('pgMessage');

      const orderIdFromQuery = searchParams.get('orderId');

      console.log('Payment redirect params:', { paymentId, code, errorMessage, orderIdFromQuery });

      // 결제 실패 케이스
      if (code) {
        setStatus('failed');
        setMessage(errorMessage || '결제가 취소되었거나 실패했습니다.');
        return;
      }

      // paymentId가 없는 경우
      if (!paymentId) {
        setStatus('failed');
        setMessage('결제 정보를 찾을 수 없습니다. (paymentId 누락)');
        return;
      }

      try {
        // orderId는 redirectUrl에 붙여서 넘긴 query를 우선 사용
        // (과거 로직: paymentId에서 분리)
        const derivedOrderId = paymentId.includes('_')
          ? paymentId.split('_').slice(0, -1).join('_')
          : null;

        const orderId = orderIdFromQuery ?? derivedOrderId;

        if (!orderId) {
          setStatus('failed');
          setMessage('주문 정보를 찾을 수 없습니다. 다시 시도해주세요.');
          return;
        }

        console.log('Verifying payment:', { paymentId, orderId });

        // 서버에서 결제 검증
        const { data, error } = await supabase.functions.invoke('portone-verify-payment', {
          body: {
            paymentId,
            orderId,
          },
        });

        if (error || !data?.success) {
          throw new Error(data?.error || '결제 검증에 실패했습니다');
        }

        setStatus('success');
        setMessage('결제가 완료되었습니다! 사주 분석이 시작되었으며, 완료 후 이메일로 결과를 보내드립니다.');

      } catch (error: any) {
        console.error('Payment verification error:', error);
        setStatus('failed');
        setMessage(error.message || '결제 검증 중 오류가 발생했습니다.');
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handleGoHome = () => {
    navigate('/?tab=premium-saju');
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4">
      <StarField />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-8 text-center">
          {status === 'verifying' && (
            <>
              <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-6" />
              <h1 className="text-xl font-semibold text-foreground mb-2">
                결제 확인 중
              </h1>
              <p className="text-muted-foreground">
                {message}
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="text-xl font-semibold text-foreground mb-2">
                결제 완료! 🎉
              </h1>
              <p className="text-muted-foreground mb-6">
                {message}
              </p>
              <Button onClick={handleGoHome} className="w-full">
                홈으로 돌아가기
              </Button>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-destructive" />
              </div>
              <h1 className="text-xl font-semibold text-foreground mb-2">
                결제 실패
              </h1>
              <p className="text-muted-foreground mb-6">
                {message}
              </p>
              <Button onClick={handleGoHome} variant="outline" className="w-full">
                다시 시도하기
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
