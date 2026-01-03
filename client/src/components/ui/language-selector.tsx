import { useState, useMemo, useRef, useEffect } from "react";
import { Check, ChevronDown, Search, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { languages, languageLabels, type Language } from "@shared/schema";

interface LanguageSelectorProps {
  value: Language;
  onValueChange: (value: Language) => void;
  placeholder?: string;
  className?: string;
  showIcon?: boolean;
  "data-testid"?: string;
}

const LANGUAGE_LIST = languages.map((code) => ({
  code,
  name: languageLabels[code],
}));

export function LanguageSelector({
  value,
  onValueChange,
  placeholder = "Select language",
  className,
  showIcon = true,
  "data-testid": testId = "select-language",
}: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLanguage = LANGUAGE_LIST.find((l) => l.code === value);

  const filteredLanguages = useMemo(() => {
    if (!search.trim()) return LANGUAGE_LIST;
    const query = search.toLowerCase();
    return LANGUAGE_LIST.filter(
      (lang) =>
        lang.name.toLowerCase().includes(query) ||
        lang.code.toLowerCase().includes(query)
    );
  }, [search]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearch("");
    }
  }, [open]);

  const handleSelect = (code: Language) => {
    onValueChange(code);
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
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className
          )}
          data-testid={testId}
        >
          <span className="flex items-center gap-2 truncate">
            {showIcon && <Globe className="w-4 h-4 opacity-50" />}
            <span className="truncate">
              {selectedLanguage ? selectedLanguage.name : placeholder}
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
            placeholder="Search languages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            data-testid={`${testId}-search`}
          />
        </div>
        <ScrollArea className="h-[min(300px,50vh)]">
          <div className="p-1">
            {filteredLanguages.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No language found
              </div>
            ) : (
              filteredLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    value === lang.code && "bg-accent"
                  )}
                  data-testid={`${testId}-option-${lang.code}`}
                >
                  <span className="flex items-center gap-2 flex-1">
                    <span className="text-xs text-muted-foreground font-mono w-6">
                      {lang.code.toUpperCase()}
                    </span>
                    <span>{lang.name}</span>
                  </span>
                  {value === lang.code && (
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
