import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { BottomNav } from "@/components/layout/BottomNav";
import { HomeView } from "@/components/views/HomeView";
import { SajuView } from "@/components/views/SajuView";
import { CompatibilityView } from "@/components/views/CompatibilityView";
import { ChatView } from "@/components/views/ChatView";
import { CommunityView, CommunityContext } from "@/components/views/CommunityView";
import { SajuTypeView } from "@/components/views/SajuTypeView";
import { PremiumSajuView } from "@/components/views/PremiumSajuView";
import { PremiumSajuResultView } from "@/components/views/PremiumSajuResultView";

interface ChatContext {
  userName: string;
  analysisType: string;
  summary: string;
  analysisData?: Record<string, unknown>;
  formData?: Record<string, unknown>;
}

const Index = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("home");
  const [chatContext, setChatContext] = useState<ChatContext | null>(null);
  const [communityContext, setCommunityContext] = useState<CommunityContext | null>(null);

  // URL에서 결과 페이지 확인
  const orderNumber = searchParams.get('order');
  if (orderNumber) {
    return <PremiumSajuResultView />;
  }

  const handleNavigateToChat = useCallback((context: ChatContext) => {
    setChatContext(context);
    setActiveTab("chat");
  }, []);

  const handleNavigateToCommunity = useCallback((context: CommunityContext) => {
    setCommunityContext(context);
    setActiveTab("community");
  }, []);

  const handleClearCommunityContext = useCallback(() => {
    setCommunityContext(null);
  }, []);

  const renderView = () => {
    switch (activeTab) {
      case "home":
        return <HomeView onNavigate={setActiveTab} />;
      case "saju":
        return <SajuView onNavigateToChat={handleNavigateToChat} />;
      case "compatibility":
        return <CompatibilityView onNavigateToChat={handleNavigateToChat} />;
      case "community":
        return (
          <CommunityView 
            onBack={() => setActiveTab("home")} 
            context={communityContext ?? undefined}
            onContextClear={handleClearCommunityContext}
          />
        );
      case "saju-type":
      case "sajuType":
        return <SajuTypeView />;
      case "premium-saju":
        return <PremiumSajuView onBack={() => setActiveTab("home")} />;
      case "chat":
        return <ChatView initialContext={chatContext} onNavigateToCommunity={handleNavigateToCommunity} />;
      default:
        return <HomeView onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background">
      {renderView()}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;


