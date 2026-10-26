import { useEffect, useRef, useState } from 'react'
import RrwebPlayer from 'rrweb-player'
import 'rrweb-player/dist/style.css'
import styles from './style.scss'
import ErrorBoundaryHoc from '../ErrorBoundary'

interface IProps {
  /** 历史兼容：Mongo 里的 rrweb JSON 字符串 */
  eventsJson?: string
  /** OSS 上的 rrweb JSON 链接 */
  eventsUrl?: string
}

/**
 * 解析本地 JSON 或拉取 OSS 链接，得到 rrweb 事件数组。
 * @param {string} [eventsJson]
 * @param {string} [eventsUrl]
 * @return {Promise<any[]>}
 */
async function resolveEvents(eventsJson?: string, eventsUrl?: string): Promise<any[]> {
  if (eventsUrl) {
    const response = await fetch(eventsUrl)
    if (!response.ok) return []
    const data = await response.json()
    return Array.isArray(data) ? data : []
  }
  if (!eventsJson) return []
  try {
    const data = JSON.parse(eventsJson)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

const Replayer = ({ eventsJson, eventsUrl }: IProps) => {
  const replayRef = useRef<RrwebPlayer | null>()
  const [events, setEvents] = useState<any[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty'>('loading')

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    resolveEvents(eventsJson, eventsUrl)
      .then((list) => {
        if (cancelled) return
        setEvents(list)
        setStatus(list.length ? 'ready' : 'empty')
      })
      .catch(() => {
        if (cancelled) return
        setEvents([])
        setStatus('empty')
      })
    return () => {
      cancelled = true
    }
  }, [eventsJson, eventsUrl])

  useEffect(() => {
    const nodeRef = document.querySelector('#replayer') as HTMLElement
    replayRef.current = null
    if (!!nodeRef && events.length && !replayRef.current) {
      replayRef.current = new RrwebPlayer({
        target: nodeRef,
        props: {
          events: events,
          width: 760,
          height: 425,
          UNSAFE_replayCanvas: true,
        },
      })
      replayRef.current?.play()
    }
  }, [JSON.stringify(events)])

  useEffect(() => {
    return () => {
      replayRef.current?.pause()
      replayRef.current?.addEventListener('destroy', () => {
        replayRef.current = null
      })
    }
  }, [])

  const emptyText = status === 'loading' ? '录屏加载中…' : '无录屏数据'

  return (
    <div id="replayer" className={styles.replayerBox}>
      {!events.length && emptyText}
    </div>
  )
}

export default ErrorBoundaryHoc(Replayer, 'Replayer')
