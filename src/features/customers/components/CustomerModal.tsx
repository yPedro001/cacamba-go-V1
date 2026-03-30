import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { Cliente } from '@/core/domain/types';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  currentClient: Partial<Cliente>;
  setCurrentClient: (v: any) => void;
  enderecoForm: { rua: string; numero: string; cidade: string; cep: string };
  setEnderecoForm: (v: any) => void;
  isCepLoading: boolean;
  handleCepLookup: (cep: string) => void;
  onSave: () => void;
}

export function CustomerModal({
  isOpen, onClose, isEditing, currentClient, setCurrentClient,
  enderecoForm, setEnderecoForm, isCepLoading, handleCepLookup,
  onSave
}: CustomerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm pl-[260px] pr-4">
      <div className="bg-card text-card-foreground w-full max-w-[480px] rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden border border-border flex flex-col max-h-[75vh]">
        <div className="flex justify-between items-center p-3 border-b border-border bg-muted/30 shrink-0">
          <h3 className="text-sm font-bold uppercase tracking-tight">{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-4 space-y-3 flex-1 overflow-y-auto min-h-0 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">Nome *</label>
              <Input 
                className="h-8 text-xs"
                value={currentClient.nome || ''} 
                onChange={e => setCurrentClient({...currentClient, nome: e.target.value})} 
                placeholder="Ex: Construtora X" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">CPF / CNPJ</label>
              <Input 
                className="h-8 text-xs"
                value={currentClient.cpfCnpj || ''} 
                onChange={e => setCurrentClient({...currentClient, cpfCnpj: e.target.value})} 
                placeholder="000.000.000-00" 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">Telefone *</label>
              <Input 
                className="h-8 text-xs"
                value={currentClient.telefone || ''} 
                onChange={e => setCurrentClient({...currentClient, telefone: e.target.value})} 
                placeholder="(11) 99999-9999" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">E-mail</label>
              <Input 
                className="h-8 text-xs"
                value={currentClient.email || ''} 
                onChange={e => setCurrentClient({...currentClient, email: e.target.value})} 
                placeholder="Ex: contato@..." 
              />
            </div>
          </div>

          <div className="space-y-3 p-3 border rounded-lg bg-muted/10 border-border">
            <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-tighter">Endereço</p>
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-3 space-y-1">
                <AddressAutocomplete 
                  value={enderecoForm.rua} 
                  onChange={(val, lat, lng, address) => {
                    setEnderecoForm((prev: any) => ({
                      ...prev,
                      rua: address?.road || val.split(',')[0] || val,
                      cidade: address?.city || address?.town || address?.suburb || prev.cidade,
                      cep: address?.postcode || prev.cep
                    }));
                  }} 
                  placeholder="Rua..." 
                />
              </div>
              <div className="space-y-1">
                <Input className="h-8 text-xs" value={enderecoForm.numero} onChange={e => setEnderecoForm({...enderecoForm, numero: e.target.value})} placeholder="Nº" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input className="h-8 text-xs" value={enderecoForm.cidade} onChange={e => setEnderecoForm({...enderecoForm, cidade: e.target.value})} placeholder="Cidade" />
              <Input className="h-8 text-xs" value={enderecoForm.cep} onChange={e => setEnderecoForm({...enderecoForm, cep: e.target.value})} onBlur={e => handleCepLookup(e.target.value)} placeholder="00000-000" />
            </div>
          </div>
        </div>

        <div className="flex justify-end p-3 border-t border-border bg-muted/30 gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs h-8">Cancelar</Button>
          <Button onClick={onSave} size="sm" className="bg-accent hover:bg-accent-dark text-white font-bold px-4 text-xs h-8">
            {isEditing ? 'Salvar' : 'Cadastrar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
