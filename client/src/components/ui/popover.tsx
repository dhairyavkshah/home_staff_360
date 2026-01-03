import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

function getSafeAreaPadding() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { top: 60, bottom: 60, left: 16, right: 16 };
  }
  
  const style = getComputedStyle(document.documentElement);
  const topValue = style.getPropertyValue('--app-safe-area-top')?.trim();
  const bottomValue = style.getPropertyValue('--app-safe-area-bottom')?.trim();
  
  const safeTop = topValue ? parseInt(topValue, 10) : 0;
  const safeBottom = bottomValue ? parseInt(bottomValue, 10) : 0;
  
  return { 
    top: Math.max(safeTop, 24) + 16, 
    bottom: Math.max(safeBottom, 24) + 16, 
    left: 16, 
    right: 16 
  };
}

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, collisionPadding, ...props }, ref) => {
  const [safeAreaPadding, setSafeAreaPadding] = React.useState({ top: 60, bottom: 60, left: 16, right: 16 });
  
  React.useEffect(() => {
    setSafeAreaPadding(getSafeAreaPadding());
  }, []);

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding ?? safeAreaPadding}
        avoidCollisions={true}
        className={cn(
          "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-popover-content-transform-origin]",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
})
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
