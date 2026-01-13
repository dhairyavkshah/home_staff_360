import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/image-utils";
import { useUserAvatar } from "@/hooks/use-user-avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  userId?: string | null;
  displayName?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  fallbackClassName?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const textSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export function UserAvatar({
  userId,
  displayName,
  size = "md",
  className,
  fallbackClassName,
}: UserAvatarProps) {
  const { avatarUrl } = useUserAvatar(userId);
  const initials = getInitials(displayName);

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {avatarUrl && (
        <AvatarImage src={avatarUrl} alt={displayName || "User"} />
      )}
      <AvatarFallback className={cn(textSizeClasses[size], "bg-primary/10 text-primary font-medium", fallbackClassName)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
