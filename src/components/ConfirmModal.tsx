"use client"
import React, { useState } from 'react'
import { Button } from './ui/button'
import { AlertCircle } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { ModalBase } from '@/components/ui/modal-base'

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
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={
        <div className="flex items-center gap-3 text-red-500">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{title}</span>
        </div>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="px-8 font-black text-xs uppercase tracking-widest h-12 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/50 text-foreground">
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            className="px-10 font-black text-xs uppercase tracking-widest h-12 rounded-2xl shadow-[0_10px_20px_-5px_rgba(239,68,68,0.3)] transition-all active:scale-95 italic"
          >
            Confirmar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-8">
        <div>
          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-3 px-1 py-1">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              id="dont-ask-again"
              checked={dontAskAgain}
              onChange={(e) => setDontAskAgain(e.target.checked)}
              className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-input bg-muted/50 text-foreground transition-all checked:bg-accent checked:border-accent"
            />
            <svg
              className="absolute h-3.5 w-3.5 pointer-events-none hidden peer-checked:block left-0.5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <label 
            htmlFor="dont-ask-again" 
            className="text-xs font-bold text-muted-foreground uppercase tracking-widest cursor-pointer select-none hover:text-slate-300 transition-colors"
          >
            Não perguntar novamente
          </label>
        </div>
      </div>
    </ModalBase>
  )
}



