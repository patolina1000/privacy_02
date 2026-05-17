// Armazena pix_copia_cola por transaction id para gerar QR localmente.
const pixColaMap = new Map<string, string>()

export function savePixCola(id: string, pixCopiaECola: string) {
  pixColaMap.set(id, pixCopiaECola)
}

export function getPixCola(id: string): string | undefined {
  return pixColaMap.get(id)
}
