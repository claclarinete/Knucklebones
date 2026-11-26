import { useJogada } from '../hooks/useJogada';
import type { Difficulty, GameStart, PlayerInfo } from '../types/jogo';
import { Dado } from './Dado';
import { Tabuleiro } from './Tabuleiro';
import './MesaDeJogo.css';

const NIVEIS: Record<Difficulty, string> = { easy: 'fácil', medium: 'médio', hard: 'difícil' };

const nomeDe = ({ nickname, bot }: PlayerInfo) => (bot ? `Bot ${NIVEIS[bot]}` : nickname);

function Jogador({ nome, voce = false }: { nome: string; voce?: boolean }) {
  return (
    <p className={voce ? 'jogador jogador--voce' : 'jogador'}>
      <span className="jogador__avatar" aria-hidden="true">
        {nome.charAt(0).toUpperCase()}
      </span>
      {voce ? `${nome} (você)` : nome}
    </p>
  );
}

export function MesaDeJogo({ partida }: { partida: GameStart }) {
  const { estado, erro, minhaVez, podeJogar, jogar } = useJogada(partida);
  const { you, players, code } = partida;
  const rival = you === 'p1' ? 'p2' : 'p1';
  const bot = players[rival].bot;

  let vez = minhaVez ? 'Sua vez' : 'Vez do adversário';
  if (estado.status === 'paused') vez = 'Partida pausada';
  if (estado.status === 'finished') vez = 'Fim de jogo';

  return (
    <div className="partida">
      <h1 className="so-leitor">Partida</h1>
      <header className="partida__topo">
        <p className="partida__modo">{bot ? 'Contra o bot' : 'Online'} - Sala {code}</p>
        <p role="status" className={minhaVez ? 'partida__vez partida__vez--minha' : 'partida__vez'}>
          {vez}
        </p>
      </header>

      <div className="mesa">
        <Jogador nome={nomeDe(players[rival])} />
        <Tabuleiro
          nome="Tabuleiro do adversário"
          colunas={estado.boards[rival]}
          invertido
        />
        <p className="mesa__divisor" aria-hidden="true">
          vs
        </p>
        <Tabuleiro
          nome="Seu tabuleiro"
          colunas={estado.boards[you]}
          aoJogar={jogar}
          podeJogar={podeJogar}
        />
        <Jogador nome={nomeDe(players[you])} voce />
      </div>

      {estado.die && (
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
    </div>
  );
}
