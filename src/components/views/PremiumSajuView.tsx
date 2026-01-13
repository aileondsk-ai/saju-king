import { useState, useEffect } from "react";
import { ArrowLeft, Crown, Sparkles, Mail, Shield, Clock, Loader2, CheckCircle } from "lucide-react";
import { PremiumSajuInputForm, PremiumSajuFormData } from "@/components/forms/PremiumSajuInputForm";
import { StarField } from "@/components/ui/StarField";
import { usePortOnePayment } from "@/hooks/usePortOnePayment";
import { Button } from "@/components/ui/button";

interface PremiumSajuViewProps {
  onBack?: () => void;
}

export const PremiumSajuView = ({ onBack }: PremiumSajuViewProps) => {
  const [step, setStep] = useState<"input" | "payment" | "processing" | "complete">("input");
  const [orderData, setOrderData] = useState<(PremiumSajuFormData & { orderId: string; orderNumber: string }) | null>(null);
  const { requestPayment, isLoading: isPaymentLoading } = usePortOnePayment();

  // URL 파라미터에서 결제 완료 상태 확인
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('orderId');
    if (orderId) {
      setStep('complete');
    }
  }, []);

  const handleFormSubmit = (data: PremiumSajuFormData & { orderId: string; orderNumber: string }) => {
    setOrderData(data);
    // 결제 테스트: 결제 단계 건너뛰고 바로 결과 페이지로 이동
    window.location.href = `/?order=${encodeURIComponent(data.orderNumber)}`;
    // setStep("payment");
  };

  const handlePayment = async () => {
    if (!orderData) return;

    // 결제 테스트: 아래 결제 로직 주석 처리
    /*
    const result = await requestPayment({
      orderId: orderData.orderId,
      orderNumber: orderData.orderNumber,
      amount: 3900,
      customerName: orderData.name,
      customerEmail: orderData.email,
      customerPhone: orderData.contact,
    });

    if (result.success) {
      setStep("complete");
    }
    */
    // 테스트: 바로 결과 페이지로 이동
    window.location.href = `/?order=${encodeURIComponent(orderData.orderNumber)}`;
  };

  const handleBack = () => {
    if (step === "input" && onBack) {
      onBack();
    } else if (step === "payment") {
      setStep("input");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background pb-24">
      <StarField />

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            disabled={step === "processing" || step === "complete"}
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">뒤로</span>
          </button>
          <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-400" />
            프리미엄 사주
          </h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="relative z-10 px-4 py-6">
        {step === "input" && (
          <div className="space-y-6">
            {/* Hero Section */}
            <div className="text-center space-y-3 mb-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-sm text-amber-400">
                <Sparkles className="h-4 w-4" />
                AI 기반 프리미엄 분석
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                나만의 <span className="text-amber-400">운명 지도</span>를<br />
                받아보세요
              </h2>
              <p className="text-sm text-muted-foreground">
                전문가 수준의 깊이 있는 사주 분석을<br />
                이메일로 상세하게 받아보실 수 있습니다.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="rounded-xl border border-border/50 bg-card/50 p-3 text-center">
                <Mail className="h-5 w-5 text-primary mx-auto mb-1.5" />
                <p className="text-xs text-muted-foreground">이메일 발송</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-card/50 p-3 text-center">
                <Shield className="h-5 w-5 text-green-400 mx-auto mb-1.5" />
                <p className="text-xs text-muted-foreground">안전한 결제</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-card/50 p-3 text-center">
                <Clock className="h-5 w-5 text-amber-400 mx-auto mb-1.5" />
                <p className="text-xs text-muted-foreground">빠른 분석</p>
              </div>
            </div>

            {/* Form */}
            <PremiumSajuInputForm onSubmit={handleFormSubmit} />
          </div>
        )}

        {step === "payment" && orderData && (
          <div className="space-y-6 py-8">
            <div className="text-center space-y-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20">
                <Crown className="h-8 w-8 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  결제 정보 확인
                </h2>
                <p className="text-sm text-muted-foreground">
                  주문번호: {orderData.orderNumber}
                </p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">상품명</span>
                <span className="text-foreground font-medium">2026 프리미엄 사주 분석</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">신청자</span>
                <span className="text-foreground">{orderData.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">이메일</span>
                <span className="text-foreground text-sm">{orderData.email}</span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground">결제 금액</span>
                  <span className="text-xl font-bold text-amber-400">₩3,900</span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
              <p className="text-sm text-primary font-medium">📧 결제 후 진행 안내</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• 결제 완료 후 AI 사주 분석이 자동으로 시작됩니다</li>
                <li>• 분석 결과는 입력하신 이메일로 발송됩니다</li>
                <li>• 분석에는 약 1-2분 정도 소요됩니다</li>
              </ul>
            </div>

            {/* Payment Button */}
            <Button
              onClick={handlePayment}
              disabled={isPaymentLoading}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl shadow-lg"
            >
              {isPaymentLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  결제 처리 중...
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5 mr-2" />
                  ₩3,900 결제하기
                </>
              )}
            </Button>

            <button
              onClick={() => setStep("input")}
              className="w-full text-center text-primary hover:underline text-sm py-2"
              disabled={isPaymentLoading}
            >
              정보 수정하기
            </button>

            {/* Payment Methods */}
            <p className="text-center text-xs text-muted-foreground">
              신용카드 / 카카오페이 / 네이버페이 등 지원
            </p>
          </div>
        )}

        {step === "complete" && (
          <div className="text-center space-y-6 py-16">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                결제가 완료되었습니다!
              </h2>
              <p className="text-muted-foreground">
                AI 사주 분석이 진행 중입니다
              </p>
            </div>
            
            <div className="rounded-xl border border-border bg-card/50 p-6 space-y-4 text-left max-w-sm mx-auto">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                </div>
                <div>
                  <p className="font-medium text-foreground">분석 진행 중</p>
                  <p className="text-xs text-muted-foreground">약 1-2분 소요</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">이메일 발송 대기</p>
                  <p className="text-xs text-muted-foreground">분석 완료 후 자동 발송</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              분석이 완료되면 이메일로 결과를 보내드립니다.<br />
              잠시만 기다려주세요!
            </p>

            <Button
              onClick={onBack}
              variant="outline"
              className="mt-4"
            >
              홈으로 돌아가기
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};
