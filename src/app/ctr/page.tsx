"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModalBase } from '@/components/ui/modal-base';
import { useCTRController } from '@/features/ctr/hooks/useCTRController';
import { CTRForm } from '@/features/ctr/components/CTRForm';
import { CTRDocumentPreview } from '@/features/ctr/components/CTRDocumentPreview';
import { CTRHistoryTable } from '@/features/ctr/components/CTRHistoryTable';
import { SelecaoAlugueis } from '@/features/ctr/components/SelecaoAlugueis';
import { ConflitosAlert } from '@/features/ctr/components/ConflitosAlert';
import { ctrDocumentService } from '@/infrastructure/services/ctr-document-service';
import { CTR, CTRPayload, LocalDescarte } from '@/core/domain/ctr-types';
import { FileText, Plus, Loader2, AlertCircle } from 'lucide-react';
import { gerarNumeroCTR } from '@/core/domain/ctr-schemas';

export default function CTRPage() {
  const ctrController = useCTRController();
  const {
    ctrs,
    ctrAtual,
    locaisDescarte,
    localDescarteSelecionado,
    alugueisSelecionados,
    conflitos,
    isModalOpen,
    isLoading,
    error,
    hasBloqueioConflitos,
    locacoesAtivas,
    
    openEmitModal,
    closeModal,
    handleSelectAlugueis,
    handleSelectLocalDescarte,
    updateIdentificacao,
    updateOrigem,
    updateGerador,
    updateTransportador,
    updateDestinatario,
    updateResiduo,
    updateDeclaracoes,
    previewDocument,
    handleEmitCTR,
    downloadPDF,
    downloadWord,
    handlePrint,
    handleDeleteCTR,
    setError,
  } = ctrController;

  const [activeTab, setActiveTab] = useState('emitir');
  const [showPreview, setShowPreview] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<CTRPayload | null>(null);
  const [viewCTR, setViewCTR] = useState<CTR | null>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  const handlePreview = () => {
    if (ctrAtual && localDescarteSelecionado) {
      const payload = previewDocument();
      if (payload) {
        setPreviewPayload(payload);
        setShowPreview(true);
      }
    }
  };

  const handleEmit = async () => {
    const success = await handleEmitCTR();
    if (success) {
      setActiveTab('historico');
    }
  };

  const handleViewCTR = (ctr: CTR) => {
    setViewCTR(ctr);
  };

  const handlePrintHistoric = async (ctr: CTR) => {
    const localDescarte = locaisDescarte.find(l => l.nome === ctr.destinatarioNome);
    if (!localDescarte) return;

    const payload = ctrDocumentService.generatePayload(
      {
        alugueisIds: [],
        localDescarteId: localDescarte.id,
        numero: ctr.numero,
        data: ctr.data,
        horaSaida: ctr.horaSaida,
        tipoOperacao: ctr.tipoOperacao,
        origem: {
          endereco: ctr.origemEndereco,
          bairro: ctr.origemBairro || '',
          cidade: ctr.origemCidade,
          uf: ctr.origemUF,
          responsavel: ctr.origemResponsavel || '',
          telefone: ctr.origemTelefone || '',
          observacao: ctr.origemObservacao || '',
        },
        gerador: {
          nome: ctr.geradorNome,
          cpfCnpj: ctr.geradorCpfCnpj,
          endereco: ctr.geradorEndereco || '',
          bairro: ctr.geradorBairro || '',
          cidade: ctr.geradorCidade || '',
          uf: ctr.geradorUF || 'SP',
          responsavel: ctr.geradorResponsavel || '',
          telefone: ctr.geradorTelefone || '',
        },
        transportador: {
          nome: ctr.transportadorNome,
          cpfCnpj: ctr.transportadorCpfCnpj,
          inscricao: ctr.transportadorInscricao || '',
          telefone: ctr.transportadorTelefone || '',
        },
        destinatario: {
          nome: ctr.destinatarioNome,
          cpfCnpj: ctr.destinatarioCpfCnpj || '',
          endereco: ctr.destinatarioEndereco,
          bairro: ctr.destinatarioBairro || '',
          cidade: ctr.destinatarioCidade,
          uf: ctr.destinatarioUF,
          tipoLocal: (ctr.destinatarioTipoLocal as any) || 'outro',
          licenca: ctr.destinatarioLicenca || '',
        },
        residuo: {
          classe: (ctr.residuoClasse as any) || 'A',
          descricao: ctr.residuoDescricao,
          acondicionamento: ctr.residuoAcondicionamento || '',
          quantidade: ctr.residuoQuantidade,
          unidade: ctr.residuoUnidade,
        },
        declaracoes: {
          transportador: { nome: ctr.declaracaoTransportadorNome || '', assinatura: ctr.declaracaoTransportadorAssinatura },
          recebedor: { nome: ctr.declaracaoRecebedorNome || '', assinatura: ctr.declaracaoRecebedorAssinatura, dataHora: ctr.declaracaoRecebedorDataHora, carimbo: ctr.declaracaoRecebedorCarimbo, observacao: ctr.declaracaoRecebedorObservacao },
        },
      },
      localDescarte,
      { nomeEmpresa: '', cnpj: '', telefone: '', endereco: '', logoUrl: undefined },
      ctr.numero
    );

    await handlePrint(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <FileText className="text-accent" />
            CTR
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Controle de Transporte de Resíduos
          </p>
        </div>
        <Button 
          onClick={openEmitModal} 
          className="bg-accent hover:bg-accent-dark font-bold"
          disabled={locaisDescarte.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Emitir CTR
        </Button>
      </div>

      {locaisDescarte.length === 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
          <AlertCircle className="text-amber-500 shrink-0" size={20} />
          <div>
            <p className="font-bold text-amber-500">Cadastre um local de descarte primeiro</p>
            <p className="text-sm text-amber-400/80">
              Acesse o <a href="/perfil" className="underline">Perfil</a> para cadastrar locais de descarte padrão.
            </p>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="emitir">Emitir</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="historico" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>CTRs Emitidos</CardTitle>
            </CardHeader>
            <CardContent>
              <CTRHistoryTable
                ctrs={ctrs}
                onView={handleViewCTR}
                onPrint={handlePrintHistoric}
                onDelete={handleDeleteCTR}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emitir" className="mt-6">
          <div className="text-center py-12 text-muted-foreground">
            <FileText size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold">Clique em "Emitir CTR" para criar um novo documento</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Emissão de CTR */}
      <ModalBase
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Emitir CTR"
        maxWidth="full"
        className="max-h-[95vh]"
        footer={
          <div className="flex gap-3 w-full">
            <Button
              variant="ghost"
              onClick={closeModal}
              className="h-11 px-6 rounded-xl font-bold"
            >
              Cancelar
            </Button>
            <div className="flex-1 flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={handlePreview}
                className="h-11 px-6 rounded-xl font-bold"
                disabled={!ctrAtual || !localDescarteSelecionado}
              >
                Visualizar
              </Button>
              <Button
                onClick={handleEmit}
                className="h-11 px-8 rounded-xl font-bold bg-accent hover:bg-accent-dark"
                disabled={hasBloqueioConflitos || !ctrAtual || !localDescarteSelecionado || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Emitir CTR
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
              {error}
            </div>
          )}

          <ConflitosAlert conflitos={conflitos} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelecaoAlugueis
                  locacoes={locacoesAtivas}
                  selecionados={alugueisSelecionados}
                  onSelecionar={handleSelectAlugueis}
                />

                <Card className="bg-card border-border">
                  <CardHeader className="px-4 py-3 border-b border-border bg-muted/20">
                    <CardTitle className="text-sm font-black italic uppercase">
                      Local de Descarte
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {locaisDescarte.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <p className="text-sm">Nenhum local cadastrado</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {locaisDescarte.map(local => (
                          <button
                            key={local.id}
                            onClick={() => handleSelectLocalDescarte(local)}
                            className={`w-full p-3 rounded-xl border text-left transition-all ${
                              localDescarteSelecionado?.id === local.id
                                ? 'bg-accent/10 border-accent/30'
                                : 'bg-background border-border hover:border-accent/20'
                            }`}
                          >
                            <p className="font-bold text-sm truncate">{local.nome}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {local.rua}, {local.cidade} - {local.uf}
                            </p>
                            {local.isPadrao && (
                              <span className="text-[10px] text-accent font-bold">PADRÃO</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {ctrAtual && localDescarteSelecionado && (
                <CTRForm
                  formData={ctrAtual}
                  localDescarte={localDescarteSelecionado}
                  conflitos={conflitos}
                  onUpdateIdentificacao={updateIdentificacao}
                  onUpdateOrigem={updateOrigem}
                  onUpdateGerador={updateGerador}
                  onUpdateTransportador={updateTransportador}
                  onUpdateDestinatario={updateDestinatario}
                  onUpdateResiduo={updateResiduo}
                  onUpdateDeclaracoes={updateDeclaracoes}
                />
              )}
            </div>

            {showPreview && previewPayload && (
              <div className="lg:col-span-1 space-y-4">
                <div className="sticky top-4">
                  <CTRDocumentPreview
                    payload={previewPayload}
                    onDownloadPDF={downloadPDF}
                    onDownloadWord={downloadWord}
                    onPrint={handlePrint}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </ModalBase>

      {/* Modal de Visualização de CTR Histórico */}
      <ModalBase
        isOpen={!!viewCTR}
        onClose={() => setViewCTR(null)}
        title={`CTR - ${viewCTR?.numero || ''}`}
        maxWidth="full"
        footer={
          <div className="flex gap-3 w-full justify-end">
            <Button
              variant="ghost"
              onClick={() => setViewCTR(null)}
              className="h-11 px-6 rounded-xl font-bold"
            >
              Fechar
            </Button>
          </div>
        }
      >
        {viewCTR && (
          <div className="p-4 bg-muted/20 rounded-xl text-sm text-center">
            <p className="font-bold">CTR histórico - reimpressão</p>
            <p className="text-muted-foreground">
              Use o botão de impressão no histórico para regenerar o documento.
            </p>
          </div>
        )}
      </ModalBase>
    </div>
  );
}
