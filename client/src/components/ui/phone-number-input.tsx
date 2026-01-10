import { useState, useEffect, useCallback, useMemo } from "react";
import { Phone, ChevronDown, AlertCircle, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  COUNTRY_CODES,
  type CountryCodeData,
  getMaxLengthForCountryCode,
  validatePhoneNumber,
  combinePhoneNumber,
  parseFullPhoneNumber,
  getDefaultCountryCode,
} from "@/lib/phone-utils";

export interface PhoneNumberInputProps {
  countryCode: string;
  phoneNumber: string;
  onCountryCodeChange: (code: string) => void;
  onPhoneNumberChange: (number: string) => void;
  onFullPhoneChange?: (fullPhone: string) => void;
  onValidationChange?: (isValid: boolean, error?: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  detectedCountry?: string;
  className?: string;
  showValidation?: boolean;
  testIdPrefix?: string;
}

export function PhoneNumberInput({
  countryCode,
  phoneNumber,
  onCountryCodeChange,
  onPhoneNumberChange,
  onFullPhoneChange,
  onValidationChange,
  label = "Phone Number",
  required = false,
  disabled = false,
  placeholder,
  error: externalError,
  detectedCountry,
  className,
  showValidation = true,
  testIdPrefix = "phone",
}: PhoneNumberInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [internalError, setInternalError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);

  const maxLength = useMemo(() => getMaxLengthForCountryCode(countryCode), [countryCode]);

  const selectedCountry = useMemo(() => {
    return COUNTRY_CODES.find(c => c.code === countryCode);
  }, [countryCode]);

  const filteredCountries = useMemo(() => {
    if (!search) return COUNTRY_CODES;
    const searchLower = search.toLowerCase();
    return COUNTRY_CODES.filter(
      c =>
        c.country.toLowerCase().includes(searchLower) ||
        c.code.includes(search) ||
        c.flag.toLowerCase().includes(searchLower)
    );
  }, [search]);

  useEffect(() => {
    if (detectedCountry && !countryCode) {
      const defaultCode = getDefaultCountryCode(detectedCountry);
      onCountryCodeChange(defaultCode);
    }
  }, [detectedCountry, countryCode, onCountryCodeChange]);

  const handlePhoneChange = useCallback((value: string) => {
    const cleanedValue = value.replace(/\D/g, '');
    
    const limitedValue = cleanedValue.slice(0, maxLength);
    
    onPhoneNumberChange(limitedValue);
    
    if (onFullPhoneChange) {
      onFullPhoneChange(combinePhoneNumber(countryCode, limitedValue));
    }
  }, [countryCode, maxLength, onPhoneNumberChange, onFullPhoneChange]);

  const handleCountrySelect = useCallback((country: CountryCodeData) => {
    onCountryCodeChange(country.code);
    setOpen(false);
    setSearch("");
    
    const newMaxLength = getMaxLengthForCountryCode(country.code);
    if (phoneNumber.length > newMaxLength) {
      const trimmedNumber = phoneNumber.slice(0, newMaxLength);
      onPhoneNumberChange(trimmedNumber);
      if (onFullPhoneChange) {
        onFullPhoneChange(combinePhoneNumber(country.code, trimmedNumber));
      }
    } else if (onFullPhoneChange) {
      onFullPhoneChange(combinePhoneNumber(country.code, phoneNumber));
    }
  }, [phoneNumber, onCountryCodeChange, onPhoneNumberChange, onFullPhoneChange]);

  useEffect(() => {
    if (!touched && !phoneNumber) {
      setInternalError(undefined);
      onValidationChange?.(true);
      return;
    }

    if (phoneNumber) {
      const validation = validatePhoneNumber(countryCode, phoneNumber);
      if (!validation.isValid) {
        setInternalError(validation.error);
        onValidationChange?.(false, validation.error);
      } else {
        setInternalError(undefined);
        onValidationChange?.(true);
      }
    } else if (required && touched) {
      setInternalError("Phone number is required");
      onValidationChange?.(false, "Phone number is required");
    } else {
      setInternalError(undefined);
      onValidationChange?.(true);
    }
  }, [countryCode, phoneNumber, touched, required, onValidationChange]);

  const displayError = externalError || (showValidation && touched ? internalError : undefined);
  const isValid = !displayError && phoneNumber.length >= 6;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && (
        <Label>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className="w-[110px] justify-between px-2 font-normal"
              data-testid={`${testIdPrefix}-country-code-trigger`}
            >
              <span className="flex items-center gap-1 truncate">
                <span className="text-sm">{countryCode}</span>
              </span>
              <ChevronDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="start">
            <div className="p-2 border-b">
              <Input
                placeholder="Search country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8"
                data-testid={`${testIdPrefix}-country-search`}
              />
            </div>
            <ScrollArea className="h-[250px]">
              <div className="p-1">
                {filteredCountries.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No country found
                  </div>
                ) : (
                  filteredCountries.map((country, index) => (
                    <button
                      key={`${country.code}-${country.flag}-${index}`}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover-elevate cursor-pointer text-left",
                        countryCode === country.code && country.flag === selectedCountry?.flag && 
                          "bg-primary/10"
                      )}
                      onClick={() => handleCountrySelect(country)}
                      data-testid={`${testIdPrefix}-country-option-${country.flag}`}
                    >
                      <span className="w-8 font-medium">{country.code}</span>
                      <span className="flex-1 truncate">{country.country}</span>
                      {countryCode === country.code && country.flag === selectedCountry?.flag && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <div className="relative flex-1">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="tel"
            inputMode="numeric"
            value={phoneNumber}
            onChange={(e) => handlePhoneChange(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder={placeholder || selectedCountry?.exampleNumber || "1234567890"}
            disabled={disabled}
            maxLength={maxLength}
            className={cn(
              "pl-10 pr-10",
              displayError && "border-destructive focus-visible:ring-destructive"
            )}
            data-testid={`${testIdPrefix}-number-input`}
          />
          {phoneNumber && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isValid ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : displayError ? (
                <AlertCircle className="w-4 h-4 text-destructive" />
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {phoneNumber.length}/{maxLength} digits
          {selectedCountry && ` (${selectedCountry.country})`}
        </span>
      </div>

      {displayError && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {displayError}
        </p>
      )}

      {!phoneNumber && required && (
        <p className="text-xs text-muted-foreground">
          Country code is required when entering a phone number
        </p>
      )}
    </div>
  );
}

export function usePhoneNumberInput(
  initialCountryCode?: string,
  initialPhoneNumber?: string,
  detectedCountry?: string
) {
  const [countryCode, setCountryCode] = useState(
    initialCountryCode || getDefaultCountryCode(detectedCountry)
  );
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber || "");
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (initialCountryCode && initialPhoneNumber) {
      setCountryCode(initialCountryCode);
      setPhoneNumber(initialPhoneNumber);
    } else if (initialPhoneNumber) {
      const parsed = parseFullPhoneNumber(initialPhoneNumber);
      if (parsed) {
        setCountryCode(parsed.countryCode);
        setPhoneNumber(parsed.phoneNumber);
      }
    }
  }, [initialCountryCode, initialPhoneNumber]);

  const handleValidationChange = useCallback((valid: boolean, err?: string) => {
    setIsValid(valid);
    setError(err);
  }, []);

  const getFullPhoneNumber = useCallback(() => {
    return combinePhoneNumber(countryCode, phoneNumber);
  }, [countryCode, phoneNumber]);

  const reset = useCallback(() => {
    setCountryCode(getDefaultCountryCode(detectedCountry));
    setPhoneNumber("");
    setIsValid(false);
    setError(undefined);
  }, [detectedCountry]);

  return {
    countryCode,
    phoneNumber,
    setCountryCode,
    setPhoneNumber,
    isValid,
    error,
    handleValidationChange,
    getFullPhoneNumber,
    reset,
  };
}
