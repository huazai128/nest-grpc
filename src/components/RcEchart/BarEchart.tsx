import { Bar, BarConfig } from '@ant-design/plots'
import { useMemo } from 'react'
import ErrorBoundaryHoc from '../ErrorBoundary'

type IProps = {
  total: number
} & BarConfig

const BarEchart = ({ total, ...props }: IProps) => {
  const config: BarConfig = useMemo(
    () => ({
      smooth: true,
      animation: {
        appear: {
          animation: 'path-in',
          duration: 100,
        },
      },
      minBarWidth: 6,
      maxBarWidth: 6,
      label: {
        // 可手动配置 label 数据标签位置
        position: 'right',
        offset: 4,
        formatter: ({ count }: any) => `${((count / total) * 100).toFixed(2)}%`,
        style: {
          fill: '#000',
        },
      },
      barStyle: {
        radius: [2, 2, 0, 0],
      },
      ...props,
    }),
    [props],
  )
  return <Bar {...config} />
}

export default ErrorBoundaryHoc(BarEchart, 'BarEchart')
