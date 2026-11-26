import type { Score } from '../types/jogo';
import './Placar.css';

interface LinhaDoPlacar {
  nome: string;
  pontos: Score;
  voce?: boolean;
}

export function Placar({ linhas }: { linhas: LinhaDoPlacar[] }) {
  return (
    <section className="painel placar" aria-labelledby="titulo-placar">
      <h2 id="titulo-placar" className="painel__titulo painel__titulo--destaque">
        Placar
      </h2>
      <table aria-labelledby="titulo-placar">
        <thead>
          <tr className="so-leitor">
            <th scope="col">Jogador</th>
            <th scope="col">Coluna 1</th>
            <th scope="col">Coluna 2</th>
            <th scope="col">Coluna 3</th>
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map(({ nome, pontos, voce }, linha) => (
            <tr key={linha} className={voce ? 'placar__voce' : undefined}>
              <th scope="row">{nome}</th>
              {pontos.columns.map((valor, coluna) => (
                <td key={coluna}>{valor}</td>
              ))}
              <td className="placar__total">{pontos.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
