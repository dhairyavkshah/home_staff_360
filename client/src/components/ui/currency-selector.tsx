import { useState, useMemo, useRef, useEffect } from "react";
import { Check, ChevronDown, Search, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { currencies, CURRENCIES, type Currency } from "@shared/schema";

interface CurrencySelectorProps {
  value: Currency;
  onValueChange: (value: Currency) => void;
  placeholder?: string;
  className?: string;
  showIcon?: boolean;
  "data-testid"?: string;
}

const CURRENCY_LIST = currencies.map((code) => ({
  code,
  name: CURRENCIES[code]?.name || code,
  symbol: CURRENCIES[code]?.symbol || code,
}));

export function CurrencySelector({
  value,
  onValueChange,
  placeholder = "Select currency",
  className,
  showIcon = true,
  "data-testid": testId = "select-currency",
}: CurrencySelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCurrency = CURRENCY_LIST.find((c) => c.code === value);

  const filteredCurrencies = useMemo(() => {
    if (!search.trim()) return CURRENCY_LIST;
    const query = search.toLowerCase();
    return CURRENCY_LIST.filter(
      (curr) =>
        curr.name.toLowerCase().includes(query) ||
        curr.code.toLowerCase().includes(query) ||
        curr.symbol.toLowerCase().includes(query)
    );
  }, [search]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearch("");
    }
  }, [open]);

  const handleSelect = (code: Currency) => {
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
            {showIcon && <DollarSign className="w-4 h-4 opacity-50" />}
            <span className="truncate">
              {selectedCurrency
                ? `${selectedCurrency.symbol} ${selectedCurrency.name} (${selectedCurrency.code})`
                : placeholder}
            </span>
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
            placeholder="Search currencies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            data-testid={`${testId}-search`}
          />
        </div>
        <ScrollArea className="h-[min(300px,50vh)]">
          <div className="p-1">
            {filteredCurrencies.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No currency found
              </div>
            ) : (
              filteredCurrencies.map((curr) => (
                <button
                  key={curr.code}
                  onClick={() => handleSelect(curr.code)}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    value === curr.code && "bg-accent"
                  )}
                  data-testid={`${testId}-option-${curr.code}`}
                >
                  <span className="flex items-center gap-2 flex-1">
                    <span className="text-base w-6">{curr.symbol}</span>
                    <span className="flex-1">{curr.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {curr.code}
                    </span>
                  </span>
                  {value === curr.code && (
                    <Check className="h-4 w-4 shrink-0 ml-2" />
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
