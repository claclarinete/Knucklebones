import { Link, NavLink } from 'react-router';
import { useApelido } from '../hooks/useApelido';
import './BarraSuperior.css';

export function BarraSuperior() {
  const apelido = useApelido();

  return (
    <header className="barra">
      <Link to="/" className="barra__marca">
        <img src="/favicon.svg" alt="" width="32" height="32" />
        Knucklebones
      </Link>
      <nav aria-label="Principal" className="barra__links">
        <NavLink to="/" end className="barra__link">
          Jogar
        </NavLink>
        <NavLink to="/regras" className="barra__link">
          Regras
        </NavLink>
      </nav>
      {apelido && (
        <p className="barra__jogador">
          <span className="barra__avatar" aria-hidden="true">
            {apelido.charAt(0).toUpperCase()}
          </span>
          {apelido}
        </p>
      )}
    </header>
  );
}
