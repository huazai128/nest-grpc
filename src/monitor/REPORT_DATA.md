# Monitor SDK 上报数据定义

本文档定义 `src/monitor` SDK 需要上报的数据结构。SDK 初始化后会自动采集页面信息、性能、PV、用户行为、接口、错误、录屏和用户反馈，并通过批量接口上报。

## 上报协议

- 上报地址：`${ConfigProps.url}/api/log/multi`
- 请求方法：`POST`
- 请求体：

```json
{
  "siteId": "site-demo",
  "traceId": "traceId:018f6b8c-1111-4222-8333-7f0000000001",
  "logs": []
}
```

- 单次批量数量：SDK 每批最多取 `10` 条日志上报。服务端单次最多处理 `100` 条。
- 站点标识：SDK 会把 `ConfigProps.appKey` 作为 `siteId` 写入**批量请求体外层**（整批共享，单条日志不再重复携带）。服务端会把外层 `siteId` 合并进每条日志。
- 会话标识：`traceId` 同样上报在批量请求体外层；整批日志共享同一 `traceId`。跨会话补报的历史日志会在**单条日志内**保留各自原会话的 `traceId`，其优先级高于外层值，服务端解析时应优先取单条日志的 `traceId`，缺省再用外层值。
- 发送方式：常规路径用原生 `XMLHttpRequest`（`text/plain`）并在 HTTP 2xx 后才出队；`pagehide` / 页面隐藏时用 `sendBeacon`（超 60KB 则 `fetch keepalive`）。
- 失败重试：发送失败或离线不出队，队列写入 IndexedDB；`online` 后自动续发。
- 服务端合并：`webInfo` 和 `pageInfo` 会在服务端按 `traceId` 缓存 3 天，普通日志入库前会合并对应的基础网页信息、页面信息、`ip` 和 `ua`。`siteId`、`traceId` 取自批量外层（单条日志带 `traceId` 时以单条为准）。接口在入库流程完成后再返回 204。
- 传输压缩（不丢采集语义）：发送前去掉空值/`siteId`/与外层相同的 `traceId`；同一批内连续相同的 `pageId` 只出现一次，服务端按批内上一页回填。超长字符串只按服务端入库上限截断（`queryUrl`、资源 `name`、元素文本不截）。资源不再重复上报与 `ttfb` 相同的 `request`，入库时用 `ttfb` 回填 `request`；`contentDownload` 为 `responseEnd - responseStart`。HTTP 只上报 `queryUrl`，入库时拆出 `url`/`params`。为 0 的未采集阶段时间戳不上报。

## 初始化配置

```ts
interface ConfigProps {
  url: string
  appKey: string
  mode: string
  isExposure?: boolean
  maxBehaviorRecords?: number
  isOnRecord?: boolean
}
```

- `url`：上报服务地址，必填。
- `appKey`：站点 ID，必填，上报时落到 `siteId`。
- `mode`：环境标识，如 `test`、`release`、`prod`。
- `isExposure`：是否开启曝光埋点，默认开启；传 `false` 时不初始化曝光监听。
- `maxBehaviorRecords`：行为轨迹最大记录数，默认 `200`。
- `isOnRecord`：是否开启录屏，默认开启；传 `false` 时不启动 rrweb。自定义埋点通过 `window.sendTracker` 上报。

## 公共字段

公共字段按“恒定程度”分两层上报，避免同一字段在每条日志里重复携带：

- **批量外层（整批共享，只上报一次）**：`siteId`、`traceId`。见“上报协议”。
- **单条日志级**：由 `LogStore.mergeCommonFields()` 统一注入 `pageId`、`timestamp`，是所有日志的唯一注入入口，避免各采集模块各自拼装导致字段重复或不一致。注入规则：
  - 在日志入队时一次性补充，发送阶段不再重复拼装；成功 ack 后才出队。
  - 调用方已显式传入的同名字段优先级最高，不会被默认值覆盖（如错误/录屏/反馈的 `timestamp`）。
  - `pageId` 缺省时不会写入 `undefined`，例如 `webInfo` 不含 `pageId`。

