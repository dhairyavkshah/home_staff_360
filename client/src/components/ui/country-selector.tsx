import { useState, useMemo, useRef, useEffect } from "react";
import { Check, ChevronDown, Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { COUNTRIES } from "@/lib/geolocation-service";

interface CountrySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  "data-testid"?: string;
}

export function CountrySelector({
  value,
  onValueChange,
  placeholder = "Select country",
  className,
  disabled = false,
  "data-testid": testId,
}: CountrySelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = COUNTRIES.find((c) => c.code === value);

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return COUNTRIES;
    const query = search.toLowerCase();
    return COUNTRIES.filter(
      (country) =>
        country.name.toLowerCase().includes(query) ||
        country.code.toLowerCase().includes(query)
    );
  }, [search]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearch("");
    }
  }, [open]);

  const handleSelect = (code: string) => {
    onValueChange(code);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={disabled ? false : open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            disabled && "opacity-75 cursor-not-allowed",
            className
          )}
          data-testid={testId}
        >
          <span className="flex items-center gap-2 truncate">
            {selectedCountry ? (
              <>
                <MapPin className="w-4 h-4 opacity-50" />
                <span className="truncate">{selectedCountry.name}</span>
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 opacity-50" />
                <span>{placeholder}</span>
              </>
            )}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[--radix-popover-trigger-width] p-0" 
        align="start"
        sideOffset={4}
        collisionPadding={{ top: 48, bottom: 48 }}
      >
        <div className="flex items-center border-b px-3 py-2">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            ref={inputRef}
            placeholder="Search countries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            data-testid={testId ? `${testId}-search` : "country-search"}
          />
        </div>
        <ScrollArea className="h-[min(300px,50vh)]">
          <div className="p-1">
            {filteredCountries.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No country found
              </div>
            ) : (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => handleSelect(country.code)}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    value === country.code && "bg-accent"
                  )}
                  data-testid={testId ? `${testId}-option-${country.code}` : `country-option-${country.code}`}
                >
                  <span className="flex items-center gap-2 flex-1">
                    <span className="text-xs text-muted-foreground font-mono w-6">{country.code}</span>
                    <span>{country.name}</span>
                  </span>
                  {value === country.code && (
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
