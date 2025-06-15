import { FN1, HttpMetrics } from './interfaces/util.interface'
import fastJson from 'fast-json-stringify'

// 定义通用的JSON schema
const responseSchema = {
  type: 'object' as const,
  additionalProperties: true,
}

const stringify = fastJson(responseSchema)

/**
 * 安全的JSON序列化，使用fastJson避免多次stringify导致的斜杠问题
 */
const safeStringify = (data: any): string => {
  try {
    // 如果输入已经是字符串，检查是否需要处理多重转义
    if (typeof data === 'string') {
      // 快速检查是否包含转义字符，避免不必要的正则匹配
      if (!data.includes('\\')) {
        return data
      }

      let processedString = data

      // 优化的多重转义检测，使用更简单的条件
      if (data.includes('\\\\"') || (data.startsWith('"') && data.endsWith('"') && data.includes('\\"'))) {
        // 移除最外层的引号（如果存在）
        if (processedString.startsWith('"') && processedString.endsWith('"')) {
          processedString = processedString.slice(1, -1)
        }

        // 一次性修复所有转义，避免多次replace
        processedString = processedString
          .replace(/\\\\\\"/g, '"') // 三重转义 \\\" -> "
          .replace(/\\\\"/g, '"') // 双重转义 \\" -> "
          .replace(/\\"/g, '"') // 单重转义 \" -> "
          .replace(/\\\\/g, '\\') // 修复反斜杠转义
      }

      // 尝试解析修复后的字符串
      try {
        const parsed = JSON.parse(processedString)
        // 如果解析成功，递归处理解析后的对象
        return safeStringify(parsed)
      } catch {
        // 如果解析失败，返回修复后的字符串
        return processedString
      }
    }

    // 使用Map替代WeakSet，提供更好的性能和内存管理
    const processedCache = new Map()
    let cacheCounter = 0
    const MAX_CACHE_SIZE = 100

    /**
     * 递归处理数据，避免多层JSON序列化问题
     */
    const processDataRecursively = (value: any, depth: number = 0): any => {
      // 防止无限递归，设置最大深度
      if (depth > 3) {
        // 减少最大深度，提升性能
        return '[Max Depth Reached]'
      }

      if (value === null || value === undefined) {
        return value
      }

      // 处理基本类型，直接返回
      const valueType = typeof value
      if (valueType !== 'object' && valueType !== 'string') {
        return value
      }

      // 处理字符串类型 - 优化JSON检测
      if (valueType === 'string') {
        // 更严格的JSON字符串检测，避免不必要的解析尝试
        const trimmed = value.trim()
        if (
          trimmed.length < 2 ||
          (!trimmed.startsWith('{') && !trimmed.startsWith('[')) ||
          (!trimmed.endsWith('}') && !trimmed.endsWith(']'))
        ) {
          return value
        }

        try {
          const parsed = JSON.parse(trimmed)
          return processDataRecursively(parsed, depth + 1)
        } catch {
          return value
        }
      }

      // 优化循环引用检测
      if (processedCache.has(value)) {
        return '[Circular Reference]'
      }

      // 限制缓存大小，避免内存泄漏
      if (cacheCounter >= MAX_CACHE_SIZE) {
        processedCache.clear()
        cacheCounter = 0
      }
      processedCache.set(value, true)
      cacheCounter++

      // 处理数组类型
      if (Array.isArray(value)) {
        const maxLength = 50 // 减少数组处理长度
        if (value.length === 0) return []

        const result = new Array(Math.min(value.length, maxLength))
        for (let i = 0; i < result.length; i++) {
          result[i] = processDataRecursively(value[i], depth + 1)
        }

        if (value.length > maxLength) {
          result.push(`[... ${value.length - maxLength} more items]`)
        }
        return result
      }

      // 处理对象类型
      if (valueType === 'object') {
        const keys = Object.keys(value)
        const maxKeys = 30 // 减少对象键处理数量
        const processedObj: Record<string, any> = {}

        const keysToProcess = keys.slice(0, maxKeys)
        for (const key of keysToProcess) {
          processedObj[key] = processDataRecursively(value[key], depth + 1)
        }

        if (keys.length > maxKeys) {
          processedObj['[truncated]'] = `... ${keys.length - maxKeys} more keys`
        }
        return processedObj
      }

      return value
    }

    // 递归处理数据
    const processedData = processDataRecursively(data)

    // 使用fastJson进行最终序列化
    return stringify(processedData)
  } catch (error) {
    // 如果所有处理都失败，返回安全的字符串形式
    if (typeof data === 'string') {
      return data
    }

    try {
      return JSON.stringify(data)
    } catch {
      return String(data)
    }
  }
}

/**
 * 解析query参数
 */
const parseUrlParameter = (searchPath: string) => {
  try {
    const search = (searchPath || window.location.search).match(/\?.*(?=\b|#)/)?.[0]?.replace(/^\?/, '')
    if (!search) return {}

    return search.split('&').reduce((queries: Record<string, string>, param) => {
      const [key, value] = param.split('=')
      queries[key] = value ? decodeURIComponent(value) : ''
      return queries
    }, {})
  } catch {
    return {}
  }
}

/**
 * 解析响应数据
 */
const parseResponse = (response: any) => {
  try {
    const { status, message, result, code, msg, data } = JSON.parse(response)
    let value = null
    if (data) {
      value = typeof data === 'object' ? safeStringify(data) : data
    }
    return {
      status: status || code,
      message: msg || message,
      result: result ? safeStringify(result) : value,
    }
  } catch {
    try {
      return { result: safeStringify(response) }
    } catch {
      return { result: response }
    }
  }
}

/**
 * XMLHttpRequest代理
 */
export const proxyXmlHttp = (sendHandler: FN1 | null | undefined, loadHandler: FN1) => {
  if (!('XMLHttpRequest' in window) || typeof window.XMLHttpRequest !== 'function') return

  const oXMLHttpRequest = window.XMLHttpRequest
  if (!(window as any).oXMLHttpRequest) {
    ;(window as any).oXMLHttpRequest = oXMLHttpRequest
  }

  const CustomXMLHttpRequest = () => {
    try {
      const xhr = new oXMLHttpRequest()
      const { open, send } = xhr
      const metrics: HttpMetrics = {
        method: '',
        url: '',
        queryUrl: '',
        body: null,
        params: {},
        requestTime: 0,
        responseTime: 0,
        status: 0,
        statusText: '',
        response: null,
        zeroTime: 0,
        loadingTime: 0,
        loadedTime: 0,
        interactionTime: 0,
        endTime: 0,
      }

      xhr.open = (method, url: string) => {
        Object.assign(metrics, {
          method,
          queryUrl: url,
          url: url.split('?')[0],
        })
        open.call(xhr, method, url, true)
      }

      xhr.send = (body) => {
        Object.assign(metrics, {
          body,
          params: parseUrlParameter(metrics.queryUrl as string),
          requestTime: Date.now(),
        })
        if (typeof sendHandler === 'function') sendHandler(xhr)
        send.call(xhr, body)
      }

      xhr.addEventListener('readystatechange', () => {
        if (xhr.readyState === 4) {
          const { status, statusText, response } = xhr
          Object.assign(metrics, {
            status,
            statusText,
            response: parseResponse(response),
            responseTime: Date.now(),
          })
          if (typeof loadHandler === 'function') loadHandler(metrics)
        }
      })

      return xhr
    } catch {}
  }

  Object.defineProperty(window, 'XMLHttpRequest', {
    get: () => CustomXMLHttpRequest,
  })
}

/**
 * Fetch代理
 */
export const proxyFetch = (sendHandler: FN1 | null | undefined, loadHandler: FN1) => {
  if (!('fetch' in window) || typeof window.fetch !== 'function') return

  const oFetch = window.fetch
  if (!(window as any).oFetch) {
    ;(window as any).oFetch = oFetch
  }

  ;(window as any).fetch = async (input: any, init: RequestInit) => {
    if (typeof sendHandler === 'function') sendHandler(init)

    const url = (typeof input === 'string' ? input : input?.url) || ''
    const metrics: HttpMetrics = {
      method: init?.method || '',
      url: url.split('?')[0],
      queryUrl: url,
      body: init?.body,
      params: parseUrlParameter(url),
      requestTime: Date.now(),
      responseTime: 0,
      status: 0,
      statusText: '',
      response: null,
      zeroTime: Date.now(),
      loadingTime: 0,
      loadedTime: 0,
      interactionTime: 0,
      endTime: 0,
    }

    try {
      metrics.loadingTime = Date.now()
      const response = await oFetch.call(window, input, init)
      metrics.loadedTime = Date.now()

      const res = response.clone()
      metrics.interactionTime = Date.now()

      const result = await res.text()
      metrics.endTime = Date.now()

      Object.assign(metrics, {
        status: res.status,
        statusText: res.statusText,
        response: parseResponse(result),
        responseTime: Date.now(),
      })

      if (typeof loadHandler === 'function') loadHandler(metrics)
      return response
    } catch (error: any) {
      metrics.endTime = Date.now()
      metrics.responseTime = Date.now()
      metrics.status = 0
      metrics.statusText = error?.message || ''
      metrics.response = { result: error?.message || '' }

      if (typeof loadHandler === 'function') loadHandler(metrics)
      throw error
    }
  }
}
