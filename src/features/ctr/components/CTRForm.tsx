"use client";
import React, { useState } from "react";
import { CTRFormData, CTRConflito, LocalDescarte } from "@/core/domain/ctr-types";
import { UFEnum } from "@/core/domain/ctr-schemas";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConflitosAlert } from "./ConflitosAlert";
import { cepMask, phoneMask, cpfCnpjMask, fetchCEPData } from "@/lib/masks";
import { geocodeService } from "@/infrastructure/api/geocode-service";
import {
  Calendar,
  MapPin,
  User,
  Truck,
  Building2,
  Package,
  FileSignature,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface CTRFormProps {
  formData: CTRFormData;
  localDescarte: LocalDescarte | null;
  conflitos: CTRConflito[];
  onUpdateIdentificacao: (
    updates: Partial<Pick<CTRFormData, "data" | "horaSaida" | "tipoOperacao">>
  ) => void;
  onUpdateOrigem: (updates: Partial<CTRFormData["origem"]>) => void;
  onUpdateGerador: (updates: Partial<CTRFormData["gerador"]>) => void;
  onUpdateTransportador: (updates: Partial<CTRFormData["transportador"]>) => void;
  onUpdateDestinatario: (updates: Partial<CTRFormData["destinatario"]>) => void;
  onUpdateResiduo: (updates: Partial<CTRFormData["residuo"]>) => void;
  onUpdateDeclaracoes: (updates: Partial<CTRFormData["declaracoes"]>) => void;
}

const ufs = UFEnum.options;
const tiposOperacao = [
  { value: "coleta", label: "Coleta" },
  { value: "transporte", label: "Transporte" },
  { value: "transbordo", label: "Transbordo" },
  { value: "tratamento", label: "Tratamento" },
  { value: "destinacao_final", label: "Destinação Final" },
];

const classesResiduo = [
  { value: "A", label: "Classe A - Resíduos de construção civil (entulho, tijolo, concreto)" },
  { value: "B", label: "Classe B - Recicláveis (plástico, papel, metal, madeira)" },
  { value: "C", label: "Classe C - Sem tecnologia/viabilidade de reciclagem (gesso)" },
  { value: "D", label: "Classe D - Perigosos (tintas, solventes, óleos)" },
  { value: "E", label: "Classe E - Resíduos especiais" },
  { value: "F", label: "Classe D / Perigosos (tintas, solventes e contaminantes)" },
  { value: "Inerte", label: "Classe Inerte - Solo limpo / escavação" },
];

const unidadesResiduo = [
  { value: "m3", label: "m³ (Metros cúbicos)" },
  { value: "ton", label: "ton (Toneladas)" },
  { value: "kg", label: "kg (Quilogramas)" },
  { value: "unidade", label: "un (Unidades)" },
  { value: "litros", label: "L (Litros)" },
];

const tiposLocal = [
  { value: "aterro_sanitario", label: "Aterro Sanitário" },
  { value: "usina_reciclagem", label: "Usina de Reciclagem" },
  { value: "area_transbordo", label: "Área de Transbordo" },
  { value: "centro_tratamento", label: "Centro de Tratamento" },
  { value: "disposicao_final", label: "Disposição Final" },
  { value: "outro", label: "Outro" },
];

const selectClass =
  "flex min-h-[44px] w-full rounded-lg border border-input bg-card px-3.5 py-2 text-base md:text-sm font-medium text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function SectionShell({
  title,
  icon,
  filled,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  filled?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <CardHeader className="p-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="w-full flex items-center justify-between gap-2 px-4 py-3.5 sm:px-5 text-left hover:bg-muted/40 transition-colors rounded-t-xl"
        >
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            {icon}
            <span>{title}</span>
          </CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            {filled && <Badge variant="success">Preenchido</Badge>}
            {open ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            )}
          </div>
        </button>
      </CardHeader>
      {open && <CardContent className="p-4 sm:p-5 pt-2 border-t border-border/60">{children}</CardContent>}
    </Card>
  );
}

