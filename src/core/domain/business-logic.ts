import { Cacamba, Locacao, MapColor, MetodoPagamento } from './types';
import { parseLocalDate } from '@/lib/domain-helpers';

/** Status de locação considerados encerrados (não ocupam mais caçamba). */
export function isLocacaoEncerrada(status: Locacao['status']): boolean {
  return status === 'pago' || status === 'concluida' || status === 'cancelada';
}

/** Status de locação que representam receita realizada. */
export function isLocacaoReceitaRealizada(status: Locacao['status']): boolean {
  return status === 'pago' || status === 'concluida';
}

/**
 * Determina a cor da caçamba no mapa com base em seu status e locação ativa.
 */
export function getMapColor(
  cacamba: Cacamba,
  locacoes: Locacao[],
  today: Date = new Date(),
  preResolvedLoc?: Locacao
): MapColor {
  if (cacamba.status === 'disponivel') {
    return 'cinza';
  }

  const loc =
    preResolvedLoc ||
    locacoes.find(
      (l) => !isLocacaoEncerrada(l.status) && (l.cacambaId === cacamba.id || l.cacambaIds?.includes(cacamba.id))
    );

  if (!loc) {
    return cacamba.status === 'vencida'
      ? 'vermelho'
      : cacamba.status === 'entrega_pendente'
      ? 'azul'
      : 'amarelo';
  }

  if (loc.status === 'vencida') return 'vermelho';
  if (loc.status === 'entrega_pendente') return 'azul';

  const devDate = parseLocalDate(loc.dataDevolucaoPrevista);
  if (devDate) {
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    if (devDate < todayStart) return 'vermelho';
  }

  return 'amarelo';
}

/**
 * Calcula valores financeiros considerando método de pagamento, taxa de cartão e juros.
 * Regra estrita: taxa de cartão (`taxaCartaoPercent`) aplica-se somente para `credito` ou `debito`.
 */
export function calculateFinancials(
  valor: number,
  metodoPagamento?: MetodoPagamento | string,
  taxaCartaoPercent: number = 0,
  jurosPercent: number = 0
): { valorTotal: number; valorTaxa: number; valorLiquido: number } {
  const safeValor = Number.isFinite(valor) ? valor : 0;
  const isCard = metodoPagamento === 'credito' || metodoPagamento === 'debito';
  const safeTaxa = isCard && Number.isFinite(taxaCartaoPercent) ? Math.max(0, taxaCartaoPercent) : 0;
  const safeJuros =
    metodoPagamento === 'credito' && Number.isFinite(jurosPercent) ? Math.max(0, jurosPercent) : 0;

  const valorTotal = Number((safeValor * (1 + safeJuros / 100)).toFixed(2));
  const valorTaxa = Number(((valorTotal * safeTaxa) / 100).toFixed(2));
  const valorLiquido = Number((valorTotal - valorTaxa).toFixed(2));
  return { valorTotal, valorTaxa, valorLiquido };
}

/**
 * Verifica se uma locação ativa está vencida sem mutar o `referenceDate` passado pelo chamador.
 */
export function isLocacaoOverdue(locacao: Locacao, referenceDate: Date = new Date()): boolean {
  if (isLocacaoEncerrada(locacao.status)) return false;
  if (!locacao.dataDevolucaoPrevista) return false;

  const devDate = parseLocalDate(locacao.dataDevolucaoPrevista);
  if (!devDate) return false;

  const refStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    0,
    0,
    0,
    0
  );
  return devDate < refStart;
}
