import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"
import { getSafeAreaValues, getAvailableViewportHeight } from "@/hooks/use-keyboard-safe-area"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const DEFAULT_SAFE_AREA_PADDING = { top: 80, bottom: 80, left: 16, right: 16 };

function getSafeAreaPadding() {
  try {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return DEFAULT_SAFE_AREA_PADDING;
    }
    
    const safeAreas = getSafeAreaValues();
    const style = getComputedStyle(document.documentElement);
    const keyboardVisible = style.getPropertyValue('--keyboard-visible')?.trim() === '1';
    const keyboardHeight = parseInt(style.getPropertyValue('--keyboard-height')?.replace('px', '') || '0', 10);
    
    return { 
      top: safeAreas.top + 32, 
      bottom: keyboardVisible ? keyboardHeight + 16 : safeAreas.bottom + 80,
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
  const [safeAreaPadding, setSafeAreaPadding] = React.useState(DEFAULT_SAFE_AREA_PADDING);
  const [maxHeight, setMaxHeight] = React.useState<string>("300px");
  
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateSafeAreas = () => {
      try {
        const padding = getSafeAreaPadding();
        setSafeAreaPadding(padding);
        
        const availableHeight = getAvailableViewportHeight();
        const maxH = availableHeight - padding.top - padding.bottom;
        setMaxHeight(`${Math.max(maxH, 150)}px`);
      } catch {
        setSafeAreaPadding(DEFAULT_SAFE_AREA_PADDING);
        setMaxHeight("300px");
      }
    };
    
    updateSafeAreas();
    
    const intervalId = setInterval(updateSafeAreas, 100);
    
    const handleResize = () => {
      updateSafeAreas();
      setTimeout(updateSafeAreas, 50);
      setTimeout(updateSafeAreas, 150);
    };
    
    try {
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleResize);
      }
      window.addEventListener('resize', handleResize);
      
      return () => {
        clearInterval(intervalId);
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleResize);
        }
        window.removeEventListener('resize', handleResize);
      };
    } catch {
      clearInterval(intervalId);
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
        sticky="always"
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
