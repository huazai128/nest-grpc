import { FN1, HttpMetrics } from './interfaces/util.interface'
import fastJson from 'fast-json-stringify'

/**
 * HTTP 代理：只包装一次 XMLHttpRequest / fetch，多个采集回调共享同一层。
 * 业务请求本身不受影响；单个回调失败不会中断其余监听。
 */

// 定义通用的JSON schema，允许任意响应字段
const responseSchema = {
  type: 'object' as const,
  additionalProperties: true,
}

const stringify = fastJson(responseSchema)

/**
 * 安全的 JSON 序列化，使用 fastJson 避免多次 stringify 导致的斜杠问题。
 * @param {*} data
 * @return {string}
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
 * 解析响应为 status / message / result 摘要，解析失败则整包作为 result。
 * @param {*} response
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

/** XHR send 前回调列表（预留扩展） */
const xhrSendHandlers: FN1[] = []
/** XHR 完成回调，采集接口日志 / HTTP 错误 */
const xhrLoadHandlers: FN1[] = []
/** 是否已替换 window.XMLHttpRequest，避免重复包装 */
let xhrProxied = false

/** fetch 发起前回调列表 */
const fetchSendHandlers: FN1[] = []
/** fetch 完成 / 失败回调 */
const fetchLoadHandlers: FN1[] = []
/** 是否已替换 window.fetch */
let fetchProxied = false

/**
 * 依次通知采集回调，单个失败不影响其余监听和业务请求。
 * @param {FN1[]} handlers
 * @param {unknown} payload
 */
const notify = (handlers: FN1[], payload: unknown) => {
  handlers.forEach((handler) => {
    try {
      handler(payload)
    } catch {
      // 单个采集回调失败不影响其余监听和业务请求
    }
  })
}

/**
 * XMLHttpRequest 代理。多次调用只包装一次，额外 handler 追加到列表。
 * 使用原生构造器采集，上报通道走 oXMLHttpRequest，避免监控自己的上报请求。
 * @param {(FN1 | null | undefined)} sendHandler
 * @param {FN1} loadHandler
 */
export const proxyXmlHttp = (sendHandler: FN1 | null | undefined, loadHandler: FN1) => {
  if (!('XMLHttpRequest' in window) || typeof window.XMLHttpRequest !== 'function') return
  if (typeof sendHandler === 'function') xhrSendHandlers.push(sendHandler)
  if (typeof loadHandler === 'function') xhrLoadHandlers.push(loadHandler)
  if (xhrProxied) return
  xhrProxied = true

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
        queryUrl: '',
        body: null,
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

      xhr.open = (method: string, url: string, async?: boolean, username?: string | null, password?: string | null) => {
        Object.assign(metrics, {
          method,
          queryUrl: url,
        })
        const isAsync = async !== false
        return open.call(xhr, method, url, isAsync, username as string, password as string)
      }

      xhr.send = (body) => {
        Object.assign(metrics, {
          body,
          requestTime: Date.now(),
        })
        notify(xhrSendHandlers, xhr)
        return send.call(xhr, body)
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
          notify(xhrLoadHandlers, metrics)
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
 * Fetch 代理。多次调用只包装一次，额外 handler 追加到列表。
 * 通过 clone() 读响应文本，不消耗业务侧 body。
 * @param {(FN1 | null | undefined)} sendHandler
 * @param {FN1} loadHandler
 */
export const proxyFetch = (sendHandler: FN1 | null | undefined, loadHandler: FN1) => {
  if (!('fetch' in window) || typeof window.fetch !== 'function') return
  if (typeof sendHandler === 'function') fetchSendHandlers.push(sendHandler)
  if (typeof loadHandler === 'function') fetchLoadHandlers.push(loadHandler)
  if (fetchProxied) return
  fetchProxied = true

  const oFetch = window.fetch
  if (!(window as any).oFetch) {
    ;(window as any).oFetch = oFetch
  }

  ;(window as any).fetch = async (input: any, init: RequestInit) => {
    notify(fetchSendHandlers, init)

    const url = (typeof input === 'string' ? input : input?.url) || ''
    const metrics: HttpMetrics = {
      method: init?.method || '',
      queryUrl: url,
      body: init?.body,
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

      notify(fetchLoadHandlers, metrics)
      return response
    } catch (error: any) {
      metrics.endTime = Date.now()
      metrics.responseTime = Date.now()
      metrics.status = 0
      metrics.statusText = error?.message || ''
      metrics.response = { result: error?.message || '' }

      notify(fetchLoadHandlers, metrics)
      throw error
    }
  }
}
