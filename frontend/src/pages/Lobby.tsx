import { useState, type FormEvent } from 'react';
import { PainelBot } from '../components/PainelBot';
import { apelidoValido, salvarApelido, TAMANHO_APELIDO, useApelido } from '../hooks/useApelido';
import { useBuscaDePartida } from '../hooks/useBuscaDePartida';
import './Lobby.css';

const MENSAGENS_DA_FILA = {
  conectando: 'Conectando ao servidor...',
  enviando: 'Entrando na fila...',
  esperando: 'Aguardando adversário...',
};

export function Lobby() {
  const salvo = useApelido();
  const [apelido, setApelido] = useState(salvo);
  const { modo, fase, erro, entrarNaFila, jogarContraBot, cancelar } = useBuscaDePartida();
  const valido = apelidoValido(apelido);

  function aoDigitar(valor: string) {
    setApelido(valor);
    if (apelidoValido(valor)) salvarApelido(valor);
  }

  function aoEntrarNaFila(evento: FormEvent) {
    evento.preventDefault();
    entrarNaFila(apelido.trim());
  }

  return (
    <main>
      <div className="lobby__topo">
        <h1>Olá, {salvo || 'visitante'}!</h1>
        <p className="lobby__chamada">Escolha seu próximo duelo.</p>
        <label htmlFor="apelido">Apelido (opcional)</label>
        <input
          id="apelido"
          value={apelido}
          maxLength={TAMANHO_APELIDO}
          autoComplete="nickname"
          disabled={modo !== null}
          aria-invalid={!valido}
          aria-describedby={valido ? undefined : 'erro-apelido'}
          onChange={(e) => aoDigitar(e.target.value)}
        />
        {!valido && (
          <p id="erro-apelido" className="lobby__erro">
            Use apenas letras, números, espaço, hífen ou sublinhado.
          </p>
        )}
      </div>

      <div className="lobby__paineis">
        <PainelBot
          aoJogar={(dificuldade) => jogarContraBot(dificuldade, apelido.trim())}
          andamento={modo === 'bot' ? 'Preparando a partida...' : undefined}
          aoCancelar={cancelar}
          erro={erro?.modo === 'bot' ? erro.mensagem : undefined}
          desabilitado={!valido}
        />

        <section className="painel" aria-labelledby="titulo-online">
          <h2 id="titulo-online" className="painel__titulo">
            Jogar online
          </h2>
          {modo === 'fila' ? (
            <>
              <span className="lobby__ampulheta" aria-hidden="true" />
              <p role="status">{MENSAGENS_DA_FILA[fase]}</p>
              <p>Se preferir não esperar, jogue contra o bot.</p>
              <button type="button" className="botao botao--perigo" onClick={cancelar}>
                Cancelar
              </button>
            </>
          ) : (
            <form onSubmit={aoEntrarNaFila}>
              <p>Entre na fila e enfrente outra pessoa.</p>
              {erro?.modo === 'fila' && (
                <p role="alert" className="lobby__erro">
                  {erro.mensagem}
                </p>
              )}
              <button type="submit" className="botao botao--jogador" disabled={!valido}>
                Entrar na fila
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
