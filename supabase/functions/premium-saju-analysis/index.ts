import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

interface PremiumSajuInput {
  orderId: string;
  name: string;
  gender: string;
  birthDate: string;
  birthTime: string | null;
  calendarType: string;
  mbti: string | null;
  hasPartner: boolean;
  partnerName?: string;
  partnerGender?: string;
  partnerBirthDate?: string;
  partnerBirthTime?: string;
  faceImageBase64?: string;
  palmImageBase64?: string;
}

// Gemini API 설정 - 관상/손금 분석용
const GEMINI_API_KEY = Deno.env.get('Gemini');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Gemini로 이미지 분석
async function analyzeImageWithGemini(imageBase64: string, prompt: string): Promise<string> {
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
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// AI 호출 함수
async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  console.log('Calling AI with prompt length:', userPrompt.length);
  
  const response = await fetch(AI_GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI API error:', response.status, errorText);
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// 기본 사주 정보 생성
function getUserContext(input: PremiumSajuInput): string {
  const partnerInfo = input.hasPartner && input.partnerName
    ? `
## 연인 정보
- 이름: ${input.partnerName}
- 성별: ${input.partnerGender === 'male' ? '남성' : '여성'}
- 생년월일: ${input.partnerBirthDate}
- 태어난 시간: ${input.partnerBirthTime || '모름'}
`
    : '';

  return `
## 분석 대상자 정보
- 이름: ${input.name}
- 성별: ${input.gender === 'male' ? '남성' : '여성'}
- 생년월일: ${input.birthDate} (${input.calendarType === 'solar' ? '양력' : '음력'})
- 태어난 시간: ${input.birthTime || '모름'}
- MBTI: ${input.mbti || '미입력'}
${partnerInfo}
`;
}

// 시스템 프롬프트
const BASE_SYSTEM_PROMPT = `당신은 30년 경력의 명리학 대가이자 현대적 감각을 갖춘 사주 상담사입니다.

## 핵심 원칙
1. 전문적이면서도 친근한 해요체를 사용합니다.
2. 어려운 한자 용어는 쉬운 말로 풀어 설명합니다.
3. 긍정적이고 희망적인 관점을 유지하되, 현실적인 조언을 제공합니다.
4. 구체적이고 실천 가능한 조언을 제시합니다.
5. 이모지를 적절히 활용하여 가독성을 높입니다.

## 면책
- 중요한 결정은 전문가와 상담하시기 바랍니다.
- 본 분석은 참고용이며 운명은 본인의 노력으로 바꿀 수 있습니다.`;

// 프롬프트 정의
const PROMPTS = {
  overview: `${BASE_SYSTEM_PROMPT}

## 작성 지침
"총평" 섹션을 작성해주세요. 다음 내용을 포함합니다:
1. 타고난 기질과 삶의 큰 방향성
2. 2026년 병오년의 전체적인 운세 흐름
3. 올해 가장 주목해야 할 기회와 도전
4. 인생 전반에 걸친 조언

마크다운 형식으로 작성하며, 약 800-1000자 분량으로 작성해주세요.`,

  personality: `${BASE_SYSTEM_PROMPT}

## 작성 지침
"성격 및 개요" 섹션을 작성해주세요. 다음 내용을 포함합니다:
1. 일간(日干) 분석과 타고난 성격
2. 오행 밸런스와 성향
3. 강점과 보완해야 할 점
4. 대인관계 스타일
5. 직업적 적성과 재능
6. MBTI가 있다면 사주와의 교차 분석

마크다운 형식으로 작성하며, 약 1000-1200자 분량으로 작성해주세요.`,

  monthly: `${BASE_SYSTEM_PROMPT}

## 작성 지침
2026년 {MONTH}월 운세를 작성해주세요. 다음 내용을 포함합니다:
1. 이달의 전체 운세 (★ 점수 /5)
2. 연애운/대인관계
3. 재물운/금전
4. 건강운
5. 직장/학업운
6. 이달의 행운 요소 (색상, 숫자, 방향)
7. 실천 팁 (구체적인 조언 2-3개)

마크다운 형식으로 작성하며, 약 600-800자 분량으로 작성해주세요.`,

  summary: `${BASE_SYSTEM_PROMPT}

## 작성 지침
지금까지의 분석을 바탕으로 "2026년 핵심 요약" 섹션을 작성해주세요:
1. 올해의 핵심 키워드 3가지
2. 상반기 vs 하반기 운세 비교
3. 가장 좋은 달 TOP 3
4. 조심해야 할 시기와 대처법
5. 2026년을 성공적으로 보내기 위한 핵심 조언 5가지

마크다운 형식으로 작성하며, 약 800-1000자 분량으로 작성해주세요.`,
};

// 관상 분석 프롬프트
const FACE_ANALYSIS_PROMPT = `당신은 30년 경력의 동양 관상학 전문가입니다.

## 분석 대상: {NAME} ({GENDER})

## 분석 내용
1. **전체적인 인상**: 첫인상과 분위기
2. **이마**: 지능, 초년운
3. **눈**: 지혜, 심성, 이성관계
4. **코**: 재물운, 건강
5. **입과 입술**: 언변, 식복
6. **턱과 광대**: 리더십, 말년운

친근한 해요체로 긍정적 관점으로 약 600-800자 작성. 마크다운 형식.`;

// 손금 분석 프롬프트
const PALM_ANALYSIS_PROMPT = `당신은 30년 경력의 손금 전문가입니다.

## 분석 대상: {NAME} ({GENDER})

## 분석 내용
1. **생명선**: 건강, 활력
2. **두뇌선**: 사고방식, 재능
3. **감정선**: 감정 표현, 연애 스타일
4. **운명선**: 직업운, 성공 시기
5. **결혼선**: 연애, 중요 인연 시기
6. **손의 형태**: 성향 분석

친근한 해요체로 긍정적 관점으로 약 600-800자 작성. 마크다운 형식.`;

const MONTHS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const input: PremiumSajuInput = await req.json();
    console.log('Premium Saju Analysis started for:', input.name);

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const userContext = getUserContext(input);
    const results: { [key: string]: string } = {};

    // 1. 총평 분석
    console.log('Step 1: Generating overview...');
    results.overview = await callAI(PROMPTS.overview, userContext);

    // 2. 성격 및 개요 분석
    console.log('Step 2: Generating personality analysis...');
    const personalityPrompt = PROMPTS.personality.replace('{MBTI}', input.mbti || '');
    results.personality = await callAI(personalityPrompt, userContext);

    // 3-14. 월별 운세 (1월~12월)
    for (let i = 0; i < MONTHS.length; i++) {
      const month = MONTHS[i];
      console.log(`Step ${i + 3}: Generating ${month}월 fortune...`);
      const monthlyPrompt = PROMPTS.monthly.replace('{MONTH}', month);
      results[`month_${month}`] = await callAI(monthlyPrompt, userContext);
    }

    // 15. 요약
    console.log('Step 15: Generating summary...');
    const summaryContext = `${userContext}

## 지금까지의 분석 요약
${results.overview}
${results.personality}
`;
    results.summary = await callAI(PROMPTS.summary, summaryContext);

    // 16-17. 관상/손금 분석 (이미지가 있는 경우)
    let faceAnalysis = '';
    let palmAnalysis = '';

    if (input.faceImageBase64 && GEMINI_API_KEY) {
      console.log('Step 16: Analyzing face image...');
      try {
        const facePrompt = FACE_ANALYSIS_PROMPT
          .replace('{NAME}', input.name)
          .replace('{GENDER}', input.gender === 'male' ? '남성' : '여성');
        faceAnalysis = await analyzeImageWithGemini(input.faceImageBase64, facePrompt);
      } catch (error) {
        console.error('Face analysis failed:', error);
        faceAnalysis = '관상 분석 중 오류가 발생했습니다.';
      }
    }

    if (input.palmImageBase64 && GEMINI_API_KEY) {
      console.log('Step 17: Analyzing palm image...');
      try {
        const palmPrompt = PALM_ANALYSIS_PROMPT
          .replace('{NAME}', input.name)
          .replace('{GENDER}', input.gender === 'male' ? '남성' : '여성');
        palmAnalysis = await analyzeImageWithGemini(input.palmImageBase64, palmPrompt);
      } catch (error) {
        console.error('Palm analysis failed:', error);
        palmAnalysis = '손금 분석 중 오류가 발생했습니다.';
      }
    }

    // 관상/손금 분석 섹션 생성
    let imageAnalysisSection = '';
    if (faceAnalysis || palmAnalysis) {
      imageAnalysisSection = `
---

## 👁️ 관상 · 손금 분석

`;
      if (faceAnalysis) {
        imageAnalysisSection += `### 😊 관상 분석
${faceAnalysis}

`;
      }
      if (palmAnalysis) {
        imageAnalysisSection += `### ✋ 손금 분석
${palmAnalysis}

`;
      }
    }

    // 최종 결과 조합
    const finalContent = `
# 🔮 ${input.name}님의 2026년 프리미엄 사주 분석

---

## 📋 총평
${results.overview}

---

## 🎭 성격 및 개요
${results.personality}
${imageAnalysisSection}
---

## 📅 2026년 월별 운세

### 🌸 1월
${results.month_1}

### 💝 2월
${results.month_2}

### 🌿 3월
${results.month_3}

### 🌷 4월
${results.month_4}

### ☀️ 5월
${results.month_5}

### 🌻 6월
${results.month_6}

### 🌊 7월
${results.month_7}

### 🔥 8월
${results.month_8}

### 🍂 9월
${results.month_9}

### 🎃 10월
${results.month_10}

### 🍁 11월
${results.month_11}

### ❄️ 12월
${results.month_12}

---

## ⭐ 2026년 핵심 요약
${results.summary}

---

*본 분석은 전통 명리학과 현대적 해석을 바탕으로 작성되었습니다.*
*중요한 결정은 전문가와 상담하시기 바랍니다.*
`;

    // Supabase에 결과 저장
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: insertError } = await supabase
      .from('premium_saju_results')
      .insert({
        order_id: input.orderId,
        analysis_content: finalContent,
      });

    if (insertError) {
      console.error('Failed to save result:', insertError);
      throw new Error('Failed to save analysis result');
    }

    console.log('Premium Saju Analysis completed successfully');

    // 분석 완료 후 이메일 자동 발송
    console.log('Sending result email...');
    try {
      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-premium-result-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ orderId: input.orderId }),
      });

      if (emailResponse.ok) {
        const emailResult = await emailResponse.json();
        console.log('Email sent successfully:', emailResult);
      } else {
        const emailError = await emailResponse.text();
        console.error('Email sending failed:', emailError);
        // 이메일 실패해도 분석은 성공으로 처리
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // 이메일 실패해도 분석은 성공으로 처리
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        content: finalContent,
        message: '프리미엄 사주 분석이 완료되었습니다. 결과가 이메일로 발송됩니다.' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Premium Saju Analysis error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
