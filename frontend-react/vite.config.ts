import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        // Isto diz ao Vite para "escutar" em todas as interfaces de rede,
        // o que o torna acessível através de localhost, IP e nomes de anfitrião personalizados.
        host: true,
        // Garante que o Vite use a porta correta dentro do container.
        port: 5173, 
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});