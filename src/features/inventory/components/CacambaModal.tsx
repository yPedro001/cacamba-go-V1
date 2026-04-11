import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cepMask } from '@/lib/masks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { Cacamba, Perfil } from '@/core/domain/types';
import { ModalBase } from '@/components/ui/modal-base';

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

// Classe base semântica para todos os inputs — funciona em light e dark
const inputBase = "h-12 rounded-2xl px-4 bg-background border-input text-foreground placeholder:text-muted-foreground/60 focus:ring-accent focus:border-accent";
const selectBase = "w-full h-12 px-4 py-2 rounded-2xl border border-input bg-background text-foreground text-sm font-bold outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent appearance-none transition-all";

export function CacambaModal({
  isOpen, onClose, isEditing, currentCacamba, setCurrentCacamba,
  batchQuantity, setBatchQuantity, isCepLoading, handleCepLookup,
  onSave, alertMessage, perfil
}: CacambaModalProps) {
  const [cepSearch, setCepSearch] = React.useState('');

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={<>{isEditing ? 'Editar' : 'Nova'} <span className="text-accent">Caçamba</span></>}
      subtitle={<><span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />SaaS Enterprise v1.0</>}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="px-8 font-black text-xs uppercase tracking-widest h-12 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted/30">Descartar</Button>
          <Button onClick={onSave} className="bg-accent hover:bg-accent/90 text-white font-black px-12 text-xs uppercase tracking-widest h-12 rounded-2xl shadow-xl shadow-accent/20 transition-all active:scale-95 italic">
            {isEditing ? 'Salvar Alterações' : 'Confirmar Cadastro'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {alertMessage && (
          <div className="flex gap-2 items-start p-4 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 text-xs font-bold uppercase tracking-wider">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{alertMessage}</span>
          </div>
        )}
        
        {!isEditing && perfil.endereco && (
          <div className="p-3 rounded-2xl bg-blue-500/5 text-blue-500 dark:text-blue-400 border border-blue-500/10 text-[10px] font-black uppercase tracking-widest flex gap-2 items-center">
            <span className="opacity-50">📍 Pátio padrão:</span> {perfil.endereco}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Código</label>
            <Input 
              className={`${inputBase} font-black`}
              value={currentCacamba.codigo || ''} 
              onChange={e => setCurrentCacamba({...currentCacamba, codigo: e.target.value})} 
              placeholder="C-000" 
            />
          </div>
          {!isEditing && (
            <div className="space-y-3">
              <label className="text-[10px] font-black text-accent uppercase tracking-[0.2em] ml-1">Qtd. Lote</label>
              <Input 
                className={`${inputBase} font-black`}
                type="number" min="1" max="50" 
                value={batchQuantity} 
                onChange={e => setBatchQuantity(parseInt(e.target.value) || 1)} 
              />
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Tamanho</label>
            <select 
              className={selectBase}
              value={currentCacamba.tamanho || '5m'} 
              onChange={e => setCurrentCacamba({...currentCacamba, tamanho: e.target.value})}
            >
              <option value="3m">3m³</option>
              <option value="4m">4m³</option>
              <option value="5m">5m³</option>
              <option value="7m">7m³</option>
            </select>
          </div>
          <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Status</label>
              <select 
                className={selectBase}
                value={currentCacamba.status || 'disponivel'} 
                onChange={e => setCurrentCacamba({...currentCacamba, status: e.target.value as any})}
              >
                <option value="disponivel">✅ Disponível</option>
                <option value="locada">🏗️ Locada</option>
                <option value="entrega_pendente">🚀 Pendente</option>
              </select>
          </div>
        </div>
        
        <div className="space-y-5 p-6 rounded-[32px] border border-border bg-muted/20 relative overflow-hidden group">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 relative">
             📍 Localização Atual
          </label>
          <AddressAutocomplete 
            value={currentCacamba.enderecoAtual || ''} 
            onChange={(val, lat, lng) => {
              setCurrentCacamba((prev: any) => ({ ...prev, enderecoAtual: val, lat: lat || prev.lat, lng: lng || prev.lng }));
            }} 
            placeholder="Endereço do Pátio ou Localização..." 
          />
          <div className="relative">
            <Input 
              className={`${inputBase} text-sm font-black`}
              placeholder="00000-000 para busca"
              value={cepSearch}
              onChange={e => {
                const maskedValue = cepMask(e.target.value);
                setCepSearch(maskedValue);
                if (maskedValue.length === 9) {
                  handleCepLookup(maskedValue);
                }
              }}
              onBlur={e => handleCepLookup(e.target.value)}
            />
            {isCepLoading && <div className="absolute right-4 top-4 h-4 w-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />}
          </div>
        </div>
      </div>
    </ModalBase>
  );
}
