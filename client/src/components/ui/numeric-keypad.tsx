import { Button } from "@/components/ui/button";
import { Delete } from "lucide-react";

interface NumericKeypadProps {
  onDigitPress: (digit: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
}

export function NumericKeypad({ onDigitPress, onBackspace, disabled = false }: NumericKeypadProps) {
  const keys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", "backspace"],
  ];

  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]" data-testid="numeric-keypad">
      {keys.flat().map((key, index) => {
        if (key === "") {
          return <div key={index} className="w-full aspect-square" />;
        }
        
        if (key === "backspace") {
          return (
            <Button
              key={index}
              variant="ghost"
              className="w-full aspect-square text-xl font-semibold rounded-2xl bg-muted/50"
              onClick={onBackspace}
              disabled={disabled}
              data-testid="button-keypad-backspace"
            >
              <Delete className="w-6 h-6" />
            </Button>
          );
        }
        
        return (
          <Button
            key={index}
            variant="ghost"
            className="w-full aspect-square text-2xl font-semibold rounded-2xl bg-muted/50"
            onClick={() => onDigitPress(key)}
            disabled={disabled}
            data-testid={`button-keypad-${key}`}
          >
            {key}
          </Button>
        );
      })}
    </div>
  );
}
