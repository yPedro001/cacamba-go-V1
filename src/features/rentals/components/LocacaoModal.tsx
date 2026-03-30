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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-8">
      <form 
        onSubmit={handleSubmit(onSave)}
        className="bg-card text-card-foreground w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[92vh]"
      >
        <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30 shrink-0">
          <h3 className="text-lg font-bold">{locacao?.id ? 'Editar Locação' : 'Nova Locação'}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-4 flex-1 overflow-y-auto min-h-0">
          {/* Cliente */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">Cliente</label>
            <select
              {...register('clienteId')}
              className="w-full h-10 px-3 py-2 rounded-md border border-input bg-card text-card-foreground text-sm focus:ring-2 focus:ring-accent outline-none"
            >
              <option value="" className="bg-card text-card-foreground">Selecione o Cliente</option>
              {clientes.map(c => <option key={c.id} value={c.id} className="bg-card text-card-foreground">{c.nome}</option>)}
            </select>
            {errors.clienteId && <span className="text-xs text-red-500 font-medium">{errors.clienteId.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">Qtd. Caçambas</label>
              <Input type="number" {...register('quantidadeCacambas', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">Status</label>
              <select {...register('status')} className="w-full h-10 px-3 py-2 rounded-md border border-input bg-transparent text-sm">
                <option value="entrega_pendente">Entrega Pendente</option>
                <option value="em_uso">Em Uso</option>
                <option value="vencida">Vencida/Retirar</option>
                <option value="pago">Pago</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">Caçamba (Opcional)</label>
            <select
              {...register('cacambaId')}
              className="w-full h-10 px-3 py-2 rounded-md border border-input bg-card text-card-foreground text-sm focus:ring-2 focus:ring-accent outline-none"
            >
              <option value="" className="bg-card text-card-foreground">Alocação Automática</option>
              {cacambas.filter(c => c.status === 'disponivel').map(c => (
                <option key={c.id} value={c.id} className="bg-card text-card-foreground">
                  {c.codigo} ({c.tamanho || '5m³'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">Data Retirada</label>
              <Input type="date" {...register('dataRetirada')} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">Prev. Devolução</label>
              <Input type="date" {...register('dataDevolucaoPrevista')} />
            </div>
          </div>

          <div className="space-y-4 relative border p-4 rounded-xl border-border bg-muted/10">
            <label className="text-sm font-semibold text-muted-foreground flex justify-between">
              ENDEREÇO DA OBRA
              {watchLat && <span className="text-green-500 text-xs flex items-center bg-green-500/10 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3 mr-1"/> Validado</span>}
            </label>
            <AddressAutocomplete 
              value={watchEndereco || ''} 
              onChange={(val, lat, lng) => {
                setValue('enderecoObra', val);
                if (lat && lng) { setValue('lat', lat); setValue('lng', lng); }
              }} 
              placeholder="Digite a rua e cidade..." 
            />
            <div className="space-y-2">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase">Ou Buscar por CEP</label>
                <div className="relative">
                  <Input placeholder="00000-000" onBlur={e => handleCepLookup(e.target.value)} />
                  {isCepLoading && <div className="absolute right-2 top-2.5 h-4 w-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>}
                </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">Valor Total (R$)</label>
              <Input type="number" step="0.01" {...register('valor', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">Pagamento</label>
              <select {...register('metodoPagamento')} className="w-full h-10 px-3 py-2 rounded-md border border-input bg-card text-card-foreground text-sm outline-none">
                <option value="pix" className="bg-card text-card-foreground">PIX</option>
                <option value="debito" className="bg-card text-card-foreground">Débito</option>
                <option value="credito" className="bg-card text-card-foreground">Crédito</option>
                <option value="boleto" className="bg-card text-card-foreground">Boleto</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">Parcelas (Opcional)</label>
              <select {...register('parcelas', { valueAsNumber: true })} className="w-full h-10 px-3 py-2 rounded-md border border-input bg-card text-card-foreground text-sm outline-none">
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i+1} value={i+1}>{i+1}x</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">Juros (%)</label>
              <Input type="number" step="0.01" {...register('jurosPercent', { valueAsNumber: true })} />
            </div>
          </div>

          {/* Resumo Financeiro */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-1 text-sm">
             <div className="flex justify-between font-bold">
               <span>Total (com Juros):</span>
               <span className="text-accent">R$ {((watchValor || 0) * (1 + (watch('jurosPercent') || 0) / 100)).toFixed(2)}</span>
             </div>
             {(watchMetodo === 'credito' || watchMetodo === 'debito') && (
               <div className="flex justify-between text-red-500/80 text-xs italic">
                 <span>Taxa p/ Empresa ({watchTaxaPercent}%):</span>
                 <span>- R$ {(watch('valorTaxa') || 0).toFixed(2)}</span>
               </div>
             )}
             <div className="flex justify-between font-bold text-green-600 pt-1 border-t border-border/50">
               <span>Líquido p/ Empresa:</span>
               <span>R$ {(watch('valorLiquido') || 0).toFixed(2)}</span>
             </div>
          </div>
        </div>

        <div className="flex justify-end p-4 border-t border-border bg-muted/30 gap-2 shrink-0">
          <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
          <Button type="submit" className="bg-accent hover:bg-accent-dark text-white font-bold px-6">
            {locacao?.id ? 'Salvar Alterações' : 'Cadastrar Locação'}
          </Button>
        </div>
      </form>
    </div>
  );
}
