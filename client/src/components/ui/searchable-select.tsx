import { useState, useMemo, useRef, useEffect } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  group?: string;
}

interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  showGroups?: boolean;
  "data-testid"?: string;
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select option",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found",
  className,
  disabled = false,
  icon,
  showGroups = false,
  "data-testid": testId = "searchable-select",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const query = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        opt.value.toLowerCase().includes(query) ||
        (opt.description && opt.description.toLowerCase().includes(query))
    );
  }, [search, options]);

  const groupedOptions = useMemo(() => {
    if (!showGroups) return { ungrouped: filteredOptions };
    
    return filteredOptions.reduce((acc, opt) => {
      const group = opt.group || "ungrouped";
      if (!acc[group]) acc[group] = [];
      acc[group].push(opt);
      return acc;
    }, {} as Record<string, SearchableSelectOption[]>);
  }, [filteredOptions, showGroups]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearch("");
    }
  }, [open]);

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className
          )}
          data-testid={testId}
        >
          <span className="flex items-center gap-2 truncate">
            {icon && <span className="opacity-50">{icon}</span>}
            {selectedOption?.icon}
            <span className="truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        sideOffset={4}
      >
        <div className="flex items-center border-b px-3 py-2">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            ref={inputRef}
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            data-testid={`${testId}-search`}
          />
        </div>
        <ScrollArea className="h-[min(300px,50vh)]">
          <div className="p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : showGroups ? (
              Object.entries(groupedOptions).map(([group, opts]) => (
                <div key={group}>
                  {group !== "ungrouped" && (
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {group}
                    </div>
                  )}
                  {opts.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleSelect(opt.value)}
                      className={cn(
                        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-2 text-sm outline-none hover-elevate active-elevate-2",
                        value === opt.value && "bg-accent"
                      )}
                      data-testid={`${testId}-option-${opt.value}`}
                    >
                      <span className="flex items-center gap-2 flex-1">
                        {opt.icon}
                        <span className="flex flex-col items-start">
                          <span>{opt.label}</span>
                          {opt.description && (
                            <span className="text-xs text-muted-foreground">
                              {opt.description}
                            </span>
                          )}
                        </span>
                      </span>
                      {value === opt.value && (
                        <Check className="h-4 w-4 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              ))
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-2 text-sm outline-none hover-elevate active-elevate-2",
                    value === opt.value && "bg-accent"
                  )}
                  data-testid={`${testId}-option-${opt.value}`}
                >
                  <span className="flex items-center gap-2 flex-1">
                    {opt.icon}
                    <span className="flex flex-col items-start">
                      <span>{opt.label}</span>
                      {opt.description && (
                        <span className="text-xs text-muted-foreground">
                          {opt.description}
                        </span>
                      )}
                    </span>
                  </span>
                  {value === opt.value && (
                    <Check className="h-4 w-4 shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
