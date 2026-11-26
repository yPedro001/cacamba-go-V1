import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  length?: number;
}

export function OtpInput({ value, onChange, disabled, length = 8 }: OtpInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  const focusInput = (index: number) => {
    inputs.current[index]?.focus();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    if (!val) return;

    const newDigits = [...digits];
    newDigits[index] = val.slice(-1);
    onChange(newDigits.join(""));

    if (index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      const newDigits = [...digits];
      if (!digits[index] && index > 0) {
        newDigits[index - 1] = "";
        onChange(newDigits.join(""));
        focusInput(index - 1);
      } else {
        newDigits[index] = "";
        onChange(newDigits.join(""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusInput(index - 1);
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      focusInput(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData
      .getData("text")
      .replace(/[^0-9]/g, "")
      .slice(0, length);
    if (text) {
      onChange(text);
      focusInput(Math.min(text.length, length - 1));
    }
  };

  return (
    <div
      className={cn(
        "grid gap-1.5 sm:gap-2 w-full max-w-full mx-auto",
        length === 6 ? "grid-cols-6" : "grid-cols-8"
      )}
      onPaste={handlePaste}
      role="group"
      aria-label={`Código de verificação de ${length} dígitos`}
    >
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Dígito ${i + 1} de ${length}`}
          maxLength={1}
          value={digits[i] || ""}
          disabled={disabled}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onFocus={() => setFocusedIndex(i)}
          onBlur={() => setFocusedIndex(null)}
          className={cn(
            "min-w-0 w-full min-h-[46px] sm:min-h-[52px] text-center font-mono text-base sm:text-lg font-bold rounded-lg border bg-card text-foreground transition-[border-color,background-color] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            digits[i]
              ? "border-primary bg-primary/10 text-foreground"
              : "border-input hover:border-foreground/40",
            focusedIndex === i && "border-primary",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
      ))}
    </div>
  );
}
