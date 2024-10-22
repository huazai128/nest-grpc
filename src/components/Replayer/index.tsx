import { useEffect, useRef } from 'react'
import RrwebPlayer from 'rrweb-player'
import 'rrweb-player/dist/style.css'
import styles from './style.scss'
import ErrorBoundaryHoc from '../ErrorBoundary'

interface IProps {
  events: Array<any>
}

const Replayer = ({ events }: IProps) => {
  const replayRef = useRef<RrwebPlayer | null>()
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
    } else {
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

  return (
    <div id="replayer" className={styles.replayerBox}>
      {!events.length && '无录屏数据'}
    </div>
  )
}

export default ErrorBoundaryHoc(Replayer, 'Replayer')
