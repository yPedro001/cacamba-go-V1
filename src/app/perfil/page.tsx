"use client"
import React, { useState, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Save, Upload, Building2, CheckCircle2, LogOut, Trash2, MapPin } from 'lucide-react'
import { useAppStore, usePerfil } from '@/store/useAppStore'
import { useDataActions } from '@/core/application/useDataActions'
import { ConfirmModal } from '@/components/ConfirmModal'
import { AddressAutocomplete } from '@/components/AddressAutocomplete'
import { fetchAddressByCep } from '@/lib/address-utils'

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
      parcelasSemJuros: 1
    }
  })

  // Endereço Formulário Separado
  const initialParts = (perfil.endereco || '').split(' - ');
  const initialRuaNum = (initialParts[0] || '').split(',');
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
    reader.onloadend = () => {
      updatePerfil({ logoUrl: reader.result as string })
    }
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
      cep: data.cep || prev.cep
    }))

    if (data.lat && data.lng) {
      setForm(f => ({ ...f, lat: data.lat!, lng: data.lng! }))
    }
  }

  const handleSave = () => {
    const { rua, numero, cidade, cep } = enderecoForm;
    const finalEndereco = rua ? `${rua}, ${numero || 'S/N'} - ${cidade || 'Sem Cidade'} - ${cep || 'Sem CEP'}` : '';
    
    updatePerfil({ ...form, endereco: finalEndereco })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleRemoveLogo = () => {
    updatePerfil({ logoUrl: undefined })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Perfil e Configurações</h2>
      </div>

      {/* Logo da Empresa */}
      <Card>
        <CardHeader>
          <CardTitle>Logo da Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {perfil.logoUrl ? (
              <img
                src={perfil.logoUrl}
                alt="Logo da empresa"
                className="w-24 h-24 object-contain rounded-xl border border-border bg-muted/30 p-2"
              />
            ) : (
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center text-muted-foreground">
                <Building2 className="h-8 w-8 mb-1" />
                <span className="text-xs">Sem logo</span>
              </div>
            )}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                A logo será exibida nos recibos gerados automaticamente.
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {perfil.logoUrl ? 'Trocar Logo' : 'Fazer Upload'}
                </Button>
                {perfil.logoUrl && (
                  <Button type="button" variant="ghost" className="text-red-500 hover:text-red-600 text-sm" onClick={handleRemoveLogo}>
                    Remover
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <p className="text-xs text-muted-foreground">Formatos: PNG, JPG, SVG. Recomendado: fundo transparente.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados da Empresa */}
      <Card>
        <CardHeader>
          <CardTitle>Dados da Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={e => { e.preventDefault(); handleSave() }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome da Empresa</label>
                <Input value={form.nomeEmpresa} onChange={e => setForm({ ...form, nomeEmpresa: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">CNPJ</label>
                <Input value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0001-00" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefone de Contato</label>
                <Input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email para Faturamento</label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="contato@empresa.com.br" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-accent font-bold">Latitude do Pátio</label>
                <Input type="number" step="any" value={form.lat} onChange={e => setForm({ ...form, lat: parseFloat(e.target.value) })} placeholder="-23.5505" />
              </div>
               <div className="space-y-2">
                 <label className="text-sm font-medium text-accent font-bold">Longitude do Pátio</label>
                 <Input type="number" step="any" value={form.lng} onChange={e => setForm({ ...form, lng: parseFloat(e.target.value) })} placeholder="-46.6333" />
               </div>
               <div className="space-y-2 md:col-span-2">
                 <label className="text-sm font-medium text-primary font-bold">Chave Pix para Recebimento</label>
                 <Input value={form.chavePix} onChange={e => setForm({ ...form, chavePix: e.target.value })} placeholder="CPF, E-mail, Telefone ou Chave Aleatória" />
                 <p className="text-[10px] text-muted-foreground">Esta chave será usada para gerar o QR Code no recibo quando o método de pagamento for Pix.</p>
               </div>
             </div>

            <div className="space-y-4 pt-2">
              <label className="text-sm font-medium">Endereço Base</label>
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3 space-y-2">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase">Rua</label>
                  <AddressAutocomplete 
                    value={enderecoForm.rua || ''} 
                    onChange={(val, lat, lng, address) => {
                      setEnderecoForm(prev => ({ 
                        ...prev, 
                        rua: address?.road || val.split(',')[0] || val,
                        cidade: address?.city || address?.town || address?.suburb || prev.cidade,
                        cep: address?.postcode || prev.cep
                      }))
                      if (lat && lng) {
                        setForm(f => ({ ...f, lat, lng }))
                      }
                    }} 
                    placeholder="Av. Principal..." 
                  />
                </div>
                <div className="col-span-1 space-y-2">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase">Número</label>
                  <Input value={enderecoForm.numero} onChange={e => setEnderecoForm({...enderecoForm, numero: e.target.value})} placeholder="1000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase">Cidade</label>
                  <Input value={enderecoForm.cidade} onChange={e => setEnderecoForm({...enderecoForm, cidade: e.target.value})} placeholder="São Paulo" />
                </div>
                 <div className="space-y-2">
                   <label className="text-[11px] font-semibold text-muted-foreground uppercase">CEP</label>
                   <div className="relative">
                     <Input 
                       value={enderecoForm.cep} 
                       onChange={e => setEnderecoForm({...enderecoForm, cep: e.target.value})} 
                       onBlur={e => handleCepBlur(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' && handleCepBlur((e.target as HTMLInputElement).value)}
                       placeholder="00000-000" 
                     />
                     {isCepLoading && <div className="absolute right-2 top-2.5 h-4 w-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>}
                   </div>
                 </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <Button type="submit" className={`font-semibold transition-all ${saved ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-accent hover:bg-accent-dark text-white'}`}>
                {saved ? (
                  <><CheckCircle2 className="h-4 w-4 mr-2" />Salvo!</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" />Salvar Alterações</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Padrões de Cadastro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-accent" />
            Padrões de Cadastro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor Padrão (R$)</label>
              <Input 
                type="number" 
                value={form.padroes?.valorAluguel} 
                onChange={e => setForm({ ...form, padroes: { ...form.padroes, valorAluguel: parseFloat(e.target.value) || 0 } })} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Taxa Maquininha (%)</label>
              <Input 
                type="number" 
                step="0.01"
                value={form.padroes?.taxaMaquininhaPadrao} 
                onChange={e => setForm({ ...form, padroes: { ...form.padroes, taxaMaquininhaPadrao: parseFloat(e.target.value) || 0 } })} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tamanho Padrão</label>
              <select 
                className="w-full h-10 px-3 py-2 rounded-md border border-input bg-transparent text-sm ring-offset-background focus:ring-2 focus:ring-accent"
                value={form.padroes?.tamanhoCacamba}
                onChange={e => setForm({ ...form, padroes: { ...form.padroes, tamanhoCacamba: e.target.value } })}
              >
                <option value="3m" className="bg-background">3m³</option>
                <option value="4m" className="bg-background">4m³</option>
                <option value="5m" className="bg-background">5m³</option>
                <option value="7m" className="bg-background">7m³</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Prefixo de Nome</label>
              <Input 
                value={form.padroes?.prefixoCacamba} 
                onChange={e => setForm({ ...form, padroes: { ...form.padroes, prefixoCacamba: e.target.value } })} 
                placeholder="Ex: C-"
              />
              <p className="text-[10px] text-muted-foreground">Ex: C-015.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Juros Parc. (%)</label>
              <Input 
                type="number" step="0.01"
                value={form.padroes?.jurosParcelamento} 
                onChange={e => setForm({ ...form, padroes: { ...form.padroes, jurosParcelamento: parseFloat(e.target.value) || 0 } })} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Isenção Juros (parc.)</label>
              <Input 
                type="number" 
                value={form.padroes?.parcelasSemJuros} 
                onChange={e => setForm({ ...form, padroes: { ...form.padroes, parcelasSemJuros: parseInt(e.target.value) || 1 } })} 
              />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border flex justify-end">
            <Button onClick={handleSave} className={`font-semibold transition-all ${saved ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-accent hover:bg-accent-dark text-white'}`}>
               {saved ? "Padrões Salvos!" : "Salvar Padrões"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview do Recibo */}
      <Card>
        <CardHeader>
          <CardTitle>Preview do Cabeçalho do Recibo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border border-border">
            {perfil.logoUrl ? (
              <img src={perfil.logoUrl} alt="Logo" className="w-14 h-14 object-contain rounded-lg border border-border" />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-accent/20 flex items-center justify-center text-accent font-bold text-lg border border-accent/30">
                {perfil.nomeEmpresa.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-bold text-lg">{perfil.nomeEmpresa}</p>
              <p className="text-xs text-muted-foreground">CNPJ: {perfil.cnpj}</p>
              <p className="text-xs text-muted-foreground">{perfil.telefone} · {perfil.email}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Este cabeçalho aparecerá em todos os recibos de locação gerados pelo sistema.</p>
        </CardContent>
      </Card>

      {/* Operações de Conta */}
      <Card className="border-red-500/20">
        <CardHeader>
          <CardTitle className="text-red-500">Operações de Conta</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Button 
            variant="outline" 
            className="flex-1 border-slate-700 hover:bg-slate-800"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4 mr-2" /> Sair da Conta
          </Button>
          <Button 
            variant="destructive" 
            className="flex-1 bg-red-600 hover:bg-red-700"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Excluir Minha Conta e Dados
          </Button>
        </CardContent>
      </Card>

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
