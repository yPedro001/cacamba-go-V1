"use client"
import React from 'react'
import { Button } from './ui/button'
import { AlertCircle, UserCheck, UserPlus, RefreshCcw } from 'lucide-react'
import { Cliente } from '@/core/domain/types'
import { ModalBase } from '@/components/ui/modal-base'

interface DuplicateClientDialogProps {
  isOpen: boolean
  onClose: () => void
  existingClient: Cliente
  onOptionSelected: (option: 'create_new' | 'link_existing' | 'update_and_link') => void
}

export function DuplicateClientDialog({ 
  isOpen, 
  onClose, 
  existingClient, 
  onOptionSelected 
}: DuplicateClientDialogProps) {
  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={
        <div className="flex items-center gap-3 text-amber-500">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Cliente já cadastrado</span>
        </div>
      }
      footer={
        <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground font-bold text-xs uppercase tracking-widest px-6 h-12 rounded-2xl w-full sm:w-auto hover:bg-muted/50 text-foreground">
          Cancelar Operação
        </Button>
      }
    >
      <div className="flex flex-col gap-6 relative">
        <p className="text-sm text-slate-300 leading-relaxed pt-2">
          Identificamos que o documento informado já pertence a <span className="text-foreground font-bold">{existingClient.nome}</span>. Como deseja prosseguir?
        </p>

        <div className="grid grid-cols-1 gap-3 pt-2">
          <button 
            onClick={() => onOptionSelected('link_existing')}
            className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border hover:bg-accent/10 hover:border-accent/30 transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
              <UserCheck size={24} />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">Vincular ao cliente existente</p>
              <p className="text-xs text-muted-foreground">Ignora os dados novos e usa o cadastro atual.</p>
            </div>
          </button>

          <button 
            onClick={() => onOptionSelected('update_and_link')}
            className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:rotate-12 transition-transform">
              <RefreshCcw size={24} />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">Atualizar dados e vincular</p>
              <p className="text-xs text-muted-foreground">Sobrescreve o cadastro antigo com as novas informações.</p>
            </div>
          </button>

          <button 
            onClick={() => onOptionSelected('create_new')}
            className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border hover:bg-slate-800 transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-muted-foreground group-hover:scale-95 transition-transform">
              <UserPlus size={24} />
            </div>
            <div>
              <p className="font-bold text-slate-300 text-sm">Criar um novo mesmo assim</p>
              <p className="text-xs text-muted-foreground italic">Gera um cadastro duplicado no sistema.</p>
            </div>
          </button>
        </div>
      </div>
    </ModalBase>
  )
}


