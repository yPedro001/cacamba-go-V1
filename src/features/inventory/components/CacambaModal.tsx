import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { Cacamba, Perfil } from '@/core/domain/types';

interface CacambaModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  currentCacamba: Partial<Cacamba>;
  setCurrentCacamba: (v: any) => void;
  batchQuantity: number;
  setBatchQuantity: (v: number) => void;
  isCepLoading: boolean;
  handleCepLookup: (cep: string) => void;
  onSave: () => void;
  alertMessage?: string;
  perfil: Perfil;
}

export function CacambaModal({
  isOpen, onClose, isEditing, currentCacamba, setCurrentCacamba,
  batchQuantity, setBatchQuantity, isCepLoading, handleCepLookup,
  onSave, alertMessage, perfil
}: CacambaModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-card text-card-foreground w-full max-w-sm rounded-xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
          <h3 className="text-lg font-bold">{isEditing ? 'Editar Caçamba' : 'Nova Caçamba'}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {alertMessage && (
          <div className="mx-4 mt-3 flex gap-2 items-start p-3 rounded-lg bg-destructive/15 text-destructive border border-destructive/30 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{alertMessage}</span>
          </div>
        )}
        
        {!isEditing && perfil.endereco && (
          <div className="mx-4 mt-3 p-2 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs flex gap-2 items-center">
            <span className="font-semibold">Pátio padrão:</span> {perfil.endereco}
          </div>
        )}

        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">Código</label>
              <Input 
                value={currentCacamba.codigo || ''} 
                onChange={e => setCurrentCacamba({...currentCacamba, codigo: e.target.value})} 
                placeholder="C-000" 
              />
            </div>
            {!isEditing && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-accent">Qtd. Lote</label>
                <Input 
                  type="number" min="1" max="50" 
                  value={batchQuantity} 
                  onChange={e => setBatchQuantity(parseInt(e.target.value) || 1)} 
                />
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">Tamanho</label>
              <select 
                className="w-full h-10 px-3 py-2 rounded-md border border-input bg-transparent text-sm"
                value={currentCacamba.tamanho || '5m'} 
                onChange={e => setCurrentCacamba({...currentCacamba, tamanho: e.target.value})}
              >
                <option value="3m">3m³</option>
                <option value="4m">4m³</option>
                <option value="5m">5m³</option>
                <option value="7m">7m³</option>
              </select>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">Status</label>
                <select 
                  className="w-full h-10 px-3 py-2 rounded-md border border-input bg-transparent text-sm"
                  value={currentCacamba.status || 'disponivel'} 
                  onChange={e => setCurrentCacamba({...currentCacamba, status: e.target.value as any})}
                >
                  <option value="disponivel">Disponível</option>
                  <option value="locada">Locada</option>
                  <option value="entrega_pendente">Entrega Pendente</option>
                </select>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">Endereço Atual</label>
            <AddressAutocomplete 
              value={currentCacamba.enderecoAtual || ''} 
              onChange={(val, lat, lng) => {
                setCurrentCacamba((prev: any) => ({ ...prev, enderecoAtual: val, lat: lat || prev.lat, lng: lng || prev.lng }));
              }} 
              placeholder="Pátio ou Local" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase">Ou Buscar por CEP</label>
            <div className="relative">
              <Input 
                placeholder="00000-000"
                onBlur={e => handleCepLookup(e.target.value)}
              />
              {isCepLoading && <div className="absolute right-2 top-2.5 h-4 w-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />}
            </div>
          </div>
        </div>

        <div className="flex justify-end p-4 border-t border-border bg-muted/30 gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onSave} className="bg-accent hover:bg-accent-dark text-white">
            {isEditing ? 'Salvar' : 'Cadastrar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
