import { StarField } from "@/components/ui/StarField";
import { 
  User, 
  Calendar, 
  Bell, 
  Moon, 
  ChevronRight, 
  HelpCircle, 
  Shield, 
  LogOut,
  Plus,
  Edit2
} from "lucide-react";

const menuItems = [
  { id: "notifications", label: "알림 설정", icon: <Bell className="h-5 w-5" /> },
  { id: "theme", label: "화면 설정", icon: <Moon className="h-5 w-5" /> },
  { id: "privacy", label: "개인정보 처리방침", icon: <Shield className="h-5 w-5" /> },
  { id: "help", label: "도움말 & FAQ", icon: <HelpCircle className="h-5 w-5" /> },
];

const savedProfiles = [
  { id: "1", name: "현정", relation: "나", birthDate: "1987.05.15" },
  { id: "2", name: "지훈", relation: "연인", birthDate: "1985.11.23" },
  { id: "3", name: "엄마", relation: "가족", birthDate: "1960.03.08" },
];

export const ProfileView = () => {
  return (
    <div className="relative min-h-screen bg-background pb-24">
      <StarField />

      {/* Header */}
      <header className="relative z-10 px-5 pb-6 pt-12">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-lavender to-accent">
              <span className="font-serif text-2xl font-semibold text-foreground">현정</span>
            </div>
            <button className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <Edit2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex-1">
            <h1 className="font-serif text-xl font-semibold text-foreground">현정님</h1>
            <p className="text-sm text-muted-foreground">1987년 5월 15일 (양력)</p>
            <p className="text-sm text-muted-foreground">오전 9시생 · 여성</p>
          </div>
        </div>
      </header>

      {/* My Profiles */}
      <section className="relative z-10 px-5 py-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-foreground">
            저장된 프로필
          </h2>
          <button className="flex items-center gap-1 text-sm text-primary">
            <Plus className="h-4 w-4" /> 추가
          </button>
        </div>

        <div className="scrollbar-hide -mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
          {savedProfiles.map((profile) => (
            <button
              key={profile.id}
              className="fortune-card flex flex-shrink-0 flex-col items-center py-4 w-[100px]"
            >
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-accent/50 text-lg font-medium text-foreground">
                {profile.name[0]}
              </div>
              <span className="font-medium text-foreground">{profile.name}</span>
              <span className="text-xs text-muted-foreground">{profile.relation}</span>
            </button>
          ))}
          <button className="fortune-card flex h-[120px] w-[100px] flex-shrink-0 flex-col items-center justify-center border-dashed border-primary/30 hover:border-primary">
            <Plus className="mb-2 h-6 w-6 text-primary" />
            <span className="text-sm text-muted-foreground">새 프로필</span>
          </button>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 px-5 py-4">
        <div className="fortune-card grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-gradient-gold font-serif text-2xl font-bold">42</p>
            <p className="text-xs text-muted-foreground">운세 확인</p>
          </div>
          <div>
            <p className="text-gradient-gold font-serif text-2xl font-bold">8</p>
            <p className="text-xs text-muted-foreground">궁합 분석</p>
          </div>
          <div>
            <p className="text-gradient-gold font-serif text-2xl font-bold">15</p>
            <p className="text-xs text-muted-foreground">상담 횟수</p>
          </div>
        </div>
      </section>

      {/* Menu */}
      <section className="relative z-10 px-5 py-4">
        <h2 className="mb-4 font-serif text-lg font-semibold text-foreground">
          설정
        </h2>
        <div className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className="fortune-card flex w-full items-center gap-3"
            >
              <div className="text-muted-foreground">{item.icon}</div>
              <span className="flex-1 text-left text-foreground">{item.label}</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          ))}
        </div>
      </section>

      {/* Logout */}
      <section className="relative z-10 px-5 py-4">
        <button className="fortune-card flex w-full items-center justify-center gap-2 text-destructive">
          <LogOut className="h-5 w-5" />
          <span>로그아웃</span>
        </button>
      </section>

      {/* Version */}
      <p className="relative z-10 pb-8 text-center text-xs text-muted-foreground">
        버전 1.0.0
      </p>
    </div>
  );
};
