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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-card text-card-foreground w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
          <h3 className="text-lg font-bold">{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">Nome da Empresa ou Pessoa *</label>
              <Input 
                value={currentClient.nome || ''} 
                onChange={e => setCurrentClient({...currentClient, nome: e.target.value})} 
                placeholder="Ex: Construtora X" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">CPF / CNPJ</label>
              <Input 
                value={currentClient.cpfCnpj || ''} 
                onChange={e => setCurrentClient({...currentClient, cpfCnpj: e.target.value})} 
                placeholder="000.000.000-00" 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">Telefone principal *</label>
              <Input 
                value={currentClient.telefone || ''} 
                onChange={e => setCurrentClient({...currentClient, telefone: e.target.value})} 
                placeholder="(11) 99999-9999" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">E-mail</label>
              <Input 
                value={currentClient.email || ''} 
                onChange={e => setCurrentClient({...currentClient, email: e.target.value})} 
                placeholder="contato@empresa.com" 
              />
            </div>
          </div>

          <div className="space-y-4 p-4 border rounded-xl bg-muted/10 border-border">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Endereço Principal</label>
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3 space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Rua</label>
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
                  placeholder="Buscar rua..." 
                />
              </div>
              <div className="col-span-1 space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Número</label>
                <Input value={enderecoForm.numero} onChange={e => setEnderecoForm({...enderecoForm, numero: e.target.value})} placeholder="123" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Cidade</label>
                <Input value={enderecoForm.cidade} onChange={e => setEnderecoForm({...enderecoForm, cidade: e.target.value})} placeholder="Ex: São Paulo" />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">CEP</label>
                <div className="relative">
                  <Input 
                    value={enderecoForm.cep} 
                    onChange={e => setEnderecoForm({...enderecoForm, cep: e.target.value})} 
                    onBlur={e => handleCepLookup(e.target.value)}
                    placeholder="00000-000" 
                  />
                  {isCepLoading && <div className="absolute right-2 top-2.5 h-4 w-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-4 border-t border-border bg-muted/30 gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onSave} className="bg-accent hover:bg-accent-dark text-white font-bold px-6">
            {isEditing ? 'Salvar Alterações' : 'Cadastrar Cliente'}
          </Button>
        </div>
      </div>
    </div>
  );
}
