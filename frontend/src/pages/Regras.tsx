import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Dado } from '../components/Dado';
import { Tabuleiro } from '../components/Tabuleiro';
import type { Die } from '../types/jogo';
import './Regras.css';

const EXEMPLOS: { nome: string; dados: Die[]; conta: string }[] = [
  { nome: 'Trio', dados: [4, 4, 4], conta: '4 × 9 = 36' },
  { nome: 'Dupla', dados: [4, 4, 2], conta: '4 × 4 + 2 = 18' },
  { nome: 'Nenhum igual', dados: [1, 2, 3], conta: '1 + 2 + 3 = 6' },
];

function Regra({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="painel regra" aria-label={titulo}>
      <h2 className="painel__titulo painel__titulo--destaque">{titulo}</h2>
      {children}
    </section>
  );
}

export function Regras() {
  return (
    <main className="regras">
      <h1>Como jogar</h1>
      <p className="regras__intro">Cinco regras e você já pode jogar.</p>

      <Regra titulo="1. O tabuleiro">
        <p>
          Cada jogador tem 3 colunas com 3 espaços cada. O seu tabuleiro fica embaixo, o do
          adversário em cima.
        </p>
        <Tabuleiro nome="Exemplo de tabuleiro" colunas={[[5], [], [2]]} />
      </Regra>

      <Regra titulo="2. Sua vez">
        <p>
          Você recebe um dado de 6 faces já rolado e escolhe uma das suas colunas que ainda tenha
          espaço.
        </p>
        <Dado valor={3} />
      </Regra>

      <Regra titulo="3. Destruição">
        <p>
          Ao colocar um dado, todos os dados de mesmo valor na coluna correspondente do adversário
          são removidos. Só daquela coluna.
        </p>
        <p>Exemplo: o adversário tem 4, 4 e 2, e você coloca um 4 na mesma coluna.</p>
        <div className="regra__comparacao">
          <figure>
            <figcaption>Antes</figcaption>
            <Dado valor={4} ameacado />
            <Dado valor={4} ameacado />
            <Dado valor={2} />
          </figure>
          <figure>
            <figcaption>Depois</figcaption>
            <Dado valor={2} />
          </figure>
        </div>
      </Regra>

      <Regra titulo="4. Pontuação">
        <p>
          Cada coluna soma <strong>valor × quantidade²</strong> para cada valor diferente. O total é
          a soma das 3 colunas.
        </p>
        <ul className="regra__exemplos">
          {EXEMPLOS.map(({ nome, dados, conta }) => (
            <li key={nome}>
              <h3>{nome}</h3>
              <div>
                {dados.map((valor, i) => (
                  <Dado
                    key={i}
                    valor={valor}
                    repetidos={dados.filter((outro) => outro === valor).length}
                  />
                ))}
              </div>
              <p>{conta}</p>
            </li>
          ))}
        </ul>
      </Regra>

      <Regra titulo="5. Fim de jogo">
        <p>
          A partida acaba quando um dos tabuleiros fica cheio. Vence quem tiver mais pontos.
          Pontuações iguais dão empate.
        </p>
      </Regra>

      <Link to="/" className="botao">
        Bora jogar
      </Link>
    </main>
  );
}
