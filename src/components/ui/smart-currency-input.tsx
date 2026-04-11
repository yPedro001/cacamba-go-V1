"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { maskCurrencySmart, parseSmartCurrency } from '@/lib/currency-utils';

interface SmartCurrencyInputProps {
  value: number; // valor numérico real
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

/**
 * Input de valor monetário inteligente.
 *
 * Comportamento:
 * - Digitar "300" → armazena 300.00
 * - Digitar "300,5" → armazena 300.50
 * - Digitar "300,50" → armazena 300.50
 * - Colar "R$ 1.500,00" → armazena 1500.00
 * - Não força centavos sem vírgula — experiência natural de digitação
 */
export function SmartCurrencyInput({
  value,
  onChange,
  placeholder = '0',
  className,
  id,
  disabled,
}: SmartCurrencyInputProps) {
  // displayValue: o que o usuário vê / digita
  const [displayValue, setDisplayValue] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isInitialized = useRef(false);

  // Sincroniza valor externo → display (apenas na inicialização ou fora do foco)
  useEffect(() => {
    if (!isFocused || !isInitialized.current) {
      if (value === 0 || value === undefined || value === null) {
        setDisplayValue('');
      } else {
        // Formata número para exibição amigável
        const formatted = value.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        setDisplayValue(formatted);
      }
      isInitialized.current = true;
    }
  }, [value, isFocused]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Permite apenas dígitos, vírgula e ponto
    const sanitized = raw.replace(/[^0-9,.]/g, '');

    // Se o usuário apagou tudo
    if (!sanitized) {
      setDisplayValue('');
      onChange(0);
      return;
    }

    // Evita múltiplas vírgulas
    const commaCount = (sanitized.match(/,/g) || []).length;
    if (commaCount > 1) return;

    // Aplica máscara de exibição inteligente
    const masked = maskCurrencySmart(sanitized);
    setDisplayValue(masked);

    // Converte para número real e notifica o pai
    const numericValue = parseSmartCurrency(masked);
    onChange(numericValue);
  }, [onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    // Remove R$, espaços, e trata separadores
    const clean = pasted.replace(/[R$\s]/g, '').trim();
    const masked = maskCurrencySmart(clean);
    setDisplayValue(masked);
    const numericValue = parseSmartCurrency(masked);
    onChange(numericValue);
  }, [onChange]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    // Ao focar, se o valor for zero, limpa o campo
    if (value === 0) {
      setDisplayValue('');
    }
  }, [value]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Ao sair do campo: se tiver valor sem vírgula, mantém sem forçar centavos
    // Mas normaliza separadores de milhar para consistência
    if (displayValue && !displayValue.includes(',')) {
      const num = parseSmartCurrency(displayValue);
      if (num > 0) {
        // Formata com 2 casas decimais ao sair do campo
        const formatted = num.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        setDisplayValue(formatted);
        onChange(num);
      }
    } else if (!displayValue) {
      onChange(0);
    }
  }, [displayValue, onChange]);

  return (
    <Input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onPaste={handlePaste}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(className)}
      autoComplete="off"
    />
  );
}
