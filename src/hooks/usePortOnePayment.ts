import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaymentOptions {
  orderId: string;
  orderNumber: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

interface PaymentResult {
  success: boolean;
  orderNumber?: string;
  error?: string;
}

interface PortOneConfig {
  storeId: string;
  channelKey: string;
}

declare global {
  interface Window {
    PortOne?: {
      requestPayment: (options: any) => Promise<any>;
    };
  }
}

export const usePortOnePayment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadPortOneSDK = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.PortOne) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.portone.io/v2/browser-sdk.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('PortOne SDK 로드 실패'));
      document.head.appendChild(script);
    });
  }, []);

  const getPortOneConfig = useCallback(async (): Promise<PortOneConfig> => {
    const { data, error } = await supabase.functions.invoke('portone-config');
    
    if (error || !data?.storeId || !data?.channelKey) {
      throw new Error('PortOne 설정을 불러올 수 없습니다');
    }
    
    return {
      storeId: data.storeId,
      channelKey: data.channelKey,
    };
  }, []);

  const requestPayment = useCallback(async (options: PaymentOptions): Promise<PaymentResult> => {
    setIsLoading(true);

    try {
      // PortOne SDK 로드
      await loadPortOneSDK();

      if (!window.PortOne) {
        throw new Error('PortOne SDK를 불러올 수 없습니다');
      }

      // 서버에서 PortOne 설정 가져오기
      const { storeId, channelKey } = await getPortOneConfig();

      // 고유한 paymentId 생성 (orderId를 포함하여 나중에 추출 가능)
      const paymentId = `${options.orderId}_${Date.now()}`;

      // 모바일 여부 체크
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // KG이니시스 결제창에서 요구하는 customer 필드를 포함한 payload
      // PortOne 문서 상 currency는 ISO 4217 알파벳 코드("KRW")를 권장
      const basePayload: Record<string, any> = {
        storeId,
        channelKey,
        paymentId,
        orderName: '2026 프리미엄 사주 분석',
        totalAmount: options.amount,
        currency: 'KRW',
        payMethod: 'CARD',
        customer: {
          fullName: options.customerName,
          email: options.customerEmail,
          phoneNumber: options.customerPhone,
        },
      };

      // 모바일: 리디렉션 방식 사용 (결제 완료 후 /payment-redirect로 복귀)
      // orderId를 query로 같이 넘겨, redirect 이후에도 안정적으로 주문을 찾도록 합니다.
      const payload: Record<string, any> = isMobile
        ? {
            ...basePayload,
            windowType: { mobile: 'REDIRECTION' },
            redirectUrl: `${window.location.origin}/payment-redirect?orderId=${encodeURIComponent(options.orderId)}`,
          }
        : basePayload;

      console.log('PortOne.requestPayment payload:', payload);

      // PortOne 결제 요청
      const response = await window.PortOne.requestPayment(payload);

      console.log('PortOne payment response:', response);

      // 결제 실패 처리
      if (response.code) {
        throw new Error(response.message || '결제가 취소되었습니다');
      }

      // 결제 성공 - 서버에서 검증
      const { data, error } = await supabase.functions.invoke('portone-verify-payment', {
        body: {
          paymentId: response.paymentId,
          orderId: options.orderId,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || '결제 검증에 실패했습니다');
      }

      toast({
        title: '결제 완료!',
        description: '사주 분석이 시작되었습니다. 이메일로 결과를 보내드립니다.',
      });

      return {
        success: true,
        orderNumber: data.orderNumber,
      };

    } catch (error: any) {
      console.error('Payment error:', error);
      
      toast({
        title: '결제 실패',
        description: error.message || '결제 처리 중 오류가 발생했습니다',
        variant: 'destructive',
      });

      return {
        success: false,
        error: error.message,
      };
    } finally {
      setIsLoading(false);
    }
  }, [loadPortOneSDK, getPortOneConfig, toast]);

  return {
    requestPayment,
    isLoading,
  };
};
