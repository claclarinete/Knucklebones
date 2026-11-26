import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import { BarraSuperior } from './components/BarraSuperior';
import { Cenario } from './components/Cenario';
import { EstadoDoServidor } from './components/EstadoDoServidor';
import { Lobby } from './pages/Lobby';
import { NaoEncontrada } from './pages/NaoEncontrada';
import { Partida } from './pages/Partida';
import { Regras } from './pages/Regras';

export function App() {
  const { pathname } = useLocation();

  // Cada tela começa no topo, como numa navegação comum.
  useEffect(() => {
    document.documentElement.scrollTop = 0;
  }, [pathname]);

  return (
    <>
      <Cenario />
      <BarraSuperior />
      <EstadoDoServidor />
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/partida/:codigo" element={<Partida />} />
        <Route path="/regras" element={<Regras />} />
        <Route path="*" element={<NaoEncontrada />} />
      </Routes>
    </>
  );
}
