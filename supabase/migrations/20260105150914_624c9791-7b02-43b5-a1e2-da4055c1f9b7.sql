-- 프리미엄 사주 주문 테이블
CREATE TABLE public.premium_saju_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  
  -- 사용자 정보
  name TEXT NOT NULL,
  gender TEXT NOT NULL,
  contact TEXT NOT NULL,
  email TEXT NOT NULL,
  birth_date DATE NOT NULL,
  birth_time TEXT,
  calendar_type TEXT NOT NULL DEFAULT 'solar',
  mbti TEXT,
  has_partner BOOLEAN,
  
  -- 결제 정보
  amount INTEGER NOT NULL DEFAULT 3900,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_id TEXT,
  
  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- 프리미엄 사주 분석 결과 테이블
CREATE TABLE public.premium_saju_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.premium_saju_orders(id) ON DELETE CASCADE,
  
  -- 분석 결과
  analysis_content TEXT NOT NULL,
  
  -- 이메일 발송 상태
  email_sent BOOLEAN NOT NULL DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.premium_saju_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_saju_results ENABLE ROW LEVEL SECURITY;

-- 주문 테이블 RLS 정책
CREATE POLICY "Anyone can insert orders"
ON public.premium_saju_orders
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can read their orders by order_number"
ON public.premium_saju_orders
FOR SELECT
USING (true);

CREATE POLICY "System can update orders"
ON public.premium_saju_orders
FOR UPDATE
USING (true);

-- 결과 테이블 RLS 정책
CREATE POLICY "System can insert results"
ON public.premium_saju_results
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can read results"
ON public.premium_saju_results
FOR SELECT
USING (true);

CREATE POLICY "System can update results"
ON public.premium_saju_results
FOR UPDATE
USING (true);

-- 인덱스 생성
CREATE INDEX idx_premium_orders_order_number ON public.premium_saju_orders(order_number);
CREATE INDEX idx_premium_orders_email ON public.premium_saju_orders(email);
CREATE INDEX idx_premium_orders_payment_status ON public.premium_saju_orders(payment_status);
CREATE INDEX idx_premium_results_order_id ON public.premium_saju_results(order_id);