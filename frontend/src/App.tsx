import { Route, Routes } from 'react-router';
import { BarraSuperior } from './components/BarraSuperior';
import { Cenario } from './components/Cenario';
import { Lobby } from './pages/Lobby';
import { NaoEncontrada } from './pages/NaoEncontrada';
import { Partida } from './pages/Partida';
import { Regras } from './pages/Regras';

export function App() {
  return (
    <>
      <Cenario />
      <BarraSuperior />
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/partida/:codigo" element={<Partida />} />
        <Route path="/regras" element={<Regras />} />
        <Route path="*" element={<NaoEncontrada />} />
      </Routes>
    </>
  );
}
