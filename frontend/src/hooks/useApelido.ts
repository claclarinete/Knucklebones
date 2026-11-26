import { useSyncExternalStore } from 'react';

export const CHAVE_APELIDO = 'knucklebones:apelido';
export const TAMANHO_APELIDO = 20;

/** Mesma regra do servidor: letras, números, espaço, hífen e sublinhado. */
export function apelidoValido(apelido: string) {
  return apelido.length <= TAMANHO_APELIDO && /^[\p{L}\p{N} _-]*$/u.test(apelido);
}

export function salvarApelido(apelido: string) {
  localStorage.setItem(CHAVE_APELIDO, apelido.trim());
  // O navegador só avisa as outras abas; este aviso atualiza a aba atual.
  window.dispatchEvent(new Event('storage'));
}

function assinar(aoMudar: () => void) {
  window.addEventListener('storage', aoMudar);
  return () => window.removeEventListener('storage', aoMudar);
}

/** Apelido salvo no navegador, ou texto vazio quando a pessoa não escolheu um. */
export function useApelido(): string {
  return useSyncExternalStore(assinar, () => localStorage.getItem(CHAVE_APELIDO)?.trim() ?? '');
}
