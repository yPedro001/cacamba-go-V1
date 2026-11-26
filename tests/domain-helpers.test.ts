import { describe, it, expect } from 'vitest';
import {
  formatLocalDateBR,
  addDaysLocalISO,
  getLocalTodayISO,
  buildWhatsAppUrl,
} from '@/lib/domain-helpers';
import { suggestNextCacambaCode, getClientName } from '@/lib/business-utils';

describe('Domain Helpers & Business Utils Tests', () => {
  it('formats dates in Brazilian standard DD/MM/YYYY correctly', () => {
    expect(formatLocalDateBR('2026-08-15')).toBe('15/08/2026');
    expect(formatLocalDateBR('')).toBe('—');
    expect(formatLocalDateBR(undefined)).toBe('—');
  });

  it('adds days to local ISO correctly without timezone shifts', () => {
    const today = '2026-11-20';
    const nextWeek = addDaysLocalISO(today, 7);
    expect(nextWeek).toBe('2026-11-27');
  });

  it('suggests sequential cacamba codes reliably', () => {
    const cacambas = [
      { codigo: 'C-001' },
      { codigo: 'C-002' },
      { codigo: 'C-009' },
    ];
    expect(suggestNextCacambaCode(cacambas, 'C-')).toBe('C-010');
  });

  it('safely handles getClientName with empty or missing arrays', () => {
    expect(getClientName('missing-id', [])).toBe('Cliente Desconhecido');
    expect(getClientName('id-1', [{ id: 'id-1', nome: 'Borghelix Construtora' } as any])).toBe(
      'Borghelix Construtora'
    );
  });

  it('builds clean WhatsApp links with international prefix 55', () => {
    const url = buildWhatsAppUrl('(11) 98765-4321', 'Olá');
    expect(url).toContain('https://wa.me/5511987654321');
    expect(url).toContain(encodeURIComponent('Olá'));
  });
});
