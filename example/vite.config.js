import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import remotePlugin from '../src/index.js'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: 'es2015'
  },
  plugins: [
    vue(),
    remotePlugin()
  ]
})
