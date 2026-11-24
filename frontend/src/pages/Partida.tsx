import { useParams } from 'react-router';

export function Partida() {
  const { codigo } = useParams();

  return (
    <main>
      <h1>Partida</h1>
      <p>Sala {codigo}</p>
    </main>
  );
}
