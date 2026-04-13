"use client";
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CTRFormData, CTRConflito, LocalDescarte } from '@/core/domain/ctr-types';
import { cpfCnpjMask, phoneMask, cepMask } from '@/lib/masks';
import { UFEnum, TipoOperacaoEnum, ResiduoClasseEnum, ResiduoUnidadeEnum, TipoLocalDescarteEnum } from '@/core/domain/ctr-schemas';
import { AlertTriangle, Check, User, Truck, MapPin, FileText, Package } from 'lucide-react';

interface CTRFormProps {
  formData: CTRFormData;
  localDescarte: LocalDescarte | null;
  conflitos: CTRConflito[];
  onUpdateIdentificacao: (updates: Partial<Pick<CTRFormData, 'data' | 'horaSaida' | 'tipoOperacao'>>) => void;
  onUpdateOrigem: (updates: Partial<CTRFormData['origem']>) => void;
  onUpdateGerador: (updates: Partial<CTRFormData['gerador']>) => void;
  onUpdateTransportador: (updates: Partial<CTRFormData['transportador']>) => void;
  onUpdateDestinatario: (updates: Partial<CTRFormData['destinatario']>) => void;
  onUpdateResiduo: (updates: Partial<CTRFormData['residuo']>) => void;
  onUpdateDeclaracoes: (updates: Partial<CTRFormData['declaracoes']>) => void;
}

const ufs = UFEnum.options;
const tiposOperacao = [
  { value: 'coleta', label: 'Coleta' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'transbordo', label: 'Transbordo' },
  { value: 'tratamento', label: 'Tratamento' },
  { value: 'destinacao_final', label: 'Destinação Final' },
];
const classesResiduo = [
  { value: 'A', label: 'Classe A - Resíduos de construção civil' },
  { value: 'B', label: 'Classe B - Resíduos perigosos de outras fontes' },
  { value: 'C', label: 'Classe C - Resíduos que não podem ser reciclados' },
  { value: 'D', label: 'Classe D - Resíduos perigosos ( NCI )' },
  { value: 'E', label: 'Classe E - Resíduos radioativos' },
  { value: 'F', label: 'Classe F - Resíduos perigosos ( Ambientes服务业 )' },
  { value: 'Inerte', label: 'Classe Inerte - Resíduos que não se degradam' },
];
const unidades = [
  { value: 'm3', label: 'm³' },
  { value: 'kg', label: 'kg' },
  { value: 'ton', label: 'ton' },
  { value: 'unidade', label: 'unidade' },
  { value: 'litros', label: 'litros' },
];
const tiposLocal = [
  { value: 'aterro_sanitario', label: 'Aterro Sanitário' },
  { value: 'usina_reciclagem', label: 'Usina de Reciclagem' },
  { value: 'area_transbordo', label: 'Área de Transbordo' },
  { value: 'centro_tratamento', label: 'Centro de Tratamento' },
  { value: 'disposicao_final', label: 'Disposição Final' },
  { value: 'outro', label: 'Outro' },
];

