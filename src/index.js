const path = require("path");
const fs = require("fs-extra");
const request = require('request')

export default function remoteModulePlugin() {
  // const basePath = __dirname
  const basePath = process.cwd()
  const localPath = `.remote_module`
  const downloadCache = {}

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

  function downloadFile(remoteUrl) {
    if (downloadCache[remoteUrl]) return
    downloadCache[remoteUrl] = true

    const local = getLocalFileByUrl(remoteUrl)
    return new Promise((resolve, reject) => {
      let stream = fs.createWriteStream(local);
      request(remoteUrl).pipe(stream).on("close", function (err, data) {
        if (err) reject(err)
        console.log(`${remoteUrl} download success`)

        // 文件写入后添加一个延迟，避免触发热更新
        setTimeout(() => {
          resolve(local)
          downloadCache[remoteUrl] = false
        }, 100)
      });
    })
  }

  function isRemoteModuleId(id) {
    return /@remote\//.test(id)
  }

  ensureDir()


  const virtualModuleId = '@vite-plugin-remote-module'
  const resolvedVirtualModuleId = '\0' + virtualModuleId

  const sdk = `
export function loadRemoteComponent(url) {
  return import(\`./@remote/\${url}?suffix=.js\`).then(ans => {
    return ans.default
  })
}
  `

  return {
    name: "vite-plugin-remote-module",
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
    async resolveId(id, importer, options) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
      if (isRemoteModuleId(id)) {
        const url = parseUrl(id)
        if (!url) return id
        const local = getLocalFileByUrl(url)
        // 如果本地能找个这个模块，就不再下载了
        const resolution = await this.resolve(url, importer, {skipSelf: true, ...options});
        if (resolution && fs.ensureFileSync(local)) return local

        return downloadFile(url)
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return sdk
      }
    }
  };
}
