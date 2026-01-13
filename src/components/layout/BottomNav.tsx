import { Home, Sparkles, Heart, MessageCircle, Users, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: "home", label: "홈", icon: <Home className="h-5 w-5" /> },
  { id: "saju", label: "사주", icon: <Sparkles className="h-5 w-5" /> },
  { id: "community", label: "게시판", icon: <Users className="h-5 w-5" /> },
  { id: "compatibility", label: "궁합", icon: <Heart className="h-5 w-5" /> },
  { id: "chat", label: "상담", icon: <MessageCircle className="h-5 w-5" /> },
];

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-navy-deep/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2 pb-safe">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "nav-item relative min-w-[60px] rounded-xl",
              activeTab === item.id && "active"
            )}
          >
            {activeTab === item.id && (
              <div className="absolute -top-1 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-primary" />
            )}
            <div
              className={cn(
                "transition-transform duration-300",
                activeTab === item.id && "scale-110"
              )}
            >
              {item.icon}
            </div>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
