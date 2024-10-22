import ErrorBoundaryHoc from '@src/components/ErrorBoundary'
import { Column, ColumnConfig } from '@ant-design/plots'

export type RcEchartProps = ColumnConfig

const RcEchart = ({ ...props }: RcEchartProps) => {
  return <Column {...props} />
}

export default ErrorBoundaryHoc(RcEchart, 'RcEchart')
