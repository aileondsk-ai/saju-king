import { StarField } from "@/components/ui/StarField";
import { Moon, Sun } from "lucide-react";
import sajukingSymbol from "@/assets/sajuking-symbol.png";

export const HeroSection = () => {
  const now = new Date();
  const hour = now.getHours();
  const isEvening = hour >= 18 || hour < 6;
  
  const getGreeting = () => {
    if (hour >= 5 && hour < 12) return "좋은 아침이에요";
    if (hour >= 12 && hour < 18) return "안녕하세요";
    return "편안한 저녁이에요";
  };

  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    };
    return now.toLocaleDateString("ko-KR", options);
  };

  return (
    <section className="relative overflow-hidden px-5 pb-6 pt-8">
      <StarField />
      
      {/* Gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-celestial" />
      
      {/* Decorative celestial body */}
      <div className="absolute -right-8 top-8 h-32 w-32 animate-float rounded-full bg-gradient-to-br from-primary/30 to-lavender/20 blur-2xl" />
      
      <div className="relative z-10">
        {/* Logo with Symbol and Text */}
        <div className="mb-4 flex flex-col items-center">
          <img 
            src={sajukingSymbol} 
            alt="사주킹 심볼" 
            className="h-20 w-20 object-contain drop-shadow-lg"
          />
          <h2 className="mt-2 font-serif text-2xl font-bold text-gradient-gold tracking-wider">
            사주킹
          </h2>
        </div>

        {/* Date */}
        <p className="mb-2 text-center text-sm text-muted-foreground">{formatDate()}</p>
        
        {/* Greeting */}
        <div className="mb-4 flex items-center justify-center gap-3">
          <div className="icon-circle h-8 w-8 p-1.5">
            {isEvening ? (
              <Moon className="h-full w-full text-primary" />
            ) : (
              <Sun className="h-full w-full text-primary" />
            )}
          </div>
          <h1 className="font-serif text-xl font-semibold text-foreground">
            {getGreeting()}
          </h1>
        </div>

        {/* Service description */}
        <p className="text-center text-base leading-relaxed text-muted-foreground">
          AI 사주 상담으로 오늘 하루의 방향을 찾아보세요.<br />
          당신의 고민에 따뜻한 조언을 드릴게요 ✨
        </p>
      </div>
    </section>
  );
};
