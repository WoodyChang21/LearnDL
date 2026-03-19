import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const rawMlApiUrl = env.VITE_ML_API_URL?.trim() || 'http://localhost:8000/model_api'
  const parsedMlApiUrl = new URL(rawMlApiUrl)
  const proxyPath = parsedMlApiUrl.pathname.replace(/\/$/, '') || '/model_api'

  return {
    plugins: [
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler']],
        },
      }),
      tailwindcss(),
    ],
    server: {
      proxy: {
        [proxyPath]: {
          target: parsedMlApiUrl.origin,
          changeOrigin: true,
          secure: parsedMlApiUrl.protocol === 'https:',
        },
      },
    },
  }
})
