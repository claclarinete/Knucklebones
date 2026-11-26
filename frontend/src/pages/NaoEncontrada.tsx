import { Link } from 'react-router';

export function NaoEncontrada() {
  return (
    <main>
      <section className="painel">
        <h1>Página não encontrada</h1>
        <p>O endereço que você abriu não existe.</p>
        <Link to="/" className="botao">
          Voltar para o lobby
        </Link>
      </section>
    </main>
  );
}
