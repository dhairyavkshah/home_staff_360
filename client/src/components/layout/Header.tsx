import { ArrowLeft, MoreVertical, Home, Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onHome?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAdd?: () => void;
  addDisabled?: boolean;
  addTestId?: string;
  sticky?: boolean;
  rightAction?: React.ReactNode;
  contextLabel?: string;
  contextMode?: "home" | "staff";
}

export function Header({
  title,
  subtitle,
  onBack,
  onHome,
  onEdit,
  onDelete,
  onAdd,
  addDisabled,
  addTestId = "button-add",
  sticky = false,
  rightAction,
  contextLabel,
  contextMode,
}: HeaderProps) {
  const ContextIcon = contextMode === "staff" ? Briefcase : Home;
  
  const headerContent = (
    <div className="content-container py-3 min-h-14">
      {contextLabel && (
        <div className="flex items-center gap-2 mb-1.5" data-testid="context-indicator">
          <Badge variant="secondary" className="gap-1 font-normal">
            <ContextIcon className="w-3 h-3" />
            <span className="truncate max-w-[180px]">{contextLabel}</span>
          </Badge>
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold truncate" data-testid="text-header-title">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate" data-testid="text-header-subtitle">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onHome && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onHome}
              data-testid="button-home"
            >
              <Home className="h-5 w-5" />
            </Button>
          )}
          {rightAction}
          {onAdd && (
            <Button
              size="icon"
              onClick={onAdd}
              disabled={addDisabled}
              data-testid={addTestId}
            >
              <Plus className="h-5 w-5" />
            </Button>
          )}
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-more-menu">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit} data-testid="menu-item-edit">
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive"
                    data-testid="menu-item-delete"
                  >
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );

  if (sticky) {
    return (
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50 flex-shrink-0">
        {headerContent}
      </header>
    );
  }

  return (
    <header className="flex-shrink-0">
      {headerContent}
    </header>
  );
}
