import fs from 'fs'
import path from 'path'
import axios from 'axios'
import FormData from 'form-data'
import archiver from 'archiver'

const PLUGIN_NAME = 'UploadSourceMapPlugin'
const DEFAULT_PATTERNS = [/\.map$/]

class UploadSourceMapPlugin {
  constructor(options) {
    this.options = options
    this.pathName = `./${Date.now()}.zip`
  }

  /**
   * Upload sourcemap files
   */
  async uploadFile({ url, path, requestOption = {} }) {
    const { data = {}, header = {}, other = {} } = requestOption
    const formData = new FormData()

    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value)
    })

    formData.append('file', fs.createReadStream(path))

    await axios({
      ...other,
      url,
      method: 'post',
      data: formData,
      headers: {
        ...formData.getHeaders(),
        ...header,
      },
    })
  }

  /**
   * Read directory recursively and find files matching patterns
   */
  readDir(dirPath, patterns = DEFAULT_PATTERNS) {
    const filesContent = []

    const readSingleFile = (currentPath) => {
      const files = fs.readdirSync(currentPath)

      files.forEach((filePath) => {
        const fullPath = path.resolve(currentPath, filePath)
        const stats = fs.statSync(fullPath)

        if (stats.isDirectory()) {
          readSingleFile(fullPath)
          return
        }

        if (stats.isFile() && patterns.some((pattern) => pattern.test(filePath))) {
          filesContent.push(fullPath)
        }
      })
    }

    readSingleFile(dirPath)
    return filesContent
  }

  /**
   * Delete file
   */
  deleteFile(filePath) {
    fs.unlink(filePath, () => {
      console.info(`File ${filePath} deleted`)
    })
  }

  /**
   * Get type of value
   */
  getType(value) {
    return Object.prototype.toString
      .call(value)
      .match(/\[object (.*?)\]/)[1]
      .toLowerCase()
  }

  /**
   * Validate options
   */
  validateOptions({ url, uploadPath, patterns }) {
    if (!url || !uploadPath) {
      throw new Error('Missing required parameters: url and uploadPath')
    }

    if (this.getType(url) !== 'string') {
      throw new Error('Parameter "url" must be a string')
    }

    if (this.getType(uploadPath) !== 'string') {
      throw new Error('Parameter "uploadPath" must be a string')
    }

    if (patterns && this.getType(patterns) !== 'array') {
      throw new Error('Parameter "patterns" must be an array')
    }
  }

  apply(compiler) {
    const { url, uploadPath, patterns, requestOption } = this.options

    this.validateOptions({ url, uploadPath, patterns })

    compiler.hooks.afterEmit.tapPromise(PLUGIN_NAME, async () => {
      const archive = archiver('zip', {
        gzip: true,
        zlib: { level: 9 },
      })

      archive.on('error', (err) => {
        throw err
      })

      const sourceMapPaths = this.readDir(uploadPath, patterns)

      archive.on('end', async () => {
        console.info('Files packed successfully, uploading...')

        await this.uploadFile({
          url,
          path: this.pathName,
          requestOption,
        })

        // Cleanup
        this.deleteFile(this.pathName)
        sourceMapPaths.forEach(this.deleteFile)
      })

      archive.pipe(fs.createWriteStream(this.pathName))

      // Add files to archive
      sourceMapPaths.forEach((filePath) => {
        archive.append(fs.createReadStream(filePath), {
          name: `./${filePath.replace(uploadPath, '')}`,
        })
      })

      archive.finalize()
    })
  }
}

module.exports = {
  UploadSourceMapPlugin,
}
