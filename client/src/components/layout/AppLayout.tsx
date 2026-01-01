import { type ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
}

export function AppLayout({ children, className = "" }: AppLayoutProps) {
  return (
    <div className={`app-container h-screen max-w-md mx-auto flex flex-col bg-background ${className}`}>
      <div className="safe-area-top" />
      {children}
      <div className="safe-area-bottom" />
    </div>
  );
}

interface ScrollContentProps {
  children: ReactNode;
  className?: string;
}

export function ScrollContent({ children, className = "" }: ScrollContentProps) {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className={`content-container pb-6 flex flex-col gap-4 ${className}`}>
        {children}
      </div>
    </div>
  );
}
