import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'

import remotePlugin from './remotePlugin'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    remotePlugin()
  ]
})
