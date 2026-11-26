import type { Cliente } from '@/core/domain/types'
import { escapeRegExp } from '@/lib/domain-helpers'

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
  }).format(Number.isFinite(value) ? value : 0)
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
 * Escapa caracteres especiais no prefixo para evitar SyntaxError em RegExp.
 */
export function suggestNextCacambaCode(cacambas: { codigo: string }[], prefix: string = 'C-'): string {
  const safePrefix = escapeRegExp(prefix)
  const regex = new RegExp(`^${safePrefix}(\\d+)$`, 'i')
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
