import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, UserPlus, Users, MapPin, Save, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { LocacaoSchema } from '@/core/domain/schemas';
import { Locacao, Cliente, Perfil, Cacamba, ClienteEndereco } from '@/core/domain/types';
import { calculateFinancials } from '@/core/domain/business-logic';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { geocodeService } from '@/infrastructure/api/geocode-service';
import { DuplicateClientDialog } from '@/components/DuplicateClientDialog';
import { cn } from '@/lib/utils';
import { Controller } from 'react-hook-form';
import { formatCurrency } from '@/lib/currency-utils';
import { SmartCurrencyInput } from '@/components/ui/smart-currency-input';
import { cpfCnpjMask, phoneMask } from '@/lib/masks';
import { ModalBase } from '@/components/ui/modal-base';

// Schema estendido para o form: clienteId é opcional quando isNovoCliente = true
const LocacaoFormSchema = LocacaoSchema.extend({
  clienteId: z.string().optional().default(''),
  novoCliente: z.object({
    nome: z.string().optional().default(''),
    cpfCnpj: z.string().optional().default(''),
    telefone: z.string().optional().default(''),
    email: z.string().optional().default(''),
  }).optional(),
  salvarEndereco: z.boolean().optional().default(false),
  nomeEndereco: z.string().optional().default(''),
  enderecoDetalhes: z.any().optional(),
});

type LocacaoFormData = z.infer<typeof LocacaoFormSchema>;

interface LocacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  locacao?: Partial<Locacao>;
  onSave: (data: Partial<Locacao> & { salvarEndereco?: boolean, nomeEndereco?: string, enderecoDetalhes?: any }) => void;
  onAddClienteAndSave: (cliente: Partial<Cliente>, locacaoData: Partial<Locacao>, options?: { updateExisting?: boolean, useExistingId?: string }) => void;
  clientes: Cliente[];
  perfil: Perfil;
  cacambas: Cacamba[];
}

