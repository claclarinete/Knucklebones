import { useState } from 'react';

export function BotaoCopiar({ texto, rotulo, className = 'botao' }: { texto: string; rotulo: string; className?: string }) {
  const [aviso, setAviso] = useState('');

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setAviso('Copiado!');
    } catch {
      setAviso('Não foi possível copiar. Selecione e copie o texto.');
    }
  }

  return (
    <div>
      <button type="button" className={className} onClick={copiar}>
        {rotulo}
      </button>
      <p role="status" className="copiar__aviso">
        {aviso}
      </p>
    </div>
  );
}
