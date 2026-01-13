-- 프리미엄 사주 주문에 얼굴/손금 이미지 경로 컬럼 추가
ALTER TABLE public.premium_saju_orders
ADD COLUMN face_image_path TEXT DEFAULT NULL,
ADD COLUMN palm_image_path TEXT DEFAULT NULL;

-- 프리미엄 이미지 저장을 위한 스토리지 버킷 생성 (비공개)
INSERT INTO storage.buckets (id, name, public)
VALUES ('premium-images', 'premium-images', false)
ON CONFLICT (id) DO NOTHING;

-- 이미지 업로드 정책: 인증 없이도 업로드 가능 (orderId 기반)
CREATE POLICY "Allow premium image uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'premium-images');

-- 서비스 롤만 읽기 가능
CREATE POLICY "Service role can read premium images"
ON storage.objects FOR SELECT
USING (bucket_id = 'premium-images');

COMMENT ON COLUMN public.premium_saju_orders.face_image_path IS '관상 분석용 얼굴 이미지 경로';
COMMENT ON COLUMN public.premium_saju_orders.palm_image_path IS '손금 분석용 손 이미지 경로';