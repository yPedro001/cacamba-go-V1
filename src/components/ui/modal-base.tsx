import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  className?: string;
  hideCloseButton?: boolean;
  theme?: 'auto' | 'light' | 'dark';
}

const maxWidthMap = {
  sm:   'sm:max-w-sm',
  md:   'sm:max-w-md',
  lg:   'sm:max-w-lg',
  xl:   'sm:max-w-xl',
  '2xl':'sm:max-w-2xl',
  '3xl':'sm:max-w-3xl',
  '4xl':'sm:max-w-4xl',
  '5xl':'sm:max-w-5xl',
  full: 'sm:max-w-[92vw]',
};

export function ModalBase({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = '2xl',
  className,
  hideCloseButton = false,
  theme = 'auto',
}: ModalBaseProps) {
  const overlayClass = theme === 'dark' 
    ? 'bg-slate-950/60'
    : theme === 'light'
    ? 'bg-black/40'
    : 'bg-slate-950/60 dark:bg-black/60';

  const contentClass = theme === 'dark'
    ? 'bg-slate-900 text-slate-50'
    : theme === 'light'
    ? 'bg-white text-slate-900 border-slate-200'
    : 'bg-card text-card-foreground border-border';

  const headerBgClass = theme === 'dark'
    ? 'bg-slate-900/50 border-white/5'
    : theme === 'light'
    ? 'bg-slate-50 border-slate-200'
    : 'bg-card/50 border-border';

  const bodyBgClass = theme === 'dark'
    ? 'bg-slate-900/30'
    : theme === 'light'
    ? 'bg-slate-100/50'
    : 'bg-card/30';

  const footerBgClass = theme === 'dark'
    ? 'bg-slate-900/50 border-white/5'
    : theme === 'light'
    ? 'bg-slate-50 border-slate-200'
    : 'bg-card/50 border-border';

  const subtitleClass = theme === 'dark'
    ? 'text-slate-500'
    : theme === 'light'
    ? 'text-slate-500'
    : 'text-muted-foreground';

  const closeButtonClass = theme === 'dark'
    ? 'hover:bg-white/10 text-slate-400 hover:text-white'
    : theme === 'light'
    ? 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
    : 'hover:bg-accent/10 text-muted-foreground hover:text-foreground';

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className={cn(
          "fixed inset-0 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          overlayClass
        )} />

        <Dialog.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-[10000]",
            "translate-x-[-50%] translate-y-[-50%]",
            "w-[calc(100vw-2rem)]",
            "max-h-[calc(100dvh-2rem)]",
            "flex flex-col gap-0",
            "border shadow-[0_32px_64px_-15px_rgba(0,0,0,0.5)]",
            "duration-200",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
            "rounded-[28px] sm:rounded-[32px]",
            "overflow-hidden",
            maxWidthMap[maxWidth],
            contentClass,
            className
          )}
          aria-describedby={undefined}
        >
          {(title || subtitle || !hideCloseButton) && (
            <div className={cn(
              "flex flex-col space-y-1.5 px-6 sm:px-8 py-5 sm:py-6 border-b shrink-0",
              headerBgClass
            )}>
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  {title && (
                    <Dialog.Title asChild>
                      <h3 className="text-lg sm:text-xl font-black italic tracking-tighter uppercase leading-none">
                        {title}
                      </h3>
                    </Dialog.Title>
                  )}
                  {subtitle && (
                    <p className={cn(
                      "text-[10px] font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-1.5 font-mono",
                      subtitleClass
                    )}>
                      {subtitle}
                    </p>
                  )}
                </div>
                {!hideCloseButton && (
                  <Dialog.Close asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-10 w-10 shrink-0 rounded-full transition-colors ml-2 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 border-none",
                        closeButtonClass
                      )}
                    >
                      <X className="h-5 w-5 pointer-events-none" />
                      <span className="sr-only">Fechar</span>
                    </Button>
                  </Dialog.Close>
                )}
              </div>
            </div>
          )}

          <div className={cn(
            "flex-1 min-h-0 overflow-y-auto custom-scrollbar px-6 sm:px-8 py-6 sm:py-8",
            bodyBgClass
          )}>
            {children}
          </div>

          {footer && (
            <div className={cn(
              "px-6 sm:px-8 py-4 sm:py-6 border-t flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0",
              footerBgClass
            )}>
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
