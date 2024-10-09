import React, { Component, ErrorInfo } from 'react'

interface IState {
  hasError: boolean
}

/**
 * 用于处理React 组件 错误，并上报错误
 * @template T
 * @param {*} WrappedComponent
 * @param {string} name 组件名称， 在webpack打包后无法获取组件name，传递组件名称、能够快速定位问题
 * @return {*}
 */
function ErrorBoundaryHoc<T extends object>(WrappedComponent: React.FC<T>, name: string) {
  return class extends Component<T, IState> {
    constructor(props: T) {
      super(props)
      this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: any) {
      // 更新 state 使下一次渲染能够显示降级后的 UI
      console.log(error, 'ErrorBoundaryHoc')
      return { hasError: true }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
      console.log(error, name, errorInfo, '此处可以上报')
    }

    render() {
      if (this.state.hasError) {
        // 你可以自定义降级后的 UI 并渲染
        return <h1>功能出错了，已上报！</h1>
      }

      return <WrappedComponent {...(this.props as T)} />
    }
  }
}

export default ErrorBoundaryHoc
