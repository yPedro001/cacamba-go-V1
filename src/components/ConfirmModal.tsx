"use client"
import React, { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from './ui/button'
import { AlertCircle, X } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, description }: ConfirmModalProps) {
  const { updateConfiguracoes } = useAppStore()
  const [dontAskAgain, setDontAskAgain] = useState(false)

  const handleConfirm = () => {
    if (dontAskAgain) {
      updateConfiguracoes({ pularConfirmacaoExclusao: true })
    }
    onConfirm()
    onClose()
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[9999] transition-all animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border border-border p-6 rounded-2xl shadow-2xl z-[10000] w-[95%] max-w-md animate-in zoom-in-95 fade-in duration-200 focus:outline-none">
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/10 rounded-full shrink-0">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1 space-y-1">
                <Dialog.Title className="text-xl font-bold leading-none tracking-tight">
                  {title}
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button 
                  className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>

            <div className="flex items-center gap-3 px-1">
              <input
                type="checkbox"
                id="dont-ask-again"
                checked={dontAskAgain}
                onChange={(e) => setDontAskAgain(e.target.checked)}
                className="w-4 h-4 rounded-sm border-gray-300 text-primary focus:ring-primary focus:ring-offset-2 transition-all cursor-pointer accent-primary"
              />
              <label 
                htmlFor="dont-ask-again" 
                className="text-sm font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
              >
                Não perguntar novamente nesta sessão
              </label>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
              <Dialog.Close asChild>
                <Button variant="outline" className="sm:w-28 font-semibold">
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button 
                variant="destructive" 
                onClick={handleConfirm}
                className="sm:w-40 font-bold shadow-lg shadow-red-500/20 active:scale-95 transition-transform"
              >
                Sim, Excluir
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
