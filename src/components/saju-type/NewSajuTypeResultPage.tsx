import { forwardRef, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FourPillars } from "@/lib/saju-calculator";
import { SajuTypeAnalysisResponse } from "@/types/saju-type-analysis";
import { IntegratedProfileCard } from "./result/IntegratedProfileCard";
import { DayMasterSection } from "./result/DayMasterSection";
import { SajuPersonalitySection } from "./result/SajuPersonalitySection";
import { SajuStrengthsSection } from "./result/SajuStrengthsSection";
import { MBTIAnalysisSection } from "./result/MBTIAnalysisSection";
import { CrossAnalysisSection } from "./result/CrossAnalysisSection";
import { IntegratedRelationshipSection } from "./result/IntegratedRelationshipSection";
import { IntegratedGrowthSection } from "./result/IntegratedGrowthSection";
import { FortuneShareSection } from "./result/FortuneShareSection";
import { ElementBalanceChart } from "./ElementBalanceChart";
import { Card } from "@/components/ui/card";
import { Gauge, Download } from "lucide-react";
import html2canvas from "html2canvas";
import { toast } from "sonner";

interface NewSajuTypeResultPageProps {
  pillars: FourPillars;
  mbti: string;
  analysisResult: SajuTypeAnalysisResponse;
  userName?: string;
}

export const NewSajuTypeResultPage = forwardRef<HTMLDivElement, NewSajuTypeResultPageProps>(
  ({ pillars, mbti, analysisResult, userName }, ref) => {
    const cardRef = useRef<HTMLDivElement>(null);
    
    const { saju_analysis, mbti_analysis, integrated_analysis } = analysisResult;

    const handleDownloadCard = async () => {
      if (!cardRef.current) return;
      
      try {
        toast.loading("이미지 생성 중...");
        const canvas = await html2canvas(cardRef.current, {
          backgroundColor: "#0f0f23",
          scale: 2,
        });
        
        const link = document.createElement("a");
        link.download = `saju-mbti-${mbti}-${Date.now()}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        
        toast.dismiss();
        toast.success("이미지가 저장되었습니다!");
      } catch (error) {
        toast.dismiss();
        toast.error("이미지 저장에 실패했습니다");
        console.error(error);
      }
    };

    return (
      <div ref={ref} className="space-y-6">
        {/* Section 1: 통합 프로필 카드 (메인 공유용) */}
        <section className="space-y-4">
          <IntegratedProfileCard
            ref={cardRef}
            profile={integrated_analysis.integrated_profile}
            cardContents={integrated_analysis.card_contents}
            mbti={mbti}
            dayMasterName={saju_analysis.day_master.name}
          />
          <Button onClick={handleDownloadCard} variant="outline" className="w-full max-w-[360px] mx-auto flex">
            <Download className="w-4 h-4 mr-2" />
            카드 이미지 저장
          </Button>
        </section>

        {/* Section 2: 일간 본질 (Prompt 1 - day_master) */}
        <section>
          <DayMasterSection dayMaster={saju_analysis.day_master} />
        </section>

        {/* Section 3: 오행 밸런스 (서버에서 계산된 값 사용) */}
        <section>
          <Card className="p-5 bg-card/80 backdrop-blur border-border/50">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Gauge className="w-5 h-5 text-primary" />
              오행 밸런스
            </h2>
            <ElementBalanceChart 
              pillars={pillars} 
              serverBalance={analysisResult.element_balance}
            />
          </Card>
        </section>

        {/* Section 4: 사주 기반 성격 특성 (Prompt 1 - personality) */}
        <section>
          <SajuPersonalitySection personality={saju_analysis.personality} />
        </section>

        {/* Section 5: 사주 기반 강점 & 약점 (Prompt 1 - strengths, weaknesses) */}
        <section>
          <SajuStrengthsSection 
            strengths={saju_analysis.strengths}
            weaknesses={saju_analysis.weaknesses}
          />
        </section>

        {/* Section 6: MBTI 분석 (Prompt 2 - type_essence, personality, strengths, communication) */}
        <section>
          <MBTIAnalysisSection
            mbti={mbti}
            mbtiAnalysis={mbti_analysis}
          />
        </section>

        {/* Section 7: 교차 분석 (Prompt 3 - cross_analysis) */}
        <section>
          <CrossAnalysisSection
            crossAnalysis={integrated_analysis.cross_analysis}
            mbti={mbti}
            dayMasterName={saju_analysis.day_master.name}
          />
        </section>

        {/* Section 8: 통합 관계 인사이트 (Prompt 3 - relationship_insight) */}
        <section>
          <IntegratedRelationshipSection
            sajuRelationship={saju_analysis.relationship}
            mbtiRelationship={mbti_analysis.relationship}
            integratedInsight={integrated_analysis.integrated_profile.relationship_insight}
          />
        </section>

        {/* Section 9: 통합 성장 로드맵 (Prompt 3 - growth_points) */}
        <section>
          <IntegratedGrowthSection
            sajuWeaknesses={saju_analysis.weaknesses}
            mbtiGrowth={mbti_analysis.growth_points}
            integratedGrowth={integrated_analysis.integrated_profile.growth_points}
          />
        </section>

        {/* Section 10: 2026 운세 & 공유하기 (Prompt 1 - year_2026, Prompt 3 - card_contents) */}
        <section>
          <FortuneShareSection
            year2026={saju_analysis.year_2026}
            cardContents={integrated_analysis.card_contents}
            mbti={mbti}
            dayMasterName={saju_analysis.day_master.name}
          />
        </section>

        {/* Footer */}
        <div className="text-center py-4">
          <div className="text-xs text-muted-foreground">
            사주킹 saju-king.com
          </div>
        </div>
      </div>
    );
  }
);

NewSajuTypeResultPage.displayName = "NewSajuTypeResultPage";
