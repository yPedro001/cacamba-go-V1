import React, { useRef, useState, useEffect } from 'react'
import { Input } from './input'
import { cn } from '@/lib/utils'

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  length?: number
}

export function OtpInput({ value, onChange, disabled, length = 8 }: OtpInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)

  // Sincroniza o valor caso venha de fora (ex: reset)
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length)

  const focusInput = (index: number) => {
    if (inputs.current[index]) {
      inputs.current[index]?.focus()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value.replace(/[^0-9]/g, '')
    if (!val) return

    const newDigits = [...digits]
    // Pega apenas o último caractere caso o usuário cole ou digite rápido
    newDigits[index] = val.slice(-1).toUpperCase()
    
    const newValue = newDigits.join('')
    onChange(newValue)

    // Move para o próximo se não for o último
    if (index < length - 1 && val) {
      focusInput(index + 1)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits]
        newDigits[index - 1] = ''
        onChange(newDigits.join(''))
        focusInput(index - 1)
      } else {
        const newDigits = [...digits]
        newDigits[index] = ''
        onChange(newDigits.join(''))
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusInput(index - 1)
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      focusInput(index + 1)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length)
    if (text) {
      onChange(text)
      focusInput(Math.min(text.length, length - 1))
    }
  }

  return (
    <div className="flex flex-wrap justify-center gap-2 max-w-full mx-auto" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <div key={i} className="relative group flex-1 aspect-square max-w-[48px]">
          <input
            ref={el => { inputs.current[i] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digits[i] || ''}
            disabled={disabled}
            onChange={e => handleChange(e, i)}
            onKeyDown={e => handleKeyDown(e, i)}
            onFocus={() => setFocusedIndex(i)}
            onBlur={() => setFocusedIndex(null)}
            className={cn(
              "w-full h-full text-center text-xl font-black bg-slate-800/50 border-2 rounded-xl transition-all duration-200 outline-none",
              digits[i] ? "text-accent border-accent/50 shadow-[0_0_15px_-5px_var(--accent)]" : "text-white border-slate-700",
              focusedIndex === i ? "border-accent ring-2 ring-accent/20 scale-105" : "hover:border-slate-600",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            style={{ 
              "--accent": "rgb(var(--accent-rgb, 124, 58, 237))" // Fallback para o roxo caso a var não esteja mapeada
            } as any}
          />
          {focusedIndex === i && (
            <div className="absolute inset-0 bg-accent/5 rounded-xl animate-pulse pointer-events-none" />
          )}
        </div>
      ))}
    </div>
  )
}
