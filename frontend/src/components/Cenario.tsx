import type { CSSProperties } from 'react';
import { ESTRELAS, VAGALUMES } from './Cenario.dados';
import './Cenario.css';

/** Posição na cena do protótipo, convertida em pixels da tela pelo CSS. */
function posicao(x: number, y: number, indice: number) {
  return { '--x': x, '--y': y, '--i': indice } as CSSProperties;
}

/** Paisagem animada de fundo. É decorativa, por isso fica fora da árvore de acessibilidade. */
export function Cenario() {
  return (
    <div className="cenario" aria-hidden="true">
      <div className="cenario__cena">
        {ESTRELAS.map(({ x, y, tamanho, cor, cruz }, i) => (
          <span
            key={`${x}-${y}`}
            className={cruz ? 'estrela estrela--cruz' : 'estrela'}
            style={{ ...posicao(x, y, i), '--tamanho': tamanho, color: cor } as CSSProperties}
          />
        ))}
        <span className="estrela-cadente" />
        <div className="lua" />
        <div className="sol" />
      </div>
      <div className="camada camada--distante" />
      <div className="camada camada--proxima" />
      <div className="camada camada--arvores" />
      <div className="cenario__cena">
        {VAGALUMES.map(({ x, y }, i) => (
          <span key={`${x}-${y}`} className="vagalume" style={posicao(x, y, i)} />
        ))}
      </div>
    </div>
  );
}
