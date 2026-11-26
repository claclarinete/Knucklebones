import { useApelido } from '../hooks/useApelido';
import { BotaoCopiar } from './BotaoCopiar';
import './SalaDeEspera.css';

export function SalaDeEspera({ code, aoCancelar }: { code: string; aoCancelar: () => void }) {
  const apelido = useApelido() || 'Visitante';
  const link = `${window.location.origin}/partida/${code}`;

  return (
    <section className="painel sala" aria-labelledby="titulo-sala">
      <h1 id="titulo-sala" className="painel__titulo">
        Sala criada
      </h1>
      <p>Mande o código ou o link para seu amigo entrar.</p>

      <p className="sala__codigo" aria-label={`Código da sala: ${code.split('').join(' ')}`}>
        {code.split('').map((letra, i) => (
          <span key={i} aria-hidden="true">
            {letra}
          </span>
        ))}
      </p>
      <BotaoCopiar texto={code} rotulo="Copiar código" />

      <label className="sala__rotulo" htmlFor="link-convite">
        Link de convite
      </label>
      <div className="sala__link">
        <input id="link-convite" readOnly value={link} onFocus={(e) => e.target.select()} />
        <BotaoCopiar texto={link} rotulo="Copiar link" className="botao botao--neutro" />
      </div>

      <h2 className="sala__rotulo">Jogadores 1/2</h2>
      <ul className="sala__jogadores">
        <li className="sala__voce">
          <span>{apelido} (você)</span>
          <strong>Pronto</strong>
        </li>
        <li role="status">Aguardando adversário...</li>
      </ul>
      <p className="sala__nota">
        A partida começa sozinha quando o segundo jogador entrar. Quem começa é sorteado.
      </p>
      <button type="button" className="botao botao--perigo" onClick={aoCancelar}>
        Cancelar sala
      </button>
    </section>
  );
}
