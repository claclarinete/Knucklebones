import { Route, Routes } from 'react-router';
import { Cadastro } from './pages/Cadastro';
import { Historico } from './pages/Historico';
import { Lobby } from './pages/Lobby';
import { Login } from './pages/Login';
import { NaoEncontrada } from './pages/NaoEncontrada';
import { Partida } from './pages/Partida';
import { Regras } from './pages/Regras';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Lobby />} />
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/partida/:codigo" element={<Partida />} />
      <Route path="/historico" element={<Historico />} />
      <Route path="/regras" element={<Regras />} />
      <Route path="*" element={<NaoEncontrada />} />
    </Routes>
  );
}
