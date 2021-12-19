<script setup>
import {shallowRef} from 'vue'
import Demo from '@remote/http://localhost:3000/demo.vue'
import {loadRemoteComponent} from '@vite-plugin-remote-module';

const componentList = [
  {id: 1, name: 'demo', url: 'http://localhost:3000/demo.vue'},
  {id: 2, name: 'demo2', url: 'http://localhost:3000/demo2.vue'},
  {id: 3, name: 'demo3', url: 'http://localhost:3000/demo3.vue'},
]
const compRef = shallowRef(null)
//
// function loadRemoteComponent(url) {
//   return import(`@remote/http://localhost:3000/demo.vue`).then(ans => {
//     return ans.default
//   })
// }

// async function loadDemo1() {
//   const ans = await import('@remote/http://localhost:3000/demo.vue')
//   // const ans = await import('./components/HelloWorld.vue')
//   compRef.value = ans.default
// }

async function loadComp(item) {
  const {url} = item
  compRef.value = await loadRemoteComponent(url)
}

</script>

<template>

  <Demo/>
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
