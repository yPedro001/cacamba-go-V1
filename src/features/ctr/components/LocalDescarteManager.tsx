"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModalBase } from '@/components/ui/modal-base';
import { LocalDescarte } from '@/core/domain/ctr-types';
import { cpfCnpjMask, phoneMask, cepMask } from '@/lib/masks';
import { UFEnum, TipoLocalDescarteEnum } from '@/core/domain/ctr-schemas';
import { Plus, Trash2, Edit, Star, MapPin, Building2, Phone, FileText } from 'lucide-react';

interface LocalDescarteManagerProps {
  locais: LocalDescarte[];
  onAdd: (local: Omit<LocalDescarte, 'id' | 'createdAt' | 'usuarioId'>) => void;
  onUpdate: (id: string, updates: Partial<LocalDescarte>) => void;
  onDelete: (id: string) => void;
  onSetPadrao: (id: string) => void;
}

const ufs = UFEnum.options;
const tiposLocal = [
  { value: 'aterro_sanitario', label: 'Aterro Sanitário' },
  { value: 'usina_reciclagem', label: 'Usina de Reciclagem' },
  { value: 'area_transbordo', label: 'Área de Transbordo' },
  { value: 'centro_tratamento', label: 'Centro de Tratamento' },
  { value: 'disposicao_final', label: 'Disposição Final' },
  { value: 'outro', label: 'Outro' },
];

interface LocalFormData {
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

const emptyForm: LocalFormData = {
  nome: '',
  cnpj: '',
  telefone: '',
  rua: '',
  numero: '',
  bairro: '',
  cidade: '',
  uf: 'SP',
  cep: '',
  tipoLocal: '',
  licenca: '',
  observacoes: '',
  isPadrao: false,
};

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

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (local: LocalDescarte) => {
    setEditingId(local.id);
    setForm({
      nome: local.nome,
      cnpj: local.cnpj || '',
      telefone: local.telefone || '',
      rua: local.rua,
      numero: local.numero || '',
      bairro: local.bairro || '',
      cidade: local.cidade,
      uf: local.uf,
      cep: local.cep || '',
      tipoLocal: local.tipoLocal || '',
      licenca: local.licenca || '',
      observacoes: local.observacoes || '',
      isPadrao: local.isPadrao,
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingId) {
      onUpdate(editingId, {
        nome: form.nome,
        cnpj: form.cnpj || undefined,
        telefone: form.telefone || undefined,
        rua: form.rua,
        numero: form.numero || undefined,
        bairro: form.bairro || undefined,
        cidade: form.cidade,
        uf: form.uf as any,
        cep: form.cep || undefined,
        tipoLocal: form.tipoLocal as any || undefined,
        licenca: form.licenca || undefined,
        observacoes: form.observacoes || undefined,
        isPadrao: form.isPadrao,
      });
    } else {
      onAdd({
        nome: form.nome,
        cnpj: form.cnpj || undefined,
        telefone: form.telefone || undefined,
        rua: form.rua,
        numero: form.numero || '',
        bairro: form.bairro || '',
        cidade: form.cidade,
        uf: form.uf as any,
        cep: form.cep || undefined,
        tipoLocal: form.tipoLocal as any || undefined,
        licenca: form.licenca || undefined,
        observacoes: form.observacoes || undefined,
        isPadrao: form.isPadrao,
      });
    }
    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este local de descarte?')) {
      onDelete(id);
    }
  };

