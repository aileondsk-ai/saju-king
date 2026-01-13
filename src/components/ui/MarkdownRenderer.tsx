import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// 강화된 마크다운 렌더러 - 더 나은 가독성과 스타일
export const MarkdownRenderer = ({ content, className }: MarkdownRendererProps) => {
  const parseMarkdown = (text: string): React.ReactNode[] => {
    if (!text) return [];
    
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];
    let listType: 'ul' | 'ol' | null = null;
    let blockquoteLines: string[] = [];
    
    const flushList = () => {
      if (listItems.length > 0 && listType) {
        const ListComponent = listType === 'ul' ? 'ul' : 'ol';
        elements.push(
          <ListComponent 
            key={`list-${elements.length}`} 
            className={cn(
              "mb-3 ml-4 space-y-1.5",
              listType === 'ul' ? "list-disc" : "list-decimal"
            )}
          >
            {listItems.map((item, idx) => (
              <li key={idx} className="text-sm leading-relaxed text-foreground/90">
                {parseInline(item)}
              </li>
            ))}
          </ListComponent>
        );
        listItems = [];
        listType = null;
      }
    };

    const flushBlockquote = () => {
      if (blockquoteLines.length > 0) {
        elements.push(
          <blockquote 
            key={`quote-${elements.length}`}
            className="my-3 border-l-3 border-primary/50 bg-primary/5 py-2 pl-4 pr-3 italic text-foreground/80"
          >
            {blockquoteLines.map((line, idx) => (
              <p key={idx} className="text-sm leading-relaxed">
                {parseInline(line.replace(/^>\s*/, ''))}
              </p>
            ))}
          </blockquote>
        );
        blockquoteLines = [];
      }
    };
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 블록 인용문
      if (line.startsWith('>')) {
        flushList();
        blockquoteLines.push(line);
        continue;
      } else {
        flushBlockquote();
      }
      
      // 제목들 - 더 명확한 스타일링
      if (line.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={i} className="mb-2 mt-4 flex items-center gap-2 text-sm font-semibold text-primary first:mt-0">
            <span className="inline-block h-1 w-1 rounded-full bg-primary" />
            {parseInline(line.slice(4))}
          </h3>
        );
        continue;
      }
      if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={i} className="mb-3 mt-4 border-b border-border/30 pb-2 text-base font-semibold text-foreground first:mt-0">
            {parseInline(line.slice(3))}
          </h2>
        );
        continue;
      }
      if (line.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={i} className="mb-3 mt-4 text-lg font-bold text-foreground first:mt-0">
            {parseInline(line.slice(2))}
          </h1>
        );
        continue;
      }
      
      // 구분선
      if (line.match(/^---+$/)) {
        flushList();
        elements.push(
          <hr key={i} className="my-4 border-t border-border/40" />
        );
        continue;
      }
      
      // 체크박스 리스트
      if (line.match(/^[-*]\s\[[ x]\]\s/)) {
        flushList();
        const isChecked = line.includes('[x]');
        const content = line.replace(/^[-*]\s\[[ x]\]\s/, '');
        elements.push(
          <div key={i} className="mb-1 flex items-start gap-2">
            <span className={cn(
              "mt-1 flex h-4 w-4 items-center justify-center rounded border text-xs",
              isChecked 
                ? "border-primary bg-primary text-primary-foreground" 
                : "border-border bg-secondary/30"
            )}>
              {isChecked && "✓"}
            </span>
            <span className="text-sm leading-relaxed">{parseInline(content)}</span>
          </div>
        );
        continue;
      }
      
      // 리스트
      if (line.match(/^[-*]\s/)) {
        if (listType !== 'ul') {
          flushList();
          listType = 'ul';
        }
        listItems.push(line.slice(2));
        continue;
      }
      if (line.match(/^\d+\.\s/)) {
        if (listType !== 'ol') {
          flushList();
          listType = 'ol';
        }
        listItems.push(line.replace(/^\d+\.\s/, ''));
        continue;
      }
      
      // 빈 줄
      if (!line.trim()) {
        flushList();
        continue;
      }
      
      // 일반 텍스트
      flushList();
      elements.push(
        <p key={i} className="mb-2.5 text-sm leading-relaxed text-foreground/95 last:mb-0">
          {parseInline(line)}
        </p>
      );
    }
    
    flushList();
    flushBlockquote();
    return elements;
  };
  
  const parseInline = (text: string): React.ReactNode => {
    if (!text) return null;
    
    // 복합 처리: **굵은글씨**, *기울임*, `코드`, ~~취소선~~
    const combinedRegex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\~\~(.+?)\~\~)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let keyCounter = 0;
    
    while ((match = combinedRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${keyCounter++}`}>
            {parseEmoji(text.slice(lastIndex, match.index))}
          </span>
        );
      }
      
      if (match[1]) {
        // **굵은글씨**
        parts.push(
          <strong key={`bold-${keyCounter++}`} className="font-semibold text-primary">
            {match[2]}
          </strong>
        );
      } else if (match[3]) {
        // *기울임*
        parts.push(
          <em key={`em-${keyCounter++}`} className="italic text-foreground/80">
            {match[4]}
          </em>
        );
      } else if (match[5]) {
        // `코드`
        parts.push(
          <code key={`code-${keyCounter++}`} className="rounded bg-secondary/50 px-1.5 py-0.5 font-mono text-xs text-primary">
            {match[6]}
          </code>
        );
      } else if (match[7]) {
        // ~~취소선~~
        parts.push(
          <del key={`del-${keyCounter++}`} className="text-muted-foreground line-through">
            {match[8]}
          </del>
        );
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${keyCounter++}`}>
          {parseEmoji(text.slice(lastIndex))}
        </span>
      );
    }
    
    return parts.length > 0 ? parts : parseEmoji(text);
  };
  
  // 이모지 강조 처리
  const parseEmoji = (text: string): React.ReactNode => {
    // 이모지 패턴 감지
    const emojiRegex = /([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2500}-\u{2BEF}]|[\u{FE00}-\u{FEFF}]|\u{200D})+/gu;
    
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let keyCounter = 0;
    
    while ((match = emojiRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      parts.push(
        <span key={`emoji-${keyCounter++}`} className="inline-block text-base">
          {match[0]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    
    return parts.length > 0 ? parts : text;
  };

  return (
    <div className={cn("markdown-content space-y-0.5", className)}>
      {parseMarkdown(content)}
    </div>
  );
};
