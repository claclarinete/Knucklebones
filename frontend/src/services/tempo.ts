/** Segundos no formato minutos:segundos, como 0:42. */
export function formatarTempo(segundos: number) {
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`;
}
