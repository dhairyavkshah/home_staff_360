import { useState, useEffect, useCallback } from "react";
import { Search, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface FilterOption {
  id: string;
  label: string;
}

interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  multiSelect?: boolean;
}

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
  filterGroups?: FilterGroup[];
  activeFilters?: Record<string, string[]>;
  onFilterChange?: (groupId: string, optionIds: string[]) => void;
  testId?: string;
}

export function SearchBar({
  placeholder = "Search...",
  value,
  onChange,
  debounceMs = 300,
  filterGroups,
  activeFilters = {},
  onFilterChange,
  testId = "search-bar",
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChange, value]);

  const handleClear = useCallback(() => {
    setLocalValue("");
    onChange("");
  }, [onChange]);

  const handleFilterToggle = useCallback(
    (groupId: string, optionId: string) => {
      if (!onFilterChange) return;

      const group = filterGroups?.find((g) => g.id === groupId);
      const current = activeFilters[groupId] || [];

      if (group?.multiSelect) {
        if (current.includes(optionId)) {
          onFilterChange(
            groupId,
            current.filter((id) => id !== optionId)
          );
        } else {
          onFilterChange(groupId, [...current, optionId]);
        }
      } else {
        onFilterChange(groupId, current.includes(optionId) ? [] : [optionId]);
      }
    },
    [filterGroups, activeFilters, onFilterChange]
  );

  const totalActiveFilters = Object.values(activeFilters).reduce(
    (acc, arr) => acc + arr.length,
    0
  );

  const hasFilters = filterGroups && filterGroups.length > 0;

  return (
    <div className="flex items-center gap-2" data-testid={testId}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          className="pl-9 pr-8 h-8 text-sm border-border/50 bg-background/50"
          data-testid={`${testId}-input`}
        />
        {localValue && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-0.5 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={handleClear}
            data-testid={`${testId}-clear`}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {hasFilters && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="shrink-0 relative"
              data-testid={`${testId}-filter-button`}
            >
              <Filter className="w-4 h-4" />
              {totalActiveFilters > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
                >
                  {totalActiveFilters}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {filterGroups.map((group, idx) => (
              <div key={group.id}>
                {idx > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                {group.options.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.id}
                    checked={(activeFilters[group.id] || []).includes(option.id)}
                    onCheckedChange={() =>
                      handleFilterToggle(group.id, option.id)
                    }
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
