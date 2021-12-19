
vite-plugin-remote-module
===

在vite中通过http链接加载远程模块

## 使用
```js

```

```App.vue
<script>
import demo from '@remote/http://localhost:9999/demo.vue'
import {}

</script
```

###


动态加载的限制

https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#limitations

* Imports must start with ./ or ../.
* Imports must end with a file extension
* Imports to your own directory must specify a filename pattern
* Globs only go one level deep


