import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LocacaoSchema } from '@/core/domain/schemas';
import { Locacao, Cliente, Perfil, MetodoPagamento, Cacamba } from '@/core/domain/types';
import { calculateFinancials } from '@/core/domain/business-logic';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { geocodeService } from '@/infrastructure/api/geocode-service';

interface LocacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  locacao?: Partial<Locacao>;
  onSave: (data: Partial<Locacao>) => void;
  clientes: Cliente[];
  perfil: Perfil;
  cacambas: Cacamba[];
}

export function LocacaoModal({
  isOpen, onClose, locacao, onSave, clientes, perfil, cacambas
}: LocacaoModalProps) {
  const [isCepLoading, setIsCepLoading] = useState(false);
  
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<Locacao>({
    resolver: zodResolver(LocacaoSchema) as any,
    defaultValues: {
      quantidadeCacambas: 1,
      status: 'entrega_pendente',
      metodoPagamento: 'pix',
      valor: perfil.padroes?.valorAluguel || 300,
      taxaCartaoPercent: perfil.padroes?.taxaMaquininhaPadrao || 0,
      valorTaxa: 0,
      valorLiquido: perfil.padroes?.valorAluguel || 300,
      parcelas: 1,
      jurosPercent: 0
    }
  });

  const watchValor = watch('valor') || 0;
  const watchMetodo = watch('metodoPagamento');
  const watchTaxaPercent = watch('taxaCartaoPercent') || 0;
  const watchEndereco = watch('enderecoObra');
  const watchLat = watch('lat');

  // Sincroniza estado quando o modal abre
  useEffect(() => {
    if (isOpen) {
      if (locacao?.id) {
        reset(locacao);
      } else {
        const hoje = new Date().toISOString().split('T')[0];
        const daqui7 = new Date(); daqui7.setDate(daqui7.getDate() + 7);
        const devolucao = daqui7.toISOString().split('T')[0];
        
        reset({
          quantidadeCacambas: 1,
          dataRetirada: hoje,
          dataDevolucaoPrevista: devolucao,
          status: 'entrega_pendente',
          metodoPagamento: 'pix',
          valor: perfil.padroes?.valorAluguel || 300,
          valorLiquido: perfil.padroes?.valorAluguel || 300,
          taxaCartaoPercent: perfil.padroes?.taxaMaquininhaPadrao || 0,
          valorTaxa: 0,
          parcelas: 1,
          jurosPercent: 0
        });
      }
    }
  }, [isOpen, locacao, reset, perfil]);

  // Lógica de cálculo financeiro
  useEffect(() => {
    let taxa = 0;
    if (watchMetodo === 'credito') taxa = 4.5;
    if (watchMetodo === 'debito') taxa = 1.9;
    
    // Se o usuário já definiu uma taxa manual, mantemos
    const finalTaxa = watchTaxaPercent > 0 ? watchTaxaPercent : taxa;
    const watchJuros = watch('jurosPercent') || 0;
    const { valorBruto, valorTaxa, valorLiquido } = calculateFinancials(watchValor, finalTaxa, watchJuros);
    
    setValue('valorTaxa', valorTaxa);
    setValue('valorLiquido', valorLiquido);
    if (watchTaxaPercent === 0 && taxa > 0) setValue('taxaCartaoPercent', taxa);

    // Lógica de juros automático baseado no parcelamento
    const watchParcelas = watch('parcelas') || 1;
    if (!locacao?.id) { // Apenas para novas locações
       const limiteSemJuros = perfil.padroes?.parcelasSemJuros || 1;
       const taxaJurosPadrao = perfil.padroes?.jurosParcelamento || 0;
       
       if (watchParcelas > limiteSemJuros && watchJuros === 0) {
         setValue('jurosPercent', taxaJurosPadrao);
       } else if (watchParcelas <= limiteSemJuros && watchJuros === taxaJurosPadrao) {
         setValue('jurosPercent', 0);
       }
    }
  }, [watchValor, watchMetodo, watchTaxaPercent, watch('parcelas'), watch('jurosPercent'), setValue, perfil.padroes, locacao?.id]);

  const handleCepLookup = async (cep: string) => {
    setIsCepLoading(true);
    const data = await geocodeService.fetchByCep(cep);
    setIsCepLoading(false);
    if (data) {
      setValue('enderecoObra', `${data.rua}, ${data.cidade}`);
      if (data.lat && data.lng) {
        setValue('lat', data.lat);
        setValue('lng', data.lng);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm pl-[260px] pr-4">
      <form 
        onSubmit={handleSubmit(onSave)}
        className="bg-card text-card-foreground w-full max-w-[500px] rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden border border-border flex flex-col max-h-[75vh]"
      >
        <div className="flex justify-between items-center p-3 border-b border-border bg-muted/30 shrink-0">
          <h3 className="text-xs font-bold uppercase tracking-wider">{locacao?.id ? 'Editar Locação' : 'Nova Locação'}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-3 flex-1 overflow-y-auto min-h-0 text-[13px]">
          {/* Cliente */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase">Cliente</label>
            <select
              {...register('clienteId')}
              className="w-full h-8 px-2 py-1 rounded border border-input bg-card text-card-foreground text-xs outline-none"
            >
              <option value="">Selecione...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">Qtd</label>
              <Input className="h-8 text-xs" type="number" {...register('quantidadeCacambas', { valueAsNumber: true })} />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">Status</label>
              <select {...register('status')} className="w-full h-8 px-2 py-1 rounded border border-input bg-transparent text-xs">
                <option value="entrega_pendente">Pendente</option>
                <option value="em_uso">Em Uso</option>
                <option value="vencida">Vencida</option>
                <option value="pago">Pago</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase">Caçamba (Opcional)</label>
            <select
              {...register('cacambaId')}
              className="w-full h-8 px-2 py-1 rounded border border-input bg-card text-xs outline-none"
            >
              <option value="">Automática</option>
              {cacambas.filter(c => c.status === 'disponivel').map(c => (
                <option key={c.id} value={c.id}>{c.codigo}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">Retirada</label>
              <Input className="h-8 text-xs" type="date" {...register('dataRetirada')} />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">Devolução</label>
              <Input className="h-8 text-xs" type="date" {...register('dataDevolucaoPrevista')} />
            </div>
          </div>

          <div className="space-y-2 p-3 border rounded border-border bg-muted/10">
            <label className="text-[10px] font-black text-muted-foreground/60 uppercase">Endereço da Obra</label>
            <AddressAutocomplete 
              value={watchEndereco || ''} 
              onChange={(val, lat, lng) => {
                setValue('enderecoObra', val);
                if (lat && lng) { setValue('lat', lat); setValue('lng', lng); }
              }} 
              placeholder="Rua e cidade..." 
            />
            <div className="relative">
              <Input className="h-8 text-xs" placeholder="CEP" onBlur={e => handleCepLookup(e.target.value)} />
              {isCepLoading && <div className="absolute right-2 top-2 h-4 w-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1">
               <label className="text-[11px] font-bold text-muted-foreground uppercase">Valor (R$)</label>
               <Input className="h-8 text-xs" type="number" step="0.01" {...register('valor', { valueAsNumber: true })} />
             </div>
             <div className="space-y-1">
               <label className="text-[11px] font-bold text-muted-foreground uppercase">Pagamento</label>
               <select {...register('metodoPagamento')} className="w-full h-8 px-2 py-1 rounded border border-input bg-card text-xs outline-none">
                 <option value="pix">PIX</option>
                 <option value="debito">Débito</option>
                 <option value="credito">Crédito</option>
                 <option value="boleto">Boleto</option>
               </select>
             </div>
          </div>

          {/* Resumo Financeiro Simplificado */}
          <div className="rounded border border-border bg-muted/30 p-2 space-y-1 text-[11px]">
             <div className="flex justify-between font-bold">
               <span>Total:</span>
               <span className="text-accent">R$ {((watchValor || 0) * (1 + (watch('jurosPercent') || 0) / 100)).toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-green-600 font-bold border-t border-border/50 pt-1 mt-1">
               <span>Líquido:</span>
               <span>R$ {(watch('valorLiquido') || 0).toFixed(2)}</span>
             </div>
          </div>
        </div>

        <div className="flex justify-end p-3 border-t border-border bg-muted/30 gap-2 shrink-0">
          <button type="button" onClick={onClose} className="text-[11px] font-bold hover:underline">Cancelar</button>
          <Button type="submit" size="sm" className="bg-accent hover:bg-accent-dark text-white font-bold px-4 text-xs h-8">
            {locacao?.id ? 'Salvar' : 'Cadastrar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
