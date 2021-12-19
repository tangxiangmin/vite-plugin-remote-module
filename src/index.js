const path = require("path");
const fs = require("fs-extra");
const request = require('request')

// todo 新增一些配置项
export default function remoteModulePlugin() {
  // const basePath = __dirname
  const basePath = process.cwd()
  const localPath = `.remote_module`
  const downloadCache = {}
  const resolveIdCache = {}

  function getLocalFileByUrl(remoteUrl) {
    const filename = path.basename(remoteUrl)
    // 排除vite中携带的query参数
    const file = filename.split('?')[0]
    return path.resolve(basePath, localPath, `./${file}`)
  }

  function parseUrl(id) {
    const [url] = id.match(/https?.*?$/igm) || []
    return url
  }

  function ensureDir() {
    const folder = path.resolve(basePath, localPath)
    fs.ensureDirSync(folder)
  }

  // todo FIXME 动态加载时 某些url会重复下载
  function downloadFile(remoteUrl) {
    if (downloadCache[remoteUrl]) return
    downloadCache[remoteUrl] = true

    const local = getLocalFileByUrl(remoteUrl)
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

  ensureDir()

  const virtualModuleId = '@vite-plugin-remote-module'
  const resolvedVirtualModuleId = '\0' + virtualModuleId

  // 暴露一个loadRemoteComponent方法用于动态导入模块
  const sdk = `
export function loadRemoteComponent(url) {
  return import(\`./@remote/\${url}?suffix=.js\`).then(ans => {
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
        // const local = getLocalFileByUrl(url)
        // const resolution = await this.resolve(url, importer, {skipSelf: true, ...options});
        // if (resolution) return local
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
