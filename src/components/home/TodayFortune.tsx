import { Star, ChevronRight, TrendingUp, Heart, Briefcase, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface FortuneCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  score: number;
  description: string;
}

const fortuneCategories: FortuneCategory[] = [
  {
    id: "overall",
    label: "총운",
    icon: <TrendingUp className="h-4 w-4" />,
    score: 4,
    description: "새로운 기회가 찾아올 수 있는 날",
  },
  {
    id: "love",
    label: "애정운",
    icon: <Heart className="h-4 w-4" />,
    score: 5,
    description: "소중한 인연과 마음이 통하는 시간",
  },
  {
    id: "work",
    label: "직장운",
    icon: <Briefcase className="h-4 w-4" />,
    score: 3,
    description: "신중한 판단이 필요한 하루",
  },
  {
    id: "health",
    label: "건강운",
    icon: <Activity className="h-4 w-4" />,
    score: 4,
    description: "가벼운 운동이 활력을 줄 거예요",
  },
];

const StarRating = ({ score, maxScore = 5 }: { score: number; maxScore?: number }) => {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: maxScore }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < score ? "fill-primary text-primary" : "text-muted"
          )}
        />
      ))}
    </div>
  );
};

export const TodayFortune = () => {
  return (
    <section className="px-5 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold text-foreground">
          오늘의 운세
        </h2>
        <button className="flex items-center gap-1 text-sm text-primary transition-colors hover:text-primary/80">
          자세히 보기
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Main fortune card */}
      <div className="fortune-card mb-4 animate-pulse-glow">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">오늘의 종합 운세</span>
          <StarRating score={4} />
        </div>
        <p className="font-serif text-lg leading-relaxed text-foreground">
          "변화의 바람이 불어오는 날이에요.<br />
          <span className="text-gradient-gold">작은 기회도 소중히 여기면</span><br />
          큰 행운으로 이어질 수 있어요."
        </p>
      </div>

      {/* Fortune categories grid */}
      <div className="grid grid-cols-2 gap-3">
        {fortuneCategories.map((category, index) => (
          <button
            key={category.id}
            className="fortune-card text-left opacity-0 animate-fade-in-up"
            style={{ animationDelay: `${index * 0.1}s`, animationFillMode: "forwards" }}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="icon-circle h-7 w-7 p-1.5 text-primary">
                  {category.icon}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {category.label}
                </span>
              </div>
              <StarRating score={category.score} />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {category.description}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
};
