import { useSyncExternalStore } from 'react';

export const CHAVE_APELIDO = 'knucklebones:apelido';

function assinar(aoMudar: () => void) {
  window.addEventListener('storage', aoMudar);
  return () => window.removeEventListener('storage', aoMudar);
}

/** Apelido salvo no navegador, ou texto vazio quando a pessoa não escolheu um. */
export function useApelido(): string {
  return useSyncExternalStore(assinar, () => localStorage.getItem(CHAVE_APELIDO)?.trim() ?? '');
}
