import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Gemini API 설정 - 시크릿에 저장된 Gemini API 키 사용
const GEMINI_API_KEY = Deno.env.get('Gemini');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface AnalysisRequest {
  imageBase64: string;
  analysisType: 'face' | 'palm';
  userName: string;
  gender: string;
}

// 관상 분석 프롬프트
const FACE_ANALYSIS_PROMPT = `당신은 30년 경력의 동양 관상학 전문가입니다. 다음 얼굴 사진을 분석하여 관상학적 해석을 제공해주세요.

## 분석 대상
- 이름: {NAME}
- 성별: {GENDER}

## 분석 항목
1. **전체적인 인상**: 첫인상과 전체적인 분위기
2. **이마 (천정)**: 지능, 초년운, 부모운
3. **눈썹**: 성격, 형제운, 감정 표현
4. **눈**: 지혜, 심성, 이성관계
5. **코 (재백궁)**: 재물운, 건강, 자존심
6. **입과 입술**: 언변, 식복, 애정운
7. **귀**: 유년운, 건강, 지혜
8. **턱과 광대**: 리더십, 말년운, 사회성
9. **전체 균형**: 오행 밸런스와 조화

## 작성 지침
- 친근한 해요체 사용
- 긍정적이고 희망적인 관점 유지
- 구체적인 조언 포함
- 약 800-1000자 분량
- 이모지 적절히 활용
- 불길한 표현 대신 "주의가 필요한 부분" 등으로 순화

마크다운 형식으로 작성해주세요.`;

// 손금 분석 프롬프트
const PALM_ANALYSIS_PROMPT = `당신은 30년 경력의 손금 전문가입니다. 다음 손바닥 사진을 분석하여 수상학적 해석을 제공해주세요.

## 분석 대상
- 이름: {NAME}
- 성별: {GENDER}

## 분석 항목
1. **생명선**: 건강, 활력, 수명, 인생의 중요 전환점
2. **두뇌선 (지능선)**: 사고방식, 재능, 학습 능력
3. **감정선**: 감정 표현, 연애 스타일, 대인관계
4. **운명선**: 직업운, 성공의 시기, 인생 방향
5. **태양선 (성공선)**: 명예, 재능의 개화, 예술성
6. **결혼선**: 연애, 결혼, 중요한 인연의 시기
7. **손의 형태**: 손가락 길이, 손바닥 넓이에서 보는 성향
8. **손금의 특수 표식**: 별, 삼각형, 사각형 등의 의미

## 작성 지침
- 친근한 해요체 사용
- 긍정적이고 희망적인 관점 유지
- 구체적인 시기 예측 포함 (대략적인 나이대)
- 약 800-1000자 분량
- 이모지 적절히 활용
- "운명은 바꿀 수 있다"는 메시지 포함

마크다운 형식으로 작성해주세요.`;

async function analyzeImage(imageBase64: string, prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured');
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: imageBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', response.status, errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    console.error('Empty response from Gemini:', data);
    throw new Error('Empty response from Gemini API');
  }

  return text;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, analysisType, userName, gender }: AnalysisRequest = await req.json();

    if (!imageBase64) {
      throw new Error('Image data is required');
    }

    if (!analysisType || !['face', 'palm'].includes(analysisType)) {
      throw new Error('Invalid analysis type');
    }

    console.log(`Starting ${analysisType} analysis for:`, userName);

    // 프롬프트 선택 및 변수 치환
    let prompt = analysisType === 'face' ? FACE_ANALYSIS_PROMPT : PALM_ANALYSIS_PROMPT;
    prompt = prompt.replace('{NAME}', userName || '사용자');
    prompt = prompt.replace('{GENDER}', gender === 'male' ? '남성' : '여성');

    // Gemini API로 이미지 분석
    const analysisResult = await analyzeImage(imageBase64, prompt);

    console.log(`${analysisType} analysis completed successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        analysisType,
        result: analysisResult,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Face/Palm analysis error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