export function LocacaoModal({
  isOpen, onClose, locacao, onSave, onAddClienteAndSave, clientes, perfil, cacambas
}: LocacaoModalProps) {
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [isNovoCliente, setIsNovoCliente] = useState(false);
  const [duplicateCheck, setDuplicateCheck] = useState<{ isOpen: boolean, client?: Cliente }>({ isOpen: false });
  const [selectedEnderecoId, setSelectedEnderecoId] = useState<string>('manual');
  
  const { register, handleSubmit, setValue, watch, reset, control, formState: { errors } } = useForm<LocacaoFormData>({
    resolver: zodResolver(LocacaoFormSchema) as any,
    defaultValues: {
      quantidadeCacambas: 1,
      status: 'entrega_pendente',
      metodoPagamento: 'pix',
      valor: perfil.padroes?.valorAluguel ?? 300,
      taxaCartaoPercent: perfil.padroes?.taxaMaquininhaPadrao ?? 0,
      valorTaxa: 0,
      valorLiquido: perfil.padroes?.valorAluguel ?? 300,
      parcelas: 1,
      jurosPercent: 0,
      salvarEndereco: false,
      nomeEndereco: '',
      clienteId: '',
      novoCliente: { nome: '', cpfCnpj: '', telefone: '', email: '' }
    }
  });

  const watchValor = watch('valor') || 0;
  const watchMetodo = watch('metodoPagamento');
  const watchTaxaPercent = watch('taxaCartaoPercent') || 0;
  const watchEndereco = watch('enderecoObra');
  const watchClienteId = watch('clienteId');
  const watchSalvarEndereco = watch('salvarEndereco');

  const selectedClient = useMemo(() => 
    clientes.find(c => c.id === watchClienteId), 
    [clientes, watchClienteId]
  );

  // Sincroniza estado quando o modal abre
  useEffect(() => {
    if (isOpen) {
      if (locacao?.id) {
        reset(locacao as any);
        setIsNovoCliente(false);
        setSelectedEnderecoId('manual');
      } else {
        const hoje = new Date().toISOString().split('T')[0];
        const daqui7 = new Date(); daqui7.setDate(daqui7.getDate() + 7);
        const devolucao = daqui7.toISOString().split('T')[0];
        
        const defaultValor = perfil.padroes?.valorAluguel ?? 300;
        reset({
          quantidadeCacambas: 1,
          dataRetirada: hoje,
          dataDevolucaoPrevista: devolucao,
          status: 'entrega_pendente',
          metodoPagamento: 'pix',
          valor: defaultValor,
          valorLiquido: defaultValor,
          taxaCartaoPercent: perfil.padroes?.taxaMaquininhaPadrao ?? 0,
          valorTaxa: 0,
          parcelas: 1,
          jurosPercent: 0,
          salvarEndereco: false,
          nomeEndereco: '',
          clienteId: '',
          novoCliente: { nome: '', cpfCnpj: '', telefone: '', email: '' }
        });
        setIsNovoCliente(false);
        setSelectedEnderecoId('manual');
      }
    }
  }, [isOpen, locacao, reset, perfil]);

  // Se o cliente selecionado tiver apenas 1 endereço, seleciona automaticamente
  useEffect(() => {
    if (selectedClient && !locacao?.id) {
      const enderecos = selectedClient.enderecos || [];
      if (enderecos.length === 1) {
        const end = enderecos[0];
        setSelectedEnderecoId(end.id!);
        setValue('enderecoObra', `${end.rua}, ${end.numero} - ${end.cidade}`);
        setValue('lat', end.lat);
        setValue('lng', end.lng);
      } else if (enderecos.length > 1) {
        setSelectedEnderecoId('');
      } else {
        setSelectedEnderecoId('manual');
      }
    }
  }, [selectedClient, setValue, locacao?.id]);

  // Lógica de cálculo financeiro
  useEffect(() => {
    let taxa = 0;
    if (watchMetodo === 'credito') taxa = 4.5;
    if (watchMetodo === 'debito') taxa = 1.9;
    
    const finalTaxa = watchTaxaPercent > 0 ? watchTaxaPercent : taxa;
    const watchJuros = watch('jurosPercent') || 0;
    const { valorTaxa, valorLiquido } = calculateFinancials(watchValor, finalTaxa, watchJuros);
    
    setValue('valorTaxa', valorTaxa);
    setValue('valorLiquido', valorLiquido);
    if (watchTaxaPercent === 0 && taxa > 0) setValue('taxaCartaoPercent', taxa);

    const watchParcelas = watch('parcelas') || 1;
    if (!locacao?.id) {
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

  const handleEnderecoSelection = (id: string) => {
    setSelectedEnderecoId(id);
    if (id === 'manual') {
      setValue('enderecoObra', '');
      setValue('lat', undefined);
      setValue('lng', undefined);
    } else {
      const end = selectedClient?.enderecos?.find(e => e.id === id);
      if (end) {
        setValue('enderecoObra', `${end.rua}, ${end.numero} - ${end.cidade}`);
        setValue('lat', end.lat);
        setValue('lng', end.lng);
      }
    }
  };

  const internalOnSave = (data: LocacaoFormData) => {
    if (isNovoCliente) {
      // Guard: garante que novoCliente existe antes de acessar suas propriedades
      const novoClienteData = data.novoCliente;
      if (!novoClienteData?.nome?.trim()) {
        alert('Por favor, preencha o nome do novo cliente.');
        return;
      }
      
      const cpfCnpjValue = novoClienteData?.cpfCnpj || '';
      const existing = cpfCnpjValue
        ? clientes.find(c => c.cpfCnpj === cpfCnpjValue)
        : undefined;

      if (existing) {
        setDuplicateCheck({ isOpen: true, client: existing });
        return;
      }

      onAddClienteAndSave(novoClienteData, data as any);
    } else {
      if (!data.clienteId) {
        alert('Por favor, selecione um cliente.');
        return;
      }
      onSave(data as any);
    }
  };

  const handleDuplicateResolution = (option: 'create_new' | 'link_existing' | 'update_and_link') => {
    const data = watch();
    const existing = duplicateCheck.client!;
    setDuplicateCheck({ isOpen: false });

    if (option === 'create_new') {
      onAddClienteAndSave(data.novoCliente! as any, data as any);
    } else if (option === 'link_existing') {
        onSave({ ...data, clienteId: existing.id } as any);
    } else if (option === 'update_and_link') {
      onAddClienteAndSave(data.novoCliente! as any, data as any, { updateExisting: true, useExistingId: existing.id });
    }
  };

  if (!isOpen) return null;

  return (
    <>
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={<>{locacao?.id ? 'Editar' : 'Nova'} <span className="text-accent">Locação</span></>}
      subtitle={<><span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />SaaS Enterprise v1.0</>}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} className="px-8 font-black text-xs uppercase tracking-widest h-12 rounded-2xl text-muted-foreground hover:bg-muted/30 hover:text-foreground">Cancelar</Button>
          <Button type="submit" form="locacao-form" className="bg-accent hover:bg-accent-dark text-white font-black px-12 text-xs uppercase tracking-widest h-12 rounded-2xl shadow-xl shadow-accent/20 transition-all active:scale-95 disabled:opacity-50">
            {locacao?.id ? 'Atualizar Contrato' : 'Efetivar Locação'}
          </Button>
        </>
      }
    >
        <form 
          id="locacao-form"
          onSubmit={handleSubmit(internalOnSave)}
          className="space-y-8"
        >
            {/* Seletor de Cliente / Novo Cliente */}
            <div className="space-y-4">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Informações do Cliente</label>
                {!locacao?.id && (
                  <button 
                    type="button"
                    onClick={() => setIsNovoCliente(!isNovoCliente)}
                    className={cn(
                      "flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-all border",
                      isNovoCliente 
                        ? "bg-accent text-white border-accent" 
                        : "bg-muted text-muted-foreground border-border hover:text-foreground"
                    )}
                  >
                    {isNovoCliente ? <Users size={12} /> : <UserPlus size={12} />}
                    {isNovoCliente ? "Usar Cliente Existente" : "Cadastrar Novo Cliente"}
                  </button>
                )}
              </div>

              {isNovoCliente ? (
                <div className="p-5 rounded-2xl border border-accent/30 bg-accent/5 space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2 text-accent text-[11px] font-black uppercase tracking-widest mb-1">
                    <UserPlus size={14} /> Novo Cadastro Rápido
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <Input 
                      placeholder="Nome completo ou Razão Social" 
                      className="h-11 rounded-xl bg-background border-input text-foreground placeholder:text-muted-foreground/50" 
                      {...register('novoCliente.nome')}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Controller
                        name="novoCliente.cpfCnpj"
                        control={control}
                        render={({ field }) => (
                          <Input 
                            {...field}
                            value={field.value ?? ''}
                            placeholder="CPF ou CNPJ" 
                            className="h-11 rounded-xl bg-background border-input font-mono text-sm text-foreground placeholder:text-muted-foreground/50" 
                            onChange={(e) => field.onChange(cpfCnpjMask(e.target.value))}
                          />
                        )}
                      />
                      <Controller
                        name="novoCliente.telefone"
                        control={control}
                        render={({ field }) => (
                          <Input 
                            {...field}
                            value={field.value ?? ''}
                            placeholder="WhatsApp / Telefone" 
                            className="h-11 rounded-xl bg-background border-input text-foreground placeholder:text-muted-foreground/50" 
                            onChange={(e) => field.onChange(phoneMask(e.target.value))}
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <select
                    {...register('clienteId')}
                    className="w-full h-12 px-4 py-2 rounded-2xl border border-input bg-background text-foreground text-sm font-semibold outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all appearance-none shadow-sm"
                  >
                    <option value="">Selecione o Cliente...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-accent transition-colors">
                    <Users size={16} />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Quantidade</label>
                <Input className="h-11 rounded-2xl font-bold px-4 bg-background border-input text-foreground" type="number" {...register('quantidadeCacambas', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Status Operacional</label>
                <select {...register('status')} className="w-full h-11 px-4 py-2 rounded-2xl border border-input bg-background text-foreground text-sm font-bold outline-none focus:ring-2 focus:ring-accent/20 shadow-sm appearance-none">
                  <option value="entrega_pendente">🚀 Pendente</option>
                  <option value="em_uso">🏗️ Em Uso</option>
                  <option value="vencida">🚨 Vencida</option>
                  <option value="pago">✅ Pago</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Caçamba Especificada</label>
              <select
                {...register('cacambaId')}
                className="w-full h-11 px-4 py-2 rounded-2xl border border-input bg-background text-foreground text-sm font-semibold outline-none focus:ring-2 focus:ring-accent/20 shadow-sm appearance-none"
              >
                <option value="">Definição Automática</option>
                {cacambas.filter(c => c.status === 'disponivel' || c.id === watch('cacambaId')).map(c => (
                  <option key={c.id} value={c.id}>{c.codigo}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Data de Início</label>
                <Input className="h-11 rounded-2xl font-mono text-sm px-4 bg-background border-input text-foreground" type="date" {...register('dataRetirada')} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 text-accent">Previsão Fim</label>
                <Input className="h-11 rounded-2xl font-mono text-sm px-4 bg-background border-input text-foreground" type="date" {...register('dataDevolucaoPrevista')} />
              </div>
            </div>

            <div className="space-y-4 p-5 rounded-3xl border border-border bg-muted/30 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 blur-3xl group-hover:bg-accent/10 transition-colors pointer-events-none" />
              
              <div className="flex items-center justify-between relative">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                   📍 Localização da Entrega
                </label>
                
                {selectedClient && (selectedClient.enderecos?.length || 0) > 0 && (
                  <select
                    value={selectedEnderecoId}
                    onChange={(e) => handleEnderecoSelection(e.target.value)}
                    className="text-[10px] font-black uppercase tracking-widest bg-accent/10 text-accent border-none rounded-full px-2 py-1 outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="manual">➕ Entrada Manual</option>
                    {selectedClient.enderecos?.map(e => (
                      <option key={e.id} value={e.id}>🏠 {e.nome || 'Endereço sem nome'}</option>
                    ))}
                  </select>
                )}
              </div>

              {(selectedEnderecoId === 'manual' || !selectedClient) ? (
                <div className="space-y-3 animate-in fade-in duration-300">
                  <AddressAutocomplete 
                    value={watchEndereco || ''} 
                    onChange={(val, lat, lng, details) => {
                      setValue('enderecoObra', val);
                      if (lat && lng) { setValue('lat', lat); setValue('lng', lng); }
                      if (details) { setValue('enderecoDetalhes', details); }
                    }} 
                    placeholder="Busque o endereço da obra..." 
                  />
                  <div className="relative">
                    <Input className="h-11 rounded-2xl pl-10 text-sm font-bold bg-background border-input text-foreground placeholder:text-muted-foreground/50" placeholder="CEP para busca rápida" onBlur={e => handleCepLookup(e.target.value)} />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50">
                      <MapPin size={16} />
                    </div>
                    {isCepLoading && <div className="absolute right-4 top-3.5 h-4 w-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>}
                  </div>

                  {selectedClient && !locacao?.id && (
                    <div className="pt-2 flex flex-col gap-3 p-4 rounded-xl bg-muted/50 border border-border">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox"
                          id="salvarEndereco"
                          className="w-4 h-4 rounded border-border bg-background text-accent focus:ring-accent accent-accent cursor-pointer"
                          checked={!!watchSalvarEndereco}
                          onChange={(e) => setValue('salvarEndereco', e.target.checked)}
                        />
                        <label htmlFor="salvarEndereco" className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5">
                          <Save size={12} className="text-accent" /> Salvar este endereço no cadastro do cliente?
                        </label>
                      </div>
                      
                      {watchSalvarEndereco && (
                        <div className="animate-in slide-in-from-left-2 duration-200">
                          <Input 
                            placeholder="Nome para este endereço (Ex: Obra Centro)" 
                            className="h-10 rounded-xl text-xs font-bold bg-background border-input text-foreground placeholder:text-muted-foreground/50"
                            {...register('nomeEndereco')}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-accent/10 border border-accent/20 flex items-start gap-4 animate-in zoom-in-95 duration-300">
                  <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <MapPin className="text-accent" size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">Endereço Selecionado</p>
                    <p className="text-sm font-bold text-foreground leading-snug">{watchEndereco}</p>
                    <button 
                      type="button" 
                      onClick={() => handleEnderecoSelection('manual')}
                      className="text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-tighter mt-2 inline-flex items-center gap-1 transition-colors"
                    >
                      Alterar para entrada manual
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Valor Unitário</label>
                  <Controller
                    name="valor"
                    control={control}
                    render={({ field }) => (
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground/50 z-10 pointer-events-none">R$</span>
                        <SmartCurrencyInput
                          value={field.value || 0}
                          onChange={field.onChange}
                          className="h-11 rounded-2xl pl-10 font-black text-lg tabular-nums bg-background border-input text-foreground"
                          placeholder="0,00"
                        />
                      </div>
                    )}
                  />
                </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Forma Pagto</label>
                 <select {...register('metodoPagamento')} className="w-full h-11 px-4 py-2 rounded-2xl border border-input bg-background text-foreground text-sm font-bold outline-none focus:ring-2 focus:ring-accent/20 appearance-none shadow-sm">
                   <option value="pix">💎 PIX</option>
                   <option value="debito">💳 Débito</option>
                   <option value="credito">🏦 Crédito</option>
                   <option value="boleto">📄 Boleto</option>
                 </select>
               </div>
            </div>

            {/* Resumo Financeiro Premium */}
            <div className="rounded-3xl border border-accent/20 bg-accent/10 p-6 space-y-2 relative overflow-hidden group shadow-lg shadow-accent/5">
               <div className="absolute bottom-0 right-0 w-32 h-32 bg-accent/20 blur-[100px] pointer-events-none" />
               <div className="flex justify-between items-baseline relative">
                 <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Valor Bruto Total</span>
                 <span className="text-xl font-black tabular-nums text-foreground">
                   {formatCurrency((watchValor || 0) * (1 + (watch('jurosPercent') || 0) / 100))}
                 </span>
               </div>
               <div className="flex justify-between items-baseline border-t border-accent/10 pt-2 mt-2 relative">
                 <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Recebimento Estimado</span>
                 <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                   {formatCurrency(watch('valorLiquido') || 0)}
                 </span>
               </div>
            </div>
        </form>
    </ModalBase>

      {duplicateCheck.client && (
        <DuplicateClientDialog 
          isOpen={duplicateCheck.isOpen}
          onClose={() => setDuplicateCheck({ isOpen: false })}
          existingClient={duplicateCheck.client}
          onOptionSelected={handleDuplicateResolution}
        />
      )}
    </>
  );
}
