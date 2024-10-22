import { Line, LineConfig } from '@ant-design/plots'
import { useMemo } from 'react'
import ErrorBoundaryHoc from '../ErrorBoundary'

const LineEchart = (props: LineConfig) => {
  const config: LineConfig = useMemo(
    () => ({
      legend: {
        position: 'bottom',
      },
      smooth: true,
      animation: {
        appear: {
          animation: 'path-in',
          duration: 3000,
        },
      },
      ...props,
    }),
    [props],
  )
  return <Line {...config} />
}

export default ErrorBoundaryHoc(LineEchart, 'LineEchart')
