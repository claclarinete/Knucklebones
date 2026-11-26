import { useState } from 'react';
import { useJogada } from '../hooks/useJogada';
import { useResultado } from '../hooks/useResultado';
import type { Die, Difficulty, GameStart, PlayerInfo } from '../types/jogo';
import { Dado } from './Dado';
import { FimDePartida } from './FimDePartida';
import { Legenda } from './Legenda';
import { Placar } from './Placar';
import { Tabuleiro } from './Tabuleiro';
import './MesaDeJogo.css';

const NIVEIS: Record<Difficulty, string> = { easy: 'fácil', medium: 'médio', hard: 'difícil' };

const nomeDe = ({ nickname, bot }: PlayerInfo) => (bot ? `Bot ${NIVEIS[bot]}` : nickname);

function Jogador({ nome, total, voce = false }: { nome: string; total: number; voce?: boolean }) {
  return (
    <p className={voce ? 'jogador jogador--voce' : 'jogador'}>
      <span className="jogador__avatar" aria-hidden="true">
        {nome.charAt(0).toUpperCase()}
      </span>
      <span>{voce ? `${nome} (você)` : nome}</span>
      <strong className="jogador__total">
        <span className="so-leitor">Total: </span>
        {total}
      </strong>
    </p>
  );
}

export function MesaDeJogo({ partida }: { partida: GameStart }) {
  const { estado, erro, minhaVez, podeJogar, jogar } = useJogada(partida);
  const { resultado, revanche, pedirRevanche, voltarAoLobby } = useResultado();
  // Guarda qual resultado foi fechado: o de uma revanche volta a abrir a janela.
  const [fechado, setFechado] = useState<object | null>(null);
  const { you, players, code } = partida;
  const rival = you === 'p1' ? 'p2' : 'p1';
  const bot = players[rival].bot;

  let vez = minhaVez ? 'Sua vez' : 'Vez do adversário';
  if (estado.status === 'paused') vez = 'Partida pausada';
  const acabou = resultado !== null || estado.status === 'finished';
  if (acabou) vez = 'Fim de jogo';

  // Só há ameaça na minha vez e nas colunas em que ainda posso colocar o dado.
  const ameacado = (coluna: number, valor: Die) =>
    !acabou && minhaVez && valor === estado.die && estado.boards[you][coluna].length < 3;

  return (
    <div className="partida">
      <h1 className="so-leitor">Partida</h1>
      <header className="partida__topo">
        <p className="partida__modo">{bot ? 'Contra o bot' : 'Online'} - Sala {code}</p>
        <p role="status" className={minhaVez && !acabou ? 'partida__vez partida__vez--minha' : 'partida__vez'}>
          {vez}
        </p>
      </header>

      <div className="mesa">
        <Jogador nome={nomeDe(players[rival])} total={estado.scores[rival].total} />
        <Tabuleiro
          nome="Tabuleiro do adversário"
          colunas={estado.boards[rival]}
          pontos={estado.scores[rival].columns}
          ameacado={ameacado}
          invertido
        />
        <p className="mesa__divisor" aria-hidden="true">
          vs
        </p>
        <Tabuleiro
          nome="Seu tabuleiro"
          colunas={estado.boards[you]}
          aoJogar={jogar}
          podeJogar={podeJogar && !acabou}
          pontos={estado.scores[you].columns}
        />
        <Jogador nome={nomeDe(players[you])} total={estado.scores[you].total} voce />
      </div>

      <div className="partida__lateral">
        {acabou && (
          <section className="painel dado-da-vez" aria-labelledby="titulo-fim">
            <h2 id="titulo-fim" className="painel__titulo painel__titulo--destaque">
              Partida encerrada
            </h2>
            <div className="modal__acoes">
              {resultado && (
                <button type="button" className="botao" onClick={() => setFechado(null)}>
                  Ver resultado
                </button>
              )}
              <button type="button" className="botao botao--neutro" onClick={voltarAoLobby}>
                Voltar ao lobby
              </button>
            </div>
          </section>
        )}
        {!acabou && estado.die && (
          <section className="painel dado-da-vez" aria-labelledby="titulo-dado">
            <h2 id="titulo-dado" className="painel__titulo painel__titulo--destaque">
              {minhaVez ? 'Seu dado' : 'Dado do adversário'}
            </h2>
            <Dado valor={estado.die} />
            <p>{minhaVez ? 'Toque numa das suas colunas com espaço.' : 'Aguarde a jogada.'}</p>
            {erro && (
              <p role="alert" className="dado-da-vez__erro">
                {erro}
              </p>
            )}
          </section>
        )}
        <Placar
          linhas={[
            { nome: nomeDe(players[you]), pontos: estado.scores[you], voce: true },
            { nome: nomeDe(players[rival]), pontos: estado.scores[rival] },
          ]}
        />
        <Legenda />
      </div>

      {resultado && fechado !== resultado && (
        <FimDePartida
          resultado={resultado}
          voce={you}
          nomes={{ p1: nomeDe(players.p1), p2: nomeDe(players.p2) }}
          revanche={revanche}
          aoPedirRevanche={pedirRevanche}
          aoVoltar={voltarAoLobby}
          aoFechar={() => setFechado(resultado)}
        />
      )}
    </div>
  );
}
