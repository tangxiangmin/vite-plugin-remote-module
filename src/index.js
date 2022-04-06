const path = require("path");
const fs = require("fs-extra");
const request = require('request')

// todo 新增一些配置项
export default function remoteModulePlugin() {
  const basePath = process.cwd()
  const localPath = `node_modules/.remote_module`
  const downloadCache = {}
  const resolveIdCache = {}

  function getLocalFileByUrl(remoteUrl) {
    const url = new URL(remoteUrl)
    const {hostname, pathname, port} = url
    // const filename = path.basename(remoteUrl)
    // 排除vite中携带的query参数
    // const file = filename.split('?')[0]

    // https://github.com/tangxiangmin/vite-plugin-remote-module/issues/1
    // fix windows系统中无法使用英文冒号作为目录名称
    const host = hostname + '_' + port
    return path.resolve(basePath, localPath, `./${host}${pathname}`)
  }

  function parseUrl(id) {
    const [url] = id.match(/https?.*?$/igm) || []
    return url
  }

  // todo FIXME 动态加载时 某些url会重复下载
  function downloadFile(remoteUrl) {
    if (downloadCache[remoteUrl]) return
    downloadCache[remoteUrl] = true

    const local = getLocalFileByUrl(remoteUrl)
    fs.ensureFileSync(local)

    return new Promise((resolve, reject) => {
      // console.log(`start download ${remoteUrl} `)
      let stream = fs.createWriteStream(local);
      try {
        request(remoteUrl).pipe(stream).on("close", function (err, data) {
          if (err) reject(err)
          // 文件写入后添加一个延迟，避免触发热更新
          setTimeout(() => {
            // console.log(`${remoteUrl} download success`)
            downloadCache[remoteUrl] = false
            resolve(local)
          }, 30)
        });
      } catch (e) {
        console.log(e)
      }
    })
  }

  function isRemoteModuleId(id) {
    return /@remote\//.test(id)
  }

  const virtualModuleId = '@vite-plugin-remote-module'
  const resolvedVirtualModuleId = '\0' + virtualModuleId

  // 暴露一个loadRemoteComponent方法用于动态导入模块
  const tempDir = '/' + localPath
  const sdk = `
export function loadRemoteComponent(url) {
  const uri = new URL(url)
  const {hostname, pathname} = uri
  const host = hostname + '_' + port

  let task
  if (process.env.NODE_ENV === 'development') {
    task = import(\`./@remote/\${url}?suffix=.js\`)
  } else {
    // 以项目根目录打包全部的远程模块
    const modules = import.meta.glob('${tempDir}/**/*.*');
    const file = \`${tempDir}/\${host}\${pathname}\`
    let module = modules[file]
    task = module && module() || Promise.reject(new Error(\`\${file}模块不存在\`))
  }

  return task.then(ans => {
    return ans.default
  })
}
  `

  return {
    name: "vite-plugin-remote-module",
    async resolveId(id, importer, options) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
      if (isRemoteModuleId(id)) {
        if (resolveIdCache[id]) return resolveIdCache[id]

        const url = parseUrl(id)
        if (!url) return id
        resolveIdCache[id] = await downloadFile(url)

        return resolveIdCache[id]
      }
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const id = req.url
        if (isRemoteModuleId(id)) {
          const url = parseUrl(id)
          if (url) {
            await downloadFile(url)
            next()
            return
          }
        }
        next()
      })
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return sdk
      }
    }
  };
}
