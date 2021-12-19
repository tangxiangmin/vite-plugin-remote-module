const path = require("path");
const fs = require("fs-extra");
const request = require('request')

const localPath = `.remote_module`

function getLocalFileByUrl(remoteUrl) {
  const filename = path.basename(remoteUrl)
  // 排除vite中携带的query参数
  const file = filename.split('?')[0]
  return path.resolve(__dirname, localPath, `./${file}`)
}

function parseUrl(id) {
  const [url] = id.match(/https?.*?$/igm) || []
  return url
}

function ensureDir() {
  const folder = path.resolve(__dirname, localPath)
  fs.ensureDirSync(folder)
}

const downloadCache = {}

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

export default function remoteModulePlugin() {
  ensureDir()

  function isRemoteModuleId(id) {
    return /@remote\//.test(id)
  }

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
      if (isRemoteModuleId(id)) {
        const url = parseUrl(id)
        if (!url) return id
        const local = getLocalFileByUrl(url)
        // 如果本地能找个这个模块，就不再下载了
        const resolution = await this.resolve(url, importer, {skipSelf: true, ...options});
        if (resolution) return local

        return downloadFile(url)
      }
    },
  };
}
