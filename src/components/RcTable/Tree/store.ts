import debounce from 'lodash/debounce'
import { action, observable, toJS } from 'mobx'

export interface TreeNode {
  title: string
  key: string
  isLeaf?: boolean
  children?: TreeNode[]
}

export interface UnitItem {
  page: number // 当前分页
  isMore: boolean // 是否还有更多数据
  itemNode: Element
}

interface PageInfo {
  page: number
  pageSize: number
}

export interface TreeData {
  list: Array<TreeNode>
  keys: Array<string>
  hasMore?: boolean
}

export type TreeParams = PageInfo & Pick<TreeNode, 'key'>

export abstract class TreeStore {
  // 分页信息
  private pageInfo: PageInfo = {
    page: 1,
    pageSize: 50,
  }

  // 缓存当前下来节点
  private nodekey!: string

  // 当前分野
  private curPage = 1

  // 是否在加载中
  private isLoading = false

  // 用于存储已展示的信息
  private storeMap: Map<string, UnitItem> = new Map()

  //  IntersectionObserver
  private observer!: IntersectionObserver

  // 是否展开
  private isOpen = false

  // Tree数据
  @observable treeList: Array<TreeNode> = []
  // 展开指定数的节点
  @observable expandedKeys: Array<string> = []
  // 已选择节点
  @observable selectedKeys: Array<string> = []

  // 需要监听的class
  @observable cls!: string // get / set

  /**
   * 选择
   * @param {Array<any>} selectedKeys
   * @param {*} e
   * @memberof TreeStore
   */
  @action
  onSelect = (selectedKeys: Array<any>) => {
    const list = [...toJS(this.selectedKeys), ...selectedKeys]
    this.selectedKeys = [...new Set(list)]
  }

  /**
   * 展开/收起
   * @param {Array<any>} expandedKeys
   * @param {*} {expanded: boolean, node}
   * @memberof TreeStore
   */
  @action
  onExpand = (expandedKeys: Array<any>, { expanded, node }: any) => {
    this.isOpen = expanded
    this.handleData(node.key)
    this.expandedKeys = expandedKeys
  }

  /**
   * 处理IntersectionObserver回调
   * @param {IntersectionObserverEntry[]} entries
   * @memberof TreeStore
   */
  observerCB = (entries: IntersectionObserverEntry[]) => {
    entries.forEach((item) => {
      if (item.intersectionRatio > 0.1) {
        const key = (item.target as Element & { dataset: any }).dataset.key
        const curInfo = this.storeMap.get(key)
        if (curInfo?.isMore && toJS(this.expandedKeys).includes(key)) {
          this.nodekey = key
          this.isOpen = true
          this.handleData(key)
        }
      }
    })
  }

  /**
   * 监听滚动, 可以覆盖当前写法，默认拿当前的监听
   * @memberof TreeStore
   */
  @action
  onChangeView = () => {
    // 如果是要下拉加载，就必须确定需要监听的class集合
    console.log(this.cls, '下拉加载， 必须确定需要监听的class集合')
    if (this.cls) {
      const uniNodes = document.querySelectorAll(this.cls)
      const treeNode = document.querySelector('.ant-tree-list-holder')
      this.observer = new IntersectionObserver(this.observerCB, {
        root: treeNode,
        rootMargin: '0px',
        threshold: [0.5, 0.98, 1],
      })

      uniNodes.forEach((node) => {
        const key = (node as Element & { dataset: any }).dataset?.key
        this.storeMap.set(key, {
          page: 1,
          isMore: true,
          itemNode: node,
        })
        // 对每个节点注册监听
        this.observer.observe(node)
      })

      const scrollB = (e: any) => {
        const curInfo = this.storeMap.get(this.nodekey)
        if (curInfo) {
          const curTop = e.target.scrollTop + e.target.offsetHeight
          let hei = 400 * this.curPage
          hei = hei > 1600 ? 1600 : hei
          const targetHei = e.target.scrollHeight - hei
          if (curInfo.isMore && curTop >= targetHei && this.pageInfo.page != this.curPage && this.isOpen) {
            this.getLoadData(this.nodekey)
          }
        }
      }

      // 监听滚动
      treeNode?.addEventListener('scroll', debounce(scrollB, 300))
    } else {
      throw '必须定义需要监听的class'
    }
  }

  /**
   *处理数据
   * @param {string} key
   * @memberof TreeStore
   */
  handleData = (key: string) => {
    const curInfo = this.storeMap.get(key)
    this.curPage = 1
    this.pageInfo = {
      ...this.pageInfo,
      page: curInfo?.page || 1,
    }
  }

  /**
   * 加载异步接口数据
   * @memberof TreeStore
   */
  getLoadData = async (key: string) => {
    if (this.isLoading) return
    this.isLoading = true
    if (this.nodekey != key) {
      this.handleData(key)
    }
    this.nodekey = key
    const { page } = this.pageInfo
    this.curPage = page
    const res = await this.getChildrenData({ ...this.pageInfo, key })
    if (res) {
      const list = res?.list || []
      this.pageInfo.page = page + 1
      const curInfo = this.storeMap.get(key)
      if (curInfo?.itemNode) {
        const isMore = list.length === this.pageInfo.pageSize
        if (!isMore) {
          this.observer.unobserve(curInfo?.itemNode)
        }
        this.storeMap.set(key, {
          isMore: isMore,
          page: this.pageInfo.page,
          itemNode: curInfo.itemNode,
        })
        this.treeList = this.updateTreeData([...toJS(this.treeList)], key, list)
      }
    }
    this.isLoading = false
  }

  /**
   * 更新数据
   * @param {TreeNode[]} list
   * @param {React.Key} key
   * @param {TreeNode[]} children
   * @memberof TreeStore
   */
  updateTreeData = (list: TreeNode[], key: React.Key, children: TreeNode[]): TreeNode[] =>
    list.map((node) => {
      if (node.key === key) {
        const list = node.children || []
        return {
          ...node,
          children: [...list, ...children],
        }
      }
      if (node.children) {
        return {
          ...node,
          children: this.updateTreeData(node.children, key, children),
        }
      }
      return node
    })

  /**
   * 加载数据
   * @memberof TreeStore
   */
  @action
  fetchTreeList = async () => {
    const res = await this.getFetchTree()
    if (res) {
      this.treeList = res.list
      this.expandedKeys = res.keys
    }
  }

  /**
   * 获取数
   * @abstract
   * @return {*}  {(Promise<TreeData | void>)}
   * @memberof TreeStore
   */
  abstract getFetchTree(): Promise<TreeData | void>

  /**
   * 动态获取子节点数
   * @abstract
   * @return {*}  {(Promise<TreeData | void>)}
   * @memberof TreeStore
   */
  abstract getChildrenData(parmas: TreeParams): Promise<TreeData | void> | void
}
