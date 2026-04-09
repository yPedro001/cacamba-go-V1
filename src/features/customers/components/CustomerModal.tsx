import React from 'react';
import { cpfCnpjMask, phoneMask, cepMask } from '@/lib/masks';
import { Plus, Trash2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { Cliente, ClienteEndereco } from '@/core/domain/types';
import { ModalBase } from '@/components/ui/modal-base';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  currentClient: Partial<Cliente>;
  setCurrentClient: (v: any) => void;
  enderecosForm: Partial<ClienteEndereco>[];
  addEnderecoField: () => void;
  removeEnderecoField: (index: number) => void;
  updateEnderecoField: (index: number, data: Partial<ClienteEndereco>) => void;
  isCepLoading: boolean;
  handleCepLookup: (index: number, cep: string) => void;
  onSave: () => void;
}

// Classe base reutilizável para inputs do modal — semântica, funciona em light e dark
const inputBase = "h-12 rounded-2xl px-4 bg-background border-input text-foreground placeholder:text-muted-foreground/60 focus:ring-accent focus:border-accent";

export function CustomerModal({
  isOpen, onClose, isEditing, currentClient, setCurrentClient,
  enderecosForm, addEnderecoField, removeEnderecoField, updateEnderecoField,
  isCepLoading, handleCepLookup,
  onSave
}: CustomerModalProps) {
  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={<>{isEditing ? 'Editar' : 'Novo'} <span className="text-accent">Cliente</span></>}
      subtitle={<><span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />Gestão de Endereços Ativada</>}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="px-8 font-black text-xs uppercase tracking-widest h-12 rounded-2xl text-muted-foreground hover:bg-muted/30 hover:text-foreground">Descartar</Button>
          <Button onClick={onSave} className="bg-accent hover:bg-accent/90 text-white font-black px-12 text-xs uppercase tracking-widest h-12 rounded-2xl shadow-xl shadow-accent/20 transition-all active:scale-95 italic">
            {isEditing ? 'Atualizar Cadastro' : 'Confirmar Registro'}
          </Button>
        </>
      }
    >
      <div className="space-y-8">
        {/* Dados Básicos */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Nome Completo / Razão *</label>
            <Input 
              className={`${inputBase} font-bold`}
              value={currentClient.nome || ''} 
              onChange={e => setCurrentClient({...currentClient, nome: e.target.value})} 
              placeholder="Ex: Construtora Exemplo" 
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">CPF / CNPJ</label>
            <Input 
              className={`${inputBase} font-mono text-sm`}
              value={currentClient.cpfCnpj || ''} 
              onChange={e => setCurrentClient({...currentClient, cpfCnpj: cpfCnpjMask(e.target.value)})} 
              placeholder="00.000.000/0001-00" 
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Telefone Principal *</label>
            <Input 
              className={`${inputBase} font-bold`}
              value={currentClient.telefone || ''} 
              onChange={e => setCurrentClient({...currentClient, telefone: phoneMask(e.target.value)})} 
              placeholder="(11) 99999-9999" 
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Canal de E-mail</label>
            <Input 
              className={`${inputBase} text-sm`}
              value={currentClient.email || ''} 
              onChange={e => setCurrentClient({...currentClient, email: e.target.value})} 
              placeholder="financeiro@empresa.com" 
            />
          </div>
        </div>

        <hr className="border-border" />

        {/* Gerenciamento de Endereços */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <MapPin size={14} className="text-accent" /> Endereços do Cliente
            </h4>
            <Button 
              onClick={addEnderecoField} 
              variant="outline" 
              size="sm" 
              className="h-8 rounded-full border-accent/20 text-accent hover:bg-accent hover:text-white text-[10px] font-black uppercase tracking-widest"
            >
              <Plus size={14} className="mr-1" /> Adicionar Endereço
            </Button>
          </div>

          <div className="space-y-4">
            {(enderecosForm || []).map((end, index) => (
              <div key={end.id || index} className="p-6 rounded-[24px] border border-border bg-muted/20 relative group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 mr-4">
                    <Input 
                      className="h-9 rounded-xl text-xs font-black tracking-widest uppercase bg-background border-input text-foreground placeholder:text-muted-foreground/40 focus:ring-accent w-full"
                      value={end.nome || ''}
                      onChange={e => updateEnderecoField(index, { nome: e.target.value })}
                      placeholder="NOME DO ENDEREÇO (EX: MATRIZ, OBRA CENTRO...)"
                    />
                  </div>
                  {enderecosForm.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeEnderecoField(index)} 
                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div className="col-span-3">
                    {/* AddressAutocomplete recebe classe explícita para garantir contraste */}
                    <AddressAutocomplete 
                      value={end.rua || ''} 
                      onChange={(val, lat, lng, address) => {
                        updateEnderecoField(index, {
                          rua: address?.road || val.split(',')[0] || val,
                          cidade: address?.city || address?.town || address?.suburb || end.cidade,
                          cep: address?.postcode || end.cep,
                          lat,
                          lng
                        });
                      }} 
                      placeholder="Logradouro..." 
                      className="bg-background border-input text-foreground placeholder:text-muted-foreground/60"
                    />
                  </div>
                  <Input 
                    className="h-12 rounded-2xl font-bold px-4 bg-background border-input text-foreground placeholder:text-muted-foreground/60" 
                    value={end.numero || ''} 
                    onChange={e => updateEnderecoField(index, { numero: e.target.value })} 
                    placeholder="Nº" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input 
                    className="h-12 rounded-2xl px-4 text-sm font-semibold bg-background border-input text-foreground placeholder:text-muted-foreground/60" 
                    value={end.cidade || ''} 
                    onChange={e => updateEnderecoField(index, { cidade: e.target.value })} 
                    placeholder="Cidade" 
                  />
                  <div className="relative">
                    <Input 
                      className="h-12 rounded-2xl px-4 text-sm font-mono bg-background border-input text-foreground placeholder:text-muted-foreground/60" 
                      value={end.cep || ''} 
                      onChange={e => updateEnderecoField(index, { cep: cepMask(e.target.value) })} 
                      onBlur={e => handleCepLookup(index, e.target.value)} 
                      placeholder="00000-000" 
                    />
                    {isCepLoading && <div className="absolute right-3 top-4 h-4 w-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ModalBase>
  );
}
