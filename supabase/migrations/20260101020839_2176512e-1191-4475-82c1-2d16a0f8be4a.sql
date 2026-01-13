-- 프롬프트 히스토리 관리 테이블
CREATE TABLE public.prompt_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL, -- 'saju-analysis', 'compatibility-analysis', 'saju-chat', 'daily-fortune'
  version_number INTEGER NOT NULL,
  prompt_name TEXT NOT NULL, -- 'system_prompt', 'user_template' 등
  prompt_content TEXT NOT NULL,
  description TEXT, -- 변경 사유 또는 설명
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 버전 번호 자동 증가를 위한 유니크 제약
CREATE UNIQUE INDEX idx_prompt_versions_unique ON public.prompt_versions(function_name, prompt_name, version_number);

-- 활성 프롬프트는 function_name + prompt_name 당 하나만 가능
CREATE UNIQUE INDEX idx_prompt_versions_active ON public.prompt_versions(function_name, prompt_name) WHERE is_active = true;

-- RLS 활성화
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;

-- 관리자만 읽기/쓰기 가능 (현재는 공개 허용, 추후 관리자 인증 추가 시 변경)
CREATE POLICY "Allow public read for prompt_versions" 
ON public.prompt_versions 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert for prompt_versions" 
ON public.prompt_versions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update for prompt_versions" 
ON public.prompt_versions 
FOR UPDATE 
USING (true);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION public.update_prompt_versions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_prompt_versions_updated_at
BEFORE UPDATE ON public.prompt_versions
FOR EACH ROW
EXECUTE FUNCTION public.update_prompt_versions_updated_at();