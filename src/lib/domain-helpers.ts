/**
 * Helpers puros compartilhados para datas locais (sem deslocamento UTC),
 * validação de documentos BR (CPF/CNPJ), telefones WhatsApp, UUID e escape HTML.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Verifica se uma string é um UUID v1-v5 válido. */
export function isValidUUID(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value.trim());
}

/** Retorna a data civil local no formato YYYY-MM-DD (evita erro de UTC após 21h BRT). */
export function getLocalTodayISO(reference: Date = new Date()): string {
  const year = reference.getFullYear();
  const month = String(reference.getMonth() + 1).padStart(2, '0');
  const day = String(reference.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Soma ou subtrai dias corridos a partir de uma data civil YYYY-MM-DD ou Date local. */
export function addDaysLocalISO(baseDate: string | Date, days: number): string {
  const date = typeof baseDate === 'string' ? parseLocalDate(baseDate) : new Date(baseDate.getTime());
  if (!date) return getLocalTodayISO();
  date.setDate(date.getDate() + days);
  return getLocalTodayISO(date);
}

/** Converte YYYY-MM-DD (ou ISO completo) em Date no início do dia local. */
export function parseLocalDate(value: string | null | undefined): Date | null {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  const ymd = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) {
    const year = Number(ymd[1]);
    const month = Number(ymd[2]) - 1;
    const day = Number(ymd[3]);
    const parsed = new Date(year, month, day, 0, 0, 0, 0);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const isoYmd = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (isoYmd) {
    const parsed = new Date(Number(isoYmd[1]), Number(isoYmd[2]) - 1, Number(isoYmd[3]), 0, 0, 0, 0);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

/** Formata string YYYY-MM-DD ou ISO em dd/mm/aaaa no fuso local sem shift de -1 dia. */
export function formatLocalDateBR(value: string | null | undefined, emptyFallback = '—'): string {
  if (!value) return emptyFallback;
  const parsed = parseLocalDate(value);
  if (!parsed) return emptyFallback;
  return parsed.toLocaleDateString('pt-BR');
}

/** Formata data e hora completa em pt-BR. */
export function formatDateTimeBR(value: string | null | undefined, emptyFallback = '—'): string {
  if (!value) return emptyFallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return emptyFallback;
  return parsed.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Valida dígitos verificadores de CPF brasileiro (11 dígitos). */
export function isValidCPF(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(digits[i]) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev >= 10) rev = 0;
  if (rev !== Number(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number(digits[i]) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev >= 10) rev = 0;
  return rev === Number(digits[10]);
}

/** Valida dígitos verificadores de CNPJ brasileiro (14 dígitos). */
export function isValidCNPJ(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const calcDigit = (slice: string, weights: number[]) => {
    const sum = slice.split('').reduce((acc, ch, idx) => acc + Number(ch) * weights[idx], 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = calcDigit(digits.slice(0, 12), w1);
  const d2 = calcDigit(digits.slice(0, 13), w2);
  return d1 === Number(digits[12]) && d2 === Number(digits[13]);
}

/** Normaliza telefone brasileiro para URL wa.me evitando duplicação do DDI 55. */
export function formatWhatsAppPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits;
  }
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits.length >= 10 ? digits : null;
}

/** Monta link seguro para envio de mensagem no WhatsApp. */
export function buildWhatsAppUrl(phone: string | null | undefined, text?: string): string | null {
  const normalized = formatWhatsAppPhone(phone);
  if (!normalized) return null;
  const base = `https://wa.me/${normalized}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** Escapa texto arbitrário antes de interpolação em HTML (prevenção contra XSS). */
export function escapeHtml(value: unknown): string {
  const str = String(value ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escapa caracteres especiais de expressão regular. */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Neutraliza prefixos de fórmula antes de exportar células para planilhas Excel/CSV. */
export function sanitizeSpreadsheetCell(value: unknown): string | number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  const str = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}
