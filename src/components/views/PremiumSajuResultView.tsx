import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Crown, 
  Download, 
  Mail, 
  Home, 
  RefreshCw, 
  CheckCircle,
  AlertCircle,
  Sparkles,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface OrderData {
  id: string;
  name: string;
  email: string;
  order_number: string;
  payment_status: string;
  created_at: string;
}

interface ResultData {
  analysis_content: string;
  email_sent: boolean;
  email_sent_at: string | null;
  created_at: string;
}

export function PremiumSajuResultView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderNumber = searchParams.get('order');
  
  const [order, setOrder] = useState<OrderData | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resendingEmail, setResendingEmail] = useState(false);

  useEffect(() => {
    if (orderNumber) {
      fetchResult();
    } else {
      setError('주문번호가 없습니다.');
      setLoading(false);
    }
  }, [orderNumber]);

  // 결과가 없으면 자동 폴링 (10초마다)
  useEffect(() => {
    if (!result && order && !loading && !error) {
      const interval = setInterval(() => {
        fetchResult();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [result, order, loading, error]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      setError(null);

      // 주문 정보 조회
      const { data: orderData, error: orderError } = await supabase
        .from('premium_saju_orders')
        .select('*')
        .eq('order_number', orderNumber)
        .single();

      if (orderError || !orderData) {
        throw new Error('주문 정보를 찾을 수 없습니다.');
      }

      setOrder(orderData);

      // 결과 조회
      const { data: resultData, error: resultError } = await supabase
        .from('premium_saju_results')
        .select('*')
        .eq('order_id', orderData.id)
        .single();

      if (resultError || !resultData) {
        // 결과가 아직 없으면 분석 중으로 표시
        setResult(null);
      } else {
        setResult(resultData);
      }
    } catch (err) {
      console.error('Failed to fetch result:', err);
      setError(err instanceof Error ? err.message : '결과를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!order) return;
    
    try {
      setResendingEmail(true);
      
      const { data, error } = await supabase.functions.invoke('send-premium-result-email', {
        body: { orderId: order.id }
      });

      if (error) throw error;

      toast.success('이메일이 재발송되었습니다!');
    } catch (err) {
      console.error('Email resend failed:', err);
      toast.error('이메일 발송에 실패했습니다.');
    } finally {
      setResendingEmail(false);
    }
  };

  const handleDownload = () => {
    if (!result || !order) return;

    // 텍스트 파일로 다운로드
    const blob = new Blob([result.analysis_content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${order.name}님의_프리미엄_사주_분석_2026.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('파일이 다운로드되었습니다!');
  };

  const handleDownloadPDF = () => {
    if (!result || !order) return;

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // 한글 폰트 지원을 위해 유니코드 설정
      doc.setFont('helvetica');
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let yPosition = margin;

      // 제목
      doc.setFontSize(20);
      doc.setTextColor(139, 92, 246); // primary color
      const title = `${order.name}님의 2026년 프리미엄 사주 분석`;
      doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // 날짜
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      const dateStr = `분석일: ${new Date(result.created_at).toLocaleDateString('ko-KR')}`;
      doc.text(dateStr, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // 구분선
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // 본문 내용 - 마크다운 기호 제거 및 정리
      doc.setFontSize(11);
      doc.setTextColor(50, 50, 50);

      // 마크다운을 플레인 텍스트로 변환
      const plainText = result.analysis_content
        .replace(/#{1,6}\s/g, '') // 헤더 기호 제거
        .replace(/\*\*/g, '')     // 볼드 기호 제거
        .replace(/\*/g, '')       // 이탤릭 기호 제거
        .replace(/`/g, '')        // 코드 기호 제거
        .replace(/---/g, '━━━━━━━━━━━━━━━━━━━━━━━━') // 구분선
        .replace(/- /g, '• ')     // 리스트 기호
        .trim();

      const lines = doc.splitTextToSize(plainText, contentWidth);

      for (let i = 0; i < lines.length; i++) {
        // 페이지 넘김 체크
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }

        const line = lines[i];
        
        // 구분선 확인
        if (line.includes('━━━')) {
          yPosition += 3;
          doc.setDrawColor(200, 200, 200);
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 8;
        } else {
          doc.text(line, margin, yPosition);
          yPosition += 6;
        }
      }

      // 푸터
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `사주킹 Premium | ${i} / ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      doc.save(`${order.name}님의_프리미엄_사주_분석_2026.pdf`);
      toast.success('PDF가 다운로드되었습니다!');
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast.error('PDF 생성에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">오류가 발생했습니다</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => navigate('/')}>
            <Home className="h-4 w-4 mr-2" />
            홈으로 돌아가기
          </Button>
        </Card>
      </div>
    );
  }

  // 분석 중인 경우 - 자동 새로고침 안내 추가
  if (!result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="relative mx-auto mb-6 w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-primary animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold mb-2">분석 중입니다...</h2>
          <p className="text-muted-foreground mb-4">
            {order?.name}님의 프리미엄 사주 분석을 진행하고 있습니다.<br />
            완료까지 약 2-3분 정도 소요됩니다.
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            자동으로 결과를 확인합니다. 이 페이지를 유지해 주세요.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>10초마다 자동 새로고침</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            <span className="font-semibold">프리미엄 사주 분석</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <Home className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* 상태 카드 */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="p-6 bg-gradient-to-br from-primary/10 via-background to-amber-500/10 border-primary/30">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Crown className="h-6 w-6 text-amber-500" />
                  {order?.name}님의 분석 결과
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  주문번호: {order?.order_number}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-500">
                <CheckCircle className="h-4 w-4" />
                분석 완료
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleDownloadPDF} size="sm" className="bg-primary hover:bg-primary/90">
                <FileText className="h-4 w-4 mr-2" />
                PDF 다운로드
              </Button>
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                텍스트 다운로드
              </Button>
              <Button 
                onClick={handleResendEmail} 
                variant="outline" 
                size="sm"
                disabled={resendingEmail}
              >
                <Mail className="h-4 w-4 mr-2" />
                {resendingEmail ? '발송 중...' : '이메일 재발송'}
              </Button>
            </div>

            {result.email_sent && result.email_sent_at && (
              <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-emerald-500" />
                {new Date(result.email_sent_at).toLocaleString('ko-KR')}에 {order?.email}으로 발송됨
              </p>
            )}
          </Card>
        </div>

        {/* 분석 결과 */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <Card className="p-6 md:p-8">
            <MarkdownRenderer 
              content={result.analysis_content} 
              className="prose-sm"
            />
          </Card>
        </div>

        {/* 하단 CTA */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <Card className="p-6 bg-secondary/30 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              분석 결과가 마음에 드셨나요?<br />
              더 궁금한 점이 있다면 AI 상담사에게 물어보세요!
            </p>
            <Button onClick={() => navigate('/chat')}>
              AI 상담 시작하기
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
