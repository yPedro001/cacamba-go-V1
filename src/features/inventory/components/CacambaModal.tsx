import React, { useEffect, useState } from "react";
import { AlertCircle, Loader2, MapPin } from "lucide-react";
import { cepMask } from "@/lib/masks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { Cacamba, Perfil } from "@/core/domain/types";
import { ModalBase } from "@/components/ui/modal-base";

interface CacambaModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  currentCacamba: Partial<Cacamba>;
  setCurrentCacamba: (v: Partial<Cacamba>) => void;
  batchQuantity: number;
  setBatchQuantity: (v: number) => void;
  isCepLoading: boolean;
  handleCepLookup: (cep: string) => void;
  onSave: () => void;
  alertMessage?: string;
  perfil: Perfil;
}

const selectBase =
  "flex min-h-[44px] w-full rounded-lg border border-input bg-card px-3.5 py-2 text-base md:text-sm font-medium text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function CacambaModal({
  isOpen,
  onClose,
  isEditing,
  currentCacamba,
  setCurrentCacamba,
  batchQuantity,
  setBatchQuantity,
  isCepLoading,
  handleCepLookup,
  onSave,
  alertMessage,
  perfil,
}: CacambaModalProps) {
  const [cepSearch, setCepSearch] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setCepSearch("");
    }
  }, [isOpen]);

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={isEditing ? "Editar Caçamba" : "Nova Caçamba"}
      subtitle="Defina código, capacidade cúbica e ponto de localização."
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button type="button" onClick={onSave} className="w-full sm:w-auto">
            {isEditing ? "Salvar Alterações" : "Cadastrar Caçamba"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {alertMessage && (
          <div
            role="alert"
            className="flex gap-2 items-start p-3 rounded-xl bg-status-danger-bg text-status-danger-ink border border-destructive/30 text-xs sm:text-sm font-medium"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{alertMessage}</span>
          </div>
        )}

        {!isEditing && perfil.endereco && (
          <div className="p-3 rounded-xl bg-status-info-bg text-status-info-ink border border-blue-500/20 text-xs font-medium flex gap-2 items-center">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">Pátio padrão: {perfil.endereco}</span>
          </div>
        )}

        <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="cab-codigo" className="text-xs font-semibold text-foreground">
              Código identificador *
            </label>
            <Input
              id="cab-codigo"
              className="font-mono font-bold"
              value={currentCacamba.codigo || ""}
              onChange={(e) => setCurrentCacamba({ ...currentCacamba, codigo: e.target.value })}
              placeholder="C-001"
            />
          </div>
          {!isEditing && (
            <div className="space-y-1.5">
              <label htmlFor="cab-lote" className="text-xs font-semibold text-foreground">
                Quantidade no lote
              </label>
              <Input
                id="cab-lote"
                type="number"
                min={1}
                max={50}
                value={batchQuantity}
                onChange={(e) => setBatchQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="cab-tamanho" className="text-xs font-semibold text-foreground">
              Capacidade
            </label>
            <select
              id="cab-tamanho"
              className={selectBase}
              value={currentCacamba.tamanho || "5m"}
              onChange={(e) => setCurrentCacamba({ ...currentCacamba, tamanho: e.target.value })}
            >
              <option value="3m">3m³</option>
              <option value="4m">4m³</option>
              <option value="5m">5m³</option>
              <option value="7m">7m³</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="cab-status" className="text-xs font-semibold text-foreground">
              Status inicial
            </label>
            <select
              id="cab-status"
              className={selectBase}
              value={currentCacamba.status || "disponivel"}
              onChange={(e) =>
                setCurrentCacamba({ ...currentCacamba, status: e.target.value as Cacamba["status"] })
              }
            >
              <option value="disponivel">Disponível</option>
              <option value="entrega_pendente">Entrega Pendente</option>
              <option value="locada">Locada / Em Uso</option>
              <option value="vencida">Vencida</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="cab-cep" className="text-xs font-semibold text-foreground">
            Buscar endereço por CEP (opcional)
          </label>
          <div className="relative">
            <Input
              id="cab-cep"
              className="font-mono pr-10"
              placeholder="00000-000"
              value={cepSearch}
              onChange={(e) => {
                const v = cepMask(e.target.value);
                setCepSearch(v);
                if (v.replace(/\D/g, "").length === 8) handleCepLookup(v);
              }}
            />
            {isCepLoading && (
              <Loader2
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary"
                aria-hidden="true"
              />
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="cab-endereco" className="text-xs font-semibold text-foreground">
            Localização atual
          </label>
          <AddressAutocomplete
            id="cab-endereco"
            value={currentCacamba.enderecoAtual || ""}
            onChange={(val, lat, lng) =>
              setCurrentCacamba({
                ...currentCacamba,
                enderecoAtual: val,
                lat: lat ?? currentCacamba.lat,
                lng: lng ?? currentCacamba.lng,
              })
            }
            placeholder="Digite o endereço do pátio ou obra..."
          />
        </div>
      </div>
    </ModalBase>
  );
}
