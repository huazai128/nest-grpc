/** 需要按环境开关的 console 输出方法 */
const OUTPUT_METHODS = [
  'log',
  'info',
  'warn',
  'error',
  'debug',
  'trace',
  'dir',
  'dirxml',
  'table',
  'group',
  'groupCollapsed',
  'groupEnd',
] as const

/** console 上会被开关的方法名 */
type ConsoleOutputMethod = (typeof OUTPUT_METHODS)[number]

/** 首次捕获的原生 console 方法，避免重复包装丢失原始实现 */
const nativeMethods: Partial<Record<ConsoleOutputMethod, (...args: unknown[]) => void>> = {}
/** 是否已绑定过原生方法；重复 init 时不再 capture */
let captured = false
/** 当前已应用的开关：prod 静默 / open 输出 */
let appliedKey: string | undefined

/**
 * 是否为生产环境。仅 `prod`（忽略大小写）静默，test / release 等均输出。
 * @param {string} [mode]
 * @return {boolean}
 */
function isProdMode(mode?: string): boolean {
  return String(mode || '').toLowerCase() === 'prod'
}

/**
 * 绑定并缓存原生 console，后续按环境切换时用于还原。
 */
function captureNativeConsole(): void {
  if (captured || typeof console === 'undefined') return
  OUTPUT_METHODS.forEach((method) => {
    const fn = console[method]
    if (typeof fn === 'function') {
      nativeMethods[method] = fn.bind(console)
    }
  })
  captured = true
}

/** prod 环境下替换输出方法，丢弃参数 */
function noop(): void {}

/**
 * 按环境重写 console：prod 静默，其余环境输出原始参数。
 * @param {string} [mode] ConfigProps.mode
 */
export function rewriteConsole(mode?: string): void {
  if (typeof console === 'undefined') return
  captureNativeConsole()
  const silent = isProdMode(mode)
  const key = silent ? 'prod' : 'open'
  if (appliedKey === key) return
  appliedKey = key

  OUTPUT_METHODS.forEach((method) => {
    const native = nativeMethods[method]
    if (!native) return
    console[method] = silent ? noop : native
  })
}
