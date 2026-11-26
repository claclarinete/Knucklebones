export const TAMANHO_CODIGO = 6;

/** O código usa letras e números, sem 0, O, 1 e I, que se confundem. */
export function limparCodigo(texto: string) {
  return texto.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, '').slice(0, TAMANHO_CODIGO);
}

export function codigoCompleto(codigo: string) {
  return codigo.length === TAMANHO_CODIGO && limparCodigo(codigo) === codigo;
}