| 字段 | 层级 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| `siteId` | 批量外层 | string | 是 | 站点 ID，由 `appKey` 写入，整批共享。 |
| `traceId` | 批量外层 | string | 是 | 会话追踪 ID，刷新页面复用，用于串联用户访问流程；跨会话补报的历史日志会在单条日志内保留原会话值。 |
| `category` | 单条 | string | 是 | 上报大类，见“上报类型”。 |
| `reportsType` | 单条 | string | 否 | 细分类型，部分日志如录屏、反馈当前未写入。 |
| `pageId` | 单条 | string | 否 | 页面 ID，每次路由变化重新生成；`webInfo` 等会话级日志不含该字段。 |
| `monitorId` | 单条 | string | 否 | 单条监控 ID，格式为 `${category}${uuid}`。可用于关联行为、错误、录屏。 |
| `timestamp` | 单条 | number | 是 | 日志入队时间戳，由 SDK 统一注入；错误、录屏、反馈会以事件实际发生时间覆盖。 |

服务端会额外补充：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `ip` | string | 访问者 IP。 |
| `ua` | string | 浏览器 User-Agent。 |
| `uaResult` | string | UA 解析结果，后端模型字段。 |
| `ipLocation` | string | IP 地理位置，后端模型字段。 |

## 上报类型

| `category` | 说明 | 主要来源 | `reportsType` |
| --- | --- | --- | --- |
| `webInfo` | 网页基础信息 | `LogStore.initPageInfo()` | 无 |
| `pageInfo` | 页面/路由信息 | `LogStore.dynamicInfo()` | 无 |
| `perf` | 性能指标 | `WebVitals` | `first-paint`、`first-contentful-paint`、`first-meaning-paint`、`navigation-timing`、`resource-flow` |
| `pv` | 页面访问 | `UserVitals.initPV()` | `router-change-record` |
| `event` | 用户行为 | 点击、失焦、触摸、曝光 | `click-behavior-record`、`change-exposure` |
| `custom` | 自定义埋点 | `window.sendTracker` / 自定义处理器 | `custom-define-record` |
| `api` | 接口请求 | `fetch` / `XMLHttpRequest` 代理 | `http-record` |
| `error` | 错误 | JS、资源、Promise、HTTP、CORS、React | `js`、`resource`、`unhandledrejection`、`http-record`、`cors`、`react` |
| `video` | 录屏数据 | `rrweb` | 当前未写入 |
| `user` | 用户反馈 | `window.sendUserLog()` | 当前未写入 |

## 基础信息日志

### `webInfo`

页面初始化时上报一次，服务端按 `WEB_INFO:${traceId}` 缓存。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `category` | `webInfo` | 固定值。 |
| `lang` | string | 浏览器语言前两位，如 `zh`。 |
| `winScreen` | string | 屏幕宽高，如 `1920x1080`。 |
| `docScreen` | string | 文档可视区域宽高。 |
| `userId` | string | 从 `userId` Cookie 读取。 |
| `traceId` | string | 会话追踪 ID。 |
| `mode` | string | 初始化配置中的环境。 |

### `pageInfo`

页面首次显示或路由变化时上报，服务端按 `PAGE_INFO:${traceId}` 缓存。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `category` | `pageInfo` | 固定值。 |
| `path` | string | 当前 `location.pathname`。 |
| `href` | string | 当前完整 URL。 |
| `title` | string | `document.title`。 |
| `referrer` | string | `document.referrer`。 |
| `prevHref` | string | 上一个页面 URL。 |
| `jumpType` | string | 触发路由变化的事件类型。 |
| `type` | number | `performance.navigation.type`，`0` 普通进入，`1` 刷新，`2` 前进/后退，`255` 其他。 |
| `pageId` | string | 页面 ID。 |
| `traceId` | string | 会话追踪 ID。 |

## 性能日志

### `first-paint`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `category` | `perf` | 固定值。 |
| `reportsType` | `first-paint` | 固定值。 |
| `fpTime` | PaintInfo | FP 性能条目。 |

