"use client"
import React, { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Search, MapPin, Loader2 } from 'lucide-react'
import { fetchAddressSuggestions, AddressSuggestion } from '@/lib/address-utils'

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, lat?: number, lng?: number, addressDetails?: AddressSuggestion['address']) => void;
  placeholder?: string;
  className?: string;
  forceLightText?: boolean;
}

export function AddressAutocomplete({ value, onChange, placeholder, className, forceLightText }: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    onChange(query)
    
    if (query.length < 3) {
      setSuggestions([])
      setIsOpen(false)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    
    setIsLoading(true)
    setIsOpen(true)
    
    debounceRef.current = setTimeout(async () => {
      const results = await fetchAddressSuggestions(query)
      setSuggestions(results)
      setIsLoading(false)
    }, 500) // 500ms debounce
  }

  const handleSelect = (s: AddressSuggestion) => {
    onChange(s.display_name, parseFloat(s.lat), parseFloat(s.lon), s.address)
    setIsOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={handleInputChange}
          onFocus={() => value.length >= 3 && setIsOpen(true)}
          placeholder={placeholder || "Buscar endereço..."}
          className={`pl-10 bg-background border-input text-foreground placeholder:text-muted-foreground/60 ${forceLightText ? 'text-white font-semibold' : ''} ${className || ''}`}
        />

        {isLoading && (
          <div className="absolute right-3 top-3">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-slate-800 rounded-md shadow-2xl max-h-60 overflow-auto backdrop-blur-none">
          {suggestions.map((s, i) => (
            <button
              key={i}
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0 flex flex-col gap-0.5"
              onClick={() => handleSelect(s)}
            >
              <span className="font-semibold text-foreground line-clamp-1">{s.display_name.split(',')[0]}</span>
              <span className="text-xs text-muted-foreground line-clamp-1">{s.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
