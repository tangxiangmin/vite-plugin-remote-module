vite-plugin-remote-module
===

在vite中通过http链接加载远程模块

相关链接
* [github地址](https://github.com/tangxiangmin/vite-plugin-remote-module)
* 开发文档[使用vite加载远程模块](https://www.shymean.com/article/使用vite加载远程模块)

## 使用

插件注册

```js
// vite.config.js
import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import remoteModulePlugin from 'vite-plugin-remote-module'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    remoteModulePlugin()
  ]
})
```

### 静态加载

```js
import Demo from '@remote/http://localhost:3000/demo.vue'
```

### 异步加载

```js
async function asyncLoadDemo() {
  const ans = await import('@remote/http://localhost:3000/demo.vue')
  compRef.value = ans.default
}
```

### 动态加载

```js
import {loadRemoteComponent} from '@vite-plugin-remote-module';

const componentList = [
  {id: 1, name: 'demo', url: 'http://localhost:3000/demo.vue'},
  {id: 2, name: 'demo2', url: 'http://localhost:3000/demo2.vue'},
  {id: 3, name: 'demo3', url: 'http://localhost:3000/demo3.vue'},
]

async function loadComp(item) {
  const {url} = item
  compRef.value = await loadRemoteComponent(url)
}

loadComp(componentList[0])
loadComp(componentList[1])
loadComp(componentList[2])
```

## 打包

### 一些限制

如果是已经下载到本地的远程模块（静态加载和异步加载），按照常规打包即可

如果是动态加载的模块，需要确保远程模块已经被下载，否则在打包后可能存在找不到对应模块的情况

### 安全性

由于加载远程模块的原理是：将远程模块下载到本地并加载，因此请注意不要加载未信任的远程模块，这可能会造成安全问题！！

## 本地调试

```bash

git clone 仓库

# 安装插件依赖
npm i 

# 安装vite项目依赖
cd example && npm i 

# 启动vite
npm run dev
```

然后浏览器访问vite服务即可
