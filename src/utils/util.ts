import { message } from 'antd'
import beautify from 'js-beautify'

/**
 * 处理搜索关键字
 * @param {string} kw 输入的文本
 * @return {*}  {(Record<string, string> | undefined)}
 */
export const handleSearchKeywords = (kw: string): Record<string, string> | undefined => {
  // 匹配并提取键值对
  const result = stringToObject(kw)
  if (!!result) {
    return result
  } else {
    message.info('请输入正确的搜索格式')
    return undefined
  }
}

/**
 * string To Number
 * @export
 * @param {string} str
 * @return {*}  {(number | string)}
 */
export function stringToNumber(str: string): number | string {
  // 使用 Number 函数尝试将字符串转换为数字
  const num = Number(str)

  // 使用 isNaN 函数判断转换后的值是否为 NaN
  // 并且判断转换后的值与原始字符串是否相等
  // 如果相等，说明字符串表示一个有效的数字
  return !isNaN(num) && num.toString() === str ? num : str
}

/**
 * string 转 Object
 * @export
 * @param {string} value
 * @return {*}  {(Record<string, string> | string)}
 */
export function stringToObject(value: string): Record<string, string> | null {
  try {
    return new Function(`return ${value}`)()
  } catch (error) {
    return null
  }
}

export const formatStr = (str: string) => {
  try {
    let s = str.replace(/\\/g, '')
    if (s.startsWith('"')) {
      s = s.slice(1)
    }
    if (s.endsWith('"')) {
      s = s.slice(0, -1)
    }
    return beautify(s, { indent_size: 2, space_in_empty_paren: true })
  } catch (e) {
    return str
  }
}

export const formatResponse = (obj: Record<string, any>) => {
  try {
    if (obj.result) {
      obj.result = JSON.parse(obj.result)
    }
    const s = JSON.stringify(obj, undefined, 2)
    return beautify(s, { indent_size: 2, space_in_empty_paren: true })
  } catch (e) {
    return JSON.stringify(obj)
  }
}
