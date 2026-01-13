-- 사주 분석 요청 저장 테이블
CREATE TABLE public.saju_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  birth_date DATE NOT NULL,
  birth_time TEXT, -- 시간 모를 수 있음 (null 허용)
  calendar_type TEXT NOT NULL DEFAULT 'solar' CHECK (calendar_type IN ('solar', 'lunar')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 궁합 분석 요청 저장 테이블  
CREATE TABLE public.compatibility_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- 본인 정보
  person1_name TEXT NOT NULL,
  person1_gender TEXT NOT NULL CHECK (person1_gender IN ('male', 'female')),
  person1_birth_date DATE NOT NULL,
  person1_birth_time TEXT,
  person1_calendar_type TEXT NOT NULL DEFAULT 'solar',
  -- 상대방 정보
  person2_name TEXT NOT NULL,
  person2_gender TEXT NOT NULL CHECK (person2_gender IN ('male', 'female')),
  person2_birth_date DATE NOT NULL,
  person2_birth_time TEXT,
  person2_calendar_type TEXT NOT NULL DEFAULT 'solar',
  -- 관계 유형
  relation_type TEXT NOT NULL DEFAULT 'lover' CHECK (relation_type IN ('lover', 'friend', 'family', 'business')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 채팅 대화 저장 테이블
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS 활성화 (공개 서비스이므로 누구나 삽입 가능)
ALTER TABLE public.saju_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compatibility_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- 삽입 정책 (누구나 삽입 가능)
CREATE POLICY "Anyone can insert saju requests"
ON public.saju_requests
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can insert compatibility requests"
ON public.compatibility_requests
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can insert chat conversations"
ON public.chat_conversations
FOR INSERT
WITH CHECK (true);

-- 조회 정책 (본인 세션의 데이터만 조회 - chat의 경우)
CREATE POLICY "Anyone can read their session chats"
ON public.chat_conversations
FOR SELECT
USING (true);