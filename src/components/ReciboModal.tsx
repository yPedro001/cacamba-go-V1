"use client"
import React, { useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Printer, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/useAppStore'
import { Locacao, MetodoPagamento } from '@/core/domain/types'
import { generatePixPayload } from '@/core/domain/pix-utils'
import { ModalBase } from '@/components/ui/modal-base'

interface ReciboModalProps {
  locacao: Locacao
  onClose: () => void
}

const metodoPagamentoLabel: Record<MetodoPagamento, string> = {
  pix: 'PIX',
  debito: 'Cartão de Débito',
  credito: 'Cartão de Crédito',
  boleto: 'Boleto Bancário',
}

function mascaraDocumento(doc: string): string {
  if (!doc) return '—'
  const soDigitos = doc.replace(/\D/g, '')
  if (soDigitos.length === 11) {
    return soDigitos.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.***.***-$4')
  }
  return doc
}

function formatarDataBR(dateStr: string | undefined | null): string {
  if (!dateStr) return '—'
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR')
}

function formatarEnderecoCompacto(addr: string): string {
  if (!addr) return '—'
  const parts = addr.split(',').map(s => s.trim())
  if (parts.length <= 2) return addr
  return `${parts[0]}, ${parts[1]}${parts[2] ? ` - ${parts[2]}` : ''}`
}

function sanitizeFilename(name: string): string {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, '_')
}

