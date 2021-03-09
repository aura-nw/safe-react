import { Loader, Title } from '@gnosis.pm/safe-react-components'
import React, { ReactElement } from 'react'

import Img from 'src/components/layout/Img'
import { ActionModal } from './ActionModal'
import NoTransactionsImage from './assets/no-transactions.svg'
import { usePagedQueuedTransactions } from './hooks/usePagedQueuedTransactions'
import { QueueTxList } from './QueueTxList'
import { Centered, NoTransactions } from './styled'
import { TxActionProvider } from './TxActionProvider'
import { TxsInfiniteScroll } from './TxsInfiniteScroll'
import { TxLocationContext } from './TxLocationProvider'

export const QueueTransactions = (): ReactElement => {
  const { count, isLoading, hasMore, next, transactions } = usePagedQueuedTransactions()

  // `loading` is, actually `!transactions`
  // added the `transaction` verification to prevent `Object is possibly 'undefined'` error
  if (isLoading || !transactions) {
    return (
      <Centered>
        <Loader size="md" />
      </Centered>
    )
  }

  if (count === 0) {
    return (
      <NoTransactions>
        <Img alt="No Transactions yet" src={NoTransactionsImage} />
        <Title size="xs">Queue transactions will appear here </Title>
      </NoTransactions>
    )
  }

  return (
    <TxActionProvider>
      <TxsInfiniteScroll next={next} hasMore={hasMore} isLoading={isLoading}>
        {/* Next list */}
        <TxLocationContext.Provider value={{ txLocation: 'queued.next' }}>
          {transactions.next.count !== 0 && <QueueTxList transactions={transactions.next.transactions} />}
        </TxLocationContext.Provider>

        {/* Queue list */}
        <TxLocationContext.Provider value={{ txLocation: 'queued.queued' }}>
          {transactions.queue.count !== 0 && <QueueTxList transactions={transactions.queue.transactions} />}
        </TxLocationContext.Provider>
      </TxsInfiniteScroll>
      <ActionModal />
    </TxActionProvider>
  )
}
