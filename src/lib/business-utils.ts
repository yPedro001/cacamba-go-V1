import type { Cliente } from '@/store/useAppStore'

/**
 * Retorna o nome de um cliente pelo ID.
 * Centralizado aqui para evitar duplicação entre páginas.
 */
export function getClientName(clienteId: string, clientes: Cliente[]): string {
  return clientes.find(c => c.id === clienteId)?.nome || 'Cliente Desconhecido'
}

/**
 * Formata um valor numérico como moeda BRL.
 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Retorna o código de uma caçamba pelo ID.
 */
export function getCacambaCode(cacambaId: string, cacambas: { id: string; codigo: string }[]): string {
  return cacambas.find(c => c.id === cacambaId)?.codigo || 'C-???'
}

/** Nomes abreviados dos meses em pt-BR, base 0. */
export const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'] as const

/**
 * Sugere o próximo código sequencial para uma caçamba.
 * Ex: Se o prefixo for "C-" e a última for "C-014", retorna "C-015".
 */
export function suggestNextCacambaCode(cacambas: { codigo: string }[], prefix: string = 'C-'): string {
  const regex = new RegExp(`^${prefix}(\\d+)$`, 'i')
  let maxNum = 0

  cacambas.forEach(c => {
    const match = c.codigo.match(regex)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > maxNum) maxNum = num
    }
  })

  const nextNum = maxNum + 1
  const paddedNum = String(nextNum).padStart(3, '0')
  return `${prefix}${paddedNum}`
}