export function ReciboModal({ locacao, onClose }: ReciboModalProps) {
  const { clientes, perfil } = useAppStore()
  const reciboRef = useRef<HTMLDivElement>(null)

  const cliente = clientes.find(c => c.id === locacao.clienteId)
  const juros = locacao.jurosPercent || 0
  const valorFinal = (locacao.valor ?? 0) * (1 + juros / 100)
  const metodo = locacao.metodoPagamento
  const qtd = locacao.quantidadeCacambas ?? 1
  const dataEmissao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
  const vencimento = formatarDataBR(locacao.dataDevolucaoPrevista)

  const getCapturedCanvas = async () => {
    if (!reciboRef.current) return null
    const html2canvas = (await import('html2canvas')).default
    return await html2canvas(reciboRef.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: 794,
      logging: false,
    })
  }

  const handleDownload = async () => {
    const canvas = await getCapturedCanvas()
    if (!canvas) return
    const jsPDF = (await import('jspdf')).default
    const imgData = canvas.toDataURL('image/png', 1.0)
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const canvasRatio = canvas.height / canvas.width
    let finalWidth = pdfWidth
    let finalHeight = pdfWidth * canvasRatio
    if (finalHeight > pdfHeight) {
      finalHeight = pdfHeight
      finalWidth = pdfHeight / canvasRatio
    }
    const marginX = (pdfWidth - finalWidth) / 2
    pdf.addImage(imgData, 'PNG', marginX, 0, finalWidth, finalHeight, undefined, 'FAST')
    const filename = `${sanitizeFilename(cliente?.nome || 'Cliente')}-Recibo.pdf`
    pdf.save(filename)
  }

  const handlePrint = async () => {
    const canvas = await getCapturedCanvas()
    if (!canvas) return
    const imgData = canvas.toDataURL('image/png')
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir Recibo - ${cliente?.nome ?? ''}</title>
          <style>
            @page { size: auto; margin: 0; }
            body { margin: 0; display: flex; justify-content: center; align-items: flex-start; background: #fff; }
            img { width: 100%; height: auto; max-width: 210mm; display: block; }
          </style>
        </head>
        <body>
          <img src="${imgData}" />
          <script>
            window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 300); };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleWhatsApp = () => {
    const isPago = locacao.status === 'pago'
    let msg = ''
    if (isPago) {
      msg = `*CONFIRMAÇÃO DE PAGAMENTO - ${perfil.nomeEmpresa}*\n\n` +
        `Olá, *${cliente?.nome}*!\n\n` +
        `Confirmamos o recebimento do pagamento referente à locação de caçamba(s). 🎉\n\n` +
        `*DETALHES:*\n` +
        `• *Quantidade:* ${qtd}\n` +
        `• *Local:* ${locacao.enderecoObra}\n` +
        `• *Início:* ${formatarDataBR(locacao.dataRetirada)}\n` +
        `• *Vencimento:* ${vencimento}\n` +
        `• *Valor:* R$ ${valorFinal.toFixed(2)}\n` +
        `• *Pagamento:* ${metodo ? metodoPagamentoLabel[metodo] : 'À vista'}\n\n` +
        `Obrigado pela preferência! 🙏\n\n*Equipe ${perfil.nomeEmpresa}*`
    } else {
      msg = `*RECIBO DE LOCAÇÃO (PENDENTE) - ${perfil.nomeEmpresa}*\n\n` +
        `Olá, *${cliente?.nome}*!\n\n` +
        `Seu pagamento ainda consta como *pendente*. 🕒\n\n` +
        `*DADOS:*\n` +
        `• *Quantidade:* ${qtd} caçamba(s)\n` +
        `• *Local:* ${locacao.enderecoObra}\n` +
        `• *Valor:* R$ ${valorFinal.toFixed(2)}\n` +
        `• *Vencimento:* ${vencimento}\n\n` +
        `*Chave Pix:* ${perfil.chavePix || 'Não informada'}\n\n` +
        `*Equipe ${perfil.nomeEmpresa}*`
    }
    const url = `https://wa.me/${cliente?.telefone?.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  const watermarkBase64 = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' font-weight='900' fill='%2394a3b8' text-anchor='middle' opacity='0.05' transform='rotate(-20 150 100)'%3E${encodeURIComponent(perfil.nomeEmpresa)}%3C/text%3E%3C/svg%3E`

  return (
    <ModalBase
      isOpen={true}
      onClose={onClose}
      maxWidth="3xl"
      hideCloseButton={false}
      title={
        <div className="flex items-center gap-3">
          <div className="bg-accent/15 p-2 rounded-xl shrink-0">
            <Receipt className="h-5 w-5 text-accent" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight leading-none">Recibo de Locação</span>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">{cliente?.nome}</p>
          </div>
        </div>
      }
      footer={
        <div className="flex gap-3 w-full">
          <Button variant="ghost" onClick={onClose} className="px-6 font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 h-12 rounded-2xl">
            Sair
          </Button>
          <div className="flex-1 flex gap-3">
            <Button onClick={handleWhatsApp} variant="secondary" className="flex-1 bg-green-500/10 text-green-400 hover:bg-green-500/20 border-none font-black text-xs uppercase tracking-widest h-12 rounded-xl">
              WhatsApp
            </Button>
            <Button onClick={handleDownload} variant="secondary" className="flex-1 bg-muted/50 text-foreground hover:bg-white/10 border-none font-black text-xs uppercase tracking-widest h-12 rounded-xl">
              Baixar PDF
            </Button>
            <Button onClick={handlePrint} className="flex-1 bg-accent hover:bg-accent-dark text-foreground border-none font-black text-xs uppercase tracking-widest h-12 rounded-xl shadow-lg shadow-accent/20">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>
      }
    >
      {/* Preview A4 — scroll interno gerenciado pelo ModalBase */}
      <div className="bg-slate-100 -mx-8 -mt-8 -mb-8 p-6 flex justify-center min-h-0">
        <div
          ref={reciboRef}
          className="bg-white p-[20mm] shadow-2xl relative overflow-hidden flex flex-col"
          style={{
            width: '210mm',
            minHeight: '297mm',
            maxHeight: '298mm',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.15)',
            backgroundImage: `url("${watermarkBase64}")`,
            backgroundRepeat: 'repeat',
          }}
        >
          {/* Cabeçalho */}
          <div className="relative z-10 flex items-center gap-6 mb-6 pb-4 border-b-2 border-slate-100">
            {perfil.logoUrl ? (
              <img src={perfil.logoUrl} alt="Logo" className="w-28 h-28 object-contain rounded-2xl shadow-sm border border-slate-50" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-accent p-0.5 shadow-xl">
                <div className="w-full h-full rounded-[12px] bg-white flex items-center justify-center text-accent font-black text-2xl">
                  {perfil.nomeEmpresa.charAt(0)}
                </div>
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-1 leading-none">{perfil.nomeEmpresa}</h1>
              <div className="flex gap-4 items-center">
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">CNPJ: {perfil.cnpj}</p>
                <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{perfil.telefone}</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 font-medium italic border-l-4 border-slate-100 pl-2">{perfil.endereco}</p>
            </div>
          </div>

          {/* Título */}
          <div className="relative z-10 text-center border-y-2 border-slate-100 py-2 mb-6 bg-slate-50/20">
            <h2 className="text-xl font-black uppercase tracking-[0.4em] text-slate-900 border-x-4 border-slate-200 px-4 inline-block">Recibo</h2>
          </div>

          {/* Conteúdo */}
          <div className="relative z-10 grid grid-cols-1 gap-6">
            <section className="space-y-2">
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-slate-100 pb-1.5">Informações do Locatário</h3>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Nome</span>
                <span className="text-lg font-black text-slate-800">{cliente?.nome ?? 'Cliente Não Informado'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Documento</span>
                <span className="text-sm font-bold text-slate-700 font-mono tracking-widest">{mascaraDocumento(cliente?.cpfCnpj ?? '')}</span>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-slate-100 pb-1.5">Detalhes da Locação</h3>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Descrição</span>
                <span className="text-sm font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                  Aluguel de {qtd.toString().padStart(2, '0')} caçamba(s)
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5">Local</span>
                <span className="text-sm font-bold text-slate-800 text-right max-w-[70%] leading-tight">
                  {formatarEnderecoCompacto(locacao.enderecoObra || '')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">Data de Início</span>
                  <span className="text-sm font-black text-slate-800 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-center">
                    {formatarDataBR(locacao.dataRetirada)}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase text-right">Data de Vencimento</span>
                  <span className="text-sm font-black text-accent bg-accent/5 px-3 py-1.5 rounded-xl border border-accent/10 text-center">
                    {vencimento}
                  </span>
                </div>
              </div>
            </section>

            {/* Valor */}
            <div className="bg-slate-900 rounded-3xl p-4 text-center shadow-xl relative overflow-hidden flex flex-col items-center justify-center">
              <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-[0.3em] mb-2">Valor Total da Prestação</p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-lg font-bold text-accent">R$</span>
                <p className="text-4xl font-black text-white tracking-tighter tabular-nums leading-none">
                  {valorFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              {locacao.status === 'pago' && (
                <div className="absolute bottom-2 left-3 pointer-events-none select-none">
                  <div className="border-[3px] border-red-500/50 text-red-500/50 px-3 py-0.5 rounded-lg font-black text-lg uppercase rotate-[-5deg] tracking-tight bg-muted/50">
                    PAGO {formatarDataBR(locacao.dataPagamento)}
                  </div>
                </div>
              )}
              <div className="mt-2 text-[9px] text-white/60 font-black uppercase tracking-widest bg-white/10 px-3 py-0.5 rounded-full">
                {metodo ? metodoPagamentoLabel[metodo] : 'À vista'}
              </div>
            </div>

            {/* QR Code Pix */}
            {metodo === 'pix' && locacao.status !== 'pago' && perfil.chavePix && (
              <div className="flex flex-col items-center gap-3 py-4 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                  Pagamento Via Pix
                </p>
                <div className="bg-white p-3 rounded-2xl shadow-lg border border-slate-100">
                  <QRCodeSVG value={generatePixPayload(perfil.chavePix, valorFinal)} size={110} level="H" includeMargin={true} />
                </div>
              </div>
            )}

            {/* Assinatura */}
            <div className="pt-2 flex flex-col items-center text-center">
              <div className="relative w-[320px] mb-1">
                <svg width="320" height="90" viewBox="0 0 520 110" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <style>{`@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');`}</style>
                  </defs>
                  <g fill="none" stroke="#000080" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M50 80 C150 70 370 60 470 50" opacity="0.08" />
                  </g>
                  <text
                    x="50%"
                    y="74"
                    textAnchor="middle"
                    fontFamily="'Dancing Script', cursive"
                    fontSize="46"
                    fontWeight="700"
                    fill="#1e3a5f"
                    stroke="none"
                  >
                    {perfil.nomeEmpresa}
                  </text>
                </svg>
              </div>
              <div className="w-[180px] border-t-2 border-slate-900 pt-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">Assinatura</p>
                <p className="text-[8px] text-muted-foreground font-bold uppercase mt-1 tracking-wider">Responsável Autorizado</p>
              </div>
            </div>
          </div>

          {/* Rodapé */}
          <div className="mt-auto pt-6 text-center">
            <div className="inline-block px-6 py-1.5 bg-slate-50 rounded-full border border-slate-100">
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest tabular-nums">
                Emitido em {dataEmissao} · Hash: {Math.random().toString(36).substring(7).toUpperCase()}
              </p>
            </div>
            <p className="mt-3 text-[8px] text-muted-foreground font-medium italic max-w-sm mx-auto leading-relaxed">
              Este documento comprova a prestação de serviços. A quitação definitiva ocorre após a confirmação do crédito bancário.
            </p>
          </div>
        </div>
      </div>
    </ModalBase>
  )
}

