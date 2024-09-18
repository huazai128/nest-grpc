import { Space } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'

interface CursorPaginationProps {
  onNext?: () => void
  onPrev?: () => void
  nextDisabled?: boolean
  prevDisabled?: boolean
}
export const CursorPagination = (props: CursorPaginationProps) => {
  const { onNext, onPrev, nextDisabled, prevDisabled } = props
  return (
    <div>
      <Space>
        <span
          style={{
            cursor: prevDisabled ? 'not-allowed' : 'pointer',
            color: prevDisabled ? 'rgba(0, 0, 0, 0.25)' : undefined,
          }}
          onClick={prevDisabled ? undefined : onPrev}
        >
          <LeftOutlined />
        </span>
        <span
          style={{
            cursor: nextDisabled ? 'not-allowed' : 'pointer',
            color: nextDisabled ? 'rgba(0, 0, 0, 0.25)' : undefined,
          }}
          onClick={nextDisabled ? undefined : onNext}
        >
          <RightOutlined />
        </span>
      </Space>
    </div>
  )
}
