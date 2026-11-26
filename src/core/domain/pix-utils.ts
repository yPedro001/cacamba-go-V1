/**
 * Utilitário para geração de Payload Pix (BR Code) estático seguindo o padrão EMVCo/Bacen.
 */

import { isValidCPF } from '@/lib/domain-helpers';

function crc16(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let crc = 0xFFFF;
  const polynomial = 0x1021;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i] << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc <<= 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

function formatField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function sanitizePixAscii(input: string | undefined, maxLen: number, fallback: string): string {
  if (!input || !input.trim()) return fallback;
  const clean = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen)
    .toUpperCase();
  return clean || fallback;
}

/**
 * Normaliza a chave Pix segundo regras Bacen:
 * - E-mail e EVP (UUID) preservados como estão;
 * - Chaves explícitas com `+55` preservadas;
 * - 14 dígitos numéricos tratados como CNPJ;
 * - 11 dígitos validados como CPF primeiro (`isValidCPF`); se não for CPF válido ou tiver 10 dígitos, trata como telefone `+55`.
 */
export function normalizePixKey(key: string): string {
  const raw = key.trim();
  if (!raw) return '';

  if (raw.includes('@')) return raw.toLowerCase();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)) {
    return raw.toLowerCase();
  }
  if (raw.startsWith('+')) {
    return `+${raw.slice(1).replace(/\D/g, '')}`;
  }

  const digitsOnly = raw.replace(/\D/g, '');

  // Se o usuário digitou explicitamente com máscara de telefone (ex: (11) 99999-9999), trata como telefone
  const looksLikeFormattedPhone = /^\(?\d{2}\)?\s*9?\d{4}-?\d{4}$/.test(raw) && !raw.includes('.');
  if (looksLikeFormattedPhone && (digitsOnly.length === 10 || digitsOnly.length === 11)) {
    return `+55${digitsOnly}`;
  }

  if (digitsOnly.length === 14) {
    return digitsOnly;
  }

  if (digitsOnly.length === 11) {
    if (isValidCPF(digitsOnly)) {
      return digitsOnly;
    }
    return `+55${digitsOnly}`;
  }

  if (digitsOnly.length === 10) {
    return `+55${digitsOnly}`;
  }

  return raw;
}

export function generatePixPayload(
  key: string,
  amount: number,
  merchantName?: string,
  merchantCity?: string
): string {
  if (!key) return '';

  const formattedKey = normalizePixKey(key);
  if (!formattedKey) return '';

  const safeMerchantName = sanitizePixAscii(merchantName, 25, 'CACAMBAGO');
  const safeMerchantCity = sanitizePixAscii(merchantCity, 15, 'BRASIL');

  let payload = formatField('00', '01');

  const gui = formatField('00', 'br.gov.bcb.pix');
  const keyField = formatField('01', formattedKey);
  payload += formatField('26', `${gui}${keyField}`);

  payload += formatField('52', '0000');
  payload += formatField('53', '986');

  if (Number.isFinite(amount) && amount > 0) {
    payload += formatField('54', amount.toFixed(2));
  }

  payload += formatField('58', 'BR');
  payload += formatField('59', safeMerchantName);
  payload += formatField('60', safeMerchantCity);
  payload += formatField('62', formatField('05', '***'));

  payload += '6304';
  payload += crc16(payload);

  return payload;
}
