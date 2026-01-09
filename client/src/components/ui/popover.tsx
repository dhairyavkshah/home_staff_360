import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"
import { getSafeAreaValues, getAvailableViewportHeight } from "@/hooks/use-keyboard-safe-area"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const DEFAULT_SAFE_AREA_PADDING = { top: 80, bottom: 80, left: 16, right: 16 };

function getSafeAreaPadding() {
  try {
    const safeAreas = getSafeAreaValues();
    
    return { 
      top: safeAreas.top + 24, 
      bottom: safeAreas.bottom + 80,
      left: 16, 
      right: 16 
    };
  } catch {
    return DEFAULT_SAFE_AREA_PADDING;
  }
}

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, collisionPadding, style, ...props }, ref) => {
  const [safeAreaPadding, setSafeAreaPadding] = React.useState({ top: 80, bottom: 80, left: 16, right: 16 });
  const [maxHeight, setMaxHeight] = React.useState<string | undefined>(undefined);
  
  React.useEffect(() => {
    const updateSafeAreas = () => {
      try {
        const padding = getSafeAreaPadding();
        setSafeAreaPadding(padding);
        
        const availableHeight = getAvailableViewportHeight();
        const maxH = availableHeight - padding.top - padding.bottom;
        setMaxHeight(`${Math.max(maxH, 200)}px`);
      } catch {
        setSafeAreaPadding(DEFAULT_SAFE_AREA_PADDING);
      }
    };
    
    updateSafeAreas();
    
    try {
      if (typeof window !== 'undefined' && window.visualViewport) {
        window.visualViewport.addEventListener('resize', updateSafeAreas);
        return () => window.visualViewport?.removeEventListener('resize', updateSafeAreas);
      }
    } catch {
      // Ignore errors in SSR contexts
    }
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
          "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-popover-content-transform-origin]",
          className
        )}
        style={{ maxHeight, ...style }}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
})
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
