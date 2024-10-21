/* eslint-disable @typescript-eslint/ban-types */
import { SelectProps } from 'antd'
import { action, autorun, observable, toJS } from 'mobx'

export interface SelectOptionType {
  id: number
  name: string
  expand?: string
}

export type IPamams = {
  index: number | string
  pageSize: number
  kw: string
  idList: Array<number>
  [key: string]: any
}

export type IValue = {
  key: number
  value: number
  label: string
}

export interface SelectAllTime {
  selectAll: boolean
  list: Array<number>
  /**
   * 后端提供的总数，请自行确认无问题后再使用
   */
  totalOnRemote?: number
  /**
   * 后端提供的总数，请自行确认无问题后再使用
   */
  nonPublicSelectNum?: number
}

export interface SelectValue {
  value: number | Array<number> | SelectAllTime
  data: any
}

export interface RequestData {
  list: Array<SelectOptionType>
  index: string
  hasMore: boolean
  total?: number
}

export abstract class SelectCommonStore {
  constructor() {
    autorun(() => {
      if (
        !this.isMore &&
        this.values?.length == this.selectList.length &&
        !this.isSearch &&
        this.showSelectAll &&
        !this.isOnce
      ) {
        this.isOnce = true
        this.isDefaultSelectAll = true
      }
    })
  }
  // 当前请求page记录
  curPage: any = 1

  private isOnce = false

  // 存储搜索前的是否还有数据
  private prevMore = true

  public curKw = ''

  private timer: any

  private mapList = new Map()

  private allTotal = 0

  private searchMap = new Map()

  // 搜索前的数据缓存
  searchData: Omit<RequestData, 'hasMore'> & { selectIds: Array<IValue> } = {
    list: [],
    index: '',
    selectIds: [],
  }

  // 用于记录后端提供的总数，部分接口不一定会有，确认清楚再用
  @observable remoteTotal = 0

  // 默认参数
  defaultParmas: IPamams = {
    index: 1,
    pageSize: 40,
    kw: '',
    idList: [],
  }

  // 通用接口变量
  @observable parmas: IPamams = {
    index: 1,
    pageSize: 40,
    kw: '',
    idList: [],
  }

  @observable userOtherParams: Record<any, any> = {}

  // 默认值
  @observable defaultData?: SelectOptionType

  // 存放数据列表
  @observable selectList: Array<SelectOptionType> = []

  // 用于全选回填排除的ID
  @observable excludeList: any = []

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

  // 是否为全选选中
  @observable isSelectAll = false

  // 总数
  @observable total = 0

  // 是否支持全选状态
  @observable showSelectAll = false

  // 判断是否在编辑
  @observable isEdit = false

  // 是否form表单赋值全选了
  @observable isDefaultSelectAll = false

  // 全选下的分页出发
  @observable allSelectPage = 0

  // 是否为搜索下的全选
  @observable isSearchAll = false

  // 全选时，禁止操作
  @observable allLoading = false

  @observable indeterminateBoo = false

