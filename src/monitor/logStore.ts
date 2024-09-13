import { BehaviorItem, IMetrics, TransportCategory } from './interfaces/util.interface'

// 排除
const noList = [TransportCategory.PREF, TransportCategory.RV]

/**
 * 存储常规上报数据
 * @export
 * @class MetricsStore 抽象类-抽象方法
 */
export default abstract class LogStore {
  // 用于存储日志
  private logList: IMetrics[] = []
  // 用于存储用户行为
  private behaviorList: BehaviorItem[] = []
  // 当前日志上报是否发生完成
  public isOver = true

  /**
   * 添加日志
   * @param {IMetrics} value
   * @memberof LogStore
   */
  add = (value: IMetrics): void => {
    // 排除不能作为用户行为的数据
    if (!noList.includes(value.category) && !!value.monitorId) {
      this.push({
        type: value.category,
        monitorId: value.monitorId,
      })
    }
    this.logList.push(value)
    this.handlerCommon()
  }

  /**
   * 获取日志并删除已上报的数据
   * @memberof LogStore
   */
  getLog = (): IMetrics[] => {
    const logs: IMetrics[] = []
    const list = this.logList.filter((item, index: number) => {
      if (index < 10) {
        logs.push(logs)
      }
      return index >= 10
    })
    this.logList = [...list]
    return logs
  }

  /**
   * 添加用户行为并保存最大长度为200 可以配置
   * @param {BehaviorItem} value
   * @memberof LogStore
   */
  push(value: BehaviorItem) {
    if (this.behaviorList.length < 200) {
      this.behaviorList.push(value)
    } else {
      this.behaviorList.shift() // 删除数组第一个元素
      this.behaviorList.push(value) // 添加最新元素
    }
  }

  /**
   * 获取所有的行为数据
   * @return {*}
   * @memberof LogStore
   */
  getList(): BehaviorItem[] {
    return this.behaviorList
  }

  /**
   * 处理通用逻辑，抽象类的抽象方法
   * @param {(MetricsName | string)} key
   * @memberof MetricsStore
   */
  abstract handlerCommon(): void
}
