"use client";
import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";
import { fetchAddressSuggestions, AddressSuggestion } from "@/lib/address-utils";
import { cn } from "@/lib/utils";

interface AddressAutocompleteProps {
  value: string;
  onChange: (
    value: string,
    lat?: number,
    lng?: number,
    addressDetails?: AddressSuggestion["address"]
  ) => void;
  placeholder?: string;
  className?: string;
  forceLightText?: boolean;
  id?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder,
  className,
  id,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSeqRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    onChange(query);
    setActiveIndex(-1);

    if (query.trim().length < 3) {
      requestSeqRef.current += 1;
      setSuggestions([]);
      setIsLoading(false);
      setIsOpen(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    setIsLoading(true);
    const seq = ++requestSeqRef.current;

    debounceRef.current = setTimeout(async () => {
      const results = await fetchAddressSuggestions(query);
      if (!mountedRef.current || seq !== requestSeqRef.current) return;
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setIsLoading(false);
    }, 400);
  };

  const handleSelect = (s: AddressSuggestion) => {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    onChange(
      s.display_name,
      Number.isFinite(lat) ? lat : undefined,
      Number.isFinite(lng) ? lng : undefined,
      s.address
    );
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === "Enter" && activeIndex >= 0 && suggestions[activeIndex]) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <MapPin
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id={id}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder || "Buscar endereço..."}
          role="combobox"
          aria-expanded={isOpen && suggestions.length > 0}
          aria-autocomplete="list"
          className={cn("pl-10 pr-10", className)}
        />

        {isLoading && (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          role="listbox"
          className="absolute z-[350] w-full mt-1.5 bg-popover text-popover-foreground border border-border rounded-xl shadow-xl max-h-60 overflow-y-auto"
        >
          {suggestions.map((s, i) => (
            <button
              type="button"
              role="option"
              aria-selected={i === activeIndex}
              key={`${s.lat}-${s.lon}-${i}`}
              className={cn(
                "w-full min-h-[44px] px-3.5 py-2.5 text-left text-sm transition-colors border-b border-border/60 last:border-0 flex flex-col gap-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring",
                i === activeIndex ? "bg-muted" : "hover:bg-muted/60"
              )}
              onClick={() => handleSelect(s)}
            >
              <span className="font-semibold text-foreground line-clamp-1">
                {s.display_name.split(",")[0]}
              </span>
              <span className="text-xs text-muted-foreground line-clamp-1">{s.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
