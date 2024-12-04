const fs = require('fs')
const p = require('path')
const axios = require('axios')
const FormData = require('form-data')
const initPatterns = [/\.map$/]
const PLUGIN_NAME = 'UploadSourceMapPlugin'
const archiver = require('archiver')

class UploadSourceMapPlugin {
  constructor(options) {
    this.options = options
    this.pathName = `./${Date.now()}.zip`
  }

  /**
   * 上传
   * @param {*} {
   *         url,
   *         path,
   *         requestOption // 配置参数
   *     }
   * @memberof UploadSourceMapPlugin
   */
  async uploadFile({
    url,
    path,
    requestOption, // 配置参数
  }) {
    try {
      const { data = {}, header = {}, other = {} } = requestOption
      let formData = new FormData()
      if (Object.keys(data).length > 0) {
        for (let key in data) {
          formData.append(key, data[key])
        }
      }
      formData.append('file', fs.createReadStream(path))
      const res = await axios({
        ...other,
        url,
        method: 'post',
        data: formData,
        headers: {
          ...formData.getHeaders(),
          ...header,
        },
      })
    } catch (error) {
      throw error
    }
  }

  /**
   * 读取目录
   * @memberof UploadSourceMapPlugin
   */
  readDir(path, patterns) {
    const filesContent = []

    function readSingleFile(path) {
      const files = fs.readdirSync(path)
      files.forEach((filePath) => {
        const wholeFilePath = p.resolve(path, filePath)
        const fileStat = fs.statSync(wholeFilePath)
        // determine whether it is a directory or a file
        if (fileStat.isDirectory()) {
          readSingleFile(wholeFilePath)
        }
        const _patterns = patterns || initPatterns
        if (fileStat.isFile() && _patterns.some((r) => r.test(filePath))) {
          filesContent.push(wholeFilePath)
        }
      })
    }
    readSingleFile(path)
    return filesContent
  }

  /**
   * 删除文件
   * @param {*} path
   * @memberof UploadSourceMapPlugin
   */
  deleteFile(path) {
    fs.unlink(path, () => {})
  }

  /**
   * 验证
   * @param {*} obj
   * @return {*}
   * @memberof UploadSourceMapPlugin
   */
  typeOf(obj) {
    const s = Object.prototype.toString.call(obj)
    return s.match(/\[object (.*?)\]/)[1].toLowerCase()
  }

  apply(compiler) {
    const { url, uploadPath, patterns, requestOption } = this.options

    if (!url || !uploadPath) {
      throw Error('Missing necessary parameters')
    }
    if (!this.typeOf(url) === 'string') {
      throw Error('The "url" parameter type is incorrect')
    }

    if (!this.typeOf(uploadPath) === 'string') {
      throw Error('The "uploadPath" parameter type is incorrect')
    }

    if (patterns && !this.typeOf(patterns) === 'array') {
      throw Error('The "patterns" parameter type is incorrect')
    }
    compiler.hooks.afterEmit.tapPromise(PLUGIN_NAME, async () => {
      const archive = archiver('zip', {
        gzip: true,
        zlib: {
          level: 9,
        },
      })
      archive.on('error', (err) => {
        throw Error(err)
      })
      // 压缩完成后，上传文件
      archive.on('end', async () => {
        console.info('Packed successfully, uploading files now...')
        await this.uploadFile({
          url,
          path: this.pathName,
          requestOption,
        })
        // 删除打包文件
        this.deleteFile(this.pathName)
        // 删除.map文件
        sourceMapPaths.forEach(this.deleteFile)
      })

      archive.pipe(fs.createWriteStream(this.pathName))
      // 获取路径下所有的.map文件
      const sourceMapPaths = this.readDir(uploadPath, patterns)
      // 遍历所有文件，追加到zip 中
      sourceMapPaths.forEach((p) => {
        archive.append(fs.createReadStream(p), {
          name: `./${p.replace(uploadPath, '')}`,
        })
      })
      archive.finalize()
    })
  }
}

module.exports = {
  UploadSourceMapPlugin,
}
