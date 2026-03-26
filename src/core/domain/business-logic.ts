import { Cacamba, Locacao, MapColor } from './types';

/**
 * Determina a cor de uma caçamba no mapa baseada no status e datas de locação.
 */
export function getMapColor(
  cacamba: Cacamba,
  locacoes: Locacao[],
  today: Date = new Date(),
  providedActiveLoc?: Locacao
): MapColor {
  // 1. DISPONÍVEL (PÁTIO)
  if (cacamba.status === 'disponivel') return 'cinza';

  // Localizar locação ativa
  const activeLoc = providedActiveLoc || locacoes.find(l =>
    (l.cacambaIds?.includes(cacamba.id) || l.cacambaId === cacamba.id) &&
    l.status !== 'pago'
  );

  // 2. VERMELHO: Vencida para retirada
  if (cacamba.status === 'vencida' || (activeLoc && (activeLoc.status === 'vencida' || isLocacaoOverdue(activeLoc, today)))) {
    return 'vermelho';
  }

  // 3. AZUL: Entrega Pendente
  if (cacamba.status === 'entrega_pendente' || (activeLoc && activeLoc.status === 'entrega_pendente')) {
    return 'azul';
  }

  // 4. AMARELO: Em uso
  if (cacamba.status === 'locada' || (activeLoc && activeLoc.status === 'em_uso')) {
    return 'amarelo';
  }

  return 'cinza';
}

/**
 * Calcula os valores financeiros de uma locação (Taxas, Líquido).
 * O valor bruto passado já deve considerar os juros aplicados ao cliente, se houver.
 */
export function calculateFinancials(
  valorBase: number,
  metodoPercent: number = 0,
  jurosPercent: number = 0
): { valorBruto: number; valorTaxa: number; valorLiquido: number } {
  const valorBruto = valorBase * (1 + jurosPercent / 100);
  const valorTaxa = (valorBruto * metodoPercent) / 100;
  const valorLiquido = valorBruto - valorTaxa;
  return { valorBruto, valorTaxa, valorLiquido };
}

/**
 * Verifica se uma locação está vencida em relação a uma data.
 */
export function isLocacaoOverdue(locacao: Locacao, referenceDate: Date = new Date()): boolean {
  if (locacao.status === 'pago') return false;
  if (!locacao.dataDevolucaoPrevista) return false;
  
  const devDate = new Date(locacao.dataDevolucaoPrevista + 'T00:00:00');
  referenceDate.setHours(0, 0, 0, 0);
  return devDate < referenceDate;
}
