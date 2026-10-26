import PageContent from '@src/components/Page/PageContent'
import styles from './style.scss'
import ErrorCollect from './components/ErrorCollect'
import ErrorTable from './components/ErrorTable'

const Error = () => {
  return (
    <PageContent title="PV相关数据分析" className={styles.pvBox}>
      <ErrorCollect />
      <ErrorTable />
    </PageContent>
  )
}

export default Error
