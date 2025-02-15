import { FN1, HttpMetrics } from './interfaces/util.interface'

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
      value = typeof data === 'object' ? JSON.stringify(data) : data
    }
    return {
      status: status || code,
      message: msg || message,
      result: result ? JSON.stringify(result) : value,
    }
  } catch {
    try {
      return { result: JSON.stringify(response) }
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