function FormSection({ 
  title, 
  icon: Icon, 
  children, 
  className = '' 
}: { 
  title: string; 
  icon: React.ElementType; 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <Card className={`bg-card border-border ${className}`}>
      <CardHeader className="px-6 py-4 border-b border-border bg-muted/20">
        <CardTitle className="text-sm font-black italic uppercase tracking-wider flex items-center gap-2">
          <Icon size={16} className="text-accent" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}

export function CTRForm({
  formData,
  localDescarte,
  conflitos,
  onUpdateIdentificacao,
  onUpdateOrigem,
  onUpdateGerador,
  onUpdateTransportador,
  onUpdateDestinatario,
  onUpdateResiduo,
  onUpdateDeclaracoes,
}: CTRFormProps) {
  const hasBloqueio = conflitos.some(c => c.tipo === 'bloqueio');
  const hasAviso = conflitos.some(c => c.tipo === 'aviso');

  return (
    <div className="space-y-6">
      {hasBloqueio && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
          <AlertTriangle className="text-red-500 shrink-0" size={20} />
          <div>
            <p className="font-bold text-red-500 text-sm">Conflito Bloqueante</p>
            <p className="text-xs text-red-400/80">{conflitos.find(c => c.tipo === 'bloqueio')?.mensagem}</p>
          </div>
        </div>
      )}

      {hasAviso && !hasBloqueio && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
          <AlertTriangle className="text-amber-500 shrink-0" size={20} />
          <div>
            <p className="font-bold text-amber-500 text-sm">Atenção</p>
            <p className="text-xs text-amber-400/80">{conflitos.find(c => c.tipo === 'aviso')?.mensagem}</p>
          </div>
        </div>
      )}

      <FormSection title="Identificação do CTR" icon={FileText}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Número CTR
            </label>
            <Input 
              value={formData.numero || ''} 
              disabled 
              className="h-10 rounded-xl bg-muted font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Data *
            </label>
            <Input 
              type="date"
              value={formData.data}
              onChange={e => onUpdateIdentificacao({ data: e.target.value })}
              className="h-10 rounded-xl font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Hora Saída *
            </label>
            <Input 
              type="time"
              value={formData.horaSaida}
              onChange={e => onUpdateIdentificacao({ horaSaida: e.target.value })}
              className="h-10 rounded-xl font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Tipo Operação *
            </label>
            <select 
              value={formData.tipoOperacao}
              onChange={e => onUpdateIdentificacao({ tipoOperacao: e.target.value as any })}
              className="w-full h-10 px-4 rounded-xl border border-input bg-background text-sm font-bold"
            >
              {tiposOperacao.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
      </FormSection>

      <FormSection title="1. Origem do Resíduo" icon={MapPin}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Endereço de Origem *
            </label>
            <Input 
              value={formData.origem.endereco}
              onChange={e => onUpdateOrigem({ endereco: e.target.value })}
              placeholder="Rua, número - Cidade - UF"
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Bairro
            </label>
            <Input 
              value={formData.origem.bairro}
              onChange={e => onUpdateOrigem({ bairro: e.target.value })}
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Cidade *
            </label>
            <Input 
              value={formData.origem.cidade}
              onChange={e => onUpdateOrigem({ cidade: e.target.value })}
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              UF *
            </label>
            <select 
              value={formData.origem.uf}
              onChange={e => onUpdateOrigem({ uf: e.target.value as any })}
              className="w-full h-10 px-4 rounded-xl border border-input bg-background text-sm font-bold"
            >
              {ufs.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Responsável
            </label>
            <Input 
              value={formData.origem.responsavel}
              onChange={e => onUpdateOrigem({ responsavel: e.target.value })}
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Telefone
            </label>
            <Input 
              value={formData.origem.telefone}
              onChange={e => onUpdateOrigem({ telefone: phoneMask(e.target.value) })}
              placeholder="(00) 00000-0000"
              className="h-10 rounded-xl"
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="2. Dados do Gerador" icon={User}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Nome/Razão Social *
            </label>
            <Input 
              value={formData.gerador.nome}
              onChange={e => onUpdateGerador({ nome: e.target.value })}
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              CPF/CNPJ *
            </label>
            <Input 
              value={formData.gerador.cpfCnpj}
              onChange={e => onUpdateGerador({ cpfCnpj: cpfCnpjMask(e.target.value) })}
              placeholder="000.000.000-00 ou 00.000.000/0001-00"
              className="h-10 rounded-xl font-mono"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Endereço
            </label>
            <Input 
              value={formData.gerador.endereco}
              onChange={e => onUpdateGerador({ endereco: e.target.value })}
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Cidade
            </label>
            <Input 
              value={formData.gerador.cidade}
              onChange={e => onUpdateGerador({ cidade: e.target.value })}
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              UF
            </label>
            <select 
              value={formData.gerador.uf || 'SP'}
              onChange={e => onUpdateGerador({ uf: e.target.value as any })}
              className="w-full h-10 px-4 rounded-xl border border-input bg-background text-sm font-bold"
            >
              {ufs.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Responsável
            </label>
            <Input 
              value={formData.gerador.responsavel}
              onChange={e => onUpdateGerador({ responsavel: e.target.value })}
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Telefone
            </label>
            <Input 
              value={formData.gerador.telefone}
              onChange={e => onUpdateGerador({ telefone: phoneMask(e.target.value) })}
              className="h-10 rounded-xl"
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="3. Dados do Transportador" icon={Truck}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Empresa *
            </label>
            <Input 
              value={formData.transportador.nome}
              onChange={e => onUpdateTransportador({ nome: e.target.value })}
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              CNPJ/CPF *
            </label>
            <Input 
              value={formData.transportador.cpfCnpj}
              onChange={e => onUpdateTransportador({ cpfCnpj: cpfCnpjMask(e.target.value) })}
              className="h-10 rounded-xl font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Inscrição Estadual
            </label>
            <Input 
              value={formData.transportador.inscricao || ''}
              onChange={e => onUpdateTransportador({ inscricao: e.target.value })}
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Telefone
            </label>
            <Input 
              value={formData.transportador.telefone}
              onChange={e => onUpdateTransportador({ telefone: phoneMask(e.target.value) })}
              className="h-10 rounded-xl"
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="4. Dados do Destinatário (Local de Descarte)" icon={MapPin}>
        {localDescarte && (
          <div className="p-3 bg-accent/5 rounded-xl border border-accent/10 mb-4">
            <p className="text-xs font-bold text-accent">Local Selecionado:</p>
            <p className="text-sm font-bold">{localDescarte.nome}</p>
            <p className="text-xs text-muted-foreground">
              {localDescarte.rua}, {localDescarte.cidade} - {localDescarte.uf}
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Nome/Razão Social *
            </label>
            <Input 
              value={formData.destinatario.nome}
              onChange={e => onUpdateDestinatario({ nome: e.target.value })}
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              CNPJ
            </label>
            <Input 
              value={formData.destinatario.cpfCnpj || ''}
              onChange={e => onUpdateDestinatario({ cpfCnpj: cpfCnpjMask(e.target.value) })}
              className="h-10 rounded-xl font-mono"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Endereço *
            </label>
            <Input 
              value={formData.destinatario.endereco}
              onChange={e => onUpdateDestinatario({ endereco: e.target.value })}
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Cidade *
            </label>
            <Input 
              value={formData.destinatario.cidade}
              onChange={e => onUpdateDestinatario({ cidade: e.target.value })}
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              UF *
            </label>
            <select 
              value={formData.destinatario.uf}
              onChange={e => onUpdateDestinatario({ uf: e.target.value as any })}
              className="w-full h-10 px-4 rounded-xl border border-input bg-background text-sm font-bold"
            >
              {ufs.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Tipo do Local
            </label>
            <select 
              value={formData.destinatario.tipoLocal || ''}
              onChange={e => onUpdateDestinatario({ tipoLocal: e.target.value as any })}
              className="w-full h-10 px-4 rounded-xl border border-input bg-background text-sm font-bold"
            >
              <option value="">Selecione...</option>
              {tiposLocal.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Licença/Cadastro
            </label>
            <Input 
              value={formData.destinatario.licenca || ''}
              onChange={e => onUpdateDestinatario({ licenca: e.target.value })}
              className="h-10 rounded-xl"
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="5. Descrição do Resíduo" icon={Package}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Classe/Tipo
            </label>
            <select 
              value={formData.residuo.classe || ''}
              onChange={e => onUpdateResiduo({ classe: e.target.value as any })}
              className="w-full h-10 px-4 rounded-xl border border-input bg-background text-sm font-bold"
            >
              <option value="">Selecione...</option>
              {classesResiduo.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Acondicionamento
            </label>
            <Input 
              value={formData.residuo.acondicionamento}
              onChange={e => onUpdateResiduo({ acondicionamento: e.target.value })}
              placeholder="Caçamba, Big Bag, etc."
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Descrição do Resíduo *
            </label>
            <Input 
              value={formData.residuo.descricao}
              onChange={e => onUpdateResiduo({ descricao: e.target.value })}
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Quantidade *
            </label>
            <Input 
              type="number"
              min="0.001"
              step="0.001"
              value={formData.residuo.quantidade}
              onChange={e => onUpdateResiduo({ quantidade: parseFloat(e.target.value) || 0 })}
              className="h-10 rounded-xl font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Unidade *
            </label>
            <select 
              value={formData.residuo.unidade}
              onChange={e => onUpdateResiduo({ unidade: e.target.value as any })}
              className="w-full h-10 px-4 rounded-xl border border-input bg-background text-sm font-bold"
            >
              {unidades.map(u => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </div>
        </div>
      </FormSection>

      <FormSection title="6. Declarações e Assinaturas" icon={FileText}>
        <p className="text-xs text-muted-foreground mb-4">
          Declaro que as informações acima são verídicas e que o transporte dos resíduos será realizado de acordo com as normas ambientais vigentes.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Responsável - Transportador
            </label>
            <Input 
              value={formData.declaracoes.transportador.nome}
              onChange={e => onUpdateDeclaracoes({ 
                transportador: { ...formData.declaracoes.transportador, nome: e.target.value } 
              })}
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Responsável - Recebedor
            </label>
            <Input 
              value={formData.declaracoes.recebedor.nome}
              onChange={e => onUpdateDeclaracoes({ 
                recebedor: { ...formData.declaracoes.recebedor, nome: e.target.value } 
              })}
              className="h-10 rounded-xl"
            />
          </div>
        </div>
      </FormSection>
    </div>
  );
}
