import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // permite abrir el totem desde otra maquina de la red (Jetson)
    port: 5173,
  },
});
