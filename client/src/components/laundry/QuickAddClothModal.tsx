import { useState, useEffect } from "react";
import { Minus, Plus, Check, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LAUNDRY_ITEM_TYPES, type LaundryItemType } from "@shared/schema";
import { cn } from "@/lib/utils";

interface QuickAddClothModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddItem: (item: { type: string; quantity: number; rate: number; details?: string }) => void;
  currencySymbol: string;
  defaultRate?: number;
  keepOpenAfterAdd?: boolean;
}

const CLOTH_TYPE_ICONS: Record<string, string> = {
  'Shirt': 'shirt',
  'T-shirt': 'tshirt',
  'Pants': 'pants',
  'Jeans': 'jeans',
  'Saree': 'saree',
  'Kurta': 'kurta',
  'Dress': 'dress',
  '3 Piece Suit': 'suit',
  '4 Piece Suit': 'suit',
  'Blazer': 'blazer',
};

export function QuickAddClothModal({
  open,
  onOpenChange,
  onAddItem,
  currencySymbol,
  defaultRate = 10,
  keepOpenAfterAdd = true,
}: QuickAddClothModalProps) {
  const [step, setStep] = useState<'select' | 'quantity'>('select');
  const [selectedType, setSelectedType] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [rate, setRate] = useState(defaultRate.toString());
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (open) {
      setStep('select');
      setSelectedType("");
      setQuantity(1);
      setRate(defaultRate.toString());
      setSearchQuery("");
    }
  }, [open, defaultRate]);

  const filteredTypes = LAUNDRY_ITEM_TYPES.filter((type) =>
    type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectType = (type: string) => {
    setSelectedType(type);
    setStep('quantity');
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleConfirm = () => {
    const rateNum = parseFloat(rate) || 0;
    if (selectedType && quantity >= 1 && rateNum > 0) {
      onAddItem({
        type: selectedType,
        quantity,
        rate: rateNum,
      });

      if (keepOpenAfterAdd) {
        setStep('select');
        setSelectedType("");
        setQuantity(1);
        setSearchQuery("");
      } else {
        onOpenChange(false);
      }
    }
  };

  const handleBack = () => {
    setStep('select');
    setSelectedType("");
    setQuantity(1);
  };

  const subtotal = quantity * (parseFloat(rate) || 0);

  const content = (
    <div className="flex flex-col gap-4">
      {step === 'select' ? (
        <>
          <div className="flex flex-col gap-2">
            <Input
              placeholder="Search cloth type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sticky top-0"
              data-testid="input-search-cloth-type"
              autoFocus
            />
          </div>
          <ScrollArea className="h-[300px] -mx-2">
            <div className="grid grid-cols-2 gap-2 px-2">
              {filteredTypes.map((type) => (
                <Button
                  key={type}
                  variant="outline"
                  className={cn(
                    "h-auto py-3 px-3 flex flex-col items-center gap-1 text-sm font-medium",
                    selectedType === type && "border-primary bg-primary/10"
                  )}
                  onClick={() => handleSelectType(type)}
                  data-testid={`button-cloth-type-${type.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  <Shirt className="w-5 h-5 text-muted-foreground" />
                  <span className="text-center leading-tight">{type}</span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-3">
              <Shirt className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">{selectedType}</h3>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-center text-muted-foreground">Quantity</Label>
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  data-testid="button-qty-minus"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center text-xl font-bold"
                  data-testid="input-quantity"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(1)}
                  data-testid="button-qty-plus"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-center text-muted-foreground">Rate per item</Label>
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg font-medium">{currencySymbol}</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="w-24 text-center text-lg"
                  data-testid="input-rate"
                />
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground">Subtotal</p>
              <p className="text-2xl font-bold">{currencySymbol}{subtotal.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1"
              data-testid="button-back"
            >
              Back
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!rate || parseFloat(rate) <= 0}
              className="flex-1"
              data-testid="button-add-confirm"
            >
              <Check className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>

          {keepOpenAfterAdd && (
            <p className="text-xs text-center text-muted-foreground">
              Add more items or close when done
            </p>
          )}
        </div>
      )}
    </div>
  );

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>
              {step === 'select' ? 'Select Cloth Type' : 'Enter Quantity'}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-10 overflow-y-auto">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'select' ? 'Select Cloth Type' : 'Enter Quantity'}
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
