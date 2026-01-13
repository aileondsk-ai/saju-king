import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Worry } from "@/services/communityService";
import { MessageSquare, Eye, ChevronRight, Sparkles, Heart, MessageCircle } from "lucide-react";

interface WorryCardProps {
  worry: Worry;
  onClick: (id: string) => void;
}

const SOURCE_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  saju_analysis: {
    label: "사주 분석",
    icon: <Sparkles className="w-2.5 h-2.5" />,
    className: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
  compatibility_analysis: {
    label: "궁합 분석",
    icon: <Heart className="w-2.5 h-2.5" />,
    className: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  },
  chat_consultation: {
    label: "AI 상담",
    icon: <MessageCircle className="w-2.5 h-2.5" />,
    className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  web: {
    label: "",
    icon: null,
    className: "",
  },
};

export function WorryCard({ worry, onClick }: WorryCardProps) {
  const handleCardClick = () => {
    onClick(worry.id);
  };

  const sourceConfig = SOURCE_TYPE_CONFIG[worry.source_type] || SOURCE_TYPE_CONFIG.web;
  const showSourceBadge = worry.source_type && worry.source_type !== "web" && sourceConfig.label;

  return (
    <Card
      className="cursor-pointer hover:border-primary/50 transition-colors bg-card/50 backdrop-blur-sm border-border"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs text-muted-foreground border-border">
              {new Date(worry.created_at).toLocaleDateString()}
            </Badge>
            {showSourceBadge && (
              <Badge 
                variant="outline" 
                className={`text-xs flex items-center gap-1 ${sourceConfig.className}`}
              >
                {sourceConfig.icon}
                {sourceConfig.label}
              </Badge>
            )}
          </div>
          {worry.ai_summary && (
            <Badge variant="secondary" className="bg-primary/20 text-primary-foreground text-xs shrink-0">
              AI 요약
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {worry.ai_summary ? (
          <p className="text-sm font-medium leading-relaxed text-foreground">
            "{worry.ai_summary}"
          </p>
        ) : (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {worry.content}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center text-xs text-muted-foreground pt-0 pb-4">
        <div className="flex gap-4">
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{worry.view_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            <span>{worry.comment_count || 0}</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs hover:text-primary">
          자세히 <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}
