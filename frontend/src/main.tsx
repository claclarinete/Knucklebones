import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import '@fontsource/silkscreen/400.css';
import '@fontsource/silkscreen/700.css';
import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/700.css';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
