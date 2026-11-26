import type { ComponentProps } from 'react';
import { Dado } from './Dado';
import './Legenda.css';

const ITENS: [ComponentProps<typeof Dado>, string][] = [
  [{ valor: 2, repetidos: 2 }, 'Dupla: os dois valem em dobro'],
  [{ valor: 3, repetidos: 3 }, 'Trio: os três valem o triplo'],
  [{ valor: 4, ameacado: true }, 'Será destruído se você jogar nessa coluna'],
];

export function Legenda() {
  return (
    <section className="painel legenda" aria-labelledby="titulo-legenda">
      <h2 id="titulo-legenda" className="painel__titulo">
        Legenda
      </h2>
      <ul>
        {ITENS.map(([dado, texto]) => (
          <li key={texto}>
            <span aria-hidden="true">
              <Dado {...dado} />
            </span>
            {texto}
          </li>
        ))}
      </ul>
    </section>
  );
}
