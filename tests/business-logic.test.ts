import { describe, it, expect } from 'vitest';
import {
  calculateFinancials,
  isLocacaoEncerrada,
  isLocacaoReceitaRealizada,
} from '@/core/domain/business-logic';

describe('Business Logic Tests', () => {
  it('identifies concluded, cancelled, and paid rentals as closed (freeing the skip)', () => {
    expect(isLocacaoEncerrada('concluida')).toBe(true);
    expect(isLocacaoEncerrada('cancelada')).toBe(true);
    expect(isLocacaoEncerrada('pago')).toBe(true);
    expect(isLocacaoEncerrada('em_uso')).toBe(false);
    expect(isLocacaoEncerrada('entrega_pendente')).toBe(false);
    expect(isLocacaoEncerrada('vencida')).toBe(false);
  });

  it('identifies revenue realization properly', () => {
    expect(isLocacaoReceitaRealizada('pago')).toBe(true);
    expect(isLocacaoReceitaRealizada('concluida')).toBe(true);
    expect(isLocacaoReceitaRealizada('em_uso')).toBe(false);
    expect(isLocacaoReceitaRealizada('cancelada')).toBe(false);
  });

  it('calculates financial totals correctly for PIX (zero card fee)', () => {
    const res = calculateFinancials(350, 'pix', 0, 0);

    expect(res.valorTotal).toBe(350);
    expect(res.valorTaxa).toBe(0);
    expect(res.valorLiquido).toBe(350);
  });

  it('calculates card fees and discounts correctly', () => {
    const res = calculateFinancials(500, 'credito', 3.5, 0);

    expect(res.valorTotal).toBe(500);
    expect(res.valorTaxa).toBe(17.5);
    expect(res.valorLiquido).toBe(482.5);
  });
});
