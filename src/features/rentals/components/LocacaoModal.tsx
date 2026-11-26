import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SmartCurrencyInput } from "@/components/ui/smart-currency-input";
import {
  Locacao,
  Cliente,
  Perfil,
  Cacamba,
  MetodoPagamento,
} from "@/core/domain/types";
import { LocacaoSchema } from "@/core/domain/schemas";
import { calculateFinancials } from "@/core/domain/business-logic";
import { DuplicateClientDialog } from "@/components/DuplicateClientDialog";
import { UnsavedChangesConfirmDialog } from "@/components/ui/unsaved-changes";
import { ModalBase } from "@/components/ui/modal-base";
import {
  UserPlus,
  Users,
  Save,
  Loader2,
  CreditCard,
  Info,
  AlertCircle,
} from "lucide-react";
import { geocodeService } from "@/infrastructure/api/geocode-service";
import { cpfCnpjMask, phoneMask, cepMask } from "@/lib/masks";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { cn } from "@/lib/utils";
import {
  addDaysLocalISO,
  getLocalTodayISO,
} from "@/lib/domain-helpers";
import { notify } from "@/lib/notificationService";

const round2 = (v: number): number => Math.round((v + Number.EPSILON) * 100) / 100;

const calcularValorTotal = (valorUnitario: number, quantidade: number): number =>
  round2(valorUnitario * Math.max(1, quantidade));

const derivarValorUnitario = (valorTotal: number, quantidade: number): number => {
  if (quantidade <= 0) return 0;
  return round2(valorTotal / quantidade);
};

const LocacaoFormSchema = LocacaoSchema.extend({
  clienteId: z.string().optional().default(""),
  novoCliente: z
    .object({
      nome: z.string().optional().default(""),
      cpfCnpj: z.string().optional().default(""),
      telefone: z.string().optional().default(""),
      email: z.string().optional().default(""),
    })
    .optional(),
  salvarEndereco: z.boolean().optional().default(false),
  nomeEndereco: z.string().optional().default(""),
  enderecoDetalhes: z.any().optional(),
  valorUnitario: z.number().optional().default(300),
});

type LocacaoFormData = z.infer<typeof LocacaoFormSchema>;

const selectBase =
  "flex min-h-[44px] w-full rounded-lg border border-input bg-card px-3.5 py-2 text-base md:text-sm font-medium text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-[invalid=true]:border-destructive";

interface LocacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  locacao?: Partial<Locacao>;
  onSave: (
    data: Partial<Locacao> & {
      salvarEndereco?: boolean;
      nomeEndereco?: string;
      enderecoDetalhes?: any;
    }
  ) => void | Promise<boolean>;
  onAddClienteAndSave: (
    cliente: Partial<Cliente>,
    locacaoData: Partial<Locacao>,
    options?: { updateExisting?: boolean; useExistingId?: string }
  ) => void | Promise<boolean | void>;
  clientes: Cliente[];
  perfil: Perfil;
  cacambas: Cacamba[];
  showCloseConfirm?: boolean;
}

