import { useState, useEffect } from "react";
import { Minus, Plus, Check, X } from "lucide-react";
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

const IconShirt = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2v-10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z"/>
  </svg>
);

const IconTShirt = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2v-10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z"/>
  </svg>
);

const IconPants = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 2h14v4l-2 16h-3l-2-12-2 12H7L5 6V2z"/>
  </svg>
);

const IconJeans = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 2h14v4l-2 16h-3l-2-12-2 12H7L5 6V2z"/>
    <path d="M9 6h6M8 10h2M14 10h2"/>
  </svg>
);

const IconBedsheet = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="2"/>
    <path d="M3 10h18"/>
  </svg>
);

const IconTowel = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2"/>
    <path d="M8 6h8M8 10h8M8 14h4"/>
  </svg>
);

const IconSaree = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4c0 0 4 2 8 2s8-2 8-2"/>
    <path d="M4 4v16c0 1 1 2 2 2h12c1 0 2-1 2-2V4"/>
    <path d="M8 10c2 1 6 1 8 0"/>
    <path d="M8 14c2 1 6 1 8 0"/>
  </svg>
);

const IconKurta = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 2l4 4v4h-3v12H7V10H4V6l4-4"/>
    <path d="M8 2h8"/>
    <path d="M12 2v6"/>
  </svg>
);

const IconDress = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2l2 4h8l2-4"/>
    <path d="M8 6l-4 16h16l-4-16"/>
    <path d="M12 6v4"/>
  </svg>
);

const IconJacket = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 2l4 4v14c0 1-1 2-2 2H6c-1 0-2-1-2-2V6l4-4h8z"/>
    <path d="M8 2v4h8V2"/>
    <path d="M4 10h4v6"/>
    <path d="M20 10h-4v6"/>
  </svg>
);

const IconBlanket = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="3"/>
    <path d="M2 8c3-2 6 2 10 0s7 2 10 0"/>
  </svg>
);

const IconPillowCover = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="4"/>
    <path d="M6 6v12M18 6v12"/>
  </svg>
);

const IconBlazer = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2l-4 6v12c0 1 1 2 2 2h16c1 0 2-1 2-2V8l-4-6H6z"/>
    <path d="M12 2v20"/>
    <path d="M8 2l4 8 4-8"/>
  </svg>
);

const IconSuit = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2l-4 6v12c0 1 1 2 2 2h16c1 0 2-1 2-2V8l-4-6H6z"/>
    <path d="M12 2l-2 6 2 2 2-2-2-6"/>
    <path d="M10 14h4"/>
  </svg>
);

const IconSalwarSuit = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2h8l2 8H6l2-8z"/>
    <path d="M6 10l2 12h2l2-8 2 8h2l2-12"/>
  </svg>
);

const IconGown = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2l-2 4h12l-2-4H8z"/>
    <path d="M6 6l-2 16h16l-2-16"/>
    <path d="M12 6v4"/>
    <path d="M8 14c2 2 6 2 8 0"/>
  </svg>
);

const IconBabyCloth = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4a4 4 0 01-8 0"/>
    <path d="M5 6l-2 4h4v10c0 1 1 2 2 2h6c1 0 2-1 2-2V10h4l-2-4"/>
    <circle cx="10" cy="14" r="1"/>
    <circle cx="14" cy="14" r="1"/>
  </svg>
);

const IconWeddingDress = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2l-2 4h12l-2-4H8z"/>
    <path d="M6 6c-2 8-4 16 6 16s8-8 6-16"/>
    <path d="M12 6v3"/>
    <path d="M9 12l3 2 3-2"/>
  </svg>
);

const IconOther = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const ClothIcon = ({ type, className = "" }: { type: string; className?: string }) => {
  const baseClass = `shrink-0 ${className}`;
  
  switch (type) {
    case 'Shirt':
      return <IconShirt className={baseClass} />;
    case 'T-shirt':
      return <IconTShirt className={baseClass} />;
    case 'Pants':
      return <IconPants className={baseClass} />;
    case 'Jeans':
      return <IconJeans className={baseClass} />;
    case 'Bedsheet':
      return <IconBedsheet className={baseClass} />;
    case 'Towel':
      return <IconTowel className={baseClass} />;
    case 'Saree':
      return <IconSaree className={baseClass} />;
    case 'Kurta':
      return <IconKurta className={baseClass} />;
    case 'Dress':
      return <IconDress className={baseClass} />;
    case 'Jacket':
      return <IconJacket className={baseClass} />;
    case 'Blanket':
      return <IconBlanket className={baseClass} />;
    case 'Pillow Cover':
      return <IconPillowCover className={baseClass} />;
    case 'Blazer':
      return <IconBlazer className={baseClass} />;
    case '3 Piece Suit':
    case '4 Piece Suit':
      return <IconSuit className={baseClass} />;
    case 'Salwar Suit':
      return <IconSalwarSuit className={baseClass} />;
    case 'Gown':
      return <IconGown className={baseClass} />;
    case 'Baby Cloth':
      return <IconBabyCloth className={baseClass} />;
    case 'Wedding Dress':
      return <IconWeddingDress className={baseClass} />;
    case 'Other':
    default:
      return <IconOther className={baseClass} />;
  }
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
    <div className="flex flex-col gap-3">
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
          <ScrollArea className="flex-1 -mx-2">
            <div className="grid grid-cols-2 gap-2.5 px-2">
              {filteredTypes.map((type) => (
                <Button
                  key={type}
                  variant="outline"
                  className={cn(
                    "h-auto py-2.5 px-3 flex flex-row items-center justify-start gap-3 text-sm font-medium",
                    selectedType === type && "border-primary bg-primary/10"
                  )}
                  onClick={() => handleSelectType(type)}
                  data-testid={`button-cloth-type-${type.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  <div className="w-7 h-7 rounded-md bg-muted/50 flex items-center justify-center shrink-0">
                    <ClothIcon type={type} className="w-4 h-4 text-foreground" />
                  </div>
                  <span className="text-left leading-tight truncate">{type}</span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-1">
              <ClothIcon type={selectedType} className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-base font-semibold">{selectedType}</h3>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-1">
              <Label className="text-center text-muted-foreground text-sm">Quantity</Label>
              <div className="flex items-center justify-center gap-3">
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
                  className="w-16 text-center text-lg font-bold"
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

            <div className="flex flex-col gap-1">
              <Label className="text-center text-muted-foreground text-sm">Rate per item</Label>
              <div className="flex items-center justify-center gap-2">
                <span className="text-base font-medium">{currencySymbol}</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="w-20 text-center text-base"
                  data-testid="input-rate"
                />
              </div>
            </div>

            <div className="py-2 px-3 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">Subtotal</p>
              <p className="text-lg font-bold">{currencySymbol}{subtotal.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex gap-2 pt-2 pb-safe">
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
              <Check className="w-4 h-4 mr-1.5" />
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
        <DrawerContent className="max-h-[95vh] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b">
            <h2 className="text-lg font-semibold">
              {step === 'select' ? 'Select Cloth Type' : 'Enter Quantity'}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              data-testid="button-close-modal"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="px-4 py-3 overflow-y-auto flex-1 flex flex-col">
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
