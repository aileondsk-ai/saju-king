import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
          <AlertTriangle className="w-8 h-8 text-destructive mb-3" />
          <p className="text-sm text-muted-foreground mb-3">
            {this.props.fallbackMessage || '이 섹션을 불러오는 중 오류가 발생했습니다.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleRetry}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            다시 시도
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
