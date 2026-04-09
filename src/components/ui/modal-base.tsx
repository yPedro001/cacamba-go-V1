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
}

const maxWidthMap = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
  '3xl': 'sm:max-w-3xl',
  '4xl': 'sm:max-w-4xl',
  '5xl': 'sm:max-w-5xl',
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
}: ModalBaseProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9999] transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content 
          className={cn(
            "fixed left-[50%] top-[50%] z-[10000] flex flex-col w-[92vw] translate-x-[-50%] translate-y-[-50%] gap-0 border border-white/10 bg-slate-900 text-slate-50 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.7)] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-[32px] overflow-hidden max-h-[88vh]",
            maxWidthMap[maxWidth],
            className
          )}
          aria-describedby={undefined}
        >
          {/* Header */}
          {(title || subtitle || !hideCloseButton) && (
            <div className="flex flex-col space-y-1.5 px-8 py-6 border-b border-white/5 bg-slate-900/50 shrink-0 relative">
              <div className="flex justify-between items-center">
                <div>
                  {title && (
                    <Dialog.Title asChild>
                      <h3 className="text-xl font-black italic tracking-tighter uppercase leading-none">
                        {title}
                      </h3>
                    </Dialog.Title>
                  )}
                  {subtitle && (
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2 flex items-center gap-1.5 font-mono">
                      {subtitle}
                    </p>
                  )}
                </div>
                {!hideCloseButton && (
                  <Dialog.Close asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-full hover:bg-white/10 transition-colors ml-4 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-slate-900 border-none">
                      <X className="h-5 w-5 pointer-events-none" />
                      <span className="sr-only">Close</span>
                    </Button>
                  </Dialog.Close>
                )}
              </div>
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900/30 p-8">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-8 py-6 border-t border-white/5 bg-slate-900/50 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
