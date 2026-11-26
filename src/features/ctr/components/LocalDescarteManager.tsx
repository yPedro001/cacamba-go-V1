"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModalBase } from "@/components/ui/modal-base";
import { ConfirmModal } from "@/components/ConfirmModal";
import { LocalDescarte } from "@/core/domain/ctr-types";
import { cpfCnpjMask, phoneMask, cepMask, fetchCEPData } from "@/lib/masks";
import { geocodeService } from "@/infrastructure/api/geocode-service";
import { UFEnum } from "@/core/domain/ctr-schemas";
import {
  Plus,
  Trash2,
  Edit,
  Star,
  MapPin,
  Building2,
  Phone,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { UnsavedChangesConfirmDialog } from "@/components/ui/unsaved-changes";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { AddressSuggestion } from "@/lib/address-utils";
import { notify } from "@/lib/notificationService";
import { cn } from "@/lib/utils";

export interface LocalDescarteManagerProps {
  locais: LocalDescarte[];
  onAdd: (local: Omit<LocalDescarte, "id" | "createdAt" | "usuarioId">) => Promise<unknown> | unknown;
  onUpdate: (id: string, updates: Partial<LocalDescarte>) => Promise<unknown> | unknown;
  onDelete: (id: string) => void;
  onSetPadrao: (id: string) => void;
}

export interface LocalFormData {
  nome: string;
  cnpj: string;
  telefone: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  tipoLocal: string;
  licenca: string;
  observacoes: string;
  isPadrao: boolean;
}

const ufs = UFEnum.options;
const tiposLocal = [
  { value: "aterro_sanitario", label: "Aterro Sanitário" },
  { value: "usina_reciclagem", label: "Usina de Reciclagem" },
  { value: "area_transbordo", label: "Área de Transbordo" },
  { value: "centro_tratamento", label: "Centro de Tratamento" },
  { value: "disposicao_final", label: "Disposição Final" },
  { value: "outro", label: "Outro" },
];

const emptyForm: LocalFormData = {
  nome: "",
  cnpj: "",
  telefone: "",
  rua: "",
  numero: "",
  bairro: "",
  cidade: "",
  uf: "SP",
  cep: "",
  tipoLocal: "",
  licenca: "",
  observacoes: "",
  isPadrao: false,
};

const selectClass =
  "flex min-h-[44px] w-full rounded-lg border border-input bg-card px-3.5 py-2 text-base md:text-sm font-medium text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function LocalDescarteManager({
  locais,
  onAdd,
  onUpdate,
  onDelete,
  onSetPadrao,
}: LocalDescarteManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LocalFormData>(emptyForm);
  const [savedForm, setSavedForm] = useState<LocalFormData>(emptyForm);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LocalDescarte | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [reverseCepLoading, setReverseCepLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const hasUnsavedChanges = JSON.stringify(form) !== JSON.stringify(savedForm);

  const resetForm = () => {
    setForm(emptyForm);
    setSavedForm(emptyForm);
    setEditingId(null);
    setSaveError(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (local: LocalDescarte) => {
    const filled: LocalFormData = {
      nome: local.nome || "",
      cnpj: local.cnpj || "",
      telefone: local.telefone || "",
      rua: local.rua || "",
      numero: local.numero || "",
      bairro: local.bairro || "",
      cidade: local.cidade || "",
      uf: local.uf || "SP",
      cep: local.cep || "",
      tipoLocal: local.tipoLocal || "",
      licenca: local.licenca || "",
      observacoes: local.observacoes || "",
      isPadrao: Boolean(local.isPadrao),
    };
    setForm(filled);
    setSavedForm(filled);
    setEditingId(local.id || null);
    setSaveError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (hasUnsavedChanges) {
      setShowCloseConfirm(true);
    } else {
      setIsModalOpen(false);
      resetForm();
    }
  };

  const handleSave = async () => {
    setSaveError(null);
    if (!form.nome.trim() || !form.rua.trim() || !form.cidade.trim()) {
      setSaveError("Nome, Rua e Cidade são obrigatórios.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...form,
        tipoLocal: form.tipoLocal || undefined,
      } as Omit<LocalDescarte, "id" | "createdAt" | "usuarioId">;

      const result = editingId
        ? await onUpdate(editingId, payload)
        : await onAdd(payload);

      if (result === undefined) {
        setSaveError("Não foi possível salvar este local no servidor. Verifique sua conexão.");
        return;
      }

      notify.success(editingId ? "Local de descarte atualizado!" : "Local de descarte adicionado!");
      setSavedForm(form);
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      setSaveError(err?.message || "Erro ao salvar local de descarte.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCepBlur = async () => {
    const cleanCEP = form.cep.replace(/\D/g, "");
    if (cleanCEP.length !== 8) return;
    setCepLoading(true);
    const data = await fetchCEPData(form.cep);
    if (data) {
      setForm((prev) => ({
        ...prev,
        rua: data.logradouro || prev.rua,
        bairro: data.bairro || prev.bairro,
        cidade: data.cidade || prev.cidade,
        uf: data.uf || prev.uf,
      }));
    }
    setCepLoading(false);
  };

  const handleAddressBlur = async () => {
    if (form.cep || !form.rua || !form.cidade || !form.uf) return;
    if (form.rua.length < 3 || form.cidade.length < 3) return;
    setReverseCepLoading(true);
    try {
      const result = await geocodeService.fetchCepByAddress(form.rua, form.cidade, form.uf);
      if (result?.cep) {
        setForm((prev) => ({ ...prev, cep: cepMask(result.cep) }));
      }
    } finally {
      setReverseCepLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="px-4 py-4 sm:px-6 border-b border-border flex flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Building2 className="h-5 w-5 text-primary" aria-hidden="true" />
            Locais de Descarte (Aterros / ATT)
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Destinos habilitados para recebimento no CTR.
          </p>
        </div>
        <Button type="button" size="sm" onClick={openAddModal}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Adicionar Local
        </Button>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        {locais.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-border space-y-3">
            <MapPin className="h-8 w-8 mx-auto text-muted-foreground/60" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              Nenhum local de descarte cadastrado. Cadastre ao menos um aterro ou usina para emitir CTR.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={openAddModal}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Cadastrar Primeiro Local
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {locais.map((local) => (
              <div
                key={local.id}
                className={cn(
                  "p-4 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3",
                  local.isPadrao
                    ? "bg-primary/5 border-primary/40"
                    : "bg-background/60 border-border"
                )}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm sm:text-base text-foreground">
                      {local.nome}
                    </span>
                    {local.isPadrao && (
                      <Badge variant="default">
                        <Star className="h-3 w-3" aria-hidden="true" />
                        Padrão
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {local.rua}
                    {local.numero ? `, ${local.numero}` : ""} · {local.cidade}/{local.uf}
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground font-mono">
                    {local.cnpj && <span>CNPJ: {local.cnpj}</span>}
                    {local.telefone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" aria-hidden="true" />
                        {local.telefone}
                      </span>
                    )}
                    {local.licenca && (
                      <span className="inline-flex items-center gap-1">
                        <FileText className="h-3 w-3" aria-hidden="true" />
                        Licença: {local.licenca}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!local.isPadrao && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onSetPadrao(local.id)}
                    >
                      <Star className="h-3.5 w-3.5" aria-hidden="true" />
                      Definir padrão
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => openEditModal(local)}
                    aria-label={`Editar local ${local.nome}`}
                  >
                    <Edit className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setDeleteTarget(local)}
                    aria-label={`Excluir local ${local.nome}`}
                    className="text-status-danger-ink border-destructive/30 hover:bg-status-danger-bg"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <ModalBase
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        maxWidth="lg"
        title={editingId ? "Editar Local de Descarte" : "Novo Local de Descarte"}
        subtitle="Preencha os dados do aterro, usina ou área de transbordo."
        footer={
          <>
            <Button type="button" variant="outline" onClick={handleCloseModal} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {editingId ? "Salvar Alterações" : "Cadastrar Local"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {saveError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-destructive/35 bg-status-danger-bg p-3 text-xs sm:text-sm font-medium text-status-danger-ink"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{saveError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="ld-nome" className="text-xs font-semibold text-foreground">
              Nome / Razão social *
            </label>
            <Input
              id="ld-nome"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex: Aterro Sanitário Municipal"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="ld-cnpj" className="text-xs font-semibold text-foreground">
                CNPJ / CPF
              </label>
              <Input
                id="ld-cnpj"
                className="font-mono"
                value={form.cnpj}
                onChange={(e) => setForm({ ...form, cnpj: cpfCnpjMask(e.target.value) })}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="ld-tel" className="text-xs font-semibold text-foreground">
                Telefone
              </label>
              <Input
                id="ld-tel"
                className="font-mono"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: phoneMask(e.target.value) })}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="ld-cep" className="text-xs font-semibold text-foreground">
                CEP
              </label>
              <div className="relative">
                <Input
                  id="ld-cep"
                  className="font-mono pr-8"
                  value={form.cep}
                  onChange={(e) => setForm({ ...form, cep: cepMask(e.target.value) })}
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                />
                {(cepLoading || reverseCepLoading) && (
                  <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
                )}
              </div>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label htmlFor="ld-tipo" className="text-xs font-semibold text-foreground">
                Tipo do local
              </label>
              <select
                id="ld-tipo"
                value={form.tipoLocal}
                onChange={(e) => setForm({ ...form, tipoLocal: e.target.value })}
                className={selectClass}
              >
                <option value="">Selecione...</option>
                {tiposLocal.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3 space-y-1.5">
              <label htmlFor="ld-rua" className="text-xs font-semibold text-foreground">
                Rua / Avenida *
              </label>
              <AddressAutocomplete
                id="ld-rua"
                value={form.rua}
                onChange={(val, _lat, _lng, address?: AddressSuggestion["address"]) => {
                  setForm((prev) => ({
                    ...prev,
                    rua: address?.road || val.split(",")[0] || val,
                    bairro: address?.suburb || prev.bairro,
                    cidade: address?.city || address?.town || address?.suburb || prev.cidade,
                    cep: address?.postcode ? cepMask(address.postcode) : prev.cep,
                  }));
                }}
                placeholder="Digite o endereço..."
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="ld-num" className="text-xs font-semibold text-foreground">
                Número
              </label>
              <Input
                id="ld-num"
                value={form.numero}
                onChange={(e) => setForm({ ...form, numero: e.target.value })}
                placeholder="S/N"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="ld-bairro" className="text-xs font-semibold text-foreground">
                Bairro
              </label>
              <Input
                id="ld-bairro"
                value={form.bairro}
                onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                placeholder="Bairro"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="ld-cidade" className="text-xs font-semibold text-foreground">
                Cidade *
              </label>
              <Input
                id="ld-cidade"
                value={form.cidade}
                onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                onBlur={handleAddressBlur}
                placeholder="Cidade"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="ld-uf" className="text-xs font-semibold text-foreground">
                UF *
              </label>
              <select
                id="ld-uf"
                value={form.uf}
                onChange={(e) => setForm({ ...form, uf: e.target.value })}
                className={selectClass}
              >
                {ufs.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="ld-lic" className="text-xs font-semibold text-foreground">
              Licença ambiental / CETESB (opcional)
            </label>
            <Input
              id="ld-lic"
              value={form.licenca}
              onChange={(e) => setForm({ ...form, licenca: e.target.value })}
              placeholder="Nº da licença operacional"
            />
          </div>

          <label
            htmlFor="isPadrao"
            className="inline-flex items-center gap-2.5 min-h-[44px] cursor-pointer text-xs font-semibold text-foreground"
          >
            <input
              type="checkbox"
              id="isPadrao"
              checked={form.isPadrao}
              onChange={(e) => setForm({ ...form, isPadrao: e.target.checked })}
              className="h-4 w-4 accent-primary rounded"
            />
            Definir como local padrão para novos CTRs
          </label>
        </div>
      </ModalBase>

      <UnsavedChangesConfirmDialog
        isOpen={showCloseConfirm}
        onConfirm={() => {
          setShowCloseConfirm(false);
          setIsModalOpen(false);
          resetForm();
        }}
        onCancel={() => setShowCloseConfirm(false)}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDelete(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        title="Excluir local de descarte"
        description={`Tem certeza que deseja remover "${deleteTarget?.nome || ""}"?`}
      />
    </Card>
  );
}
