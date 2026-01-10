"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"
import { useSafeArea } from "@/lib/safe-area-provider"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, collisionPadding, style, ...props }, ref) => {
  const { insets, isKeyboardVisible, keyboardHeight, availableHeight } = useSafeArea();
  
  const safeAreaPadding = React.useMemo(() => ({
    top: insets.top + 32,
    bottom: isKeyboardVisible ? keyboardHeight + 16 : insets.bottom + 80,
    left: 16,
    right: 16,
  }), [insets, isKeyboardVisible, keyboardHeight]);

  const maxHeight = React.useMemo(() => {
    const available = availableHeight - safeAreaPadding.top - safeAreaPadding.bottom;
    return `${Math.max(available, 150)}px`;
  }, [availableHeight, safeAreaPadding]);

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
