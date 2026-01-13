import { forwardRef } from "react";
import { Star, Wallet, Briefcase, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface FortuneShareCardProps {
  fortune: {
    date: {
      display: string;
    };
    user: {
      name: string;
    };
    fortune: {
      keyword: string;
      score: number;
      areas: {
        wealth: { score: number; label: string };
        work: { score: number; label: string };
        relationship: { score: number; label: string };
      };
      lucky: {
        color: string;
        colorCode: string;
        numbers: number[];
      };
    };
  };
}

export const FortuneShareCard = forwardRef<HTMLDivElement, FortuneShareCardProps>(
  ({ fortune }, ref) => {
    const starCount = Math.round(fortune.fortune.score / 20);

    return (
      <div
        ref={ref}
        className="w-[360px] overflow-hidden rounded-2xl bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] p-6"
        style={{ fontFamily: "'Pretendard', sans-serif" }}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600">
              <span className="font-serif text-sm font-bold text-white">王</span>
            </div>
            <span className="font-serif text-lg font-bold text-white">사주킹</span>
          </div>
          <span className="text-sm text-gray-400">{fortune.date.display}</span>
        </div>

        {/* Main Content */}
        <div className="rounded-xl bg-gradient-to-b from-white/5 to-white/[0.02] p-5">
          <p className="text-center text-xs tracking-wider text-gray-400">오늘의 키워드</p>
          
          <h2 className="mt-2 text-center font-serif text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400">
            ✨ {fortune.fortune.keyword}
          </h2>

          {/* Stars */}
          <div className="mt-4 flex flex-col items-center gap-2">
            <div className="flex gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-6 w-6",
                    i < starCount
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-600"
                  )}
                />
              ))}
            </div>
            <span className="text-3xl font-bold text-white">{fortune.fortune.score}점</span>
          </div>

          {/* Area Scores */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center gap-1 rounded-lg bg-white/5 p-3">
              <Wallet className="h-5 w-5 text-gray-400" />
              <span className="text-xs text-gray-400">재물</span>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-2 w-2 rounded-full",
                      i < fortune.fortune.areas.wealth.score ? "bg-amber-400" : "bg-gray-600"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-white">{fortune.fortune.areas.wealth.label}</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-lg bg-white/5 p-3">
              <Briefcase className="h-5 w-5 text-gray-400" />
              <span className="text-xs text-gray-400">일</span>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-2 w-2 rounded-full",
                      i < fortune.fortune.areas.work.score ? "bg-amber-400" : "bg-gray-600"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-white">{fortune.fortune.areas.work.label}</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-lg bg-white/5 p-3">
              <Users className="h-5 w-5 text-gray-400" />
              <span className="text-xs text-gray-400">관계</span>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-2 w-2 rounded-full",
                      i < fortune.fortune.areas.relationship.score ? "bg-amber-400" : "bg-gray-600"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-white">{fortune.fortune.areas.relationship.label}</span>
            </div>
          </div>
        </div>

        {/* Lucky Elements */}
        <div className="mt-4 flex items-center justify-between rounded-lg bg-white/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">🎨</span>
            <span className="text-xs text-gray-400">행운의 색</span>
            <div
              className="h-5 w-5 rounded-full border border-white/20"
              style={{ backgroundColor: fortune.fortune.lucky.colorCode }}
            />
            <span className="text-sm font-medium text-white">{fortune.fortune.lucky.color}</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="text-sm">🔢</span>
            <span className="text-sm font-medium text-white">
              {fortune.fortune.lucky.numbers.join(", ")}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">나도 오늘 운세 보기 → sajuking.lovable.app</p>
        </div>
      </div>
    );
  }
);

FortuneShareCard.displayName = "FortuneShareCard";
