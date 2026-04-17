/**
 * Utilitário para geração de Payload Pix (BR Code) estático seguindo o padrão EMVCo/Bacen.
 * Versão 3: Foco em compatibilidade máxima e simplicidade.
 */

function crc16(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let crc = 0xFFFF;
  const polynomial = 0x1021;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= (bytes[i] << 8);
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

export function generatePixPayload(key: string, amount: number): string {
  if (!key) return '';

  // 1. Limpeza e Formatação da Chave
  let formattedKey = key.trim();
  const digitsOnly = formattedKey.replace(/\D/g, '');
  
  // Detecção e tratamento de Celular (Brasil)
  if (digitsOnly.length >= 10 && digitsOnly.length <= 11 && !formattedKey.includes('@')) {
    formattedKey = `+55${digitsOnly}`;
  } else if (digitsOnly.length === 11 || digitsOnly.length === 14) {
    // CPF ou CNPJ
    formattedKey = digitsOnly;
  }
  // E-mail e Chave Aleatória são usados como estão

  // --- MONTAGEM DO PAYLOAD ---

  // 00: Payload Format Indicator
  let payload = formatField('00', '01');

  // 26: Merchant Account Information
  const gui = formatField('00', 'br.gov.bcb.pix');
  const keyField = formatField('01', formattedKey);
  payload += formatField('26', `${gui}${keyField}`);

  // 52: Merchant Category Code (0000 = Not Specific)
  payload += formatField('52', '0000');

  // 53: Transaction Currency (986 = BRL)
  payload += formatField('53', '986');

  // 54: Transaction Amount (Se > 0)
  if (amount > 0) {
    payload += formatField('54', amount.toFixed(2));
  }

  // 58: Country Code
  payload += formatField('58', 'BR');

  // 59: Merchant Name
  // Usar um valor fixo seguro para evitar problemas com nomes reais do perfil
  payload += formatField('59', 'PIX');

  // 60: Merchant City
  // Usar um valor fixo seguro
  payload += formatField('60', 'SAO PAULO');

  // 62: Additional Data Field (TXID)
  // O TXID é obrigatório em muitos bancos, mesmo que seja '***' para estáticos
  payload += formatField('62', formatField('05', '***'));

  // 63: CRC16
  payload += '6304';
  payload += crc16(payload);

  return payload;
}