interface CEPInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (data: { logradouro: string; bairro: string; cidade: string; uf: string } | null) => void;
}

function CEPInput({ id, value, onChange, onComplete }: CEPInputProps) {
  const [loading, setLoading] = useState(false);

  const handleBlur = async () => {
    const cleanCEP = value.replace(/\D/g, "");
    if (cleanCEP.length === 8 && onComplete) {
      setLoading(true);
      const data = await fetchCEPData(value);
      onComplete(data);
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <Input
        id={id}
        className="font-mono pr-9"
        value={value}
        onChange={(e) => onChange(cepMask(e.target.value))}
        onBlur={handleBlur}
        placeholder="00000-000"
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
      )}
    </div>
  );
}

interface EnderecoInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onCepFound?: (cep: string) => void;
  ufValue?: string;
  cidadeValue?: string;
}

function EnderecoInput({
  id,
  value,
  onChange,
  onCepFound,
  ufValue,
  cidadeValue,
}: EnderecoInputProps) {
  const [loading, setLoading] = useState(false);

  const handleBlur = async () => {
    if (!value || value.length < 3 || !ufValue || !cidadeValue) return;
    setLoading(true);
    try {
      const result = await geocodeService.fetchCepByAddress(value, cidadeValue, ufValue);
      if (result?.cep && onCepFound) {
        onCepFound(cepMask(result.cep));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        placeholder="Rua, Avenida, Número..."
        className="pr-9"
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
      )}
    </div>
  );
}

