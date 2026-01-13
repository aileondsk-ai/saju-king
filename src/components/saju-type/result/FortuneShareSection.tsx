import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SajuAnalysisResult, IntegratedAnalysisResult } from "@/types/saju-type-analysis";
import { Share2, Copy, Calendar, Palette, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface FortuneShareSectionProps {
  year2026: SajuAnalysisResult["year_2026"];
  cardContents: IntegratedAnalysisResult["card_contents"];
  mbti: string;
  dayMasterName: string;
}

export function FortuneShareSection({ year2026, cardContents, mbti, dayMasterName }: FortuneShareSectionProps) {
  const { main_card, mbti_cross_card, fortune_card, share_captions } = cardContents;

  const handleCopyCaption = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("클립보드에 복사되었습니다!");
  };

  const handleShare = async () => {
    const shareText = `${main_card.title}\n"${main_card.subtitle}"\n\n${main_card.hashtags.map(t => `#${t}`).join(" ")}\n\n🔮 saju-king.com에서 나의 유형 확인하기`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "나의 사주 × MBTI 유형",
          text: shareText,
        });
      } catch (e) {
        navigator.clipboard.writeText(shareText);
        toast.success("클립보드에 복사되었습니다!");
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("클립보드에 복사되었습니다!");
    }
  };

  return (
    <Card className="p-5 bg-card/80 backdrop-blur border-border/50">
      <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Share2 className="w-5 h-5 text-primary" />
        2026 운세 & 공유하기
      </h2>

      {/* 2026 사주 운세 (Prompt 1 - year_2026) */}
      <div className="mb-5 p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-amber-400">2026년 사주 에너지</span>
        </div>
        <div className="text-xl font-bold text-foreground mb-2">
          "{year2026.keyword}"
        </div>
        <p className="text-sm text-foreground/80 mb-3">{year2026.message}</p>
        <div className="text-xs text-muted-foreground p-2 rounded bg-card/50">
          에너지: {year2026.energy}
        </div>
      </div>

      {/* 2026 통합 운세 카드 (Prompt 3 - fortune_card) */}
      <div className="mb-5 p-4 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/30">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">2026년 통합 운세</span>
        </div>
        <div className="text-lg font-bold text-foreground mb-2">
          "{fortune_card.keyword}"
        </div>
        <p className="text-sm text-foreground/80 mb-3">{fortune_card.message}</p>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 p-2 rounded bg-card/50">
            <Calendar className="w-3 h-3" />
            행운의 달: {fortune_card.lucky_month}
          </span>
          <span className="flex items-center gap-1 p-2 rounded bg-card/50">
            <Palette className="w-3 h-3" />
            럭키 컬러: {fortune_card.lucky_color}
          </span>
        </div>
      </div>

      {/* MBTI 교차 인사이트 카드 (Prompt 3 - mbti_cross_card) */}
      <div className="mb-5 p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30">
        <div className="text-sm font-medium text-purple-400 mb-2">
          {dayMasterName} × {mbti} 인사이트
        </div>
        <p className="text-foreground font-medium mb-2">{mbti_cross_card.insight}</p>
        <p className="text-sm text-foreground/80">😄 {mbti_cross_card.fun_point}</p>
      </div>

      {/* 공유 문구 (Prompt 3 - share_captions) */}
      <div className="space-y-3 mb-5">
        <div className="text-sm font-medium text-foreground">📝 SNS 공유 문구</div>
        
        <div className="p-3 rounded-lg bg-card/50 border border-border/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">버전 A: 자기 표현형</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleCopyCaption(share_captions.self_expression)}
              className="h-7 px-2"
            >
              <Copy className="w-3 h-3 mr-1" />
              복사
            </Button>
          </div>
          <p className="text-sm text-foreground/80">{share_captions.self_expression}</p>
        </div>

        <div className="p-3 rounded-lg bg-card/50 border border-border/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">버전 B: 공감 유도형</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleCopyCaption(share_captions.empathy_inducing)}
              className="h-7 px-2"
            >
              <Copy className="w-3 h-3 mr-1" />
              복사
            </Button>
          </div>
          <p className="text-sm text-foreground/80">{share_captions.empathy_inducing}</p>
        </div>
      </div>

      {/* 공유 버튼 */}
      <Button onClick={handleShare} className="w-full">
        <Share2 className="w-4 h-4 mr-2" />
        SNS에 공유하기
      </Button>
    </Card>
  );
}
