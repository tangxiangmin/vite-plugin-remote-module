<script setup>
import {onMounted, shallowRef} from 'vue'
import {loadRemoteComponent} from '@vite-plugin-remote-module';

const componentList = [
  {id: 1, name: 'demo', url: 'http://localhost:3000/demo.vue'},
  {id: 2, name: 'demo2', url: 'http://localhost:3000/demo2.vue'},
  {id: 3, name: 'demo3', url: 'http://localhost:3000/demo3.vue'},
  {id: 4, name: 'sub_demo4', url: 'http://localhost:3000/sub/demo4.vue'},
]

// function loadRemoteComponent(url) {
//   const uri = new URL(url)
//   const {host, pathname} = uri
//
//   let task
//   if (process.env.NODE_ENV === 'development') {
//     task = import(`./@remote/${url}?suffix=.js`)
//   } else {
//     // todo 貌似只会加载一层
//     const modules = import.meta.glob('../.remote_module/**/*.*');
//     const file = `../.remote_module/${host}${pathname}`
//     let module = modules[file]
//     task = module && module() || Promise.reject(new Error(`${file}模块不存在`))
//   }
//
//   return task.then(ans => {
//     return ans.default
//   })
// }

//
// function loadRemoteComponent(url) {
//   return import(`@remote/http://localhost:3000/demo.vue`).then(ans => {
//     return ans.default
//   })
// }
const compRef = shallowRef(null)

// async function loadDemo1() {
//   const ans = await import('@remote/http://localhost:3000/demo.vue')
//   // const ans = await import('./components/HelloWorld.vue')
//   compRef.value = ans.default
// }

async function loadComp(item) {
  const {url} = item
  compRef.value = await loadRemoteComponent(url)
}

onMounted(() => {
  loadComp(componentList[0])
})

</script>

<template>
  <div class="preview">
    <div class="preview_sd">
      组件列表 <br>

      <!--      <button @click="loadDemo1">demo1</button>-->
      <div v-for="item in componentList" :key="item.id">
        <button @click="loadComp(item)">{{ item.name }}</button>
      </div>
    </div>
    <div class="preview_mn">
      <component :is="compRef" v-if="compRef"></component>
    </div>
  </div>
</template>

<style lang="scss">
.preview {
  display: flex;
  width: 500px;
  margin: 100px auto;

  &_sd {
    padding: 10px;
    border: 1px solid #000;
    margin-right: 10px;
  }

  &_mn {
    flex: 1;
    border: 1px solid #000;
    height: 200px;
  }
}

</style>
