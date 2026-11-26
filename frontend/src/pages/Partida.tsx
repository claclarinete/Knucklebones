import { Link, useParams } from 'react-router';
import { SalaDeEspera } from '../components/SalaDeEspera';
import { useSala, type MotivoDeErro } from '../hooks/useSala';
import { limparCodigo } from '../services/codigo';

const ERROS: Record<MotivoDeErro, string> = {
  not_found: 'Sala não encontrada',
  full: 'Sala cheia',
  invalid_token: 'Não foi possível retomar esta partida',
  invalid_payload: 'Não foi possível entrar na sala',
};

function SalaDaPartida({ code }: { code: string }) {
  const { sala, cancelar } = useSala(code);

  if (sala.fase === 'esperando') {
    return (
      <main>
        <SalaDeEspera code={code} aoCancelar={cancelar} />
      </main>
    );
  }

  if (sala.fase === 'erro') {
    return (
      <main>
        <section className="painel">
          <h1>{ERROS[sala.motivo]}</h1>
          <p>Confira o código ou peça um novo convite.</p>
          <Link to="/" className="botao">
            Voltar para o lobby
          </Link>
        </section>
      </main>
    );
  }

  // O tabuleiro e as jogadas entram com a tela da partida.
  return (
    <main>
      <section className="painel">
        <h1>Partida</h1>
        <p>Sala {code}</p>
        <p role="status">{sala.fase === 'entrando' ? 'Entrando na sala...' : 'Partida iniciada!'}</p>
        <Link to="/" className="botao">
          Voltar para o lobby
        </Link>
      </section>
    </main>
  );
}

export function Partida() {
  const code = (useParams().codigo ?? '').toUpperCase();
  // Um código maior ou com caracteres inválidos não corresponde a nenhuma sala.
  return <SalaDaPartida key={code} code={limparCodigo(code) === code ? code : ''} />;
}
