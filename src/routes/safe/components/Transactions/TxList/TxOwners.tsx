import { Text as AuraText, Icon } from '@aura/safe-react-components'
import { ReactElement } from 'react'
import styled from 'styled-components'

import Img from 'src/components/layout/Img'
import { ExpandedTxDetails, isModuleExecutionInfo } from 'src/logic/safe/store/models/types/gateway.d'
import TransactionListActive from './assets/transactions-list-active.svg'
import TransactionListInactive from './assets/transactions-list-inactive.svg'
import { AddressInfo } from './AddressInfo'
import { OwnerList, OwnerListItem } from './styled'
import { isCancelTxDetails } from './utils'
import PlusIcon from '../TxList/assets/plus-icon.svg'
import ExcuteIcon from '../TxList/assets/excute-icon.svg'
import DoneIcon from '../TxList/assets/done-icon.svg'
import CircleRedIcon from '../TxList/assets/rejected.svg'
import ExecuteIcon from '../TxList/assets/execute.svg'

const StyledImg = styled(Img)`
  background-color: transparent;
  border-radius: 50%;
`

const Text = styled(AuraText)`
  margin-bottom: 6px;
`

export const TxOwners = ({
  txDetails,
  isPending,
}: {
  txDetails: ExpandedTxDetails
  isPending: boolean
}): ReactElement | null => {
  const { txInfo, detailedExecutionInfo } = txDetails

  if (!detailedExecutionInfo || isModuleExecutionInfo(detailedExecutionInfo)) {
    return null
  }

  const confirmationsNeeded = detailedExecutionInfo.confirmationsRequired - detailedExecutionInfo.confirmations.length

  const CreationNode = isCancelTxDetails(txInfo) ? (
    <OwnerListItem>
      <span className="icon">
        <Icon size="sm" type="circleCross" color="error" />
      </span>
      <div className="legend">
        <Text color="error" size="lg" strong>
          On-chain rejection created
        </Text>
      </div>
    </OwnerListItem>
  ) : (
    <OwnerListItem>
      <span className="icon">
        <img src={PlusIcon} alt="Aura Safe" />
      </span>
      <div className="legend">
        <Text color="linkAura" size="lg" strong>
          Created
        </Text>
      </div>
    </OwnerListItem>
  )

  return (
    <OwnerList>
      {CreationNode}
      {detailedExecutionInfo.confirmations.map(({ signer }) => (
        <OwnerListItem key={signer.value}>
          <span className="icon">
            <img src={DoneIcon} alt="Aura Safe" />
          </span>
          <div className="legend">
            <Text color="linkAura" size="lg" strong>
              <span style={{ fontWeight: 700 }}>Confirmed</span>
            </Text>
            <AddressInfo
              address={signer.value}
              name={signer?.name || undefined}
              avatarUrl={signer?.logoUri || undefined}
              // shortenHash={4}
            />
          </div>
        </OwnerListItem>
      ))}
      {detailedExecutionInfo.rejectors?.map(({ value, name, logoUri }) => (
        <OwnerListItem key={value}>
          <span className="icon">
            <img src={CircleRedIcon} alt="Aura Safe" />
          </span>
          <div className="legend">
            <Text color="linkAura" size="lg" strong>
              <span style={{ fontWeight: 700 }}>Rejected</span>
            </Text>
            <AddressInfo address={value} name={name || undefined} avatarUrl={logoUri || undefined} />
          </div>
        </OwnerListItem>
      ))}
      {isPending || confirmationsNeeded <= 0 ? (
        <OwnerListItem>
          <span className="icon">
            {detailedExecutionInfo.executor ? (
              <img src={DoneIcon} alt="Aura Safe" />
            ) : (
              <StyledImg alt="" src={ExcuteIcon} />
            )}
          </span>
          <div className="legend">
            <Text color="linkAura" size="lg" strong>
              {detailedExecutionInfo.executor ? 'Executed' : isPending ? 'Executing' : 'Execute'}
            </Text>
            {detailedExecutionInfo.executor && (
              <AddressInfo
                address={detailedExecutionInfo.executor.value}
                name={detailedExecutionInfo.executor?.name || undefined}
                avatarUrl={detailedExecutionInfo.executor?.logoUri || undefined}
                // shortenHash={4}
              />
            )}
          </div>
        </OwnerListItem>
      ) : (
        <OwnerListItem>
          <span className="icon">
            <StyledImg alt="" src={ExecuteIcon} />
          </span>
          <div className="legend">
            <Text color="disableAura" size="lg" strong>
              <span style={{ fontWeight: 700 }}>
                Execute ({confirmationsNeeded} more {confirmationsNeeded === 1 ? 'confirmation' : 'confirmations'}{' '}
                needed)
              </span>
            </Text>
          </div>
        </OwnerListItem>
      )}
    </OwnerList>
  )
}
