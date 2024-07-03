import { ResponsePaginationData } from '@src/interfaces/response.iterface'
import { StoreExt } from '@src/utils/reactExt'
import { SelectProps } from 'antd'
import { action, observable, toJS } from 'mobx'

export interface SelectOptionType {
  id: number
  name: string
  [key: string]: any
}

export type SelectResponse = ResponsePaginationData<SelectOptionType>

export type IPamams = {
  page: number
  size: number
  kw: string
  idList: Array<number>
}

export type IValue = {
  key: number
  value: number
  label: string
}

export interface SelectAllTime {
  selectAll: boolean
  list: Array<number>
}

export interface SelectValue {
  value: number | Array<number> | SelectAllTime
  data: any
}

export interface RequestData {
  list: Array<SelectOptionType>
  index: number
}

export abstract class SelectCommonStore extends StoreExt {
  // 当前请求page记录
  curPage = 1

  // 搜索前的数据缓存
  searchData: RequestData = {
    list: [],
    index: 1,
  }

  // 默认参数
  defaultParmas: IPamams = {
    page: 1,
    size: 40,
    kw: '',
    idList: [],
  }

  // 通用接口变量
  @observable parmas: IPamams = {
    page: 1,
    size: 40,
    kw: '',
    idList: [],
  }

  // 存放数据列表
  @observable selectList: Array<SelectOptionType> = []

  // 是否还有更多数据
  @observable isMore = true

  // 是否在加载数据
  @observable isLoading = false

  // 是否在搜索
  @observable isSearch = false

  // 选择的key
  @observable values!: IValue | Array<IValue> | undefined

  // 针对全选下去掉的值
  @observable deselectValus: Array<IValue> = []

  // 是否为全选
  @observable isSelectAll = false

  // 总数
  @observable total = 0

  /**
   * 更新参数
   * @param {object} data
   * @memberof SelectStore
   */
  @action
  onUpdateParmas = (data: object = {}) => {
    this.parmas = { ...this.parmas, ...data }
    this.getListData(true)
  }

  /**
   * 处理滚动加载
   * @memberof SelectStore
   */
  @action
  onPopupScroll = (e: any) => {
    const curTop = e.target.scrollTop + e.target.offsetHeight
    const targetHei = e.target.scrollHeight - 100
    if (this.isMore && curTop >= targetHei && this.curPage !== this.parmas.page) {
      this.getListData()
    }
  }

  /**
   * 搜索
   * @param {string} value
   * @memberof SelectStore
   */
  @action
  onSearch = (value: string) => {
    if (!!value) {
      if (!this.isSearch) {
        // 搜索之前缓存
        this.isSearch = true
        this.searchData = {
          list: this.selectList,
          index: this.parmas.page,
        }
      }
      this.parmas = { ...this.parmas, kw: value, page: 1 }
      this.getListData(true)
    } else {
      this.onBlur()
    }
  }

  /**
   * 失去焦点
   * @memberof SelectStore
   */
  @action
  onBlur = () => {
    if (this.isSearch) {
      this.parmas = {
        ...this.parmas,
        kw: '',
        page: this.searchData.index,
      }
      this.curPage = 1
      this.selectList = this.searchData.list

      this.isMore = true
      setTimeout(() => {
        this.isSearch = false
        this.searchData = {
          list: [],
          index: 1,
        }
      }, 10)
    }
  }

  /**
   * 处理选择逻辑
   * @param {*} values
   * @param {SelectProps['mode']} mode
   * @memberof SelectStore
   */
  @action
  onHandleChange = (value: any, mode: SelectProps['mode']): SelectValue => {
    if (!mode) {
      this.values = value
      this.onBlur()
    } else {
      const list = (toJS(this.values) || []) as unknown as Array<IValue>
      this.values = [...list, value]
      if (!this.isMore && this.values.length === this.selectList.length && !this.isSearch) {
        this.isSelectAll = true
      }
      this.deselectValus = this.deselectValus.filter((item) => item.value != value.value)
    }
    return this.handleChangeSelect(mode)
  }

