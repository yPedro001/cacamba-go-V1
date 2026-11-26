import { describe, it, expect } from 'vitest';
import { gerarNumeroCTR, formatarNumeroCTR } from '@/core/domain/ctr-schemas';

describe('CTR Numbering and Collision Tests', () => {
  it('generates padded 6-digit sequence when sequential number is passed', () => {
    expect(gerarNumeroCTR(1)).toBe('000001');
    expect(gerarNumeroCTR(42)).toBe('000042');
    expect(gerarNumeroCTR(999999)).toBe('999999');
  });

  it('calculates next incremental sequence from existing CTR list without collisions', () => {
    const existing = [
      { numero: '000001' },
      { numero: '000005' },
      { numero: '000012' },
    ];
    expect(gerarNumeroCTR(undefined, existing)).toBe('000013');
  });

  it('handles formatted CTR numbers with non-digit prefixes/suffixes', () => {
    const existing = [
      { numero: '2026-0000100' },
      { numero: '2026-0000101' },
    ];
    expect(gerarNumeroCTR(undefined, existing)).toBe('20260000102');
  });

  it('returns 000001 when existing list is empty or undefined', () => {
    expect(gerarNumeroCTR(undefined, [])).toBe('000001');
    expect(gerarNumeroCTR(undefined, undefined)).toBe('000001');
  });

  it('formats sequential CTR numbers consistently', () => {
    expect(formatarNumeroCTR(7, 2026)).toBe('000007');
  });
});
