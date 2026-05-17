// Armazena IDs de pagamentos confirmados em memória.
// No Render (Node.js persistente) o processo fica vivo — os dados não somem entre requests.
const paidIds = new Set<string>()

export function markPaid(id: string) {
  paidIds.add(id)
}

export function isPaid(id: string): boolean {
  return paidIds.has(id)
}
