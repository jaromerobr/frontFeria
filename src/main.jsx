import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Fuentes empaquetadas en el build: el totem no depende de internet.
import '@fontsource/bungee/400.css';
import '@fontsource/baloo-2/600.css';
import '@fontsource/baloo-2/800.css';

import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
