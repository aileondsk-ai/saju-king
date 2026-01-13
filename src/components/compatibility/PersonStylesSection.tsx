import { Users } from "lucide-react";
import { PersonStyle } from "./types";

interface PersonStylesSectionProps {
  person1Name: string;
  person2Name: string;
  personAStyle?: PersonStyle;
  personBStyle?: PersonStyle;
}

interface StyleCardProps {
  name: string;
  style: PersonStyle;
  variant: "a" | "b";
  delay: string;
}

const StyleCard = ({ name, style, variant, delay }: StyleCardProps) => {
  const gradientClass = variant === "a" 
    ? "from-lavender to-accent" 
    : "from-primary/40 to-gold-dark/40";

  return (
    <div 
      className="rounded-2xl border border-border/30 bg-card/80 p-5 shadow-sm backdrop-blur-sm opacity-0 animate-fade-in-up"
      style={{ animationDelay: delay, animationFillMode: "forwards" }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradientClass} text-base font-semibold shadow-sm`}>
          {name[0]}
        </div>
        <div>
          <span className="font-semibold text-foreground">{name}</span>
          <p className="text-xs text-muted-foreground">관계 스타일</p>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3">
          <div className="flex items-start gap-2">
            <span className="text-lg">💪</span>
            <div className="flex-1">
              <span className="text-xs font-medium text-emerald-400 uppercase tracking-wide">강점</span>
              <p className="mt-0.5 text-sm text-foreground/90">{style.strength}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
          <div className="flex items-start gap-2">
            <span className="text-lg">⚡</span>
            <div className="flex-1">
              <span className="text-xs font-medium text-amber-400 uppercase tracking-wide">스트레스 트리거</span>
              <p className="mt-0.5 text-sm text-foreground/90">{style.stressTrigger}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-3">
          <div className="flex items-start gap-2">
            <span className="text-lg">💫</span>
            <div className="flex-1">
              <span className="text-xs font-medium text-primary uppercase tracking-wide">관계에서 원하는 것</span>
              <p className="mt-0.5 text-sm text-foreground/90">{style.wantsInRelationship}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PersonStylesSection = ({
  person1Name,
  person2Name,
  personAStyle,
  personBStyle,
}: PersonStylesSectionProps) => {
  if (!personAStyle && !personBStyle) return null;

  return (
    <section className="px-5 py-4">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-xl bg-gradient-to-br from-lavender/30 to-lavender/10 p-2">
          <Users className="h-4 w-4 text-lavender-light" />
        </div>
        <h2 className="font-serif text-lg font-semibold text-foreground">각자의 관계 스타일</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {personAStyle && (
          <StyleCard 
            name={person1Name} 
            style={personAStyle} 
            variant="a" 
            delay="0.5s"
          />
        )}
        {personBStyle && (
          <StyleCard 
            name={person2Name} 
            style={personBStyle} 
            variant="b" 
            delay="0.6s"
          />
        )}
      </div>
    </section>
  );
};
