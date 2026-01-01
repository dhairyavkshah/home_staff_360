import { ChevronRight, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  destructive?: boolean;
}

interface CompactListItemProps {
  avatar?: React.ReactNode;
  avatarBgColor?: string;
  title: string;
  subtitle?: string;
  rightText?: string;
  rightSubtext?: string;
  rightTextColor?: string;
  badge?: {
    label: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
    className?: string;
  };
  statusDot?: "success" | "warning" | "destructive" | "muted";
  onClick?: () => void;
  onClickArrow?: boolean;
  menuItems?: MenuItem[];
  testId?: string;
}

export function CompactListItem({
  avatar,
  avatarBgColor = "bg-primary/10",
  title,
  subtitle,
  rightText,
  rightSubtext,
  rightTextColor,
  badge,
  statusDot,
  onClick,
  onClickArrow = false,
  menuItems,
  testId,
}: CompactListItemProps) {
  const hasMenu = menuItems && menuItems.length > 0;

  return (
    <div
      className={`flex items-center gap-3 py-2 px-3 rounded-xl border border-border/50 bg-card/50 ${
        onClick ? "hover-elevate cursor-pointer" : ""
      }`}
      onClick={onClick}
      data-testid={testId}
    >
      {avatar && (
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm ${avatarBgColor}`}
        >
          {avatar}
        </div>
      )}

      {statusDot && (
        <span
          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            statusDot === "success"
              ? "bg-success"
              : statusDot === "warning"
              ? "bg-warning"
              : statusDot === "destructive"
              ? "bg-destructive"
              : "bg-muted-foreground"
          }`}
        />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{title}</p>
          {badge && (
            <Badge
              variant={badge.variant || "secondary"}
              className={`text-xs shrink-0 ${badge.className || ""}`}
            >
              {badge.label}
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>

      {(rightText || rightSubtext) && (
        <div className="text-right shrink-0">
          {rightText && (
            <p className={`font-semibold text-sm ${rightTextColor || ""}`}>
              {rightText}
            </p>
          )}
          {rightSubtext && (
            <p className="text-xs text-muted-foreground">{rightSubtext}</p>
          )}
        </div>
      )}

      {onClickArrow && onClick && !hasMenu && (
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      )}

      {hasMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button size="icon" variant="ghost" className="shrink-0 h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {menuItems.map((item, idx) => (
              <DropdownMenuItem
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  item.onClick();
                }}
                className={item.destructive ? "text-destructive" : ""}
              >
                {item.icon}
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
