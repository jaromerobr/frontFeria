import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  /**
   * La app se publica en https://nodo.com.ec/feria/, no en la raiz.
   * Vite usa esto para prefijar los assets del build y para
   * import.meta.env.BASE_URL, que es lo que lee src/assets.js.
   *
   * Si algun dia se mueve de carpeta, se cambia aqui y nada mas.
   */
  base: process.env.VITE_BASE_PATH ?? '/feria/',

  plugins: [react()],
  server: {
    host: true, // permite abrir el totem desde otra maquina de la red (Jetson)
    port: 5173,
  },
});
