import { useState, type FormEvent } from 'react';
import { apelidoValido, salvarApelido, TAMANHO_APELIDO, useApelido } from '../hooks/useApelido';
import { useFila } from '../hooks/useFila';
import './Lobby.css';

const MENSAGENS = {
  conectando: 'Conectando ao servidor...',
  entrando: 'Entrando na fila...',
  esperando: 'Aguardando adversário...',
};

export function Lobby() {
  const salvo = useApelido();
  const [apelido, setApelido] = useState(salvo);
  const { fase, erro, entrar, cancelar } = useFila();
  const valido = apelidoValido(apelido);

  function aoDigitar(valor: string) {
    setApelido(valor);
    if (apelidoValido(valor)) salvarApelido(valor);
  }

  function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    if (valido) entrar(apelido.trim());
  }

  return (
    <main className="lobby">
      <h1>Olá, {salvo || 'visitante'}!</h1>
      <p className="lobby__chamada">Escolha seu próximo duelo.</p>

      <section className="painel lobby__painel" aria-labelledby="titulo-online">
        <h2 id="titulo-online" className="painel__titulo">
          Jogar online
        </h2>
        {fase === 'parado' ? (
          <form onSubmit={aoEnviar} noValidate>
            <p>Entre na fila e enfrente outra pessoa.</p>
            <label htmlFor="apelido">Apelido (opcional)</label>
            <input
              id="apelido"
              value={apelido}
              maxLength={TAMANHO_APELIDO}
              autoComplete="nickname"
              aria-invalid={!valido}
              aria-describedby={valido ? undefined : 'erro-apelido'}
              onChange={(e) => aoDigitar(e.target.value)}
            />
            {!valido && (
              <p id="erro-apelido" className="lobby__erro">
                Use apenas letras, números, espaço, hífen ou sublinhado.
              </p>
            )}
            {erro && (
              <p role="alert" className="lobby__erro">
                {erro}
              </p>
            )}
            <button type="submit" className="botao botao--jogador" disabled={!valido}>
              Entrar na fila
            </button>
          </form>
        ) : (
          <>
            <span className="lobby__ampulheta" aria-hidden="true" />
            <p role="status">{MENSAGENS[fase]}</p>
            <button type="button" className="botao botao--perigo" onClick={cancelar}>
              Cancelar
            </button>
          </>
        )}
      </section>
    </main>
  );
}
