import { Sparkles, User, Map, Calendar, CheckSquare } from "lucide-react";

export type SajuTabType = "chart" | "personality" | "roadmap" | "yearly" | "action";

interface TabNavigationProps {
  activeTab: SajuTabType;
  onTabChange: (tab: SajuTabType) => void;
}

const tabs: { id: SajuTabType; label: string; icon: React.ReactNode }[] = [
  { id: "chart", label: "나의 사주", icon: <Sparkles className="h-4 w-4" /> },
  { id: "personality", label: "성격·적성", icon: <User className="h-4 w-4" /> },
  { id: "roadmap", label: "인생 로드맵", icon: <Map className="h-4 w-4" /> },
  { id: "yearly", label: "2026년 운세", icon: <Calendar className="h-4 w-4" /> },
  { id: "action", label: "실천 가이드", icon: <CheckSquare className="h-4 w-4" /> },
];

export const TabNavigation = ({ activeTab, onTabChange }: TabNavigationProps) => {
  return (
    <div className="sticky top-0 z-20 border-b border-border/50 bg-background/95 backdrop-blur-md">
      <div className="flex overflow-x-auto px-2 py-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex min-w-max flex-col items-center gap-1 rounded-xl px-4 py-2 text-xs font-medium transition-all ${
              activeTab === tab.id
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
