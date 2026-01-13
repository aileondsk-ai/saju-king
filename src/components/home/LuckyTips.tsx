import { MessageCircle, Sparkles, Stars } from "lucide-react";

// 로그인 없이 제공하는 일반 팁 (개인화되지 않음)
const generalTips = [
  {
    id: "intro",
    title: "AI 사주 상담",
    description: "생년월일과 고민을 말씀해주시면\n맞춤 운세와 조언을 드려요",
    icon: <MessageCircle className="h-6 w-6" />,
  },
  {
    id: "topics",
    title: "상담 주제",
    description: "연애, 직장, 진로, 대인관계 등\n다양한 고민을 상담해 드려요",
    icon: <Sparkles className="h-6 w-6" />,
  },
  {
    id: "fortune",
    title: "운세 풀이",
    description: "사주명리학 기반의\n전문적인 해석을 제공해요",
    icon: <Stars className="h-6 w-6" />,
  },
];

export const LuckyTips = () => {
  return (
    <section className="px-5 py-4">
      <h2 className="mb-4 font-serif text-lg font-semibold text-foreground">
        서비스 안내 ✨
      </h2>

      <div className="space-y-3">
        {generalTips.map((tip, index) => (
          <div
            key={tip.id}
            className="fortune-card flex items-center gap-4 opacity-0 animate-fade-in-up"
            style={{ animationDelay: `${0.2 + index * 0.1}s`, animationFillMode: "forwards" }}
          >
            {/* Icon */}
            <div className="icon-circle h-12 w-12 flex-shrink-0 p-3 text-primary">
              {tip.icon}
            </div>

            {/* Content */}
            <div className="flex-1">
              <p className="font-medium text-foreground">{tip.title}</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {tip.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Daily message */}
      <div className="mt-4 rounded-2xl border border-primary/20 bg-secondary/30 p-4">
        <p className="text-center text-sm leading-relaxed text-foreground">
          💫 오늘의 한마디
        </p>
        <p className="mt-2 text-center font-serif text-base leading-relaxed text-muted-foreground">
          "서두르지 마세요. 천천히 나아가도<br />
          당신의 별은 언제나 빛나고 있어요."
        </p>
      </div>
    </section>
  );
};