  const localPadrao = locais.find(l => l.isPadrao);

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader className="px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-black italic uppercase tracking-wider flex items-center gap-2">
              <MapPin size={16} className="text-accent" />
              Locais de Descarte
            </CardTitle>
            <Button
              onClick={openAddModal}
              size="sm"
              className="h-9 bg-accent hover:bg-accent-dark font-bold text-xs uppercase tracking-wider"
            >
              <Plus size={14} className="mr-1" />
              Novo Local
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {locais.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold">Nenhum local de descarte cadastrado</p>
              <p className="text-sm mt-1">Cadastre um local para emitir CTRs</p>
            </div>
          ) : (
            <div className="space-y-3">
              {localPadrao && (
                <div className="p-3 bg-accent/5 rounded-xl border border-accent/20 mb-4">
                  <p className="text-xs font-bold text-accent flex items-center gap-1">
                    <Star size={12} />
                    Local Padrão: {localPadrao.nome}
                  </p>
                </div>
              )}
              {locais.map(local => (
                <div
                  key={local.id}
                  className={`p-4 rounded-xl border transition-all ${
                    local.isPadrao 
                      ? 'bg-accent/5 border-accent/30' 
                      : 'bg-background border-border hover:border-accent/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold truncate">{local.nome}</h4>
                        {local.isPadrao && (
                          <Star size={14} className="text-accent fill-accent shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {local.rua}{local.numero ? ', ' + local.numero : ''} - {local.cidade}/{local.uf}
                      </p>
                      {local.cnpj && (
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                          CNPJ: {local.cnpj}
                        </p>
                      )}
                      {local.tipoLocal && (
                        <p className="text-xs text-accent mt-1">
                          {tiposLocal.find(t => t.value === local.tipoLocal)?.label || local.tipoLocal}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {!local.isPadrao && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSetPadrao(local.id)}
                          className="h-8 px-2"
                          title="Definir como padrão"
                        >
                          <Star size={14} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(local)}
                        className="h-8 px-2"
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(local.id)}
                        className="h-8 px-2 text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ModalBase
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title={editingId ? 'Editar Local de Descarte' : 'Novo Local de Descarte'}
        maxWidth="lg"
        footer={
          <div className="flex gap-3 w-full justify-end">
            <Button
              variant="ghost"
              onClick={() => { setIsModalOpen(false); resetForm(); }}
              className="h-11 px-6 rounded-xl font-bold"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="h-11 px-6 rounded-xl font-bold bg-accent hover:bg-accent-dark"
              disabled={!form.nome || !form.rua || !form.cidade}
            >
              {editingId ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Nome / Razão Social *
              </label>
              <Input
                value={form.nome}
                onChange={e => setForm({ ...form, nome: e.target.value })}
                placeholder="Nome do local de descarte"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                CNPJ
              </label>
              <Input
                value={form.cnpj}
                onChange={e => setForm({ ...form, cnpj: cpfCnpjMask(e.target.value) })}
                placeholder="00.000.000/0001-00"
                className="h-11 rounded-xl font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Telefone
              </label>
              <Input
                value={form.telefone}
                onChange={e => setForm({ ...form, telefone: phoneMask(e.target.value) })}
                placeholder="(00) 00000-0000"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Rua / Endereço *
              </label>
              <Input
                value={form.rua}
                onChange={e => setForm({ ...form, rua: e.target.value })}
                placeholder="Rua, avenida..."
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Número
              </label>
              <Input
                value={form.numero}
                onChange={e => setForm({ ...form, numero: e.target.value })}
                placeholder="S/N"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Bairro
              </label>
              <Input
                value={form.bairro}
                onChange={e => setForm({ ...form, bairro: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Cidade *
              </label>
              <Input
                value={form.cidade}
                onChange={e => setForm({ ...form, cidade: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                UF *
              </label>
              <select
                value={form.uf}
                onChange={e => setForm({ ...form, uf: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-input bg-background font-bold"
              >
                {ufs.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                CEP
              </label>
              <Input
                value={form.cep}
                onChange={e => setForm({ ...form, cep: cepMask(e.target.value) })}
                placeholder="00000-000"
                className="h-11 rounded-xl font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Tipo do Local
              </label>
              <select
                value={form.tipoLocal}
                onChange={e => setForm({ ...form, tipoLocal: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-input bg-background font-bold"
              >
                <option value="">Selecione...</option>
                {tiposLocal.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Licença / Cadastro
              </label>
              <Input
                value={form.licenca}
                onChange={e => setForm({ ...form, licenca: e.target.value })}
                placeholder="Número da licença ambiental"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Observações
              </label>
              <Input
                value={form.observacoes}
                onChange={e => setForm({ ...form, observacoes: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPadrao}
                  onChange={e => setForm({ ...form, isPadrao: e.target.checked })}
                  className="w-5 h-5 rounded border-2 border-accent bg-background accent-accent"
                />
                <span className="font-bold text-sm">Definir como local padrão</span>
              </label>
            </div>
          </div>
        </div>
      </ModalBase>
    </>
  );
}