### `first-contentful-paint`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `category` | `perf` | 固定值。 |
| `reportsType` | `first-contentful-paint` | 固定值。 |
| `fcpTime` | PaintInfo | FCP 性能条目。 |

`PaintInfo`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `name` | string | 性能条目名称。 |
| `entryType` | string | 性能条目类型。 |
| `startTime` | number | 开始时间，毫秒。 |
| `duration` | number | 持续时间，毫秒。 |

### `first-meaning-paint`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `category` | `perf` | 固定值。 |
| `reportsType` | `first-meaning-paint` | 固定值。 |
| `fmpTime` | number | 首次有意义绘制时间，毫秒。 |

### `navigation-timing`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `category` | `perf` | 固定值。 |
| `reportsType` | `navigation-timing` | 固定值。 |
| `ntTiming` | NTiming | 导航计时信息。 |

`NTiming`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `fp` | number | 白屏时间：`responseEnd - fetchStart`。 |
| `tti` | number | 首次可交互时间：`domInteractive - fetchStart`。 |
| `domReady` | number | DOM Ready 时间。 |
| `load` | number | 页面完全加载时间。 |
| `firseByte` | number | 首包时间，字段名沿用现有实现。 |
| `dns` | number | DNS 查询耗时。 |
| `tcp` | number | TCP 连接耗时。 |
| `ssl` | number | SSL 连接耗时。 |
| `ttfb` | number | Time To First Byte。 |
| `trans` | number | 内容传输耗时。 |
| `domParse` | number | DOM 解析耗时。 |
| `res` | number | 资源加载耗时。 |

### `resource-flow`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `category` | `perf` | 固定值。 |
| `reportsType` | `resource-flow` | 固定值。 |
| `resourcePrefs` | RequestInfo[] | 静态资源加载性能列表，不包含 `fetch`、`xmlhttprequest`、`beacon`。 |
| `cacheRate` | string | 资源缓存命中率百分比字符串，如 `80.00`。 |

`RequestInfo`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `name` | string | 资源 URL。 |
| `transferSize` | number | 传输大小。 |
| `initiatorType` | string | 资源类型，如 `script`、`link`、`img`。 |
| `startTime` | number | 开始时间。 |
| `responseEnd` | number | 响应结束时间。 |
| `time` | number | 总耗时，来自 `duration`。 |
| `dnsLookup` | number | DNS 耗时，为 0 时不上报。 |
| `initialConnect` | number | TCP 连接耗时，为 0 时不上报。 |
| `ssl` | number | SSL 耗时，无 SSL 或为 0 时不上报。 |
| `ttfb` | number | 首字节耗时（`responseStart - requestStart`）。 |
| `contentDownload` | number | 内容下载耗时（`responseEnd - responseStart`）。 |
| `isCache` | boolean | 是否命中缓存。 |

入库时服务端用 `ttfb` 回填 Mongo `ResourcePref.request`（历史上与 `ttfb` 同值，SDK 不再重复传输）。

## PV 日志

`router-change-record` 在页面显示或路由变化时触发，同时通过加载测试图片估算网络速度。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `category` | `pv` | 固定值。 |
| `reportsType` | `router-change-record` | 固定值。 |
| `monitorId` | string | `pv${uuid}`。 |
| `speed` | number | 估算下载速度，单位 `kb/s`。 |
| `costTime` | number | 测速图片加载耗时，毫秒。 |

## 用户行为日志

### `click-behavior-record`

监听 `click`、`blur`、`touchend`，忽略 `body` 和 `html`。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `category` | `event` | 固定值。 |
| `reportsType` | `click-behavior-record` | 固定值。 |
| `monitorId` | string | `event${uuid}`。 |
| `nodeId` | string | 目标元素 `id`。 |
| `classList` | string[] | 目标元素类名列表。 |
| `tagName` | string | 目标元素标签名。 |
| `tagText` | string | 元素文本。 |
| `nodeDom` | string | 仅输入框 `blur` 时上报，含输入值；其余场景不上报该字段。 |
| `data-*` | any | 目标元素的 `dataset` 展开到根字段，但不会覆盖 `category` / `monitorId` 等保留键。 |

