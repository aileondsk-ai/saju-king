import { MessageCircle, Sparkles, Heart, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  gradient: string;
}

const quickActions: QuickAction[] = [
  {
    id: "saju",
    label: "사주 분석",
    sublabel: "나의 사주팔자 풀이",
    icon: <Sparkles className="h-6 w-6" />,
    gradient: "from-primary/30 to-gold-dark/20",
  },
  {
    id: "compatibility",
    label: "궁합 분석",
    sublabel: "연인/친구 궁합 보기",
    icon: <Heart className="h-6 w-6" />,
    gradient: "from-pink-500/30 to-lavender/20",
  },
  {
    id: "sajuType",
    label: "MBTI × 사주",
    sublabel: "MBTI와 함께보는 사주 유형",
    icon: <Star className="h-6 w-6" />,
    gradient: "from-cyan-500/30 to-blue-500/20",
  },
  {
    id: "consult",
    label: "AI 상담",
    sublabel: "고민 상담하기",
    icon: <MessageCircle className="h-6 w-6" />,
    gradient: "from-emerald-500/30 to-teal-500/20",
  },
];

interface QuickActionsProps {
  onActionClick: (actionId: string) => void;
}

export const QuickActions = ({ onActionClick }: QuickActionsProps) => {
  return (
    <section className="px-5 py-4">
      <h2 className="mb-4 font-serif text-lg font-semibold text-foreground">
        시작하기
      </h2>

      <div className="space-y-3">
        {quickActions.map((action, index) => (
          <button
            key={action.id}
            onClick={() => onActionClick(action.id)}
            className={cn(
              "fortune-card group flex w-full items-center gap-4 text-left opacity-0 animate-fade-in-up",
              "hover:border-primary/30"
            )}
            style={{ animationDelay: `${0.3 + index * 0.1}s`, animationFillMode: "forwards" }}
          >
            {/* Icon with gradient background */}
            <div
              className={cn(
                "flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-primary transition-transform duration-300 group-hover:scale-110",
                action.gradient
              )}
            >
              {action.icon}
            </div>

            {/* Text */}
            <div className="flex-1">
              <p className="font-medium text-foreground text-lg">
                {action.label}
              </p>
              <p className="text-sm text-muted-foreground">
                {action.sublabel}
              </p>
            </div>

            {/* Arrow indicator */}
            <div className="text-muted-foreground group-hover:text-primary transition-colors">
              →
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
