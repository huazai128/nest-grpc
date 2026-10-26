import { MechanismType } from '@src/interfaces/log.interface'
import { IPage } from '@src/interfaces/page.interface'
import { ResponsePaginationData } from '@src/interfaces/response.iterface'
import { globalStore } from '@src/stores'
import { StoreExt } from '@src/utils/reactExt'
import { FormInstance } from 'antd'
import { action, makeObservable, observable } from 'mobx'
import React from 'react'

interface ErrorItem {
  errorUUid: string
  meta: any
}

export interface ErrorAggregateItem {
  count: number
  errorList: ErrorItem[]
  value: string
  path: string
  ratio: string
}

export interface TabItem {
  name: string
  key: string
  render: React.ReactNode
}

export type ResponseErrorData = ResponsePaginationData<ErrorAggregateItem>

export class ErrorTableStore extends StoreExt {
  constructor() {
    super()
    makeObservable(this)
  }

  @observable form!: FormInstance<any>

  @observable isLoading = false

  @observable pageInfo: IPage = {
    page: 1,
    size: 20,
    total: 0,
  }

  @observable dataTotal: number = 0

  @observable dataSource: ErrorAggregateItem[] = []

  @action
  updateForm = (form: FormInstance<any>) => {
    this.form = form
    this.form.setFieldsValue({
      reportsType: MechanismType.HP,
    })
    this.getErrorData()
  }

  @action
  getErrorData = async () => {
    if (this.isLoading) return
    this.isLoading = true
    const { page, size } = this.pageInfo
    const { time, ...params } = this.form.getFieldsValue() || {}
    if (time.value) {
      params.startTime = time.value[0].valueOf()
      params.endTime = time.value[1].valueOf()
    }
    const { status, result } = await this.api.errorApi.getErrorStatisticsList<ResponseErrorData>({
      ...params,
      siteId: globalStore.siteId,
      page,
      size,
    })
    if (Object.is(status, 'success')) {
      this.pageInfo.total = result.pagination?.total || this.pageInfo.total
      this.dataTotal = result.pagination?.dataTotal || 0
      const list = result?.data || []
      this.dataSource = list.map((item) => ({
        ...item,
        ratio: ((item.count / this.dataTotal) * 100).toFixed(2),
      }))
    }
    this.isLoading = false
  }

  @action
  updatePage = (page: number) => {
    this.pageInfo.page = page
    this.getErrorData()
  }
}

export default new ErrorTableStore()