### `change-exposure`

监听 `.on-visible` 元素，当可见比例达到 `0.55` 且未标记 `data-visible` 时触发。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `category` | `event` | 固定值。 |
| `reportsType` | `change-exposure` | 固定值。 |
| `classList` | string[] | 曝光元素类名列表。 |
| `tagName` | string | 曝光元素标签名。 |
| `text` | string | 曝光元素文本。 |
| `data-*` | any | 曝光元素的 `dataset` 会展开到日志根字段。 |

## 自定义埋点日志

业务通过 SDK 暴露的自定义埋点处理器上报。

```ts
interface CustomAnalyticsData {
  eventCategory: string
  eventAction: string
  eventLabel: string
  eventValue?: string
  eventId: number
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `category` | `custom` | 固定值。 |
| `reportsType` | `custom-define-record` | 固定值。 |
| `monitorId` | string | `custom${uuid}`。 |
| `eventCategory` | string | 事件类别。 |
| `eventAction` | string | 事件动作。 |
| `eventLabel` | string | 事件标签。 |
| `eventValue` | string | 事件值，可选。 |
| `eventId` | number | 自定义事件 ID。 |

## 接口日志

SDK 代理 `XMLHttpRequest` 和 `fetch`，请求完成后上报。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `category` | `api` | 固定值。 |
| `reportsType` | `http-record` | 固定值。 |
| `monitorId` | string | `api${uuid}`。 |
| `method` | string | 请求方法。 |
| `queryUrl` | string | 原始请求 URL（含 Query）。SDK 不再单独上报 `url`、`params`；服务端入库前从 `queryUrl` 拆出不含 Query 的 `url` 和 Query 对象 `params`。 |
| `body` | any | 请求体。 |
| `requestTime` | number | 请求发起时间戳。 |
| `responseTime` | number | 响应完成时间戳。 |
| `status` | number | HTTP 状态码；`fetch` 异常时为 `0`。 |
| `statusText` | string | HTTP 状态文本或异常消息。 |
| `response` | ResponseInfo | 响应摘要。HTML 响应会被过滤为 `[-Body内容为HTML已过滤-]`。 |
| `zeroTime` | number | `fetch` 初始化时间戳；为 0 不上报。 |
| `loadingTime` | number | `fetch` 请求开始等待响应时间戳；为 0 不上报。 |
| `loadedTime` | number | `fetch` 收到响应时间戳；为 0 不上报。 |
| `interactionTime` | number | `fetch` clone 响应后的时间戳；为 0 不上报。 |
| `endTime` | number | `fetch` 读取响应文本完成时间戳；为 0 不上报。 |

`ResponseInfo`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `status` | number | 业务状态码，来自响应的 `status` 或 `code`。 |
| `message` | string | 业务消息，来自响应的 `msg` 或 `message`。 |
| `result` | string | 响应结果。对象会序列化，超大对象会被截断。 |

## 错误日志

错误日志统一走 `errorSendHandler()`，会追加行为轨迹和录屏关联键。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `category` | `error` | 固定值。 |
| `reportsType` | string | 错误机制类型。 |
| `monitorId` | string | `error${uuid}`。 |
| `value` | string | 错误消息或错误响应。 |
| `errorType` | string | 错误类型。 |
| `errorUid` | string | 错误唯一指纹，用于去重。 |
| `stackTrace` | StackTrace[] | 堆栈信息。 |
| `breadcrumbs` | BehaviorItem[] | 最近用户行为轨迹。 |
| `meta` | object | 错误上下文。 |
| `recordKeys` | string[] | 最近录屏片段 ID。 |
| `componentName` | string | React 错误对应组件名。 |
| `timestamp` | number | 错误发生时间戳。 |

错误机制类型：

| `reportsType` | 来源 | 关键字段 |
| --- | --- | --- |
| `js` | `window.error` 中的 JS 运行时错误 | `value`、`errorType`、`stackTrace`、`meta.file`、`meta.row`、`meta.col` |
| `resource` | 资源加载失败 | `meta.url`、`meta.type` |
| `unhandledrejection` | 未处理 Promise rejection | `value`、`errorType`、`stackTrace` |
| `http-record` | HTTP 异常或业务失败 | `value`（响应体，已做 HTML 过滤）、`meta` 中接口指标（不含 `response`，避免与 `value` 重复） |
| `cors` | 跨域脚本错误 | `value`、`errorType` |
| `react` | React ErrorBoundary 手动调用 | `value`、`componentName`、`stackTrace`、`meta.file` |

`BehaviorItem`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `type` | string | 行为所属 `category`。 |
| `monitorId` | string | 行为日志 ID。 |

## 录屏日志

SDK 使用 `rrweb` 录制页面操作。达到检查点或单片段大小阈值后上报。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `category` | `video` | 固定值。 |
| `monitorId` | string | `video${uuid}`，同一录屏片段的 ID。 |
| `events` | string | rrweb 事件数组 JSON 字符串。 |
| `timestamp` | number | 片段上报时间戳。 |

本地缓存键：

| 字段 | 说明 |
| --- | --- |
| `historyKeys` | 最近录屏片段 ID 列表，最多保留 `10` 个。 |
| `curRecordKey` | 当前尚未上报的录屏事件，页面重新打开后会补报。 |

## 用户反馈日志

业务可调用 `window.sendUserLog({ content, oId })` 上报反馈。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `category` | `user` | 固定值。 |
| `monitorId` | string | `user${uuid}`。 |
| `content` | string | 用户反馈内容。 |
| `oId` | string | 业务侧关联 ID，如团队 ID、项目 ID。 |
| `breadcrumbs` | BehaviorItem[] | 最近用户行为轨迹。 |
| `errorList` | string[] | 最近 10 个错误指纹。 |
| `currentEvents` | string \| null | 当前未切片的 rrweb 事件 JSON 字符串。 |
| `recordKeys` | string[] | 最近录屏片段 ID。 |
| `timestamp` | number | 反馈发生时间戳。 |

## 单条上报数据示例

以下示例均表示 `POST /api/log/multi` 请求体中 `logs` 数组里的单条数据。`siteId`、`traceId` 为批量外层字段（整批共享），不在单条日志内，故下方各示例不再重复列出。真实上报时 SDK 会批量发送：

```json
{
  "siteId": "site-demo",
  "traceId": "traceId:018f6b8c-1111-4222-8333-7f0000000001",
  "logs": []
}
```

### 网页基础信息：`webInfo`

```json
{
  "category": "webInfo",
  "lang": "zh",
  "winScreen": "1920x1080",
  "docScreen": "1440x900",
  "userId": "user_10001",
  "mode": "prod"
}
```

### 页面信息：`pageInfo`

```json
{
  "category": "pageInfo",
  "pageId": "pageId:018f6b8c-aaaa-4222-8333-7f0000000002",
  "path": "/dashboard",
  "href": "https://example.com/dashboard?tab=overview",
  "title": "Dashboard",
  "referrer": "https://example.com/login",
  "prevHref": "https://example.com/login",
  "jumpType": "pageshow",
  "type": 0
}
```

### 性能：`first-paint`

```json
{
  "category": "perf",
  "reportsType": "first-paint",
  "pageId": "pageId:018f6b8c-aaaa-4222-8333-7f0000000002",
  "fpTime": {
    "name": "first-paint",
    "entryType": "paint",
    "startTime": 328.4,
    "duration": 0
  }
}
```

### 性能：`first-contentful-paint`

```json
{
  "category": "perf",
  "reportsType": "first-contentful-paint",
  "pageId": "pageId:018f6b8c-aaaa-4222-8333-7f0000000002",
  "fcpTime": {
    "name": "first-contentful-paint",
    "entryType": "paint",
    "startTime": 486.8,
    "duration": 0
  }
}
```

### 性能：`first-meaning-paint`

```json
{
  "category": "perf",
  "reportsType": "first-meaning-paint",
  "pageId": "pageId:018f6b8c-aaaa-4222-8333-7f0000000002",
  "fmpTime": 823.52
}
```

### 性能：`navigation-timing`

```json
{
  "category": "perf",
  "reportsType": "navigation-timing",
  "pageId": "pageId:018f6b8c-aaaa-4222-8333-7f0000000002",
  "ntTiming": {
    "fp": 210.5,
    "tti": 680.2,
    "domReady": 742.1,
    "load": 1260.4,
    "firseByte": 92.3,
    "dns": 12.1,
    "tcp": 28.4,
    "ssl": 18.6,
    "ttfb": 80.2,
    "trans": 118.7,
    "domParse": 470.1,
    "res": 518.3
  }
}
```

### 性能：`resource-flow`

```json
{
  "category": "perf",
  "reportsType": "resource-flow",
  "pageId": "pageId:018f6b8c-aaaa-4222-8333-7f0000000002",
  "cacheRate": "50.00",
  "resourcePrefs": [
    {
      "name": "https://example.com/assets/app.js",
      "transferSize": 348120,
      "initiatorType": "script",
      "startTime": 124.2,
      "responseEnd": 412.6,
      "time": 288.4,
      "dnsLookup": 8.3,
      "initialConnect": 18.5,
      "ssl": 12.2,
      "ttfb": 75.1,
      "contentDownload": 180.4,
      "isCache": false
    }
  ]
}
```

### PV：`router-change-record`

```json
{
  "category": "pv",
  "reportsType": "router-change-record",
  "pageId": "pageId:018f6b8c-aaaa-4222-8333-7f0000000002",
  "monitorId": "pv018f6b8c-bbbb-4222-8333-7f0000000003",
  "speed": 876.42,
  "costTime": 117.68
}
```

### 用户行为：`click-behavior-record`

```json
{
  "category": "event",
  "reportsType": "click-behavior-record",
  "pageId": "pageId:018f6b8c-aaaa-4222-8333-7f0000000002",
  "monitorId": "event018f6b8c-cccc-4222-8333-7f0000000004",
  "nodeId": "submit-button",
  "classList": ["btn", "btn-primary"],
  "tagName": "button",
  "tagText": "提交",
  "trackId": "submit_order"
}
```

### 用户行为：`change-exposure`

```json
{
  "category": "event",
  "reportsType": "change-exposure",
  "pageId": "pageId:018f6b8c-aaaa-4222-8333-7f0000000002",
  "classList": ["banner", "on-visible"],
  "tagName": "DIV",
  "text": "618 活动 Banner",
  "trackId": "home_banner"
}
```

### 自定义埋点：`custom-define-record`

```json
{
  "category": "custom",
  "reportsType": "custom-define-record",
  "pageId": "pageId:018f6b8c-aaaa-4222-8333-7f0000000002",
  "monitorId": "custom018f6b8c-dddd-4222-8333-7f0000000005",
  "eventCategory": "order",
  "eventAction": "submit",
  "eventLabel": "submit_order",
  "eventValue": "success",
  "eventId": 10001
}
```

### 接口请求：`http-record`

```json
{
  "category": "api",
  "reportsType": "http-record",
  "pageId": "pageId:018f6b8c-aaaa-4222-8333-7f0000000002",
  "monitorId": "api018f6b8c-eeee-4222-8333-7f0000000006",
  "method": "POST",
  "queryUrl": "https://example.com/api/order?source=web",
  "body": "{\"skuId\":\"sku_10001\",\"count\":1}",
  "requestTime": 1710000000000,
  "responseTime": 1710000000120,
  "status": 200,
  "statusText": "OK",
  "zeroTime": 1710000000000,
  "loadingTime": 1710000000001,
  "loadedTime": 1710000000100,
  "interactionTime": 1710000000101,
  "endTime": 1710000000120,
  "response": {
    "status": 0,
    "message": "success",
    "result": "{\"orderId\":\"order_10001\"}"
  }
}
```

### JS 错误：`js`

```json
{
  "category": "error",
  "reportsType": "js",
  "pageId": "pageId:018f6b8c-aaaa-4222-8333-7f0000000002",
  "monitorId": "error018f6b8c-ffff-4222-8333-7f0000000007",
  "value": "Cannot read properties of undefined",
  "errorType": "TypeError",
  "errorUid": "js-9b3f8c1a",
  "stackTrace": [
    {
      "filename": "https://example.com/assets/app.js",
      "functionName": "handleSubmit",
      "lineno": "120",
      "colno": 18
    }
  ],
  "breadcrumbs": [{ "type": "event", "monitorId": "event018f6b8c-cccc-4222-8333-7f0000000004" }],
  "meta": {
    "file": "https://example.com/assets/app.js",
    "row": 120,
    "col": 18
  },
  "recordKeys": ["video018f6b8c-1111-4222-8333-7f0000000008"],
  "timestamp": 1710000000200
}
```

### 资源错误：`resource`

```json
{
  "category": "error",
  "reportsType": "resource",
  "pageId": "pageId:018f6b8c-aaaa-4222-8333-7f0000000002",
  "monitorId": "error018f6b8c-2222-4222-8333-7f0000000009",
  "value": "",
  "errorType": "ResourceError",
  "errorUid": "resource-57bc92e0",
  "breadcrumbs": [{ "type": "pv", "monitorId": "pv018f6b8c-bbbb-4222-8333-7f0000000003" }],
  "meta": {
    "url": "https://example.com/assets/missing.png",
    "type": "IMG"
  },
  "recordKeys": ["video018f6b8c-1111-4222-8333-7f0000000008"],
  "timestamp": 1710000000300
}
```

### Promise 错误：`unhandledrejection`

```json
{
  "category": "error",
  "reportsType": "unhandledrejection",
  "pageId": "pageId:018f6b8c-aaaa-4222-8333-7f0000000002",
  "monitorId": "error018f6b8c-3333-4222-8333-7f0000000010",
  "value": "Request timeout",
  "errorType": "Error",
  "errorUid": "unhandledrejection-a816cc10",
  "stackTrace": [],
  "breadcrumbs": [{ "type": "api", "monitorId": "api018f6b8c-eeee-4222-8333-7f0000000006" }],
  "meta": {},
  "recordKeys": ["video018f6b8c-1111-4222-8333-7f0000000008"],
  "timestamp": 1710000000400
}
```

### HTTP 错误：`http-record`

```json
{
  "category": "error",
  "reportsType": "http-record",
  "pageId": "pageId:018f6b8c-aaaa-4222-8333-7f0000000002",
  "monitorId": "error018f6b8c-4444-4222-8333-7f0000000011",
  "value": "{\"status\":500,\"message\":\"Internal Server Error\",\"result\":\"server error\"}",
  "errorType": "HttpError",
  "errorUid": "http-record-2c70d9f0",
  "breadcrumbs": [{ "type": "api", "monitorId": "api018f6b8c-eeee-4222-8333-7f0000000006" }],
  "meta": {
    "method": "POST",
    "queryUrl": "https://example.com/api/order?source=web",
    "body": "{\"skuId\":\"sku_10001\",\"count\":1}",
    "requestTime": 1710000000000,
    "responseTime": 1710000000120,
    "status": 500,
    "statusText": "Internal Server Error"
  },
  "recordKeys": ["video018f6b8c-1111-4222-8333-7f0000000008"],
  "timestamp": 1710000000500
}
```

### CORS 错误：`cors`

```json
{
  "category": "error",
  "reportsType": "cors",
  "pageId": "pageId:018f6b8c-aaaa-4222-8333-7f0000000002",
  "monitorId": "error018f6b8c-5555-4222-8333-7f0000000012",
  "value": "Script error.",
  "errorType": "CorsError",
  "errorUid": "cors-1f8ab050",
  "breadcrumbs": [],
  "meta": {},
  "recordKeys": ["video018f6b8c-1111-4222-8333-7f0000000008"],
  "timestamp": 1710000000600
}
```

### React 错误：`react`

```json
{
  "category": "error",
  "reportsType": "react",
  "pageId": "pageId:018f6b8c-aaaa-4222-8333-7f0000000002",
  "monitorId": "error018f6b8c-6666-4222-8333-7f0000000013",
  "value": "Render failed",
  "errorType": "Error",
  "errorUid": "react-3cd6821f",
  "componentName": "OrderPanel",
  "stackTrace": [],
  "breadcrumbs": [{ "type": "event", "monitorId": "event018f6b8c-cccc-4222-8333-7f0000000004" }],
  "meta": {
    "file": [
      {
        "filename": "OrderPanel.tsx",
        "functionName": "OrderPanel",
        "lineno": "42",
        "colno": 10
      }
    ]
  },
  "recordKeys": ["video018f6b8c-1111-4222-8333-7f0000000008"],
  "timestamp": 1710000000700
}
```

### 录屏：`video`

```json
{
  "category": "video",
  "pageId": "pageId:018f6b8c-aaaa-4222-8333-7f0000000002",
  "monitorId": "video018f6b8c-1111-4222-8333-7f0000000008",
  "events": "[{\"type\":4,\"timestamp\":1710000000000,\"data\":{\"href\":\"https://example.com/dashboard\"}}]",
  "timestamp": 1710000000800
}
```

### 用户反馈：`user`

```json
{
  "category": "user",
  "pageId": "pageId:018f6b8c-aaaa-4222-8333-7f0000000002",
  "monitorId": "user018f6b8c-7777-4222-8333-7f0000000014",
  "content": "提交订单后页面没有响应",
  "oId": "team_10001",
  "breadcrumbs": [
    { "type": "pv", "monitorId": "pv018f6b8c-bbbb-4222-8333-7f0000000003" },
    { "type": "event", "monitorId": "event018f6b8c-cccc-4222-8333-7f0000000004" },
    { "type": "api", "monitorId": "api018f6b8c-eeee-4222-8333-7f0000000006" }
  ],
  "errorList": ["js-9b3f8c1a", "http-record-2c70d9f0"],
  "currentEvents": "[{\"type\":3,\"timestamp\":1710000000750,\"data\":{\"source\":1}}]",
  "recordKeys": ["video018f6b8c-1111-4222-8333-7f0000000008"],
  "timestamp": 1710000000900
}
```

## 字段约定与注意事项

- `category` 是日志大类，`reportsType` 是具体指标或机制类型。查询、聚合和展示应优先使用这两个字段。
- `traceId` 用于串联一次会话，`pageId` 用于区分同一会话内的不同页面。
- `monitorId` 是事件级 ID，会被行为轨迹、错误日志和录屏关联使用。
- `webInfo`、`pageInfo` 只用于服务端缓存和合并，不直接作为普通日志入库。
- 接口和错误日志会过滤 HTML 响应体，避免大体积 HTML 入库。
- 当前 SDK 中 `video` 和 `user` 日志未设置 `reportsType`，后端和展示层需要按 `category` 识别。
- `resource-flow.cacheRate` 在资源列表为空时统一兜底为 `"0.00"`，不会再出现 `NaN` 字符串。
- `timestamp` 现为所有日志均会携带的单条公共字段（入队时间戳）；错误、录屏、反馈仍以事件实际发生时间覆盖该值。
- 为减少重复上报，公共字段分两层：`siteId`、`traceId` 提到批量请求体外层（整批只上报一次，单条日志不再携带）；`pageId`、`timestamp` 因会随页面/事件变化，仍在单条日志级由 `mergeCommonFields()` 一处注入。新增采集模块不应再自行拼装这些字段。
- 单条日志带 `traceId` 仅出现在跨会话补报的历史日志，用于覆盖外层默认 `traceId`；服务端解析 `traceId` 时应「单条优先、外层兜底」。
- 接口日志不再上报 `url`、`params`，二者可由 `queryUrl` 派生；HTTP 错误日志的 `meta` 不再包含 `response`（已在 `value` 中），避免重复并堵住未过滤 HTML 的泄漏路径。
- 部分后端 proto 字段为 `string`，但 SDK 实际上报为 `number`，例如 `requestTime`、`responseTime`、`speed`、`costTime`。以 SDK 实际 JSON 为准，后端落库前可做类型转换。
