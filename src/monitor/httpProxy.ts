import { FN1, HttpMetrics } from './interfaces/util.interface'

/**
 * 解析query 参数
 * @param {string} searchPath
 * @return {*}
 */
const parseUrlParameter = (searchPath: string) => {
  try {
    let search = (searchPath || window.location.search).match(/\?.*(?=\b|#)/) as any
    search && (search = search[0].replace(/^\?/, ''))
    if (!search) return {}
    const queries = {} as any,
      params = search?.split('&')

    for (const i in params) {
      const param = params?.[i]?.split('=')
      queries[param[0]] = param[1] ? decodeURIComponent(param[1]) : ''
    }
    return queries
  } catch (error) {
    return {}
  }
}

/**
 * 调用 proxyXmlHttp 即可完成全局监听 XMLHttpRequest
 * @param {(FN1 | null | undefined)} sendHandler
 * @param {FN1} loadHandler
 */
export const proxyXmlHttp = (sendHandler: FN1 | null | undefined, loadHandler: FN1) => {
  if ('XMLHttpRequest' in window && typeof window.XMLHttpRequest === 'function') {
    const oXMLHttpRequest = window.XMLHttpRequest
    if (!(window as any).oXMLHttpRequest) {
      ;(window as any).oXMLHttpRequest = oXMLHttpRequest
    }

    // oXMLHttpRequest 为原生的 XMLHttpRequest，可以用以 SDK 进行数据上报，区分业务
    const CustomXMLHttpRequest = () => {
      // 覆写 window.XMLHttpRequest
      try {
        const xhr = new oXMLHttpRequest()
        const { open, send } = xhr
        let metrics = {} as HttpMetrics
        xhr.open = (method, url: string) => {
          metrics.method = method
          metrics.queryUrl = url
          metrics.url = url.split('?')[0]
          open.call(xhr, method, url, true)
        }

        xhr.send = (body) => {
          const urlParmas = parseUrlParameter(metrics.queryUrl as string) || {}
          metrics.body = body
          metrics.params = urlParmas
          metrics.requestTime = new Date().getTime()
          if (typeof sendHandler === 'function') sendHandler(xhr)
          send.call(xhr, body)
        }
        xhr.addEventListener('readystatechange', () => {
          // 根据 readyState 的值执行相应的操作
          switch (xhr.readyState) {
            case 0: // 未初始化
              metrics.zeroTime = new Date().getTime()
              // console.log('未初始化')
              break
            case 1: // 正在加载
              metrics.loadingTime = new Date().getTime()
              // console.log('正在加载')
              break
            case 2: // 已加载
              metrics.loadedTime = new Date().getTime()
              // console.log('已加载')
              break
            case 3: // 交互中
              metrics.interactionTime = new Date().getTime()
              // console.log('交互中')
              break
            case 4: // 完成
              metrics.endTime = new Date().getTime()
              const { status, statusText, response } = xhr
              let res: any
              try {
                const { status: s, message, result, code, msg, data } = JSON.parse(response)
                let value: any
                if (data && data instanceof Object) {
                  value = JSON.stringify(data)
                } else if (typeof data == 'string') {
                  value = data
                }
                res = { status: s || code, message: msg || message, result: result ? JSON.stringify(result) : value }
              } catch (error) {
                try {
                  const newR = JSON.stringify(response)
                  res = { result: newR }
                } catch (error) {
                  res = { result: response }
                }
              }
              metrics = {
                ...metrics,
                status: status,
                statusText,
                response: res,
                responseTime: new Date().getTime(),
              }
              if (typeof loadHandler === 'function') loadHandler(metrics)
              break
          }
        })
        return xhr
      } catch (error) {}
    }

    Object.defineProperty(window, 'XMLHttpRequest', {
      get() {
        return CustomXMLHttpRequest
      },
    })
  }
}

/**
 * 调用 proxyFetch 即可完成全局监听 fetch
 * @param {(FN1 | null | undefined)} sendHandler
 * @param {FN1} loadHandler
 */
export const proxyFetch = (sendHandler: FN1 | null | undefined, loadHandler: FN1) => {
  if ('fetch' in window && typeof window.fetch === 'function') {
    const oFetch = window.fetch
    if (!(window as any).oFetch) {
      ;(window as any).oFetch = oFetch
    }
    ;(window as any).fetch = async (input: any, init: RequestInit) => {
      // init 是用户手动传入的 fetch 请求互数据，包括了 method、body、headers，要做统一拦截数据修改，直接改init即可
      if (typeof sendHandler === 'function') sendHandler(init)
      let metrics = {} as HttpMetrics
      metrics.method = init?.method || ''
      const url = (input && typeof input !== 'string' ? input?.url : input) || '' // 请求的url
      metrics.url = url.split('?')[0]
      const urlParmas = parseUrlParameter(url as string)
      metrics.body = init?.body || undefined
      metrics.params = urlParmas
      metrics.requestTime = new Date().getTime()
      return oFetch.call(window, input, init).then(async (response) => {
        // clone 出一个新的 response,再用其做.text(),避免 body stream already read 问题
        const res = response.clone()
        const result = await res.text()
        let resData: any
        try {
          resData = JSON.parse(result || '{}')
        } catch (error) {
          resData = { result: resData }
        }
        metrics = {
          ...metrics,
          status: res.status,
          statusText: res.statusText,
          response: { statue: resData?.statue, message: resData?.message, result: JSON.stringify(resData?.result) },
          responseTime: new Date().getTime(),
        }
        if (typeof loadHandler === 'function') loadHandler(metrics)
        return response
      })
    }
  }
}
