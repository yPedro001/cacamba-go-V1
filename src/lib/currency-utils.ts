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
 */
export function parseCurrencyToNumber(formattedValue: string): number {
  if (!formattedValue) return 0;
  
  // Remove tudo que não é dígito ou vírgula/ponto
  const cleanValue = formattedValue.replace(/[^\d,.-]/g, '');
  
  // Se contiver vírgula, assume que é o separador decimal brasileiro
  if (cleanValue.includes(',')) {
    return parseFloat(cleanValue.replace(/\./g, '').replace(',', '.'));
  }
  
  return parseFloat(cleanValue);
}

/**
 * Máscara simples para input: converte entrada numérica bruta em string monetária formatada.
 * Ideal para uso em onChange de inputs controlados.
 */
export function maskCurrency(value: string): string {
  // Remove qualquer caractere que não seja número
  let cleanValue = value.replace(/\D/g, '');
  
  // Converte para centavos
  const valueNumber = Number(cleanValue) / 100;
  
  if (isNaN(valueNumber)) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valueNumber);
}
