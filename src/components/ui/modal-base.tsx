import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
  className?: string;
  hideCloseButton?: boolean;
  theme?: "auto" | "light" | "dark";
  zIndexClassName?: string;
}

const maxWidthMap = {
  sm: "md:max-w-sm",
  md: "md:max-w-md",
  lg: "md:max-w-lg",
  xl: "md:max-w-xl",
  "2xl": "md:max-w-2xl",
  "3xl": "md:max-w-3xl",
  "4xl": "md:max-w-4xl",
  "5xl": "md:max-w-5xl",
  full: "md:max-w-[92vw]",
};

export function ModalBase({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = "2xl",
  className,
  hideCloseButton = false,
  theme = "auto",
  zIndexClassName = "z-[400]",
}: ModalBaseProps) {
  const overlayClass =
    theme === "dark"
      ? "bg-stone-950/70"
      : theme === "light"
        ? "bg-stone-900/45"
        : "bg-stone-950/60";

  const surfaceClass =
    theme === "dark"
      ? "bg-[#24211D] text-[#F1EEE7] border-[#45403A]"
      : theme === "light"
        ? "bg-[#FCFBF8] text-[#231E1A] border-[#D0CBC0]"
        : "bg-card text-card-foreground border-border";

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 backdrop-blur-[2px] flex items-end md:items-center justify-center p-0 md:p-4 overflow-hidden",
            overlayClass,
            zIndexClassName
          )}
        >
          <Dialog.Content
            className={cn(
              "relative w-full md:w-[calc(100vw-2rem)] flex flex-col overflow-hidden border shadow-2xl focus:outline-none",
              "rounded-t-[20px] md:rounded-2xl",
              "max-h-[92dvh] md:max-h-[86dvh]",
              maxWidthMap[maxWidth],
              surfaceClass,
              className
            )}
          >
            {/* Alça visual mobile */}
            <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0" aria-hidden="true">
              <span className="h-1 w-10 rounded-full bg-border" />
            </div>

            {(title || !hideCloseButton) && (
              <div className="flex items-start justify-between gap-3 px-4 py-3.5 sm:px-6 sm:py-4 border-b border-border/70 shrink-0">
                <div className="min-w-0 flex-1 space-y-0.5">
                  {title && (
                    <Dialog.Title className="font-display text-lg sm:text-xl font-bold tracking-tight text-foreground leading-snug break-words">
                      {title}
                    </Dialog.Title>
                  )}
                  {subtitle && (
                    <Dialog.Description className="text-xs text-muted-foreground font-medium">
                      {subtitle}
                    </Dialog.Description>
                  )}
                </div>

                {!hideCloseButton && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    aria-label="Fechar modal"
                    className="h-10 w-10 rounded-lg text-muted-foreground hover:text-foreground shrink-0"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
              {children}
            </div>

            {footer && (
              <div className="shrink-0 sticky bottom-0 border-t border-border/70 bg-inherit px-4 py-3 sm:px-6 sm:py-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
                {footer}
              </div>
            )}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