export function LocacaoModal({
  isOpen,
  onClose,
  locacao,
  onSave,
  onAddClienteAndSave,
  clientes,
  perfil,
  cacambas,
}: LocacaoModalProps) {
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [isNovoCliente, setIsNovoCliente] = useState(false);
  const [duplicateCheck, setDuplicateCheck] = useState<{ isOpen: boolean; client?: Cliente }>({
    isOpen: false,
  });
  const [selectedEnderecoId, setSelectedEnderecoId] = useState<string>("manual");
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [valorTotalEditadoManualmente, setValorTotalEditadoManualmente] = useState(false);

  const valorPadrao = perfil.padroes?.valorAluguel || 300;
  const taxaCartaoPadrao = perfil.padroes?.taxaMaquininhaPadrao ?? 0;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<LocacaoFormData>({
    resolver: zodResolver(LocacaoFormSchema) as any,
    defaultValues: {
      quantidadeCacambas: 1,
      status: "entrega_pendente",
      metodoPagamento: "pix",
      valor: valorPadrao,
      valorUnitario: valorPadrao,
      taxaCartaoPercent: 0,
      valorTaxa: 0,
      valorLiquido: valorPadrao,
      parcelas: 1,
      jurosPercent: 0,
      salvarEndereco: false,
      nomeEndereco: "",
      clienteId: "",
      enderecoObra: "",
      novoCliente: { nome: "", cpfCnpj: "", telefone: "", email: "" },
    },
  });

  const watchMetodo = watch("metodoPagamento") as MetodoPagamento | undefined;
  const watchValor = watch("valor") ?? 0;
  const watchTaxaPercent = watch("taxaCartaoPercent") ?? 0;
  const watchParcelas = watch("parcelas") ?? 1;
  const watchJuros = watch("jurosPercent") ?? 0;
  const watchEndereco = watch("enderecoObra");
  const watchClienteId = watch("clienteId");
  const watchSalvarEndereco = watch("salvarEndereco");
  const watchQuantidade = watch("quantidadeCacambas") || 1;
  const watchValorUnitario = watch("valorUnitario") || valorPadrao;

  const selectedClient = useMemo(
    () => clientes.find((c) => c.id === watchClienteId),
    [clientes, watchClienteId]
  );

  // Inicialização limpa ao abrir modal
  useEffect(() => {
    if (!isOpen) return;

    if (locacao && locacao.id) {
      const qtd = locacao.quantidadeCacambas || 1;
      const total = locacao.valor ?? valorPadrao;
      const isCard =
        locacao.metodoPagamento === "credito" || locacao.metodoPagamento === "debito";
      reset({
        ...locacao,
        quantidadeCacambas: qtd,
        valor: total,
        valorUnitario: derivarValorUnitario(total, qtd),
        taxaCartaoPercent: isCard ? (locacao.taxaCartaoPercent ?? taxaCartaoPadrao) : 0,
        parcelas: locacao.parcelas ?? 1,
        jurosPercent: locacao.jurosPercent ?? 0,
        salvarEndereco: false,
        nomeEndereco: "",
      });
      setIsNovoCliente(false);
      setSelectedEnderecoId("manual");
      setValorTotalEditadoManualmente(false);
    } else {
      const todayISO = getLocalTodayISO();
      const plus7ISO = addDaysLocalISO(todayISO, 7);
      const defaultQtd = 1;
      const defaultTotal = calcularValorTotal(valorPadrao, defaultQtd);
      reset({
        dataRetirada: todayISO,
        dataDevolucaoPrevista: plus7ISO,
        quantidadeCacambas: defaultQtd,
        status: "entrega_pendente",
        metodoPagamento: "pix",
        valor: defaultTotal,
        valorUnitario: valorPadrao,
        taxaCartaoPercent: 0,
        valorTaxa: 0,
        valorLiquido: defaultTotal,
        parcelas: 1,
        jurosPercent: 0,
        salvarEndereco: false,
        nomeEndereco: "",
        clienteId: "",
        enderecoObra: "",
        observacoes: "",
        novoCliente: { nome: "", cpfCnpj: "", telefone: "", email: "" },
      });
      setIsNovoCliente(false);
      setSelectedEnderecoId("manual");
      setValorTotalEditadoManualmente(false);
    }
    setShowCloseConfirm(false);
  }, [isOpen, locacao, reset, valorPadrao, taxaCartaoPadrao]);

  const handleAttemptClose = useCallback(() => {
    if (isDirty || isNovoCliente) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  }, [isDirty, isNovoCliente, onClose]);

  const confirmDiscard = () => {
    setShowCloseConfirm(false);
    onClose();
  };

  // Auto-preenchimento de endereço quando escolhe endereço salvo do cliente
  useEffect(() => {
    if (!isOpen || isNovoCliente || !selectedClient || selectedEnderecoId === "manual") return;
    const end = selectedClient.enderecos?.find((e) => e.id === selectedEnderecoId);
    if (end) {
      setValue("enderecoObra", `${end.rua}, ${end.numero || "S/N"} - ${end.cidade}`, {
        shouldDirty: true,
      });
      if (end.cep) setValue("cep", end.cep);
      if (end.lat !== undefined) setValue("lat", end.lat);
      if (end.lng !== undefined) setValue("lng", end.lng);
    }
  }, [isOpen, selectedEnderecoId, selectedClient, isNovoCliente, setValue]);

  // Recalcula valor total ao mudar quantidade ou unitário quando não foi editado manualmente (watchValor fora das deps!)
  useEffect(() => {
    if (!isOpen || valorTotalEditadoManualmente) return;
    if (locacao?.id) return;
    const novoTotal = calcularValorTotal(watchValorUnitario, watchQuantidade);
    setValue("valor", novoTotal);
  }, [isOpen, watchQuantidade, watchValorUnitario, locacao?.id, valorTotalEditadoManualmente, setValue]);

  const handleValorTotalChange = useCallback(
    (novoValor: number) => {
      const unitarioDerivado = derivarValorUnitario(novoValor, watchQuantidade);
      setValue("valor", novoValor, { shouldDirty: true });
      setValue("valorUnitario", unitarioDerivado);
      setValorTotalEditadoManualmente(true);
    },
    [watchQuantidade, setValue]
  );

  const handleValorUnitarioChange = useCallback(
    (novoUnitario: number) => {
      const totalCalculado = calcularValorTotal(novoUnitario, watchQuantidade);
      setValue("valorUnitario", novoUnitario, { shouldDirty: true });
      setValue("valor", totalCalculado, { shouldDirty: true });
      setValorTotalEditadoManualmente(false);
    },
    [watchQuantidade, setValue]
  );

  // Ao mudar método de pagamento, garante que taxa de cartão só existe em Crédito/Débito
  const handleMetodoChange = (novoMetodo: MetodoPagamento) => {
    setValue("metodoPagamento", novoMetodo, { shouldDirty: true });
    if (novoMetodo === "credito" || novoMetodo === "debito") {
      if (!watchTaxaPercent && taxaCartaoPadrao > 0) {
        setValue("taxaCartaoPercent", taxaCartaoPadrao);
      }
      if (novoMetodo === "debito") {
        setValue("parcelas", 1);
        setValue("jurosPercent", 0);
      }
    } else {
      setValue("taxaCartaoPercent", 0);
      setValue("parcelas", 1);
      setValue("jurosPercent", 0);
    }
  };

  // Recalcula taxas e juros automaticamente sempre que método/parcelas/valor mudar
  useEffect(() => {
    const limiteSemJuros = perfil.padroes?.parcelasSemJuros ?? 1;
    const taxaJurosPadrao = perfil.padroes?.jurosParcelamento ?? 0;

    let effectiveJuros = watchJuros;
    if (watchMetodo === "credito" && watchParcelas > limiteSemJuros && taxaJurosPadrao > 0 && watchJuros === 0) {
      effectiveJuros = taxaJurosPadrao;
      setValue("jurosPercent", taxaJurosPadrao);
    } else if (
      (watchMetodo !== "credito" || watchParcelas <= limiteSemJuros) &&
      watchJuros === taxaJurosPadrao &&
      taxaJurosPadrao > 0
    ) {
      effectiveJuros = 0;
      setValue("jurosPercent", 0);
    }

    const { valorTaxa, valorLiquido } = calculateFinancials(
      watchValor,
      watchMetodo,
      watchTaxaPercent,
      effectiveJuros
    );
    setValue("valorTaxa", valorTaxa);
    setValue("valorLiquido", valorLiquido);
  }, [watchValor, watchMetodo, watchTaxaPercent, watchParcelas, watchJuros, setValue, perfil.padroes]);

  const handleCepLookup = async (cep: string) => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    setIsCepLoading(true);
    const data = await geocodeService.fetchByCep(cep);
    setIsCepLoading(false);
    if (data) {
      const fullAddress = `${data.rua}, ${data.cidade}${data.bairro ? ` (${data.bairro})` : ""}`;
      setValue("enderecoObra", fullAddress, { shouldDirty: true });
      if (data.lat) setValue("lat", data.lat);
      if (data.lng) setValue("lng", data.lng);
    } else {
      notify.warning("CEP não encontrado. Preencha o endereço manualmente.");
    }
  };

  const onSubmit = async (data: LocacaoFormData) => {
    if (isNovoCliente) {
      const novoClienteData = data.novoCliente;
      if (!novoClienteData?.nome?.trim()) {
        notify.error("Informe o nome do novo cliente.");
        return;
      }
      const docDigits = (novoClienteData.cpfCnpj || "").replace(/\D/g, "");
      const existing = docDigits
        ? clientes.find((c) => (c.cpfCnpj || "").replace(/\D/g, "") === docDigits)
        : undefined;

      if (existing) {
        setDuplicateCheck({ isOpen: true, client: existing });
        return;
      }
      await onAddClienteAndSave(novoClienteData, data as Partial<Locacao>);
      onClose();
      return;
    }

    if (!data.clienteId) {
      notify.error("Selecione um cliente para a locação.");
      return;
    }

    const saved = await onSave(data as Partial<Locacao>);
    if (saved !== false) {
      onClose();
    }
  };

  const onFormError = () => {
    notify.error("Revise os campos destacados antes de salvar a locação.");
  };

  const handleDuplicateOption = async (
    option: "create_new" | "link_existing" | "update_and_link"
  ) => {
    const existing = duplicateCheck.client;
    if (!existing) return;
    const data = watch();
    setDuplicateCheck({ isOpen: false });

    if (option === "create_new") {
      await onAddClienteAndSave(data.novoCliente || {}, data as Partial<Locacao>);
    } else if (option === "link_existing") {
      await onSave({ ...data, clienteId: existing.id } as Partial<Locacao>);
    } else if (option === "update_and_link") {
      await onAddClienteAndSave(data.novoCliente || {}, data as Partial<Locacao>, {
        updateExisting: true,
        useExistingId: existing.id,
      });
    }
    onClose();
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

  const cacambasDisponiveis = cacambas.filter((c) => c.status === "disponivel");
  const isCardMetodo = watchMetodo === "credito" || watchMetodo === "debito";

  return (
    <>
      <ModalBase
        isOpen={isOpen}
        onClose={handleAttemptClose}
        maxWidth="2xl"
        title={locacao?.id ? "Editar Locação" : "Nova Locação"}
        subtitle="Informe cliente, obra, período e condições de recebimento."
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleAttemptClose}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="locacao-form"
              className="w-full sm:w-auto"
            >
              {locacao?.id ? "Salvar Alterações" : "Confirmar Locação"}
            </Button>
          </>
        }
      >
        <form
          id="locacao-form"
          onSubmit={handleSubmit(onSubmit, onFormError)}
          className="space-y-5"
        >
          {/* Seleção ou cadastro rápido de Cliente */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="loc-cliente" className="text-xs font-semibold text-foreground">
                Cliente / Solicitante *
              </label>
              {!locacao?.id && (
                <Button
                  type="button"
                  size="sm"
                  variant={isNovoCliente ? "default" : "outline"}
                  onClick={() => setIsNovoCliente((v) => !v)}
                >
                  {isNovoCliente ? (
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {isNovoCliente ? "Usar Cliente Existente" : "Cadastrar Novo Cliente"}
                </Button>
              )}
            </div>

            {isNovoCliente ? (
              <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                  Cadastro Rápido de Cliente
                </p>
                <Input
                  placeholder="Nome completo / Razão Social *"
                  aria-label="Nome do novo cliente"
                  {...register("novoCliente.nome")}
                />
                <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
                  <Controller
                    name="novoCliente.cpfCnpj"
                    control={control}
                    render={({ field }) => (
                      <Input
                        placeholder="CPF ou CNPJ (para CTR)"
                        aria-label="CPF ou CNPJ"
                        className="font-mono"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(cpfCnpjMask(e.target.value))}
                      />
                    )}
                  />
                  <Controller
                    name="novoCliente.telefone"
                    control={control}
                    render={({ field }) => (
                      <Input
                        placeholder="WhatsApp / Telefone"
                        aria-label="Telefone"
                        className="font-mono"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(phoneMask(e.target.value))}
                      />
                    )}
                  />
                </div>
                <Input
                  type="email"
                  placeholder="E-mail (opcional)"
                  aria-label="E-mail do cliente"
                  {...register("novoCliente.email")}
                />
              </div>
            ) : (
              <select
                id="loc-cliente"
                {...register("clienteId")}
                className={selectBase}
              >
                <option value="">Selecione um cliente...</option>
                {(clientes || []).filter(Boolean).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome || "Cliente"} {c.cpfCnpj ? `(${c.cpfCnpj})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Endereço da Obra */}
          <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/30">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="loc-cep" className="text-xs font-semibold text-foreground">
                Endereço da Obra *
              </label>
              {!isNovoCliente && selectedClient && (selectedClient.enderecos?.length ?? 0) > 0 && (
                <select
                  aria-label="Escolher endereço salvo do cliente"
                  className="min-h-[36px] max-w-full rounded-lg border border-primary/30 bg-card px-2.5 text-xs font-semibold text-primary"
                  value={selectedEnderecoId}
                  onChange={(e) => setSelectedEnderecoId(e.target.value)}
                >
                  <option value="manual">Digitar endereço manual</option>
                  {(selectedClient.enderecos || []).filter(Boolean).map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nome || "Obra"} — {e.rua || ""}, {e.numero || "S/N"}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="relative">
                <Controller
                  name="cep"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="loc-cep"
                      placeholder="CEP"
                      className="font-mono pr-8"
                      value={field.value || ""}
                      onChange={(e) => {
                        const val = cepMask(e.target.value);
                        field.onChange(val);
                        if (val.replace(/\D/g, "").length === 8) void handleCepLookup(val);
                      }}
                    />
                  )}
                />
                {isCepLoading && (
                  <Loader2
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary"
                    aria-hidden="true"
                  />
                )}
              </div>

              <div className="sm:col-span-3">
                <Controller
                  name="enderecoObra"
                  control={control}
                  render={({ field }) => (
                    <AddressAutocomplete
                      value={field.value || ""}
                      onChange={(val, lat, lng, details) => {
                        field.onChange(val);
                        if (lat !== undefined) setValue("lat", lat);
                        if (lng !== undefined) setValue("lng", lng);
                        if (details) setValue("enderecoDetalhes", details);
                      }}
                      placeholder="Rua, número e cidade da entrega..."
                    />
                  )}
                />
              </div>
            </div>
            {errors.enderecoObra && (
              <p className="text-xs font-medium text-status-danger-ink flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {errors.enderecoObra.message}
              </p>
            )}

            {!isNovoCliente && watchClienteId && selectedEnderecoId === "manual" && watchEndereco && (
              <div className="pt-2 border-t border-border/60 space-y-2">
                <label
                  htmlFor="salvarEndereco"
                  className="inline-flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer"
                >
                  <input
                    type="checkbox"
                    id="salvarEndereco"
                    className="h-4 w-4 accent-primary rounded"
                    checked={Boolean(watchSalvarEndereco)}
                    onChange={(e) => setValue("salvarEndereco", e.target.checked)}
                  />
                  <Save className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  Salvar este endereço no cadastro do cliente
                </label>
                {watchSalvarEndereco && (
                  <Input
                    placeholder="Apelido para este endereço (Ex: Obra Centro)"
                    {...register("nomeEndereco")}
                  />
                )}
              </div>
            )}
          </div>

          {/* Quantidade, Caçamba e Status */}
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="loc-qtd" className="text-xs font-semibold text-foreground">
                Quantidade de caçambas
              </label>
              <Input
                id="loc-qtd"
                type="number"
                min={1}
                {...register("quantidadeCacambas", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="loc-status" className="text-xs font-semibold text-foreground">
                Status da locação
              </label>
              <select id="loc-status" {...register("status")} className={selectBase}>
                <option value="entrega_pendente">Entrega Pendente</option>
                <option value="em_uso">Em Uso na Obra</option>
                <option value="vencida">Vencida</option>
                <option value="pago">Pago</option>
                <option value="concluida">Concluída</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="loc-cab" className="text-xs font-semibold text-foreground">
              Caçamba específica (opcional)
            </label>
            <select id="loc-cab" {...register("cacambaId")} className={selectBase}>
              <option value="">
                Selecionar automaticamente ({cacambasDisponiveis.length} disponíveis)
              </option>
              {cacambasDisponiveis.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.codigo} — {c.tamanho}³
                </option>
              ))}
            </select>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="loc-dt-ini" className="text-xs font-semibold text-foreground">
                Data de Entrega / Início *
              </label>
              <Input
                id="loc-dt-ini"
                type="date"
                aria-invalid={Boolean(errors.dataRetirada)}
                {...register("dataRetirada")}
              />
              {errors.dataRetirada && (
                <p className="text-xs text-status-danger-ink">{errors.dataRetirada.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="loc-dt-fim" className="text-xs font-semibold text-foreground">
                Previsão de Retirada *
              </label>
              <Input
                id="loc-dt-fim"
                type="date"
                aria-invalid={Boolean(errors.dataDevolucaoPrevista)}
                {...register("dataDevolucaoPrevista")}
              />
              {errors.dataDevolucaoPrevista && (
                <p className="text-xs text-status-danger-ink">
                  {errors.dataDevolucaoPrevista.message}
                </p>
              )}
            </div>
          </div>

          {/* Financeiro */}
          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-4">
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="loc-unit" className="text-xs font-semibold text-foreground">
                  Valor unitário (por caçamba)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    R$
                  </span>
                  <Controller
                    name="valorUnitario"
                    control={control}
                    render={({ field }) => (
                      <SmartCurrencyInput
                        id="loc-unit"
                        value={field.value ?? valorPadrao}
                        onChange={handleValorUnitarioChange}
                        className="pl-9 font-mono font-bold tabular-nums"
                        placeholder="0,00"
                      />
                    )}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="loc-total" className="text-xs font-semibold text-foreground">
                  Valor total
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    R$
                  </span>
                  <Controller
                    name="valor"
                    control={control}
                    render={({ field }) => (
                      <SmartCurrencyInput
                        id="loc-total"
                        value={field.value ?? 0}
                        onChange={handleValorTotalChange}
                        className="pl-9 font-mono font-bold tabular-nums"
                        placeholder="0,00"
                      />
                    )}
                  />
                </div>
                {watchQuantidade > 1 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {watchQuantidade}x de {formatCurrency(watchValorUnitario)}
                  </p>
                )}
              </div>
            </div>

            {/* Forma de Pagamento */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                Forma de Pagamento
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["pix", "debito", "credito", "boleto"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMetodoChange(m)}
                    className={cn(
                      "min-h-[42px] rounded-lg border text-xs font-bold uppercase transition-colors",
                      watchMetodo === m
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:text-foreground"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {isCardMetodo && (
              <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-3 pt-1">
                <div className="space-y-1">
                  <label htmlFor="loc-taxa" className="text-xs font-medium text-muted-foreground">
                    Taxa maquininha (%)
                  </label>
                  <Input
                    id="loc-taxa"
                    type="number"
                    step="0.01"
                    min={0}
                    max={99}
                    {...register("taxaCartaoPercent", { valueAsNumber: true })}
                  />
                </div>

                {watchMetodo === "credito" && (
                  <>
                    <div className="space-y-1">
                      <label htmlFor="loc-parc" className="text-xs font-medium text-muted-foreground">
                        Parcelas
                      </label>
                      <Input
                        id="loc-parc"
                        type="number"
                        min={1}
                        max={24}
                        {...register("parcelas", { valueAsNumber: true })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="loc-juros" className="text-xs font-medium text-muted-foreground">
                        Juros repasse (%)
                      </label>
                      <Input
                        id="loc-juros"
                        type="number"
                        step="0.01"
                        min={0}
                        max={99}
                        {...register("jurosPercent", { valueAsNumber: true })}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Resumo Líquido */}
            <div className="rounded-lg border border-border bg-card px-3.5 py-2.5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total ao cliente:</span>
                <span className="font-mono font-bold tabular-nums text-foreground">
                  {formatCurrency(round2(watchValor * (1 + watchJuros / 100)))}
                </span>
              </div>
              {isCardMetodo && (watch("valorTaxa") || 0) > 0 && (
                <div className="flex items-center justify-between text-status-danger-ink">
                  <span>Taxa maquininha ({watchTaxaPercent}%):</span>
                  <span className="font-mono tabular-nums">
                    - {formatCurrency(watch("valorTaxa") || 0)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1.5 border-t border-border">
                <span className="font-semibold text-foreground">Valor líquido previsto:</span>
                <span className="font-mono text-base font-bold tabular-nums text-status-success-ink">
                  {formatCurrency(watch("valorLiquido") || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <label htmlFor="loc-obs" className="text-xs font-semibold text-foreground">
              Observações (opcional)
            </label>
            <Input
              id="loc-obs"
              placeholder="Ex: Deixar caçamba próxima ao portão lateral"
              {...register("observacoes")}
            />
          </div>
        </form>
      </ModalBase>

      {duplicateCheck.isOpen && duplicateCheck.client && (
        <DuplicateClientDialog
          isOpen={duplicateCheck.isOpen}
          existingClient={duplicateCheck.client}
          onClose={() => setDuplicateCheck({ isOpen: false })}
          onOptionSelected={handleDuplicateOption}
        />
      )}

      <UnsavedChangesConfirmDialog
        isOpen={showCloseConfirm}
        onConfirm={confirmDiscard}
        onCancel={() => setShowCloseConfirm(false)}
      />
    </>
  );
}
