import React from "react";
import { Plus, Trash2, MapPin, AlertCircle, Loader2 } from "lucide-react";
import { cpfCnpjMask, phoneMask, cepMask } from "@/lib/masks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { Cliente, ClienteEndereco } from "@/core/domain/types";
import { ModalBase } from "@/components/ui/modal-base";

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  currentClient: Partial<Cliente>;
  setCurrentClient: (c: Partial<Cliente>) => void;
  enderecosForm: Partial<ClienteEndereco>[];
  addEnderecoField: () => void;
  removeEnderecoField: (index: number) => void;
  updateEnderecoField: (index: number, data: Partial<ClienteEndereco>) => void;
  handleCepLookup: (index: number, cep: string) => void;
  isCepLoading: boolean;
  onSave: () => void;
  formError?: string | null;
}

export function CustomerModal({
  isOpen,
  onClose,
  isEditing,
  currentClient,
  setCurrentClient,
  enderecosForm,
  addEnderecoField,
  removeEnderecoField,
  updateEnderecoField,
  handleCepLookup,
  isCepLoading,
  onSave,
  formError,
}: CustomerModalProps) {
  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={isEditing ? "Editar Cliente" : "Novo Cliente"}
      subtitle="Cadastre dados fiscais e endereços frequentes de obra."
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button type="button" onClick={onSave} className="w-full sm:w-auto">
            {isEditing ? "Salvar Alterações" : "Cadastrar Cliente"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-status-danger-bg p-3 text-xs sm:text-sm font-medium text-status-danger-ink"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{formError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="cli-nome" className="text-xs font-semibold text-foreground">
              Nome completo / Razão social *
            </label>
            <Input
              id="cli-nome"
              value={currentClient.nome || ""}
              onChange={(e) => setCurrentClient({ ...currentClient, nome: e.target.value })}
              placeholder="Ex: Construtora Alpha Ltda"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="cli-doc" className="text-xs font-semibold text-foreground">
              CPF ou CNPJ
            </label>
            <Input
              id="cli-doc"
              className="font-mono"
              value={currentClient.cpfCnpj || ""}
              onChange={(e) =>
                setCurrentClient({ ...currentClient, cpfCnpj: cpfCnpjMask(e.target.value) })
              }
              placeholder="000.000.000-00 ou 00.000.000/0001-00"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="cli-tel" className="text-xs font-semibold text-foreground">
              WhatsApp / Telefone *
            </label>
            <Input
              id="cli-tel"
              className="font-mono"
              value={currentClient.telefone || ""}
              onChange={(e) =>
                setCurrentClient({ ...currentClient, telefone: phoneMask(e.target.value) })
              }
              placeholder="(11) 99999-9999"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="cli-email" className="text-xs font-semibold text-foreground">
              E-mail
            </label>
            <Input
              id="cli-email"
              type="email"
              value={currentClient.email || ""}
              onChange={(e) => setCurrentClient({ ...currentClient, email: e.target.value })}
              placeholder="financeiro@empresa.com.br"
            />
          </div>
        </div>

        <hr className="border-border" />

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Endereços do Cliente
            </h4>
            <Button type="button" onClick={addEnderecoField} variant="outline" size="sm">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Adicionar Endereço
            </Button>
          </div>

          <div className="space-y-3">
            {(enderecosForm || []).map((end, index) => (
              <div
                key={end.id || index}
                className="p-4 rounded-xl border border-border bg-muted/30 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <Input
                    aria-label={`Identificação do endereço ${index + 1}`}
                    value={end.nome || ""}
                    onChange={(e) => updateEnderecoField(index, { nome: e.target.value })}
                    placeholder="Apelido do local (ex: Matriz, Obra Centro)"
                    className="flex-1"
                  />
                  {enderecosForm.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEnderecoField(index)}
                      aria-label={`Remover endereço ${index + 1}`}
                      className="text-status-danger-ink hover:bg-status-danger-bg shrink-0"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-3">
                    <AddressAutocomplete
                      value={end.rua || ""}
                      onChange={(val, lat, lng, address) => {
                        updateEnderecoField(index, {
                          rua: address?.road || val.split(",")[0] || val,
                          cidade: address?.city || address?.town || address?.suburb || end.cidade,
                          cep: address?.postcode || end.cep,
                          lat,
                          lng,
                        });
                      }}
                      placeholder="Logradouro / Rua..."
                    />
                  </div>
                  <Input
                    aria-label="Número"
                    value={end.numero || ""}
                    onChange={(e) => updateEnderecoField(index, { numero: e.target.value })}
                    placeholder="Nº"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    aria-label="Cidade"
                    value={end.cidade || ""}
                    onChange={(e) => updateEnderecoField(index, { cidade: e.target.value })}
                    placeholder="Cidade"
                  />
                  <div className="relative">
                    <Input
                      aria-label="CEP"
                      className="font-mono pr-10"
                      value={end.cep || ""}
                      onChange={(e) => updateEnderecoField(index, { cep: cepMask(e.target.value) })}
                      onBlur={(e) => handleCepLookup(index, e.target.value)}
                      placeholder="CEP (00000-000)"
                    />
                    {isCepLoading && (
                      <Loader2
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary"
                        aria-hidden="true"
                      />
                    )}
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