export function CTRForm({
  formData,
  conflitos,
  onUpdateIdentificacao,
  onUpdateOrigem,
  onUpdateGerador,
  onUpdateTransportador,
  onUpdateDestinatario,
  onUpdateResiduo,
  onUpdateDeclaracoes,
}: CTRFormProps) {
  return (
    <div className="space-y-4">
      <ConflitosAlert conflitos={conflitos} />

      <SectionShell
        title="Identificação da Viagem"
        icon={<Calendar className="h-4 w-4 text-primary" aria-hidden="true" />}
        filled={Boolean(formData.data && formData.horaSaida)}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="space-y-1.5">
            <label htmlFor="ctr-num" className="text-xs font-semibold text-foreground">
              Número CTR
            </label>
            <Input
              id="ctr-num"
              value={formData.numero || ""}
              disabled
              placeholder="Automático"
              className="font-mono bg-muted/50"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="ctr-data" className="text-xs font-semibold text-foreground">
              Data *
            </label>
            <Input
              id="ctr-data"
              type="date"
              value={formData.data}
              onChange={(e) => onUpdateIdentificacao({ data: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="ctr-hora" className="text-xs font-semibold text-foreground">
              Hora Saída *
            </label>
            <Input
              id="ctr-hora"
              type="time"
              value={formData.horaSaida}
              onChange={(e) => onUpdateIdentificacao({ horaSaida: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="ctr-op" className="text-xs font-semibold text-foreground">
              Operação *
            </label>
            <select
              id="ctr-op"
              value={formData.tipoOperacao}
              onChange={(e) => onUpdateIdentificacao({ tipoOperacao: e.target.value as any })}
              className={selectClass}
            >
              {tiposOperacao.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </SectionShell>

      <SectionShell
        title="Origem do Resíduo (Obra)"
        icon={<MapPin className="h-4 w-4 text-primary" aria-hidden="true" />}
        filled={Boolean(formData.origem.endereco && formData.origem.cidade)}
      >
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="orig-cep" className="text-xs font-semibold text-foreground">
                CEP
              </label>
              <CEPInput
                id="orig-cep"
                value={formData.origem.cep || ""}
                onChange={(cep) => onUpdateOrigem({ cep })}
                onComplete={(data) => {
                  if (data) {
                    onUpdateOrigem({
                      endereco: data.logradouro || formData.origem.endereco,
                      cidade: data.cidade || formData.origem.cidade,
                      uf: (data.uf as any) || formData.origem.uf,
                    });
                  }
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="orig-resp" className="text-xs font-semibold text-foreground">
                Responsável na Obra
              </label>
              <Input
                id="orig-resp"
                value={formData.origem.responsavel}
                onChange={(e) => onUpdateOrigem({ responsavel: e.target.value })}
                placeholder="Nome do responsável"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="orig-end" className="text-xs font-semibold text-foreground">
              Endereço completo *
            </label>
            <EnderecoInput
              id="orig-end"
              value={formData.origem.endereco}
              onChange={(endereco) => onUpdateOrigem({ endereco })}
              onCepFound={(cep) => onUpdateOrigem({ cep })}
              ufValue={formData.origem.uf}
              cidadeValue={formData.origem.cidade}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="orig-cid" className="text-xs font-semibold text-foreground">
                Cidade *
              </label>
              <Input
                id="orig-cid"
                value={formData.origem.cidade}
                onChange={(e) => onUpdateOrigem({ cidade: e.target.value })}
                placeholder="Cidade"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="orig-uf" className="text-xs font-semibold text-foreground">
                UF *
              </label>
              <select
                id="orig-uf"
                value={formData.origem.uf}
                onChange={(e) => onUpdateOrigem({ uf: e.target.value as any })}
                className={selectClass}
              >
                {ufs.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="orig-tel" className="text-xs font-semibold text-foreground">
                Telefone
              </label>
              <Input
                id="orig-tel"
                className="font-mono"
                value={formData.origem.telefone}
                onChange={(e) => onUpdateOrigem({ telefone: phoneMask(e.target.value) })}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>
        </div>
      </SectionShell>

      <SectionShell
        title="Dados do Gerador (Cliente)"
        icon={<User className="h-4 w-4 text-primary" aria-hidden="true" />}
        filled={Boolean(formData.gerador.nome && formData.gerador.cpfCnpj)}
      >
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="ger-nome" className="text-xs font-semibold text-foreground">
                Nome / Razão Social *
              </label>
              <Input
                id="ger-nome"
                value={formData.gerador.nome}
                onChange={(e) => onUpdateGerador({ nome: e.target.value })}
                placeholder="Nome do gerador"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="ger-doc" className="text-xs font-semibold text-foreground">
                CPF / CNPJ *
              </label>
              <Input
                id="ger-doc"
                className="font-mono"
                value={formData.gerador.cpfCnpj}
                onChange={(e) => onUpdateGerador({ cpfCnpj: cpfCnpjMask(e.target.value) })}
                placeholder="000.000.000-00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="ger-cep" className="text-xs font-semibold text-foreground">
                CEP
              </label>
              <CEPInput
                id="ger-cep"
                value={formData.gerador.cep || ""}
                onChange={(cep) => onUpdateGerador({ cep })}
                onComplete={(data) => {
                  if (data) {
                    onUpdateGerador({
                      endereco: data.logradouro || formData.gerador.endereco,
                      cidade: data.cidade || formData.gerador.cidade,
                      uf: (data.uf as any) || formData.gerador.uf,
                    });
                  }
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="ger-resp" className="text-xs font-semibold text-foreground">
                Responsável
              </label>
              <Input
                id="ger-resp"
                value={formData.gerador.responsavel}
                onChange={(e) => onUpdateGerador({ responsavel: e.target.value })}
                placeholder="Nome do responsável"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="ger-end" className="text-xs font-semibold text-foreground">
              Endereço do gerador
            </label>
            <EnderecoInput
              id="ger-end"
              value={formData.gerador.endereco || ""}
              onChange={(endereco) => onUpdateGerador({ endereco })}
              onCepFound={(cep) => onUpdateGerador({ cep })}
              ufValue={formData.gerador.uf}
              cidadeValue={formData.gerador.cidade}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="ger-cid" className="text-xs font-semibold text-foreground">
                Cidade
              </label>
              <Input
                id="ger-cid"
                value={formData.gerador.cidade}
                onChange={(e) => onUpdateGerador({ cidade: e.target.value })}
                placeholder="Cidade"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="ger-uf" className="text-xs font-semibold text-foreground">
                UF
              </label>
              <select
                id="ger-uf"
                value={formData.gerador.uf || formData.origem.uf || "SP"}
                onChange={(e) => onUpdateGerador({ uf: e.target.value as any })}
                className={selectClass}
              >
                {ufs.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="ger-tel" className="text-xs font-semibold text-foreground">
                Telefone
              </label>
              <Input
                id="ger-tel"
                className="font-mono"
                value={formData.gerador.telefone}
                onChange={(e) => onUpdateGerador({ telefone: phoneMask(e.target.value) })}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>
        </div>
      </SectionShell>

      <SectionShell
        title="Transportador (Sua Empresa)"
        icon={<Truck className="h-4 w-4 text-primary" aria-hidden="true" />}
        filled={Boolean(formData.transportador.nome && formData.transportador.cpfCnpj)}
        defaultOpen={false}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="space-y-1.5">
            <label htmlFor="tr-nome" className="text-xs font-semibold text-foreground">
              Empresa *
            </label>
            <Input
              id="tr-nome"
              value={formData.transportador.nome}
              onChange={(e) => onUpdateTransportador({ nome: e.target.value })}
              placeholder="Razão Social"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="tr-doc" className="text-xs font-semibold text-foreground">
              CNPJ / CPF *
            </label>
            <Input
              id="tr-doc"
              className="font-mono"
              value={formData.transportador.cpfCnpj}
              onChange={(e) => onUpdateTransportador({ cpfCnpj: cpfCnpjMask(e.target.value) })}
              placeholder="00.000.000/0000-00"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="tr-ie" className="text-xs font-semibold text-foreground">
              Inscrição Municipal / Estadual
            </label>
            <Input
              id="tr-ie"
              value={formData.transportador.inscricao || ""}
              onChange={(e) => onUpdateTransportador({ inscricao: e.target.value })}
              placeholder="Opcional"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="tr-tel" className="text-xs font-semibold text-foreground">
              Telefone
            </label>
            <Input
              id="tr-tel"
              className="font-mono"
              value={formData.transportador.telefone}
              onChange={(e) => onUpdateTransportador({ telefone: phoneMask(e.target.value) })}
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>
      </SectionShell>

      <SectionShell
        title="Destinatário (Local de Descarte)"
        icon={<Building2 className="h-4 w-4 text-primary" aria-hidden="true" />}
        filled={Boolean(formData.destinatario.nome && formData.destinatario.cidade)}
        defaultOpen={false}
      >
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="dest-nome" className="text-xs font-semibold text-foreground">
                Nome / Razão Social *
              </label>
              <Input
                id="dest-nome"
                value={formData.destinatario.nome}
                onChange={(e) => onUpdateDestinatario({ nome: e.target.value })}
                placeholder="Nome do local"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="dest-doc" className="text-xs font-semibold text-foreground">
                CNPJ / CPF
              </label>
              <Input
                id="dest-doc"
                className="font-mono"
                value={formData.destinatario.cpfCnpj || ""}
                onChange={(e) => onUpdateDestinatario({ cpfCnpj: cpfCnpjMask(e.target.value) })}
                placeholder="00.000.000/0000-00"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="dest-end" className="text-xs font-semibold text-foreground">
              Endereço *
            </label>
            <Input
              id="dest-end"
              value={formData.destinatario.endereco}
              onChange={(e) => onUpdateDestinatario({ endereco: e.target.value })}
              placeholder="Endereço do aterro"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="dest-cid" className="text-xs font-semibold text-foreground">
                Cidade *
              </label>
              <Input
                id="dest-cid"
                value={formData.destinatario.cidade}
                onChange={(e) => onUpdateDestinatario({ cidade: e.target.value })}
                placeholder="Cidade"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="dest-uf" className="text-xs font-semibold text-foreground">
                UF *
              </label>
              <select
                id="dest-uf"
                value={formData.destinatario.uf}
                onChange={(e) => onUpdateDestinatario({ uf: e.target.value as any })}
                className={selectClass}
              >
                {ufs.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="dest-tipo" className="text-xs font-semibold text-foreground">
                Tipo do local
              </label>
              <select
                id="dest-tipo"
                value={formData.destinatario.tipoLocal || ""}
                onChange={(e) => onUpdateDestinatario({ tipoLocal: e.target.value as any })}
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
        </div>
      </SectionShell>

      <SectionShell
        title="Descrição do Resíduo"
        icon={<Package className="h-4 w-4 text-primary" aria-hidden="true" />}
        filled={Boolean(formData.residuo.descricao && formData.residuo.quantidade > 0)}
      >
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="res-classe" className="text-xs font-semibold text-foreground">
                Classe CONAMA
              </label>
              <select
                id="res-classe"
                value={formData.residuo.classe || ""}
                onChange={(e) => onUpdateResiduo({ classe: e.target.value as any })}
                className={selectClass}
              >
                <option value="">Selecione...</option>
                {classesResiduo.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="res-acond" className="text-xs font-semibold text-foreground">
                Acondicionamento
              </label>
              <Input
                id="res-acond"
                value={formData.residuo.acondicionamento}
                onChange={(e) => onUpdateResiduo({ acondicionamento: e.target.value })}
                placeholder="Ex: Caçamba estacionária 5m³"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="res-desc" className="text-xs font-semibold text-foreground">
              Descrição do resíduo *
            </label>
            <Input
              id="res-desc"
              value={formData.residuo.descricao}
              onChange={(e) => onUpdateResiduo({ descricao: e.target.value })}
              placeholder="Ex: Resíduos de construção civil e demolição"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="res-qtd" className="text-xs font-semibold text-foreground">
                Quantidade *
              </label>
              <Input
                id="res-qtd"
                type="number"
                step="0.01"
                min={0.01}
                className="font-mono"
                value={formData.residuo.quantidade}
                onChange={(e) =>
                  onUpdateResiduo({ quantidade: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="res-un" className="text-xs font-semibold text-foreground">
                Unidade *
              </label>
              <select
                id="res-un"
                value={formData.residuo.unidade}
                onChange={(e) => onUpdateResiduo({ unidade: e.target.value as any })}
                className={selectClass}
              >
                {unidadesResiduo.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </SectionShell>

      <SectionShell
        title="Assinaturas & Declaração"
        icon={<FileSignature className="h-4 w-4 text-primary" aria-hidden="true" />}
        defaultOpen={false}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="space-y-1.5">
            <label htmlFor="dec-tr" className="text-xs font-semibold text-foreground">
              Responsável do Transportador
            </label>
            <Input
              id="dec-tr"
              value={formData.declaracoes.transportador.nome}
              onChange={(e) =>
                onUpdateDeclaracoes({
                  transportador: {
                    ...formData.declaracoes.transportador,
                    nome: e.target.value,
                  },
                })
              }
              placeholder="Nome do motorista / empresa"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="dec-rec" className="text-xs font-semibold text-foreground">
              Recebedor no Destino (Opcional)
            </label>
            <Input
              id="dec-rec"
              value={formData.declaracoes.recebedor.nome}
              onChange={(e) =>
                onUpdateDeclaracoes({
                  recebedor: { ...formData.declaracoes.recebedor, nome: e.target.value },
                })
              }
              placeholder="Nome do conferente no aterro"
            />
          </div>
        </div>
      </SectionShell>
    </div>
  );
}