  /**
   * 更新是否可以支持全选
   * @param {boolean} value
   * @memberof SelectCommonStore
   */
  @action
  updateSelectType = (value: boolean) => {
    this.showSelectAll = value
  }

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
    console.log(this.isMore && curTop >= targetHei, this.curPage, this.parmas.index)
    if (this.isMore && curTop >= targetHei && this.curPage !== this.parmas.index) {
      this.getListData()
      if (this.isSelectAll) {
        this.allSelectPage = this.allSelectPage + 1
      }
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
      // console.log(this.showSelectAll, 'showSelectAll')
      this.isSearchAll = false
      this.indeterminateBoo = false
      if (!this.isSearch) {
        // 搜索之前缓存
        this.isSearch = true
        this.prevMore = this.isMore
        this.searchData = {
          list: this.selectList,
          index: String(this.parmas.index),
          selectIds: this.values as Array<IValue>,
        }
      }
      this.parmas = { ...this.parmas, kw: value, index: 1 }
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
      this.curKw = ''
      this.timer && clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        this.parmas = {
          ...this.parmas,
          kw: '',
          index: !isNaN(this.searchData.index) ? Number(this.searchData.index) : this.searchData.index,
        }
        this.curPage = 1
        this.selectList = this.searchData.list
        if (this.isSelectAll) {
          // this.values = this.searchData.selectIds
        }
        this.isMore = this.prevMore
        const list = toJS(this.values)
        if (Array.isArray(list) && list.length && list.length === toJS(this.selectList).length && !this.prevMore) {
          this.isSelectAll = true
        }
        setTimeout(() => {
          this.isSearch = false
          this.prevMore = true
          this.indeterminateBoo = false
          !this.isLoading && (this.isSearchAll = false)
          this.searchData = {
            list: [],
            index: '',
            selectIds: [],
          }
        }, 10)
      }, 300)
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
      // 在搜索选择是，返回data为空，让他验证onBlur
      setTimeout(() => {
        this.onBlur()
      }, 300)
    } else {
      const list = (toJS(this.values) || []) as unknown as Array<IValue>
      this.values = [...list, value]
      if (this.isSearch) {
        const ids = toJS(this.values).map((item) => item.value)
        const sList = toJS(this.selectList).filter((item) => ids.includes(item.id))
        if (sList.length === toJS(this.selectList).length && !this.isMore) {
          this.indeterminateBoo = false
          this.isSearchAll = true
        } else {
          this.indeterminateBoo = true
        }
      }
      if (
        ((!this.isMore && this.values.length === this.selectList.length) || this.values.length === this.allTotal) &&
        !this.isSearch &&
        this.showSelectAll
      ) {
        this.isSelectAll = true
      }
      if (!this.values?.length) {
        this.isSelectAll = false
      }
      if (this.isSelectAll) {
        this.deselectValus = this.deselectValus.filter((item) => item.value != value.value)
      } else {
        this.deselectValus = []
      }
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
    const { index, ...otherParmas } = this.parmas
    const parmas: any = {
      index: index == 1 ? '' : String(index),
      ...this.userOtherParams,
      ...otherParmas,
    }
    this.curPage = index
    if (!!parmas.kw) {
      this.curKw = parmas.kw
    }
    const vList = (Array.isArray(toJS(this.values)) && toJS(this.values)) || []
    const isAll = !!vList?.length && this.showSelectAll && !!parmas.kw && !this.searchMap.has(parmas.kw)
    const res = isAll ? await this.getSearchSelectList(parmas) : await this.requestUrl(parmas)
    if (isAll) {
      const list = this.handleSelectValue(res.list)
      this.searchMap.set(parmas.kw, list || [])
    }
    if (!!res) {
      const list = (res?.list || []) as Array<SelectOptionType>
      const kList = (toJS(this.values) || []) as unknown as Array<IValue>
      if (!!parmas?.kw && !!kList.length) {
        let sList = isAll
          ? list
          : res.hasMore || (!res.hasMore && !!index && index !== 1)
            ? [...toJS(this.selectList), ...list]
            : list
        if (this.searchMap.has(parmas.kw)) {
          sList = this.searchMap.get(parmas.kw)
        }
        const kwList = sList.map((item) => item.id || item.value)
        const lList = kList.map((item) => item.label)
        const isShow = lList.some((name) => name.includes(parmas.kw))
        if (!!kwList.length) {
          const kvList = kList.map((item) => item.value)
          const searchList = [...new Set(kvList.filter((id) => kwList.includes(id)))]
          this.isSearchAll = searchList.length === kwList.length && !!kwList.length
          this.indeterminateBoo = !this.isSearchAll && !!searchList.length
          if (!this.isSearchAll && !this.indeterminateBoo && sList.length >= this.parmas.pageSize) {
            this.indeterminateBoo = isShow
          }
        }
      }
      if (!parmas?.kw && (index == 1 || !index)) {
        this.allTotal = res?.total || 0
      }
      let newList = isClear ? list : [...toJS(this.selectList), ...list]
      if (this.defaultData) {
        const idx = newList.findIndex((item) => item.id === this.defaultData?.id)
        if (idx == -1) {
          newList = [this.defaultData, ...newList]
        }
      }
      this.selectList = newList
      this.isMore = !!res?.hasMore
      if (this.parmas.index === 1 && !this.parmas.kw && res.total) {
        this.remoteTotal = res.total
      }
      this.parmas = {
        ...this.parmas,
        index: res?.index || 1,
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
    if ((value === true || value?.value === true) && (mode == 'multiple' || mode == 'tags')) {
      this.updateExcludeList(value?.excludeList || [])
      setTimeout(() => {
        this.handleSelectAll(true, mode, false)
      }, 1000)
      return
    }
    const vList: any = mode ? value : [Number(value)]
    const params = { ...this.defaultParmas, ...this.parmas, idList: vList, index: '', ...this.userOtherParams }
    if (value === -1) {
      this.values = {
        key: -1,
        value: -1,
        label: '全部',
      }
    } else {
      const res = await this.requestUrl(params)
      if (res) {
        const list: Array<any> = res.list
        // 这里只针对0 如果是其他值会报错
        if ((Array.isArray(value) && value.includes(0)) || value == 0) {
          !!this.defaultData && list.push(this.defaultData)
        }
        const arr: any = list
          ?.filter?.((item) => vList.includes(item.id))
          .map((item) => {
            return {
              key: item.id,
              value: item.id,
              label: item.name,
            }
          })
        this.values = mode ? arr : arr[0]
      }
    }
  }

  /**
   * 处理全选
   * @memberof SelectStore
   */
  @action
  handleSelectAll = async (isCheck: boolean, mode: SelectProps['mode'], isClear = true) => {
    const eList = toJS(this.excludeList)
    this.indeterminateBoo = false
    this.isSearchAll = false
    // 判断是否是搜索中的全选和取消
    if (this.isSearch) {
      // 搜索全选
      this.isSearchAll = isCheck
      let list = this.handleSelectValue(toJS(this.selectList))
      if (this.selectList.length >= this.parmas.pageSize) {
        if (this.searchMap.has(this.parmas.kw)) {
          list = this.searchMap.get(this.parmas.kw)
        } else {
          this.allLoading = true
          const { index, ...otherParmas } = this.parmas
          const parmas: any = {
            index: index == 1 ? '' : String(index),
            ...this.userOtherParams,
            ...otherParmas,
          }
          const data = await this.getAllSelectList(parmas)
          list = this.handleSelectValue(data.list)
          this.allLoading = false
          this.searchMap.set(otherParmas.kw, list)
        }
      }
      const idList = list.map((item) => item.value)
      // 如果是下拉全选
      if (this.isSelectAll) {
        const dList = toJS(this.deselectValus)
        const nList = dList.filter((item) => !idList.includes(item.value))
        if (isCheck) {
          this.deselectValus = nList
        } else {
          const pList = [...nList, ...list]
          if (this.allTotal === pList.length) {
            this.isSelectAll = false
            this.deselectValus = []
          } else {
            this.deselectValus = pList
          }
        }
      }
      if (isCheck) {
        const oValue = toJS(this.values || []) as Array<any>
        const combinedArray = [...oValue, ...list]
        const map = new Map()
        combinedArray.forEach((item) => map.set(item.value, item))
        const uniqueArray = Array.from(map.values())
        this.values = uniqueArray
      } else {
        this.values = toJS([...this.values]).filter((item) => !idList.includes(item.value))
      }
      if (this.allTotal == toJS(this.values).length) {
        this.isSelectAll = true
      }

      this.isSearchAll = false
    } else {
      this.isSelectAll = isCheck
      if (isCheck) {
        const { index, ...otherParmas } = this.parmas
        const parmas: any = {
          index: index == 1 ? '' : String(index),
          ...this.userOtherParams,
          ...otherParmas,
        }
        let list: any[] = []
        if (!this.mapList.has(parmas.itemType)) {
          this.allLoading = true
          const data = await this.getAllSelectList(parmas)
          list = this.handleSelectValue(data.list)
          this.mapList.set(parmas.itemType, list)
          this.allLoading = false
        } else {
          list = this.mapList.get(parmas.itemType)
        }
        if (eList?.length && !isClear) {
          list = list.filter((item) => !eList.includes(item.value))
        }
        this.allTotal = list.length
        this.values = list
      } else {
        this.values = []
        this.allTotal = 0
      }
      if (isClear) {
        this.deselectValus = []
      }
    }
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
    if (this.isSelectAll) {
      this.deselectValus = [...toJS(this.deselectValus), value]
    }
    if (!this.isMore && this.deselectValus.length === this.selectList.length && !this.isSearch) {
      this.isSelectAll = false
    }
    if (this.isSearch) {
      const ids = toJS(this.values).map((item) => item.value)
      const sList = toJS(this.selectList).filter((item) => ids.includes(item.id))
      if (!sList.length && !this.isMore) {
        this.indeterminateBoo = false
      } else {
        this.indeterminateBoo = true
      }

      this.isSearchAll = false
    }
    return this.handleChangeSelect(mode)
  }

  /**
   * 清除
   * @memberof SelectCommonStore
   */
  @action
  clearData = () => {
    this.isSelectAll = false
    this.values = undefined
    this.isMore = this.prevMore
    this.prevMore = true
    this.curPage = 1
    this.parmas = this.defaultParmas
    this.isDefaultSelectAll = false
    this.isSearchAll = false
    this.indeterminateBoo = false
    // if (isClear) {
    //   this.values = []
    // }
    this.searchData = {
      list: [],
      index: '',
      selectIds: [],
    }
  }

  /**
   * 处理Form表单
   * @memberof SelectStore
   */
  @action
  handleChangeSelect = (mode?: SelectProps['mode']): SelectValue => {
    const newValue = mode
      ? [...toJS(this.values as unknown as Array<IValue>)].map((item: any) => item.value)
      : [this.values?.value]
    const data = toJS(this.selectList).filter((item) => newValue.includes(item.id))
    const deselectValus = toJS(this.deselectValus)
    const obj = {
      selectAll: this.isSelectAll,
      list: deselectValus.map((item) => item.value),
      totalOnRemote: this.remoteTotal,
      nonPublicSelectNum: this.isSelectAll ? this.remoteTotal - deselectValus.length : deselectValus.length,
      allIds: !!mode ? newValue : null,
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
   * 更新排除的选择的ID
   * @param {*} list
   * @memberof SelectCommonStore
   */
  @action
  updateExcludeList = (list: any) => {
    this.deselectValus = (list || []).map((item: any) => ({ value: item }))
    this.excludeList = list || []
  }

  @action
  updateValue = (id: number) => {
    if (Array.isArray(this.values)) {
      this.values = [...toJS(this.values)].filter((item: any) => item.value == id)
    }
  }

  @action
  actionEdit = () => {
    this.isEdit = true
  }

  @action
  hideEdit = () => {
    this.isEdit = false
  }

  @action
  updateDefaultType = () => {
    this.isDefaultSelectAll = false
  }

  /**
   * 处理搜索下的全选数据
   * @param {*} body
   * @memberof SelectCommonStore
   */
  getSearchSelectList = async (body: any) => {
    this.isLoading = true
    let page: any = ''
    let hasMore = true
    let nList: any[] = []
    return new Promise<any>((resolve) => {
      const loop = async () => {
        const res = await this.requestUrl({ ...body, index: page })
        // 这里的关键字搜索字段必须为kw, 如果不是让后端统一。
        if (this.curKw === body.kw && !!this.curKw && res) {
          const { list, index } = res
          page = index || ''
          hasMore = res?.hasMore
          const nlist = list || []
          nList = [...nList, ...nlist]
          if (!hasMore) {
            this.isLoading = false
            resolve({
              list: nList,
              hasMore: false,
              index: '',
            })
          } else if (this.curKw) {
            loop()
          } else {
            this.isLoading = false
            resolve({
              list: nList,
              hasMore: false,
              index: '',
            })
          }
        } else {
          this.isLoading = false
          resolve({
            list: nList,
            hasMore: false,
            index: '',
          })
        }
      }
      loop()
    })
  }

  /**
   * 处理搜索下的全选数据
   * @param {*} body
   * @memberof SelectCommonStore
   */
  getAllSelectList = async (body: any) => {
    this.isLoading = true
    let page: any = ''
    let hasMore = true
    let nList: any[] = []
    return new Promise<any>((resolve) => {
      const loop = async () => {
        const res = await this.requestUrl({ ...body, index: page })
        // 这里的关键字搜索字段必须为kw, 如果不是让后端统一。
        if (res) {
          const { list, index } = res
          page = index || ''
          hasMore = res?.hasMore
          const nlist = list || []
          nList = [...nList, ...nlist]
          if (!hasMore) {
            this.isLoading = false
            this.isSearchAll = false
            resolve({
              list: nList,
              hasMore: false,
              index: '',
            })
          } else {
            loop()
          }
        } else {
          this.isLoading = false
          this.isSearchAll = false
          resolve({
            list: nList,
            hasMore: false,
            index: '',
          })
        }
      }
      loop()
    })
  }

  @action
  onClearData = () => {
    this.values = []
    this.isSelectAll = false
    this.deselectValus = []
    this.isSearchAll = false
    this.indeterminateBoo = false
    this.excludeList = []
  }

  /**
   * 用于对外调用的接口
   * @param {*} parmas
   * @memberof SelectStore
   */
  abstract requestUrl(parmas: any): Promise<RequestData | void>
}
