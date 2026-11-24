import { Link } from 'react-router';

export function NaoEncontrada() {
  return (
    <main>
      <h1>Página não encontrada</h1>
      <Link to="/">Voltar para o lobby</Link>
    </main>
  );
}