  /**
   * 获取数据
   * @memberof SelectStore
   */
  getListData = async (isClear?: boolean) => {
    if (this.isLoading && !this.isMore) return
    this.isLoading = true
    const { page, ...otherParmas } = this.parmas
    const parmas: IPamams = {
      page,
      ...otherParmas,
    }
    this.curPage = page
    const res = await this.requestUrl(parmas)
    if (!!res) {
      const { data, pagination } = res
      const list = data || []
      if (this.isSelectAll && (!isClear || !!parmas?.kw)) {
        const kList = (toJS(this.values) || []) as unknown as Array<IValue>
        const dList = [...this.deselectValus.map((item) => item.value), ...kList.map((item) => item.value)]
        const selectAllList = this.handleSelectValue(list).filter((item) => !dList.includes(item.value))
        this.values = [...kList, ...selectAllList]
      }
      this.selectList = isClear ? list : [...toJS(this.selectList), ...list]
      if (pagination.current_page >= pagination.total_page) {
        this.isMore = false
      }
      this.parmas = {
        ...this.parmas,
        page: page + 1,
      }
    }
    this.isLoading = false
  }

  /**
   * 处理传递参数
   * @memberof SelectStore
   */
  @action
  handleValueData = async (value: any, mode?: SelectProps['mode']) => {
    const vList: any = mode ? value : [Number(value)]
    const params: IPamams = { ...this.defaultParmas, ...this.parmas, idList: vList, page: 1 }
    const res = await this.requestUrl(params)
    if (res) {
      const { data } = res
      const list = data || []
      const arr: any = list
        ?.filter?.((item) => vList.includes(item.id))
        .map((item) => {
          return {
            key: item.id,
            value: item.id,
            label: item.name,
          }
        })
      this.values = arr
    }
  }

  /**
   * 处理全选
   * @memberof SelectStore
   */
  @action
  handleSelectAll = (isCheck: boolean, mode: SelectProps['mode']): SelectValue => {
    this.isSelectAll = isCheck
    if (isCheck) {
      const list = this.handleSelectValue(toJS(this.selectList))
      this.values = list
    } else {
      this.values = []
    }
    this.deselectValus = []
    return this.handleChangeSelect(mode)
  }

  /**
   * 处理取消选择的
   * @param {*} value
   * @memberof SelectStore
   */
  @action
  onDeselect = (value: any, mode?: SelectProps['mode']): SelectValue => {
    if (mode && this.values) {
      const list = (toJS(this.values) || []) as unknown as Array<IValue>
      this.values = list.filter((item) => item.value != value.value)
    } else {
      this.values = []
    }
    this.deselectValus = [...toJS(this.deselectValus), value]
    if (!this.isMore && this.deselectValus.length === this.selectList.length && !this.isSearch) {
      this.isSelectAll = false
    }
    return this.handleChangeSelect(mode)
  }

  /**
   * 清除
   * @memberof SelectCommonStore
   */
  @action
  onHandleClear = () => {
    this.values = []
    this.isSelectAll = false
  }

  /**
   * 清除
   * @memberof SelectCommonStore
   */
  @action
  clearData = () => {
    this.isSelectAll = false
    this.values = undefined
    this.isMore = true
    this.curPage = 1
    this.parmas = this.defaultParmas
    this.searchData = {
      list: [],
      index: 1,
    }
  }

  /**
   * 处理Form表单
   * @memberof SelectStore
   */
  handleChangeSelect = (mode?: SelectProps['mode']): SelectValue => {
    const newValue = mode
      ? [...toJS(this.values as unknown as Array<IValue>)].map((item: any) => item.value)
      : [this.values?.value]
    const data = toJS(this.selectList).filter((item) => newValue.includes(item.id))
    const obj = {
      selectAll: this.isSelectAll,
      list: toJS(this.deselectValus).map((item) => item.value),
    }
    return {
      value: mode ? (this.isSelectAll ? obj : newValue) : newValue[0],
      data: !!mode ? data : data[0],
    }
  }

  /**
   *  处理选择
   * @param {Array<SelectOptionType>} list
   * @memberof SelectStore
   */
  handleSelectValue = (list: Array<SelectOptionType>) => {
    return list.map((item) => {
      return {
        key: item.id,
        value: item.id,
        label: item.name,
      }
    })
  }

  /**
   * 用于对外调用的接口
   * @param {*} parmas
   * @memberof SelectStore
   */
  abstract requestUrl(parmas: IPamams): Promise<SelectResponse | null>
}
