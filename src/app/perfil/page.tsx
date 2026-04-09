"use client"
import React, { useState, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Save, Upload, Building2, CheckCircle2, LogOut, Trash2 } from 'lucide-react'
import { useAppStore, usePerfil } from '@/store/useAppStore'
import { useDataActions } from '@/core/application/useDataActions'
import { ConfirmModal } from '@/components/ConfirmModal'
import { AddressAutocomplete } from '@/components/AddressAutocomplete'
import { fetchAddressByCep } from '@/lib/address-utils'
import { parseCurrencyToNumber, maskCurrency } from '@/lib/currency-utils'
import { cpfCnpjMask, phoneMask, cepMask } from '@/lib/masks'

export default function PerfilPage() {
  const perfil = usePerfil()
  const { updatePerfil, logout, deleteAccount } = useDataActions()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [saved, setSaved] = useState(false)
  const [isCepLoading, setIsCepLoading] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const [form, setForm] = useState({
    nomeEmpresa: perfil.nomeEmpresa,
    cnpj: perfil.cnpj,
    telefone: perfil.telefone,
    email: perfil.email,
    endereco: perfil.endereco,
    lat: perfil.lat || -23.5505,
    lng: perfil.lng || -46.6333,
    chavePix: perfil.chavePix || '',
    padroes: perfil.padroes || {
      valorAluguel: 300,
      tamanhoCacamba: '5m',
      prefixoCacamba: 'C-',
      taxaMaquininhaPadrao: 0,
      jurosParcelamento: 0,
      parcelasSemJuros: 1,
    },
  })

  const initialParts = (perfil.endereco || '').split(' - ')
  const initialRuaNum = (initialParts[0] || '').split(',')
  const [enderecoForm, setEnderecoForm] = useState({
    rua: (initialRuaNum[0] || '').trim() || perfil.endereco,
    numero: (initialRuaNum[1] || '').trim(),
    cidade: (initialParts[1] || '').trim(),
    cep: (initialParts[2] || '').trim(),
  })

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => updatePerfil({ logoUrl: reader.result as string })
    reader.readAsDataURL(file)
  }

  const handleCepBlur = async (cep: string) => {
    setIsCepLoading(true)
    const data = await fetchAddressByCep(cep)
    setIsCepLoading(false)
    if (!data) return
    setEnderecoForm(prev => ({
      ...prev,
      rua: data.rua || prev.rua,
      cidade: data.cidade || prev.cidade,
      cep: data.cep || prev.cep,
    }))
    if (data.lat && data.lng) setForm(f => ({ ...f, lat: data.lat!, lng: data.lng! }))
  }

  const handleSave = () => {
    const { rua, numero, cidade, cep } = enderecoForm
    const finalEndereco = rua ? `${rua}, ${numero || 'S/N'} - ${cidade || 'Sem Cidade'} - ${cep || 'Sem CEP'}` : ''
    updatePerfil({ ...form, endereco: finalEndereco })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleRemoveLogo = () => {
    updatePerfil({ logoUrl: undefined })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-foreground">
          Perfil <span className="text-accent">&</span> Configurações
        </h2>
        <p className="text-muted-foreground font-bold uppercase tracking-[0.3em] text-[10px] flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Gerenciamento de Identidade Corporativa
        </p>
      </div>

      {/* Grid assimétrico: 2/3 conteúdo principal + 1/3 sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">

        {/* Coluna Principal (2/3) */}
        <div className="xl:col-span-2 space-y-8">

          {/* Dados da Empresa */}
          <Card className="bg-card border-border rounded-[32px] overflow-hidden shadow-2xl">
            <CardHeader className="px-8 pt-8 pb-4 border-b border-border bg-muted/20">
              <CardTitle className="text-xl font-black italic uppercase tracking-tighter">
                Dados da <span className="text-accent">Empresa</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form className="space-y-8" onSubmit={e => { e.preventDefault(); handleSave() }}>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  <div className="space-y-2 xl:col-span-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nome da Empresa</label>
                    <Input className="h-12 rounded-2xl bg-background border-input focus:ring-accent font-bold" value={form.nomeEmpresa} onChange={e => setForm({ ...form, nomeEmpresa: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">CNPJ</label>
                    <Input className="h-12 rounded-2xl bg-background border-input focus:ring-accent font-mono" value={form.cnpj} onChange={e => setForm({ ...form, cnpj: cpfCnpjMask(e.target.value) })} placeholder="00.000.000/0001-00" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Telefone de Contato</label>
                    <Input className="h-12 rounded-2xl bg-background border-input focus:ring-accent font-bold" value={form.telefone} onChange={e => setForm({ ...form, telefone: phoneMask(e.target.value) })} placeholder="(00) 00000-0000" />
                  </div>
                  <div className="space-y-2 xl:col-span-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Email Faturamento</label>
                    <Input className="h-12 rounded-2xl bg-background border-input focus:ring-accent" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="contato@empresa.com.br" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-accent uppercase tracking-widest ml-1">Latitude Sede</label>
                    <Input className="h-12 rounded-2xl bg-background border-input focus:ring-accent font-mono" type="number" step="any" value={form.lat} onChange={e => setForm({ ...form, lat: parseFloat(e.target.value) })} placeholder="-23.5505" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-accent uppercase tracking-widest ml-1">Longitude Sede</label>
                    <Input className="h-12 rounded-2xl bg-background border-input focus:ring-accent font-mono" type="number" step="any" value={form.lng} onChange={e => setForm({ ...form, lng: parseFloat(e.target.value) })} placeholder="-46.6333" />
                  </div>
                  <div className="space-y-2 md:col-span-2 xl:col-span-3 p-6 rounded-3xl bg-accent/5 border border-accent/10">
                    <label className="text-[10px] font-black text-accent uppercase tracking-widest flex items-center gap-2">
                      💎 Chave Pix para Recebimento
                    </label>
                    <Input className="h-12 rounded-2xl bg-accent/5 border-accent/20 focus:ring-accent mt-3 font-bold" value={form.chavePix} onChange={e => setForm({ ...form, chavePix: e.target.value })} placeholder="CPF, E-mail, Telefone ou Chave Aleatória" />
                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-3 ml-1 italic">Usada para gerar QR Code nos recibos automatizados.</p>
                  </div>
                </div>

                {/* Endereço da Sede */}
                <div className="space-y-5 p-6 rounded-[32px] border border-border bg-muted/20">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    📍 Endereço da Sede / Pátio
                  </label>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-3">
                      <AddressAutocomplete
                        value={enderecoForm.rua || ''}
                        onChange={(val, lat, lng, address) => {
                          setEnderecoForm(prev => ({
                            ...prev,
                            rua: address?.road || val.split(',')[0] || val,
                            cidade: address?.city || address?.town || address?.suburb || prev.cidade,
                            cep: address?.postcode || prev.cep,
                          }))
                          if (lat && lng) setForm(f => ({ ...f, lat, lng }))
                        }}
                        placeholder="Logradouro..."
                      />
                    </div>
                    <Input className="h-12 rounded-2xl bg-background border-input focus:ring-accent font-bold" value={enderecoForm.numero} onChange={e => setEnderecoForm({ ...enderecoForm, numero: e.target.value })} placeholder="Nº" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input className="h-12 rounded-2xl bg-background border-input focus:ring-accent font-bold" value={enderecoForm.cidade} onChange={e => setEnderecoForm({ ...enderecoForm, cidade: e.target.value })} placeholder="Cidade" />
                    <div className="relative">
                      <Input
                        className="h-12 rounded-2xl bg-background border-input focus:ring-accent font-mono"
                        value={enderecoForm.cep}
                        onChange={e => setEnderecoForm({ ...enderecoForm, cep: cepMask(e.target.value) })}
                        onBlur={e => handleCepBlur(e.target.value)}
                        placeholder="00000-000"
                      />
                      {isCepLoading && <div className="absolute right-3 top-4 h-4 w-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    type="submit"
                    className={`h-12 px-8 rounded-2xl font-black uppercase tracking-widest transition-all italic shadow-xl ${saved ? 'bg-green-600 text-white shadow-green-500/20' : 'bg-accent text-white shadow-accent/20 hover:scale-105 active:scale-95'}`}
                  >
                    {saved ? <><CheckCircle2 className="h-4 w-4 mr-2" />Dados Atualizados</> : <><Save className="h-4 w-4 mr-2" />Salvar Alterações</>}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Padrões Operacionais */}
          <Card className="bg-card border-border rounded-[32px] overflow-hidden shadow-2xl">
            <CardHeader className="px-8 pt-8 pb-4 border-b border-border bg-muted/20">
              <CardTitle className="text-lg font-black italic uppercase tracking-tighter">
                Padrões <span className="text-accent">Operacionais</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Valor Aluguel (Padrão)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground/50">R$</span>
                    <Input
                      className="h-11 rounded-2xl bg-background border-input font-bold pl-10 focus:ring-accent"
                      value={maskCurrency(String((form.padroes?.valorAluguel || 0) * 100))}
                      onChange={e => {
                        const numericValue = parseCurrencyToNumber(e.target.value)
                        setForm({ ...form, padroes: { ...form.padroes, valorAluguel: numericValue } })
                      }}
                      placeholder="R$ 0,00"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Taxa Média (%)</label>
                  <Input type="number" step="0.01" className="h-11 rounded-2xl bg-background border-input font-bold" value={form.padroes?.taxaMaquininhaPadrao} onChange={e => setForm({ ...form, padroes: { ...form.padroes, taxaMaquininhaPadrao: parseFloat(e.target.value) || 0 } })} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Tamanho Base</label>
                  <select className="w-full h-11 px-4 rounded-2xl border border-input bg-background text-sm font-bold appearance-none text-foreground" value={form.padroes?.tamanhoCacamba} onChange={e => setForm({ ...form, padroes: { ...form.padroes, tamanhoCacamba: e.target.value } })}>
                    <option value="3m" >3m³</option>
                    <option value="4m" >4m³</option>
                    <option value="5m" >5m³</option>
                    <option value="7m" >7m³</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Prefixo ID</label>
                  <Input className="h-11 rounded-2xl bg-background border-input font-mono text-slate-50" value={form.padroes?.prefixoCacamba} onChange={e => setForm({ ...form, padroes: { ...form.padroes, prefixoCacamba: e.target.value } })} />
                </div>
              </div>
              <Button onClick={handleSave} className="w-full mt-8 h-12 rounded-2xl font-black uppercase tracking-widest bg-muted hover:bg-accent hover:text-white transition-all border border-border">
                Atualizar Padrões
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Direita (1/3) — sticky */}
        <div className="space-y-8 xl:sticky xl:top-8">

          {/* Branding & Identity */}
          <Card className="bg-card border-border rounded-[32px] overflow-hidden shadow-2xl">
            <CardHeader className="px-8 pt-8 pb-4 border-b border-border bg-muted/20">
              <CardTitle className="text-lg font-black italic uppercase tracking-tighter">
                Branding <span className="text-accent">& Identity</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex flex-col gap-6">
                <div className="flex justify-center">
                  {perfil.logoUrl ? (
                    <div className="relative group">
                      <img src={perfil.logoUrl} alt="Logo" className="w-32 h-32 object-contain rounded-3xl border border-white/10 bg-white/5 p-4 shadow-inner" />
                      <button onClick={handleRemoveLogo} className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-3xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center text-slate-500">
                      <Building2 className="h-10 w-10 mb-2 opacity-20" />
                      <span className="text-[9px] font-black uppercase tracking-widest">No Assets</span>
                    </div>
                  )}
                </div>
                <div className="space-y-4 text-center">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider leading-relaxed px-4">
                    A logo será aplicada em todos os documentos e recibos PDF gerados pela plataforma.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-11 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-widest w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {perfil.logoUrl ? 'Substituir Logo' : 'Enviar Logotipo'}
                  </Button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Zona de Risco */}
          <Card className="bg-card border-red-500/20 rounded-[32px] overflow-hidden shadow-2xl">
            <CardHeader className="px-8 pt-8 pb-4 border-b border-red-500/5 bg-red-500/[0.02]">
              <CardTitle className="text-lg font-black italic uppercase tracking-tighter text-red-500">
                Zona de <span className="opacity-50">Risco</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              <Button variant="ghost" className="w-full h-12 rounded-2xl border border-border text-muted-foreground font-bold uppercase tracking-widest hover:bg-muted/30 flex items-center justify-center gap-2" onClick={() => logout()}>
                <LogOut size={16} /> Encerrar Sessão
              </Button>
              <Button variant="destructive" className="w-full h-12 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-red-500/10" onClick={() => setIsDeleteModalOpen(true)}>
                <Trash2 size={16} className="mr-2" /> Excluir Conta
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={deleteAccount}
        title="Excluir Sua Conta permanentemente?"
        description="Esta ação irá apagar TODOS os seus dados salvos vinculados a este usuário. Esta ação não pode ser desfeita e você perderá o acesso a esta conta."
      />
    </div>
  )
}

