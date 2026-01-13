import { useState, forwardRef } from "react";
import { Download, Share2, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import html2canvas from "html2canvas";

interface ShareResultButtonProps {
  targetRef: React.RefObject<HTMLDivElement>;
  fileName?: string;
  title?: string;
}

export const ShareResultButton = forwardRef<HTMLDivElement, ShareResultButtonProps>(
  ({ targetRef, fileName = "saju-result", title = "분석 결과" }, ref) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const captureImage = async (): Promise<Blob | null> => {
    if (!targetRef.current) {
      toast.error("결과를 캡처할 수 없습니다.");
      return null;
    }

    setIsCapturing(true);
    
    try {
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: "#1a1a2e",
        scale: 2,
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          // Remove any buttons from the cloned document
          const buttons = clonedDoc.querySelectorAll('button');
          buttons.forEach(btn => btn.remove());
        }
      });

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, "image/png", 1.0);
      });
    } catch (error) {
      console.error("Capture error:", error);
      toast.error("이미지 생성 중 오류가 발생했습니다.");
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDownload = async () => {
    const blob = await captureImage();
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}-${new Date().toISOString().split("T")[0]}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsSaved(true);
    toast.success("이미지가 저장되었습니다.");
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleShare = async () => {
    if (!navigator.share) {
      // Fallback to download if Web Share API is not supported
      handleDownload();
      return;
    }

    const blob = await captureImage();
    if (!blob) return;

    const file = new File([blob], `${fileName}.png`, { type: "image/png" });
    
    try {
      await navigator.share({
        title: title,
        text: `${title}를 공유합니다.`,
        files: [file],
      });
      toast.success("공유가 완료되었습니다.");
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        // User cancelled sharing, fallback to download
        handleDownload();
      }
    }
  };

  return (
    <div ref={ref} className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={isCapturing}
        className="flex items-center gap-2 border-border/50 bg-secondary/30 hover:bg-secondary hover:border-primary/30"
      >
        {isCapturing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isSaved ? (
          <Check className="h-4 w-4 text-primary" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">저장</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        disabled={isCapturing}
        className="flex items-center gap-2 border-border/50 bg-secondary/30 hover:bg-secondary hover:border-primary/30"
      >
        {isCapturing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">공유</span>
      </Button>
    </div>
  );
  }
);

ShareResultButton.displayName = "ShareResultButton";
