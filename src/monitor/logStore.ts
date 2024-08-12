import { IMetrics, MetricsName } from './interfaces/util.interface'

/**
 * 存储常规上报数据
 * @export
 * @class MetricsStore 抽象类-抽象方法
 */
export default abstract class LogStore {
  public state: Map<MetricsName | string, IMetrics> = new Map()
  public keys: Array<MetricsName | string> = []
  public isOver: boolean = true

  set = (key: MetricsName | string, value: IMetrics): void => {
    this.state.set(key, value)
    this.handlerCommon(key)
  }

  add = (key: MetricsName | string, value: IMetrics): void => {
    const keyValue = this.state.get(key)
    this.state.set(key, keyValue ? keyValue.concat([value]) : [value])
    this.handlerCommon(key)
  }

  get = (key: MetricsName | string): IMetrics | undefined => {
    const value = this.state.get(key)
    this.state.delete(key)
    this.keys = this.keys.filter((item) => item !== key)
    return value
  }

  has = (key: MetricsName | string): boolean => {
    return this.state.has(key)
  }

  clear = () => {
    this.state.clear()
  }

  getValues = (): IMetrics => {
    // Map 转为 对象 返回
    return Object.fromEntries(this.state)
  }

  /**
   * 处理通用逻辑，抽象类的抽象方法
   * @param {(MetricsName | string)} key
   * @memberof MetricsStore
   */
  abstract handlerCommon(key: MetricsName | string): void
}
