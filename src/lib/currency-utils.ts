/**
 * Utilitários para manipulação de valores monetários (BRL).
 * Focado em evitar erros de ponto flutuante e garantir formatação consistente.
 */

/**
 * Formata um número para o padrão de moeda brasileiro (BRL).
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Converte uma string formatada em Real (ou com caracteres de máscara) para número.
 * Ex: "R$ 1.234,56" -> 1234.56
 * Ex: "300" -> 300
 * Ex: "300,5" -> 300.5
 */
export function parseCurrencyToNumber(formattedValue: string): number {
  if (!formattedValue) return 0;

  // Remove R$, espaços e outros caracteres que não sejam dígitos, vírgula ou ponto
  const clean = formattedValue.replace(/[R$\s]/g, '');

  if (!clean) return 0;

  // Formato brasileiro com vírgula decimal: "1.234,56" → 1234.56
  if (clean.includes(',')) {
    // Remove pontos de milhar e troca vírgula por ponto decimal
    return parseFloat(clean.replace(/\./g, '').replace(',', '.')) || 0;
  }

  // Sem vírgula: é valor inteiro — "300" → 300.00
  return parseFloat(clean) || 0;
}

/**
 * Máscara inteligente para input de valor monetário.
 *
 * LÓGICA:
 * - Sem vírgula: exibe o número como inteiro com separador de milhar, sem forçar centavos.
 *   Ex: usuário digitou "300" → exibe "300" (não "3,00")
 * - Com vírgula: exibe com centavos conforme digitado.
 *   Ex: "300,5" → "300,5" | "300,50" → "300,50"
 *
 * @param rawInput - O valor bruto digitado pelo usuário
 * @returns Valor formatado para exibição
 */
export function maskCurrencySmart(rawInput: string): string {
  if (!rawInput) return '';

  // Remove R$, espaços e qualquer caractere que não seja dígito, vírgula ou ponto
  let clean = rawInput.replace(/[R$\s]/g, '');

  // Se contém vírgula (separador decimal)
  if (clean.includes(',')) {
    // Mantém apenas a primeira vírgula
    const parts = clean.split(',');
    const intPart = parts[0].replace(/\D/g, '');
    // Limita casas decimais a 2
    const decPart = (parts[1] || '').replace(/\D/g, '').substring(0, 2);

    // Formata parte inteira com separador de milhar
    const intFormatted = intPart
      ? Number(intPart).toLocaleString('pt-BR')
      : '0';

    return `${intFormatted},${decPart}`;
  }

  // Sem vírgula: apenas formata o número inteiro com separadores de milhar
  const digitsOnly = clean.replace(/\D/g, '');
  if (!digitsOnly) return '';

  const num = parseInt(digitsOnly, 10);
  if (isNaN(num)) return '';

  return num.toLocaleString('pt-BR');
}

/**
 * Máscara legada — mantida para compatibilidade. Converte centavos para reais.
 * Ex: "30000" → "R$ 300,00"
 * @deprecated Prefira usar SmartCurrencyInput component
 */
export function maskCurrency(value: string): string {
  // Remove qualquer caractere que não seja número
  const cleanValue = value.replace(/\D/g, '');

  // Converte para centavos
  const valueNumber = Number(cleanValue) / 100;

  if (isNaN(valueNumber)) return 'R$ 0,00';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valueNumber);
}

/**
 * Interpreta o valor exibido pelo maskCurrencySmart e retorna o número real.
 * Ex: "300" → 300.0 | "1.500,50" → 1500.50 | "300,5" → 300.5
 */
export function parseSmartCurrency(displayValue: string): number {
  if (!displayValue) return 0;
  const clean = displayValue.replace(/[R$\s]/g, '').trim();
  if (!clean) return 0;

  if (clean.includes(',')) {
    return parseFloat(clean.replace(/\./g, '').replace(',', '.')) || 0;
  }

  // Sem vírgula: remove pontos de milhar e converte
  return parseFloat(clean.replace(/\./g, '')) || 0;
}
